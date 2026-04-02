/**
 * E2E tests for PGliteAdapter initialization using migration SQL files (Path A).
 * Validates that the Drizzle migrator can apply SQL migration files to create
 * the core database schema in PGlite.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGliteAdapter } from '@armoury/adapters-pglite';
import { makeAccount } from '../__fixtures__/makeAccount.js';

/**
 * @requirements
 * - REQ-MIGRATION-001: PGliteAdapter must support initialization via migrationsFolder config
 * - REQ-MIGRATION-002: Migration SQL must create all core entity tables
 * - REQ-MIGRATION-003: Tables created via migrations must be compatible with Drizzle ORM queries
 */

/*
 * Test Plan:
 * - REQ-MIGRATION-001 → 'initializes successfully using migration SQL files'
 * - REQ-MIGRATION-002 → 'creates all expected tables'
 * - REQ-MIGRATION-003 → 'supports full CRUD after migration', 'supports sync status operations'
 */

describe('PGliteAdapter Migration Path A', () => {
    const migrationsFolder = path.resolve(fileURLToPath(new URL('../__fixtures__/migrations', import.meta.url)));
    let adapter: PGliteAdapter;

    beforeEach(async () => {
        adapter = new PGliteAdapter({ migrationsFolder });
        await adapter.initialize();
    });

    afterEach(async () => {
        await adapter.close();
    });

    it('initializes successfully using migration SQL files', async () => {
        const initOnlyAdapter = new PGliteAdapter({ migrationsFolder });
        await expect(initOnlyAdapter.initialize()).resolves.toBeUndefined();
        await initOnlyAdapter.close();
    });

    it('creates all expected tables', async () => {
        await expect(adapter.getAll('account')).resolves.toEqual([]);
        await expect(adapter.getAll('friend')).resolves.toEqual([]);
        await expect(adapter.getAll('match')).resolves.toEqual([]);
        await expect(adapter.getAll('campaign')).resolves.toEqual([]);
        await expect(adapter.getAll('campaignParticipant')).resolves.toEqual([]);
        await expect(adapter.getAll('userPresence')).resolves.toEqual([]);
    });

    it('supports full CRUD after migration', async () => {
        const account = makeAccount();

        await adapter.put('account', account);

        const stored = await adapter.get('account', account.id);
        expect(stored).not.toBeNull();
        expect(stored!.id).toBe(account.id);
        expect(stored!.userId).toBe(account.userId);
        expect(stored!.preferences).toEqual(account.preferences);

        await adapter.delete('account', account.id);
        await expect(adapter.get('account', account.id)).resolves.toBeNull();
    });

    it('supports sync status operations after migration', async () => {
        await adapter.setSyncStatus('core:wh40k-10e.gst', 'sha-1', 'etag-1');

        const status = await adapter.getSyncStatus('core:wh40k-10e.gst');
        expect(status).not.toBeNull();
        expect(status).toMatchObject({
            fileKey: 'core:wh40k-10e.gst',
            sha: 'sha-1',
            etag: 'etag-1',
        });

        await adapter.deleteSyncStatus('core:wh40k-10e.gst');
        await expect(adapter.getSyncStatus('core:wh40k-10e.gst')).resolves.toBeNull();
    });
});
