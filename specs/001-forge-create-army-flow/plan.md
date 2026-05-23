# Implementation Plan: Forge Create Army Flow

**Feature ID**: 001-forge-create-army-flow
**Branch**: `001-forge-create-army-flow`
**Estimated Effort**: Medium
**Parallel Execution**: YES — 3 waves + FINAL

---

## Summary

Implement the missing Forge create army flow: fix Forge entrypoints, add `/wh40k10e/armies/new`, save a minimal valid WH40K `Army` through the existing DataContext/DAO path, and redirect to the new army detail route.

---

## Phases

### Wave 1 — Foundation (parallel)

All three tasks are independent and can run simultaneously.

| Task | Description                                   | Category           | Status      |
| ---- | --------------------------------------------- | ------------------ | ----------- |
| T1   | Forge create entrypoints + empty-state CTA    | visual-engineering | **DONE**    |
| T2   | Create army form pure components + validation | visual-engineering | **PARTIAL** |
| T3   | Creation data helpers and Army construction   | quick              | **DONE**    |

### Wave 2 — Integration (after Wave 1)

| Task | Description                               | Category           | Status                    |
| ---- | ----------------------------------------- | ------------------ | ------------------------- |
| T4   | `/armies/new` route/container integration | visual-engineering | **PARTIAL**               |
| T5   | Component/container tests                 | quick              | **PARTIAL**               |
| T6   | Playwright E2E and page object updates    | unspecified-high   | **DONE** (authored in R3) |

### Wave 3 — Polish (after Wave 2)

| Task | Description                                            | Category           | Status                   |
| ---- | ------------------------------------------------------ | ------------------ | ------------------------ |
| T7   | Accessibility/responsive polish and localization audit | visual-engineering | **DONE**                 |
| T8   | Documentation/artifact sync check                      | writing            | **DONE** (authored here) |

### Wave FINAL — Verification

| Task | Description              | Category         | Status |
| ---- | ------------------------ | ---------------- | ------ |
| F1   | Plan compliance audit    | oracle           | ABSENT |
| F2   | Code quality review      | unspecified-high | ABSENT |
| F3   | Real manual QA execution | unspecified-high | ABSENT |
| F4   | Scope fidelity check     | deep             | ABSENT |

---

## Task Detail

### T1 — Forge create entrypoints and empty-state CTA

**Status**: DONE

**What was done**:

- Fixed `ArmyListView.web.tsx` to use the canonical `CREATE_ARMY_HREF = '/wh40k10e/armies/new'` constant.
- Added an `EmptyState` component with a "Create Army" CTA when `isEmpty` is true.
- Preserved all existing card list, filter, duplicate, deploy, and delete behavior.

**Key files**:

- `src/shared/features/forge/src/components/ArmyListView.web.tsx`

**Blocks**: T5, T6, T7

---

### T2 — Create army form pure components and validation

**Status**: PARTIAL

**What was done**:

- `CreateArmyForm.web.tsx` renders Army Name, Faction, Detachment, and Battle Size controls.
- All strings use the `armyCreation` i18n namespace.
- Inline errors are associated via `aria-describedby` / `aria-invalid`.
- Submit is disabled when `isValid` is false or `saving` is true.

**Known gap**: No UI preview block showing the selected faction/detachment summary before submit (audit finding: MAJOR).

**Key files**:

- `src/shared/features/forge/src/components/CreateArmyForm.web.tsx`

**Blocks**: T4, T5, T7

---

### T3 — Creation data helpers and Army construction

**Status**: DONE

**What was done**:

- `createArmyHelpers.ts` exports `getPointsLimitForBattleSize` and `buildNewArmy`.
- Points limits: Incursion → 1000, StrikeForce → 2000, Onslaught → 3000.
- `buildNewArmy` constructs a minimal valid `Army` with canonical defaults (empty units, zero points, ISO timestamps, UUID).

**Key files**:

- `src/shared/features/forge/src/utils/createArmyHelpers.ts`
- `src/shared/features/forge/src/utils/__tests__/createArmyHelpers.test.ts`

**Blocks**: T4, T5

---

### T4 — `/armies/new` route/container integration

**Status**: PARTIAL

**What was done**:

