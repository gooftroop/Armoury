import type { Army, ArmyUnit } from '@wh40k10e/models/ArmyModel.js';
import type { FactionData } from '@wh40k10e/models/FactionData.js';
import type { Unit } from '@wh40k10e/models/UnitModel.js';
import type { ValidationResult } from '@wh40k10e/validation/types.js';

/**
 * Check that a unit includes the army's faction keyword.
 * @param armyUnit - The army unit to validate
 * @param unitDefinition - The unit datasheet definition
 * @param requiredKeyword - The faction keyword that must be present
 * @returns ValidationResult if unit doesn't have the keyword, null otherwise
 */
function checkFactionKeyword(
    armyUnit: ArmyUnit,
    unitDefinition: Unit,
    requiredKeyword: string,
): ValidationResult | null {
    const lowerRequired = requiredKeyword.toLowerCase();
    const lowerKeywords = unitDefinition.factionKeywords.map((keyword) => keyword.toLowerCase());

    if (lowerKeywords.includes(lowerRequired)) {
        return null;
    }

    return {
        id: `faction-missing-keyword-${armyUnit.id}`,
        passed: false,
        severity: 'error',
        category: 'faction',
        message: `${unitDefinition.name} does not include the ${requiredKeyword} faction keyword.`,
        unitId: armyUnit.id,
        unitName: unitDefinition.name,
        details: {
            requiredKeyword,
            unitId: armyUnit.unitId,
            factionKeywords: unitDefinition.factionKeywords,
        },
    };
}

/**
 * Validate that all units share the army's faction keyword.
 *
 * Ensures every unit selected in the army list has the army's faction keyword
 * in its datasheet faction keyword list.
 *
 * @param army - The army list to validate, containing the chosen faction name.
 * @param factionData - The faction data containing unit definitions.
 * @returns Array of ValidationResult objects. Includes errors for units missing the keyword.
 */
export function validateFactionKeyword(army: Army, factionData: FactionData): ValidationResult[] {
    const results: ValidationResult[] = [];
    const requiredKeyword = factionData.name;

    for (const armyUnit of army.units) {
        const unitDefinition = factionData.units.find((unit) => unit.id === armyUnit.unitId);

        if (!unitDefinition) {
            continue;
        }

        const keywordResult = checkFactionKeyword(armyUnit, unitDefinition, requiredKeyword);

        if (keywordResult) {
            results.push(keywordResult);
        }
    }

    return results;
}
