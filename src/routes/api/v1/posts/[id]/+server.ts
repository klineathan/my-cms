import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { posts, postMedia, media, comments } from '$lib/server/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { validateApiKey } from '$lib/server/api-auth';

export const GET: RequestHandler = async ({ request, params }) => {
	// Validate API key
	const isValid = await validateApiKey(request);
	if (!isValid) {
		throw error(401, 'Invalid or missing API key');
	}

	// Get post (only published)
	const [post] = await db
		.select({
			id: posts.id,
			title: posts.title,
			content: posts.content,
			excerpt: posts.excerpt,
			publishedAt: posts.publishedAt,
			createdAt: posts.createdAt,
			updatedAt: posts.updatedAt
		})
		.from(posts)
		.where(and(eq(posts.id, params.id), eq(posts.status, 'published')));

	if (!post) {
		throw error(404, 'Post not found');
	}

	const [mediaItems, postComments] = await Promise.all([
		db
			.select({
				id: media.id,
				url: media.url,
				mediaType: media.mediaType,
				altText: media.altText,
				caption: media.caption,
				width: media.width,
				height: media.height
			})
			.from(postMedia)
			.innerJoin(media, eq(postMedia.mediaId, media.id))
			.where(eq(postMedia.postId, params.id))
			.orderBy(postMedia.order),
		db
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
			.orderBy(asc(comments.createdAt))
	]);

	return json({
		data: {
			...post,
			media: mediaItems,
			comments: postComments
		}
	});
};

