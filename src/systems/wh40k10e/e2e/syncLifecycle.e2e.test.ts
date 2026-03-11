import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoreRulesDAO } from '@wh40k10e/dao/CoreRulesDAO.js';
import { GameData, type GameDataDeps } from '@wh40k10e/dao/GameData.js';
import { wh40k10eSystem } from '@wh40k10e/system.js';
import '@wh40k10e/index.js';
import { MockDatabaseAdapter } from '@wh40k10e/__mocks__/MockDatabaseAdapter.js';
import { MockGitHubClient } from '@wh40k10e/__mocks__/MockGitHubClient.js';
import type { ChapterApproved } from '@wh40k10e/models/ChapterApproved.js';
import { clearCodecRegistry } from '@data/codec.js';
import { clearHydrationRegistry } from '@data/hydration.js';
import { clearSchemaExtensions } from '@data/schema.js';
import { PluginRegistry } from '@data/pluginRegistry.js';
import type { BattleScribeGameSystem } from '@providers-bsdata/types.js';
import { makeCoreRules, makeCrusadeRules, makeFactionData } from './__fixtures__/index.ts';
import { parseGameSystem } from '@providers-bsdata/xmlParser.js';

vi.mock('@providers-bsdata/xmlParser.js', () => ({
    parseGameSystem: vi.fn(),
}));

const CORE_RULES_FILE = 'Warhammer%2040%2C000.gst';
const CORE_RULES_SYNC_KEY = 'core:wh40k-10e.gst';

class TestCoreRulesDAO extends CoreRulesDAO {
    async checkNeedsSync(): Promise<boolean> {
        return this.needsSync();
    }
}

class FailableMockGitHubClient extends MockGitHubClient {
    shouldFail = false;

    async downloadFile(_owner: string, _repo: string, path: string): Promise<string> {
        this.downloadedPaths.push(path);

        if (this.shouldFail) {
            throw new Error('Mock GitHub failure');
        }

        return this.fileContents.get(path) ?? '';
    }

    async getFileSha(_owner: string, _repo: string, path: string): Promise<string> {
        this.shaRequestedPaths.push(path);

        if (this.shouldFail) {
            throw new Error('Mock GitHub failure');
        }

        return this.fileShas.get(path) ?? `sha-${path}`;
    }
}

type StubDao<T> = { load: () => Promise<T> };

function createResolvedDao<T>(value: T): StubDao<T> {
    return { load: vi.fn().mockResolvedValue(value) };
}

function createRejectingDao<T>(error: Error): StubDao<T> {
    return { load: vi.fn().mockRejectedValue(error) };
}

function createToggleDao<T>(value: T, shouldFail: boolean) {
    let fail = shouldFail;
    const dao: StubDao<T> = {
        load: vi.fn(() => (fail ? Promise.reject(new Error('Mock DAO failure')) : Promise.resolve(value))),
    };

    return {
        dao,
        setShouldFail: (next: boolean) => {
            fail = next;
        },
    };
}

function createMockGameSystem(): BattleScribeGameSystem {
    return {
        gameSystem: {
            '@_id': 'wh40k-10e',
            '@_name': 'Warhammer 40,000 10th Edition',
            '@_revision': '1',
            '@_battleScribeVersion': '2.03',
            profileTypes: { profileType: [] },
            costTypes: { costType: [] },
            categoryEntries: { categoryEntry: [] },
            sharedRules: { rule: [] },
            sharedSelectionEntries: { selectionEntry: [] },
        },
    } as BattleScribeGameSystem;
}

