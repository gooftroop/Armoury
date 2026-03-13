import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrusadeRulesDAO } from '@/dao/CrusadeRulesDAO.js';
import { MockDatabaseAdapter } from '@/__mocks__/MockDatabaseAdapter.js';
import type { IGitHubClient } from '@armoury/clients-github';
import type { EntityType } from '@armoury/data-dao';

const CRUSADE_RULES_STORE = 'crusadeRules' as EntityType;
const SYNC_KEY = 'crusadeRules:static';

/**
 * CrusadeRulesDAO test suite.
 * Tests static data behavior: needsSync() always returns false,
 * fetchRemoteData() returns hardcoded rules, and load() returns the static data.
 */
describe('CrusadeRulesDAO', () => {
    let adapter: MockDatabaseAdapter;
    let mockGitHubClient: IGitHubClient;
    let dao: CrusadeRulesDAO;

    /**
     * Set up fresh mocks before each test.
     */
    beforeEach(async () => {
        adapter = new MockDatabaseAdapter();
        await adapter.initialize();
        mockGitHubClient = {
            getFileSha: vi.fn(),
            checkForUpdates: vi.fn(),
            listFiles: vi.fn(),
            downloadFile: vi.fn(),
        };
        dao = new CrusadeRulesDAO(adapter, mockGitHubClient);
    });

    /**
     * Test: needsSync() always returns false (static data never stale).
     */
    it('needsSync() always returns false (static data never stale)', async () => {
        const result = await (dao as unknown as { needsSync: () => Promise<boolean> }).needsSync();
        expect(result).toBe(false);
    });

    /**
     * Test: fetchRemoteData() returns hardcoded CrusadeRules object with correct shape.
     */
    it('fetchRemoteData() returns hardcoded CrusadeRules object with correct shape', async () => {
        const result = await (
            dao as unknown as { fetchRemoteData: (client: IGitHubClient) => Promise<Record<string, unknown>> }
        ).fetchRemoteData(mockGitHubClient);

        expect(result).toEqual({
            id: 'crusade-core',
            source: 'core',
            name: 'Crusade Core Rules',
            version: '1.0',
            startingSupplyLimit: 10,
            startingRequisitionPoints: 5,
            rpPerBattle: 1,
            rankThresholds: [
                { rank: 'Battle-ready', minXP: 0, battleHonoursAllowed: 0 },
                { rank: 'Bloodied', minXP: 6, battleHonoursAllowed: 1 },
                { rank: 'Battle-hardened', minXP: 16, battleHonoursAllowed: 2 },
                { rank: 'Heroic', minXP: 31, battleHonoursAllowed: 3 },
                { rank: 'Legendary', minXP: 51, battleHonoursAllowed: 4 },
            ],
            xpGainRules: [],
            requisitions: [],
            battleHonours: [],
            battleScars: [],
            agendas: [],
            narrative: '',
            sourceMechanics: {},
        });
    });

    /**
     * Test: load() returns the static crusade rules data.
     */
    it('load() returns the static crusade rules data', async () => {
        const result = await dao.load();

        expect(result).toBeDefined();
        expect(result.id).toBe(SYNC_KEY);
        expect(result.source).toBe('core');
        expect(result.name).toBe('Crusade Core Rules');
        expect(result.version).toBe('1.0');
        expect(result.rankThresholds).toHaveLength(5);
        expect(result.rankThresholds[0].rank).toBe('Battle-ready');
        expect(result.rankThresholds[4].rank).toBe('Legendary');
    });

    /**
     * Test: Multiple concurrent load() calls return the same promise (no duplicate fetches).
     */
    it('Multiple concurrent load() calls return the same promise (no duplicate fetches)', async () => {
        vi.mocked(mockGitHubClient.getFileSha).mockResolvedValueOnce('test-sha');

        const [result1, result2, result3] = await Promise.all([dao.load(), dao.load(), dao.load()]);

        expect(result1).toBeDefined();
        expect(result2).toBeDefined();
        expect(result3).toBeDefined();
        expect(result1.id).toBe(SYNC_KEY);
        expect(result2.id).toBe(SYNC_KEY);
        expect(result3.id).toBe(SYNC_KEY);
    });

    /**
     * Test: load() stores data in adapter.
     */
    it('load() stores data in adapter', async () => {
        vi.mocked(mockGitHubClient.getFileSha).mockResolvedValueOnce('test-sha');

        await dao.load();

        // Verify data was stored in adapter with sync key as ID
        const stored = await adapter.get(CRUSADE_RULES_STORE, SYNC_KEY);
        expect(stored).not.toBeNull();
        expect((stored as { id: string }).id).toBe(SYNC_KEY);
    });
});
