import { beforeEach, describe, it, expect, vi } from 'vitest';
import { CoreRulesDAO } from '@/dao/CoreRulesDAO.js';
import type { CoreRules } from '@/models/CoreRules.js';
import { MockDatabaseAdapter } from '@/__mocks__/MockDatabaseAdapter.js';
import { MockGitHubClient } from '@/__mocks__/MockGitHubClient.js';
import { clearCodecRegistry } from '@armoury/data-dao';
import { clearHydrationRegistry } from '@armoury/data-dao';
import { clearSchemaExtensions } from '@armoury/data-dao';
import { PluginRegistry } from '@armoury/data-dao';
import type { BattleScribeGameSystem } from '@armoury/providers-bsdata';
import type { Faction } from '@/types/entities.js';
import { parseGameSystem } from '@armoury/providers-bsdata';

// Mock the xml-parser module
vi.mock('@armoury/providers-bsdata', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@armoury/providers-bsdata')>();
    return { ...actual, parseGameSystem: vi.fn() };
});

const CORE_RULES_FILE = 'Warhammer%2040%2C000.gst';
const CORE_RULES_SYNC_KEY = 'core:wh40k-10e.gst';

/**
 * Creates a mock BattleScribeGameSystem object for testing.
 * @returns Mock game system with minimal required structure
 */
function createMockGameSystem(): BattleScribeGameSystem {
    return {
        gameSystem: {
            '@_id': 'test-game-system-id',
            '@_name': 'Warhammer 40,000 10th Edition',
            '@_revision': '1',
            '@_battleScribeVersion': '2.03',
            profileTypes: { profileType: [] },
            costTypes: { costType: [] },
            categoryEntries: { categoryEntry: [] },
            sharedRules: { rule: [] },
            sharedSelectionEntries: { selectionEntry: [] },
        },
    } as unknown as BattleScribeGameSystem;
}

/**
 * Creates a sample CoreRules fixture for testing.
 * @returns CoreRules object with minimal test data
 */
function createFixture(): CoreRules {
    return {
        id: CORE_RULES_SYNC_KEY,
        name: 'Warhammer 40,000 10th Edition',
        revision: '1',
        battleScribeVersion: '2.03',
        profileTypes: [],
        costTypes: [],
        sharedRules: [],
        categories: [],
        constraints: [],
        sourceFile: CORE_RULES_FILE,
        lastSynced: new Date('2025-01-01T00:00:00Z'),
    };
}

/**
 * CoreRulesDAO test suite.
 * Tests fetchRemoteData(), discoverFactions(), load() behavior, memoization, and edge cases.
 */
