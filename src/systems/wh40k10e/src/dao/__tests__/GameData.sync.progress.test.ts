import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameData } from '@/dao/GameData.js';
import type { GameDataDeps } from '@/dao/GameData.js';
import { SyncProgressCollector } from '@armoury/data-dao';

function createSuccessDAO<T>(value: unknown): T {
    return { load: vi.fn().mockResolvedValue(value) } as unknown as T;
}

function createFailingDAO<T>(error?: string): T {
    return { load: vi.fn().mockRejectedValue(new Error(error ?? 'sync failed')) } as unknown as T;
}

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

describe('GameData.sync() progress collector', () => {
    let deps: GameDataDeps;
    let game: GameData;

    beforeEach(() => {
        deps = createMockDeps();
        game = new GameData(deps);
    });

    it('reports all 40 DAOs as completed when all succeed', async () => {
        const collector = new SyncProgressCollector(40);
        await game.sync(collector);

        const state = collector.getState();
        expect(state.completed).toBe(40);
        expect(state.failures).toBe(0);
        expect(state.phase).toBe('complete');
    });

    it('transitions through loading → syncing → complete phases in order', async () => {
        const collector = new SyncProgressCollector(40);
        const phases: string[] = [];
        collector.subscribe((s) => phases.push(s.phase));

        await game.sync(collector);

        expect(phases[0]).toBe('loading');
        expect(phases.at(-1)).toBe('complete');
        expect(phases).toContain('syncing');
    });

    it('reports failures without aborting other DAOs', async () => {
        deps.necronDAO = createFailingDAO('necron fetch failed');
        deps.orksDAO = createFailingDAO('orks fetch failed');
        game = new GameData(deps);

        const collector = new SyncProgressCollector(40);
        await game.sync(collector);

        const state = collector.getState();
        expect(state.completed).toBe(40);
        expect(state.failures).toBe(2);
        expect(state.phase).toBe('complete');
    });

    it('sets error phase when all DAOs fail', async () => {
        const failDeps = Object.fromEntries(
            Object.keys(deps).map((k) => [k, createFailingDAO('fail')]),
        ) as unknown as GameDataDeps;
        game = new GameData(failDeps);

        const collector = new SyncProgressCollector(40);
        await game.sync(collector);

        const state = collector.getState();
        expect(state.failures).toBe(40);
        expect(state.phase).toBe('error');
    });

    it('works without a collector (backward compatibility)', async () => {
        const result = await game.sync();

        expect(result.success).toBe(true);
        expect(result.total).toBe(40);
        expect(result.succeeded).toHaveLength(40);
    });

    it('returns the same SyncResult regardless of collector presence', async () => {
        const resultWithout = await game.sync();

        deps = createMockDeps();
        game = new GameData(deps);
        const collector = new SyncProgressCollector(40);
        const resultWith = await game.sync(collector);

        expect(resultWith.success).toBe(resultWithout.success);
        expect(resultWith.total).toBe(resultWithout.total);
        expect(resultWith.succeeded).toHaveLength(resultWithout.succeeded.length);
        expect(resultWith.failures).toHaveLength(resultWithout.failures.length);
    });
});
