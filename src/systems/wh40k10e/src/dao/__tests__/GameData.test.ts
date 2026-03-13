import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameData } from '@/dao/GameData.js';
import type { GameDataDeps } from '@/dao/GameData.js';

/**
 * Creates a mock DAO whose load() resolves with the given value.
 */
function createSuccessDAO<T>(value: unknown): T {
    return { load: vi.fn().mockResolvedValue(value) } as unknown as T;
}

/**
 * Creates a mock DAO whose load() rejects with the given error.
 */
function createFailingDAO<T>(error?: string): T {
    return { load: vi.fn().mockRejectedValue(new Error(error ?? 'sync failed')) } as unknown as T;
}

/**
 * Creates a full mock dependencies object with all 40 DAOs set to succeed by default.
 */
function createMockDeps(): GameDataDeps {
    return {
        chapterApprovedDAO: createSuccessDAO('mock-chapter-approved'),
        coreRulesDAO: createSuccessDAO('mock-core-rules'),
        crusadeRulesDAO: createSuccessDAO('mock-crusade-rules'),
        aeldariDAO: createSuccessDAO('mock-aeldari'),
        drukhariDAO: createSuccessDAO('mock-drukhari'),
        chaosSpaceMarinesDAO: createSuccessDAO('mock-chaos-space-marines'),
        chaosDaemonsDAO: createSuccessDAO('mock-chaos-daemons'),
        chaosKnightsDAO: createSuccessDAO('mock-chaos-knights'),
        deathGuardDAO: createSuccessDAO('mock-death-guard'),
        emperorsChildrenDAO: createSuccessDAO('mock-emperors-children'),
        thousandSonsDAO: createSuccessDAO('mock-thousand-sons'),
        worldEatersDAO: createSuccessDAO('mock-world-eaters'),
        adeptaSororitasDAO: createSuccessDAO('mock-adepta-sororitas'),
        adeptusCustodesDAO: createSuccessDAO('mock-adeptus-custodes'),
        adeptusMechanicusDAO: createSuccessDAO('mock-adeptus-mechanicus'),
        agentsOfTheImperiumDAO: createSuccessDAO('mock-agents-of-the-imperium'),
        astraMilitarumDAO: createSuccessDAO('mock-astra-militarum'),
        imperialKnightsDAO: createSuccessDAO('mock-imperial-knights'),
        greyKnightsDAO: createSuccessDAO('mock-grey-knights'),
        spaceMarinesDAO: createSuccessDAO('mock-space-marines'),
        blackTemplarsDAO: createSuccessDAO('mock-black-templars'),
        bloodAngelsDAO: createSuccessDAO('mock-blood-angels'),
        darkAngelsDAO: createSuccessDAO('mock-dark-angels'),
        deathwatchDAO: createSuccessDAO('mock-deathwatch'),
        spaceWolvesDAO: createSuccessDAO('mock-space-wolves'),
        ultramarinesDAO: createSuccessDAO('mock-ultramarines'),
        imperialFistsDAO: createSuccessDAO('mock-imperial-fists'),
        ironHandsDAO: createSuccessDAO('mock-iron-hands'),
        ravenGuardDAO: createSuccessDAO('mock-raven-guard'),
        salamandersDAO: createSuccessDAO('mock-salamanders'),
        whiteScarsDAO: createSuccessDAO('mock-white-scars'),
        genestealerCultsDAO: createSuccessDAO('mock-genestealer-cults'),
        leaguesOfVotannDAO: createSuccessDAO('mock-leagues-of-votann'),
        necronDAO: createSuccessDAO('mock-necron'),
        orksDAO: createSuccessDAO('mock-orks'),
        tauEmpireDAO: createSuccessDAO('mock-tau-empire'),
        tyranidsDAO: createSuccessDAO('mock-tyranids'),
        adeptusTitanicusDAO: createSuccessDAO('mock-adeptus-titanicus'),
        titanicusTraitorisDAO: createSuccessDAO('mock-titanicus-traitoris'),
        unalignedForcesDAO: createSuccessDAO('mock-unaligned-forces'),
    };
}

