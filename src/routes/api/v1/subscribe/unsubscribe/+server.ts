import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { subscribers } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
	const email = url.searchParams.get('email');

	if (!email) {
		return new Response(unsubscribePage('Missing email parameter.', false), {
			headers: { 'Content-Type': 'text/html' }
		});
	}

	const normalizedEmail = email.trim().toLowerCase();

	const [subscriber] = await db
		.select()
		.from(subscribers)
		.where(eq(subscribers.email, normalizedEmail));

	if (!subscriber || subscriber.status === 'unsubscribed') {
		return new Response(unsubscribePage('You have been unsubscribed.', true), {
			headers: { 'Content-Type': 'text/html' }
		});
	}

	await db
		.update(subscribers)
		.set({
			status: 'unsubscribed',
			unsubscribedAt: new Date(),
			updatedAt: new Date()
		})
		.where(eq(subscribers.id, subscriber.id));

	return new Response(unsubscribePage('You have been unsubscribed.', true), {
		headers: { 'Content-Type': 'text/html' }
	});
};

function unsubscribePage(message: string, success: boolean) {
	return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Unsubscribe</title>
</head>
<body style="font-family: Georgia, 'Times New Roman', serif; background-color: #893F45; color: #EDEAE0; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px;">
  <div style="text-align: center; max-width: 400px;">
    <h1 style="font-size: 24px; margin-bottom: 16px;">${success ? 'Unsubscribed' : 'Error'}</h1>
    <p style="font-size: 16px; line-height: 1.6;">${message}</p>
    <p style="font-size: 14px; margin-top: 24px; opacity: 0.7;">You will no longer receive monthly updates.</p>
  </div>
</body>
</html>`;
}
