import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { subscribers } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url }) => {
	const token = url.searchParams.get('token');

	if (!token) {
		throw error(400, 'Missing verification token');
	}

	const [subscriber] = await db
		.select()
		.from(subscribers)
		.where(eq(subscribers.verificationToken, token));

	if (!subscriber) {
		throw error(400, 'Invalid or expired verification link');
	}

	if (subscriber.tokenExpiresAt && new Date(subscriber.tokenExpiresAt) < new Date()) {
		throw error(400, 'This verification link has expired. Please subscribe again.');
	}

	if (subscriber.status === 'verified') {
		const siteUrl = env.SITE_URL || 'http://localhost:5173';
		throw redirect(303, `${siteUrl}/timeline?subscribed=true`);
	}

	await db
		.update(subscribers)
		.set({
			status: 'verified',
			verifiedAt: new Date(),
			verificationToken: null,
			tokenExpiresAt: null,
			updatedAt: new Date()
		})
		.where(eq(subscribers.id, subscriber.id));

	const siteUrl = env.SITE_URL || 'http://localhost:5173';
	throw redirect(303, `${siteUrl}/timeline?subscribed=true`);
};
