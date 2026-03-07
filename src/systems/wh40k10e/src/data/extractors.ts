/**
 * Warhammer 40K BattleScribe catalogue extractors.
 */

import type {
    BattleScribeCatalogue,
    BattleScribeSelectionEntry,
    BattleScribeProfile,
    BattleScribeCategoryLink,
} from '@providers-bsdata/types.js';
import { ensureArray } from '@providers-bsdata/types.js';
import {
    parseGameSystem,
    parseCatalogue,
    getCharacteristicValue,
    extractProfileCharacteristics,
} from '@providers-bsdata/xmlParser.js';
import { parseWeaponKeywords } from '@wh40k10e/validation/weaponKeywords.js';
import type { Weapon, RangedWeapon, MeleeWeapon, Ability } from '@wh40k10e/types/entities.js';
import type { Unit } from '@wh40k10e/models/UnitModel.js';
import type { UnitAbility, WargearAbility, LeaderInfo } from '@wh40k10e/models/UnitModel.js';

export { parseGameSystem, parseCatalogue };

/**
 * Extracts all unit definitions from a BattleScribe catalogue.
 *
 * Iterates through all selection entries (both regular and shared) and extracts those with type='unit'.
 * For each unit, extracts:
 * - Unit profile characteristics (M, T, SV, W, LD, OC, INV)
 * - Ranged and melee weapons from nested profiles
 * - Unit abilities and wargear abilities from profiles
 * - Leader information (if applicable)
 * - Keywords (unit keywords and faction keywords from category links)
 *
 * The function recursively processes nested selection entries and selection entry groups to find all weapons.
 *
 * @param catalogue - Parsed BattleScribeCatalogue object
 * @param sourceFile - The source file path/name for tracking data origin
 * @param sourceSha - The git SHA of the source file for version tracking
 * @returns Array of Unit objects with all extracted data (weapons, abilities, keywords, characteristics)
 */
export function extractUnits(catalogue: BattleScribeCatalogue, sourceFile: string, sourceSha: string): Unit[] {
    const units: Unit[] = [];
    const entries = [
        ...ensureArray(catalogue.catalogue.selectionEntries?.selectionEntry),
        ...ensureArray(catalogue.catalogue.sharedSelectionEntries?.selectionEntry),
    ];

    for (const entry of entries) {
        if (entry['@_type'] !== 'unit') {
            continue;
        }

        const profiles: BattleScribeProfile[] = ensureArray(entry.profiles?.profile);
        const unitProfile = profiles.find((p) => p['@_typeName'] === 'Unit');

        if (!unitProfile) {
            continue;
        }

        const chars = extractProfileCharacteristics(unitProfile);

        const weapons = extractWeaponsFromEntry(entry, sourceFile, sourceSha, entry['@_id']);
        const rangedWeapons = weapons.filter((weapon): weapon is RangedWeapon => weapon.type === 'ranged');
        const meleeWeapons = weapons.filter((weapon): weapon is MeleeWeapon => weapon.type === 'melee');
        const wargearAbilities = extractWargearAbilities(entry);
        const abilities = extractUnitAbilities(entry);
        const leader = extractLeaderInfo(entry, abilities);

        const unit = {
            id: entry['@_id'],
            name: entry['@_name'],
            sourceFile,
            sourceSha,
            factionId: catalogue.catalogue['@_id'],
            movement: getCharacteristicValue(chars, 'M') ?? '',
            toughness: parseInt(getCharacteristicValue(chars, 'T') ?? '0', 10),
            save: getCharacteristicValue(chars, 'SV') ?? '',
            wounds: parseInt(getCharacteristicValue(chars, 'W') ?? '0', 10),
            leadership: parseInt(getCharacteristicValue(chars, 'LD') ?? '0', 10),
            objectiveControl: parseInt(getCharacteristicValue(chars, 'OC') ?? '0', 10),
            invulnerableSave: getCharacteristicValue(chars, 'INV'),
            composition: [],
            rangedWeapons,
            meleeWeapons,
            wargearOptions: [],
            wargearAbilities,
            abilities,
            structuredAbilities: [],
            constraints: [],
            leader: leader ?? undefined,
            keywords: extractKeywords(entry, 'unit'),
            factionKeywords: extractKeywords(entry, 'faction'),
            imageUrl: '',
        } as Unit;

        units.push(unit);
    }

    return units;
}

