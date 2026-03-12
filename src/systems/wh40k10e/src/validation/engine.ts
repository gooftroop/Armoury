import type { Army } from '@/models/ArmyModel.js';
import type { FactionData } from '@/models/FactionData.js';
import type { CoreRules } from '@/models/CoreRules.js';
import type { ValidationResult, ValidationSummary } from '@armoury/validation';
import {
    validateCharacter,
    validateComposition,
    validateDetachment,
    validateEnhancements,
    validateFactionKeyword,
    validateLeaders,
    validatePoints,
    validateStrategicReserves,
    validateTransport,
    validateWargear,
    validateWarlord,
} from '@/validation/rules/index.js';

/**
 * Validate a Warhammer 40K 10th Edition army list against faction data and core rules.
 *
 * This orchestrates all 40K validation rules (points, composition, enhancements, leaders, wargear,
 * and warlord) and aggregates their results into a ValidationSummary.
 *
 * @param army - The army list to validate, containing units, enhancements, warlord designation, etc.
 * @param factionData - The faction data containing all available units, enhancements, and rules
 *                      for the selected faction. Passed directly to each rule validator.
 * @param _coreRules - The core rules (unused — reserved for future rule-based validation).
 * @returns A ValidationSummary containing the overall validity status, error/warning/info counts,
 *          and an array of detailed ValidationResult objects from all rule validators.
 */
export function validateArmy(army: Army, factionData: FactionData, _coreRules: CoreRules): ValidationSummary {
    const results: ValidationResult[] = [
        ...validatePoints(army, factionData),
        ...validateStrategicReserves(army, factionData),
        ...validateComposition(army, factionData),
        ...validateCharacter(army, factionData),
        ...validateDetachment(army, factionData),
        ...validateEnhancements(army, factionData),
        ...validateFactionKeyword(army, factionData),
        ...validateLeaders(army, factionData),
        ...validateTransport(army, factionData),
        ...validateWargear(army, factionData),
        ...validateWarlord(army, factionData),
    ];

    const errorCount = results.filter((result) => result.severity === 'error' && !result.passed).length;
    const warningCount = results.filter((result) => result.severity === 'warning' && !result.passed).length;
    const infoCount = results.filter((result) => result.severity === 'info').length;

    return {
        isValid: errorCount === 0,
        errorCount,
        warningCount,
        infoCount,
        results,
    };
}
