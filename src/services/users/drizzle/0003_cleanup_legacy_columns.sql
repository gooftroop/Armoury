-- Migration: cleanup legacy index after Auth0 sub cutover.
--
-- After 0002, `users.id` IS the Auth0 sub. The legacy `users.sub` bridge
-- column is now redundant.
--
-- DSQL LIMITATION: AWS DSQL does not support `ALTER TABLE ... DROP COLUMN`
-- (PostgreSQL feature_not_supported / SQLSTATE 0A000) and does not support
-- `DO $$ ... $$` anonymous blocks. We therefore:
--   1. Drop the now-redundant `idx_users_sub` index (supported).
--   2. Leave the `sub` column in place. It is inert: the Drizzle schema in
--      `src/services/users/schema.ts` does not declare it, so the ORM never
--      reads or writes it, and `users.id == users.sub` for all rows.
--
-- If/when DSQL adds DROP COLUMN support, a follow-up migration can remove it.

DROP INDEX IF EXISTS idx_users_sub;
