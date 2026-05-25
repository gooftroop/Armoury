# UI Contract: Create Army Flow

**Feature ID**: 001-forge-create-army-flow
**Source**: `CreateArmyForm.web.tsx`, `CreateArmyContainer.tsx`, `armies/new/page.tsx`

---

## Route

| Property   | Value                                                                         |
| ---------- | ----------------------------------------------------------------------------- |
| Path       | `/{locale}/wh40k10e/armies/new`                                               |
| Type       | Server Component (Next.js App Router)                                         |
| Auth       | Required — unauthenticated → `/auth/login`; missing owner ID → `/auth/logout` |
| Loading UI | `loading.tsx` (skeleton)                                                      |

---

## Entry Points

| Surface           | Element              | Behaviour                           |
| ----------------- | -------------------- | ----------------------------------- |
| Forge list header | "Create Army" button | Navigates to `/wh40k10e/armies/new` |
| Forge empty state | "Create Army" CTA    | Navigates to `/wh40k10e/armies/new` |

Both use `CREATE_ARMY_HREF = '/wh40k10e/armies/new'` from `ArmyListView.web.tsx`.

---

## `CreateArmyForm` Props Contract

```typescript
interface CreateArmyFormProps {
    /** Current form field values. */
    values: CreateArmyFormValues;
    /** Per-field validation errors. Absent key = no error. */
    errors: CreateArmyFormErrors;
    /** Available faction options derived from FACTION_MAP. */
    factionOptions: FactionOption[];
    /** Available detachment options for the selected faction. [] when none. */
    detachmentOptions: DetachmentOption[];
    /** True while the save mutation is in flight. */
    saving: boolean;
    /** True when all required fields are valid. */
    isValid: boolean;
    /** Called on every field change. */
    onChange: (field: keyof CreateArmyFormValues, value: string | null) => void;
    /** Called when the user submits the form. */
    onSubmit: () => void;
    /** Called when the user cancels. */
    onCancel: () => void;
}
```

---

## Form Fields

### Army Name

| Property              | Value                                                                         |
| --------------------- | ----------------------------------------------------------------------------- |
| Type                  | Text input                                                                    |
| i18n label            | `armyCreation.form.name`                                                      |
| Required              | Yes                                                                           |
| Min length            | 3 (`MIN_NAME_LENGTH`)                                                         |
| Max length            | 60 (`MAX_NAME_LENGTH`)                                                        |
| Validation error keys | `armyCreation.validation.nameTooShort`, `armyCreation.validation.nameTooLong` |
| `aria-invalid`        | `"true"` when `errors.name` is set                                            |
| `aria-describedby`    | Points to error element ID when `errors.name` is set                          |

### Faction

| Property             | Value                                              |
| -------------------- | -------------------------------------------------- |
| Type                 | Select / combobox                                  |
| i18n label           | `armyCreation.form.faction`                        |
| Required             | Yes                                                |
| Options source       | `factionOptions` prop (derived from `FACTION_MAP`) |
| Placeholder          | `armyCreation.form.factionPlaceholder`             |
| Validation error key | `armyCreation.validation.factionRequired`          |
| Side effect          | Changing faction resets `detachmentId` to `null`   |

### Detachment

| Property             | Value                                                      |
| -------------------- | ---------------------------------------------------------- |
| Type                 | Select / combobox                                          |
| i18n label           | `armyCreation.form.detachment`                             |
| Required             | Only when `detachmentOptions.length > 0`                   |
| Options source       | `detachmentOptions` prop                                   |
| Disabled             | When `detachmentOptions.length === 0`                      |
| Placeholder          | `armyCreation.form.detachmentPlaceholder`                  |
| Validation error key | `armyCreation.validation.detachmentRequired`               |
| **Known gap**        | `detachmentOptions` is currently stubbed to `[]` (BLOCKER) |

### Battle Size

| Property             | Value                                                                    |
| -------------------- | ------------------------------------------------------------------------ |
| Type                 | Radio group or select                                                    |
| i18n label           | `armyCreation.form.battleSize`                                           |
| Required             | Yes                                                                      |
| Options              | `Incursion` (1000 pts), `StrikeForce` (2000 pts), `Onslaught` (3000 pts) |
| i18n option keys     | `armyCreation.battleSizes.incursion`, `.strikeForce`, `.onslaught`       |
| Validation error key | `armyCreation.validation.battleSizeRequired`                             |

