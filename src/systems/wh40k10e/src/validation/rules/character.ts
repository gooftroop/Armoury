import type { Army } from '@/models/ArmyModel.js';
import type { FactionData } from '@/models/FactionData.js';
import type { ValidationResult } from '@/validation/types.js';

/**
 * Count the number of Character units in the army.
 * @param army - The army to count characters in
 * @param factionData - The faction data containing unit definitions
 * @returns Number of units with the Character keyword
 */
function countCharacterUnits(army: Army, factionData: FactionData): number {
    let count = 0;

    for (const armyUnit of army.units) {
        const unitDefinition = factionData.units.find((unit) => unit.id === armyUnit.unitId);

        if (!unitDefinition) {
            continue;
        }

        const lowerKeywords = unitDefinition.keywords.map((keyword) => keyword.toLowerCase());

        if (lowerKeywords.includes('character')) {
            count += 1;
        }
    }

    return count;
}

/**
 * Check that the army includes at least one Character unit.
 * @param count - The number of Character units in the army
 * @returns ValidationResult if no characters present, null otherwise
 */
function checkMinimumCharacter(count: number): ValidationResult | null {
    if (count > 0) {
        return null;
    }

    return {
        id: 'composition-missing-character',
        passed: false,
        severity: 'error',
        category: 'composition',
        message: 'Army must include at least one Character unit.',
    };
}

/**
 * Validate that the army includes at least one Character unit.
 *
 * Per Warhammer 40K army construction rules, each army must include at least
 * one Character unit to serve as the Warlord.
 *
 * @param army - The army list to validate.
 * @param factionData - The faction data model containing unit definitions.
 * @returns Array of ValidationResult objects. Includes an error if no Characters are present.
 */
export function validateCharacter(army: Army, factionData: FactionData): ValidationResult[] {
    const results: ValidationResult[] = [];
    const characterCount = countCharacterUnits(army, factionData);
    const minimumResult = checkMinimumCharacter(characterCount);

    if (minimumResult) {
        results.push(minimumResult);
    }

    return results;
}
