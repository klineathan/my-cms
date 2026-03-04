import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { homepageProfiles, media } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import { validateApiKey } from '$lib/server/api-auth';

export const GET: RequestHandler = async ({ request }) => {
	const isValid = await validateApiKey(request);
	if (!isValid) {
		throw error(401, 'Invalid or missing API key');
	}

	const profiles = await db
		.select({
			id: homepageProfiles.id,
			quote: homepageProfiles.quote,
			order: homepageProfiles.order,
			url: media.url,
			altText: media.altText
		})
		.from(homepageProfiles)
		.innerJoin(media, eq(homepageProfiles.mediaId, media.id))
		.orderBy(asc(homepageProfiles.order));

	return json({
		data: profiles.map((p) => ({
			id: p.id,
			quote: p.quote,
			order: p.order,
			imageUrl: p.url,
			altText: p.altText ?? 'Profile'
		}))
	});
};
