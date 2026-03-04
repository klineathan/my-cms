import type { Config, Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
	const siteUrl = process.env.URL || process.env.DEPLOY_URL;
	const cronKey = process.env.NEWSLETTER_CRON_KEY;

	if (!siteUrl || !cronKey) {
		console.error('Missing URL or NEWSLETTER_CRON_KEY environment variables');
		return new Response('Configuration error', { status: 500 });
	}

	try {
		const response = await fetch(`${siteUrl}/api/v1/newsletter/send?cron=true`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${cronKey}`,
				'Content-Type': 'application/json'
			}
		});

		const result = await response.json();
		console.log('Newsletter cron result:', result);

		return new Response(JSON.stringify(result), {
			status: response.status,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (err) {
		console.error('Newsletter cron error:', err);
		return new Response('Internal error', { status: 500 });
	}
};

export const config: Config = {
	schedule: '0 * * * *'
};
