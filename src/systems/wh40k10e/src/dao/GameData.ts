import type { FactionData } from '../models/FactionData.ts';
import type { CoreRules } from '../models/CoreRules.ts';
import type { CrusadeRules } from '../models/CrusadeRulesModel.ts';
import type { ChapterApproved } from '../models/ChapterApproved.ts';
import type { ChapterApprovedDAO } from './ChapterApprovedDAO.ts';
import type { CoreRulesDAO } from './CoreRulesDAO.ts';
import type { CrusadeRulesDAO } from './CrusadeRulesDAO.ts';
import type { SpaceMarinesDAO } from './factions/SpaceMarinesDAO.ts';
import type { BloodAngelsDAO } from './factions/BloodAngelsDAO.ts';
import type { DarkAngelsDAO } from './factions/DarkAngelsDAO.ts';
import type { SpaceWolvesDAO } from './factions/SpaceWolvesDAO.ts';
import type { BlackTemplarsDAO } from './factions/BlackTemplarsDAO.ts';
import type { DeathwatchDAO } from './factions/DeathwatchDAO.ts';
import type { UltramarinesDAO } from './factions/UltramarinesDAO.ts';
import type { ImperialFistsDAO } from './factions/ImperialFistsDAO.ts';
import type { IronHandsDAO } from './factions/IronHandsDAO.ts';
import type { RavenGuardDAO } from './factions/RavenGuardDAO.ts';
import type { SalamandersDAO } from './factions/SalamandersDAO.ts';
import type { WhiteScarsDAO } from './factions/WhiteScarsDAO.ts';
import type { NecronDAO } from './factions/NecronDAO.ts';
import type { AeldariDAO } from './factions/AeldariDAO.ts';
import type { DrukhariDAO } from './factions/DrukhariDAO.ts';
import type { ChaosSpaceMarinesDAO } from './factions/ChaosSpaceMarinesDAO.ts';
import type { ChaosDaemonsDAO } from './factions/ChaosDaemonsDAO.ts';
import type { ChaosKnightsDAO } from './factions/ChaosKnightsDAO.ts';
import type { DeathGuardDAO } from './factions/DeathGuardDAO.ts';
import type { EmperorsChildrenDAO } from './factions/EmperorsChildrenDAO.ts';
import type { ThousandSonsDAO } from './factions/ThousandSonsDAO.ts';
import type { WorldEatersDAO } from './factions/WorldEatersDAO.ts';
import type { AdeptaSororitasDAO } from './factions/AdeptaSororitasDAO.ts';
import type { AdeptusCustodesDAO } from './factions/AdeptusCustodesDAO.ts';
import type { AdeptusMechanicusDAO } from './factions/AdeptusMechanicusDAO.ts';
import type { AgentsOfTheImperiumDAO } from './factions/AgentsOfTheImperiumDAO.ts';
import type { AstraMilitarumDAO } from './factions/AstraMilitarumDAO.ts';
import type { ImperialKnightsDAO } from './factions/ImperialKnightsDAO.ts';
import type { GreyKnightsDAO } from './factions/GreyKnightsDAO.ts';
import type { GenestealerCultsDAO } from './factions/GenestealerCultsDAO.ts';
import type { LeaguesOfVotannDAO } from './factions/LeaguesOfVotannDAO.ts';
import type { OrksDAO } from './factions/OrksDAO.ts';
import type { TauEmpireDAO } from './factions/TauEmpireDAO.ts';
import type { TyranidsDAO } from './factions/TyranidsDAO.ts';
import type { AdeptusTitanicusDAO } from './factions/AdeptusTitanicusDAO.ts';
import type { TitanicusTraitorisDAO } from './factions/TitanicusTraitorisDAO.ts';
import type { UnalignedForcesDAO } from './factions/UnalignedForcesDAO.ts';

