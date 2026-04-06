/**
 * PGliteAdapter DDL + full system sync end-to-end test.
 *
 * Validates two independent concerns:
 *
 * Part 1 — DDL (PGlite-specific, no network):
 *   1. PGliteAdapter creates tables from Drizzle schema definitions (DDL path)
 *   2. Generated DDL produces valid CREATE TABLE statements
 *   3. Tables are queryable after initialization
 *
 * Part 2 — Full pipeline (adapter-agnostic, GitHub token required):
 *   1. System registration wires up entity codecs and hydrators
 *   2. Real BSData is downloaded from GitHub, parsed, and persisted
 *   3. Persisted data is accessible via the GameData API
 *   4. Known DAO failures (missing BSData repos) are handled gracefully
 *
 * Part 2 uses MockDatabaseAdapter because the wh40k10e DSQL schema extension
 * is not yet implemented (TODO in system.ts). PGlite requires store-to-table
 * mappings that do not exist yet for game-specific entities.
 *
 * @requirements
 * - REQ-PGLITE-DDL: PGliteAdapter creates all registered Drizzle tables via DDL
 * - REQ-SYSTEM-SYNC: Full system registration + BSData sync pipeline works end-to-end
 * - REQ-DATA-PERSISTENCE: Synced data is queryable from the adapter after sync
 */

import 'dotenv/config';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGliteAdapter, generateAllTablesDDL, getAllTableNames } from '@armoury/adapters-pglite';
import { GitHubClient } from '@armoury/clients-github';
import { MockDatabaseAdapter } from '../src/__mocks__/MockDatabaseAdapter.js';
import { wh40k10eSystem } from '../src/system.js';
import type { GameData } from '../src/dao/GameData.js';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const HAS_TOKEN = Boolean(GITHUB_TOKEN);

/**
 * Known DAOs that consistently fail during sync.
 * Each entry maps the DAO name to its expected error message substring.
 *
 * - ChapterApproved: Requires Wahapedia client which is not configured in this test
 */
const KNOWN_FAILING_DAOS: Record<string, string> = {
    ChapterApproved: 'Wahapedia client not configured',
};

/**
 * Test plan:
 *
 * REQ-PGLITE-DDL:
 *   - ddl-generates: generateAllTablesDDL() produces non-empty SQL with CREATE TABLE statements
 *   - ddl-tables-exist: getAllTableNames() returns all expected schema tables
 *   - ddl-adapter-creates-tables: PGliteAdapter.initialize() creates tables queryable via SQL
 *
 * REQ-SYSTEM-SYNC:
 *   - partial-sync: sync() fails only for known-missing DAOs, not for schema/adapter issues
 *   - sync-status-written: Sync status records are stored after sync
 *
 * REQ-DATA-PERSISTENCE:
 *   - core-rules-accessible: game.coreRules returns parsed core rules with categories and shared rules
 *   - faction-data-accessible: game.spaceMarines returns parsed faction data with units and weapons
 *   - faction-entities-stored: Adapter contains unit, weapon, and ability records after sync
 *   - faction-discovery-complete: Faction discovery records are written to the adapter
 */

// ============================================================
// Part 1: DDL generation (no GitHub token needed)
// ============================================================

describe('PGliteAdapter DDL table creation', () => {
    it('generateAllTablesDDL() produces CREATE TABLE statements', () => {
        wh40k10eSystem.register();
        const ddl = generateAllTablesDDL();

        expect(ddl).toBeTruthy();
        expect(ddl).toContain('CREATE TABLE IF NOT EXISTS');
    });

    it('getAllTableNames() returns registered table names', () => {
        wh40k10eSystem.register();
        const tableNames = getAllTableNames();

        expect(tableNames.length).toBeGreaterThan(0);
        // Core tables that must exist in any Armoury schema
        expect(tableNames).toContain('accounts');
        expect(tableNames).toContain('sync_status');
    });

    it('PGliteAdapter.initialize() creates tables via DDL (no migrations)', async () => {
        wh40k10eSystem.register();
        const adapter = new PGliteAdapter();
        await adapter.initialize();

        // Verify tables exist by performing a count query — if the table
        // doesn't exist, PGlite throws.
        const accountCount = await adapter.count('account');
        expect(accountCount).toBe(0);

        await adapter.close();
    });
});

