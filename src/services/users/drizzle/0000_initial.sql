CREATE TABLE "users" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sub" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"picture" text,
	"account_id" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"preferences" text,
	"systems" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX ASYNC "idx_users_sub" ON "users" ("sub");
--> statement-breakpoint
CREATE INDEX ASYNC "idx_users_email" ON "users" ("email");
--> statement-breakpoint
CREATE INDEX ASYNC "idx_accounts_user_id" ON "accounts" ("user_id");
