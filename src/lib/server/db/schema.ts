import {
	pgTable,
	text,
	timestamp,
	uuid,
	jsonb,
	varchar,
	boolean,
	integer,
	pgEnum,
	uniqueIndex
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const contentTypeEnum = pgEnum('content_type', ['post']);
export const mediaTypeEnum = pgEnum('media_type', ['image', 'video', 'audio']);
export const postStatusEnum = pgEnum('post_status', ['draft', 'published', 'archived']);
export const subscriberStatusEnum = pgEnum('subscriber_status', [
	'pending',
	'verified',
	'unsubscribed'
]);
export const newsletterSendStatusEnum = pgEnum('newsletter_send_status', [
	'sending',
	'sent',
	'failed'
]);

// Posts table - the main content type for timeline posts
export const posts = pgTable('posts', {
	id: uuid('id').primaryKey().defaultRandom(),
	title: varchar('title', { length: 255 }),
	content: text('content'), // Rich text content (HTML from editor)
	contentJson: jsonb('content_json'), // TipTap JSON for editing
	excerpt: text('excerpt'), // Optional excerpt/summary
	status: postStatusEnum('status').default('draft').notNull(),
	publishedAt: timestamp('published_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	authorId: uuid('author_id').notNull(), // References auth.users
	metadata: jsonb('metadata') // Flexible metadata field for future use
});

// Media table - stores references to uploaded files
export const media = pgTable('media', {
	id: uuid('id').primaryKey().defaultRandom(),
	filename: varchar('filename', { length: 255 }).notNull(),
	originalFilename: varchar('original_filename', { length: 255 }).notNull(),
	mimeType: varchar('mime_type', { length: 100 }).notNull(),
	size: integer('size').notNull(), // File size in bytes
	url: text('url').notNull(), // Public URL from Supabase Storage
	storagePath: text('storage_path').notNull(), // Path in Supabase Storage bucket
	mediaType: mediaTypeEnum('media_type').notNull(),
	width: integer('width'), // For images/videos
	height: integer('height'), // For images/videos
	duration: integer('duration'), // For audio/video (in seconds)
	altText: varchar('alt_text', { length: 255 }),
	caption: text('caption'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	uploadedBy: uuid('uploaded_by').notNull() // References auth.users
});

// Post-Media junction table for many-to-many relationship
export const postMedia = pgTable('post_media', {
	id: uuid('id').primaryKey().defaultRandom(),
	postId: uuid('post_id')
		.references(() => posts.id, { onDelete: 'cascade' })
		.notNull(),
	mediaId: uuid('media_id')
		.references(() => media.id, { onDelete: 'cascade' })
		.notNull(),
	order: integer('order').default(0).notNull(), // Order of media in post
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

// API Keys table for external API access
export const apiKeys = pgTable('api_keys', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: varchar('name', { length: 100 }).notNull(),
	keyHash: varchar('key_hash', { length: 255 }).notNull(), // Hashed API key
	keyPrefix: varchar('key_prefix', { length: 10 }).notNull(), // First few chars for identification
	isActive: boolean('is_active').default(true).notNull(),
	lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
	expiresAt: timestamp('expires_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	createdBy: uuid('created_by').notNull() // References auth.users
});

// Subscribers table for email newsletter signups
export const subscribers = pgTable(
	'subscribers',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		email: varchar('email', { length: 255 }).notNull(),
		status: subscriberStatusEnum('status').default('pending').notNull(),
		verificationToken: varchar('verification_token', { length: 255 }),
		tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
		verifiedAt: timestamp('verified_at', { withTimezone: true }),
		unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
		ipAddress: varchar('ip_address', { length: 45 }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [uniqueIndex('subscribers_email_idx').on(table.email)]
);

// Newsletter configuration (single-row table)
export const newsletterConfig = pgTable('newsletter_config', {
	id: uuid('id').primaryKey().defaultRandom(),
	sendDay: integer('send_day').default(28).notNull(),
	sendHour: integer('send_hour').default(12).notNull(),
	isActive: boolean('is_active').default(false).notNull(),
	testEmail: varchar('test_email', { length: 255 }),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// Newsletter send history
export const newsletterSends = pgTable('newsletter_sends', {
	id: uuid('id').primaryKey().defaultRandom(),
	monthYear: varchar('month_year', { length: 7 }).notNull(),
	subject: text('subject').notNull(),
	htmlContent: text('html_content').notNull(),
	recipientCount: integer('recipient_count').default(0).notNull(),
	status: newsletterSendStatusEnum('status').default('sending').notNull(),
	sentAt: timestamp('sent_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

// Relations
export const postsRelations = relations(posts, ({ many }) => ({
	postMedia: many(postMedia)
}));

export const mediaRelations = relations(media, ({ many }) => ({
	postMedia: many(postMedia)
}));

export const postMediaRelations = relations(postMedia, ({ one }) => ({
	post: one(posts, {
		fields: [postMedia.postId],
		references: [posts.id]
	}),
	media: one(media, {
		fields: [postMedia.mediaId],
		references: [media.id]
	})
}));

// Types
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
export type PostMedia = typeof postMedia.$inferSelect;
export type NewPostMedia = typeof postMedia.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type Subscriber = typeof subscribers.$inferSelect;
export type NewSubscriber = typeof subscribers.$inferInsert;
export type NewsletterConfig = typeof newsletterConfig.$inferSelect;
export type NewsletterSend = typeof newsletterSends.$inferSelect;
