# Data Model: Forge Create Army Flow

**Feature ID**: 001-forge-create-army-flow
**Source**: `src/systems/wh40k10e/src/models/ArmyModel.ts`, `src/systems/wh40k10e/src/models/FactionData.ts`, `src/shared/features/forge/src/utils/createArmyHelpers.ts`

---

## `BattleSize`

Defined in `src/systems/wh40k10e/src/models/ArmyModel.ts:92`.

```typescript
type BattleSize = 'Incursion' | 'StrikeForce' | 'Onslaught';
```

| Value         | Points Limit | Duration | Battlefield |
| ------------- | ------------ | -------- | ----------- |
| `Incursion`   | 1000         | ~2 hours | 44" × 60"   |
| `StrikeForce` | 2000         | ~3 hours | 44" × 60"   |
| `Onslaught`   | 3000         | ~4 hours | 44" × 90"   |

---

## `Army`

Defined in `src/systems/wh40k10e/src/models/ArmyModel.ts:99`.

```typescript
interface Army {
    /** Unique identifier for this army. UUID v4. */
    id: string;
    /** User ID of the army owner. */
    ownerId: string;
    /** Army name for display (e.g. "Ultramarines Strike Force"). */
    name: string;
    /** Faction ID from faction data (e.g. "space-marines", "necrons"). */
    factionId: string;
    /** Detachment ID from faction data, or null when none applies. */
    detachmentId: string | null;
    /** ID of the unit designated as the Warlord, or null. */
    warlordUnitId: string | null;
    /** Battle size (determines points limit and game duration). */
    battleSize: BattleSize;
    /** Points limit derived from battle size (1000, 2000, or 3000). */
    pointsLimit: number;
    /** Current units in the army. */
    units: ArmyUnit[];
    /** Total points of current units (sum of all unit costs). */
    totalPoints: number;
    /** User-provided notes about the army. */
    notes: string;
    /** Version history snapshots. */
    versions: ArmyVersion[];
    /** Index of the current version in the versions array. */
    currentVersion: number;
    /** When this army was created. ISO 8601 string. */
    createdAt: string;
    /** When this army was last updated. ISO 8601 string. */
    updatedAt: string;
}
```

### Defaults set by `buildNewArmy`

When a new army is created via the Forge flow, `buildNewArmy` sets these defaults:

| Field            | Default                    |
| ---------------- | -------------------------- |
| `id`             | `crypto.randomUUID()`      |
| `warlordUnitId`  | `null`                     |
| `units`          | `[]`                       |
| `totalPoints`    | `0`                        |
| `notes`          | `''`                       |
| `versions`       | `[]`                       |
| `currentVersion` | `0`                        |
| `createdAt`      | `new Date().toISOString()` |
| `updatedAt`      | same as `createdAt`        |
| `pointsLimit`    | derived from `battleSize`  |
| `name`           | `draft.name.trim()`        |

---

## `CreateArmyDraft`

Defined in `src/shared/features/forge/src/utils/createArmyHelpers.ts:14`.

The input type consumed by `buildNewArmy`. Represents the validated form values plus the authenticated owner ID.

```typescript
interface CreateArmyDraft {
    /** Army name entered by the user (will be trimmed). */
    name: string;
    /** Selected faction identifier. */
    factionId: string;
    /** Selected detachment identifier, or null when none applies. */
    detachmentId: string | null;
    /** Selected battle size preset. */
    battleSize: BattleSize;
    /** Current authenticated owner identifier. */
    ownerId: string;
}
```

---

## `CreateArmyFormValues`

Defined in `src/shared/features/forge/src/components/CreateArmyForm.web.tsx:59`.

The mutable form state held by `CreateArmyContainer`. Fields are nullable until the user makes a selection.

```typescript
interface CreateArmyFormValues {
    /** Army name as typed by the user (untrimmed). */
    name: string;
    /** Selected faction ID, or null if none selected. */
    factionId: string | null;
    /** Selected detachment ID, or null if none selected / not applicable. */
    detachmentId: string | null;
    /** Selected battle size, or null if none selected. */
    battleSize: BattleSize | null;
}
```

---

## `FactionOption` and `DetachmentOption`

Defined in `src/shared/features/forge/src/components/CreateArmyForm.web.tsx:43,51`.

Lightweight view-model types passed from the container to the pure form component.

```typescript
interface FactionOption {
    /** Stable faction identifier (matches Army.factionId). */
    id: string;
    /** User-visible faction label. */
    name: string;
}

interface DetachmentOption {
    /** Stable detachment identifier (matches Army.detachmentId). */
    id: string;
    /** User-visible detachment label. */
    name: string;
}
```

---

## `FactionData`

Defined in `src/systems/wh40k10e/src/models/FactionData.ts:38`.

The full faction data object loaded from BattleScribe catalogue files. The `detachments` field is the source of truth for `DetachmentOption` values.

```typescript
interface FactionData {
    id: string;
    name: string;
    armyImageUrl: string;
    sourceFiles: string[];
    lastSynced: Date;
    factionRules: FactionRule[];
    structuredFactionRules: StructuredRule[];
    stratagems: Stratagem[];
    /** Detachments available to this faction. Source for DetachmentOption. */
    detachments: Detachment[];
    enhancements: Enhancement[];
    units: Unit[];
    weapons: Weapon[];
    abilities: Ability[];
}
```

---

## `Detachment`

Defined in `src/systems/wh40k10e/src/types/entities.ts` (referenced by `FactionData.detachments`).

```typescript
interface Detachment {
    id: string;
    name: string;
    rules: StructuredRule[];
    structuredRules: StructuredRule[];
    enhancements: Enhancement[];
}
```

---

## Points Limit Mapping

Defined in `src/shared/features/forge/src/utils/createArmyHelpers.ts:27`.

```typescript
const POINTS_LIMIT_BY_BATTLE_SIZE: Record<BattleSize, number> = {
    Incursion: 1000,
    StrikeForce: 2000,
    Onslaught: 3000,
};
```

---

## Validation Constants

Defined in `src/web/src/components/CreateArmyContainer.tsx:45-48`.

```typescript
const MIN_NAME_LENGTH = 3;
const MAX_NAME_LENGTH = 60;
```
