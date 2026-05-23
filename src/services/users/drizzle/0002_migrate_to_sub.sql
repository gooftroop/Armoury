-- Migration: Migrate users primary key from internal UUID to Auth0 sub
-- Back-fills legacy_id with the old UUID, then updates all referencing FK
-- columns so they point to the new sub value, and finally switches users.id.
--
-- Idempotent: safe to re-run. Each step is guarded with `id != sub`
-- or `legacy_id IS NULL` so a second run is a no-op.

BEGIN;

-- =============================================================================
-- Step 1 — Backup old UUID into legacy_id
-- =============================================================================
-- Only for rows that haven't been migrated yet (legacy_id is still NULL
-- and the current id is still the old UUID rather than the sub).
UPDATE "users"
SET "legacy_id" = "id"
WHERE "legacy_id" IS NULL
  AND "id" != "sub";

-- =============================================================================
-- Step 2 — Update all FK columns BEFORE changing users.id
-- =============================================================================
-- At this point users.id still holds the old UUID, so we can JOIN on it
-- to find every row that needs rewriting.

-- accounts.user_id
UPDATE "accounts"
SET "user_id" = u."sub"
FROM "users" u
WHERE "accounts"."user_id" = u."id"
  AND u."id" != u."sub";

-- friends.owner_id
UPDATE "friends"
SET "owner_id" = u."sub"
FROM "users" u
WHERE "friends"."owner_id" = u."id"
  AND u."id" != u."sub";

-- friends.user_id
UPDATE "friends"
SET "user_id" = u."sub"
FROM "users" u
WHERE "friends"."user_id" = u."id"
  AND u."id" != u."sub";

-- user_presence.user_id is the PRIMARY KEY — we cannot UPDATE a PK in-place.
-- Instead insert the new row keyed by sub, then delete the old UUID row.
INSERT INTO "user_presence" ("user_id", "connection_id", "status", "last_seen")
SELECT u."sub", up."connection_id", up."status", up."last_seen"
FROM "user_presence" up
JOIN "users" u ON up."user_id" = u."id"
WHERE u."id" != u."sub"
ON CONFLICT ("user_id") DO NOTHING;

-- Clean up rows still keyed by the old UUID. legacy_id is stable even after
-- users.id changes, so this remains idempotent across re-runs.
DELETE FROM "user_presence"
WHERE "user_id" IN (
    SELECT "legacy_id"
    FROM "users"
    WHERE "legacy_id" IS NOT NULL
);

-- campaigns.organizer_id
UPDATE "campaigns"
SET "organizer_id" = u."sub"
FROM "users" u
WHERE "campaigns"."organizer_id" = u."id"
  AND u."id" != u."sub";

-- campaign_participants.user_id
UPDATE "campaign_participants"
SET "user_id" = u."sub"
FROM "users" u
WHERE "campaign_participants"."user_id" = u."id"
  AND u."id" != u."sub";

-- match_subscriptions.user_id
UPDATE "match_subscriptions"
SET "user_id" = u."sub"
FROM "users" u
WHERE "match_subscriptions"."user_id" = u."id"
  AND u."id" != u."sub";

-- ws_connections.user_id
UPDATE "ws_connections"
SET "user_id" = u."sub"
FROM "users" u
WHERE "ws_connections"."user_id" = u."id"
  AND u."id" != u."sub";

-- =============================================================================
-- Step 3 — Switch users primary key last
-- =============================================================================
-- All other tables now point to the sub, so changing users.id is safe.
UPDATE "users"
SET "id" = "sub"
WHERE "id" != "sub";

-- =============================================================================
-- Verification
-- =============================================================================
-- Every FK value should now match a users.id (which is the sub).
-- Any non-zero count indicates an orphaned reference.
SELECT
    (SELECT COUNT(*) FROM "users" WHERE "id" = "sub") AS "migrated_users",
    (SELECT COUNT(*) FROM "users" WHERE "id" != "sub") AS "unmigrated_users",
    (SELECT COUNT(*) FROM "accounts" WHERE "user_id" NOT IN (SELECT "id" FROM "users")) AS "orphaned_accounts",
    (SELECT COUNT(*) FROM "friends" WHERE "owner_id" NOT IN (SELECT "id" FROM "users")) AS "orphaned_friends_owner",
    (SELECT COUNT(*) FROM "friends" WHERE "user_id" NOT IN (SELECT "id" FROM "users")) AS "orphaned_friends_user",
    (SELECT COUNT(*) FROM "user_presence" WHERE "user_id" NOT IN (SELECT "id" FROM "users")) AS "orphaned_presence",
    (SELECT COUNT(*) FROM "campaigns" WHERE "organizer_id" NOT IN (SELECT "id" FROM "users")) AS "orphaned_campaigns",
    (SELECT COUNT(*) FROM "campaign_participants" WHERE "user_id" NOT IN (SELECT "id" FROM "users")) AS "orphaned_participants",
    (SELECT COUNT(*) FROM "match_subscriptions" WHERE "user_id" NOT IN (SELECT "id" FROM "users")) AS "orphaned_subscriptions",
    (SELECT COUNT(*) FROM "ws_connections" WHERE "user_id" NOT IN (SELECT "id" FROM "users")) AS "orphaned_connections";

COMMIT;
