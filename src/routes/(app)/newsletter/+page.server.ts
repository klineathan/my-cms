import { db } from '$lib/server/db';
import { subscribers, newsletterConfig, newsletterSends } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export async function load() {
	const allSubscribers = await db
		.select({
			id: subscribers.id,
			email: subscribers.email,
			status: subscribers.status,
			verifiedAt: subscribers.verifiedAt,
			createdAt: subscribers.createdAt
		})
		.from(subscribers)
		.orderBy(desc(subscribers.createdAt));

	const [config] = await db.select().from(newsletterConfig).limit(1);

	const sends = await db
		.select({
			id: newsletterSends.id,
			monthYear: newsletterSends.monthYear,
			subject: newsletterSends.subject,
			recipientCount: newsletterSends.recipientCount,
			status: newsletterSends.status,
			sentAt: newsletterSends.sentAt,
			createdAt: newsletterSends.createdAt
		})
		.from(newsletterSends)
		.orderBy(desc(newsletterSends.createdAt));

	const stats = {
		total: allSubscribers.length,
		verified: allSubscribers.filter((s) => s.status === 'verified').length,
		pending: allSubscribers.filter((s) => s.status === 'pending').length,
		unsubscribed: allSubscribers.filter((s) => s.status === 'unsubscribed').length
	};

	return {
		subscribers: allSubscribers,
		config: config || { sendDay: 28, sendHour: 12, isActive: false, testEmail: '' },
		sends,
		stats
	};
}

export const actions: Actions = {
	updateConfig: async ({ request }) => {
		const formData = await request.formData();
		const sendDay = parseInt(formData.get('sendDay')?.toString() || '28', 10);
		const sendHour = parseInt(formData.get('sendHour')?.toString() || '12', 10);
		const isActive = formData.get('isActive') === 'on';
		const testEmail = formData.get('testEmail')?.toString() || null;

		if (sendDay < 1 || sendDay > 28) {
			return fail(400, { configError: 'Send day must be between 1 and 28.' });
		}
		if (sendHour < 0 || sendHour > 23) {
			return fail(400, { configError: 'Send hour must be between 0 and 23.' });
		}

		const [existing] = await db.select().from(newsletterConfig).limit(1);

		if (existing) {
			await db
				.update(newsletterConfig)
				.set({
					sendDay,
					sendHour,
					isActive,
					testEmail,
					updatedAt: new Date()
				})
				.where(eq(newsletterConfig.id, existing.id));
		} else {
			await db.insert(newsletterConfig).values({
				sendDay,
				sendHour,
				isActive,
				testEmail
			});
		}

		return { configSaved: true };
	}
};
