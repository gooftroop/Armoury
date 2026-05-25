# Task List: Forge Create Army Flow

**Feature ID**: 001-forge-create-army-flow

Each task maps to one or more implementation files. Status reflects the state at the time of the R4 remediation pass.

---

## T1 — Forge create entrypoints and empty-state CTA

**Status**: DONE
**Wave**: 1 (parallel with T2, T3)

### Implementation files

| File                                                            | Change                                                                                                    |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `src/shared/features/forge/src/components/ArmyListView.web.tsx` | Added `CREATE_ARMY_HREF = '/wh40k10e/armies/new'` constant; wired header button and empty-state CTA to it |

### Acceptance criteria

- [x] Forge create action navigates to `/wh40k10e/armies/new`.
- [x] Empty Forge state includes accessible "Create Army" CTA.
- [x] Existing Forge card list, filters, duplicate, deploy, and delete behavior remains unchanged.

---

## T2 — Create army form pure components and validation

**Status**: PARTIAL (preview block absent)
**Wave**: 1 (parallel with T1, T3)

### Implementation files

| File                                                              | Change                                                                            |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `src/shared/features/forge/src/components/CreateArmyForm.web.tsx` | New pure form component with Army Name, Faction, Detachment, Battle Size controls |

### Acceptance criteria

- [x] Pure components expose typed props and no data fetching.
- [x] Submit is disabled while invalid or saving.
- [x] Inline errors are associated with fields via `aria-describedby` / `aria-invalid`.
- [ ] Preview block shows selected faction/detachment summary before submit. _(ABSENT — MAJOR)_

---

## T3 — Creation data helpers and Army construction

**Status**: DONE
**Wave**: 1 (parallel with T1, T2)

### Implementation files

| File                                                                      | Change                                                           |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `src/shared/features/forge/src/utils/createArmyHelpers.ts`                | `getPointsLimitForBattleSize`, `buildNewArmy`, `CreateArmyDraft` |
| `src/shared/features/forge/src/utils/__tests__/createArmyHelpers.test.ts` | Unit tests for both helpers                                      |

### Acceptance criteria

- [x] Helper returns points limits 1000 / 2000 / 3000 for Incursion / StrikeForce / Onslaught.
- [x] Helper constructs an `Army` with valid defaults and ISO timestamps.
- [x] Tests cover every battle size and required default field.

---

## T4 — `/armies/new` route/container integration

**Status**: PARTIAL (detachment stub, unsafe cast, stale auth claim)
**Wave**: 2 (depends: T2, T3)

### Implementation files

| File                                                   | Change                                                                                  |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `src/web/app/[locale]/wh40k10e/armies/new/page.tsx`    | Server Component: Auth0 session resolution, locale setup, renders `CreateArmyContainer` |
| `src/web/app/[locale]/wh40k10e/armies/new/loading.tsx` | Loading skeleton for the route                                                          |
| `src/web/src/components/CreateArmyContainer.tsx`       | Client orchestrator: form state, validation, save mutation, navigation                  |

### Acceptance criteria

- [x] Unauthenticated users are redirected to `/auth/login`.
- [x] Missing internal ID claim redirects to `/auth/logout`.
- [x] Faction options sourced from `FACTION_MAP` via `getAllFactionIds()`.
- [x] Save via `dataContext.armies.save`; success invalidates `['armies']` query.
- [x] Success navigates to `/{locale}/wh40k10e/armies/{armyId}`.
- [x] Cancel navigates to `/{locale}/wh40k10e/armies`.
- [x] Save failure surfaces localized `role="alert"` error; form values preserved.
- [ ] Detachment options wired to `FACTION_MAP[factionId]?.detachments`. _(ABSENT — BLOCKER)_
- [ ] `dataContext.armies.save` uses typed `ArmyDAO` instead of `as never` cast. _(MAJOR)_
- [ ] `INTERNAL_ID_CLAIM` reference updated after `auth0-migration-fixes` rebase. _(BLOCKER)_

---

## T5 — Component/container tests

**Status**: PARTIAL (form and container tests absent)
**Wave**: 2 (depends: T1–T4)

### Implementation files

| File                                                                           | Change                                      |
| ------------------------------------------------------------------------------ | ------------------------------------------- |
| `src/shared/features/forge/src/utils/__tests__/createArmyHelpers.test.ts`      | Helper unit tests (complete)                |
| `src/shared/features/forge/src/components/__tests__/web/ArmyListView.test.tsx` | List view tests (has `@ts-nocheck` — MAJOR) |

### Acceptance criteria

- [x] Helper tests cover all battle sizes and default fields.
- [ ] `CreateArmyForm.web.tsx` has Vitest component tests. _(ABSENT)_
- [ ] `CreateArmyContainer.tsx` has Vitest component tests. _(ABSENT)_
- [ ] `@ts-nocheck` removed from `ArmyListView.test.tsx`. _(MAJOR)_

---

## T6 — Playwright E2E and page object updates

**Status**: DONE (authored in R3)
**Wave**: 2 (depends: T1, T4)

### Implementation files

| File                                        | Change                                     |
| ------------------------------------------- | ------------------------------------------ |
| `src/web/e2e/tests/forge-army-list.spec.ts` | Added `describe('Create army flow')` block |

### Acceptance criteria

- [x] Playwright covers canonical create navigation.
- [x] Playwright covers invalid form state.
- [x] Playwright covers successful create and return-to-list visibility.

---

## T7 — Accessibility, responsive, and localization polish

**Status**: DONE
**Wave**: 3 (depends: T1–T6)

### Implementation files

| File                                                              | Change                                                           |
| ----------------------------------------------------------------- | ---------------------------------------------------------------- |
| `src/shared/features/forge/src/components/CreateArmyForm.web.tsx` | `aria-describedby`, `aria-invalid`, `role="alert"` on save error |
| `src/shared/features/forge/src/components/ArmyListView.web.tsx`   | Accessible empty-state CTA                                       |

### Acceptance criteria

- [x] Keyboard-only user can complete flow.
- [x] Error messages are programmatically associated with fields.
- [x] Mobile viewport exposes primary create action.
- [x] No hard-coded user-visible text in new UI.

---

## T8 — Documentation/artifact sync check

**Status**: DONE (authored here)
**Wave**: 3 (depends: T1–T7)

### Implementation files

| File                                                                | Change                              |
| ------------------------------------------------------------------- | ----------------------------------- |
| `specs/001-forge-create-army-flow/spec.md`                          | Feature specification               |
| `specs/001-forge-create-army-flow/plan.md`                          | Implementation plan                 |
| `specs/001-forge-create-army-flow/tasks.md`                         | This file                           |
| `specs/001-forge-create-army-flow/research.md`                      | Research notes and design decisions |
| `specs/001-forge-create-army-flow/data-model.md`                    | Data model reference                |
| `specs/001-forge-create-army-flow/contracts/ui-create-army-flow.md` | UI contract                         |
| `specs/001-forge-create-army-flow/quickstart.md`                    | Developer quickstart                |

### Acceptance criteria

- [x] All 7 Speckit artifacts created.
- [x] Known gaps documented in `research.md`.
- [x] Artifacts reflect actual implementation, not aspirational state.
