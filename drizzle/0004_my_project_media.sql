-- Add content columns to my_projects
ALTER TABLE "my_projects" ADD COLUMN IF NOT EXISTS "content" text;
ALTER TABLE "my_projects" ADD COLUMN IF NOT EXISTS "content_json" jsonb;

-- Make description nullable (was NOT NULL)
ALTER TABLE "my_projects" ALTER COLUMN "description" DROP NOT NULL;

-- Create junction table for project gallery media
CREATE TABLE IF NOT EXISTS "my_project_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL REFERENCES "my_projects"("id") ON DELETE CASCADE,
	"media_id" uuid NOT NULL REFERENCES "media"("id") ON DELETE CASCADE,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "my_project_media_project_id_idx" ON "my_project_media" ("project_id");
CREATE INDEX IF NOT EXISTS "my_project_media_media_id_idx" ON "my_project_media" ("media_id");
