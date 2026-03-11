import type { Army, ArmyUnit } from '../../models/ArmyModel.ts';
import type { FactionData } from '../../models/FactionData.ts';
import type { Unit } from '../../models/UnitModel.ts';
import type { Enhancement } from '../../types/entities.ts';
import type { ValidationResult } from '../types.ts';

/**
 * Check that a unit receiving an enhancement has the Character keyword.
 * @param armyUnit - The army unit to validate
 * @param unitDefinition - The unit datasheet definition
 * @returns ValidationResult if unit is not a Character, null otherwise
 */
function checkEnhancementRequiresCharacter(armyUnit: ArmyUnit, unitDefinition: Unit): ValidationResult | null {
    const lowerKeywords = unitDefinition.keywords.map((k) => k.toLowerCase());

    if (lowerKeywords.includes('character')) {
        return null;
    }

    return {
        id: `enhancement-not-character-${armyUnit.id}`,
        passed: false,
        severity: 'error',
        category: 'enhancement',
        message: `Enhancements can only be assigned to Character units. ${unitDefinition.name} is not a Character.`,
        unitId: armyUnit.id,
        unitName: unitDefinition.name,
    };
}

/**
 * Check that an Epic Hero is not receiving an enhancement.
 * @param armyUnit - The army unit to validate
 * @param unitDefinition - The unit datasheet definition
 * @returns ValidationResult if unit is an Epic Hero with enhancement, null otherwise
 */
function checkEnhancementForbiddenOnEpicHero(armyUnit: ArmyUnit, unitDefinition: Unit): ValidationResult | null {
    const lowerKeywords = unitDefinition.keywords.map((k) => k.toLowerCase());

    if (!lowerKeywords.includes('epic hero')) {
        return null;
    }

    return {
        id: `enhancement-epic-hero-${armyUnit.id}`,
        passed: false,
        severity: 'error',
        category: 'enhancement',
        message: `Epic Heroes cannot take enhancements. ${unitDefinition.name} has an enhancement selected.`,
        unitId: armyUnit.id,
        unitName: unitDefinition.name,
    };
}

/**
 * Check that a unit meets the enhancement's keyword eligibility requirements.
 * @param armyUnit - The army unit to validate
 * @param unitDefinition - The unit datasheet definition
 * @param enhancement - The enhancement to check eligibility for
 * @returns ValidationResult if unit doesn't meet keyword requirements, null otherwise
 */
function checkEnhancementEligibility(
    armyUnit: ArmyUnit,
    unitDefinition: Unit,
    enhancement: Enhancement,
): ValidationResult | null {
    if (enhancement.eligibleKeywords.length === 0) {
        return null;
    }

    const lowerKeywords = unitDefinition.keywords.map((k) => k.toLowerCase());
    const missingKeywords = enhancement.eligibleKeywords.filter(
        (keyword) => !lowerKeywords.includes(keyword.toLowerCase()),
    );

    if (missingKeywords.length === 0) {
        return null;
    }

    return {
        id: `enhancement-ineligible-${armyUnit.id}`,
        passed: false,
        severity: 'error',
        category: 'enhancement',
        message: `Enhancement ${armyUnit.enhancement?.enhancementName} is not eligible for ${unitDefinition.name}.`,
        unitId: armyUnit.id,
        unitName: unitDefinition.name,
        details: { missingKeywords },
    };
}

/**
 * Check that the army does not exceed the maximum of 3 enhancements.
 * @param enhancementIds - Array of enhancement IDs assigned in the army
 * @returns ValidationResult if count exceeds 3, null otherwise
 */
function checkEnhancementMaxCount(enhancementIds: string[]): ValidationResult | null {
    if (enhancementIds.length <= 3) {
        return null;
    }

    return {
        id: 'enhancement-max-3',
        passed: false,
        severity: 'error',
        category: 'enhancement',
        message: `Army has ${enhancementIds.length} enhancements, exceeding the maximum of 3.`,
        details: {
            count: enhancementIds.length,
            maxAllowed: 3,
        },
    };
}

