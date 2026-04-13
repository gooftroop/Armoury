import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createContainer, coreModule, TOKENS } from '@armoury/di';
import type { DatabaseAdapter } from '@armoury/data-dao';
import type { IGitHubClient } from '@armoury/clients-github';
import type { IWahapediaClient } from '@armoury/clients-wahapedia';

const mockTypes = vi.hoisted(() => {
    class HoistedFactionDAO {
        readonly adapter: DatabaseAdapter;
        readonly github: IGitHubClient;

        constructor(adapter: DatabaseAdapter, github: IGitHubClient) {
            this.adapter = adapter;
            this.github = github;
        }

        async load(): Promise<Record<string, string>> {
            return { source: 'faction' };
        }
    }

    class HoistedCoreRulesDAO {
        readonly adapter: DatabaseAdapter;
        readonly github: IGitHubClient;

        constructor(adapter: DatabaseAdapter, github: IGitHubClient) {
            this.adapter = adapter;
            this.github = github;
        }
    }

    class HoistedCrusadeRulesDAO {
        readonly adapter: DatabaseAdapter;
        readonly github: IGitHubClient;

        constructor(adapter: DatabaseAdapter, github: IGitHubClient) {
            this.adapter = adapter;
            this.github = github;
        }
    }

    class HoistedChapterApprovedDAO {
        readonly adapter: DatabaseAdapter;
        readonly wahapedia: IWahapediaClient;

        constructor(adapter: DatabaseAdapter, wahapedia: IWahapediaClient) {
            this.adapter = adapter;
            this.wahapedia = wahapedia;
        }
    }

    class HoistedArmyDAO {
        readonly adapter: DatabaseAdapter;

        constructor(adapter: DatabaseAdapter) {
            this.adapter = adapter;
        }
    }

    class HoistedGameData {
        readonly deps: Record<string, unknown>;

        constructor(deps: Record<string, unknown>) {
            this.deps = deps;
        }

        async sync(): Promise<{ success: boolean }> {
            return { success: true };
        }
    }

    return {
        factionDAO: HoistedFactionDAO,
        coreRulesDAO: HoistedCoreRulesDAO,
        crusadeRulesDAO: HoistedCrusadeRulesDAO,
        chapterApprovedDAO: HoistedChapterApprovedDAO,
        armyDAO: HoistedArmyDAO,
        gameData: HoistedGameData,
    };
});

/**
 * DI module tests for wh40k10e.
 *
 * @requirements
 * - REQ-WH40K-DI-TEST-001: Tokens and faction map remain complete and stable.
 * - REQ-WH40K-DI-TEST-002: Container module resolves all DAOs, GameData, and GameContext.
 * - REQ-WH40K-DI-TEST-003: Singleton scope is preserved for all DI bindings.
 *
 * Test plan:
 * 1) Verify token identity/freeze semantics and complete faction registry.
 * 2) Verify module loading and named DAO resolution for all faction IDs.
 * 3) Verify core DAO bindings, GameData deps shape, GameContext shape, and singleton behavior.
 */

