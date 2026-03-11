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