- `src/web/app/[locale]/wh40k10e/armies/new/page.tsx` — Server Component that resolves Auth0 session and renders `CreateArmyContainer`.
- `src/web/src/components/CreateArmyContainer.tsx` — orchestrator holding form state, validation, save mutation, and navigation.
- Faction options sourced from `FACTION_MAP` via `getAllFactionIds()`.
- Save via `dataContext.armies.save`; on success, invalidates `['armies']` query and routes to `/{locale}/wh40k10e/armies/{armyId}`.
- Cancel routes to `/{locale}/wh40k10e/armies`.

**Known gaps**:

- `detachmentOptions` is stubbed to `[]` (audit finding: BLOCKER). Wiring to `FACTION_MAP[factionId]?.detachments` is deferred.
- `dataContext.armies.save(army as never)` uses an unsafe cast (audit finding: MAJOR).
- Route page references `INTERNAL_ID_CLAIM` which may be stale after `auth0-migration-fixes` rebase (audit finding: BLOCKER).

**Key files**:

- `src/web/app/[locale]/wh40k10e/armies/new/page.tsx`
- `src/web/app/[locale]/wh40k10e/armies/new/loading.tsx`
- `src/web/src/components/CreateArmyContainer.tsx`

**Blocks**: T5, T6, T7

---

### T5 — Component/container tests

**Status**: PARTIAL

**What was done**:

- `createArmyHelpers.test.ts` covers helper unit tests.
- Existing `ArmyListView.test.tsx` covers the list view (note: has `@ts-nocheck` — audit finding: MAJOR).

**Known gap**: No Vitest tests for `CreateArmyForm.web.tsx` or `CreateArmyContainer.tsx`.

**Key files**:

- `src/shared/features/forge/src/utils/__tests__/createArmyHelpers.test.ts`
- `src/shared/features/forge/src/components/__tests__/web/ArmyListView.test.tsx`

**Blocks**: T7, final verification

---

### T6 — Playwright E2E and page object updates

**Status**: DONE (authored in R3)

**What was done**:

- Extended `src/web/e2e/tests/forge-army-list.spec.ts` with a `describe('Create army flow')` block.
- Covers: canonical create navigation, invalid form state, successful create and return-to-list visibility.

**Key files**:

- `src/web/e2e/tests/forge-army-list.spec.ts`

**Blocks**: T7, final verification

---

### T7 — Accessibility, responsive, and localization polish

**Status**: DONE

**What was done**:

- All form controls have visible labels and `aria-describedby` error associations.
- Save error region uses `role="alert"`.
- All user-facing strings use the `armyCreation` i18n namespace.
- Mobile viewport exposes the primary create action via the header button.

**Key files**:

- `src/shared/features/forge/src/components/CreateArmyForm.web.tsx`
- `src/shared/features/forge/src/components/ArmyListView.web.tsx`

**Blocks**: T8, final verification

---

### T8 — Documentation/artifact sync check

**Status**: DONE (authored here)

**What was done**:

- Created all 7 Speckit artifacts under `specs/001-forge-create-army-flow/`.
- Documented known gaps (detachment stub, unsafe cast, stale auth claim) in `research.md`.

---

## Dependency Matrix

```
T1 ──────────────────────────────────────────► T5, T6, T7
T2 ──────────────────────────────────────────► T4, T5, T7
T3 ──────────────────────────────────────────► T4, T5
T4 (depends: T2, T3) ────────────────────────► T5, T6, T7
T5 (depends: T1–T4) ─────────────────────────► T7, FINAL
T6 (depends: T1, T4) ────────────────────────► T7, FINAL
T7 (depends: T1–T6) ─────────────────────────► T8, FINAL
T8 (depends: T1–T7) ─────────────────────────► FINAL
```

---

## Definition of Done

- [ ] `npm --workspace @armoury/feature-forge run test` passes.
- [ ] `npm --workspace @armoury/web run test` passes.
- [ ] `npm --workspace @armoury/web run typecheck` passes.
- [ ] `npm --workspace @armoury/web run e2e -- forge-army-list.spec.ts` passes.
- [ ] Evidence files exist under `.sisyphus/evidence/` for every task QA scenario.
- [ ] Detachment stub resolved (BLOCKER from audit).
- [ ] Stale `INTERNAL_ID_CLAIM` reference resolved (BLOCKER from audit).
- [ ] `@ts-nocheck` removed from `ArmyListView.test.tsx` (MAJOR from audit).