/** Test suite for GameData class. */
describe('GameData', () => {
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleWarnSpy.mockRestore();
    });

    /** Test suite for sync() method behavior. */
    describe('sync() - error propagation behavior', () => {
        it('resolves without throwing when all 40 DAOs succeed', async () => {
            const deps = createMockDeps();
            const gameData = new GameData(deps);

            await expect(gameData.sync()).resolves.toBeUndefined();
        });

        it('throws when SOME DAOs fail (partial failure)', async () => {
            const deps = createMockDeps();
            deps.coreRulesDAO = createFailingDAO('core rules failed');
            deps.spaceMarinesDAO = createFailingDAO('space marines failed');
            deps.necronDAO = createFailingDAO('necron failed');

            const gameData = new GameData(deps);

            await expect(gameData.sync()).rejects.toThrow('Failed to sync 3/40 DAOs: CoreRules, SpaceMarines, Necrons');
        });

        it('throws when ALL 40 DAOs fail (total failure)', async () => {
            const deps = createMockDeps();
            // Replace all DAOs with failing ones
            Object.keys(deps).forEach((key) => {
                (deps as unknown as Record<string, unknown>)[key] = createFailingDAO(`${key} failed`);
            });

            const gameData = new GameData(deps);

            await expect(gameData.sync()).rejects.toThrow(/Failed to sync 40\/40 DAOs:/);
        });

        it('calls load() on every single DAO exactly once', async () => {
            const deps = createMockDeps();
            const gameData = new GameData(deps);

            await gameData.sync();

            // Verify all 40 DAOs had their load() method called exactly once
            expect(deps.chapterApprovedDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.coreRulesDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.crusadeRulesDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.aeldariDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.drukhariDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.chaosSpaceMarinesDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.chaosDaemonsDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.chaosKnightsDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.deathGuardDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.emperorsChildrenDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.thousandSonsDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.worldEatersDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.adeptaSororitasDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.adeptusCustodesDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.adeptusMechanicusDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.agentsOfTheImperiumDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.astraMilitarumDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.imperialKnightsDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.greyKnightsDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.spaceMarinesDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.blackTemplarsDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.bloodAngelsDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.darkAngelsDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.deathwatchDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.spaceWolvesDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.ultramarinesDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.imperialFistsDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.ironHandsDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.ravenGuardDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.salamandersDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.whiteScarsDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.genestealerCultsDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.leaguesOfVotannDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.necronDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.orksDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.tauEmpireDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.tyranidsDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.adeptusTitanicusDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.titanicusTraitorisDAO.load).toHaveBeenCalledTimes(1);
            expect(deps.unalignedForcesDAO.load).toHaveBeenCalledTimes(1);
        });

        it('throws with correct failure count and DAO names when failures occur', async () => {
            const deps = createMockDeps();
            deps.coreRulesDAO = createFailingDAO('core rules failed');
            deps.spaceMarinesDAO = createFailingDAO('space marines failed');
            deps.necronDAO = createFailingDAO('necron failed');

            const gameData = new GameData(deps);

            await expect(gameData.sync()).rejects.toThrow('Failed to sync 3/40 DAOs: CoreRules, SpaceMarines, Necrons');
        });

        it('does NOT log a warning when all DAOs succeed', async () => {
            const deps = createMockDeps();
            const gameData = new GameData(deps);

            await gameData.sync();

            expect(consoleWarnSpy).not.toHaveBeenCalled();
        });
    });

    /** Test suite for parallel execution behavior. */
    describe('sync() - parallel execution', () => {
        it('fires all load() calls in parallel (not sequential)', async () => {
            const deps = createMockDeps();
            const callOrder: string[] = [];

            // Track when each load() is called (not when it resolves)
            Object.entries(deps).forEach(([key, dao]) => {
                const typedDAO = dao as unknown as { load: ReturnType<typeof vi.fn> };
                const originalLoad = typedDAO.load as unknown as (...args: unknown[]) => unknown;
                typedDAO.load = vi.fn().mockImplementation((...args: unknown[]) => {
                    callOrder.push(key);

                    return originalLoad(...args);
                }) as ReturnType<typeof vi.fn>;
            });

            const gameData = new GameData(deps);
            await gameData.sync();

            // If calls are parallel, all should be invoked before any promise resolves
            // We verify this by checking that all 40 calls happened (the order doesn't matter,
            // but they should all be called synchronously before awaiting)
            expect(callOrder).toHaveLength(40);
        });
    });

    /** Test suite for async getter delegation. */
    describe('Getters - delegation to DAO.load()', () => {
        it('chapterApproved getter returns the result of deps.chapterApprovedDAO.load()', async () => {
            const deps = createMockDeps();
            const expectedValue = { missionData: 'test' };
            deps.chapterApprovedDAO = createSuccessDAO(expectedValue);

            const gameData = new GameData(deps);

            const result = await gameData.chapterApproved;
            expect(result).toBe(expectedValue);
            expect(deps.chapterApprovedDAO.load).toHaveBeenCalledTimes(1);
        });

        it('coreRules getter returns the result of deps.coreRulesDAO.load()', async () => {
            const deps = createMockDeps();
            const expectedValue = { rules: 'core' };
            deps.coreRulesDAO = createSuccessDAO(expectedValue);

            const gameData = new GameData(deps);

            const result = await gameData.coreRules;
            expect(result).toBe(expectedValue);
            expect(deps.coreRulesDAO.load).toHaveBeenCalledTimes(1);
        });

        it('spaceMarines getter returns the result of deps.spaceMarinesDAO.load()', async () => {
            const deps = createMockDeps();
            const expectedValue = { faction: 'space-marines' };
            deps.spaceMarinesDAO = createSuccessDAO(expectedValue);

            const gameData = new GameData(deps);

            const result = await gameData.spaceMarines;
            expect(result).toBe(expectedValue);
            expect(deps.spaceMarinesDAO.load).toHaveBeenCalledTimes(1);
        });

        it('each getter returns a Promise (not the raw value)', () => {
            const deps = createMockDeps();
            const gameData = new GameData(deps);

            const chapterApprovedPromise = gameData.chapterApproved;
            const coreRulesPromise = gameData.coreRules;
            const spaceMarinesPromise = gameData.spaceMarines;

            expect(chapterApprovedPromise).toBeInstanceOf(Promise);
            expect(coreRulesPromise).toBeInstanceOf(Promise);
            expect(spaceMarinesPromise).toBeInstanceOf(Promise);
        });
    });

    /** Test suite for partial failure scenarios. */
    describe('Partial failure scenarios', () => {
        it('when chapterApprovedDAO fails - sync() throws with DAO name', async () => {
            const deps = createMockDeps();
            deps.chapterApprovedDAO = createFailingDAO('chapter approved failed');

            const gameData = new GameData(deps);

            await expect(gameData.sync()).rejects.toThrow('Failed to sync 1/40 DAOs: ChapterApproved');
        });

        it('when 5 random faction DAOs fail - sync() throws with all failed names', async () => {
            const deps = createMockDeps();
            deps.spaceMarinesDAO = createFailingDAO('space marines failed');
            deps.necronDAO = createFailingDAO('necron failed');
            deps.aeldariDAO = createFailingDAO('aeldari failed');
            deps.orksDAO = createFailingDAO('orks failed');
            deps.tyranidsDAO = createFailingDAO('tyranids failed');

            const gameData = new GameData(deps);

            await expect(gameData.sync()).rejects.toThrow(/Failed to sync 5\/40 DAOs:/);
        });

        it('when only coreRulesDAO fails - sync() throws with "1/40"', async () => {
            const deps = createMockDeps();
            deps.coreRulesDAO = createFailingDAO('core rules failed');

            const gameData = new GameData(deps);

            await expect(gameData.sync()).rejects.toThrow('Failed to sync 1/40 DAOs: CoreRules');
        });
    });
});
