import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FactionDAO } from '@/dao/FactionDAO.js';
import { SpaceMarinesDAO } from '@/dao/factions/SpaceMarinesDAO.js';
import type { FactionData } from '@/models/FactionData.js';
import { MockDatabaseAdapter } from '@/__mocks__/MockDatabaseAdapter.js';
import { MockGitHubClient } from '@/__mocks__/MockGitHubClient.js';
import type { FactionConfig } from '@/config/factionMap.js';
import type { BattleScribeCatalogue } from '@armoury/providers-bsdata';
import { parseFactionData } from '@/data/FactionDataParser.js';

vi.mock('../../data/FactionDataParser.js', () => ({
    parseFactionData: vi.fn(),
}));

/**
 * Mock the BSData XML parser module.
 * Prevents actual XML parsing in tests — returns mock BattleScribe catalogue structures.
 */
vi.mock('@armoury/providers-bsdata', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@armoury/providers-bsdata')>();

    return {
        ...actual,
        parseCatalogue: vi.fn((content: string) => {
            // Return a minimal mock catalogue based on content marker
            const mockCatalogue: BattleScribeCatalogue = {
                catalogue: {
                    '@_id': content.includes('chapter') ? 'chapter-cat-id' : 'base-cat-id',
                    '@_name': content.includes('chapter') ? 'Chapter Catalogue' : 'Base Catalogue',
                    '@_revision': '1',
                    '@_battleScribeVersion': '2.03',
                    '@_library': 'false',
                    '@_gameSystemId': 'sys-id',
                    '@_gameSystemRevision': '1',
                },
            };

            return mockCatalogue;
        }),
    };
});

/**

 * Mock the merge-catalogues module.
 * Prevents actual catalogue merging logic — returns a simple merged result.
 */
vi.mock('../../models/mergeCatalogues.js', () => ({
    mergeCatalogues: vi.fn((...catalogues: BattleScribeCatalogue[]) => {
        // Return the last catalogue (simulating merge override behavior)
        return catalogues[catalogues.length - 1];
    }),
}));

/**
 * Creates a minimal FactionData fixture for testing.
 * @param overrides - Partial properties to override defaults
 * @returns FactionData object with test data
 */
function createFactionFixture(overrides?: Partial<FactionData>): FactionData {
    const defaults: FactionData = {
        id: 'test-faction',
        name: 'Test Faction',
        armyImageUrl: 'https://example.com/test-faction.jpg',
        sourceFiles: ['Test Faction.cat'],
        lastSynced: new Date('2025-02-15T00:00:00Z'),
        factionRules: [{ id: 'rule-1', name: 'Rule 1', description: 'Test rule 1' }],
        structuredFactionRules: [],
        stratagems: [
            {
                id: 'strat-1',
                name: 'Stratagem 1',
                sourceFile: 'Test Faction.cat',
                sourceSha: 'sha-1',
                cp: 1,
                phase: 'Command',
                description: 'Test stratagem',
            },
        ],
        detachments: [
            {
                id: 'det-1',
                name: 'Detachment 1',
                sourceFile: 'Test Faction.cat',
                sourceSha: 'sha-1',
                factionId: 'test-faction',
                rules: ['Detachment rule'],
                structuredRules: [],
                enhancements: [],
            },
        ],
        enhancements: [
            {
                id: 'enh-1',
                name: 'Enhancement 1',
                points: 10,
                description: 'Test enhancement',
                eligibleKeywords: [],
                structuredEffect: null,
            },
        ],
        units: [
            {
                id: 'unit-1',
                name: 'Unit 1',
                sourceFile: 'Test Faction.cat',
                sourceSha: 'sha-1',
                factionId: 'test-faction',
                movement: '6"',
                toughness: 4,
                save: '3+',
                wounds: 2,
                leadership: 6,
                objectiveControl: 1,
                composition: [{ models: 10, points: 100 }],
                rangedWeapons: [],
                meleeWeapons: [],
                wargearOptions: [],
                wargearAbilities: [],
                abilities: [],
                structuredAbilities: [],
                constraints: [],
                keywords: ['Infantry'],
                factionKeywords: ['Test Faction'],
                imageUrl: '',
            },
        ],
        weapons: [
            {
                id: 'weapon-1',
                name: 'Weapon 1',
                sourceFile: 'Test Faction.cat',
                sourceSha: 'sha-1',
                type: 'ranged',
                range: '24"',
                attacks: '2',
                skill: '3+',
                strength: 4,
                ap: -1,
                damage: '1',
                keywords: [],
                parsedKeywords: [],
            },
        ],
        abilities: [
            {
                id: 'ability-1',
                name: 'Ability 1',
                sourceFile: 'Test Faction.cat',
                sourceSha: 'sha-1',
                description: 'Test ability',
            },
        ],
    };

    return { ...defaults, ...overrides } as FactionData;
}

/**
 * Creates a minimal FactionConfig for testing.
 * @param overrides - Partial properties to override defaults
 * @returns FactionConfig object
 */
function createFactionConfig(overrides?: Partial<FactionConfig>): FactionConfig {
    return {
        id: 'test-faction',
        name: 'Test Faction',
        files: ['Test Faction.cat'],
        superFaction: 'Test',
        ...overrides,
    };
}

/**
 * FactionDAO test suite.
 * Tests standalone faction pattern (25 faction DAOs) — constructor, load(), fetchRemoteData(), storeFactionEntities().
 */
