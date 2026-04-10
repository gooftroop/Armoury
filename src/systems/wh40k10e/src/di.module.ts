import { ContainerModule } from 'inversify';
import type { ContainerModuleLoadOptions } from 'inversify';
import type { DatabaseAdapter } from '@armoury/data-dao';
import { CampaignDAOImpl as CampaignDAO } from '@armoury/data-dao';
import type { IGitHubClient } from '@armoury/clients-github';
import type { IWahapediaClient } from '@armoury/clients-wahapedia';
import { TOKENS } from '@armoury/di';
import {
    AeldariDAO,
    DrukhariDAO,
    ChaosSpaceMarinesDAO,
    ChaosDaemonsDAO,
    ChaosKnightsDAO,
    DeathGuardDAO,
    EmperorsChildrenDAO,
    ThousandSonsDAO,
    WorldEatersDAO,
    AdeptaSororitasDAO,
    AdeptusCustodesDAO,
    AdeptusMechanicusDAO,
    AgentsOfTheImperiumDAO,
    AstraMilitarumDAO,
    ImperialKnightsDAO,
    GreyKnightsDAO,
    SpaceMarinesDAO,
    BlackTemplarsDAO,
    BloodAngelsDAO,
    DarkAngelsDAO,
    DeathwatchDAO,
    SpaceWolvesDAO,
    UltramarinesDAO,
    ImperialFistsDAO,
    IronHandsDAO,
    RavenGuardDAO,
    SalamandersDAO,
    WhiteScarsDAO,
    GenestealerCultsDAO,
    LeaguesOfVotannDAO,
    NecronDAO,
    OrksDAO,
    TauEmpireDAO,
    TyranidsDAO,
    AdeptusTitanicusDAO,
    TitanicusTraitorisDAO,
    UnalignedForcesDAO,
} from '@/dao/factions/index.js';
import { CoreRulesDAO } from '@/dao/CoreRulesDAO.js';
import { CrusadeRulesDAO } from '@/dao/CrusadeRulesDAO.js';
import { ChapterApprovedDAO } from '@/dao/ChapterApprovedDAO.js';
import { ArmyDAO } from '@/dao/ArmyDAO.js';
import { GameData } from '@/dao/GameData.js';
import type { GameDataDeps } from '@/dao/GameData.js';

/**
 * Dependency injection module for wh40k10e DAOs and game context.
 *
 * @requirements
 * - REQ-WH40K-DI-001: Register all 37 faction DAOs as named singleton bindings.
 * - REQ-WH40K-DI-002: Register core DAOs and GameData/GameContext from container dependencies.
 * - REQ-WH40K-DI-003: Expose stable, frozen token identities via Symbol.for().
 */

type FactionDAOConstructor = new (adapter: DatabaseAdapter, client: IGitHubClient) => unknown;

/**
 * wh40k-specific token registry for game-system-scoped bindings.
 */
export const WH40K_TOKENS = Object.freeze({
    FactionDAO: Symbol.for('wh40k.FactionDAO'),
    CoreRulesDAO: Symbol.for('wh40k.CoreRulesDAO'),
    CrusadeRulesDAO: Symbol.for('wh40k.CrusadeRulesDAO'),
    ChapterApprovedDAO: Symbol.for('wh40k.ChapterApprovedDAO'),
    ArmyDAO: Symbol.for('wh40k.ArmyDAO'),
    CampaignDAO: Symbol.for('wh40k.CampaignDAO'),
    GameData: Symbol.for('wh40k.GameData'),
    GameContext: Symbol.for('wh40k.GameContext'),
} as const);

/**
 * Faction DAO registry keyed by GameData dependency field stem.
 */