/**
 * Extracts all weapon definitions from a BattleScribe catalogue.
 *
 * Collects weapons from two sources:
 * 1. Weapon profiles nested within selection entries (units and options)
 * 2. Shared weapon profiles in the catalogue's sharedProfiles section
 *
 * Processes both ranged and melee weapons, extracting characteristics like Range, A, BS/WS, S, AP, D, and Keywords.
 * Weapon keywords are parsed to identify special abilities (Lethal Hits, Sustained Hits, etc.).
 *
 * @param catalogue - Parsed BattleScribeCatalogue object
 * @param sourceFile - The source file path/name for tracking data origin
 * @param sourceSha - The git SHA of the source file for version tracking
 * @returns Array of Weapon objects (RangedWeapon or MeleeWeapon) with all extracted characteristics and keywords
 */
export function extractWeapons(catalogue: BattleScribeCatalogue, sourceFile: string, sourceSha: string): Weapon[] {
    const weapons: Weapon[] = [];
    const entries = [
        ...ensureArray(catalogue.catalogue.selectionEntries?.selectionEntry),
        ...ensureArray(catalogue.catalogue.sharedSelectionEntries?.selectionEntry),
    ];

    for (const entry of entries) {
        weapons.push(...extractWeaponsFromEntry(entry, sourceFile, sourceSha));
    }

    const sharedProfiles = ensureArray(catalogue.catalogue.sharedProfiles?.profile);

    for (const profile of sharedProfiles) {
        const weapon = profileToWeapon(profile, sourceFile, sourceSha);

        if (weapon) {
            weapons.push(weapon);
        }
    }

    return weapons;
}

/**
 * Extracts all shared ability definitions from a BattleScribe catalogue.
 *
 * Collects abilities from the catalogue's sharedProfiles section, filtering for profiles with typeName='Abilities'.
 * Each ability has a name and description extracted from the profile's characteristics.
 *
 * These are shared abilities that can be referenced by multiple units and are defined once in the catalogue.
 *
 * @param catalogue - Parsed BattleScribeCatalogue object
 * @param sourceFile - The source file path/name for tracking data origin
 * @param sourceSha - The git SHA of the source file for version tracking
 * @returns Array of Ability objects with id, name, description, and source tracking
 */
export function extractAbilities(catalogue: BattleScribeCatalogue, sourceFile: string, sourceSha: string): Ability[] {
    const abilities: Ability[] = [];

    const sharedProfiles = ensureArray(catalogue.catalogue.sharedProfiles?.profile);

    for (const profile of sharedProfiles) {
        if (profile['@_typeName'] !== 'Abilities') {
            continue;
        }

        const chars = extractProfileCharacteristics(profile);

        abilities.push({
            id: profile['@_id'],
            name: profile['@_name'],
            sourceFile,
            sourceSha,
            description: getCharacteristicValue(chars, 'Description') ?? '',
        });
    }

    return abilities;
}

/**
 * Recursively extracts weapons from a selection entry and its nested entries/groups.
 * Processes weapon profiles from the entry and all nested selection entries and groups.
 * @param entry - BattleScribeSelectionEntry to extract weapons from
 * @param sourceFile - Source file path for tracking data origin
 * @param sourceSha - Git SHA of the source file for version tracking
 * @param unitId - Optional unit ID for weapon association
 * @returns Array of Weapon objects (ranged and melee)
 */
