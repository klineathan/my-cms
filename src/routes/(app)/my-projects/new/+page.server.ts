import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { media } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
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

	return { images };
};