describe('CoreRulesDAO', () => {
    let adapter: MockDatabaseAdapter;
    let githubClient: MockGitHubClient;
    let dao: CoreRulesDAO;

    /**
     * Set up fresh instances and clear registries before each test.
     */
    beforeEach(() => {
        clearCodecRegistry();
        clearHydrationRegistry();
        clearSchemaExtensions();
        PluginRegistry.clear();

        adapter = new MockDatabaseAdapter();
        githubClient = new MockGitHubClient();
        dao = new CoreRulesDAO(adapter, githubClient);

        vi.clearAllMocks();
    });

    describe('fetchRemoteData()', () => {
        /**
         * Test: fetchRemoteData() downloads .gst file and parses via parseGameSystem.
         */
        it('downloads .gst file and parses via parseGameSystem', async () => {
            const mockGameSystem = createMockGameSystem();
            const mockXmlContent = '<gameSystem>test</gameSystem>';

            githubClient.fileContents.set(CORE_RULES_FILE, mockXmlContent);
            githubClient.fileShas.set(CORE_RULES_FILE, 'sha123');
            githubClient.files = [];

            vi.mocked(parseGameSystem).mockReturnValue(mockGameSystem);

            const result = await dao.load();

            expect(githubClient.downloadedPaths).toContain(CORE_RULES_FILE);
            expect(parseGameSystem).toHaveBeenCalledWith(mockXmlContent);
            expect(parseGameSystem).toHaveBeenCalledTimes(1);
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('profileTypes');
            expect(result.sourceFile).toBe(CORE_RULES_FILE);
        });

        /**
         * Test: fetchRemoteData() calls discoverFactions() after parsing.
         */
        it('calls discoverFactions() after parsing core rules', async () => {
            const mockGameSystem = createMockGameSystem();
            const mockXmlContent = '<gameSystem>test</gameSystem>';

            githubClient.fileContents.set(CORE_RULES_FILE, mockXmlContent);
            githubClient.fileShas.set(CORE_RULES_FILE, 'sha123');
            githubClient.files = [
                {
                    name: 'Imperium - Space Marines.cat',
                    path: 'Imperium - Space Marines.cat',
                    sha: 'faction-sha-1',
                    size: 1000,
                    download_url: 'https://test.com/sm.cat',
                    type: 'file',
                },
            ];

            vi.mocked(parseGameSystem).mockReturnValue(mockGameSystem);

            await dao.load();

            const factions = await adapter.getAll('faction');
            expect(factions).toHaveLength(1);
            expect(factions[0]).toMatchObject({
                name: 'Space Marines',
                sourceFile: 'Imperium - Space Marines.cat',
            });
        });
    });

    describe('discoverFactions()', () => {
        /**
         * Test: discoverFactions() calls githubClient.listFiles() and finds .cat files.
         */
        it('calls githubClient.listFiles() and finds .cat files', async () => {
            const mockGameSystem = createMockGameSystem();
            const mockXmlContent = '<gameSystem>test</gameSystem>';

            githubClient.fileContents.set(CORE_RULES_FILE, mockXmlContent);
            githubClient.fileShas.set(CORE_RULES_FILE, 'sha123');
            githubClient.files = [
                {
                    name: 'Imperium - Space Marines.cat',
                    path: 'Imperium - Space Marines.cat',
                    sha: 'faction-sha-1',
                    size: 1000,
                    download_url: 'https://test.com/sm.cat',
                    type: 'file',
                },
                {
                    name: 'Chaos - Death Guard.cat',
                    path: 'Chaos - Death Guard.cat',
                    sha: 'faction-sha-2',
                    size: 2000,
                    download_url: 'https://test.com/dg.cat',
                    type: 'file',
                },
            ];

            vi.mocked(parseGameSystem).mockReturnValue(mockGameSystem);

            await dao.load();

            const factions = await adapter.getAll('faction');
            expect(factions).toHaveLength(2);
        });

        /**
         * Test: discoverFactions() writes faction records to adapter via transaction.
         */
        it('writes faction records to adapter via transaction', async () => {
            const mockGameSystem = createMockGameSystem();
            const mockXmlContent = '<gameSystem>test</gameSystem>';

            githubClient.fileContents.set(CORE_RULES_FILE, mockXmlContent);
            githubClient.fileShas.set(CORE_RULES_FILE, 'sha123');

            githubClient.files = [
                {
                    name: 'Imperium - Space Marines.cat',
                    path: 'Imperium - Space Marines.cat',
                    sha: 'faction-sha-1',
                    size: 1000,
                    download_url: 'https://test.com/sm.cat',
                    type: 'file',
                },
            ];

            vi.mocked(parseGameSystem).mockReturnValue(mockGameSystem);

            await dao.load();

            const factions = await adapter.getAll('faction');
            expect(factions).toHaveLength(1);

            const faction = factions[0];
            expect(faction).toMatchObject({
                id: 'faction-sha-1',
                name: 'Space Marines',
                sourceFile: 'Imperium - Space Marines.cat',
                sourceSha: 'faction-sha-1',
                catalogueFile: 'Imperium - Space Marines.cat',
            });
        });

        /**
         * Test: discoverFactions() strips "Imperium - ", "Chaos - ", and "Xenos - " prefixes from faction names.
         */
        it('strips faction prefixes (Imperium/Chaos/Xenos) from names', async () => {
            const mockGameSystem = createMockGameSystem();
            const mockXmlContent = '<gameSystem>test</gameSystem>';

            githubClient.fileContents.set(CORE_RULES_FILE, mockXmlContent);
            githubClient.fileShas.set(CORE_RULES_FILE, 'sha123');

            githubClient.files = [
                {
                    name: 'Imperium - Adeptus Custodes.cat',
                    path: 'Imperium - Adeptus Custodes.cat',
                    sha: 'sha-1',
                    size: 1000,
                    download_url: 'https://test.com/custodes.cat',
                    type: 'file',
                },
                {
                    name: 'Chaos - Thousand Sons.cat',
                    path: 'Chaos - Thousand Sons.cat',
                    sha: 'sha-2',
                    size: 2000,
                    download_url: 'https://test.com/tsons.cat',
                    type: 'file',
                },
                {
                    name: 'Xenos - Necrons.cat',
                    path: 'Xenos - Necrons.cat',
                    sha: 'sha-3',
                    size: 3000,
                    download_url: 'https://test.com/necrons.cat',
                    type: 'file',
                },
            ];

            vi.mocked(parseGameSystem).mockReturnValue(mockGameSystem);

            await dao.load();

            const factions = await adapter.getAll('faction');
            expect(factions).toHaveLength(3);

            expect(factions[0].name).toBe('Adeptus Custodes');
            expect(factions[1].name).toBe('Thousand Sons');
            expect(factions[2].name).toBe('Necrons');
        });
    });

    describe('load() - inherits BSDataBaseDAO memoization', () => {
        /**
         * Test: load() fetches remote data when NO sync status exists (first sync).
         */
        it('fetches remote data when NO sync status exists (first sync)', async () => {
            const mockGameSystem = createMockGameSystem();
            const mockXmlContent = '<gameSystem>test</gameSystem>';

            githubClient.fileContents.set(CORE_RULES_FILE, mockXmlContent);
            githubClient.fileShas.set(CORE_RULES_FILE, 'sha123');
            githubClient.files = [];

            vi.mocked(parseGameSystem).mockReturnValue(mockGameSystem);

            const result = await dao.load();

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('profileTypes');
            expect(parseGameSystem).toHaveBeenCalledTimes(1);

            const syncStatus = await adapter.getSyncStatus(CORE_RULES_SYNC_KEY);
            expect(syncStatus).not.toBeNull();
            expect(syncStatus!.sha).toBe('sha123');
        });

        /**
         * Test: load() uses cached adapter data when SHA matches.
         */
        it('uses cached adapter data when SHA matches (checkForUpdates returns false)', async () => {
            const fixture = createFixture();

            await adapter.setSyncStatus(CORE_RULES_SYNC_KEY, 'sha123');
            await adapter.put('coreRules', fixture);

            githubClient.shouldUpdate = false;

            const result = await dao.load();

            expect(githubClient.downloadedPaths).toHaveLength(0);
            expect(parseGameSystem).not.toHaveBeenCalled();
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('profileTypes');
        });

        /**
         * Test: load() re-fetches when SHA differs (checkForUpdates returns true).
         */
        it('re-fetches remote data when SHA differs (checkForUpdates returns true)', async () => {
            const oldFixture = createFixture();
            const mockGameSystem = createMockGameSystem();
            const mockXmlContent = '<gameSystem>test</gameSystem>';

            await adapter.setSyncStatus(CORE_RULES_SYNC_KEY, 'oldSha');
            await adapter.put('coreRules', oldFixture);

            githubClient.shouldUpdate = true;
            githubClient.fileContents.set(CORE_RULES_FILE, mockXmlContent);
            githubClient.fileShas.set(CORE_RULES_FILE, 'newSha');
            githubClient.files = [];

            vi.mocked(parseGameSystem).mockReturnValue(mockGameSystem);

            const result = await dao.load();

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('profileTypes');
            expect(parseGameSystem).toHaveBeenCalledTimes(1);

            const syncStatus = await adapter.getSyncStatus(CORE_RULES_SYNC_KEY);
            expect(syncStatus!.sha).toBe('newSha');
        });

        /**
         * Test: load() memoizes the promise — concurrent calls return same promise.
         */
        it('memoizes the promise — concurrent calls return same promise', async () => {
            const mockGameSystem = createMockGameSystem();
            const mockXmlContent = '<gameSystem>test</gameSystem>';

            githubClient.fileContents.set(CORE_RULES_FILE, mockXmlContent);
            githubClient.fileShas.set(CORE_RULES_FILE, 'sha123');
            githubClient.files = [];

            vi.mocked(parseGameSystem).mockReturnValue(mockGameSystem);

            const promise1 = dao.load();
            const promise2 = dao.load();
            const promise3 = dao.load();

            const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);

            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
            expect(githubClient.downloadedPaths.length).toBe(1);
            expect(parseGameSystem).toHaveBeenCalledTimes(1);
        });
    });

    describe('Edge cases', () => {
        /**
         * Test: Empty files array results in zero factions discovered.
         */
        it('discovers zero factions when githubClient.files returns empty array', async () => {
            const mockGameSystem = createMockGameSystem();
            const mockXmlContent = '<gameSystem>test</gameSystem>';

            githubClient.fileContents.set(CORE_RULES_FILE, mockXmlContent);
            githubClient.fileShas.set(CORE_RULES_FILE, 'sha123');
            githubClient.files = [];

            vi.mocked(parseGameSystem).mockReturnValue(mockGameSystem);

            await dao.load();

            const factions = await adapter.getAll('faction');
            expect(factions).toHaveLength(0);
        });

        /**
         * Test: Mixed .cat and non-.cat files — only .cat files processed.
         */
        it('only processes .cat files (filters out non-.cat files)', async () => {
            const mockGameSystem = createMockGameSystem();
            const mockXmlContent = '<gameSystem>test</gameSystem>';

            githubClient.fileContents.set(CORE_RULES_FILE, mockXmlContent);
            githubClient.fileShas.set(CORE_RULES_FILE, 'sha123');

            githubClient.files = [
                {
                    name: 'Imperium - Space Marines.cat',
                    path: 'Imperium - Space Marines.cat',
                    sha: 'faction-sha-1',
                    size: 1000,
                    download_url: 'https://test.com/sm.cat',
                    type: 'file',
                },
                {
                    name: 'README.md',
                    path: 'README.md',
                    sha: 'readme-sha',
                    size: 500,
                    download_url: 'https://test.com/readme.md',
                    type: 'file',
                },
                {
                    name: 'Warhammer 40,000.gst',
                    path: 'Warhammer 40,000.gst',
                    sha: 'gst-sha',
                    size: 5000,
                    download_url: 'https://test.com/core.gst',
                    type: 'file',
                },
                {
                    name: 'Chaos - Death Guard.cat',
                    path: 'Chaos - Death Guard.cat',
                    sha: 'faction-sha-2',
                    size: 2000,
                    download_url: 'https://test.com/dg.cat',
                    type: 'file',
                },
                {
                    name: '.github',
                    path: '.github',
                    sha: 'dir-sha',
                    size: 0,
                    download_url: null,
                    type: 'dir',
                },
            ];

            vi.mocked(parseGameSystem).mockReturnValue(mockGameSystem);

            await dao.load();

            const factions = await adapter.getAll('faction');
            expect(factions).toHaveLength(2);

            const factionNames = factions.map((faction: Faction) => faction.name);
            expect(factionNames).toContain('Space Marines');
            expect(factionNames).toContain('Death Guard');
            expect(factionNames).not.toContain('README');
            expect(factionNames).not.toContain('Warhammer 40,000');
        });

        /**
         * Test: Directories with .cat extension are filtered out (type must be 'file').
         */
        it('filters out directories with .cat extension (type must be file)', async () => {
            const mockGameSystem = createMockGameSystem();
            const mockXmlContent = '<gameSystem>test</gameSystem>';

            githubClient.fileContents.set(CORE_RULES_FILE, mockXmlContent);
            githubClient.fileShas.set(CORE_RULES_FILE, 'sha123');

            githubClient.files = [
                {
                    name: 'Imperium - Space Marines.cat',
                    path: 'Imperium - Space Marines.cat',
                    sha: 'faction-sha-1',
                    size: 1000,
                    download_url: 'https://test.com/sm.cat',
                    type: 'file',
                },
                {
                    name: 'archive.cat',
                    path: 'archive.cat',
                    sha: 'dir-sha',
                    size: 0,
                    download_url: null,
                    type: 'dir',
                },
            ];

            vi.mocked(parseGameSystem).mockReturnValue(mockGameSystem);

            await dao.load();

            const factions = await adapter.getAll('faction');
            expect(factions).toHaveLength(1);
            expect(factions[0].name).toBe('Space Marines');
        });
    });
});
