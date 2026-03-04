CREATE TABLE IF NOT EXISTS "homepage_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_id" uuid NOT NULL REFERENCES "media"("id") ON DELETE CASCADE,
	"quote" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "homepage_profiles_media_id_idx" ON "homepage_profiles" ("media_id");
CREATE INDEX IF NOT EXISTS "homepage_profiles_order_idx" ON "homepage_profiles" ("order");
