import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { myProjects, media } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import { validateApiKey } from '$lib/server/api-auth';

export const GET: RequestHandler = async ({ request }) => {
	const isValid = await validateApiKey(request);
	if (!isValid) {
		throw error(401, 'Invalid or missing API key');
	}

	const projects = await db
		.select({
			id: myProjects.id,
			title: myProjects.title,
			description: myProjects.description,
			content: myProjects.content,
			url: myProjects.url,
			order: myProjects.order,
			imageUrl: media.url,
			altText: media.altText
		})
		.from(myProjects)
		.innerJoin(media, eq(myProjects.mediaId, media.id))
		.where(eq(myProjects.isVisible, true))
		.orderBy(asc(myProjects.order));

	return json({
		data: projects.map((p) => ({
			id: p.id,
			title: p.title,
			description: p.description,
			content: p.content,
			url: p.url,
			order: p.order,
			imageUrl: p.imageUrl,
			altText: p.altText ?? 'Project thumbnail'
		}))
	});
};