// ============================================================
// Part 2: Full pipeline — system sync with real BSData
// Uses MockDatabaseAdapter (wh40k10e DSQL schema not yet implemented)
// ============================================================

describe.skipIf(!HAS_TOKEN)('System sync pipeline (real BSData)', { timeout: 180_000 }, () => {
    let adapter: MockDatabaseAdapter;
    let game: GameData;
    let syncResult: Awaited<ReturnType<GameData['sync']>>;

    beforeAll(async () => {
        adapter = new MockDatabaseAdapter();
        await adapter.initialize();

        wh40k10eSystem.register();

        const githubClient = new GitHubClient({ token: GITHUB_TOKEN! });
        const clients = new Map<string, unknown>([['github', githubClient]]);
        const gameContext = wh40k10eSystem.createGameContext(adapter, clients);
        game = gameContext.game as GameData;

        syncResult = await game.sync();
    });

    afterAll(async () => {
        await adapter?.close();
    });

    // -- REQ-SYSTEM-SYNC --

    it('sync fails only for known-missing DAOs, not for schema or adapter issues', () => {
        expect(syncResult.success).toBe(false);
        expect(syncResult.failures).toHaveLength(Object.keys(KNOWN_FAILING_DAOS).length);

        const failedDaos = syncResult.failures.map((failure) => failure.dao);

        for (const dao of Object.keys(KNOWN_FAILING_DAOS)) {
            expect(failedDaos).toContain(dao);
        }

        expect(syncResult.total).toBe(40);
        expect(syncResult.succeeded).toHaveLength(40 - Object.keys(KNOWN_FAILING_DAOS).length);

        for (const failure of syncResult.failures) {
            const expectedError = KNOWN_FAILING_DAOS[failure.dao];
            expect(expectedError, `Unexpected failing DAO: ${failure.dao} — ${failure.error}`).toBeDefined();
            expect(failure.error).toContain(expectedError);
            expect(failure.error).not.toContain('Unknown entity store');
            expect(failure.error).not.toContain('plugin schema registered');
        }
    });

    it('sync status records are written for successfully synced DAOs', async () => {
        const syncStatus = await adapter.getSyncStatus('core:wh40k-10e.gst');

        expect(syncStatus).not.toBeNull();
        expect(syncStatus!.fileKey).toBe('core:wh40k-10e.gst');
        expect(syncStatus!.sha.length).toBeGreaterThan(0);
    });

    // -- REQ-DATA-PERSISTENCE --

    it('core rules are accessible and fully hydrated', async () => {
        const coreRules = await game.coreRules;

        expect(coreRules).toHaveProperty('id');
        expect(coreRules).toHaveProperty('profileTypes');
        expect(coreRules.categories.length).toBeGreaterThan(0);
        expect(coreRules.sharedRules.length).toBeGreaterThan(0);
    });

    it('Space Marines faction data is accessible with units and weapons', async () => {
        const sm = await game.spaceMarines;

        expect(sm).toHaveProperty('id');
        expect(sm.units.length).toBeGreaterThan(0);
        expect(sm.weapons.length).toBeGreaterThan(0);
        expect(sm.abilities.length).toBeGreaterThan(0);
    });

    it('faction entities are stored in the adapter after sync', async () => {
        const units = await adapter.getAll('unit');
        const weapons = await adapter.getAll('weapon');
        const abilities = await adapter.getAll('ability');

        expect(units.length).toBeGreaterThan(0);
        expect(weapons.length).toBeGreaterThan(0);
        expect(abilities.length).toBeGreaterThan(0);
    });

    it('faction discovery wrote faction records to the adapter', async () => {
        const factions = await adapter.getAll('faction');

        expect(factions.length).toBeGreaterThan(0);
    });
});
