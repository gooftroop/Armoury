/**
 * Core rules parser for BattleScribe .gst (game system) files.
 *
 * Extracts profile types, cost types, shared rules, categories, and constraints
 * from BattleScribe game system XML structures into a CoreRules plain object.
 *
 * @requirements
 * 1. Must parse a BattleScribeGameSystem into a CoreRules plain object.
 * 2. Must extract profile types with their characteristic types.
 * 3. Must extract cost types with optional default cost limits.
 * 4. Must extract categories from category entries.
 * 5. Must extract shared rules, injecting a synthetic "Save" rule when missing.
 * 6. Must extract roster-level constraints from shared selection entries.
 * 7. Must set lastSynced to current time and armyImageUrl to empty string.
 */

import {
    type BattleScribeGameSystem,
    type BattleScribeProfileType,
    type BattleScribeCostType,
    type BattleScribeRule,
    type BattleScribeCharacteristicType,
    type BattleScribeCategory,
    ensureArray,
} from '@armoury/providers-bsdata/types';
import { parseConstraints } from '@armoury/validation/constraints/parser';
import type { ParsedConstraint } from '@armoury/validation/constraints/types';
import type { CoreRules, ProfileTypeInfo, CostTypeInfo, SharedRule } from '../models/CoreRules.ts';

/**
 * Parse a BattleScribe game system XML structure into a CoreRules plain object.
 * Extracts profile types, cost types, shared rules, categories, and constraints.
 *
 * @param gameSystem - Parsed BattleScribe game system XML object
 * @param sourceFile - Path to the source .gst file
 * @returns CoreRules plain object with extracted game system data
 */
function parseCoreRules(gameSystem: BattleScribeGameSystem, sourceFile: string): CoreRules {
    const gs = gameSystem.gameSystem;

    const profileTypes = extractProfileTypes(gs);
    const costTypes = extractCostTypes(gs);
    const categories = extractCategories(gs);
    const sharedRules = extractSharedRules(gs);
    const constraints = extractConstraints(gs);

    return {
        id: gs['@_id'],
        name: gs['@_name'],
        revision: gs['@_revision'],
        battleScribeVersion: gs['@_battleScribeVersion'],
        profileTypes,
        costTypes,
        sharedRules,
        categories,
        constraints,
        sourceFile,
        lastSynced: new Date(),
    };
}

/**
 * Extract profile types from a game system, including their characteristic type definitions.
 *
 * @param gs - The inner game system object from the parsed XML
 * @returns Array of ProfileTypeInfo with characteristic types
 */
function extractProfileTypes(gs: BattleScribeGameSystem['gameSystem']): ProfileTypeInfo[] {
    const profileTypes = ensureArray(gs.profileTypes?.profileType);

    return profileTypes.map((pt: BattleScribeProfileType) => ({
        id: pt['@_id'],
        name: pt['@_name'],
        characteristicTypes: extractCharacteristicTypes(pt),
    }));
}

/**
 * Extract characteristic types from a profile type (e.g. M, T, SV, W, LD, OC for Unit profiles).
 *
 * @param profileType - A single BattleScribe profile type definition
 * @returns Array of characteristic type id/name pairs
 */
function extractCharacteristicTypes(profileType: BattleScribeProfileType): { id: string; name: string }[] {
    const charTypes = ensureArray(profileType.characteristicTypes?.characteristicType);

    return charTypes.map((ct: BattleScribeCharacteristicType) => ({
        id: ct['@_id'],
        name: ct['@_name'],
    }));
}

/**
 * Extract cost types from a game system (e.g. "pts" for points, "PL" for Power Level).
 *
 * @param gs - The inner game system object from the parsed XML
 * @returns Array of CostTypeInfo
 */
function extractCostTypes(gs: BattleScribeGameSystem['gameSystem']): CostTypeInfo[] {
    const costTypes = ensureArray(gs.costTypes?.costType);

    return costTypes.map((ct: BattleScribeCostType) => ({
        id: ct['@_id'],
        name: ct['@_name'],
        defaultCostLimit: ct['@_defaultCostLimit'],
    }));
}

/**
 * Extract categories from a game system (e.g. "HQ", "Troops", "Elites").
 *
 * @param gs - The inner game system object from the parsed XML
 * @returns Array of category id/name pairs
 */
function extractCategories(gs: BattleScribeGameSystem['gameSystem']): { id: string; name: string }[] {
    const categories = ensureArray(gs.categoryEntries?.categoryEntry);

    return categories.map((cat: BattleScribeCategory) => ({
        id: cat['@_id'],
        name: cat['@_name'],
    }));
}

/**
 * Extract shared rules from a game system.
 * Injects a synthetic "Save" rule if no existing save-related rule is found but the
 * Unit profile type has a save characteristic (SV or Save).
 *
 * @param gs - The inner game system object from the parsed XML
 * @returns Array of SharedRule
 */
function extractSharedRules(gs: BattleScribeGameSystem['gameSystem']): SharedRule[] {
    const rules = ensureArray(gs.sharedRules?.rule);

    const sharedRules = rules.map((rule: BattleScribeRule) => ({
        id: rule['@_id'],
        name: rule['@_name'],
        description: rule.description,
    }));

    const hasSaveRule = sharedRules.some((rule) => rule.name.toLowerCase().includes('save'));

    if (!hasSaveRule) {
        const profileTypes = ensureArray(gs.profileTypes?.profileType);
        const unitProfile = profileTypes.find((profile) => profile['@_name'] === 'Unit');
        const characteristicTypes = ensureArray(unitProfile?.characteristicTypes?.characteristicType);
        const hasSaveCharacteristic = characteristicTypes.some(
            (characteristic) => characteristic['@_name'] === 'SV' || characteristic['@_name'] === 'Save',
        );

        if (hasSaveCharacteristic) {
            sharedRules.push({
                id: 'core:save',
                name: 'Save',
                description: 'Save characteristic (SV).',
            });
        }
    }

    return sharedRules;
}

/**
 * Extract roster-level constraints from game system shared selection entries.
 *
 * @param gs - The inner game system object from the parsed XML
 * @returns Array of ParsedConstraint
 */
function extractConstraints(gs: BattleScribeGameSystem['gameSystem']): ParsedConstraint[] {
    const constraints: ParsedConstraint[] = [];
    const entries = ensureArray(gs.sharedSelectionEntries?.selectionEntry);

    for (const entry of entries) {
        const entryConstraints = parseConstraints(entry.constraints, entry['@_id'], entry['@_name']);

        constraints.push(...entryConstraints);
    }

    return constraints;
}

export { parseCoreRules };
