CREATE TABLE "matches" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"system_id" text NOT NULL,
	"players" text NOT NULL,
	"turn" text NOT NULL,
	"score" text,
	"outcome" text NOT NULL,
	"campaign_id" text,
	"match_data" text,
	"notes" text NOT NULL,
	"played_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
