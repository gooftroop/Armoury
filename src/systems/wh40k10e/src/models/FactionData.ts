/**
 * Faction data model interface and hydration.
 *
 * Defines the structure for parsed BattleScribe .cat (catalogue) file data including
 * units, weapons, abilities, stratagems, detachments, and enhancements. Each faction
 * has one FactionData object that aggregates all of its game entities.
 *
 * @requirements
 * 1. Must define plain interfaces for FactionData and FactionRule (no classes).
 * 2. Must provide a hydration function to reconstruct a FactionData from raw JSON.
 * 3. Must default all array fields to empty arrays when missing from raw data.
 * 4. Must handle Date hydration from ISO strings for lastSynced.
 * 5. Must normalize nested unit, detachment, enhancement, and weapon data during hydration.
 */

import type { Ability, Detachment, Enhancement, Stratagem, Weapon } from '@wh40k10e/types/entities.js';
import type { Unit } from '@wh40k10e/models/UnitModel.js';
import type { StructuredRule } from '@wh40k10e/types/effects.js';

/**
 * Faction rule data extracted from BattleScribe catalogues.
 * Faction rules are special abilities or rules that apply to all units in a faction.
 */
interface FactionRule {
    /** Unique identifier for this faction rule */
    id: string;
    /** Display name of the faction rule */
    name: string;
    /** Full description of the rule's effect */
    description: string;
}

/**
 * Faction data aggregating all game entities for a single faction.
 * Extracted from BattleScribe .cat (catalogue) files. Contains units, weapons, abilities,
 * stratagems, detachments, and enhancements that make up a faction's complete game data.
 */
interface FactionData {
    /** Unique identifier for this faction (e.g. "space-marines", "necrons") */
    id: string;
    /** Display name of the faction (e.g. "Space Marines") */
    name: string;
    /** URL to faction army artwork or logo */
    armyImageUrl: string;

    /** Paths to source .cat files that were merged to create this faction data */
    sourceFiles: string[];
    /** When this faction data was last synced from BattleScribe */
    lastSynced: Date;

    /** Faction-specific rules that apply to all units in the faction */
    factionRules: FactionRule[];
    /** Parsed and structured faction rules for rule validation */
    structuredFactionRules: StructuredRule[];
    /** Stratagems available to this faction */
    stratagems: Stratagem[];
    /** Detachments available to this faction (provide Stratagems, Enhancements, and Detachment Abilities) */
    detachments: Detachment[];
    /** Enhancements available to this faction (can be applied to Character units) */
    enhancements: Enhancement[];

    /** All unit datasheets available in this faction */
    units: Unit[];

    /** Shared weapons used by units in this faction */
    weapons: Weapon[];
    /** Shared abilities used by units in this faction */
    abilities: Ability[];
}

/**
 * Hydrate a FactionData from a raw JSON object.
 * Reconstructs a FactionData plain object from raw data (e.g. from database or API).
 * Handles Date hydration from ISO strings, defaults array fields to empty arrays,
 * and normalizes nested unit, detachment, enhancement, and weapon data.
 *
 * @param json - Raw object representation of FactionData
 * @returns Hydrated FactionData plain object
 */
function hydrateFactionData(json: unknown): FactionData {
    const data = json as Record<string, unknown>;

    const lastSyncedValue = data.lastSynced;
    const lastSynced =
        typeof lastSyncedValue === 'string'
            ? new Date(lastSyncedValue)
            : lastSyncedValue instanceof Date
              ? lastSyncedValue
              : new Date();

    const rawUnits = (data.units as Unit[]) ?? [];
    const units = rawUnits.map((unit) => ({
        ...unit,
        composition: unit.composition ?? [],
        rangedWeapons: unit.rangedWeapons ?? [],
        meleeWeapons: unit.meleeWeapons ?? [],
        wargearOptions: unit.wargearOptions ?? [],
        wargearAbilities: unit.wargearAbilities ?? [],
        abilities: unit.abilities ?? [],
        structuredAbilities: unit.structuredAbilities ?? [],
        constraints: unit.constraints ?? [],
        leader: unit.leader ?? undefined,
        keywords: unit.keywords ?? [],
        factionKeywords: unit.factionKeywords ?? [],
        imageUrl: unit.imageUrl ?? '',
    }));

    return {
        id: data.id as string,
        name: data.name as string,
        armyImageUrl: (data.armyImageUrl as string) ?? '',
        sourceFiles: (data.sourceFiles as string[]) ?? [],
        lastSynced,
        factionRules: (data.factionRules as FactionRule[]) ?? [],
        structuredFactionRules: (data.structuredFactionRules as StructuredRule[]) ?? [],
        stratagems: (data.stratagems as Stratagem[]) ?? [],
        detachments: ((data.detachments as Detachment[]) ?? []).map((detachment) => ({
            ...detachment,
            rules: detachment.rules ?? [],
            structuredRules: detachment.structuredRules ?? [],
            enhancements: (detachment.enhancements ?? []).map((enhancement) => ({
                ...enhancement,
                eligibleKeywords: enhancement.eligibleKeywords ?? [],
                structuredEffect: enhancement.structuredEffect ?? null,
            })),
        })),
        enhancements: ((data.enhancements as Enhancement[]) ?? []).map((enhancement) => ({
            ...enhancement,
            eligibleKeywords: enhancement.eligibleKeywords ?? [],
            structuredEffect: enhancement.structuredEffect ?? null,
        })),
        units,
        weapons: ((data.weapons as Weapon[]) ?? []).map((weapon) => ({
            ...weapon,
            keywords: weapon.keywords ?? [],
            parsedKeywords: weapon.parsedKeywords ?? [],
        })),
        abilities: (data.abilities as Ability[]) ?? [],
    };
}

export type { FactionData, FactionRule };
export { hydrateFactionData };