function extractWeaponsFromEntry(
    entry: BattleScribeSelectionEntry,
    sourceFile: string,
    sourceSha: string,
    unitId?: string,
): Weapon[] {
    const weapons: Weapon[] = [];
    const currentUnitId = entry['@_type'] === 'unit' ? entry['@_id'] : unitId;

    const profiles: BattleScribeProfile[] = ensureArray(entry.profiles?.profile);

    for (const profile of profiles) {
        const weapon = profileToWeapon(profile, sourceFile, sourceSha, currentUnitId);

        if (weapon) {
            weapons.push(weapon);
        }
    }

    const nestedEntries = ensureArray(entry.selectionEntries?.selectionEntry);

    for (const nested of nestedEntries) {
        weapons.push(...extractWeaponsFromEntry(nested, sourceFile, sourceSha, currentUnitId));
    }

    const groups = ensureArray(entry.selectionEntryGroups?.selectionEntryGroup);

    for (const group of groups) {
        const groupEntries = ensureArray(group.selectionEntries?.selectionEntry);

        for (const groupEntry of groupEntries) {
            weapons.push(...extractWeaponsFromEntry(groupEntry, sourceFile, sourceSha, currentUnitId));
        }
    }

    return weapons;
}

/**
 * Converts a BattleScribe weapon profile into a typed Weapon (ranged or melee), or null if not a weapon.
 * Extracts characteristics and parses weapon keywords to identify special abilities.
 * @param profile - BattleScribeProfile to convert
 * @param sourceFile - Source file path for tracking data origin
 * @param sourceSha - Git SHA of the source file for version tracking
 * @param unitId - Optional unit ID for weapon association
 * @returns RangedWeapon, MeleeWeapon, or null if profile is not a weapon
 */
function profileToWeapon(
    profile: BattleScribeProfile,
    sourceFile: string,
    sourceSha: string,
    unitId?: string,
): Weapon | null {
    const typeName = profile['@_typeName'];

    if (typeName !== 'Ranged Weapons' && typeName !== 'Melee Weapons') {
        return null;
    }

    const chars = extractProfileCharacteristics(profile);
    const keywordStrings = parseWeaponKeywordStrings(getCharacteristicValue(chars, 'Keywords') ?? '');
    const keywords = keywordStrings;
    const parsedKeywords = parseWeaponKeywords(keywordStrings);

    const base = {
        id: profile['@_id'],
        name: profile['@_name'],
        sourceFile,
        sourceSha,
        attacks: getCharacteristicValue(chars, 'A') ?? '',
        skill: getCharacteristicValue(chars, typeName === 'Ranged Weapons' ? 'BS' : 'WS') ?? '',
        strength: parseInt(getCharacteristicValue(chars, 'S') ?? '0', 10),
        ap: parseInt(getCharacteristicValue(chars, 'AP') ?? '0', 10),
        damage: getCharacteristicValue(chars, 'D') ?? '',
        keywords,
        parsedKeywords,
        unitId,
    };

    if (typeName === 'Ranged Weapons') {
        return {
            ...base,
            type: 'ranged',
            range: getCharacteristicValue(chars, 'Range') ?? '',
        } as RangedWeapon;
    }

    return {
        ...base,
        type: 'melee',
    } as MeleeWeapon;
}

/**
 * Splits a comma-separated keyword string into trimmed individual keywords.
 * Handles empty strings and '-' (no keywords) by returning an empty array.
 * @param keywordStr - Comma-separated keyword string
 * @returns Array of individual keyword strings
 */
function parseWeaponKeywordStrings(keywordStr: string): string[] {
    if (!keywordStr || keywordStr === '-') {
        return [];
    }

    return keywordStr
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
}

/**
 * Extracts ability profiles specific to a unit entry.
 *
 * Searches through all profiles in the unit entry for those with typeName='Abilities'.
 * Each ability has a name and description extracted from the profile's characteristics.
 * Looks for 'Description' characteristic first, falls back to 'Effect' if not found.
 *
 * These are unit-specific abilities (not shared), defined directly on the unit entry.
 *
 * @param entry - BattleScribeSelectionEntry representing a unit
 * @returns Array of UnitAbility objects with id, name, and description
 */
function extractUnitAbilities(entry: BattleScribeSelectionEntry): UnitAbility[] {
    const abilities: UnitAbility[] = [];

    const profiles: BattleScribeProfile[] = ensureArray(entry.profiles?.profile);

    for (const profile of profiles) {
        if (profile['@_typeName'] === 'Abilities') {
            const chars = extractProfileCharacteristics(profile);

            abilities.push({
                id: profile['@_id'],
                name: profile['@_name'],
                description:
                    getCharacteristicValue(chars, 'Description') ?? getCharacteristicValue(chars, 'Effect') ?? '',
            });
        }
    }

    return abilities;
}