/**
 * Check that no enhancement is selected more than once.
 * @param enhancementIds - Array of enhancement IDs assigned in the army
 * @param enhancementLookup - Map of enhancement ID to Enhancement definition
 * @returns Array of ValidationResult objects for duplicate enhancements
 */
function checkEnhancementUniqueness(
    enhancementIds: string[],
    enhancementLookup: Map<string, Enhancement>,
): ValidationResult[] {
    const results: ValidationResult[] = [];
    const countsByEnhancementId = new Map<string, number>();

    for (const enhancementId of enhancementIds) {
        countsByEnhancementId.set(enhancementId, (countsByEnhancementId.get(enhancementId) ?? 0) + 1);
    }

    for (const [enhancementId, count] of Array.from(countsByEnhancementId.entries())) {
        if (count > 1) {
            const enhancement = enhancementLookup.get(enhancementId);

            results.push({
                id: `enhancement-duplicate-${enhancementId}`,
                passed: false,
                severity: 'error',
                category: 'enhancement',
                message: `Enhancement ${enhancement?.name ?? enhancementId} is selected multiple times.`,
                details: { enhancementId, count },
            });
        }
    }

    return results;
}

/**
 * Validate enhancement assignment constraints.
 *
 * This validator runs five checks on enhancements assigned to units:
 * 1. checkEnhancementRequiresCharacter: Enhancements can only be assigned to Character units.
 * 2. checkEnhancementForbiddenOnEpicHero: Epic Heroes cannot take enhancements.
 * 3. checkEnhancementEligibility: Each enhancement has eligibleKeywords that the unit must match.
 * 4. checkEnhancementMaxCount: Army cannot have more than 3 enhancements total.
 * 5. checkEnhancementUniqueness: Each enhancement can only be selected once per army.
 *
 * Per Warhammer 40K 10th edition rules, enhancements are special upgrades that only Characters
 * can take (except Epic Heroes which are forbidden from taking them). Each enhancement may have
 * keyword restrictions (e.g., "Infantry" or "Vehicle") that the target unit must possess.
 *
 * @param army - The army list to validate, containing units with optional enhancement assignments.
 * @param factionData - The faction data model containing unit definitions (for keyword and Character
 *                      status lookups) and enhancement definitions (for eligibleKeywords and names).
 * @returns Array of ValidationResult objects. Includes error results for enhancement violations
 *          (non-Character units, Epic Heroes, keyword mismatches, max count, duplicates).
 */
export function validateEnhancements(army: Army, factionData: FactionData): ValidationResult[] {
    const results: ValidationResult[] = [];
    const enhancementIds: string[] = [];

    for (const armyUnit of army.units) {
        if (!armyUnit.enhancement) {
            continue;
        }

        enhancementIds.push(armyUnit.enhancement.enhancementId);

        const unitDefinition = factionData.units.find((unit) => unit.id === armyUnit.unitId);
        const enhancement = factionData.enhancements.find((e) => e.id === armyUnit.enhancement!.enhancementId);

        if (!unitDefinition) {
            continue;
        }

        const characterResult = checkEnhancementRequiresCharacter(armyUnit, unitDefinition);

        if (characterResult) {
            results.push(characterResult);
        }

        const epicHeroResult = checkEnhancementForbiddenOnEpicHero(armyUnit, unitDefinition);

        if (epicHeroResult) {
            results.push(epicHeroResult);
        }

        if (enhancement) {
            const eligibilityResult = checkEnhancementEligibility(armyUnit, unitDefinition, enhancement);

            if (eligibilityResult) {
                results.push(eligibilityResult);
            }
        }
    }

    const maxCountResult = checkEnhancementMaxCount(enhancementIds);

    if (maxCountResult) {
        results.push(maxCountResult);
    }

    const enhancementLookup = new Map(factionData.enhancements.map((e) => [e.id, e]));
    results.push(...checkEnhancementUniqueness(enhancementIds, enhancementLookup));

    return results;
}
