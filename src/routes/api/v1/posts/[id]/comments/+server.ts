import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { comments, posts } from '$lib/server/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { validateApiKey } from '$lib/server/api-auth';

export const GET: RequestHandler = async ({ request, params }) => {
	const isValid = await validateApiKey(request);
	if (!isValid) {
		throw error(401, 'Invalid or missing API key');
	}

	const postComments = await db
		.select({
			id: comments.id,
			postId: comments.postId,
			parentId: comments.parentId,
			authorName: comments.authorName,
			content: comments.content,
			isOwner: comments.isOwner,
			createdAt: comments.createdAt
		})
		.from(comments)
		.where(eq(comments.postId, params.id))
		.orderBy(asc(comments.createdAt));

	return json({ data: postComments });
};

export const POST: RequestHandler = async ({ request, params }) => {
	const isValid = await validateApiKey(request);
	if (!isValid) {
		throw error(401, 'Invalid or missing API key');
	}

	const body = await request.json();
	const { authorName, authorEmail, content, parentId } = body;

	if (!authorName?.trim() || !authorEmail?.trim() || !content?.trim()) {
		throw error(400, 'Name, email, and comment are required');
	}

	const [post] = await db
		.select({ id: posts.id })
		.from(posts)
		.where(and(eq(posts.id, params.id), eq(posts.status, 'published')));

	if (!post) {
		throw error(404, 'Post not found');
	}

	if (parentId) {
		const [parent] = await db
			.select({ id: comments.id })
			.from(comments)
			.where(and(eq(comments.id, parentId), eq(comments.postId, params.id)));

		if (!parent) {
			throw error(400, 'Parent comment not found');
		}
	}

	const [newComment] = await db
		.insert(comments)
		.values({
			postId: params.id,
			parentId: parentId || null,
			authorName: authorName.trim(),
			authorEmail: authorEmail.trim(),
			content: content.trim(),
			isOwner: false
		})
		.returning();

	return json({ data: newComment }, { status: 201 });
};
