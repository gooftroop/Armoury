import type {
    DataSourceConfig,
    EntityKindDefinition,
    PluginValidationRule,
    EntityHydrator,
    GameSystem,
} from '@armoury/data-dao';
import type { SchemaExtension } from '@armoury/data-dao';
import type { DatabaseAdapter } from '@armoury/data-dao';
import type { IGitHubClient } from '@armoury/clients-github';
import type { GameContextResult } from '@armoury/data-dao';
import { registerPluginEntity } from '@armoury/data-dao';
import { registerHydrator } from '@armoury/data-dao';
import { registerEntityCodec } from '@armoury/data-dao';
import { registerSchemaExtension } from '@armoury/data-dao';
import type { FactionData } from '@/models/FactionData.js';
import type { CoreRules } from '@/models/CoreRules.js';
import { hydrateCoreRules } from '@/models/CoreRules.js';
import { hydrateFactionData } from '@/models/FactionData.js';
import type { ValidationResult } from '@armoury/validation';
import type { Army } from '@/models/ArmyModel.js';
import type { ChapterApproved } from '@/models/ChapterApproved.js';
import { hydrateChapterApproved } from '@/models/ChapterApproved.js';
import type { Unit } from '@/models/UnitModel.js';
import type { Faction } from '@/types/entities.js';
import type { CrusadeRules } from '@/models/CrusadeRulesModel.js';
import type { Weapon, Ability, Stratagem, Detachment } from '@/types/entities.js';
import { CoreRulesDAO } from '@/dao/CoreRulesDAO.js';
import { ChapterApprovedDAO } from '@/dao/ChapterApprovedDAO.js';
import { createWahapediaClient } from '@armoury/clients-wahapedia';
import { CrusadeRulesDAO } from '@/dao/CrusadeRulesDAO.js';
import { ArmyDAO } from '@/dao/ArmyDAO.js';
import { CampaignDAOImpl as CampaignDAO } from '@armoury/data-dao';

import { GameData } from '@/dao/GameData.js';
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
import {
    validatePoints,
    validateStrategicReserves,
    validateComposition,
    validateCharacter,
    validateDetachment,
    validateEnhancements,
    validateFactionKeyword,
    validateLeaders,
    validateTransport,
    validateWargear,
    validateWarlord,
} from '@/validation/rules/index.js';

/**
 * Creates a proxy fetch function for browser environments.
 *
 * In the browser, direct requests to wahapedia.ru are blocked by CORS.
 * This returns a fetch wrapper that routes requests through the Next.js
 * API proxy at `/api/wahapedia`. On the server (SSR, Node), returns
 * undefined so the WahapediaClient uses the default global fetch.
 *
 * @returns A proxy fetch function in browser environments, or undefined on the server.
 */
function createProxyFetch(): typeof fetch | undefined {
    if (typeof window === 'undefined') {
        return undefined;
    }

    return async (input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

        const response = await fetch('/api/wahapedia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ error: 'Proxy request failed' }));

            throw new Error((errorBody as { error?: string }).error ?? `Proxy HTTP ${response.status}`);
        }

        return response;
    };
}

/**
 * Enum of entity kinds for wh40k10e data access.
 */
export enum EntityKind {
    Unit = 'unit',
    Weapon = 'weapon',
    Ability = 'ability',
    Stratagem = 'stratagem',
    Detachment = 'detachment',
    Faction = 'faction',
    FactionData = 'factionData',
    CoreRules = 'coreRules',
    CrusadeRules = 'crusadeRules',
    Army = 'army',
    ChapterApproved = 'chapterApproved',
}

