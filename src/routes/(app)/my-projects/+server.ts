import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { myProjects, myProjectMedia } from '$lib/server/db/schema';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.session) {
		throw error(401, 'Unauthorized');
	}

	const body = await request.json();
	const { mediaId, title, description, content, contentJson, url, order, isVisible, mediaIds } =
		body;

	if (!mediaId || !title?.trim()) {
		throw error(400, 'Thumbnail and title are required');
	}

	const [inserted] = await db
		.insert(myProjects)
		.values({
			mediaId,
			title: String(title).trim(),
			description: description?.trim() || null,
			content: content || null,
			contentJson: contentJson || null,
			url: url?.trim() || null,
			order: typeof order === 'number' ? order : 0,
			isVisible: typeof isVisible === 'boolean' ? isVisible : true
		})
		.returning({ id: myProjects.id });

	if (mediaIds && mediaIds.length > 0) {
		await db.insert(myProjectMedia).values(
			mediaIds.map((id: string, index: number) => ({
				projectId: inserted!.id,
				mediaId: id,
				order: index
			}))
		);
	}

	return json({ id: inserted!.id });
};
