/**
 * Faction data parser for BattleScribe .cat (catalogue) files.
 *
 * Extracts units, weapons, abilities, stratagems, detachments, enhancements, and faction rules
 * from BattleScribe catalogue XML structures into a FactionData plain object.
 *
 * @requirements
 * 1. Must parse a BattleScribeCatalogue into a FactionData plain object.
 * 2. Must extract all unit datasheets with profiles, abilities, keywords, and composition.
 * 3. Must extract weapons (ranged and melee) with parsed keywords.
 * 4. Must extract shared abilities from shared profiles.
 * 5. Must extract faction rules from shared rules and shared profiles.
 * 6. Must extract stratagems, detachments, and enhancements from selection entry trees.
 * 7. Must populate structured rules and parsed weapon keywords for validation.
 * 8. Must set lastSynced to current time and armyImageUrl to empty string.
 */

import {
    type BattleScribeCatalogue,
    type BattleScribeCharacteristic,
    type BattleScribeProfile,
    type BattleScribeSelectionEntry,
    type BattleScribeConstraint,
    type BattleScribeCost,
    type BattleScribeCategoryLink,
    ensureArray,
} from '@armoury/providers-bsdata/types';
import type { Ability, Detachment, Enhancement, Stratagem, Weapon } from '@/types/entities.js';
import type {
    Unit,
    UnitAbility,
    UnitComposition,
    WargearOption,
    WargearChoice,
    WargearAbility,
    LeaderInfo,
} from '@/models/UnitModel.js';
import { parseWeaponKeywords } from '@/validation/weaponKeywords.js';
import { parseConstraints } from '@armoury/validation/constraints/parser';
import {
    parseAbilities,
    parseFactionRule,
    parseDetachmentRule,
    parseEnhancementEffect,
} from '@/validation/abilityParser.js';
import type { FactionData, FactionRule } from '@/models/FactionData.js';

/**
 * Internal type for entries that may have cost data attached.
 */
type EntryWithCosts = {
    costs?: { cost: BattleScribeCost | BattleScribeCost[] };
};

/**
 * Return the value of a named characteristic from a profile.
 *
 * @param characteristics - Array of BattleScribe characteristics to search
 * @param name - The characteristic name to look up (e.g. "M", "T", "SV")
 * @returns The characteristic text value, or undefined if not found
 */
function getCharacteristicValue(
    characteristics: BattleScribeCharacteristic[] | undefined,
    name: string,
): string | undefined {
    if (!characteristics) {
        return undefined;
    }

    const char = characteristics.find((c) => c['@_name'] === name);

    return char?.['#text']?.toString();
}

/**
 * Normalize profile characteristics into a flat array.
 *
 * @param profile - BattleScribe profile to extract characteristics from
 * @returns Array of BattleScribe characteristics
 */
function extractProfileCharacteristics(profile: BattleScribeProfile): BattleScribeCharacteristic[] {
    return ensureArray(profile.characteristics?.characteristic);
}

/**
 * Parse weapon keyword strings (comma-separated) into a list of individual keywords.
 *
 * @param keywordStr - Comma-separated keyword string from a weapon profile
 * @returns Array of trimmed, non-empty keyword strings
 */
function parseWeaponKeywordStrings(keywordStr: string): string[] {
    if (!keywordStr || keywordStr === '-') {
        return [];
    }

    return keywordStr
        .split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean);
}

/**
 * Extract ability names and descriptions from a selection entry's profiles.
 *
 * @param entry - BattleScribe selection entry to extract abilities from
 * @returns Array of unit abilities with id, name, and description
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
 * Extract wargear-specific abilities from selection entry profiles.
 *
 * @param entry - BattleScribe selection entry to extract wargear abilities from
 * @returns Array of wargear abilities with id, name, and description
 */