/** Entity kinds registered by the wh40k10e system. */
const WH40K_ENTITY_KINDS: EntityKindDefinition[] = [
    { kind: EntityKind.Unit, displayName: 'Unit', requiresHydration: false },
    { kind: EntityKind.Weapon, displayName: 'Weapon', requiresHydration: false },
    { kind: EntityKind.Ability, displayName: 'Ability', requiresHydration: false },
    { kind: EntityKind.Stratagem, displayName: 'Stratagem', requiresHydration: false },
    { kind: EntityKind.Detachment, displayName: 'Detachment', requiresHydration: false },
    { kind: EntityKind.Faction, displayName: 'Faction', requiresHydration: false },
    { kind: EntityKind.FactionData, displayName: 'Faction Data', requiresHydration: true },
    { kind: EntityKind.CoreRules, displayName: 'Core Rules', requiresHydration: true },
    { kind: EntityKind.CrusadeRules, displayName: 'Crusade Rules', requiresHydration: false },
    { kind: EntityKind.Army, displayName: 'Army', requiresHydration: false },
    { kind: EntityKind.ChapterApproved, displayName: 'Chapter Approved', requiresHydration: true },
    { kind: 'campaign', displayName: 'Campaign', requiresHydration: false },
];

/**
 * Maps wh40k10e entity kinds to their TypeScript types.
 */
export type EntityByKind = {
    [EntityKind.Unit]: Unit;
    [EntityKind.Weapon]: Weapon;
    [EntityKind.Ability]: Ability;
    [EntityKind.Stratagem]: Stratagem;
    [EntityKind.Detachment]: Detachment;
    [EntityKind.Faction]: Faction;
    [EntityKind.FactionData]: FactionData;
    [EntityKind.CoreRules]: CoreRules;
    [EntityKind.CrusadeRules]: CrusadeRules;
    [EntityKind.Army]: Army;
    [EntityKind.ChapterApproved]: ChapterApproved;
};

/** Data source configuration for BSData wh40k-10e repository. */
const WH40K_DATA_SOURCE: DataSourceConfig = {
    type: 'github',
    owner: 'BSData',
    repo: 'wh40k-10e',
    coreFile: 'Warhammer%2040%2C000.gst',
    description: 'Community-maintained game data for 10th Edition',
    licenseStatus: 'No license specified',
};

/**
 * Maps validation results into plugin validation rule results.
 * Ensures results align with the GameSystem contract.
 */
function mapValidationResults(
    ruleId: string,
    results: ValidationResult[],
): ReturnType<PluginValidationRule['validate']> {
    return results.map((result) => ({
        ruleId,
        passed: result.passed,
        severity: result.severity,
        message: result.message,
    }));
}

/**
 * Wraps a validation rule function in the system rule format.
 */
function wrapValidationRule(
    id: string,
    name: string,
    ruleFn: (army: Army, factionData: FactionData) => ValidationResult[],
): PluginValidationRule {
    return {
        id,
        name,
        validate: (army: unknown, factionData: unknown) =>
            mapValidationResults(id, ruleFn(army as Army, factionData as FactionData)),
    };
}

/**
 * Creates the Warhammer 40K 10th Edition validation rules as PluginValidationRule objects.
 * Wraps the existing validation functions in the system rule format.
 */
function createValidationRules(): PluginValidationRule[] {
    return [
        wrapValidationRule('wh40k10e:points', 'Points Validation', validatePoints),
        wrapValidationRule('wh40k10e:strategic-reserves', 'Strategic Reserves', validateStrategicReserves),
        wrapValidationRule('wh40k10e:composition', 'Unit Composition', validateComposition),
        wrapValidationRule('wh40k10e:character', 'Character Requirements', validateCharacter),
        wrapValidationRule('wh40k10e:detachment', 'Detachment Rules', validateDetachment),
        wrapValidationRule('wh40k10e:enhancements', 'Enhancement Rules', validateEnhancements),
        wrapValidationRule('wh40k10e:faction-keyword', 'Faction Keyword', validateFactionKeyword),
        wrapValidationRule('wh40k10e:leaders', 'Leader Attachment', validateLeaders),
        wrapValidationRule('wh40k10e:transport', 'Transport Rules', validateTransport),
        wrapValidationRule('wh40k10e:wargear', 'Wargear Options', validateWargear),
        wrapValidationRule('wh40k10e:warlord', 'Warlord Designation', validateWarlord),
    ];
}

/**
 * Warhammer 40K 10th Edition game system implementation.
 * Provides entity types, validation rules, data syncing, and hydration.
 */
