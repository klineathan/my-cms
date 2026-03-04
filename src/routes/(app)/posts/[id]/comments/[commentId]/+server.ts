import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { comments } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.session) {
		throw error(401, 'Unauthorized');
	}

	const [deleted] = await db
		.delete(comments)
		.where(and(eq(comments.id, params.commentId), eq(comments.postId, params.id)))
		.returning();

	if (!deleted) {
		throw error(404, 'Comment not found');
	}

	return json({ success: true });
};
