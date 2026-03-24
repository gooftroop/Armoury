CREATE TABLE IF NOT EXISTS "accounts" (
    "id" TEXT PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "preferences" JSONB,
    "systems" JSONB,
    "created_at" TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "friends" (
    "id" TEXT PRIMARY KEY,
    "owner_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "can_share_army_lists" BOOLEAN NOT NULL,
    "can_view_match_history" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "matches" (
    "id" TEXT PRIMARY KEY,
    "system_id" TEXT NOT NULL,
    "players" JSONB NOT NULL,
    "turn" TEXT NOT NULL,
    "score" JSONB,
    "outcome" TEXT NOT NULL,
    "campaign_id" TEXT,
    "match_data" JSONB,
    "notes" TEXT NOT NULL,
    "played_at" TEXT,
    "created_at" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campaigns" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "organizer_id" TEXT NOT NULL,
    "narrative" JSONB,
    "campaign_data" JSONB,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT,
    "status" TEXT NOT NULL,
    "phases" JSONB,
    "custom_rules" JSONB,
    "rankings" JSONB,
    "participant_ids" JSONB,
    "match_ids" JSONB,
    "created_at" TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campaign_participants" (
    "id" TEXT PRIMARY KEY,
    "campaign_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "is_organizer" BOOLEAN NOT NULL,
    "army_id" TEXT NOT NULL,
    "army_name" TEXT NOT NULL,
    "current_phase_id" TEXT NOT NULL,
    "matches_in_current_phase" INTEGER NOT NULL,
    "participant_data" JSONB,
    "match_ids" JSONB,
    "joined_at" TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_presence" (
    "user_id" TEXT PRIMARY KEY,
    "connection_id" TEXT,
    "status" TEXT NOT NULL,
    "last_seen" TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sync_status" (
    "file_key" TEXT PRIMARY KEY,
    "sha" TEXT NOT NULL,
    "last_synced" TIMESTAMP NOT NULL,
    "etag" TEXT
);