class Wh40k10eSystem implements GameSystem {
    /** @inheritdoc */
    readonly id = 'wh40k10e';
    /** @inheritdoc */
    readonly name = '10th Edition';
    /** @inheritdoc */
    readonly version = '1.0.0';
    /** @inheritdoc */
    readonly dataSource = WH40K_DATA_SOURCE;
    /** @inheritdoc */
    readonly entityKinds = WH40K_ENTITY_KINDS;
    /** @inheritdoc */
    readonly validationRules = createValidationRules();

    /**
     * Returns the schema extension for wh40k10e database tables.
     * TODO(Phase 4): Populate with game-specific table definitions after plugin extraction.
     */
    getSchemaExtension(): SchemaExtension {
        return {};
    }

    /**
     * Returns hydrator functions for entity kinds requiring deserialization.
     */
    getHydrators(): Map<string, EntityHydrator> {
        const hydrators = new Map<string, EntityHydrator>();
        hydrators.set('factionData', hydrateFactionData as EntityHydrator);
        hydrators.set('coreRules', hydrateCoreRules as EntityHydrator);
        hydrators.set('chapterApproved', hydrateChapterApproved as EntityHydrator);

        return hydrators;
    }

    /**
     * Registers the wh40k10e system's entity kinds and hydrators in global registries.
     * Registers all entity kinds, hydrators, and entity codecs for serialization/deserialization.
     */
    register(): void {
        for (const entityKind of this.entityKinds) {
            registerPluginEntity(entityKind.kind, {
                pluginId: this.id,
                displayName: entityKind.displayName,
                requiresHydration: entityKind.requiresHydration,
            });
        }

        for (const [kind, hydrator] of this.getHydrators()) {
            registerHydrator(kind, hydrator);
        }

        registerEntityCodec('factionData', {
            serialize: (entity) => ({ ...(entity as Record<string, unknown>) }),
            hydrate: (raw) => hydrateFactionData(raw),
        });

        registerEntityCodec('coreRules', {
            serialize: (entity) => ({ ...(entity as Record<string, unknown>) }),
            hydrate: (raw) => hydrateCoreRules(raw),
        });

        registerEntityCodec('chapterApproved', {
            serialize: (entity) => ({ ...(entity as Record<string, unknown>) }),
            hydrate: (raw) => hydrateChapterApproved(raw),
        });

        registerSchemaExtension(this.getSchemaExtension());
    }

