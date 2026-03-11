import type { Army, ArmyUnit } from '../../models/ArmyModel.ts';
import type { FactionData } from '../../models/FactionData.ts';
import type { Unit } from '../../models/UnitModel.ts';
import type { ParsedConstraint } from '@armoury/providers-bsdata/constraintTypes';
import type { ValidationResult } from '../types.ts';

/**
 * Find a roster-scope max-selections constraint if present.
 * @param constraints - Array of parsed constraints to search
 * @returns The max value if found, null otherwise
 */
function getRosterMaxConstraint(constraints: ParsedConstraint[] | undefined): number | null {
    if (!constraints || constraints.length === 0) {
        return null;
    }

    const rosterMax = constraints.find((constraint) => {
        return (
            constraint.scope === 'roster' && constraint.constraintType === 'max' && constraint.field === 'selections'
        );
    });

    return rosterMax ? rosterMax.value : null;
}

/**
 * Determine the default max count based on unit keywords (3 standard, 6 for Battleline/Transport).
 * @param unit - The unit definition to check
 * @returns Default max count (3 or 6)
 */
function getDefaultMaxCount(unit: Unit): number {
    const lowerKeywords = unit.keywords.map((keyword) => keyword.toLowerCase());
    const isBattleline = lowerKeywords.includes('battleline');
    const isDedicatedTransport = lowerKeywords.includes('dedicated transport');

    if (isBattleline || isDedicatedTransport) {
        return 6;
    }

    return 3;
}

/**
 * Check that a unit's model count matches a valid composition option from its datasheet.
 * @param armyUnit - The army unit to validate
 * @param unitDefinition - The unit datasheet definition
 * @returns ValidationResult if model count is invalid, null otherwise
 */
function checkModelCount(armyUnit: ArmyUnit, unitDefinition: Unit): ValidationResult | null {
    const hasMatchingComposition = unitDefinition.composition.some((option) => option.models === armyUnit.modelCount);

    if (hasMatchingComposition) {
        return null;
    }

    return {
        id: `composition-invalid-size-${armyUnit.id}`,
        passed: false,
        severity: 'error',
        category: 'composition',
        message: `Unit size ${armyUnit.modelCount} is not a valid composition option for ${unitDefinition.name}.`,
        unitId: armyUnit.id,
        unitName: unitDefinition.name,
        details: {
            unitId: armyUnit.unitId,
            modelCount: armyUnit.modelCount,
        },
    };
}

/**
 * Check that the number of copies of a datasheet does not exceed the maximum allowed.
 * @param unitId - The unit ID to check
 * @param count - The number of copies in the army
 * @param unitDefinition - The unit datasheet definition
 * @returns ValidationResult if count exceeds limit, null otherwise
 */
function checkDatasheetLimit(unitId: string, count: number, unitDefinition: Unit): ValidationResult | null {
    const constraintMax = getRosterMaxConstraint(unitDefinition.constraints);
    const maxAllowed = constraintMax ?? getDefaultMaxCount(unitDefinition);

    if (count <= maxAllowed) {
        return null;
    }

    return {
        id: `composition-max-${maxAllowed}-${unitId}`,
        passed: false,
        severity: 'error',
        category: 'composition',
        message: `Army has ${count} copies of ${unitDefinition.name}, exceeding the maximum of ${maxAllowed}.`,
        details: {
            unitId,
            unitName: unitDefinition.name,
            count,
            maxAllowed,
            constraintMax,
        },
    };
}

/**
 * Validate unit composition rules for model counts and datasheet limits.
 *
 * This validator runs two main checks:
 * 1. checkModelCount: For each unit, verifies the selected model count matches a valid composition
 *    option from the unit's datasheet (e.g., 5, 10, or 20 models).
 * 2. checkDatasheetLimit: For each unique unit datasheet, verifies the number of copies does not
 *    exceed the maximum allowed. Default limits are 3 per datasheet, 6 for Battleline or
 *    Dedicated Transport units (per Warhammer 40K 10th edition rules). Limits can be overridden
 *    by roster-scope max-selections constraints from BattleScribe.
 *
 * @param army - The army list to validate, containing all units with their model counts.
 * @param factionData - The faction data model containing unit definitions with composition options,
 *                      keywords, and constraints for each unit.
 * @returns Array of ValidationResult objects. Includes error results for invalid model counts
 *          or datasheet limit violations.
 */
export function validateComposition(army: Army, factionData: FactionData): ValidationResult[] {
    const results: ValidationResult[] = [];
    const countsByUnitId = new Map<string, number>();

    for (const armyUnit of army.units) {
        countsByUnitId.set(armyUnit.unitId, (countsByUnitId.get(armyUnit.unitId) ?? 0) + 1);

        const unitDefinition = factionData.units.find((unit) => unit.id === armyUnit.unitId);

        if (!unitDefinition) {
            continue;
        }

        const modelCountResult = checkModelCount(armyUnit, unitDefinition);

        if (modelCountResult) {
            results.push(modelCountResult);
        }
    }

    for (const [unitId, count] of Array.from(countsByUnitId.entries())) {
        const unitDefinition = factionData.units.find((unit) => unit.id === unitId);

        if (!unitDefinition) {
            continue;
        }

        const limitResult = checkDatasheetLimit(unitId, count, unitDefinition);

        if (limitResult) {
            results.push(limitResult);
        }
    }

    return results;
}