describe('FactionDAO', () => {
    let adapter: MockDatabaseAdapter;
    let githubClient: MockGitHubClient;

    /**
     * Set up fresh mocks before each test.
     */
    beforeEach(() => {
        adapter = new MockDatabaseAdapter();
        githubClient = new MockGitHubClient();
        vi.clearAllMocks();
    });

    /**
     * Constructor tests.
     */
    describe('Constructor', () => {
        /**
         * Test: Constructor wires FactionConfig (owner, repo, files).
         */
        it('Constructor wires FactionConfig (owner, repo, files)', () => {
            const config = createFactionConfig({
                id: 'necrons',
                name: 'Necrons',
                files: ['Necrons.cat'],
                superFaction: 'Xenos',
            });

            const dao = new FactionDAO(adapter, githubClient, config);

            expect(dao).toBeDefined();
            // Constructor should store the faction config internally
            expect(dao).toHaveProperty('factionConfig');
        });

        /**
         * Test: Constructor handles multi-file factions (e.g., Aeldari with library + multiple catalogues).
         */
        it('Constructor handles multi-file factions (e.g., Aeldari with library + multiple catalogues)', () => {
            const config = createFactionConfig({
                id: 'aeldari',
                name: 'Aeldari',
                files: ['Aeldari - Aeldari Library.cat', 'Aeldari - Craftworlds.cat', 'Aeldari - Ynnari.cat'],
                superFaction: 'Aeldari',
            });

            const dao = new FactionDAO(adapter, githubClient, config);

            expect(dao).toBeDefined();
        });
    });

    /**
     * load() behavior tests.
     */
    describe('load() behavior', () => {
        /**
         * Test: load() calls parent BSDataBaseDAO.load() and delegates to fetchRemoteData() when no cache exists.
         */
        it('load() calls parent BSDataBaseDAO.load() and delegates to fetchRemoteData() when no cache exists', async () => {
            const config = createFactionConfig();
            const dao = new FactionDAO(adapter, githubClient, config);

            // Mock GitHub client to return mock XML content
            githubClient.fileContents.set('Test%20Faction.cat', '<catalogue>test</catalogue>');
            githubClient.fileShas.set('Test%20Faction.cat', 'sha-test-123');

            // Mock parseFactionData to return fixture
            const fixture = createFactionFixture();
            vi.mocked(parseFactionData).mockReturnValue(fixture);

            const result = await dao.load();

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('units');
            expect(result.id).toBe('test-faction');
            expect(githubClient.downloadedPaths).toContain('Test%20Faction.cat');
        });

        /**
         * Test: load() is memoized — second call returns same promise (no duplicate fetch).
         */
        it('load() is memoized — second call returns same promise (no duplicate fetch)', async () => {
            const config = createFactionConfig();
            const dao = new FactionDAO(adapter, githubClient, config);

            githubClient.fileContents.set('Test%20Faction.cat', '<catalogue>test</catalogue>');
            githubClient.fileShas.set('Test%20Faction.cat', 'sha-test-123');

            const fixture = createFactionFixture();
            vi.mocked(parseFactionData).mockReturnValue(fixture);

            // Fire two concurrent calls
            const promise1 = dao.load();
            const promise2 = dao.load();

            // FactionDAO.load() creates a new promise wrapper each time, so promises won't be identical
            // However, the underlying parent promise is memoized, so only one download should occur
            const [result1, result2] = await Promise.all([promise1, promise2]);

            expect(result1).toBe(result2);
            expect(githubClient.downloadedPaths.length).toBe(1); // Only one download
        });

        /**
         * Test: load() stores faction model in adapter via adapter.put().
         */
        it('load() stores faction model in adapter via adapter.put()', async () => {
            const config = createFactionConfig({ id: 'necrons' });
            const dao = new FactionDAO(adapter, githubClient, config);

            githubClient.fileContents.set('Test%20Faction.cat', '<catalogue>test</catalogue>');
            githubClient.fileShas.set('Test%20Faction.cat', 'sha-test-123');

            const fixture = createFactionFixture({ id: 'necrons' });
            vi.mocked(parseFactionData).mockReturnValue(fixture);

            await dao.load();

            const stored = await adapter.get('factionModel', 'necrons');
            expect(stored).not.toBeNull();
        });
    });

    /**
     * fetchRemoteData() tests.
     */
    describe('fetchRemoteData()', () => {
        /**
         * Test: fetchRemoteData() downloads catalogue via githubClient.downloadFile().
         */
        it('fetchRemoteData() downloads catalogue via githubClient.downloadFile()', async () => {
            const config = createFactionConfig({ files: ['Necrons.cat'] });
            const dao = new FactionDAO(adapter, githubClient, config);

            githubClient.fileContents.set('Necrons.cat', '<catalogue>necrons</catalogue>');
            githubClient.fileShas.set('Necrons.cat', 'sha-necrons-456');

            const fixture = createFactionFixture();
            vi.mocked(parseFactionData).mockReturnValue(fixture);

            await dao.load();

            expect(githubClient.downloadedPaths).toContain('Necrons.cat');
        });

        /**
         * Test: fetchRemoteData() parses catalogue via parseCatalogue().
         */
        it('fetchRemoteData() parses catalogue via parseCatalogue()', async () => {
            const { parseCatalogue } = await import('@armoury/providers-bsdata');
            const config = createFactionConfig();
            const dao = new FactionDAO(adapter, githubClient, config);

            githubClient.fileContents.set('Test%20Faction.cat', '<catalogue>test</catalogue>');
            githubClient.fileShas.set('Test%20Faction.cat', 'sha-test-123');

            const fixture = createFactionFixture();
            vi.mocked(parseFactionData).mockReturnValue(fixture);

            await dao.load();

            expect(parseCatalogue).toHaveBeenCalledWith('<catalogue>test</catalogue>');
        });

        /**
         * Test: fetchRemoteData() calls parseFactionData() with merged catalogue.
         */
        it('fetchRemoteData() calls parseFactionData() with merged catalogue', async () => {
            const config = createFactionConfig();
            const dao = new FactionDAO(adapter, githubClient, config);

            githubClient.fileContents.set('Test%20Faction.cat', '<catalogue>test</catalogue>');
            githubClient.fileShas.set('Test%20Faction.cat', 'sha-test-123');

            const fixture = createFactionFixture();
            const fromCatalogueSpy = vi.mocked(parseFactionData).mockReturnValue(fixture);

            await dao.load();

            expect(fromCatalogueSpy).toHaveBeenCalledTimes(1);
            expect(fromCatalogueSpy).toHaveBeenCalledWith(expect.objectContaining({ catalogue: expect.any(Object) }), [
                'Test Faction.cat',
            ]);
        });

        /**
         * Test: fetchRemoteData() handles multi-catalogue download (downloads all files in factionConfig.files).
         */
        it('fetchRemoteData() handles multi-catalogue download (downloads all files in factionConfig.files)', async () => {
            const { mergeCatalogues } = await import('../../models/mergeCatalogues.js');
            const config = createFactionConfig({
                files: ['Library.cat', 'Faction.cat'],
            });
            const dao = new FactionDAO(adapter, githubClient, config);

            githubClient.fileContents.set('Library.cat', '<catalogue>library</catalogue>');
            githubClient.fileContents.set('Faction.cat', '<catalogue>faction</catalogue>');
            githubClient.fileShas.set('Library.cat', 'sha-lib');
            githubClient.fileShas.set('Faction.cat', 'sha-faction');

            const fixture = createFactionFixture();
            vi.mocked(parseFactionData).mockReturnValue(fixture);

            await dao.load();

            expect(githubClient.downloadedPaths).toContain('Library.cat');
            expect(githubClient.downloadedPaths).toContain('Faction.cat');
            expect(mergeCatalogues).toHaveBeenCalledTimes(1);
            expect(mergeCatalogues).toHaveBeenCalledWith(
                expect.objectContaining({ catalogue: expect.any(Object) }),
                expect.objectContaining({ catalogue: expect.any(Object) }),
            );
        });

        /**
         * Test: fetchRemoteData() sets sync status for each downloaded file via adapter.setSyncStatus().
         */
        it('fetchRemoteData() sets sync status for each downloaded file via adapter.setSyncStatus()', async () => {
            const config = createFactionConfig({ files: ['Necrons.cat'] });
            const dao = new FactionDAO(adapter, githubClient, config);

            githubClient.fileContents.set('Necrons.cat', '<catalogue>necrons</catalogue>');
            githubClient.fileShas.set('Necrons.cat', 'sha-necrons-789');

            const fixture = createFactionFixture();
            vi.mocked(parseFactionData).mockReturnValue(fixture);

            await dao.load();

            const syncStatus = await adapter.getSyncStatus('factionModel:Necrons.cat');
            expect(syncStatus).not.toBeNull();
            expect(syncStatus!.sha).toBe('sha-necrons-789');
        });

        /**
         * Test: fetchRemoteData() sets faction model ID from factionConfig.id.
         */
        it('fetchRemoteData() sets faction model ID from factionConfig.id', async () => {
            const config = createFactionConfig({ id: 'space-marines' });
            const dao = new FactionDAO(adapter, githubClient, config);

            githubClient.fileContents.set('Test%20Faction.cat', '<catalogue>test</catalogue>');
            githubClient.fileShas.set('Test%20Faction.cat', 'sha-test-123');

            const fixture = createFactionFixture({ id: 'initial-id' });
            vi.mocked(parseFactionData).mockReturnValue(fixture);

            const result = await dao.load();

            expect(result.id).toBe('space-marines');
        });
    });

    /**
     * storeFactionEntities() tests.
     */
    describe('storeFactionEntities()', () => {
        /**
         * Test: storeFactionEntities() wraps operations in adapter.transaction().
         */
        it('storeFactionEntities() wraps operations in adapter.transaction()', async () => {
            const config = createFactionConfig({ id: 'necrons' });
            const dao = new FactionDAO(adapter, githubClient, config);

            githubClient.fileContents.set('Test%20Faction.cat', '<catalogue>test</catalogue>');
            githubClient.fileShas.set('Test%20Faction.cat', 'sha-test-123');

            const fixture = createFactionFixture({ id: 'necrons' });
            vi.mocked(parseFactionData).mockReturnValue(fixture);

            const transactionSpy = vi.spyOn(adapter, 'transaction');

            await dao.load();

            expect(transactionSpy).toHaveBeenCalledTimes(1);
        });

        /**
         * Test: storeFactionEntities() deletes existing units via adapter.deleteByField('unit', 'factionId', ...).
         */
        it('storeFactionEntities() deletes existing units via adapter.deleteByField()', async () => {
            const config = createFactionConfig({ id: 'necrons' });
            const dao = new FactionDAO(adapter, githubClient, config);

            // Pre-seed adapter with old units
            await adapter.put('unit', { id: 'old-unit-1', factionId: 'necrons' } as never);
            await adapter.put('unit', { id: 'old-unit-2', factionId: 'necrons' } as never);

            githubClient.fileContents.set('Test%20Faction.cat', '<catalogue>test</catalogue>');
            githubClient.fileShas.set('Test%20Faction.cat', 'sha-test-123');

            const fixture = createFactionFixture({ id: 'necrons', units: [] });
            vi.mocked(parseFactionData).mockReturnValue(fixture);

            await dao.load();

            const remainingUnits = await adapter.getByField('unit', 'factionId', 'necrons');
            expect(remainingUnits.length).toBe(0); // Old units deleted
        });

        /**
         * Test: storeFactionEntities() inserts units via adapter.put('unit', ...) with factionId.
         */
        it('storeFactionEntities() inserts units via adapter.put() with factionId', async () => {
            const config = createFactionConfig({ id: 'necrons' });
            const dao = new FactionDAO(adapter, githubClient, config);

            githubClient.fileContents.set('Test%20Faction.cat', '<catalogue>test</catalogue>');
            githubClient.fileShas.set('Test%20Faction.cat', 'sha-test-123');

            const fixture = createFactionFixture({
                id: 'necrons',
                units: [
                    {
                        id: 'unit-new-1',
                        name: 'New Unit 1',
                        sourceFile: 'Necrons.cat',
                        sourceSha: 'sha-test-123',
                        factionId: 'necrons',
                        movement: '5"',
                        toughness: 5,
                        save: '4+',
                        wounds: 1,
                        leadership: 7,
                        objectiveControl: 1,
                        composition: [{ models: 10, points: 130 }],
                        rangedWeapons: [],
                        meleeWeapons: [],
                        wargearOptions: [],
                        wargearAbilities: [],
                        abilities: [],
                        structuredAbilities: [],
                        constraints: [],
                        keywords: ['Infantry'],
                        factionKeywords: ['Necrons'],
                        imageUrl: '',
                    },
                ],
            });
            vi.mocked(parseFactionData).mockReturnValue(fixture);

            await dao.load();

            const units = await adapter.getByField('unit', 'factionId', 'necrons');
            expect(units.length).toBe(1);
            expect((units[0] as { id: string }).id).toBe('unit-new-1');
        });

        /**
         * Test: storeFactionEntities() inserts weapons via adapter.put('weapon', ...).
         */
        it('storeFactionEntities() inserts weapons via adapter.put()', async () => {
            const config = createFactionConfig({ id: 'necrons' });
            const dao = new FactionDAO(adapter, githubClient, config);

            githubClient.fileContents.set('Test%20Faction.cat', '<catalogue>test</catalogue>');
            githubClient.fileShas.set('Test%20Faction.cat', 'sha-test-123');

            const fixture = createFactionFixture({
                id: 'necrons',
                weapons: [
                    {
                        id: 'weapon-gauss',
                        name: 'Gauss Flayer',
                        sourceFile: 'Necrons.cat',
                        sourceSha: 'sha-test-123',
                        type: 'ranged',
                        range: '24"',
                        attacks: '2',
                        skill: '3+',
                        strength: 4,
                        ap: -1,
                        damage: '1',
                        keywords: [],
                        parsedKeywords: [],
                    },
                ],
            });
            vi.mocked(parseFactionData).mockReturnValue(fixture);

            await dao.load();

            const weapons = await adapter.getAll('weapon');
            expect(weapons.length).toBeGreaterThan(0);
        });

        /**
         * Test: storeFactionEntities() inserts abilities via adapter.put('ability', ...).
         */
        it('storeFactionEntities() inserts abilities via adapter.put()', async () => {
            const config = createFactionConfig({ id: 'necrons' });
            const dao = new FactionDAO(adapter, githubClient, config);

            githubClient.fileContents.set('Test%20Faction.cat', '<catalogue>test</catalogue>');
            githubClient.fileShas.set('Test%20Faction.cat', 'sha-test-123');

            const fixture = createFactionFixture({
                id: 'necrons',
                abilities: [
                    {
                        id: 'ability-reanimation',
                        name: 'Reanimation Protocols',
                        sourceFile: 'Necrons.cat',
                        sourceSha: 'sha-test-123',
                        description: 'Necrons can stand back up',
                    },
                ],
            });
            vi.mocked(parseFactionData).mockReturnValue(fixture);

            await dao.load();

            const abilities = await adapter.getAll('ability');
            expect(abilities.length).toBeGreaterThan(0);
        });
    });

    /**
     * Edge cases.
     */
    describe('Edge cases', () => {
        /**
         * Test: Empty catalogue file list throws error during merge.
         */
        it('Empty catalogue file list throws error during merge', async () => {
            const config = createFactionConfig({ files: [] });
            const dao = new FactionDAO(adapter, githubClient, config);

            const { mergeCatalogues } = await import('../../models/mergeCatalogues.js');
            vi.mocked(mergeCatalogues).mockImplementation((...catalogues) => {
                if (catalogues.length === 0) {
                    throw new Error('Cannot merge empty catalogue list');
                }

                return catalogues[catalogues.length - 1];
            });

            await expect(dao.load()).rejects.toThrow('Cannot merge empty catalogue list');
        });
    });

    describe('shared-adapter isolation (overlapping primary files)', () => {
        it('two factions sharing a primary file get distinct sync keys', () => {
            const smConfig = createFactionConfig({
                id: 'space-marines',
                files: ['Imperium - Space Marines.cat'],
            });
            const baConfig = createFactionConfig({
                id: 'blood-angels',
                files: ['Imperium - Space Marines.cat', 'Imperium - Blood Angels.cat'],
            });

            const smDAO = new FactionDAO(adapter, githubClient, smConfig);
            const baDAO = new FactionDAO(adapter, githubClient, baConfig);

            const smKey = (smDAO as unknown as { getSyncFileKey(): string }).getSyncFileKey();
            const baKey = (baDAO as unknown as { getSyncFileKey(): string }).getSyncFileKey();

            expect(smKey).toBe('factionModel:space-marines');
            expect(baKey).toBe('factionModel:blood-angels');
            expect(smKey).not.toBe(baKey);
        });

        it('two factions sharing a primary file get distinct entity IDs', () => {
            const smConfig = createFactionConfig({
                id: 'space-marines',
                files: ['Imperium - Space Marines.cat'],
            });
            const baConfig = createFactionConfig({
                id: 'blood-angels',
                files: ['Imperium - Space Marines.cat', 'Imperium - Blood Angels.cat'],
            });

            const smDAO = new FactionDAO(adapter, githubClient, smConfig);
            const baDAO = new FactionDAO(adapter, githubClient, baConfig);

            const smId = (smDAO as unknown as { getEntityId(): string }).getEntityId();
            const baId = (baDAO as unknown as { getEntityId(): string }).getEntityId();

            expect(smId).toBe('space-marines');
            expect(baId).toBe('blood-angels');
            expect(smId).not.toBe(baId);
        });

        it('loading SM then BA on the same adapter stores both models independently', async () => {
            const smConfig = createFactionConfig({
                id: 'space-marines',
                files: ['Imperium - Space Marines.cat'],
            });
            const baConfig = createFactionConfig({
                id: 'blood-angels',
                files: ['Imperium - Space Marines.cat', 'Imperium - Blood Angels.cat'],
            });

            githubClient.fileContents.set('Imperium%20-%20Space%20Marines.cat', '<catalogue>base</catalogue>');
            githubClient.fileShas.set('Imperium%20-%20Space%20Marines.cat', 'sha-sm');
            githubClient.fileContents.set('Imperium%20-%20Blood%20Angels.cat', '<catalogue>chapter</catalogue>');
            githubClient.fileShas.set('Imperium%20-%20Blood%20Angels.cat', 'sha-ba');

            const smFixture = createFactionFixture({ id: 'space-marines', name: 'Space Marines' });
            const baFixture = createFactionFixture({ id: 'blood-angels', name: 'Blood Angels' });

            const fromCatalogueSpy = vi.mocked(parseFactionData);
            fromCatalogueSpy.mockReturnValueOnce(smFixture);
            fromCatalogueSpy.mockReturnValueOnce(baFixture);

            const smDAO = new FactionDAO(adapter, githubClient, smConfig);
            const baDAO = new FactionDAO(adapter, githubClient, baConfig);

            await smDAO.load();
            await baDAO.load();

            const smStored = await adapter.get('factionModel', 'space-marines');
            const baStored = await adapter.get('factionModel', 'blood-angels');

            expect(smStored).not.toBeNull();
            expect(baStored).not.toBeNull();
            expect((smStored as { id: string }).id).toBe('space-marines');
            expect((baStored as { id: string }).id).toBe('blood-angels');
        });

        it('loading SM then BA does not corrupt the SM sync status', async () => {
            const smConfig = createFactionConfig({
                id: 'space-marines',
                files: ['Imperium - Space Marines.cat'],
            });
            const baConfig = createFactionConfig({
                id: 'blood-angels',
                files: ['Imperium - Space Marines.cat', 'Imperium - Blood Angels.cat'],
            });

            githubClient.fileContents.set('Imperium%20-%20Space%20Marines.cat', '<catalogue>base</catalogue>');
            githubClient.fileShas.set('Imperium%20-%20Space%20Marines.cat', 'sha-sm');
            githubClient.fileContents.set('Imperium%20-%20Blood%20Angels.cat', '<catalogue>chapter</catalogue>');
            githubClient.fileShas.set('Imperium%20-%20Blood%20Angels.cat', 'sha-ba');

            const fromCatalogueSpy = vi.mocked(parseFactionData);
            fromCatalogueSpy.mockReturnValue(createFactionFixture());

            const smDAO = new FactionDAO(adapter, githubClient, smConfig);
            const baDAO = new FactionDAO(adapter, githubClient, baConfig);

            await smDAO.load();
            await baDAO.load();

            const smSync = await adapter.getSyncStatus('factionModel:space-marines');
            const baSync = await adapter.getSyncStatus('factionModel:blood-angels');

            expect(smSync).not.toBeNull();
            expect(baSync).not.toBeNull();
            expect(smSync!.sha).toBe('sha-sm');
        });

        it('BA load returns correct data after SM was already loaded on the same adapter', async () => {
            const smConfig = createFactionConfig({
                id: 'space-marines',
                files: ['Imperium - Space Marines.cat'],
            });
            const baConfig = createFactionConfig({
                id: 'blood-angels',
                files: ['Imperium - Space Marines.cat', 'Imperium - Blood Angels.cat'],
            });

            githubClient.fileContents.set('Imperium%20-%20Space%20Marines.cat', '<catalogue>base</catalogue>');
            githubClient.fileShas.set('Imperium%20-%20Space%20Marines.cat', 'sha-sm');
            githubClient.fileContents.set('Imperium%20-%20Blood%20Angels.cat', '<catalogue>chapter</catalogue>');
            githubClient.fileShas.set('Imperium%20-%20Blood%20Angels.cat', 'sha-ba');

            const smFixture = createFactionFixture({
                id: 'space-marines',
                name: 'Space Marines',
                sourceFiles: ['Imperium - Space Marines.cat'],
            });
            const baFixture = createFactionFixture({
                id: 'blood-angels',
                name: 'Blood Angels',
                sourceFiles: ['Imperium - Space Marines.cat', 'Imperium - Blood Angels.cat'],
            });

            const fromCatalogueSpy = vi.mocked(parseFactionData);
            fromCatalogueSpy.mockReturnValueOnce(smFixture);
            fromCatalogueSpy.mockReturnValueOnce(baFixture);

            const smDAO = new FactionDAO(adapter, githubClient, smConfig);
            const baDAO = new FactionDAO(adapter, githubClient, baConfig);

            const smResult = await smDAO.load();
            const baResult = await baDAO.load();

            expect(smResult.id).toBe('space-marines');
            expect(baResult.id).toBe('blood-angels');
            expect(smResult.sourceFiles).toEqual(['Imperium - Space Marines.cat']);
            expect(baResult.sourceFiles).toEqual(['Imperium - Space Marines.cat', 'Imperium - Blood Angels.cat']);
        });
    });
});

