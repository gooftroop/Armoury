import type { Army, ArmyUnit } from '../../models/ArmyModel.ts';
import type { FactionData } from '../../models/FactionData.ts';
import type { Unit } from '../../models/UnitModel.ts';
import type { ValidationResult } from '../types.ts';

/**
 * Check that the army total points do not exceed the battle size limit.
 * @param army - The army to validate
 * @returns ValidationResult if points exceed limit, null otherwise
 */
function checkPointsLimit(army: Army): ValidationResult | null {
    if (army.totalPoints <= army.pointsLimit) {
        return null;
    }

    return {
        id: 'points-over-limit',
        passed: false,
        severity: 'error',
        category: 'points',
        message: `Army exceeds points limit by ${army.totalPoints - army.pointsLimit} points.`,
        details: {
            totalPoints: army.totalPoints,
            pointsLimit: army.pointsLimit,
            overBy: army.totalPoints - army.pointsLimit,
        },
    };
}

/**
 * Check that a unit's points match a valid composition option from its datasheet.
 * @param armyUnit - The army unit to validate
 * @param unitDefinition - The unit datasheet definition
 * @returns ValidationResult if points don't match composition, null otherwise
 */
function checkUnitPointsMatchComposition(armyUnit: ArmyUnit, unitDefinition: Unit): ValidationResult | null {
    const match = unitDefinition.composition.find((option) => option.models === armyUnit.modelCount);

    if (match && match.points === armyUnit.totalPoints) {
        return null;
    }

    return {
        id: `points-unit-mismatch-${armyUnit.id}`,
        passed: false,
        severity: 'error',
        category: 'points',
        message: `Unit points do not match a valid composition option for ${unitDefinition.name}.`,
        unitId: armyUnit.id,
        unitName: unitDefinition.name,
        details: {
            unitId: armyUnit.unitId,
            modelCount: armyUnit.modelCount,
            unitPoints: armyUnit.totalPoints,
        },
    };
}

/**
 * Report remaining points budget as an informational result.
 * @param army - The army to calculate remaining points for
 * @returns ValidationResult with info severity showing remaining points
 */
function checkRemainingPoints(army: Army): ValidationResult {
    const remainingPoints = army.pointsLimit - army.totalPoints;

    return {
        id: 'points-remaining',
        passed: remainingPoints >= 0,
        severity: 'info',
        category: 'points',
        message: `Points remaining: ${remainingPoints}.`,
        details: {
            totalPoints: army.totalPoints,
            pointsLimit: army.pointsLimit,
            remainingPoints,
        },
    };
}

/**
 * Validate army points against the battle size limit and unit composition costs.
 *
 * This validator runs three checks:
 * 1. checkPointsLimit: Ensures total army points do not exceed the battle size limit
 * 2. checkUnitPointsMatchComposition: For each unit, verifies the selected model count and total
 *    points match a valid composition option from the unit's datasheet
 * 3. checkRemainingPoints: Reports remaining points budget as informational result
 *
 * Points data comes from BattleScribe constraints and unit composition definitions. The battle
 * size limit (Incursion 1000, Strike Force 2000, Onslaught 3000) is set on the Army object.
 *
 * @param army - The army list to validate, containing units and pointsLimit from battle size selection.
 * @param factionData - The faction data containing unit definitions with composition options.
 *                      Used to look up each unit's valid model count and points combinations.
 * @returns Array of ValidationResult objects. Returns null for passed checks (collected as non-null results).
 *          Includes error results for points violations and info result for remaining points.
 */
export function validatePoints(army: Army, factionData: FactionData): ValidationResult[] {
    const results: ValidationResult[] = [];

    const limitResult = checkPointsLimit(army);

    if (limitResult) {
        results.push(limitResult);
    }

    for (const armyUnit of army.units) {
        const unitDefinition = factionData.units.find((unit) => unit.id === armyUnit.unitId);

        if (!unitDefinition) {
            continue;
        }

        const mismatch = checkUnitPointsMatchComposition(armyUnit, unitDefinition);

        if (mismatch) {
            results.push(mismatch);
        }
    }

    results.push(checkRemainingPoints(army));

    return results;
}