function buildDeps(overrides: Partial<GameDataDeps> = {}): GameDataDeps {
    const factionData = makeFactionData();
    const coreRules = makeCoreRules();
    const crusadeRules = makeCrusadeRules();
    const chapterApproved: ChapterApproved = { id: 'chapter-approved', version: 'test' };

    const base: Record<keyof GameDataDeps, StubDao<unknown>> = {
        chapterApprovedDAO: createResolvedDao(chapterApproved),
        coreRulesDAO: createResolvedDao(coreRules),
        crusadeRulesDAO: createResolvedDao(crusadeRules),
        aeldariDAO: createResolvedDao(factionData),
        drukhariDAO: createResolvedDao(factionData),
        chaosSpaceMarinesDAO: createResolvedDao(factionData),
        chaosDaemonsDAO: createResolvedDao(factionData),
        chaosKnightsDAO: createResolvedDao(factionData),
        deathGuardDAO: createResolvedDao(factionData),
        emperorsChildrenDAO: createResolvedDao(factionData),
        thousandSonsDAO: createResolvedDao(factionData),
        worldEatersDAO: createResolvedDao(factionData),
        adeptaSororitasDAO: createResolvedDao(factionData),
        adeptusCustodesDAO: createResolvedDao(factionData),
        adeptusMechanicusDAO: createResolvedDao(factionData),
        agentsOfTheImperiumDAO: createResolvedDao(factionData),
        astraMilitarumDAO: createResolvedDao(factionData),
        imperialKnightsDAO: createResolvedDao(factionData),
        greyKnightsDAO: createResolvedDao(factionData),
        spaceMarinesDAO: createResolvedDao(factionData),
        blackTemplarsDAO: createResolvedDao(factionData),
        bloodAngelsDAO: createResolvedDao(factionData),
        darkAngelsDAO: createResolvedDao(factionData),
        deathwatchDAO: createResolvedDao(factionData),
        spaceWolvesDAO: createResolvedDao(factionData),
        ultramarinesDAO: createResolvedDao(factionData),
        imperialFistsDAO: createResolvedDao(factionData),
        ironHandsDAO: createResolvedDao(factionData),
        ravenGuardDAO: createResolvedDao(factionData),
        salamandersDAO: createResolvedDao(factionData),
        whiteScarsDAO: createResolvedDao(factionData),
        genestealerCultsDAO: createResolvedDao(factionData),
        leaguesOfVotannDAO: createResolvedDao(factionData),
        necronDAO: createResolvedDao(factionData),
        orksDAO: createResolvedDao(factionData),
        tauEmpireDAO: createResolvedDao(factionData),
        tyranidsDAO: createResolvedDao(factionData),
        adeptusTitanicusDAO: createResolvedDao(factionData),
        titanicusTraitorisDAO: createResolvedDao(factionData),
        unalignedForcesDAO: createResolvedDao(factionData),
    };

    return { ...base, ...overrides } as unknown as GameDataDeps;
}

beforeEach(() => {
    clearCodecRegistry();
    clearHydrationRegistry();
    clearSchemaExtensions();
    PluginRegistry.clear();
    wh40k10eSystem.register();
    vi.clearAllMocks();
});

describe('Sync lifecycle', () => {
    it('first load fetches from GitHub and stores in adapter', async () => {
        const adapter = new MockDatabaseAdapter();
        const githubClient = new MockGitHubClient();
        const dao = new CoreRulesDAO(adapter, githubClient);

        githubClient.fileContents.set(CORE_RULES_FILE, '<gameSystem>test</gameSystem>');
        githubClient.fileShas.set(CORE_RULES_FILE, 'sha-initial');
        githubClient.files = [];
        vi.mocked(parseGameSystem).mockReturnValue(createMockGameSystem());

        await dao.load();

        expect(githubClient.downloadedPaths).toHaveLength(1);
        expect(await adapter.getSyncStatus(CORE_RULES_SYNC_KEY)).not.toBeNull();
    });

    it('cached load returns memoized data without extra fetches', async () => {
        const adapter = new MockDatabaseAdapter();
        const githubClient = new MockGitHubClient();
        const dao = new CoreRulesDAO(adapter, githubClient);

        githubClient.fileContents.set(CORE_RULES_FILE, '<gameSystem>test</gameSystem>');
        githubClient.files = [];
        vi.mocked(parseGameSystem).mockReturnValue(createMockGameSystem());

        const first = await dao.load();
        const second = await dao.load();

        expect(second).toBe(first);
        expect(githubClient.downloadedPaths).toHaveLength(1);
    });

    it('needsSync returns true after clearing sync status', async () => {
        const adapter = new MockDatabaseAdapter();
        const githubClient = new MockGitHubClient();
        const dao = new TestCoreRulesDAO(adapter, githubClient);

        await adapter.setSyncStatus(CORE_RULES_SYNC_KEY, 'sha-old');
        await adapter.deleteSyncStatus(CORE_RULES_SYNC_KEY);

        await expect(dao.checkNeedsSync()).resolves.toBe(true);
    });

    it('refresh clears cache and re-fetches fresh data', async () => {
        const adapter = new MockDatabaseAdapter();
        const githubClient = new MockGitHubClient();
        const dao = new CoreRulesDAO(adapter, githubClient);

        githubClient.fileContents.set(CORE_RULES_FILE, '<gameSystem>test</gameSystem>');
        githubClient.fileShas.set(CORE_RULES_FILE, 'sha-1');
        githubClient.files = [];
        vi.mocked(parseGameSystem).mockReturnValue(createMockGameSystem());

        await dao.load();

        githubClient.fileShas.set(CORE_RULES_FILE, 'sha-2');
        await dao.refresh();

        const status = await adapter.getSyncStatus(CORE_RULES_SYNC_KEY);
        expect(githubClient.downloadedPaths).toHaveLength(2);
        expect(status?.sha).toBe('sha-2');
    });
});