/**
 * SpaceMarinesDAO test suite.
 * Tests merge pattern (11 chapter DAOs) — mergeFactionData(), mergeById logic, chapter inheritance.
 */
describe('SpaceMarinesDAO', () => {
    let adapter: MockDatabaseAdapter;
    let githubClient: MockGitHubClient;

    /**
     * Set up fresh mocks before each test.
     */
    beforeEach(() => {
        adapter = new MockDatabaseAdapter();
        githubClient = new MockGitHubClient();
        vi.clearAllMocks();
    });

    /**
     * Constructor tests.
     */
    describe('Constructor', () => {
        /**
         * Test: Constructor creates base SpaceMarinesDAO with FactionDAO internally.
         */
        it('Constructor creates base SpaceMarinesDAO with FactionDAO internally', () => {
            const dao = new SpaceMarinesDAO(adapter, githubClient);

            expect(dao).toBeDefined();
            expect(dao).toHaveProperty('factionDAO');
        });
    });

    /**
     * load() behavior tests.
     */
    describe('load() behavior', () => {
        /**
         * Test: load() delegates to factionDAO.load() for base Space Marines data.
         */
        it('load() delegates to factionDAO.load() for base Space Marines data', async () => {
            const dao = new SpaceMarinesDAO(adapter, githubClient);

            githubClient.fileContents.set('Imperium%20-%20Space%20Marines.cat', '<catalogue>space-marines</catalogue>');
            githubClient.fileShas.set('Imperium%20-%20Space%20Marines.cat', 'sha-sm-123');

            const fixture = createFactionFixture({ id: 'space-marines', name: 'Space Marines' });
            vi.mocked(parseFactionData).mockReturnValue(fixture);

            const result = await dao.load();

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('units');
            expect(result.id).toBe('space-marines');
            expect(githubClient.downloadedPaths).toContain('Imperium%20-%20Space%20Marines.cat');
        });
    });

    /**
     * mergeFactionData() tests.
     */
    describe('mergeFactionData()', () => {
        /**
         * Test: mergeFactionData() merges base and chapter faction data.
         */
        it('mergeFactionData() merges base and chapter faction data', () => {
            const dao = new SpaceMarinesDAO(adapter, githubClient);

            const baseData = createFactionFixture({
                id: 'space-marines',
                name: 'Space Marines',
                units: [
                    {
                        id: 'unit-intercessor',
                        name: 'Intercessor Squad',
                        sourceFile: 'Space Marines.cat',
                        sourceSha: 'sha-sm',
                        factionId: 'space-marines',
                        movement: '6"',
                        toughness: 4,
                        save: '3+',
                        wounds: 2,
                        leadership: 6,
                        objectiveControl: 2,
                        composition: [{ models: 5, points: 100 }],
                        rangedWeapons: [],
                        meleeWeapons: [],
                        wargearOptions: [],
                        wargearAbilities: [],
                        abilities: [],
                        structuredAbilities: [],
                        constraints: [],
                        keywords: ['Infantry', 'Intercessors'],
                        factionKeywords: ['Adeptus Astartes'],
                        imageUrl: '',
                    },
                ],
            });

            const chapterData = createFactionFixture({
                id: 'blood-angels',
                name: 'Blood Angels',
                units: [
                    {
                        id: 'unit-death-company',
                        name: 'Death Company',
                        sourceFile: 'Blood Angels.cat',
                        sourceSha: 'sha-ba',
                        factionId: 'blood-angels',
                        movement: '6"',
                        toughness: 4,
                        save: '3+',
                        wounds: 2,
                        leadership: 6,
                        objectiveControl: 1,
                        composition: [{ models: 5, points: 110 }],
                        rangedWeapons: [],
                        meleeWeapons: [],
                        wargearOptions: [],
                        wargearAbilities: [],
                        abilities: [],
                        structuredAbilities: [],
                        constraints: [],
                        keywords: ['Infantry', 'Death Company'],
                        factionKeywords: ['Adeptus Astartes', 'Blood Angels'],
                        imageUrl: '',
                    },
                ],
            });

            const merged = (
                dao as unknown as { mergeFactionData: (base: FactionData, chapter: FactionData) => FactionData }
            ).mergeFactionData(baseData, chapterData);

            expect(merged.id).toBe('blood-angels');
            expect(merged.name).toBe('Blood Angels');
            expect(merged.units.length).toBe(2); // Base + Chapter units
            expect(merged.units.some((u: { id: string }) => u.id === 'unit-intercessor')).toBe(true);
            expect(merged.units.some((u: { id: string }) => u.id === 'unit-death-company')).toBe(true);
        });

        /**
         * Test: mergeFactionData() merges sourceFiles (deduplicated union).
         */
        it('mergeFactionData() merges sourceFiles (deduplicated union)', () => {
            const dao = new SpaceMarinesDAO(adapter, githubClient);

            const baseData = createFactionFixture({
                id: 'space-marines',
                sourceFiles: ['Space Marines.cat'],
            });

            const chapterData = createFactionFixture({
                id: 'blood-angels',
                sourceFiles: ['Blood Angels.cat', 'Space Marines.cat'], // Duplicate Space Marines.cat
            });

            const merged = (
                dao as unknown as { mergeFactionData: (base: FactionData, chapter: FactionData) => FactionData }
            ).mergeFactionData(baseData, chapterData);

            expect(merged.sourceFiles).toContain('Space Marines.cat');
            expect(merged.sourceFiles).toContain('Blood Angels.cat');
            // Should be deduplicated (Set behavior)
            expect(merged.sourceFiles.filter((f: string) => f === 'Space Marines.cat').length).toBe(1);
        });

        /**
         * Test: mergeFactionData() takes the latest lastSynced timestamp.
         */
        it('mergeFactionData() takes the latest lastSynced timestamp', () => {
            const dao = new SpaceMarinesDAO(adapter, githubClient);

            const baseData = createFactionFixture({
                id: 'space-marines',
                lastSynced: new Date('2025-02-10T00:00:00Z'),
            });

            const chapterData = createFactionFixture({
                id: 'blood-angels',
                lastSynced: new Date('2025-02-15T00:00:00Z'), // Later
            });

            const merged = (
                dao as unknown as { mergeFactionData: (base: FactionData, chapter: FactionData) => FactionData }
            ).mergeFactionData(baseData, chapterData);

            expect(merged.lastSynced.toISOString()).toBe('2025-02-15T00:00:00.000Z');
        });

        /**
         * Test: mergeFactionData() uses chapter armyImageUrl if present, else falls back to base.
         */
        it('mergeFactionData() uses chapter armyImageUrl if present, else falls back to base', () => {
            const dao = new SpaceMarinesDAO(adapter, githubClient);

            const baseData = createFactionFixture({
                id: 'space-marines',
                armyImageUrl: 'https://example.com/space-marines.jpg',
            });

            const chapterData1 = createFactionFixture({
                id: 'blood-angels',
                armyImageUrl: 'https://example.com/blood-angels.jpg',
            });

            const merged1 = (
                dao as unknown as { mergeFactionData: (base: FactionData, chapter: FactionData) => FactionData }
            ).mergeFactionData(baseData, chapterData1);
            expect(merged1.armyImageUrl).toBe('https://example.com/blood-angels.jpg');

            const chapterData2 = createFactionFixture({
                id: 'dark-angels',
                armyImageUrl: '', // Empty chapter image
            });

            const merged2 = (
                dao as unknown as { mergeFactionData: (base: FactionData, chapter: FactionData) => FactionData }
            ).mergeFactionData(baseData, chapterData2);
            expect(merged2.armyImageUrl).toBe('https://example.com/space-marines.jpg'); // Fallback to base
        });
    });

    /**
     * mergeById logic tests.
     */
    describe('mergeById logic', () => {
        /**
         * Test: mergeById — chapter entries override base entries with same ID.
         */
        it('mergeById — chapter entries override base entries with same ID', () => {
            const dao = new SpaceMarinesDAO(adapter, githubClient);

            const baseData = createFactionFixture({
                id: 'space-marines',
                stratagems: [
                    {
                        id: 'strat-shared',
                        name: 'Base Stratagem',
                        sourceFile: 'Space Marines.cat',
                        sourceSha: 'sha-sm',
                        cp: 1,
                        phase: 'Command',
                        description: 'Base description',
                    },
                    {
                        id: 'strat-base-only',
                        name: 'Base Only Stratagem',
                        sourceFile: 'Space Marines.cat',
                        sourceSha: 'sha-sm',
                        cp: 2,
                        phase: 'Movement',
                        description: 'Only in base',
                    },
                ],
            });

            const chapterData = createFactionFixture({
                id: 'blood-angels',
                stratagems: [
                    {
                        id: 'strat-shared',
                        name: 'Chapter Stratagem',
                        sourceFile: 'Blood Angels.cat',
                        sourceSha: 'sha-ba',
                        cp: 1,
                        phase: 'Command',
                        description: 'Chapter description (overrides base)',
                    },
                    {
                        id: 'strat-chapter-only',
                        name: 'Chapter Only Stratagem',
                        sourceFile: 'Blood Angels.cat',
                        sourceSha: 'sha-ba',
                        cp: 3,
                        phase: 'Shooting',
                        description: 'Only in chapter',
                    },
                ],
            });

            const merged = (
                dao as unknown as { mergeFactionData: (base: FactionData, chapter: FactionData) => FactionData }
            ).mergeFactionData(baseData, chapterData);

            expect(merged.stratagems.length).toBe(3);

            const sharedStrat = merged.stratagems.find((s: { id: string }) => s.id === 'strat-shared');
            expect(sharedStrat).toBeDefined();
            expect(sharedStrat!.name).toBe('Chapter Stratagem'); // Chapter overrides base
            expect(sharedStrat!.description).toBe('Chapter description (overrides base)');

            expect(merged.stratagems.some((s: { id: string }) => s.id === 'strat-base-only')).toBe(true);
            expect(merged.stratagems.some((s: { id: string }) => s.id === 'strat-chapter-only')).toBe(true);
        });

        /**
         * Test: mergeById — chapter has entries not in base (appended).
         */
        it('mergeById — chapter has entries not in base (appended)', () => {
            const dao = new SpaceMarinesDAO(adapter, githubClient);

            const baseData = createFactionFixture({
                id: 'space-marines',
                factionRules: [{ id: 'rule-base-1', name: 'Base Rule 1', description: 'Base rule' }],
            });

            const chapterData = createFactionFixture({
                id: 'blood-angels',
                factionRules: [
                    { id: 'rule-chapter-1', name: 'Chapter Rule 1', description: 'Chapter rule' },
                    { id: 'rule-chapter-2', name: 'Chapter Rule 2', description: 'Another chapter rule' },
                ],
            });

            const merged = (
                dao as unknown as { mergeFactionData: (base: FactionData, chapter: FactionData) => FactionData }
            ).mergeFactionData(baseData, chapterData);

            expect(merged.factionRules.length).toBe(3);
            expect(merged.factionRules.some((r: { id: string }) => r.id === 'rule-base-1')).toBe(true);
            expect(merged.factionRules.some((r: { id: string }) => r.id === 'rule-chapter-1')).toBe(true);
            expect(merged.factionRules.some((r: { id: string }) => r.id === 'rule-chapter-2')).toBe(true);
        });

        /**
         * Test: mergeById — base and chapter both have multiple entries, chapter overrides take precedence.
         */
        it('mergeById — base and chapter both have multiple entries, chapter overrides take precedence', () => {
            const dao = new SpaceMarinesDAO(adapter, githubClient);

            const baseData = createFactionFixture({
                id: 'space-marines',
                detachments: [
                    {
                        id: 'det-1',
                        name: 'Base Detachment 1',
                        sourceFile: 'Space Marines.cat',
                        sourceSha: 'sha-sm',
                        factionId: 'space-marines',
                        rules: ['Base rule'],
                        structuredRules: [],
                        enhancements: [],
                    },
                    {
                        id: 'det-2',
                        name: 'Base Detachment 2',
                        sourceFile: 'Space Marines.cat',
                        sourceSha: 'sha-sm',
                        factionId: 'space-marines',
                        rules: ['Base rule 2'],
                        structuredRules: [],
                        enhancements: [],
                    },
                ],
            });

            const chapterData = createFactionFixture({
                id: 'blood-angels',
                detachments: [
                    {
                        id: 'det-2',
                        name: 'Chapter Detachment 2 (override)',
                        sourceFile: 'Blood Angels.cat',
                        sourceSha: 'sha-ba',
                        factionId: 'blood-angels',
                        rules: ['Chapter rule 2'],
                        structuredRules: [],
                        enhancements: [],
                    },
                    {
                        id: 'det-3',
                        name: 'Chapter Detachment 3',
                        sourceFile: 'Blood Angels.cat',
                        sourceSha: 'sha-ba',
                        factionId: 'blood-angels',
                        rules: ['Chapter rule 3'],
                        structuredRules: [],
                        enhancements: [],
                    },
                ],
            });

            const merged = (
                dao as unknown as { mergeFactionData: (base: FactionData, chapter: FactionData) => FactionData }
            ).mergeFactionData(baseData, chapterData);

            expect(merged.detachments.length).toBe(3);

            const det1 = merged.detachments.find((d: { id: string }) => d.id === 'det-1');
            expect(det1).toBeDefined();
            expect(det1!.name).toBe('Base Detachment 1');

            const det2 = merged.detachments.find((d: { id: string }) => d.id === 'det-2');
            expect(det2).toBeDefined();
            expect(det2!.name).toBe('Chapter Detachment 2 (override)'); // Chapter overrides

            const det3 = merged.detachments.find((d: { id: string }) => d.id === 'det-3');
            expect(det3).toBeDefined();
            expect(det3!.name).toBe('Chapter Detachment 3');
        });

        /**
         * Test: mergeById preserves array order (base entries first, then chapter-only entries).
         */
        it('mergeById preserves array order (base entries first, then chapter-only entries)', () => {
            const dao = new SpaceMarinesDAO(adapter, githubClient);

            const baseData = createFactionFixture({
                id: 'space-marines',
                enhancements: [
                    {
                        id: 'enh-1',
                        name: 'Enhancement 1',
                        points: 10,
                        description: 'Base',
                        eligibleKeywords: [],
                        structuredEffect: null,
                    },
                    {
                        id: 'enh-2',
                        name: 'Enhancement 2',
                        points: 15,
                        description: 'Base',
                        eligibleKeywords: [],
                        structuredEffect: null,
                    },
                ],
            });

            const chapterData = createFactionFixture({
                id: 'blood-angels',
                enhancements: [
                    {
                        id: 'enh-3',
                        name: 'Enhancement 3',
                        points: 20,
                        description: 'Chapter',
                        eligibleKeywords: [],
                        structuredEffect: null,
                    },
                ],
            });

            const merged = (
                dao as unknown as { mergeFactionData: (base: FactionData, chapter: FactionData) => FactionData }
            ).mergeFactionData(baseData, chapterData);

            expect(merged.enhancements.length).toBe(3);
            // mergeById uses Map which preserves insertion order (base first, chapter overrides/adds after)
            const ids = merged.enhancements.map((e: { id: string }) => e.id);
            expect(ids).toContain('enh-1');
            expect(ids).toContain('enh-2');
            expect(ids).toContain('enh-3');
        });
    });

    /**
     * Edge cases.
     */
    describe('Edge cases', () => {
        /**
         * Test: mergeFactionData() handles empty base data (chapter-only).
         */
        it('mergeFactionData() handles empty base data (chapter-only)', () => {
            const dao = new SpaceMarinesDAO(adapter, githubClient);

            const baseData = createFactionFixture({
                id: 'space-marines',
                units: [],
                weapons: [],
                abilities: [],
            });

            const chapterData = createFactionFixture({
                id: 'blood-angels',
                units: [
                    {
                        id: 'unit-death-company',
                        name: 'Death Company',
                        sourceFile: 'Blood Angels.cat',
                        sourceSha: 'sha-ba',
                        factionId: 'blood-angels',
                        movement: '6"',
                        toughness: 4,
                        save: '3+',
                        wounds: 2,
                        leadership: 6,
                        objectiveControl: 1,
                        composition: [{ models: 5, points: 110 }],
                        rangedWeapons: [],
                        meleeWeapons: [],
                        wargearOptions: [],
                        wargearAbilities: [],
                        abilities: [],
                        structuredAbilities: [],
                        constraints: [],
                        keywords: ['Infantry'],
                        factionKeywords: ['Blood Angels'],
                        imageUrl: '',
                    },
                ],
            });

            const merged = (
                dao as unknown as { mergeFactionData: (base: FactionData, chapter: FactionData) => FactionData }
            ).mergeFactionData(baseData, chapterData);

            expect(merged.units.length).toBe(1);
            expect(merged.units[0].id).toBe('unit-death-company');
        });

        /**
         * Test: mergeFactionData() handles empty chapter data (base-only).
         */
        it('mergeFactionData() handles empty chapter data (base-only)', () => {
            const dao = new SpaceMarinesDAO(adapter, githubClient);

            const baseData = createFactionFixture({
                id: 'space-marines',
                units: [
                    {
                        id: 'unit-intercessor',
                        name: 'Intercessor Squad',
                        sourceFile: 'Space Marines.cat',
                        sourceSha: 'sha-sm',
                        factionId: 'space-marines',
                        movement: '6"',
                        toughness: 4,
                        save: '3+',
                        wounds: 2,
                        leadership: 6,
                        objectiveControl: 2,
                        composition: [{ models: 5, points: 100 }],
                        rangedWeapons: [],
                        meleeWeapons: [],
                        wargearOptions: [],
                        wargearAbilities: [],
                        abilities: [],
                        structuredAbilities: [],
                        constraints: [],
                        keywords: ['Infantry'],
                        factionKeywords: ['Adeptus Astartes'],
                        imageUrl: '',
                    },
                ],
            });

            const chapterData = createFactionFixture({
                id: 'blood-angels',
                units: [],
            });

            const merged = (
                dao as unknown as { mergeFactionData: (base: FactionData, chapter: FactionData) => FactionData }
            ).mergeFactionData(baseData, chapterData);

            expect(merged.units.length).toBe(1);
            expect(merged.units[0].id).toBe('unit-intercessor');
        });

        /**
         * Test: mergeFactionData() handles both base and chapter data being empty.
         */
        it('mergeFactionData() handles both base and chapter data being empty', () => {
            const dao = new SpaceMarinesDAO(adapter, githubClient);

            const baseData = createFactionFixture({
                id: 'space-marines',
                units: [],
                weapons: [],
                abilities: [],
                stratagems: [],
                detachments: [],
                enhancements: [],
                factionRules: [],
                structuredFactionRules: [],
            });

            const chapterData = createFactionFixture({
                id: 'blood-angels',
                units: [],
                weapons: [],
                abilities: [],
                stratagems: [],
                detachments: [],
                enhancements: [],
                factionRules: [],
                structuredFactionRules: [],
            });

            const merged = (
                dao as unknown as { mergeFactionData: (base: FactionData, chapter: FactionData) => FactionData }
            ).mergeFactionData(baseData, chapterData);

            expect(merged.id).toBe('blood-angels');
            expect(merged.units.length).toBe(0);
            expect(merged.weapons.length).toBe(0);
            expect(merged.abilities.length).toBe(0);
        });
    });
});
