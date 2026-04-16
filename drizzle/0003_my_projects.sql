CREATE TABLE IF NOT EXISTS "my_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"url" text,
	"media_id" uuid NOT NULL REFERENCES "media"("id") ON DELETE CASCADE,
	"order" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "my_projects_media_id_idx" ON "my_projects" ("media_id");
CREATE INDEX IF NOT EXISTS "my_projects_order_idx" ON "my_projects" ("order");