/** Dependencies required to construct a GameData instance. */
export interface GameDataDeps {
    chapterApprovedDAO: ChapterApprovedDAO;
    coreRulesDAO: CoreRulesDAO;
    crusadeRulesDAO: CrusadeRulesDAO;
    aeldariDAO: AeldariDAO;
    drukhariDAO: DrukhariDAO;
    chaosSpaceMarinesDAO: ChaosSpaceMarinesDAO;
    chaosDaemonsDAO: ChaosDaemonsDAO;
    chaosKnightsDAO: ChaosKnightsDAO;
    deathGuardDAO: DeathGuardDAO;
    emperorsChildrenDAO: EmperorsChildrenDAO;
    thousandSonsDAO: ThousandSonsDAO;
    worldEatersDAO: WorldEatersDAO;
    adeptaSororitasDAO: AdeptaSororitasDAO;
    adeptusCustodesDAO: AdeptusCustodesDAO;
    adeptusMechanicusDAO: AdeptusMechanicusDAO;
    agentsOfTheImperiumDAO: AgentsOfTheImperiumDAO;
    astraMilitarumDAO: AstraMilitarumDAO;
    imperialKnightsDAO: ImperialKnightsDAO;
    greyKnightsDAO: GreyKnightsDAO;
    spaceMarinesDAO: SpaceMarinesDAO;
    blackTemplarsDAO: BlackTemplarsDAO;
    bloodAngelsDAO: BloodAngelsDAO;
    darkAngelsDAO: DarkAngelsDAO;
    deathwatchDAO: DeathwatchDAO;
    spaceWolvesDAO: SpaceWolvesDAO;
    ultramarinesDAO: UltramarinesDAO;
    imperialFistsDAO: ImperialFistsDAO;
    ironHandsDAO: IronHandsDAO;
    ravenGuardDAO: RavenGuardDAO;
    salamandersDAO: SalamandersDAO;
    whiteScarsDAO: WhiteScarsDAO;
    genestealerCultsDAO: GenestealerCultsDAO;
    leaguesOfVotannDAO: LeaguesOfVotannDAO;
    necronDAO: NecronDAO;
    orksDAO: OrksDAO;
    tauEmpireDAO: TauEmpireDAO;
    tyranidsDAO: TyranidsDAO;
    adeptusTitanicusDAO: AdeptusTitanicusDAO;
    titanicusTraitorisDAO: TitanicusTraitorisDAO;
    unalignedForcesDAO: UnalignedForcesDAO;
}

/**
 * Game-specific data context for Warhammer 40K 10th Edition.
 * Exposes 40 async property getters (3 core + 37 factions) that load and
 * memoize data from the underlying DAOs.
 */
export class GameData {
    private readonly deps: GameDataDeps;

    /**
     * Creates a GameData context.
     * @param deps - All 40 faction and core rules DAOs
     */
    constructor(deps: GameDataDeps) {
        this.deps = deps;
    }

    /**
     * Eagerly syncs all reference data DAOs in parallel.
     * Uses Promise.allSettled so individual failures (e.g. network down) don't prevent startup.
     * Failed DAOs will retry on next direct access via their getter.
     * Logs a warning if any DAOs fail to sync.
     */
    async sync(): Promise<void> {
        const results = await Promise.allSettled([
            this.deps.chapterApprovedDAO.load(),
            this.deps.coreRulesDAO.load(),
            this.deps.crusadeRulesDAO.load(),
            this.deps.aeldariDAO.load(),
            this.deps.drukhariDAO.load(),
            this.deps.chaosSpaceMarinesDAO.load(),
            this.deps.chaosDaemonsDAO.load(),
            this.deps.chaosKnightsDAO.load(),
            this.deps.deathGuardDAO.load(),
            this.deps.emperorsChildrenDAO.load(),
            this.deps.thousandSonsDAO.load(),
            this.deps.worldEatersDAO.load(),
            this.deps.adeptaSororitasDAO.load(),
            this.deps.adeptusCustodesDAO.load(),
            this.deps.adeptusMechanicusDAO.load(),
            this.deps.agentsOfTheImperiumDAO.load(),
            this.deps.astraMilitarumDAO.load(),
            this.deps.imperialKnightsDAO.load(),
            this.deps.greyKnightsDAO.load(),
            this.deps.spaceMarinesDAO.load(),
            this.deps.blackTemplarsDAO.load(),
            this.deps.bloodAngelsDAO.load(),
            this.deps.darkAngelsDAO.load(),
            this.deps.deathwatchDAO.load(),
            this.deps.spaceWolvesDAO.load(),
            this.deps.ultramarinesDAO.load(),
            this.deps.imperialFistsDAO.load(),
            this.deps.ironHandsDAO.load(),
            this.deps.ravenGuardDAO.load(),
            this.deps.salamandersDAO.load(),
            this.deps.whiteScarsDAO.load(),
            this.deps.genestealerCultsDAO.load(),
            this.deps.leaguesOfVotannDAO.load(),
            this.deps.necronDAO.load(),
            this.deps.orksDAO.load(),
            this.deps.tauEmpireDAO.load(),
            this.deps.tyranidsDAO.load(),
            this.deps.adeptusTitanicusDAO.load(),
            this.deps.titanicusTraitorisDAO.load(),
            this.deps.unalignedForcesDAO.load(),
        ]);

        const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');

        if (failures.length > 0) {
            console.warn(`[GameData.sync] ${failures.length}/${results.length} DAOs failed to sync`);
        }
    }

