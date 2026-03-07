import type { Army, ArmyUnit } from '@wh40k10e/models/ArmyModel.js';
import type { FactionData } from '@wh40k10e/models/FactionData.js';
import type { Unit } from '@wh40k10e/models/UnitModel.js';
import type { ValidationResult } from '@wh40k10e/validation/types.js';

/**
 * Determine if a unit is a Dedicated Transport based on its keywords.
 * @param unitDefinition - The unit datasheet definition
 * @returns True if unit has 'Dedicated Transport' keyword, false otherwise
 */
function isDedicatedTransport(unitDefinition: Unit): boolean {
    const lowerKeywords = unitDefinition.keywords.map((keyword) => keyword.toLowerCase());

    return lowerKeywords.includes('dedicated transport');
}

/**
 * Check that a Dedicated Transport has embarked units assigned.
 * TODO: Replace this warning with real embark validation when transport assignment fields exist.
 * @param armyUnit - The army unit to validate
 * @param unitDefinition - The unit datasheet definition
 * @returns ValidationResult warning if transport has no embarked units, null otherwise
 */
function checkTransportEmbarkAssignments(armyUnit: ArmyUnit, unitDefinition: Unit): ValidationResult | null {
    if (!isDedicatedTransport(unitDefinition)) {
        return null;
    }

    return {
        id: `transport-embark-missing-${armyUnit.id}`,
        passed: false,
        severity: 'warning',
        category: 'transport',
        message: `${unitDefinition.name} is a Dedicated Transport and must start with at least one unit embarked.`,
        unitId: armyUnit.id,
        unitName: unitDefinition.name,
        details: {
            unitId: armyUnit.unitId,
        },
    };
}

/**
 * Validate Dedicated Transport embark rules.
 *
 * Currently emits a warning for Dedicated Transport units because embark assignments
 * are not yet modeled on ArmyUnit. When transport assignment fields are available,
 * replace this with strict validation.
 *
 * @param army - The army list to validate, containing unit selections.
 * @param factionData - The faction data containing unit definitions.
 * @returns Array of ValidationResult objects. Includes warnings for unvalidated transports.
 */
export function validateTransport(army: Army, factionData: FactionData): ValidationResult[] {
    const results: ValidationResult[] = [];

    for (const armyUnit of army.units) {
        const unitDefinition = factionData.units.find((unit) => unit.id === armyUnit.unitId);

        if (!unitDefinition) {
            continue;
        }

        const embarkResult = checkTransportEmbarkAssignments(armyUnit, unitDefinition);

        if (embarkResult) {
            results.push(embarkResult);
        }
    }

    return results;
}
