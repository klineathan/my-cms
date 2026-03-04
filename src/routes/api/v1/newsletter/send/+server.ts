import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { sendMonthlyNewsletter, shouldSendToday } from '$lib/server/newsletter';
import { db } from '$lib/server/db';
import { newsletterConfig } from '$lib/server/db/schema';

async function isAuthorized(event: { locals: App.Locals; request: Request }): Promise<boolean> {
	// Session auth (CMS admin)
	if (event.locals.session) return true;

	// Cron key auth (scheduled function)
	const authHeader = event.request.headers.get('Authorization');
	if (authHeader?.startsWith('Bearer ') && env.NEWSLETTER_CRON_KEY) {
		return authHeader.slice(7) === env.NEWSLETTER_CRON_KEY;
	}

	return false;
}

export const POST: RequestHandler = async (event) => {
	if (!(await isAuthorized(event))) {
		throw error(401, 'Unauthorized');
	}

	const isTest = event.url.searchParams.get('test') === 'true';
	const isCron = event.url.searchParams.get('cron') === 'true';

	try {
		if (isCron) {
			const shouldSend = await shouldSendToday();
			if (!shouldSend) {
				return json({ sent: false, reason: 'Not scheduled for today' });
			}
		}

		if (isTest) {
			const [config] = await db.select().from(newsletterConfig).limit(1);
			const testEmail = config?.testEmail;

			if (!testEmail) {
				throw error(400, 'No test email configured. Set one in Newsletter settings.');
			}

			const result = await sendMonthlyNewsletter({ testEmail });
			return json(result);
		}

		const result = await sendMonthlyNewsletter();
		return json(result);
	} catch (err) {
		console.error('Newsletter send error:', err);
		throw error(500, 'Failed to send newsletter');
	}
};