    // ===== Core =====

    /** Loads Chapter Approved 2025-26 mission data, fetching from Wahapedia if not cached. */
    get chapterApproved(): Promise<ChapterApproved> {
        return this.deps.chapterApprovedDAO.load();
    }

    /** Loads core rules, syncing from BSData if needed. */
    get coreRules(): Promise<CoreRules> {
        return this.deps.coreRulesDAO.load();
    }

    /** Loads crusade rules. */
    get crusadeRules(): Promise<CrusadeRules> {
        return this.deps.crusadeRulesDAO.load();
    }

    // ===== Aeldari =====

    /** Loads Aeldari faction data. */
    get aeldari(): Promise<FactionData> {
        return this.deps.aeldariDAO.load();
    }

    /** Loads Drukhari faction data. */
    get drukhari(): Promise<FactionData> {
        return this.deps.drukhariDAO.load();
    }

    // ===== Chaos =====

    /** Loads Chaos Space Marines faction data. */
    get chaosSpaceMarines(): Promise<FactionData> {
        return this.deps.chaosSpaceMarinesDAO.load();
    }

    /** Loads Chaos Daemons faction data. */
    get chaosDaemons(): Promise<FactionData> {
        return this.deps.chaosDaemonsDAO.load();
    }

    /** Loads Chaos Knights faction data. */
    get chaosKnights(): Promise<FactionData> {
        return this.deps.chaosKnightsDAO.load();
    }

    /** Loads Death Guard faction data. */
    get deathGuard(): Promise<FactionData> {
        return this.deps.deathGuardDAO.load();
    }

    /** Loads Emperor's Children faction data. */
    get emperorsChildren(): Promise<FactionData> {
        return this.deps.emperorsChildrenDAO.load();
    }

    /** Loads Thousand Sons faction data. */
    get thousandSons(): Promise<FactionData> {
        return this.deps.thousandSonsDAO.load();
    }

    /** Loads World Eaters faction data. */
    get worldEaters(): Promise<FactionData> {
        return this.deps.worldEatersDAO.load();
    }

    // ===== Imperium =====

    /** Loads Adepta Sororitas faction data. */
    get adeptaSororitas(): Promise<FactionData> {
        return this.deps.adeptaSororitasDAO.load();
    }

    /** Loads Adeptus Custodes faction data. */
    get adeptusCustodes(): Promise<FactionData> {
        return this.deps.adeptusCustodesDAO.load();
    }

    /** Loads Adeptus Mechanicus faction data. */
    get adeptusMechanicus(): Promise<FactionData> {
        return this.deps.adeptusMechanicusDAO.load();
    }

    /** Loads Agents of the Imperium faction data. */
    get agentsOfTheImperium(): Promise<FactionData> {
        return this.deps.agentsOfTheImperiumDAO.load();
    }

