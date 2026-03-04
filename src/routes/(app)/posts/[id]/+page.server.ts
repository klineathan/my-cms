import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { posts, postMedia, media, comments } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	const [post] = await db.select().from(posts).where(eq(posts.id, params.id));

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
				caption: media.caption
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
				authorEmail: comments.authorEmail,
				content: comments.content,
				isOwner: comments.isOwner,
				createdAt: comments.createdAt
			})
			.from(comments)
			.where(eq(comments.postId, params.id))
			.orderBy(asc(comments.createdAt))
	]);

	return {
		post,
		media: mediaItems,
		comments: postComments
	};
};

