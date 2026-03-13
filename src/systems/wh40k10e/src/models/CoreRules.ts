/**
 * Core rules model interface and hydration.
 *
 * Defines the structure for parsed .gst (game system) file data including profile types,
 * cost types, shared rules, categories, and constraints. This represents the foundational
 * rules structure that all faction catalogues build upon.
 *
 * @requirements
 * 1. Must define plain interfaces for CoreRules and its sub-types (no classes).
 * 2. Must provide a hydration function to reconstruct a CoreRules from raw JSON.
 * 3. Must default array fields to empty arrays and handle Date hydration from ISO strings.
 * 4. Must export ProfileTypeInfo, CostTypeInfo, and SharedRule as named type exports.
 */

import type { ParsedConstraint } from '@armoury/validation';

/**
 * Profile type information extracted from game system.
 * Profile types define the structure of unit datasheets (e.g. "Unit", "Ranged Weapons", "Melee Weapons", "Abilities").
 */
interface ProfileTypeInfo {
    /** Unique identifier for this profile type */
    id: string;
    /** Display name of the profile type */
    name: string;
    /** Characteristic types that appear in profiles of this type (e.g. M, T, SV, W, LD, OC for Unit profiles) */
    characteristicTypes: { id: string; name: string }[];
}

/**
 * Cost type information extracted from game system.
 * Cost types define how units are priced (e.g. "pts" for points, "PL" for Power Level).
 */
interface CostTypeInfo {
    /** Unique identifier for this cost type */
    id: string;
    /** Display name of the cost type (e.g. "pts", "Power Level") */
    name: string;
    /** Default cost limit for this cost type, if any */
    defaultCostLimit?: string;
}

/**
 * Shared rule information extracted from game system.
 * Shared rules are global rules that apply across the game system (e.g. "Invulnerable Save", "Feel No Pain").
 */
interface SharedRule {
    /** Unique identifier for this shared rule */
    id: string;
    /** Display name of the shared rule */
    name: string;
    /** Description of the rule's effect, if available */
    description?: string;
}

/**
 * Core rules data for a game system.
 * Extracted from BattleScribe .gst (game system) files. Contains profile types, cost types,
 * shared rules, categories, and constraints that form the foundation for all faction data.
 */
interface CoreRules {
    /** Unique identifier for this game system */
    id: string;
    /** Display name of the game system (e.g. "Warhammer 40K 10th Edition") */
    name: string;
    /** Revision number of the game system */
    revision: string;
    /** BattleScribe version this game system was created with */
    battleScribeVersion: string;

    /** Profile types that define unit datasheet structure (e.g. "Unit", "Ranged Weapons", "Melee Weapons") */
    profileTypes: ProfileTypeInfo[];
    /** Cost types used to price units (e.g. "pts" for points) */
    costTypes: CostTypeInfo[];
    /** Shared rules that apply across the game system */
    sharedRules: SharedRule[];
    /** Categories for organizing units (e.g. "HQ", "Troops", "Elites") */
    categories: { id: string; name: string }[];
    /** Army construction constraints parsed from the game system */
    constraints: ParsedConstraint[];

    /** When this game system was last synced from BattleScribe */
    lastSynced: Date;
    /** Path to the source .gst file */
    sourceFile: string;
}

/**
 * Hydrate a CoreRules from a raw JSON object.
 * Reconstructs a CoreRules plain object from raw data (e.g. from database or API).
 * Handles Date hydration from ISO strings and defaults array fields to empty arrays.
 *
 * @param json - Raw object representation of CoreRules
 * @returns Hydrated CoreRules plain object
 */
function hydrateCoreRules(json: unknown): CoreRules {
    const data = json as Record<string, unknown>;

    return {
        id: data.id as string,
        name: data.name as string,
        revision: data.revision as string,
        battleScribeVersion: data.battleScribeVersion as string,
        profileTypes: (data.profileTypes as ProfileTypeInfo[]) ?? [],
        costTypes: (data.costTypes as CostTypeInfo[]) ?? [],
        sharedRules: (data.sharedRules as SharedRule[]) ?? [],
        categories: (data.categories as { id: string; name: string }[]) ?? [],
        constraints: (data.constraints as ParsedConstraint[]) ?? [],
        sourceFile: data.sourceFile as string,
        lastSynced: data.lastSynced ? new Date(data.lastSynced as string) : new Date(),
    };
}

export type { CoreRules, ProfileTypeInfo, CostTypeInfo, SharedRule };
export { hydrateCoreRules };
