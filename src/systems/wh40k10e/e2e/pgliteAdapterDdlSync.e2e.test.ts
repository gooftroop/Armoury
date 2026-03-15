/**
 * PGliteAdapter DDL + full system sync end-to-end test.
 *
 * Validates the complete pipeline that the web app uses:
 *   1. PGliteAdapter creates tables from Drizzle schema definitions (DDL path)
 *   2. System registration wires up entity codecs and hydrators
 *   3. DataContextBuilder orchestrates adapter → system → sync
 *   4. Real BSData is downloaded from GitHub, parsed, and persisted in PGlite
 *   5. Persisted data is accessible via the DataContext API
 *
 * This fills the gap where existing tests use MockDatabaseAdapter:
 *   - DataContext.e2e.test.ts uses MockDatabaseAdapter (no real DDL)
 *   - pgliteAdapter.e2e.test.ts tests PGlite CRUD but no system sync
 *   - syncDaos.e2e.test.ts tests DAO sync but with MockDatabaseAdapter
 *
 * @requirements
 * - REQ-PGLITE-DDL: PGliteAdapter creates all registered Drizzle tables via DDL
 * - REQ-SYSTEM-SYNC: Full system registration + BSData sync pipeline works with PGlite
 * - REQ-DATA-PERSISTENCE: Synced data is queryable from PGlite tables after sync
 */

import 'dotenv/config';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGliteAdapter, generateAllTablesDDL, getAllTableNames } from '@armoury/adapters-pglite';
import { DataContext, DataContextBuilder } from '@armoury/data-context';
import { GitHubClient } from '@armoury/clients-github';
import { wh40k10eSystem } from '../src/system.js';
import type { GameData } from '../src/dao/GameData.js';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const HAS_TOKEN = Boolean(GITHUB_TOKEN);

/**
 * Test plan:
 *
 * REQ-PGLITE-DDL:
 *   - ddl-generates: generateAllTablesDDL() produces non-empty SQL with CREATE TABLE statements
 *   - ddl-tables-exist: getAllTableNames() returns all expected schema tables
 *   - ddl-adapter-creates-tables: PGliteAdapter.initialize() creates tables queryable via SQL
 *
 * REQ-SYSTEM-SYNC:
 *   - full-pipeline: DataContextBuilder chains system → adapter → github → build() without error
 *   - sync-status-written: Sync status records are stored in PGlite after sync
 *
 * REQ-DATA-PERSISTENCE:
 *   - core-rules-accessible: dc.game.coreRules returns parsed core rules with categories and shared rules
 *   - faction-data-accessible: dc.game.spaceMarines returns parsed faction data with units and weapons
 *   - data-stored-in-adapter: Adapter contains unit, weapon, and ability records after sync
 */

// ============================================================
// DDL generation (no GitHub token needed)
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
// Full pipeline: PGliteAdapter + system sync (real BSData)
// ============================================================

describe.skipIf(!HAS_TOKEN)('PGliteAdapter DDL + system sync (real BSData)', { timeout: 180_000 }, () => {
    let dc: DataContext<GameData>;
    let adapter: PGliteAdapter;

    beforeAll(async () => {
        adapter = new PGliteAdapter();
        dc = await DataContextBuilder.builder<GameData>()
            .system(wh40k10eSystem)
            .adapter(adapter)
            .github(new GitHubClient({ token: GITHUB_TOKEN! }))
            .build();
    });

    afterAll(async () => {
        await dc?.close();
    });

    // -- REQ-SYSTEM-SYNC --

    it('DataContextBuilder completes the full build pipeline', () => {
        expect(dc).toBeDefined();
        expect(dc.game).toBeDefined();
        expect(dc.accounts).toBeDefined();
        expect(dc.armies).toBeDefined();
        expect(dc.campaigns).toBeDefined();
        expect(dc.matches).toBeDefined();
    });

    it('sync status records are written to PGlite', async () => {
        const syncStatus = await adapter.getSyncStatus('core:wh40k-10e.gst');

        expect(syncStatus).not.toBeNull();
        expect(syncStatus!.fileKey).toBe('core:wh40k-10e.gst');
        expect(syncStatus!.sha.length).toBeGreaterThan(0);
    });

    // -- REQ-DATA-PERSISTENCE --

    it('core rules are accessible and fully hydrated', async () => {
        const coreRules = await dc.game.coreRules;

        expect(coreRules).toHaveProperty('id');
        expect(coreRules).toHaveProperty('profileTypes');
        expect(coreRules.categories.length).toBeGreaterThan(0);
        expect(coreRules.sharedRules.length).toBeGreaterThan(0);
    });

    it('Space Marines faction data is accessible with units and weapons', async () => {
        const sm = await dc.game.spaceMarines;

        expect(sm).toHaveProperty('id');
        expect(sm.units.length).toBeGreaterThan(0);
        expect(sm.weapons.length).toBeGreaterThan(0);
        expect(sm.abilities.length).toBeGreaterThan(0);
    });

    it('faction data is stored in the adapter and queryable', async () => {
        const units = await adapter.getAll('unit');
        const weapons = await adapter.getAll('weapon');
        const abilities = await adapter.getAll('ability');

        expect(units.length).toBeGreaterThan(0);
        expect(weapons.length).toBeGreaterThan(0);
        expect(abilities.length).toBeGreaterThan(0);
    });

    it('faction discovery wrote faction records to PGlite', async () => {
        const factions = await adapter.getAll('faction');

        expect(factions.length).toBeGreaterThan(0);
    });
});
