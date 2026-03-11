import type { Army, ArmyUnit, ArmyWargearSelection } from '@/models/ArmyModel.js';
import type { FactionData } from '@/models/FactionData.js';
import type { Unit, WargearOption } from '@/models/UnitModel.js';
import type { ValidationResult } from '@/validation/types.js';

/**
 * Check that a wargear selection references a valid option on the unit datasheet.
 * @param armyUnit - The army unit with the wargear selection
 * @param selection - The wargear selection to validate
 * @param unitDefinition - The unit datasheet definition
 * @returns ValidationResult if option doesn't exist, null otherwise
 */
function checkWargearOptionExists(
    armyUnit: ArmyUnit,
    selection: ArmyWargearSelection,
    unitDefinition: Unit,
): ValidationResult | null {
    const option = unitDefinition.wargearOptions.find((entry) => entry.id === selection.wargearOptionId);

    if (option) {
        return null;
    }

    return {
        id: `wargear-invalid-option-${armyUnit.id}-${selection.wargearOptionId}`,
        passed: false,
        severity: 'error',
        category: 'wargear',
        message: `Wargear option ${selection.choiceName} is not valid for ${unitDefinition.name}.`,
        unitId: armyUnit.id,
        unitName: unitDefinition.name,
        details: {
            wargearOptionId: selection.wargearOptionId,
            choiceId: selection.choiceId,
        },
    };
}

function checkWargearChoiceExists(
    armyUnit: ArmyUnit,
    selection: ArmyWargearSelection,
    option: WargearOption,
    datasheetName: string,
): ValidationResult | null {
    const hasChoice = option.choices.some((choice) => choice.id === selection.choiceId);

    if (hasChoice) {
        return null;
    }

    return {
        id: `wargear-invalid-choice-${armyUnit.id}-${selection.choiceId}`,
        passed: false,
        severity: 'error',
        category: 'wargear',
        message: `Wargear choice ${selection.choiceName} is not valid for ${datasheetName}.`,
        unitId: armyUnit.id,
        unitName: datasheetName,
        details: {
            wargearOptionId: selection.wargearOptionId,
            choiceId: selection.choiceId,
        },
    };
}

function checkWargearMinSelections(
    armyUnit: ArmyUnit,
    option: WargearOption,
    count: number,
    datasheetName: string,
): ValidationResult | null {
    if (count >= option.minSelections) {
        return null;
    }

    return {
        id: `wargear-min-${armyUnit.id}-${option.id}`,
        passed: false,
        severity: 'error',
        category: 'wargear',
        message: `${datasheetName} must take at least ${option.minSelections} selections for ${option.name}.`,
        unitId: armyUnit.id,
        unitName: datasheetName,
        details: {
            minSelections: option.minSelections,
            currentSelections: count,
        },
    };
}

function checkWargearMaxSelections(
    armyUnit: ArmyUnit,
    option: WargearOption,
    count: number,
    datasheetName: string,
): ValidationResult | null {
    if (count <= option.maxSelections) {
        return null;
    }

    return {
        id: `wargear-max-${armyUnit.id}-${option.id}`,
        passed: false,
        severity: 'error',
        category: 'wargear',
        message: `${datasheetName} exceeds the maximum selections for ${option.name}.`,
        unitId: armyUnit.id,
        unitName: datasheetName,
        details: {
            maxSelections: option.maxSelections,
            currentSelections: count,
        },
    };
}

/**
 * Validate wargear selection constraints.
 *
 * This validator runs four checks on wargear selections for each unit:
 * 1. checkWargearOptionExists: Each wargear selection must reference a valid wargear option ID
 *    from the unit's datasheet.
 * 2. checkWargearChoiceExists: Each wargear selection must reference a valid choice ID within
 *    the selected wargear option.
 * 3. checkWargearMinSelections: For each wargear option, the number of selections must meet
 *    the option's minSelections requirement.
 * 4. checkWargearMaxSelections: For each wargear option, the number of selections must not exceed
 *    the option's maxSelections limit.
 *
 * Wargear options are defined in BattleScribe data and represent equipment choices (e.g., weapon
 * upgrades, armor options). Each option has a list of choices and min/max selection constraints.
 * A unit can make multiple selections from the same option (e.g., "take 2-4 Plasma Rifles").
 *
 * @param army - The army list to validate, containing units with wargear selections.
 * @param factionData - The faction data containing unit definitions with wargear options
 *                      and their constraints for each unit.
 * @returns Array of ValidationResult objects. Includes error results for wargear violations
 *          (invalid options, invalid choices, min/max selection violations).
 */
export function validateWargear(army: Army, factionData: FactionData): ValidationResult[] {
    const results: ValidationResult[] = [];

    for (const armyUnit of army.units) {
        const unitDefinition = factionData.units.find((unit) => unit.id === armyUnit.unitId);

        if (!unitDefinition) {
            continue;
        }

        const datasheetName = unitDefinition.name;
        const selectionsByOptionId = new Map<string, number>();

        for (const selection of armyUnit.wargearSelections) {
            const optionMissing = checkWargearOptionExists(armyUnit, selection, unitDefinition);

            if (optionMissing) {
                results.push(optionMissing);
                continue;
            }

            const option = unitDefinition.wargearOptions.find((entry) => entry.id === selection.wargearOptionId)!;
            const choiceMissing = checkWargearChoiceExists(armyUnit, selection, option, datasheetName);

            if (choiceMissing) {
                results.push(choiceMissing);
            }

            selectionsByOptionId.set(
                selection.wargearOptionId,
                (selectionsByOptionId.get(selection.wargearOptionId) ?? 0) + 1,
            );
        }

        for (const option of unitDefinition.wargearOptions) {
            const count = selectionsByOptionId.get(option.id) ?? 0;
            const minResult = checkWargearMinSelections(armyUnit, option, count, datasheetName);

            if (minResult) {
                results.push(minResult);
            }

            const maxResult = checkWargearMaxSelections(armyUnit, option, count, datasheetName);

            if (maxResult) {
                results.push(maxResult);
            }
        }
    }

    return results;
}
