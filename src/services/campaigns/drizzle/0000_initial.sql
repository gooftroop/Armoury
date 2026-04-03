CREATE TABLE IF NOT EXISTS "campaigns" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"organizer_id" text NOT NULL,
	"narrative" text,
	"campaign_data" text,
	"start_date" text NOT NULL,
	"end_date" text,
	"status" text NOT NULL,
	"phases" text,
	"custom_rules" text,
	"rankings" text,
	"participant_ids" text,
	"match_ids" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campaign_participants" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" text NOT NULL,
	"user_id" text NOT NULL,
	"display_name" text NOT NULL,
	"is_organizer" boolean NOT NULL,
	"army_id" text NOT NULL,
	"army_name" text NOT NULL,
	"current_phase_id" text NOT NULL,
	"matches_in_current_phase" integer NOT NULL,
	"participant_data" text,
	"match_ids" text,
	"joined_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX ASYNC IF NOT EXISTS "idx_campaigns_organizer_id" ON "campaigns" ("organizer_id");
--> statement-breakpoint
CREATE INDEX ASYNC IF NOT EXISTS "idx_campaigns_type" ON "campaigns" ("type");
--> statement-breakpoint
CREATE INDEX ASYNC IF NOT EXISTS "idx_campaign_participants_campaign_id" ON "campaign_participants" ("campaign_id");
--> statement-breakpoint
CREATE INDEX ASYNC IF NOT EXISTS "idx_campaign_participants_user_id" ON "campaign_participants" ("user_id");
