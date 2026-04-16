import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { myProjects, media } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const projects = await db
		.select({
			id: myProjects.id,
			title: myProjects.title,
			order: myProjects.order,
			isVisible: myProjects.isVisible,
			createdAt: myProjects.createdAt,
			updatedAt: myProjects.updatedAt,
			mediaUrl: media.url,
			mediaAltText: media.altText
		})
		.from(myProjects)
		.innerJoin(media, eq(myProjects.mediaId, media.id))
		.orderBy(asc(myProjects.order));

	return { projects };
};