describe('Error recovery', () => {
    it('network failure during load rejects with error', async () => {
        const adapter = new MockDatabaseAdapter();
        const githubClient = new FailableMockGitHubClient();
        const dao = new CoreRulesDAO(adapter, githubClient);

        githubClient.shouldFail = true;

        await expect(dao.load()).rejects.toThrow('Mock GitHub failure');
    });

    it('retry after failure succeeds and clears memoized promise', async () => {
        const adapter = new MockDatabaseAdapter();
        const githubClient = new FailableMockGitHubClient();
        const dao = new CoreRulesDAO(adapter, githubClient);

        githubClient.shouldFail = true;
        await expect(dao.load()).rejects.toThrow('Mock GitHub failure');

        githubClient.shouldFail = false;
        githubClient.fileContents.set(CORE_RULES_FILE, '<gameSystem>test</gameSystem>');
        githubClient.files = [];
        vi.mocked(parseGameSystem).mockReturnValue(createMockGameSystem());

        await expect(dao.load()).resolves.toBeDefined();
        expect(githubClient.downloadedPaths).toHaveLength(2);
    });
});

describe('Partial failure', () => {
    it('sync resolves with both successes and failures', async () => {
        const coreRules = makeCoreRules();
        const successDao = createResolvedDao(coreRules);
        const failureDao = createRejectingDao(new Error('Mock DAO failure'));

        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const game = new GameData(
            buildDeps({
                coreRulesDAO: successDao as unknown as GameDataDeps['coreRulesDAO'],
                aeldariDAO: failureDao as unknown as GameDataDeps['aeldariDAO'],
            }),
        );

        await expect(game.sync()).resolves.toBeUndefined();

        expect(successDao.load).toHaveBeenCalled();
        expect(failureDao.load).toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalled();

        warnSpy.mockRestore();
    });

    it('failed DAOs can be retried while successful DAOs keep data', async () => {
        const coreRules = makeCoreRules();
        const factionData = makeFactionData();
        const coreRulesDao = createResolvedDao(coreRules);
        const toggle = createToggleDao(factionData, true);

        const game = new GameData(
            buildDeps({
                coreRulesDAO: coreRulesDao as unknown as GameDataDeps['coreRulesDAO'],
                aeldariDAO: toggle.dao as unknown as GameDataDeps['aeldariDAO'],
            }),
        );

        await game.sync();

        toggle.setShouldFail(false);
        const [coreRulesResult, aeldariResult] = await Promise.all([game.coreRules, game.aeldari]);

        expect(coreRulesResult).toBe(coreRules);
        expect(aeldariResult).toBe(factionData);
        expect(toggle.dao.load).toHaveBeenCalledTimes(2);
    });
});

describe('Data consistency', () => {
    it('sync plus immediate read returns correct data', async () => {
        const coreRules = makeCoreRules();

        const game = new GameData(
            buildDeps({
                coreRulesDAO: createResolvedDao(coreRules) as unknown as GameDataDeps['coreRulesDAO'],
            }),
        );

        await game.sync();
        const result = await game.coreRules;

        expect(result).toBe(coreRules);
    });
});
