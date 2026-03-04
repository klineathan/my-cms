import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { homepageProfiles, media } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const profiles = await db
		.select({
			id: homepageProfiles.id,
			quote: homepageProfiles.quote,
			order: homepageProfiles.order,
			createdAt: homepageProfiles.createdAt,
			updatedAt: homepageProfiles.updatedAt,
			mediaId: media.id,
			mediaUrl: media.url,
			mediaAltText: media.altText,
			originalFilename: media.originalFilename
		})
		.from(homepageProfiles)
		.innerJoin(media, eq(homepageProfiles.mediaId, media.id))
		.orderBy(asc(homepageProfiles.order));

	// Load images from media library for the "new profile" form
	const images = await db
		.select({
			id: media.id,
			url: media.url,
			originalFilename: media.originalFilename,
			altText: media.altText
		})
		.from(media)
		.where(eq(media.mediaType, 'image'))
		.orderBy(media.createdAt);

	return {
		profiles,
		images
	};
};
