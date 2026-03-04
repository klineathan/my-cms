import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { subscribers } from '$lib/server/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { sendVerificationEmail } from '$lib/server/mailersend';

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_ATTEMPTS_PER_IP = 3;
const MIN_SUBMIT_TIME_MS = 3000; // 3 seconds

export const POST: RequestHandler = async ({ request }) => {
	const genericResponse = json({
		message: 'If this email is valid, you will receive a confirmation link shortly.'
	});

	try {
		const body = await request.json();
		const { email, honeypot, timestamp } = body;

		// Honeypot check — a hidden field that bots tend to fill
		if (honeypot) {
			return genericResponse;
		}

		// Timing check — reject submissions faster than a human could fill
		if (timestamp) {
			const elapsed = Date.now() - Number(timestamp);
			if (elapsed < MIN_SUBMIT_TIME_MS) {
				return genericResponse;
			}
		}

		// Validate email
		if (!email || typeof email !== 'string' || !email.includes('@') || email.length > 255) {
			return json({ message: 'Please provide a valid email address.' }, { status: 400 });
		}

		const normalizedEmail = email.trim().toLowerCase();

		// Rate limit by IP
		const ip =
			request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
			request.headers.get('x-real-ip') ||
			'unknown';

		const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
		const recentAttempts = await db
			.select({ id: subscribers.id })
			.from(subscribers)
			.where(and(eq(subscribers.ipAddress, ip), gte(subscribers.createdAt, windowStart)));

		if (recentAttempts.length >= MAX_ATTEMPTS_PER_IP) {
			return genericResponse;
		}

		// Check if subscriber already exists
		const [existing] = await db
			.select()
			.from(subscribers)
			.where(eq(subscribers.email, normalizedEmail));

		if (existing) {
			if (existing.status === 'verified') {
				return genericResponse;
			}

			if (existing.status === 'unsubscribed') {
				// Re-subscribe: generate a new token and send verification
				const token = crypto.randomUUID();
				const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

				await db
					.update(subscribers)
					.set({
						status: 'pending',
						verificationToken: token,
						tokenExpiresAt: tokenExpires,
						unsubscribedAt: null,
						ipAddress: ip,
						updatedAt: new Date()
					})
					.where(eq(subscribers.id, existing.id));

				await sendVerificationEmail(normalizedEmail, token);
				return genericResponse;
			}

			// Status is 'pending' — resend verification if token expired
			if (existing.tokenExpiresAt && new Date(existing.tokenExpiresAt) < new Date()) {
				const token = crypto.randomUUID();
				const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

				await db
					.update(subscribers)
					.set({
						verificationToken: token,
						tokenExpiresAt: tokenExpires,
						ipAddress: ip,
						updatedAt: new Date()
					})
					.where(eq(subscribers.id, existing.id));

				await sendVerificationEmail(normalizedEmail, token);
			}

			return genericResponse;
		}

		// New subscriber
		const token = crypto.randomUUID();
		const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

		await db.insert(subscribers).values({
			email: normalizedEmail,
			status: 'pending',
			verificationToken: token,
			tokenExpiresAt: tokenExpires,
			ipAddress: ip
		});

		await sendVerificationEmail(normalizedEmail, token);

		return genericResponse;
	} catch (err) {
		console.error('Subscribe error:', err);
		return genericResponse;
	}
};
