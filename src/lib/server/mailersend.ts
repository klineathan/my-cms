import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import { env } from '$env/dynamic/private';

function getClient() {
	if (!env.MAILERSEND_API_KEY) throw new Error('MAILERSEND_API_KEY is not set');
	return new MailerSend({ apiKey: env.MAILERSEND_API_KEY });
}

function getSender() {
	if (!env.MAILERSEND_FROM_EMAIL) throw new Error('MAILERSEND_FROM_EMAIL is not set');
	return new Sender(env.MAILERSEND_FROM_EMAIL, env.MAILERSEND_FROM_NAME || 'Jon Kline');
}

export async function sendVerificationEmail(to: string, token: string) {
	const client = getClient();
	const siteUrl = env.SITE_URL || 'http://localhost:5173';
	const cmsUrl = env.CMS_URL || 'http://localhost:5174';
	const verifyUrl = `${cmsUrl}/api/v1/subscribe/verify?token=${token}`;

	const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Georgia, 'Times New Roman', serif; background-color: #893F45; color: #EDEAE0; padding: 40px 20px; margin: 0;">
  <div style="max-width: 500px; margin: 0 auto; text-align: center;">
    <h1 style="font-size: 24px; margin-bottom: 16px;">Confirm Your Subscription</h1>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Thanks for subscribing to Jon's Timeline. Click the button below to confirm your email and start receiving monthly updates.
    </p>
    <a href="${verifyUrl}" style="display: inline-block; padding: 12px 32px; background-color: #EDEAE0; color: #893F45; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
      Confirm Subscription
    </a>
    <p style="font-size: 13px; margin-top: 32px; opacity: 0.7;">
      If you didn't request this, you can safely ignore this email.
    </p>
  </div>
</body>
</html>`.trim();

	const text = `Confirm your subscription to Jon's Timeline by visiting: ${verifyUrl}`;

	const emailParams = new EmailParams()
		.setFrom(getSender())
		.setTo([new Recipient(to)])
		.setSubject("Confirm your subscription to Jon's Timeline")
		.setHtml(html)
		.setText(text);

	return client.email.send(emailParams);
}

export async function sendNewsletter(
	recipients: { email: string }[],
	subject: string,
	html: string
) {
	const client = getClient();
	const sender = getSender();

	const textContent = subject;

	// MailerSend bulk API: one EmailParams per recipient (allows individual unsubscribe links)
	const siteUrl = env.SITE_URL || 'http://localhost:5173';
	const cmsUrl = env.CMS_URL || 'http://localhost:5174';

	const BATCH_SIZE = 50;
	for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
		const batch = recipients.slice(i, i + BATCH_SIZE);

		const emailBatch = batch.map((r) => {
			const unsubscribeUrl = `${cmsUrl}/api/v1/subscribe/unsubscribe?email=${encodeURIComponent(r.email)}`;
			const personalizedHtml = html.replace('{{unsubscribe_url}}', unsubscribeUrl);

			return new EmailParams()
				.setFrom(sender)
				.setTo([new Recipient(r.email)])
				.setSubject(subject)
				.setHtml(personalizedHtml)
				.setText(textContent);
		});

		await client.email.sendBulk(emailBatch);
	}
}
