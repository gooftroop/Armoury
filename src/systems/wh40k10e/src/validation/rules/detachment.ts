import type { Army } from '../../models/ArmyModel.ts';
import type { FactionData } from '../../models/FactionData.ts';
import type { ValidationResult } from '../types.ts';

/**
 * Check that the army has a detachment selected.
 * @param army - The army to validate
 * @returns ValidationResult if no detachment is selected, null otherwise
 */
function checkDetachmentSelected(army: Army): ValidationResult | null {
    const detachmentId = army.detachmentId?.trim() ?? '';

    if (detachmentId) {
        return null;
    }

    return {
        id: 'detachment-missing',
        passed: false,
        severity: 'error',
        category: 'detachment',
        message: 'Army must select a detachment.',
    };
}

/**
 * Check that the selected detachment exists in the faction data.
 * @param army - The army with detachment selection
 * @param factionData - The faction data containing available detachments
 * @returns ValidationResult if detachment doesn't exist, null otherwise
 */
function checkDetachmentExists(army: Army, factionData: FactionData): ValidationResult | null {
    const detachmentId = army.detachmentId?.trim() ?? '';
    const detachment = factionData.detachments.find((entry) => entry.id === detachmentId);

    if (detachment) {
        return null;
    }

    return {
        id: `detachment-invalid-${detachmentId}`,
        passed: false,
        severity: 'error',
        category: 'detachment',
        message: 'Selected detachment does not exist for this faction.',
        details: {
            detachmentId,
        },
    };
}

/**
 * Validate detachment selection rules.
 *
 * Ensures an army selects exactly one detachment and that the chosen detachment
 * exists in the available faction data.
 *
 * @param army - The army list to validate, including detachment selection.
 * @param factionData - The faction data containing available detachments.
 * @returns Array of ValidationResult objects. Includes errors for missing or invalid detachments.
 */
export function validateDetachment(army: Army, factionData: FactionData): ValidationResult[] {
    const results: ValidationResult[] = [];
    const selectionResult = checkDetachmentSelected(army);

    if (selectionResult) {
        results.push(selectionResult);

        return results;
    }

    const existsResult = checkDetachmentExists(army, factionData);

    if (existsResult) {
        results.push(existsResult);
    }

    return results;
}
