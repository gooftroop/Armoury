CREATE TABLE "friends" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" text NOT NULL,
	"can_share_army_lists" boolean NOT NULL,
	"can_view_match_history" boolean NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_presence" (
	"user_id" text PRIMARY KEY NOT NULL,
	"connection_id" text,
	"status" text NOT NULL,
	"last_seen" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX ASYNC "idx_friends_ownerId" ON "friends" ("owner_id");
--> statement-breakpoint
CREATE INDEX ASYNC "idx_friends_userId" ON "friends" ("user_id");
