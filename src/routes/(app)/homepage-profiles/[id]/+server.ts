import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { homepageProfiles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.session) {
		throw error(401, 'Unauthorized');
	}

	const body = await request.json();
	const { mediaId, quote, order } = body;

	if (!mediaId || quote == null || quote === '') {
		throw error(400, 'Media and quote are required');
	}

	const [updated] = await db
		.update(homepageProfiles)
		.set({
			mediaId,
			quote: String(quote).trim(),
			order: typeof order === 'number' ? order : 0,
			updatedAt: new Date()
		})
		.where(eq(homepageProfiles.id, params.id))
		.returning({ id: homepageProfiles.id });

	if (!updated) {
		throw error(404, 'Profile not found');
	}

	return json({ id: updated.id });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.session) {
		throw error(401, 'Unauthorized');
	}

	await db.delete(homepageProfiles).where(eq(homepageProfiles.id, params.id));

	return json({ success: true });
};