vi.mock('@/dao/factions/index.js', () => ({
    AeldariDAO: mockTypes.factionDAO,
    DrukhariDAO: mockTypes.factionDAO,
    ChaosSpaceMarinesDAO: mockTypes.factionDAO,
    ChaosDaemonsDAO: mockTypes.factionDAO,
    ChaosKnightsDAO: mockTypes.factionDAO,
    DeathGuardDAO: mockTypes.factionDAO,
    EmperorsChildrenDAO: mockTypes.factionDAO,
    ThousandSonsDAO: mockTypes.factionDAO,
    WorldEatersDAO: mockTypes.factionDAO,
    AdeptaSororitasDAO: mockTypes.factionDAO,
    AdeptusCustodesDAO: mockTypes.factionDAO,
    AdeptusMechanicusDAO: mockTypes.factionDAO,
    AgentsOfTheImperiumDAO: mockTypes.factionDAO,
    AstraMilitarumDAO: mockTypes.factionDAO,
    ImperialKnightsDAO: mockTypes.factionDAO,
    GreyKnightsDAO: mockTypes.factionDAO,
    SpaceMarinesDAO: mockTypes.factionDAO,
    BlackTemplarsDAO: mockTypes.factionDAO,
    BloodAngelsDAO: mockTypes.factionDAO,
    DarkAngelsDAO: mockTypes.factionDAO,
    DeathwatchDAO: mockTypes.factionDAO,
    SpaceWolvesDAO: mockTypes.factionDAO,
    UltramarinesDAO: mockTypes.factionDAO,
    ImperialFistsDAO: mockTypes.factionDAO,
    IronHandsDAO: mockTypes.factionDAO,
    RavenGuardDAO: mockTypes.factionDAO,
    SalamandersDAO: mockTypes.factionDAO,
    WhiteScarsDAO: mockTypes.factionDAO,
    GenestealerCultsDAO: mockTypes.factionDAO,
    LeaguesOfVotannDAO: mockTypes.factionDAO,
    NecronDAO: mockTypes.factionDAO,
    OrksDAO: mockTypes.factionDAO,
    TauEmpireDAO: mockTypes.factionDAO,
    TyranidsDAO: mockTypes.factionDAO,
    AdeptusTitanicusDAO: mockTypes.factionDAO,
    TitanicusTraitorisDAO: mockTypes.factionDAO,
    UnalignedForcesDAO: mockTypes.factionDAO,
}));
vi.mock('@/dao/CoreRulesDAO.js', () => ({ CoreRulesDAO: mockTypes.coreRulesDAO }));
vi.mock('@/dao/CrusadeRulesDAO.js', () => ({ CrusadeRulesDAO: mockTypes.crusadeRulesDAO }));
vi.mock('@/dao/ChapterApprovedDAO.js', () => ({ ChapterApprovedDAO: mockTypes.chapterApprovedDAO }));
vi.mock('@/dao/ArmyDAO.js', () => ({ ArmyDAO: mockTypes.armyDAO }));
vi.mock('@/dao/GameData.js', () => ({ GameData: mockTypes.gameData }));
import { FACTION_DAO_MAP, WH40K_TOKENS, wh40k10eModule } from '@/di.module.js';

const EXPECTED_FACTION_IDS = [
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
    'necron',
    'orks',
    'tauEmpire',
    'tyranids',
    'adeptusTitanicus',
    'titanicusTraitoris',
    'unalignedForces',
] as const;

function createTestContainer() {
    const container = createContainer();
    const adapter = { platform: 'pglite' } as unknown as DatabaseAdapter;
    const github = {} as IGitHubClient;
    const wahapedia = {} as IWahapediaClient;

    container.bind(TOKENS.DatabaseAdapter).toConstantValue(adapter);
    container.bind(TOKENS.GitHubClient).toConstantValue(github);
    container.bind(TOKENS.WahapediaClient).toConstantValue(wahapedia);
    container.load(coreModule, wh40k10eModule);

    return { container, adapter, github, wahapedia };
}