export const FACTION_DAO_MAP: ReadonlyMap<string, FactionDAOConstructor> = new Map<string, FactionDAOConstructor>([
    ['aeldari', AeldariDAO],
    ['drukhari', DrukhariDAO],
    ['chaosSpaceMarines', ChaosSpaceMarinesDAO],
    ['chaosDaemons', ChaosDaemonsDAO],
    ['chaosKnights', ChaosKnightsDAO],
    ['deathGuard', DeathGuardDAO],
    ['emperorsChildren', EmperorsChildrenDAO],
    ['thousandSons', ThousandSonsDAO],
    ['worldEaters', WorldEatersDAO],
    ['adeptaSororitas', AdeptaSororitasDAO],
    ['adeptusCustodes', AdeptusCustodesDAO],
    ['adeptusMechanicus', AdeptusMechanicusDAO],
    ['agentsOfTheImperium', AgentsOfTheImperiumDAO],
    ['astraMilitarum', AstraMilitarumDAO],
    ['imperialKnights', ImperialKnightsDAO],
    ['greyKnights', GreyKnightsDAO],
    ['spaceMarines', SpaceMarinesDAO],
    ['blackTemplars', BlackTemplarsDAO],
    ['bloodAngels', BloodAngelsDAO],
    ['darkAngels', DarkAngelsDAO],
    ['deathwatch', DeathwatchDAO],
    ['spaceWolves', SpaceWolvesDAO],
    ['ultramarines', UltramarinesDAO],
    ['imperialFists', ImperialFistsDAO],
    ['ironHands', IronHandsDAO],
    ['ravenGuard', RavenGuardDAO],
    ['salamanders', SalamandersDAO],
    ['whiteScars', WhiteScarsDAO],
    ['genestealerCults', GenestealerCultsDAO],
    ['leaguesOfVotann', LeaguesOfVotannDAO],
    ['necron', NecronDAO],
    ['orks', OrksDAO],
    ['tauEmpire', TauEmpireDAO],
    ['tyranids', TyranidsDAO],
    ['adeptusTitanicus', AdeptusTitanicusDAO],
    ['titanicusTraitoris', TitanicusTraitorisDAO],
    ['unalignedForces', UnalignedForcesDAO],
]);

/**
 * Inversify module that wires wh40k-specific DAOs and game context services.
 */
export const wh40k10eModule = new ContainerModule((options: ContainerModuleLoadOptions): void => {
    for (const [factionId, DAOClass] of FACTION_DAO_MAP) {
        options
            .bind(WH40K_TOKENS.FactionDAO)
            .toDynamicValue((ctx) => {
                const adapter = ctx.get<DatabaseAdapter>(TOKENS.DatabaseAdapter);
                const github = ctx.get<IGitHubClient>(TOKENS.GitHubClient);

                return new DAOClass(adapter, github);
            })
            .inSingletonScope()
            .whenNamed(factionId);
    }

    options
        .bind(WH40K_TOKENS.CoreRulesDAO)
        .toDynamicValue((ctx) => {
            const adapter = ctx.get<DatabaseAdapter>(TOKENS.DatabaseAdapter);
            const github = ctx.get<IGitHubClient>(TOKENS.GitHubClient);

            return new CoreRulesDAO(adapter, github);
        })
        .inSingletonScope();

    options
        .bind(WH40K_TOKENS.CrusadeRulesDAO)
        .toDynamicValue((ctx) => {
            const adapter = ctx.get<DatabaseAdapter>(TOKENS.DatabaseAdapter);
            const github = ctx.get<IGitHubClient>(TOKENS.GitHubClient);

            return new CrusadeRulesDAO(adapter, github);
        })
        .inSingletonScope();

    options
        .bind(WH40K_TOKENS.ChapterApprovedDAO)
        .toDynamicValue((ctx) => {
            const adapter = ctx.get<DatabaseAdapter>(TOKENS.DatabaseAdapter);
            const wahapedia = ctx.get<IWahapediaClient>(TOKENS.WahapediaClient);

            return new ChapterApprovedDAO(adapter, wahapedia);
        })
        .inSingletonScope();

    options
        .bind(WH40K_TOKENS.ArmyDAO)
        .toDynamicValue((ctx) => new ArmyDAO(ctx.get<DatabaseAdapter>(TOKENS.DatabaseAdapter)))
        .inSingletonScope();

    options
        .bind(WH40K_TOKENS.CampaignDAO)
        .toDynamicValue((ctx) => new CampaignDAO(ctx.get<DatabaseAdapter>(TOKENS.DatabaseAdapter)))
        .inSingletonScope();

    options
        .bind(WH40K_TOKENS.GameData)
        .toDynamicValue((ctx) => {
            const daoEntries: Record<string, unknown> = {};

            for (const [factionId] of FACTION_DAO_MAP) {
                daoEntries[`${factionId}DAO`] = ctx.get(WH40K_TOKENS.FactionDAO, { name: factionId });
            }

            return new GameData({
                ...daoEntries,
                coreRulesDAO: ctx.get(WH40K_TOKENS.CoreRulesDAO),
                crusadeRulesDAO: ctx.get(WH40K_TOKENS.CrusadeRulesDAO),
                chapterApprovedDAO: ctx.get(WH40K_TOKENS.ChapterApprovedDAO),
            } as GameDataDeps);
        })
        .inSingletonScope();

    options
        .bind(WH40K_TOKENS.GameContext)
        .toDynamicValue((ctx) => ({
            armies: ctx.get(WH40K_TOKENS.ArmyDAO),
            campaigns: ctx.get(WH40K_TOKENS.CampaignDAO),
            game: ctx.get(WH40K_TOKENS.GameData),
            sync: () => ctx.get<GameData>(WH40K_TOKENS.GameData).sync(),
        }))
        .inSingletonScope();
});
