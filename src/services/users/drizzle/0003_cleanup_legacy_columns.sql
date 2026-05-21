-- Migration: remove legacy user columns after Auth0 sub cutover
-- `sub` is now the canonical user identifier, so the legacy migration bridge
-- is no longer needed. Drop any indexes on these columns first, then remove
-- the columns themselves.

BEGIN;

DO $$
DECLARE
    index_name text;
BEGIN
    -- Drop `sub` only when it still exists; this is the old Auth0 bridge column
    -- and is no longer needed once user IDs are stored directly in `id`.
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'users'
          AND column_name = 'sub'
    ) THEN
        FOR index_name IN
            SELECT indexname
            FROM pg_indexes
            WHERE schemaname = current_schema()
              AND tablename = 'users'
              AND indexdef ILIKE '%("sub")%'
        LOOP
            EXECUTE format('DROP INDEX IF EXISTS %I', index_name);
        END LOOP;

        ALTER TABLE "users" DROP COLUMN IF EXISTS "sub";
    END IF;

    -- Drop `legacy_id` only when it still exists; it was a temporary safety
    -- net that preserved the old UUID primary key during the Auth0 migration.
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'users'
          AND column_name = 'legacy_id'
    ) THEN
        FOR index_name IN
            SELECT indexname
            FROM pg_indexes
            WHERE schemaname = current_schema()
              AND tablename = 'users'
              AND indexdef ILIKE '%("legacy_id")%'
        LOOP
            EXECUTE format('DROP INDEX IF EXISTS %I', index_name);
        END LOOP;

        ALTER TABLE "users" DROP COLUMN IF EXISTS "legacy_id";
    END IF;
END $$;

COMMIT;