/**
 * Extracts wargear ability profiles from a unit entry.
 *
 * Searches through all profiles in the unit entry for those with typeName containing 'wargear' (case-insensitive).
 * Each ability has a name and description extracted from the profile's characteristics.
 * Looks for 'Description' characteristic first, falls back to 'Effect' if not found.
 *
 * Wargear abilities are special rules granted by equipment or wargear options (e.g., "Invulnerable Save 4+").
 *
 * @param entry - BattleScribeSelectionEntry representing a unit
 * @returns Array of WargearAbility objects with id, name, and description
 */
function extractWargearAbilities(entry: BattleScribeSelectionEntry): WargearAbility[] {
    const abilities: WargearAbility[] = [];
    const profiles: BattleScribeProfile[] = ensureArray(entry.profiles?.profile);

    for (const profile of profiles) {
        const typeName = profile['@_typeName'] ?? '';

        if (!typeName.toLowerCase().includes('wargear')) {
            continue;
        }

        const chars = extractProfileCharacteristics(profile);

        abilities.push({
            id: profile['@_id'],
            name: profile['@_name'],
            description: getCharacteristicValue(chars, 'Description') ?? getCharacteristicValue(chars, 'Effect') ?? '',
        });
    }

    return abilities;
}

/**
 * Extracts leader information from a unit's abilities and category links.
 *
 * Determines if a unit is a leader by:
 * 1. Checking if it has a unit ability named 'Leader' (case-insensitive)
 * 2. Checking category links for names starting with 'Leader:' (case-insensitive)
 *
 * Category links with 'Leader:' prefix indicate which unit types this leader can attach to.
 * For example, 'Leader: Infantry' means this leader can attach to Infantry units.
 *
 * Returns null if the unit is not a leader (no leader ability and no leader category links).
 *
 * @param entry - BattleScribeSelectionEntry representing a unit
 * @param abilities - Array of UnitAbility objects already extracted from the entry
 * @returns LeaderInfo object with canAttachTo array and leaderAbility description, or null if not a leader
 */
function extractLeaderInfo(entry: BattleScribeSelectionEntry, abilities: UnitAbility[]): LeaderInfo | null {
    const leaderProfile = abilities.find((ability) => ability.name.toLowerCase() === 'leader');
    const categoryLinks = ensureArray(entry.categoryLinks?.categoryLink);
    const canAttachTo = categoryLinks
        .map((link: BattleScribeCategoryLink) => link['@_name'] ?? '')
        .filter((name: string) => name.toLowerCase().startsWith('leader:'))
        .map((name: string) => name.replace(/leader:\s*/i, ''))
        .filter(Boolean);

    if (!leaderProfile && canAttachTo.length === 0) {
        return null;
    }

    return {
        canAttachTo,
        leaderAbility: leaderProfile?.description ?? '',
    };
}

/**
 * Extracts unit or faction keywords from a selection entry's category links.
 * Filters category links by type: faction keywords contain 'faction:' prefix, unit keywords do not.
 * @param entry - BattleScribeSelectionEntry to extract keywords from
 * @param type - 'unit' for unit keywords, 'faction' for faction keywords
 * @returns Array of keyword strings
 */
function extractKeywords(entry: BattleScribeSelectionEntry, type: 'unit' | 'faction'): string[] {
    const keywords: string[] = [];
    const categoryLinks = ensureArray(entry.categoryLinks?.categoryLink);

    for (const link of categoryLinks) {
        if (type === 'faction' && link['@_name']?.toLowerCase().includes('faction:')) {
            keywords.push(link['@_name'].replace(/faction:\s*/i, ''));
        } else if (type === 'unit' && !link['@_name']?.toLowerCase().includes('faction:')) {
            if (link['@_name'] && link['@_name'] !== 'Configuration') {
                keywords.push(link['@_name']);
            }
        }
    }

    return keywords;
}
