/**
 * Chapter Approved model interface and hydration.
 *
 * Defines the Chapter Approved 2025-26 mission pack aggregate data structure.
 * Contains all mission cards, deployment zones, challenger cards, twist cards, and tournament mission configurations.
 * This is read-only reference data extracted from the Chapter Approved 2025-26 publication.
 *
 * @requirements
 * 1. Must define a plain interface for Chapter Approved data (no class).
 * 2. Must provide a hydration function to reconstruct a ChapterApproved from raw JSON.
 * 3. Must default all array fields to empty arrays when missing from raw data.
 */

import type {
    PrimaryMission,
    SecondaryMission,
    DeploymentZone,
    ChallengerCard,
    TwistCard,
    TournamentMission,
    TerrainLayout,
} from './ChapterApprovedTypes.ts';

/**
 * Chapter Approved 2025-26 mission pack aggregate model.
 * Contains all mission cards, deployment zones, challenger cards, twist cards, and tournament mission configurations.
 * This is read-only reference data extracted from the Chapter Approved 2025-26 publication.
 */
interface ChapterApproved {
    /** Unique identifier for this Chapter Approved version (e.g. "chapter-approved-2025-26") */
    readonly id: string;
    /** Version string for this Chapter Approved publication (e.g. "2025-26") */
    readonly version: string;

    /** All primary mission cards available in this Chapter Approved pack */
    readonly primaryMissions: PrimaryMission[];
    /** All secondary mission cards (both Fixed and Tactical) available in this Chapter Approved pack */
    readonly secondaryMissions: SecondaryMission[];
    /** All deployment zone cards for Strike Force, Incursion, and Asymmetric War missions */
    readonly deploymentZones: DeploymentZone[];
    /** All dual-sided challenger cards (Stratagem/Mission pairs) */
    readonly challengerCards: ChallengerCard[];
    /** All twist cards that modify battle conditions */
    readonly twistCards: TwistCard[];
    /** Pre-generated tournament mission configurations (Mission A through Mission T) */
    readonly tournamentMissions: TournamentMission[];
    /** Tournament terrain layouts with standardized placement diagrams */
    readonly terrainLayouts: TerrainLayout[];
}

/**
 * Hydrate a ChapterApproved from a raw JSON object.
 * Reconstructs a ChapterApproved plain object from raw data (e.g. from database or API).
 * Defaults all array fields to empty arrays when missing.
 *
 * @param json - Raw object representation of ChapterApproved
 * @returns Hydrated ChapterApproved plain object
 */
function hydrateChapterApproved(json: unknown): ChapterApproved {
    const data = json as Record<string, unknown>;

    return {
        id: data.id as string,
        version: data.version as string,
        primaryMissions: (data.primaryMissions as PrimaryMission[]) ?? [],
        secondaryMissions: (data.secondaryMissions as SecondaryMission[]) ?? [],
        deploymentZones: (data.deploymentZones as DeploymentZone[]) ?? [],
        challengerCards: (data.challengerCards as ChallengerCard[]) ?? [],
        twistCards: (data.twistCards as TwistCard[]) ?? [],
        tournamentMissions: (data.tournamentMissions as TournamentMission[]) ?? [],
        terrainLayouts: (data.terrainLayouts as TerrainLayout[]) ?? [],
    };
}

export type { ChapterApproved };
export { hydrateChapterApproved };