function extractWargearAbilities(entry: BattleScribeSelectionEntry): WargearAbility[] {
    const abilities: WargearAbility[] = [];
    const profiles: BattleScribeProfile[] = ensureArray(entry.profiles?.profile);

    for (const profile of profiles) {
        const typeName = profile['@_typeName']?.toLowerCase() ?? '';

        if (!typeName.includes('wargear')) {
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
 * Extract Leader ability and attachment eligibility from a Character unit entry.
 *
 * @param entry - BattleScribe selection entry for the unit
 * @param abilities - Already-extracted unit abilities to search for "Leader" ability
 * @returns LeaderInfo if the unit has leader data, undefined otherwise
 */
function extractLeaderInfo(entry: BattleScribeSelectionEntry, abilities: UnitAbility[]): LeaderInfo | undefined {
    const leaderAbility = abilities.find((ability) => ability.name.toLowerCase() === 'leader')?.description;
    const categoryLinks = ensureArray(entry.categoryLinks?.categoryLink);
    const canAttachTo = categoryLinks
        .map((link: BattleScribeCategoryLink) => link['@_name'] ?? '')
        .filter((name: string) => name.toLowerCase().startsWith('leader:'))
        .map((name: string) => name.replace(/leader:\s*/i, ''))
        .filter(Boolean);

    if (!leaderAbility && canAttachTo.length === 0) {
        return undefined;
    }

    return {
        canAttachTo,
        leaderAbility: leaderAbility ?? '',
    };
}

/**
 * Extract unit or faction keywords from an entry's category links.
 *
 * @param entry - BattleScribe selection entry to extract keywords from
 * @param type - Whether to extract 'unit' keywords or 'faction' keywords
 * @returns Array of keyword strings
 */
function extractKeywords(entry: BattleScribeSelectionEntry, type: 'unit' | 'faction'): string[] {
    const keywords: string[] = [];
    const categoryLinks = ensureArray(entry.categoryLinks?.categoryLink);

    for (const link of categoryLinks) {
        const linkName = link['@_name'] ?? '';
        const lowerName = linkName.toLowerCase();

        if (type === 'faction' && lowerName.includes('faction:')) {
            keywords.push(linkName.replace(/faction:\s*/i, ''));
        } else if (type === 'unit' && !lowerName.includes('faction:')) {
            if (linkName && linkName !== 'Configuration') {
                keywords.push(linkName);
            }
        }
    }

    return keywords;
}

/**
 * Convert a BattleScribe profile into a Weapon if it matches weapon types (Ranged or Melee).
 *
 * @param profile - BattleScribe profile to attempt weapon conversion
 * @param primarySourceFile - Path to the primary source .cat file
 * @param sourceSha - SHA of the source file (empty string for freshly parsed data)
 * @param unitId - Optional ID of the owning unit
 * @returns A Weapon object if the profile is a weapon type, null otherwise
 */
function profileToWeapon(
    profile: BattleScribeProfile,
    primarySourceFile: string,
    sourceSha: string,
    unitId?: string,
): Weapon | null {
    const typeName = profile['@_typeName'];

    if (typeName !== 'Ranged Weapons' && typeName !== 'Melee Weapons') {
        return null;
    }

    const chars = extractProfileCharacteristics(profile);
    const keywords = parseWeaponKeywordStrings(getCharacteristicValue(chars, 'Keywords') ?? '');
    const parsedKeywords = parseWeaponKeywords(keywords);
    const base = {
        id: profile['@_id'],
        name: profile['@_name'],
        sourceFile: primarySourceFile,
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
        };
    }

    return {
        ...base,
        type: 'melee',
    };
}

/**
 * Recursively walk selection entries to collect weapon profiles.
 *
 * @param entry - BattleScribe selection entry to walk
 * @param primarySourceFile - Path to the primary source .cat file
 * @param sourceSha - SHA of the source file
 * @param unitId - Optional ID of the owning unit
 * @returns Array of extracted Weapon objects
 */
function extractWeaponsFromEntry(
    entry: BattleScribeSelectionEntry,
    primarySourceFile: string,
    sourceSha: string,
    unitId?: string,
): Weapon[] {
    const extracted: Weapon[] = [];
    const currentUnitId = entry['@_type'] === 'unit' ? entry['@_id'] : unitId;

    const profiles: BattleScribeProfile[] = ensureArray(entry.profiles?.profile);

    for (const profile of profiles) {
        const weapon = profileToWeapon(profile, primarySourceFile, sourceSha, currentUnitId);

        if (weapon) {
            extracted.push(weapon);
        }
    }

    const nestedEntries = ensureArray(entry.selectionEntries?.selectionEntry);

    for (const nested of nestedEntries) {
        extracted.push(...extractWeaponsFromEntry(nested, primarySourceFile, sourceSha, currentUnitId));
    }

    const groups = ensureArray(entry.selectionEntryGroups?.selectionEntryGroup);

    for (const group of groups) {
        const groupEntries = ensureArray(group.selectionEntries?.selectionEntry);

        for (const groupEntry of groupEntries) {
            extracted.push(...extractWeaponsFromEntry(groupEntry, primarySourceFile, sourceSha, currentUnitId));
        }
    }

    return extracted;
}

/**
 * Determine if a profile describes a stratagem.
 *
 * @param profile - BattleScribe profile to check
 * @returns True if the profile type contains "stratagem" (case insensitive)
 */
function isStratagemProfile(profile: BattleScribeProfile): boolean {
    return /stratagem/i.test(profile['@_typeName']);
}

/**
 * Build a Stratagem entity from a BattleScribe profile.
 *
 * @param profile - BattleScribe profile containing stratagem data
 * @param primarySourceFile - Path to the primary source .cat file
 * @param sourceSha - SHA of the source file
 * @param detachmentId - Optional ID of the owning detachment
 * @returns A Stratagem entity
 */
function buildStratagem(
    profile: BattleScribeProfile,
    primarySourceFile: string,
    sourceSha: string,
    detachmentId?: string,
): Stratagem {
    const chars = extractProfileCharacteristics(profile);
    const cpValue =
        getCharacteristicValue(chars, 'CP') ??
        getCharacteristicValue(chars, 'CP Cost') ??
        getCharacteristicValue(chars, 'Cost') ??
        '0';
    const cp = parseInt(cpValue, 10);

    return {
        id: profile['@_id'],
        name: profile['@_name'],
        sourceFile: primarySourceFile,
        sourceSha,
        cp: Number.isNaN(cp) ? 0 : cp,
        phase: getCharacteristicValue(chars, 'Phase') ?? '',
        description: getCharacteristicValue(chars, 'Description') ?? getCharacteristicValue(chars, 'Effect') ?? '',
        detachmentId,
    };
}

/**
 * Check if a selection entry looks like a detachment entry.
 *
 * @param entry - BattleScribe selection entry to check
 * @returns True if the entry name or type suggests a detachment
 */
function isDetachmentEntry(entry: BattleScribeSelectionEntry): boolean {
    const name = entry['@_name']?.toLowerCase() ?? '';
    const type = entry['@_type']?.toLowerCase() ?? '';

    return name.includes('detachment') || type === 'detachment';
}

/**
 * Check if a selection entry looks like an enhancement entry.
 *
 * @param entry - BattleScribe selection entry to check
 * @returns True if the entry name or type suggests an enhancement
 */
function isEnhancementEntry(entry: BattleScribeSelectionEntry): boolean {
    const name = entry['@_name']?.toLowerCase() ?? '';
    const type = entry['@_type']?.toLowerCase() ?? '';

    return name.includes('enhancement') || type === 'enhancement';
}

/**
 * Extract a description from an entry's profiles (first non-empty Description or Effect found).
 *
 * @param entry - BattleScribe selection entry to extract description from
 * @returns The first description found, or empty string
 */
function extractEntryDescription(entry: BattleScribeSelectionEntry): string {
    const profiles = ensureArray(entry.profiles?.profile);

    for (const profile of profiles) {
        const chars = extractProfileCharacteristics(profile);
        const description = getCharacteristicValue(chars, 'Description') ?? getCharacteristicValue(chars, 'Effect');

        if (description) {
            return description;
        }
    }

    return '';
}

/**
 * Extract point costs from an entry's cost data.
 *
 * @param entry - Entry with optional cost data
 * @returns The point cost value, or 0 if not found
 */
function extractPoints(entry: EntryWithCosts): number {
    const costs: BattleScribeCost[] = ensureArray(entry.costs?.cost);
    const pointsCost = costs.find((cost) => cost['@_name']?.toLowerCase() === 'pts');
    const points = pointsCost ? parseInt(pointsCost['@_value'] ?? '0', 10) : 0;

    return Number.isNaN(points) ? 0 : points;
}

/**
 * Extract unit composition constraints (model counts and point costs).
 *
 * @param entry - BattleScribe selection entry for the unit
 * @returns Array of UnitComposition with model count and point cost combinations
 */
function extractUnitComposition(entry: BattleScribeSelectionEntry): UnitComposition[] {
    const constraints: BattleScribeConstraint[] = ensureArray(entry.constraints?.constraint);
    const minConstraint = constraints.find((constraint) => constraint['@_type'] === 'min');
    const maxConstraint = constraints.find((constraint) => constraint['@_type'] === 'max');
    const incrementConstraint = constraints.find(
        (constraint: BattleScribeConstraint) => constraint['@_type'] === 'increment',
    );
    const min = parseInt(minConstraint?.['@_value'] ?? '1', 10);
    const max = parseInt(maxConstraint?.['@_value'] ?? String(min), 10);
    const increment = parseInt(incrementConstraint?.['@_value'] ?? '1', 10);
    const minModels = Number.isNaN(min) || min <= 0 ? 1 : min;
    const maxModels = Number.isNaN(max) || max <= 0 ? minModels : max;
    const step = Number.isNaN(increment) || increment <= 0 ? 1 : increment;
    const points = extractPoints(entry);
    const compositions: UnitComposition[] = [];

    for (let models = minModels; models <= maxModels; models += step) {
        compositions.push({ models, points });

        if (step <= 0) {
            break;
        }

        if (models === maxModels) {
            break;
        }
    }

    if (compositions.length === 0) {
        compositions.push({ models: minModels, points });
    }

    return compositions;
}

/**
 * Extract wargear options from selection entry groups.
 *
 * @param entry - BattleScribe selection entry to extract wargear options from
 * @returns Array of WargearOption with choices and selection constraints
 */
function extractWargearOptions(entry: BattleScribeSelectionEntry): WargearOption[] {
    const options: WargearOption[] = [];
    const groups = ensureArray(entry.selectionEntryGroups?.selectionEntryGroup);

    for (const group of groups) {
        const constraints: BattleScribeConstraint[] = ensureArray(group.constraints?.constraint);
        const minConstraint = constraints.find((constraint) => constraint['@_type'] === 'min');
        const maxConstraint = constraints.find((constraint) => constraint['@_type'] === 'max');
        const minSelections = parseInt(minConstraint?.['@_value'] ?? '0', 10);
        const maxSelections = parseInt(maxConstraint?.['@_value'] ?? '1', 10);

        const defaultId = group['@_defaultSelectionEntryId'];
        const groupEntries = ensureArray(group.selectionEntries?.selectionEntry);
        const entryLinks = ensureArray(group.entryLinks?.entryLink);
        const choices: WargearChoice[] = [];

        for (const choiceEntry of groupEntries) {
            choices.push({
                id: choiceEntry['@_id'],
                name: choiceEntry['@_name'],
                points: extractPoints(choiceEntry),
                isDefault: defaultId === choiceEntry['@_id'],
            });
        }

        for (const link of entryLinks) {
            choices.push({
                id: link['@_targetId'],
                name: link['@_name'],
                points: extractPoints(link),
                isDefault: defaultId === link['@_targetId'],
            });
        }

        if (choices.length === 0) {
            continue;
        }

        options.push({
            id: group['@_id'],
            name: group['@_name'],
            choices,
            minSelections: Number.isNaN(minSelections) ? 0 : minSelections,
            maxSelections: Number.isNaN(maxSelections) ? 1 : maxSelections,
        });
    }

    return options;
}

/**
 * Build an Enhancement entity from a BattleScribe selection entry.
 *
 * @param entry - BattleScribe selection entry containing enhancement data
 * @returns An Enhancement entity with structured effect
 */
function buildEnhancement(entry: BattleScribeSelectionEntry): Enhancement {
    const id = entry['@_id'];
    const name = entry['@_name'];
    const points = extractPoints(entry);
    const description = extractEntryDescription(entry);
    const structuredEffect = parseEnhancementEffect({
        id,
        name,
        description,
    });

    return {
        id,
        name,
        points,
        description,
        eligibleKeywords: [],
        structuredEffect,
    };
}

/**
 * Build a Detachment entity from a BattleScribe selection entry, including nested enhancements.
 *
 * @param entry - BattleScribe selection entry containing detachment data
 * @param primarySourceFile - Path to the primary source .cat file
 * @param sourceSha - SHA of the source file
 * @param catId - The catalogue ID (faction ID)
 * @param enhancementsById - Map to register discovered enhancements
 * @returns A Detachment entity with rules, structured rules, and enhancements
 */
function buildDetachment(
    entry: BattleScribeSelectionEntry,
    primarySourceFile: string,
    sourceSha: string,
    catId: string,
    enhancementsById: Map<string, Enhancement>,
): Detachment {
    const rules: string[] = [];
    const profiles = ensureArray(entry.profiles?.profile);

    for (const profile of profiles) {
        const typeName = profile['@_typeName']?.toLowerCase() ?? '';

        if (typeName.includes('detachment') || typeName.includes('abilities') || typeName.includes('rule')) {
            const chars = extractProfileCharacteristics(profile);
            const description =
                getCharacteristicValue(chars, 'Description') ??
                getCharacteristicValue(chars, 'Effect') ??
                profile['@_name'];

            if (description) {
                rules.push(description);
            }
        }
    }

    const detachmentEnhancements: Enhancement[] = [];
    const nestedEntries = ensureArray(entry.selectionEntries?.selectionEntry);

    for (const nested of nestedEntries) {
        if (!isEnhancementEntry(nested)) {
            continue;
        }

        const enhancement = buildEnhancement(nested);
        detachmentEnhancements.push(enhancement);
        enhancementsById.set(enhancement.id, enhancement);
    }

    const structuredRules = rules.map((ruleText, index) =>
        parseDetachmentRule(ruleText, entry['@_id'], entry['@_name'], index),
    );

    return {
        id: entry['@_id'],
        name: entry['@_name'],
        sourceFile: primarySourceFile,
        sourceSha,
        factionId: catId,
        rules,
        structuredRules,
        enhancements: detachmentEnhancements,
    };
}

/**
 * Recursively walk a selection entry tree to collect detachments, stratagems, and enhancements.
 *
 * @param entry - BattleScribe selection entry to traverse
 * @param primarySourceFile - Path to the primary source .cat file
 * @param sourceSha - SHA of the source file
 * @param catId - The catalogue ID (faction ID)
 * @param stratagemsById - Map to register discovered stratagems
 * @param detachmentsById - Map to register discovered detachments
 * @param enhancementsById - Map to register discovered enhancements
 * @param detachmentId - Optional ID of the parent detachment for stratagem association
 */
function traverseEntry(
    entry: BattleScribeSelectionEntry,
    primarySourceFile: string,
    sourceSha: string,
    catId: string,
    stratagemsById: Map<string, Stratagem>,
    detachmentsById: Map<string, Detachment>,
    enhancementsById: Map<string, Enhancement>,
    detachmentId?: string,
): void {
    const currentDetachmentId = isDetachmentEntry(entry) ? entry['@_id'] : detachmentId;

    if (isDetachmentEntry(entry)) {
        const detachment = buildDetachment(entry, primarySourceFile, sourceSha, catId, enhancementsById);
        detachmentsById.set(detachment.id, detachment);
    }

    if (isEnhancementEntry(entry)) {
        const enhancement = buildEnhancement(entry);
        enhancementsById.set(enhancement.id, enhancement);
    }

    const profiles = ensureArray(entry.profiles?.profile);

    for (const profile of profiles) {
        if (!isStratagemProfile(profile)) {
            continue;
        }

        const stratagem = buildStratagem(profile, primarySourceFile, sourceSha, currentDetachmentId);
        stratagemsById.set(stratagem.id, stratagem);
    }

    const nestedEntries = ensureArray(entry.selectionEntries?.selectionEntry);

    for (const nested of nestedEntries) {
        traverseEntry(
            nested,
            primarySourceFile,
            sourceSha,
            catId,
            stratagemsById,
            detachmentsById,
            enhancementsById,
            currentDetachmentId,
        );
    }

    const groups = ensureArray(entry.selectionEntryGroups?.selectionEntryGroup);

    for (const group of groups) {
        const groupEntries = ensureArray(group.selectionEntries?.selectionEntry);

        for (const groupEntry of groupEntries) {
            traverseEntry(
                groupEntry,
                primarySourceFile,
                sourceSha,
                catId,
                stratagemsById,
                detachmentsById,
                enhancementsById,
                currentDetachmentId,
            );
        }
    }
}

/**
 * Parse a BattleScribe catalogue XML structure into a FactionData plain object.
 * Extracts units, weapons, abilities, stratagems, detachments, enhancements, and faction rules.
 * Populates structured rules and parsed weapon keywords for validation and rule processing.
 *
 * @param catalogue - Parsed BattleScribe catalogue XML object
 * @param sourceFiles - Paths to source .cat files (library first, then faction-specific files)
 * @returns FactionData plain object with extracted faction data
 */
function parseFactionData(catalogue: BattleScribeCatalogue, sourceFiles: string[]): FactionData {
    const cat = catalogue.catalogue;
    const primarySourceFile = sourceFiles[0] ?? '';
    const sourceSha = '';
    const entries = ensureArray(cat.selectionEntries?.selectionEntry);
    const sharedSelectionEntries = ensureArray(cat.sharedSelectionEntries?.selectionEntry);
    const allEntries = [...entries, ...sharedSelectionEntries];
    const sharedProfiles = ensureArray(cat.sharedProfiles?.profile);
    const sharedRules = ensureArray(cat.sharedRules?.rule);

    /* ── Weapons ─────────────────────────────────────────────── */

    const weapons: Weapon[] = [];

    for (const entry of allEntries) {
        weapons.push(...extractWeaponsFromEntry(entry, primarySourceFile, sourceSha));
    }

    for (const profile of sharedProfiles) {
        const weapon = profileToWeapon(profile, primarySourceFile, sourceSha);

        if (weapon) {
            weapons.push(weapon);
        }
    }

    /* ── Shared Abilities ────────────────────────────────────── */

    const abilities: Ability[] = [];

    for (const profile of sharedProfiles) {
        if (profile['@_typeName'] !== 'Abilities') {
            continue;
        }

        const chars = extractProfileCharacteristics(profile);
        abilities.push({
            id: profile['@_id'],
            name: profile['@_name'],
            sourceFile: primarySourceFile,
            sourceSha,
            description: getCharacteristicValue(chars, 'Description') ?? '',
        });
    }

    /* ── Faction Rules ───────────────────────────────────────── */

    const factionRulesById = new Map<string, FactionRule>();

    for (const rule of sharedRules) {
        factionRulesById.set(rule['@_id'], {
            id: rule['@_id'],
            name: rule['@_name'],
            description: rule.description ?? '',
        });
    }

    for (const profile of sharedProfiles) {
        if (profile['@_typeName'] !== 'Abilities') {
            continue;
        }

        const chars = extractProfileCharacteristics(profile);
        const description = getCharacteristicValue(chars, 'Description') ?? '';

        if (!description) {
            continue;
        }

        factionRulesById.set(profile['@_id'], {
            id: profile['@_id'],
            name: profile['@_name'],
            description,
        });
    }

    for (const profile of sharedProfiles) {
        const typeName = profile['@_typeName']?.toLowerCase() ?? '';

        if (!typeName.includes('faction rule')) {
            continue;
        }

        const chars = extractProfileCharacteristics(profile);
        factionRulesById.set(profile['@_id'], {
            id: profile['@_id'],
            name: profile['@_name'],
            description: getCharacteristicValue(chars, 'Description') ?? '',
        });
    }

    /* ── Stratagems, Detachments, Enhancements ───────────────── */

    const stratagemsById = new Map<string, Stratagem>();
    const detachmentsById = new Map<string, Detachment>();
    const enhancementsById = new Map<string, Enhancement>();

    for (const entry of allEntries) {
        traverseEntry(
            entry,
            primarySourceFile,
            sourceSha,
            cat['@_id'],
            stratagemsById,
            detachmentsById,
            enhancementsById,
        );
    }

    const sharedGroups = ensureArray(cat.sharedSelectionEntryGroups?.selectionEntryGroup);

    for (const group of sharedGroups) {
        const groupEntries = ensureArray(group.selectionEntries?.selectionEntry);

        for (const groupEntry of groupEntries) {
            traverseEntry(
                groupEntry,
                primarySourceFile,
                sourceSha,
                cat['@_id'],
                stratagemsById,
                detachmentsById,
                enhancementsById,
            );
        }
    }

    for (const profile of sharedProfiles) {
        if (!isStratagemProfile(profile)) {
            continue;
        }

        const stratagem = buildStratagem(profile, primarySourceFile, sourceSha);
        stratagemsById.set(stratagem.id, stratagem);
    }

    /* ── Units ────────────────────────────────────────────────── */

    const units: Unit[] = [];

    for (const entry of allEntries) {
        if (entry['@_type'] !== 'unit') {
            continue;
        }

        const profiles: BattleScribeProfile[] = ensureArray(entry.profiles?.profile);
        let unitProfile = profiles.find((profile: BattleScribeProfile) => profile['@_typeName'] === 'Unit');

        if (!unitProfile) {
            const entryGroups = ensureArray(entry.selectionEntryGroups?.selectionEntryGroup);

            for (const group of entryGroups) {
                const groupEntries = ensureArray(group.selectionEntries?.selectionEntry);

                for (const groupEntry of groupEntries) {
                    const groupProfiles = ensureArray(groupEntry.profiles?.profile);
                    const groupUnitProfile = groupProfiles.find(
                        (profile: BattleScribeProfile) => profile['@_typeName'] === 'Unit',
                    );

                    if (groupUnitProfile) {
                        unitProfile = groupUnitProfile;
                        break;
                    }
                }

                if (unitProfile) {
                    break;
                }
            }
        }

        if (!unitProfile) {
            continue;
        }

        const chars = extractProfileCharacteristics(unitProfile);
        const unitAbilities = extractUnitAbilities(entry);
        const wargearAbilitiesList = extractWargearAbilities(entry);
        const leader = extractLeaderInfo(entry, unitAbilities);
        const unitWeapons = extractWeaponsFromEntry(entry, primarySourceFile, sourceSha, entry['@_id']);
        const rangedWeapons = unitWeapons.filter((weapon) => weapon.type === 'ranged');
        const meleeWeapons = unitWeapons.filter((weapon) => weapon.type === 'melee');
        const composition = extractUnitComposition(entry);
        const wargearOptions = extractWargearOptions(entry);
        const structuredAbilities = parseAbilities(unitAbilities);
        const unitConstraints = parseConstraints(entry.constraints, entry['@_id'], entry['@_name']);

        const unit = {
            id: entry['@_id'],
            name: entry['@_name'],
            sourceFile: primarySourceFile,
            sourceSha,
            factionId: cat['@_id'],
            movement: getCharacteristicValue(chars, 'M') ?? '',
            toughness: parseInt(getCharacteristicValue(chars, 'T') ?? '0', 10),
            save: getCharacteristicValue(chars, 'SV') ?? '',
            wounds: parseInt(getCharacteristicValue(chars, 'W') ?? '0', 10),
            leadership: parseInt(getCharacteristicValue(chars, 'LD') ?? '0', 10),
            objectiveControl: parseInt(getCharacteristicValue(chars, 'OC') ?? '0', 10),
            invulnerableSave: getCharacteristicValue(chars, 'INV'),
            composition,
            rangedWeapons,
            meleeWeapons,
            wargearOptions,
            wargearAbilities: wargearAbilitiesList,
            abilities: unitAbilities,
            structuredAbilities,
            constraints: unitConstraints,
            leader,
            keywords: extractKeywords(entry, 'unit'),
            factionKeywords: extractKeywords(entry, 'faction'),
            imageUrl: '',
        } as Unit;

        units.push(unit);
    }

    /* ── Assemble FactionData ────────────────────────────────── */

    const structuredFactionRules = Array.from(factionRulesById.values()).map((rule) => parseFactionRule(rule));

    return {
        id: cat['@_id'],
        name: cat['@_name'],
        armyImageUrl: '',
        sourceFiles,
        lastSynced: new Date(),
        factionRules: Array.from(factionRulesById.values()),
        structuredFactionRules,
        stratagems: Array.from(stratagemsById.values()),
        detachments: Array.from(detachmentsById.values()),
        enhancements: Array.from(enhancementsById.values()),
        units,
        weapons,
        abilities,
    };
}

export { parseFactionData };