describe('di.module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('WH40K_TOKENS', () => {
        it('contains all expected symbol tokens', () => {
            expect(WH40K_TOKENS.FactionDAO).toBe(Symbol.for('wh40k.FactionDAO'));
            expect(WH40K_TOKENS.CoreRulesDAO).toBe(Symbol.for('wh40k.CoreRulesDAO'));
            expect(WH40K_TOKENS.CrusadeRulesDAO).toBe(Symbol.for('wh40k.CrusadeRulesDAO'));
            expect(WH40K_TOKENS.ChapterApprovedDAO).toBe(Symbol.for('wh40k.ChapterApprovedDAO'));
            expect(WH40K_TOKENS.ArmyDAO).toBe(Symbol.for('wh40k.ArmyDAO'));
            expect(WH40K_TOKENS.CampaignDAO).toBe(Symbol.for('wh40k.CampaignDAO'));
            expect(WH40K_TOKENS.GameData).toBe(Symbol.for('wh40k.GameData'));
            expect(WH40K_TOKENS.GameContext).toBe(Symbol.for('wh40k.GameContext'));
        });

        it('is frozen', () => {
            expect(Object.isFrozen(WH40K_TOKENS)).toBe(true);
        });
    });

    describe('FACTION_DAO_MAP', () => {
        it('contains exactly 37 factions', () => {
            expect(FACTION_DAO_MAP.size).toBe(37);
        });

        it('contains all expected faction IDs in order', () => {
            expect(Array.from(FACTION_DAO_MAP.keys())).toEqual(EXPECTED_FACTION_IDS);
        });
    });

    describe('wh40k10eModule', () => {
        it('loads and resolves all faction DAOs by named binding', () => {
            const { container } = createTestContainer();

            for (const factionId of EXPECTED_FACTION_IDS) {
                const factionDAO = container.get(WH40K_TOKENS.FactionDAO, { name: factionId });

                expect(factionDAO).toBeInstanceOf(mockTypes.factionDAO);
            }
        });

        it('resolves core DAOs and adapter/client wiring', () => {
            const { container, adapter, github, wahapedia } = createTestContainer();
            const coreRulesDAO = container.get(WH40K_TOKENS.CoreRulesDAO) as InstanceType<
                typeof mockTypes.coreRulesDAO
            >;
            const crusadeRulesDAO = container.get(WH40K_TOKENS.CrusadeRulesDAO) as InstanceType<
                typeof mockTypes.crusadeRulesDAO
            >;
            const chapterApprovedDAO = container.get(WH40K_TOKENS.ChapterApprovedDAO) as InstanceType<
                typeof mockTypes.chapterApprovedDAO
            >;
            const armyDAO = container.get(WH40K_TOKENS.ArmyDAO) as InstanceType<typeof mockTypes.armyDAO>;
            const campaignDAO = container.get(WH40K_TOKENS.CampaignDAO) as {
                list: () => Promise<unknown[]>;
            };

            expect(coreRulesDAO.adapter).toBe(adapter);
            expect(coreRulesDAO.github).toBe(github);
            expect(crusadeRulesDAO.adapter).toBe(adapter);
            expect(crusadeRulesDAO.github).toBe(github);
            expect(chapterApprovedDAO.adapter).toBe(adapter);
            expect(chapterApprovedDAO.wahapedia).toBe(wahapedia);
            expect(armyDAO.adapter).toBe(adapter);
            expect(typeof campaignDAO.list).toBe('function');
        });

        it('resolves GameData with all expected dependency keys', () => {
            const { container } = createTestContainer();
            const gameData = container.get(WH40K_TOKENS.GameData) as InstanceType<typeof mockTypes.gameData>;

            expect(gameData).toBeInstanceOf(mockTypes.gameData);
            expect(gameData.deps).toHaveProperty('coreRulesDAO');
            expect(gameData.deps).toHaveProperty('crusadeRulesDAO');
            expect(gameData.deps).toHaveProperty('chapterApprovedDAO');

            for (const factionId of EXPECTED_FACTION_IDS) {
                expect(gameData.deps).toHaveProperty(`${factionId}DAO`);
            }
        });

        it('resolves GameContext with expected shape and sync behavior', async () => {
            const { container } = createTestContainer();
            const context = container.get(WH40K_TOKENS.GameContext) as {
                armies: InstanceType<typeof mockTypes.armyDAO>;
                campaigns: {
                    list: () => Promise<unknown[]>;
                };
                game: InstanceType<typeof mockTypes.gameData>;
                sync: () => Promise<{ success: boolean }>;
            };

            expect(context.armies).toBeInstanceOf(mockTypes.armyDAO);
            expect(typeof context.campaigns.list).toBe('function');
            expect(context.game).toBeInstanceOf(mockTypes.gameData);
            await expect(context.sync()).resolves.toEqual({ success: true });
        });

        it('uses singleton scope for faction and core DAOs', () => {
            const { container } = createTestContainer();
            const firstFaction = container.get(WH40K_TOKENS.FactionDAO, { name: 'aeldari' });
            const secondFaction = container.get(WH40K_TOKENS.FactionDAO, { name: 'aeldari' });
            const firstCore = container.get(WH40K_TOKENS.CoreRulesDAO);
            const secondCore = container.get(WH40K_TOKENS.CoreRulesDAO);

            expect(firstFaction).toBe(secondFaction);
            expect(firstCore).toBe(secondCore);
        });
    });
});
