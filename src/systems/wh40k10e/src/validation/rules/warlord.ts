import type { Army, ArmyUnit } from '@/models/ArmyModel.js';
import type { FactionData } from '@/models/FactionData.js';
import type { Unit } from '@/models/UnitModel.js';
import type { ValidationResult } from '@/validation/types.js';

/**
 * Check that the army has a warlord designated.
 * @param army - The army to validate
 * @returns ValidationResult if no warlord is designated, null otherwise
 */
function checkWarlordDesignated(army: Army): ValidationResult | null {
    if (army.warlordUnitId) {
        return null;
    }

    return {
        id: 'warlord-missing',
        passed: false,
        severity: 'error',
        category: 'warlord',
        message: 'Army must designate a Warlord.',
    };
}

/**
 * Check that the warlord designation references a unit in the army.
 * @param army - The army to validate
 * @returns The warlord ArmyUnit if found, ValidationResult if not found
 */
function checkWarlordExistsInArmy(army: Army): ArmyUnit | ValidationResult {
    const warlordUnit = army.units.find((unit) => unit.id === army.warlordUnitId);

    if (warlordUnit) {
        return warlordUnit;
    }

    return {
        id: `warlord-invalid-${army.warlordUnitId}`,
        passed: false,
        severity: 'error',
        category: 'warlord',
        message: 'Warlord designation does not match any unit in the army.',
        details: { warlordUnitId: army.warlordUnitId },
    };
}

/**
 * Check that the warlord unit has the Character keyword.
 * @param warlordUnit - The designated warlord unit
 * @param unitDefinition - The warlord unit datasheet definition
 * @returns ValidationResult if warlord is not a Character, null otherwise
 */
function checkWarlordIsCharacter(warlordUnit: ArmyUnit, unitDefinition: Unit): ValidationResult | null {
    const lowerKeywords = unitDefinition.keywords.map((k) => k.toLowerCase());

    if (lowerKeywords.includes('character')) {
        return null;
    }

    return {
        id: `warlord-not-character-${warlordUnit.id}`,
        passed: false,
        severity: 'error',
        category: 'warlord',
        message: `${unitDefinition.name} is not a Character and cannot be the Warlord.`,
        unitId: warlordUnit.id,
        unitName: unitDefinition.name,
    };
}

/**
 * Validate warlord designation.
 *
 * This validator runs three checks on the warlord assignment:
 * 1. checkWarlordDesignated: The army must have a warlord designated (warlordUnitId must be set).
 * 2. checkWarlordExistsInArmy: The warlordUnitId must reference a unit that exists in the army.
 * 3. checkWarlordIsCharacter: The designated warlord unit must have the Character keyword.
 *
 * Per Warhammer 40K 10th edition rules, every army must designate exactly one Character unit as
 * the Warlord. The Warlord gains the Warlord keyword and may be eligible for certain Stratagems
 * and abilities that target the Warlord specifically.
 *
 * @param army - The army list to validate, containing the warlordUnitId designation.
 * @param factionData - The faction data containing unit definitions with keywords,
 *                      used to verify the warlord unit's Character status.
 * @returns Array of ValidationResult objects. Includes error results for warlord violations
 *          (missing designation, invalid unit reference, non-Character warlord).
 */
export function validateWarlord(army: Army, factionData: FactionData): ValidationResult[] {
    const results: ValidationResult[] = [];

    const designatedResult = checkWarlordDesignated(army);

    if (designatedResult) {
        results.push(designatedResult);

        return results;
    }

    const existsResult = checkWarlordExistsInArmy(army);

    if ('passed' in existsResult) {
        results.push(existsResult);

        return results;
    }

    const warlordUnit = existsResult;

    const unitDefinition = factionData.units.find((unit) => unit.id === warlordUnit.unitId);

    if (!unitDefinition) {
        return results;
    }

    const characterResult = checkWarlordIsCharacter(warlordUnit, unitDefinition);

    if (characterResult) {
        results.push(characterResult);
    }

    return results;
}