---

## Form Actions

### Submit ("Create Army")

| Property      | Value                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------ |
| i18n label    | `armyCreation.actions.create`                                                                    |
| Disabled when | `!isValid \|\| saving`                                                                           |
| Loading label | `armyCreation.actions.creating`                                                                  |
| On success    | Invalidates `['armies']` query; navigates to `/{locale}/wh40k10e/armies/{armyId}`                |
| On failure    | Surfaces `role="alert"` error region with `armyCreation.error.saveFailed`; form values preserved |

### Cancel

| Property   | Value                                    |
| ---------- | ---------------------------------------- |
| i18n label | `armyCreation.actions.cancel`            |
| Behaviour  | Navigates to `/{locale}/wh40k10e/armies` |

---

## Validation Rules (Container)

Evaluated in `CreateArmyContainer.tsx` on every `onChange` and before submit.

| Field          | Rule                                         | Error key                                    |
| -------------- | -------------------------------------------- | -------------------------------------------- |
| `name`         | `name.trim().length >= MIN_NAME_LENGTH`      | `armyCreation.validation.nameTooShort`       |
| `name`         | `name.trim().length <= MAX_NAME_LENGTH`      | `armyCreation.validation.nameTooLong`        |
| `factionId`    | Non-null, non-empty string                   | `armyCreation.validation.factionRequired`    |
| `detachmentId` | Non-null when `detachmentOptions.length > 0` | `armyCreation.validation.detachmentRequired` |
| `battleSize`   | Non-null, one of `BattleSize` values         | `armyCreation.validation.battleSizeRequired` |

`isValid` is `true` only when all rules pass.

---

## Navigation Outcomes

| Trigger                 | Destination                             |
| ----------------------- | --------------------------------------- |
| Unauthenticated request | `/auth/login`                           |
| Missing owner ID claim  | `/auth/logout`                          |
| Successful save         | `/{locale}/wh40k10e/armies/{newArmyId}` |
| Cancel                  | `/{locale}/wh40k10e/armies`             |

---

## Accessibility Requirements

- All form controls have a visible `<label>` associated via `htmlFor` / `id`.
- Error messages are associated with their control via `aria-describedby`.
- `aria-invalid="true"` is set on controls with active errors.
- Save error region uses `role="alert"` so screen readers announce it immediately.
- Submit button communicates loading state via `aria-busy` or label change.
- Keyboard-only users can complete the full flow without a pointer device.

---

## i18n Keys Reference (`armyCreation` namespace)

| Key                                          | Usage                           |
| -------------------------------------------- | ------------------------------- |
| `armyCreation.title`                         | Page heading                    |
| `armyCreation.form.name`                     | Name field label                |
| `armyCreation.form.faction`                  | Faction field label             |
| `armyCreation.form.factionPlaceholder`       | Faction select placeholder      |
| `armyCreation.form.detachment`               | Detachment field label          |
| `armyCreation.form.detachmentPlaceholder`    | Detachment select placeholder   |
| `armyCreation.form.battleSize`               | Battle size field label         |
| `armyCreation.battleSizes.incursion`         | "Incursion (1,000 pts)"         |
| `armyCreation.battleSizes.strikeForce`       | "Strike Force (2,000 pts)"      |
| `armyCreation.battleSizes.onslaught`         | "Onslaught (3,000 pts)"         |
| `armyCreation.validation.nameTooShort`       | Inline name error               |
| `armyCreation.validation.nameTooLong`        | Inline name error               |
| `armyCreation.validation.factionRequired`    | Inline faction error            |
| `armyCreation.validation.detachmentRequired` | Inline detachment error         |
| `armyCreation.validation.battleSizeRequired` | Inline battle size error        |
| `armyCreation.actions.create`                | Submit button label             |
| `armyCreation.actions.creating`              | Submit button loading label     |
| `armyCreation.actions.cancel`                | Cancel button label             |
| `armyCreation.error.saveFailed`              | Save error alert text           |
| `armyCreation.success`                       | (reserved for toast on success) |
