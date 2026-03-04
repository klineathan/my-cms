CREATE TABLE IF NOT EXISTS "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
	"parent_id" uuid REFERENCES "comments"("id") ON DELETE CASCADE,
	"author_name" varchar(255) NOT NULL,
	"author_email" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"is_owner" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "comments_post_id_idx" ON "comments" ("post_id");
CREATE INDEX IF NOT EXISTS "comments_parent_id_idx" ON "comments" ("parent_id");