    /** Loads Astra Militarum faction data. */
    get astraMilitarum(): Promise<FactionData> {
        return this.deps.astraMilitarumDAO.load();
    }

    /** Loads Imperial Knights faction data. */
    get imperialKnights(): Promise<FactionData> {
        return this.deps.imperialKnightsDAO.load();
    }

    /** Loads Grey Knights faction data. */
    get greyKnights(): Promise<FactionData> {
        return this.deps.greyKnightsDAO.load();
    }

    // ===== Space Marines + Chapters =====

    /** Loads Space Marines faction data. */
    get spaceMarines(): Promise<FactionData> {
        return this.deps.spaceMarinesDAO.load();
    }

    /** Loads Black Templars faction data (includes Space Marines base). */
    get blackTemplars(): Promise<FactionData> {
        return this.deps.blackTemplarsDAO.load();
    }

    /** Loads Blood Angels faction data (includes Space Marines base). */
    get bloodAngels(): Promise<FactionData> {
        return this.deps.bloodAngelsDAO.load();
    }

    /** Loads Dark Angels faction data (includes Space Marines base). */
    get darkAngels(): Promise<FactionData> {
        return this.deps.darkAngelsDAO.load();
    }

    /** Loads Deathwatch faction data (includes Space Marines base). */
    get deathwatch(): Promise<FactionData> {
        return this.deps.deathwatchDAO.load();
    }

    /** Loads Space Wolves faction data (includes Space Marines base). */
    get spaceWolves(): Promise<FactionData> {
        return this.deps.spaceWolvesDAO.load();
    }

    /** Loads Ultramarines faction data (includes Space Marines base). */
    get ultramarines(): Promise<FactionData> {
        return this.deps.ultramarinesDAO.load();
    }

    /** Loads Imperial Fists faction data (includes Space Marines base). */
    get imperialFists(): Promise<FactionData> {
        return this.deps.imperialFistsDAO.load();
    }

    /** Loads Iron Hands faction data (includes Space Marines base). */
    get ironHands(): Promise<FactionData> {
        return this.deps.ironHandsDAO.load();
    }

    /** Loads Raven Guard faction data (includes Space Marines base). */
    get ravenGuard(): Promise<FactionData> {
        return this.deps.ravenGuardDAO.load();
    }

    /** Loads Salamanders faction data (includes Space Marines base). */
    get salamanders(): Promise<FactionData> {
        return this.deps.salamandersDAO.load();
    }

    /** Loads White Scars faction data (includes Space Marines base). */
    get whiteScars(): Promise<FactionData> {
        return this.deps.whiteScarsDAO.load();
    }

    // ===== Xenos =====

    /** Loads Genestealer Cults faction data. */
    get genestealerCults(): Promise<FactionData> {
        return this.deps.genestealerCultsDAO.load();
    }

    /** Loads Leagues of Votann faction data. */
    get leaguesOfVotann(): Promise<FactionData> {
        return this.deps.leaguesOfVotannDAO.load();
    }

    /** Loads Necrons faction data. */
    get necrons(): Promise<FactionData> {
        return this.deps.necronDAO.load();
    }

    /** Loads Orks faction data. */
    get orks(): Promise<FactionData> {
        return this.deps.orksDAO.load();
    }

    /** Loads T'au Empire faction data. */
    get tauEmpire(): Promise<FactionData> {
        return this.deps.tauEmpireDAO.load();
    }

    /** Loads Tyranids faction data. */
    get tyranids(): Promise<FactionData> {
        return this.deps.tyranidsDAO.load();
    }

    // ===== Miscellaneous =====

    /** Loads Adeptus Titanicus faction data. */
    get adeptusTitanicus(): Promise<FactionData> {
        return this.deps.adeptusTitanicusDAO.load();
    }

    /** Loads Titanicus Traitoris faction data. */
    get titanicusTraitoris(): Promise<FactionData> {
        return this.deps.titanicusTraitorisDAO.load();
    }

    /** Loads Unaligned Forces faction data. */
    get unalignedForces(): Promise<FactionData> {
        return this.deps.unalignedForcesDAO.load();
    }
}
