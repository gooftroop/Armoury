import type { FactionData } from '@/models/FactionData.js';
import type { CoreRules } from '@/models/CoreRules.js';
import type { CrusadeRules } from '@/models/CrusadeRulesModel.js';
import type { ChapterApproved } from '@/models/ChapterApproved.js';
import type { ChapterApprovedDAO } from '@/dao/ChapterApprovedDAO.js';
import type { CoreRulesDAO } from '@/dao/CoreRulesDAO.js';
import type { CrusadeRulesDAO } from '@/dao/CrusadeRulesDAO.js';
import type { SpaceMarinesDAO } from '@/dao/factions/SpaceMarinesDAO.js';
import type { BloodAngelsDAO } from '@/dao/factions/BloodAngelsDAO.js';
import type { DarkAngelsDAO } from '@/dao/factions/DarkAngelsDAO.js';
import type { SpaceWolvesDAO } from '@/dao/factions/SpaceWolvesDAO.js';
import type { BlackTemplarsDAO } from '@/dao/factions/BlackTemplarsDAO.js';
import type { DeathwatchDAO } from '@/dao/factions/DeathwatchDAO.js';
import type { UltramarinesDAO } from '@/dao/factions/UltramarinesDAO.js';
import type { ImperialFistsDAO } from '@/dao/factions/ImperialFistsDAO.js';
import type { IronHandsDAO } from '@/dao/factions/IronHandsDAO.js';
import type { RavenGuardDAO } from '@/dao/factions/RavenGuardDAO.js';
import type { SalamandersDAO } from '@/dao/factions/SalamandersDAO.js';
import type { WhiteScarsDAO } from '@/dao/factions/WhiteScarsDAO.js';
import type { NecronDAO } from '@/dao/factions/NecronDAO.js';
import type { AeldariDAO } from '@/dao/factions/AeldariDAO.js';
import type { DrukhariDAO } from '@/dao/factions/DrukhariDAO.js';
import type { SyncResult } from '@armoury/data-dao';
import type { ChaosSpaceMarinesDAO } from '@/dao/factions/ChaosSpaceMarinesDAO.js';
import type { ChaosDaemonsDAO } from '@/dao/factions/ChaosDaemonsDAO.js';
import type { ChaosKnightsDAO } from '@/dao/factions/ChaosKnightsDAO.js';
import type { DeathGuardDAO } from '@/dao/factions/DeathGuardDAO.js';
import type { EmperorsChildrenDAO } from '@/dao/factions/EmperorsChildrenDAO.js';
import type { ThousandSonsDAO } from '@/dao/factions/ThousandSonsDAO.js';
import type { WorldEatersDAO } from '@/dao/factions/WorldEatersDAO.js';
import type { AdeptaSororitasDAO } from '@/dao/factions/AdeptaSororitasDAO.js';
import type { AdeptusCustodesDAO } from '@/dao/factions/AdeptusCustodesDAO.js';
import type { AdeptusMechanicusDAO } from '@/dao/factions/AdeptusMechanicusDAO.js';
import type { AgentsOfTheImperiumDAO } from '@/dao/factions/AgentsOfTheImperiumDAO.js';
import type { AstraMilitarumDAO } from '@/dao/factions/AstraMilitarumDAO.js';
import type { ImperialKnightsDAO } from '@/dao/factions/ImperialKnightsDAO.js';
import type { GreyKnightsDAO } from '@/dao/factions/GreyKnightsDAO.js';
import type { GenestealerCultsDAO } from '@/dao/factions/GenestealerCultsDAO.js';
import type { LeaguesOfVotannDAO } from '@/dao/factions/LeaguesOfVotannDAO.js';
import type { OrksDAO } from '@/dao/factions/OrksDAO.js';
import type { TauEmpireDAO } from '@/dao/factions/TauEmpireDAO.js';
import type { TyranidsDAO } from '@/dao/factions/TyranidsDAO.js';
import type { AdeptusTitanicusDAO } from '@/dao/factions/AdeptusTitanicusDAO.js';
import type { TitanicusTraitorisDAO } from '@/dao/factions/TitanicusTraitorisDAO.js';
import type { UnalignedForcesDAO } from '@/dao/factions/UnalignedForcesDAO.js';

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
     *
     * Uses Promise.allSettled so one DAO failure does not abort the others.
     * Returns a SyncResult describing which DAOs succeeded and which failed,
     * allowing the caller to decide how to handle partial or total failures.
     *
     * @returns SyncResult with succeeded/failed DAO details.
     */
    async sync(): Promise<SyncResult> {
        const daoEntries: Array<[string, Promise<unknown>]> = [
            ['ChapterApproved', this.deps.chapterApprovedDAO.load()],
            ['CoreRules', this.deps.coreRulesDAO.load()],
            ['CrusadeRules', this.deps.crusadeRulesDAO.load()],
            ['Aeldari', this.deps.aeldariDAO.load()],
            ['Drukhari', this.deps.drukhariDAO.load()],
            ['ChaosSpaceMarines', this.deps.chaosSpaceMarinesDAO.load()],
            ['ChaosDaemons', this.deps.chaosDaemonsDAO.load()],
            ['ChaosKnights', this.deps.chaosKnightsDAO.load()],
            ['DeathGuard', this.deps.deathGuardDAO.load()],
            ['EmperorsChildren', this.deps.emperorsChildrenDAO.load()],
            ['ThousandSons', this.deps.thousandSonsDAO.load()],
            ['WorldEaters', this.deps.worldEatersDAO.load()],
            ['AdeptaSororitas', this.deps.adeptaSororitasDAO.load()],
            ['AdeptusCustodes', this.deps.adeptusCustodesDAO.load()],
            ['AdeptusMechanicus', this.deps.adeptusMechanicusDAO.load()],
            ['AgentsOfTheImperium', this.deps.agentsOfTheImperiumDAO.load()],
            ['AstraMilitarum', this.deps.astraMilitarumDAO.load()],
            ['ImperialKnights', this.deps.imperialKnightsDAO.load()],
            ['GreyKnights', this.deps.greyKnightsDAO.load()],
            ['SpaceMarines', this.deps.spaceMarinesDAO.load()],
            ['BlackTemplars', this.deps.blackTemplarsDAO.load()],
            ['BloodAngels', this.deps.bloodAngelsDAO.load()],
            ['DarkAngels', this.deps.darkAngelsDAO.load()],
            ['Deathwatch', this.deps.deathwatchDAO.load()],
            ['SpaceWolves', this.deps.spaceWolvesDAO.load()],
            ['Ultramarines', this.deps.ultramarinesDAO.load()],
            ['ImperialFists', this.deps.imperialFistsDAO.load()],
            ['IronHands', this.deps.ironHandsDAO.load()],
            ['RavenGuard', this.deps.ravenGuardDAO.load()],
            ['Salamanders', this.deps.salamandersDAO.load()],
            ['WhiteScars', this.deps.whiteScarsDAO.load()],
            ['GenestealerCults', this.deps.genestealerCultsDAO.load()],
            ['LeaguesOfVotann', this.deps.leaguesOfVotannDAO.load()],
            ['Necrons', this.deps.necronDAO.load()],
            ['Orks', this.deps.orksDAO.load()],
            ['TauEmpire', this.deps.tauEmpireDAO.load()],
            ['Tyranids', this.deps.tyranidsDAO.load()],
            ['AdeptusTitanicus', this.deps.adeptusTitanicusDAO.load()],
            ['TitanicusTraitoris', this.deps.titanicusTraitorisDAO.load()],
            ['UnalignedForces', this.deps.unalignedForcesDAO.load()],
        ];

        const results = await Promise.allSettled(daoEntries.map(([, promise]) => promise));

        const succeeded: string[] = [];
        const failures: Array<{ dao: string; error: string }> = [];

        for (let i = 0; i < results.length; i++) {
            const result = results[i]!;
            const name = daoEntries[i]![0]!;

            if (result.status === 'fulfilled') {
                succeeded.push(name);
            } else {
                const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
                failures.push({ dao: name, error: reason });
            }
        }

        return {
            success: failures.length === 0,
            total: results.length,
            succeeded,
            failures,
            timestamp: new Date().toISOString(),
        };
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
