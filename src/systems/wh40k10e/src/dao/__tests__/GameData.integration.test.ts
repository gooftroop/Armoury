import { describe, expect, it, vi } from 'vitest';
import { GameData } from '../GameData.ts';
import type { GameDataDeps } from '../GameData.ts';

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

describe('GameData (integration)', () => {
    it('exposes all 40 async getters on the prototype', () => {
        const gameData = new GameData(createMockDeps());
        const prototype = Object.getPrototypeOf(gameData) as object;
        const getterKeys = [
            'chapterApproved',
            'coreRules',
            'crusadeRules',
            'aeldari',
            'drukhari',
            'chaosSpaceMarines',
            'chaosDaemons',
            'chaosKnights',
            'deathGuard',
            'emperorsChildren',
            'thousandSons',
            'worldEaters',
            'adeptaSororitas',
            'adeptusCustodes',
            'adeptusMechanicus',
            'agentsOfTheImperium',
            'astraMilitarum',
            'imperialKnights',
            'greyKnights',
            'spaceMarines',
            'blackTemplars',
            'bloodAngels',
            'darkAngels',
            'deathwatch',
            'spaceWolves',
            'ultramarines',
            'imperialFists',
            'ironHands',
            'ravenGuard',
            'salamanders',
            'whiteScars',
            'genestealerCults',
            'leaguesOfVotann',
            'necrons',
            'orks',
            'tauEmpire',
            'tyranids',
            'adeptusTitanicus',
            'titanicusTraitoris',
            'unalignedForces',
        ] as const;

        expect(getterKeys.length).toBe(40);

        for (const key of getterKeys) {
            const descriptor = Object.getOwnPropertyDescriptor(prototype, key);
            expect(descriptor?.get).toBeDefined();
        }
    });

    it('sync() invokes all DAO load() calls and tolerates failures', async () => {
        const deps = createMockDeps();
        deps.coreRulesDAO = createFailingDAO('core rules failed');
        deps.spaceMarinesDAO = createFailingDAO('space marines failed');

        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const gameData = new GameData(deps);
        await expect(gameData.sync()).resolves.toBeUndefined();

        const daoKeys: (keyof GameDataDeps)[] = [
            'chapterApprovedDAO',
            'coreRulesDAO',
            'crusadeRulesDAO',
            'aeldariDAO',
            'drukhariDAO',
            'chaosSpaceMarinesDAO',
            'chaosDaemonsDAO',
            'chaosKnightsDAO',
            'deathGuardDAO',
            'emperorsChildrenDAO',
            'thousandSonsDAO',
            'worldEatersDAO',
            'adeptaSororitasDAO',
            'adeptusCustodesDAO',
            'adeptusMechanicusDAO',
            'agentsOfTheImperiumDAO',
            'astraMilitarumDAO',
            'imperialKnightsDAO',
            'greyKnightsDAO',
            'spaceMarinesDAO',
            'blackTemplarsDAO',
            'bloodAngelsDAO',
            'darkAngelsDAO',
            'deathwatchDAO',
            'spaceWolvesDAO',
            'ultramarinesDAO',
            'imperialFistsDAO',
            'ironHandsDAO',
            'ravenGuardDAO',
            'salamandersDAO',
            'whiteScarsDAO',
            'genestealerCultsDAO',
            'leaguesOfVotannDAO',
            'necronDAO',
            'orksDAO',
            'tauEmpireDAO',
            'tyranidsDAO',
            'adeptusTitanicusDAO',
            'titanicusTraitorisDAO',
            'unalignedForcesDAO',
        ];

        for (const key of daoKeys) {
            expect((deps[key] as unknown as { load: ReturnType<typeof vi.fn> }).load).toHaveBeenCalledTimes(1);
        }

        expect(warnSpy).toHaveBeenCalledWith('[GameData.sync] 2/40 DAOs failed to sync');

        warnSpy.mockRestore();
    });
});
