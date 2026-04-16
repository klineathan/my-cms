import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { myProjects, myProjectMedia, media } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	const [project] = await db.select().from(myProjects).where(eq(myProjects.id, params.id));

	if (!project) {
		throw error(404, 'Project not found');
	}

	const galleryMedia = await db
		.select({
			id: media.id,
			url: media.url,
			mediaType: media.mediaType,
			altText: media.altText,
			caption: media.caption
		})
		.from(myProjectMedia)
		.innerJoin(media, eq(myProjectMedia.mediaId, media.id))
		.where(eq(myProjectMedia.projectId, params.id))
		.orderBy(myProjectMedia.order);

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
		project,
		galleryMedia,
		images
	};
};
