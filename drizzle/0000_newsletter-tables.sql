CREATE TYPE "public"."newsletter_send_status" AS ENUM('sending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."subscriber_status" AS ENUM('pending', 'verified', 'unsubscribed');--> statement-breakpoint
CREATE TABLE "newsletter_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"send_day" integer DEFAULT 28 NOT NULL,
	"send_hour" integer DEFAULT 12 NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"test_email" varchar(255),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_sends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"month_year" varchar(7) NOT NULL,
	"subject" text NOT NULL,
	"html_content" text NOT NULL,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"status" "newsletter_send_status" DEFAULT 'sending' NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"status" "subscriber_status" DEFAULT 'pending' NOT NULL,
	"verification_token" varchar(255),
	"token_expires_at" timestamp with time zone,
	"verified_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"ip_address" varchar(45),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "subscribers_email_idx" ON "subscribers" USING btree ("email");