    /**
     * Creates all wh40k10e-specific DAOs and the game data context.
     * Instantiates 40 faction DAOs, core rules, crusade rules, and chapter approved DAOs,
     * then wraps them in a GameData instance for unified access.
     * @param adapter - Database adapter for entity storage
     * @param githubClient - GitHub client for BSData synchronization
     * @returns GameContextResult with armies, campaigns, matches DAOs and game data context
     */
    createGameContext(adapter: DatabaseAdapter, githubClient: IGitHubClient): GameContextResult {
        const wahapediaClient = createWahapediaClient(createProxyFetch());
        const chapterApprovedDAO = new ChapterApprovedDAO(adapter, wahapediaClient);
        const coreRulesDAO = new CoreRulesDAO(adapter, githubClient);
        const crusadeRulesDAO = new CrusadeRulesDAO(adapter, githubClient);
        const aeldariDAO = new AeldariDAO(adapter, githubClient);
        const drukhariDAO = new DrukhariDAO(adapter, githubClient);
        const chaosSpaceMarinesDAO = new ChaosSpaceMarinesDAO(adapter, githubClient);
        const chaosDaemonsDAO = new ChaosDaemonsDAO(adapter, githubClient);
        const chaosKnightsDAO = new ChaosKnightsDAO(adapter, githubClient);
        const deathGuardDAO = new DeathGuardDAO(adapter, githubClient);
        const emperorsChildrenDAO = new EmperorsChildrenDAO(adapter, githubClient);
        const thousandSonsDAO = new ThousandSonsDAO(adapter, githubClient);
        const worldEatersDAO = new WorldEatersDAO(adapter, githubClient);
        const adeptaSororitasDAO = new AdeptaSororitasDAO(adapter, githubClient);
        const adeptusCustodesDAO = new AdeptusCustodesDAO(adapter, githubClient);
        const adeptusMechanicusDAO = new AdeptusMechanicusDAO(adapter, githubClient);
        const agentsOfTheImperiumDAO = new AgentsOfTheImperiumDAO(adapter, githubClient);
        const astraMilitarumDAO = new AstraMilitarumDAO(adapter, githubClient);
        const imperialKnightsDAO = new ImperialKnightsDAO(adapter, githubClient);
        const greyKnightsDAO = new GreyKnightsDAO(adapter, githubClient);
        const spaceMarinesDAO = new SpaceMarinesDAO(adapter, githubClient);
        const blackTemplarsDAO = new BlackTemplarsDAO(adapter, githubClient);
        const bloodAngelsDAO = new BloodAngelsDAO(adapter, githubClient);
        const darkAngelsDAO = new DarkAngelsDAO(adapter, githubClient);
        const deathwatchDAO = new DeathwatchDAO(adapter, githubClient);
        const spaceWolvesDAO = new SpaceWolvesDAO(adapter, githubClient);
        const ultramarinesDAO = new UltramarinesDAO(adapter, githubClient);
        const imperialFistsDAO = new ImperialFistsDAO(adapter, githubClient);
        const ironHandsDAO = new IronHandsDAO(adapter, githubClient);
        const ravenGuardDAO = new RavenGuardDAO(adapter, githubClient);
        const salamandersDAO = new SalamandersDAO(adapter, githubClient);
        const whiteScarsDAO = new WhiteScarsDAO(adapter, githubClient);
        const genestealerCultsDAO = new GenestealerCultsDAO(adapter, githubClient);
        const leaguesOfVotannDAO = new LeaguesOfVotannDAO(adapter, githubClient);
        const necronDAO = new NecronDAO(adapter, githubClient);
        const orksDAO = new OrksDAO(adapter, githubClient);
        const tauEmpireDAO = new TauEmpireDAO(adapter, githubClient);
        const tyranidsDAO = new TyranidsDAO(adapter, githubClient);
        const adeptusTitanicusDAO = new AdeptusTitanicusDAO(adapter, githubClient);
        const titanicusTraitorisDAO = new TitanicusTraitorisDAO(adapter, githubClient);
        const unalignedForcesDAO = new UnalignedForcesDAO(adapter, githubClient);

        const game = new GameData({
            chapterApprovedDAO,
            coreRulesDAO,
            crusadeRulesDAO,
            aeldariDAO,
            drukhariDAO,
            chaosSpaceMarinesDAO,
            chaosDaemonsDAO,
            chaosKnightsDAO,
            deathGuardDAO,
            emperorsChildrenDAO,
            thousandSonsDAO,
            worldEatersDAO,
            adeptaSororitasDAO,
            adeptusCustodesDAO,
            adeptusMechanicusDAO,
            agentsOfTheImperiumDAO,
            astraMilitarumDAO,
            imperialKnightsDAO,
            greyKnightsDAO,
            spaceMarinesDAO,
            blackTemplarsDAO,
            bloodAngelsDAO,
            darkAngelsDAO,
            deathwatchDAO,
            spaceWolvesDAO,
            ultramarinesDAO,
            imperialFistsDAO,
            ironHandsDAO,
            ravenGuardDAO,
            salamandersDAO,
            whiteScarsDAO,
            genestealerCultsDAO,
            leaguesOfVotannDAO,
            necronDAO,
            orksDAO,
            tauEmpireDAO,
            tyranidsDAO,
            adeptusTitanicusDAO,
            titanicusTraitorisDAO,
            unalignedForcesDAO,
        });

        return {
            armies: new ArmyDAO(adapter),
            campaigns: new CampaignDAO(adapter),
            game,
            sync: () => game.sync(),
        };
    }
}

/**
 * Shared singleton system instance for registry and DataContext usage.
 */
export const wh40k10eSystem = new Wh40k10eSystem();

/**
 * Creates and returns the wh40k10e game system implementation.
 * @returns The Wh40k10e system implementation.
 */
export function createWh40k10eSystem(): Wh40k10eSystem {
    return new Wh40k10eSystem();
}
