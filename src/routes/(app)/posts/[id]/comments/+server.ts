import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { comments } from '$lib/server/db/schema';

export const POST: RequestHandler = async ({ request, params, locals }) => {
	if (!locals.session) {
		throw error(401, 'Unauthorized');
	}

	const body = await request.json();
	const { parentId, content } = body;

	if (!content?.trim()) {
		throw error(400, 'Reply content is required');
	}

	const [newComment] = await db
		.insert(comments)
		.values({
			postId: params.id,
			parentId: parentId || null,
			authorName: 'Jon',
			authorEmail: locals.session.user.email ?? 'admin@site.com',
			content: content.trim(),
			isOwner: true
		})
		.returning();

	return json({ data: newComment }, { status: 201 });
};
