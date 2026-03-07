CREATE TABLE "campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"campaign_type_id" text NOT NULL,
	"organizer_id" text NOT NULL,
	"organizer_name" text NOT NULL,
	"narrative" jsonb,
	"start_date" text NOT NULL,
	"end_date" text,
	"status" text NOT NULL,
	"phases" jsonb,
	"custom_rules" jsonb,
	"rankings" jsonb,
	"participant_ids" jsonb,
	"match_ids" jsonb,
	"crusade_rules_id" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_participants" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"user_id" text NOT NULL,
	"display_name" text NOT NULL,
	"is_organizer" boolean NOT NULL,
	"army_id" text NOT NULL,
	"army_name" text NOT NULL,
	"current_phase_id" text NOT NULL,
	"matches_in_current_phase" integer NOT NULL,
	"crusade_data" jsonb,
	"match_ids" jsonb,
	"joined_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_types" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"source" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"phases" jsonb NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_campaigns_organizer_id" ON "campaigns" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "idx_campaigns_campaign_type_id" ON "campaigns" USING btree ("campaign_type_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_participants_campaign_id" ON "campaign_participants" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_participants_user_id" ON "campaign_participants" USING btree ("user_id");