# type-guards.ts

Runtime type guard functions for weapon entity types, enabling safe narrowing of the `Weapon` union type.

**Source:** `src/shared/types/type-guards.ts`

## Overview

This file provides type guard functions for discriminating between `RangedWeapon` and `MeleeWeapon` within the `Weapon` union type. These guards are separated from the type definitions in `entities.ts` to enable tree-shaking -- consumers that only need the types do not need to import runtime code.

---

## Functions

### `isRangedWeapon`

Narrows a `Weapon` to `RangedWeapon` by checking the `type` discriminator property.

```typescript
function isRangedWeapon(weapon: Weapon): weapon is RangedWeapon;
```

**Parameters:**

| Parameter | Type     | Description         |
| --------- | -------- | ------------------- |
| `weapon`  | `Weapon` | The weapon to check |

**Returns:** `true` if `weapon.type === 'ranged'`, narrowing the type to `RangedWeapon`. After narrowing, the `range` property is available.

```typescript
import type { Weapon } from '@armoury/shared';
import { isRangedWeapon } from '@armoury/shared';

function describeWeapon(weapon: Weapon): string {
    if (isRangedWeapon(weapon)) {
        // TypeScript knows weapon is RangedWeapon here
        return `${weapon.name} (Range: ${weapon.range}, S${weapon.strength}, AP${weapon.ap})`;
    }
    return `${weapon.name} (Melee, S${weapon.strength}, AP${weapon.ap})`;
}
```

---

### `isMeleeWeapon`

Narrows a `Weapon` to `MeleeWeapon` by checking the `type` discriminator property.

```typescript
function isMeleeWeapon(weapon: Weapon): weapon is MeleeWeapon;
```

**Parameters:**

| Parameter | Type     | Description         |
| --------- | -------- | ------------------- |
| `weapon`  | `Weapon` | The weapon to check |

**Returns:** `true` if `weapon.type === 'melee'`, narrowing the type to `MeleeWeapon`.

```typescript
import type { Weapon } from '@armoury/shared';
import { isMeleeWeapon } from '@armoury/shared';

function getMeleeWeapons(weapons: Weapon[]): Weapon[] {
    return weapons.filter(isMeleeWeapon);
}
```

---

## Usage Example: Processing a Unit's Weapons

```typescript
import type { Unit } from '@armoury/shared';
import { isRangedWeapon, isMeleeWeapon } from '@armoury/shared';

function summarizeUnitWeapons(unit: Unit): void {
    const allWeapons = [...unit.rangedWeapons, ...unit.meleeWeapons];

    for (const weapon of allWeapons) {
        if (isRangedWeapon(weapon)) {
            console.log(
                `[Ranged] ${weapon.name}: ${weapon.range}, ` +
                    `${weapon.attacks}A, BS${weapon.skill}, ` +
                    `S${weapon.strength}, AP${weapon.ap}, D${weapon.damage}`,
            );
        } else if (isMeleeWeapon(weapon)) {
            console.log(
                `[Melee] ${weapon.name}: ` +
                    `${weapon.attacks}A, WS${weapon.skill}, ` +
                    `S${weapon.strength}, AP${weapon.ap}, D${weapon.damage}`,
            );
        }
    }
}
```
