import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { myProjects, myProjectMedia } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.session) {
		throw error(401, 'Unauthorized');
	}

	const body = await request.json();
	const { mediaId, title, description, content, contentJson, url, order, isVisible, mediaIds } =
		body;

	if (!mediaId || !title?.trim()) {
		throw error(400, 'Thumbnail and title are required');
	}

	const [updated] = await db
		.update(myProjects)
		.set({
			mediaId,
			title: String(title).trim(),
			description: description?.trim() || null,
			content: content || null,
			contentJson: contentJson || null,
			url: url?.trim() || null,
			order: typeof order === 'number' ? order : 0,
			isVisible: typeof isVisible === 'boolean' ? isVisible : true,
			updatedAt: new Date()
		})
		.where(eq(myProjects.id, params.id))
		.returning({ id: myProjects.id });

	if (!updated) {
		throw error(404, 'Project not found');
	}

	if (mediaIds !== undefined) {
		await db.delete(myProjectMedia).where(eq(myProjectMedia.projectId, params.id));

		if (mediaIds.length > 0) {
			await db.insert(myProjectMedia).values(
				mediaIds.map((id: string, index: number) => ({
					projectId: params.id,
					mediaId: id,
					order: index
				}))
			);
		}
	}

	return json({ id: updated.id });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.session) {
		throw error(401, 'Unauthorized');
	}

	await db.delete(myProjects).where(eq(myProjects.id, params.id));

	return json({ success: true });
};
