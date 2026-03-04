import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { posts, postMedia, media, comments } from '$lib/server/db/schema';
import { eq, desc, count, asc } from 'drizzle-orm';
import { validateApiKey } from '$lib/server/api-auth';

export const GET: RequestHandler = async ({ request, url }) => {
	// Validate API key
	const isValid = await validateApiKey(request);
	if (!isValid) {
		throw error(401, 'Invalid or missing API key');
	}

	// Pagination params
	const pageParam = url.searchParams.get('page');
	const limitParam = url.searchParams.get('limit');
	const page = pageParam ? parseInt(pageParam, 10) : 1;
	const limit = Math.min(limitParam ? parseInt(limitParam, 10) : 10, 100);
	const offset = (page - 1) * limit;

	// Only return published posts
	const postsData = await db
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
		.where(eq(posts.status, 'published'))
		.orderBy(desc(posts.createdAt))
		.limit(limit)
		.offset(offset);

	// Get media and comments for each post
	const postsWithMedia = await Promise.all(
		postsData.map(async (post) => {
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
					.where(eq(postMedia.postId, post.id))
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
					.where(eq(comments.postId, post.id))
					.orderBy(asc(comments.createdAt))
			]);

			return {
				...post,
				media: mediaItems,
				comments: postComments
			};
		})
	);

	const [countResult] = await db
		.select({ count: count() })
		.from(posts)
		.where(eq(posts.status, 'published'));

	const total = countResult?.count ?? 0;

	return json({
		data: postsWithMedia,
		pagination: {
			page,
			limit,
			hasMore: offset + postsData.length < total
		}
	});
};

