# Developer Quickstart: Forge Create Army Flow

**Feature ID**: 001-forge-create-army-flow

---

## Overview

This feature adds the "Create Army" flow to the Forge section of the WH40K 10e web app. A user navigates to `/wh40k10e/armies/new`, fills in a name, faction, detachment, and battle size, and saves a new `Army` record via the existing DataContext/DAO path.

---

## Key Files

| File                                                              | Role                                                           |
| ----------------------------------------------------------------- | -------------------------------------------------------------- |
| `src/web/app/[locale]/wh40k10e/armies/new/page.tsx`               | Next.js Server Component — auth check, renders container       |
| `src/web/app/[locale]/wh40k10e/armies/new/loading.tsx`            | Loading skeleton                                               |
| `src/web/src/components/CreateArmyContainer.tsx`                  | Client orchestrator — form state, validation, save, navigation |
| `src/shared/features/forge/src/components/CreateArmyForm.web.tsx` | Pure form component                                            |
| `src/shared/features/forge/src/components/ArmyListView.web.tsx`   | Forge list — entry points to create flow                       |
| `src/shared/features/forge/src/utils/createArmyHelpers.ts`        | `buildNewArmy`, `getPointsLimitForBattleSize`                  |
| `src/systems/wh40k10e/src/models/ArmyModel.ts`                    | `Army` interface, `BattleSize` type                            |
| `src/systems/wh40k10e/src/models/FactionData.ts`                  | `FactionData` interface, `FACTION_MAP`                         |
| `src/shared/i18n/messages/en.json`                                | `armyCreation` namespace (lines 127–157)                       |

---

## Running Locally

```bash
# From repo root
npm run dev --workspace @armoury/web
```

Navigate to `http://localhost:3000/en/wh40k10e/armies/new` (requires an active Auth0 session).

---

## Running Tests

```bash
# Helper unit tests
npm run test --workspace @armoury/feature-forge

# Web component/container tests (currently partial — see Known Gaps)
npm run test --workspace @armoury/web

# Type check
npm run typecheck --workspace @armoury/web

# E2E (requires running dev server)
npm run e2e --workspace @armoury/web -- forge-army-list.spec.ts
```

---

## Data Flow

```
User fills form
    │
    ▼
CreateArmyContainer (onChange)
    │  validates fields → sets errors, isValid
    ▼
User submits
    │
    ▼
CreateArmyContainer (onSubmit)
    │  buildNewArmy(draft) → Army
    │  dataContext.armies.save(army)
    │
    ├─ success → invalidate ['armies'] → navigate /{locale}/wh40k10e/armies/{id}
    └─ failure → set saveError → render role="alert"
```

---

## Adding a New Faction

Factions are sourced from `FACTION_MAP` in `@armoury/wh40k10e`. To add a faction:

1. Add a new `FactionData` entry to `FACTION_MAP` in `src/systems/wh40k10e/src/data/factionMap.ts`.
2. The faction will automatically appear in the Faction select on the create form.
3. Detachments defined in `FactionData.detachments` will populate the Detachment select once the B-1 blocker is resolved (see Known Gaps).

---

## Known Gaps

These defects must be resolved before the feature is considered complete. See `research.md` for full audit details.

### BLOCKER: Detachment options not wired (B-1)

**File**: `src/web/src/components/CreateArmyContainer.tsx:161-166`

**Problem**: `detachmentOptions` is hard-coded to `[]`. Users cannot select a detachment.

**Fix**: Replace the stub with:

```typescript
const detachmentOptions: DetachmentOption[] =
    values.factionId != null
        ? (FACTION_MAP[values.factionId]?.detachments ?? []).map((d) => ({
              id: d.id,
              name: d.name,
          }))
        : [];
```

---

### BLOCKER: Stale `INTERNAL_ID_CLAIM` reference (B-2)

**File**: `src/web/app/[locale]/wh40k10e/armies/new/page.tsx:20,41`

**Problem**: References `INTERNAL_ID_CLAIM` which was removed in the `auth0-migration-fixes` branch. Will throw at runtime after rebase.

**Fix**: Replace with the `sub` claim or the updated claim constant from `auth0-migration-fixes`.

---

### MAJOR: No preview block before submit (M-1)

**File**: `src/shared/features/forge/src/components/CreateArmyForm.web.tsx`

**Problem**: The mockup specifies a summary block showing the selected faction/detachment before the submit button. It is absent.

**Fix**: Add a read-only summary section below the form fields and above the action buttons.

---

### MAJOR: Unsafe `as never` cast (M-2)

**File**: `src/web/src/components/CreateArmyContainer.tsx:184`

**Problem**: `dataContext.armies.save(army as never)` bypasses type safety.

**Fix**: Align the `save` method signature with the `Army` type or use a typed `ArmyDAO` wrapper.

---

### MAJOR: `@ts-nocheck` in list view test (M-3)

**File**: `src/shared/features/forge/src/components/__tests__/web/ArmyListView.test.tsx:1`

**Problem**: Blanket `@ts-nocheck` suppresses all type errors in the test file.

**Fix**: Remove the directive and resolve any resulting TypeScript errors.

---

## Spec Artifacts

| Artifact            | Path                                                                |
| ------------------- | ------------------------------------------------------------------- |
| Feature spec        | `specs/001-forge-create-army-flow/spec.md`                          |
| Implementation plan | `specs/001-forge-create-army-flow/plan.md`                          |
| Task list           | `specs/001-forge-create-army-flow/tasks.md`                         |
| Research notes      | `specs/001-forge-create-army-flow/research.md`                      |
| Data model          | `specs/001-forge-create-army-flow/data-model.md`                    |
| UI contract         | `specs/001-forge-create-army-flow/contracts/ui-create-army-flow.md` |
| Quickstart          | `specs/001-forge-create-army-flow/quickstart.md` _(this file)_      |
