CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"display_name" text,
	"picture" text,
	"email" text,
	"preferences" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "friends" (
	"id" text PRIMARY KEY NOT NULL,
	"requester_id" text NOT NULL,
	"receiver_id" text NOT NULL,
	"status" text NOT NULL,
	"requester_name" text NOT NULL,
	"requester_picture" text,
	"receiver_name" text NOT NULL,
	"receiver_picture" text,
	"can_share_army_lists" boolean NOT NULL,
	"can_view_match_history" boolean NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" text PRIMARY KEY NOT NULL,
	"system_id" text NOT NULL,
	"players" jsonb NOT NULL,
	"turn" jsonb NOT NULL,
	"score" jsonb,
	"outcome" jsonb NOT NULL,
	"campaign_id" text,
	"match_data" jsonb,
	"notes" text NOT NULL,
	"played_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_status" (
	"file_key" text PRIMARY KEY NOT NULL,
	"sha" text NOT NULL,
	"last_synced" timestamp NOT NULL,
	"etag" text
);
--> statement-breakpoint
CREATE TABLE "user_presence" (
	"user_id" text PRIMARY KEY NOT NULL,
	"connection_id" text,
	"status" text NOT NULL,
	"last_seen" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "armies" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"faction_id" text NOT NULL,
	"detachment_id" text,
	"warlord_unit_id" text,
	"battle_size" text NOT NULL,
	"points_limit" integer NOT NULL,
	"units" jsonb NOT NULL,
	"total_points" integer NOT NULL,
	"notes" text NOT NULL,
	"versions" jsonb NOT NULL,
	"current_version" integer NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chapter_approved" (
	"id" text PRIMARY KEY NOT NULL,
	"version" text NOT NULL,
	"primary_missions" jsonb,
	"secondary_missions" jsonb,
	"deployment_zones" jsonb,
	"challenger_cards" jsonb,
	"twist_cards" jsonb,
	"tournament_missions" jsonb,
	"terrain_layouts" jsonb
);
--> statement-breakpoint
CREATE TABLE "core_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"revision" text NOT NULL,
	"battle_scribe_version" text NOT NULL,
	"profile_types" jsonb,
	"cost_types" jsonb,
	"shared_rules" jsonb,
	"categories" jsonb,
	"constraints" jsonb,
	"source_file" text NOT NULL,
	"last_synced" timestamp
);
--> statement-breakpoint
CREATE TABLE "crusade_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"name" text NOT NULL,
	"version" text NOT NULL,
	"starting_supply_limit" integer NOT NULL,
	"starting_requisition_points" integer NOT NULL,
	"rp_per_battle" integer NOT NULL,
	"rank_thresholds" jsonb,
	"xp_gain_rules" jsonb,
	"requisitions" jsonb,
	"battle_honours" jsonb,
	"battle_scars" jsonb,
	"agendas" jsonb,
	"narrative" text,
	"source_mechanics" jsonb
);
--> statement-breakpoint
CREATE TABLE "factions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"source_file" text NOT NULL,
	"source_sha" text NOT NULL,
	"catalogue_file" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_campaigns_organizer_id" ON "campaigns" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "idx_campaigns_campaign_type_id" ON "campaigns" USING btree ("campaign_type_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_participants_campaign_id" ON "campaign_participants" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_participants_user_id" ON "campaign_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_friends_requesterId" ON "friends" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "idx_friends_receiverId" ON "friends" USING btree ("receiver_id");--> statement-breakpoint
CREATE INDEX "idx_armies_ownerId" ON "armies" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_armies_factionId" ON "armies" USING btree ("faction_id");