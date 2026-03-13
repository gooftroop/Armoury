/**
 * Runtime type guard functions for Warhammer 40K entity types.
 * Separated from type definitions to enable tree-shaking.
 */
import type { Weapon, RangedWeapon, MeleeWeapon } from '@/types/entities.js';

/**
 * Type guard to narrow a Weapon to RangedWeapon.
 * Checks the type discriminator property to distinguish ranged weapons from melee weapons.
 * Ranged weapons have a range property (e.g., "24\"", "12\"").
 * @param weapon - The weapon to check
 * @returns True if weapon is a RangedWeapon instance
 */
export function isRangedWeapon(weapon: Weapon): weapon is RangedWeapon {
    return weapon.type === 'ranged';
}

/**
 * Type guard to narrow a Weapon to MeleeWeapon.
 * Checks the type discriminator property to distinguish melee weapons from ranged weapons.
 * Melee weapons have range always set to "Melee" and no range property.
 * @param weapon - The weapon to check
 * @returns True if weapon is a MeleeWeapon instance
 */
export function isMeleeWeapon(weapon: Weapon): weapon is MeleeWeapon {
    return weapon.type === 'melee';
}
