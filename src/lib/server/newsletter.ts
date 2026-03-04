import { db } from '$lib/server/db';
import {
	posts,
	postMedia,
	media,
	subscribers,
	newsletterSends,
	newsletterConfig
} from '$lib/server/db/schema';
import { eq, and, gte, lt, desc } from 'drizzle-orm';
import { sendNewsletter as sendNewsletterEmail } from '$lib/server/mailersend';
import { env } from '$env/dynamic/private';

export async function generateNewsletterHtml(month: number, year: number) {
	const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
	const startOfNextMonth = new Date(Date.UTC(year, month, 1));

	const monthPosts = await db
		.select({
			id: posts.id,
			title: posts.title,
			content: posts.content,
			excerpt: posts.excerpt,
			createdAt: posts.createdAt
		})
		.from(posts)
		.where(
			and(
				eq(posts.status, 'published'),
				gte(posts.createdAt, startOfMonth),
				lt(posts.createdAt, startOfNextMonth)
			)
		)
		.orderBy(desc(posts.createdAt));

	// Fetch media for each post
	const postsWithMedia = await Promise.all(
		monthPosts.map(async (post) => {
			const mediaItems = await db
				.select({
					url: media.url,
					mediaType: media.mediaType,
					altText: media.altText
				})
				.from(postMedia)
				.innerJoin(media, eq(postMedia.mediaId, media.id))
				.where(eq(postMedia.postId, post.id))
				.orderBy(postMedia.order);

			return { ...post, media: mediaItems };
		})
	);

	const siteUrl = env.SITE_URL || 'http://localhost:5173';
	const monthName = startOfMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

	const postListHtml = postsWithMedia
		.map((post) => {
			const date = new Date(post.createdAt).toLocaleDateString('en-US', {
				month: 'long',
				day: 'numeric',
				year: 'numeric'
			});

			const firstImage = post.media.find((m) => m.mediaType === 'image');
			const imageHtml = firstImage
				? `<img src="${firstImage.url}" alt="${firstImage.altText || post.title || ''}" style="width:100%;max-width:500px;border-radius:6px;margin:12px 0;" />`
				: '';

			const excerpt =
				post.excerpt ||
				(post.content
					? post.content.replace(/<[^>]+>/g, '').substring(0, 200) + '...'
					: '');

			return `
        <tr>
          <td style="padding: 20px 0; border-bottom: 1px solid rgba(137,63,69,0.2);">
            <p style="font-size: 12px; color: #999; margin: 0 0 4px;">${date}</p>
            <h2 style="font-size: 20px; margin: 0 0 8px; color: #893F45;">
              <a href="${siteUrl}/timeline/${post.id}" style="color: #893F45; text-decoration: none;">${post.title || 'Untitled'}</a>
            </h2>
            ${imageHtml}
            <p style="font-size: 15px; line-height: 1.6; color: #333; margin: 8px 0 0;">${excerpt}</p>
          </td>
        </tr>`;
		})
		.join('');

	const subject = `Jon's Timeline — ${monthName}`;

	const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Georgia, 'Times New Roman', serif; background-color: #f5f3ee; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f3ee;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px;">
          <!-- Header -->
          <tr>
            <td style="text-align: center; padding-bottom: 24px; border-bottom: 2px solid #893F45;">
              <h1 style="font-size: 28px; color: #893F45; margin: 0 0 4px;">The Timeline</h1>
              <p style="font-size: 14px; color: #666; margin: 0; font-style: italic;">${monthName} Update</p>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding: 20px 0;">
              <p style="font-size: 15px; line-height: 1.6; color: #333;">
                ${postsWithMedia.length > 0 ? `Here's what was new on the Timeline this month — ${postsWithMedia.length} post${postsWithMedia.length === 1 ? '' : 's'} from ${monthName}.` : 'Nothing new this month, but stay tuned!'}
              </p>
            </td>
          </tr>

          <!-- Posts -->
          ${postListHtml}

          <!-- CTA -->
          <tr>
            <td style="padding: 24px 0; text-align: center;">
              <a href="${siteUrl}/timeline" style="display: inline-block; padding: 12px 28px; background-color: #893F45; color: #EDEAE0; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: bold;">
                View the Full Timeline
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 0 0; border-top: 1px solid #ddd; text-align: center;">
              <p style="font-size: 12px; color: #999; margin: 0;">
                You're receiving this because you subscribed to Jon's Timeline.
              </p>
              <p style="font-size: 12px; color: #999; margin: 8px 0 0;">
                <a href="{{unsubscribe_url}}" style="color: #893F45;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

	return { subject, html, postCount: postsWithMedia.length };
}

export async function sendMonthlyNewsletter(options?: { testEmail?: string }) {
	const now = new Date();
	const month = now.getUTCMonth() + 1;
	const year = now.getUTCFullYear();
	const monthYear = `${year}-${String(month).padStart(2, '0')}`;

	const { subject, html, postCount } = await generateNewsletterHtml(month, year);

	if (options?.testEmail) {
		await sendNewsletterEmail([{ email: options.testEmail }], subject, html);
		return { sent: true, recipientCount: 1, isTest: true, postCount };
	}

	// Check if already sent this month
	const [existingSend] = await db
		.select()
		.from(newsletterSends)
		.where(
			and(eq(newsletterSends.monthYear, monthYear), eq(newsletterSends.status, 'sent'))
		);

	if (existingSend) {
		return { sent: false, reason: 'Newsletter already sent for this month', postCount };
	}

	// Get all verified subscribers
	const verifiedSubscribers = await db
		.select({ email: subscribers.email })
		.from(subscribers)
		.where(eq(subscribers.status, 'verified'));

	if (verifiedSubscribers.length === 0) {
		return { sent: false, reason: 'No verified subscribers', postCount };
	}

	// Create a send record
	const [sendRecord] = await db
		.insert(newsletterSends)
		.values({
			monthYear,
			subject,
			htmlContent: html,
			recipientCount: verifiedSubscribers.length,
			status: 'sending'
		})
		.returning();

	try {
		await sendNewsletterEmail(verifiedSubscribers, subject, html);

		await db
			.update(newsletterSends)
			.set({
				status: 'sent',
				sentAt: new Date()
			})
			.where(eq(newsletterSends.id, sendRecord.id));

		return {
			sent: true,
			recipientCount: verifiedSubscribers.length,
			isTest: false,
			postCount
		};
	} catch (err) {
		await db
			.update(newsletterSends)
			.set({ status: 'failed' })
			.where(eq(newsletterSends.id, sendRecord.id));

		throw err;
	}
}

export async function shouldSendToday(): Promise<boolean> {
	const [config] = await db.select().from(newsletterConfig).limit(1);

	if (!config || !config.isActive) return false;

	const now = new Date();
	const currentDay = now.getUTCDate();
	const currentHour = now.getUTCHours();

	if (currentDay !== config.sendDay || currentHour !== config.sendHour) return false;

	// Check if already sent this month
	const monthYear = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
	const [existingSend] = await db
		.select()
		.from(newsletterSends)
		.where(
			and(eq(newsletterSends.monthYear, monthYear), eq(newsletterSends.status, 'sent'))
		);

	return !existingSend;
}
