import type { Army } from '@wh40k10e/models/ArmyModel.js';
import type { FactionData } from '@wh40k10e/models/FactionData.js';
import type { ValidationResult } from '@wh40k10e/validation/types.js';

/**
 * Validate Strategic Reserves points limit.
 *
 * Strategic Reserves are match-level data and not tracked at the army building level.
 * This validator is a no-op placeholder retained for the validation engine's rule registry.
 *
 * @param _army - The army list (unused).
 * @param _factionData - The faction data (unused).
 * @returns Empty array — no army-level reserve validation.
 */
export function validateStrategicReserves(_army: Army, _factionData: FactionData): ValidationResult[] {
    return [];
}
