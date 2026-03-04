import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { homepageProfiles } from '$lib/server/db/schema';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.session) {
		throw error(401, 'Unauthorized');
	}

	const body = await request.json();
	const { mediaId, quote, order } = body;

	if (!mediaId || quote == null || quote === '') {
		throw error(400, 'Media and quote are required');
	}

	const [inserted] = await db
		.insert(homepageProfiles)
		.values({
			mediaId,
			quote: String(quote).trim(),
			order: typeof order === 'number' ? order : 0
		})
		.returning({ id: homepageProfiles.id });

	return json({ id: inserted!.id });
};
