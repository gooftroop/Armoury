/**
 * LocalStack Postgres seeding fixture for Playwright e2e tests.
 *
 * Ensures a test user and account exist in the users-db Postgres instance
 * before authenticated tests run. The Lambda (deployed via bootstrap.sh with
 * IS_OFFLINE=true) writes to the same database, so the full download flow —
 * including the PUT /{userId}/account persistence call — hits real Postgres.
 *
 * @requirements
 * 1. Must insert a user row matching E2E_USER_ID / E2E_USER_SUB from auth/setup.ts.
 * 2. Must insert a corresponding account row with empty systems object.
 * 3. Must use UPSERT semantics so re-runs don't fail on duplicate keys.
 * 4. Must clean up the pg connection after the test worker finishes.
 * 5. Must connect to the users-db container (localhost:5432, armoury/armoury_local/armoury_users).
 */

import pg from 'pg';

import { E2E_ACCOUNT_ID, E2E_USER_ID, E2E_USER_SUB } from '../constants.js';

/** Postgres connection config matching src/services/users/docker-compose.yml. */
const PG_CONFIG = {
    host: process.env['E2E_PG_HOST'] ?? 'localhost',
    port: Number(process.env['E2E_PG_PORT'] ?? '5432'),
    user: 'armoury',
    password: 'armoury_local',
    database: 'armoury_users',
    ssl: false,
} as const;

/**
 * Seeds the test user and account into Postgres using UPSERT.
 * Returns a teardown function that closes the pg connection.
 */
export async function seedTestUser(): Promise<() => Promise<void>> {
    const client = new pg.Client({
        host: PG_CONFIG.host,
        port: PG_CONFIG.port,
        user: PG_CONFIG.user,
        password: PG_CONFIG.password,
        database: PG_CONFIG.database,
        ssl: PG_CONFIG.ssl ? undefined : false,
    });

    await client.connect();

    const now = new Date().toISOString();

    // UPSERT user — idempotent across re-runs.
    await client.query(
        `INSERT INTO users (id, sub, email, name, picture, account_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NULL, $5, $6, $6)
         ON CONFLICT (id) DO UPDATE SET
           sub = EXCLUDED.sub,
           email = EXCLUDED.email,
           name = EXCLUDED.name,
           account_id = EXCLUDED.account_id,
           updated_at = EXCLUDED.updated_at`,
        [E2E_USER_ID, E2E_USER_SUB, 'e2e@armoury.test', 'E2E Test User', E2E_ACCOUNT_ID, now],
    );

    // UPSERT account — starts with empty systems so the download flow can write to it.
    await client.query(
        `INSERT INTO accounts (id, user_id, preferences, systems, created_at, updated_at)
         VALUES ($1, $2, '{}', '{}', $3, $3)
         ON CONFLICT (id) DO UPDATE SET
           user_id = EXCLUDED.user_id,
           systems = '{}',
           updated_at = EXCLUDED.updated_at`,
        [E2E_ACCOUNT_ID, E2E_USER_ID, now],
    );

    return async () => {
        await client.end();
    };
}
