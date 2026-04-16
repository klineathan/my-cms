import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { myProjects, myProjectMedia, media } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import { validateApiKey } from '$lib/server/api-auth';

export const GET: RequestHandler = async ({ request, params }) => {
	const isValid = await validateApiKey(request);
	if (!isValid) {
		throw error(401, 'Invalid or missing API key');
	}

	const [project] = await db
		.select({
			id: myProjects.id,
			title: myProjects.title,
			description: myProjects.description,
			content: myProjects.content,
			url: myProjects.url,
			order: myProjects.order,
			isVisible: myProjects.isVisible,
			createdAt: myProjects.createdAt,
			updatedAt: myProjects.updatedAt,
			thumbnailUrl: media.url,
			thumbnailAlt: media.altText
		})
		.from(myProjects)
		.innerJoin(media, eq(myProjects.mediaId, media.id))
		.where(eq(myProjects.id, params.id));

	if (!project || !project.isVisible) {
		throw error(404, 'Project not found');
	}

	const mediaItems = await db
		.select({
			id: media.id,
			url: media.url,
			mediaType: media.mediaType,
			altText: media.altText,
			caption: media.caption,
			width: media.width,
			height: media.height
		})
		.from(myProjectMedia)
		.innerJoin(media, eq(myProjectMedia.mediaId, media.id))
		.where(eq(myProjectMedia.projectId, params.id))
		.orderBy(asc(myProjectMedia.order));

	return json({
		data: {
			id: project.id,
			title: project.title,
			description: project.description,
			content: project.content,
			url: project.url,
			createdAt: project.createdAt,
			updatedAt: project.updatedAt,
			thumbnailUrl: project.thumbnailUrl,
			thumbnailAlt: project.thumbnailAlt ?? 'Project thumbnail',
			media: mediaItems
		}
	});
};
