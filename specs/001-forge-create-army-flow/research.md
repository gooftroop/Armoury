# Research Notes: Forge Create Army Flow

**Feature ID**: 001-forge-create-army-flow

---

## Design References Consulted

| Document                                  | Lines        | Topic                                                                                         |
| ----------------------------------------- | ------------ | --------------------------------------------------------------------------------------------- |
| `docs/design/FLOWS.md`                    | 70–95        | Journey 2: Forge → Add/Create Army → faction selection → creation page → Create → army detail |
| `docs/design/INFORMATION_ARCHITECTURE.md` | 24–31, 62–67 | Canonical route `/wh40k10e/armies/new`                                                        |
| `docs/design/REQUIREMENTS.md`             | 120–142      | ARM-003, ARM-006, ARM-020 through ARM-027                                                     |
| `docs/design/DECISIONS.md`                | 195–215      | DD-007: desktop header action + mobile FAB; empty-state CTA complementary                     |
| `mockups/04-army-creation.html`           | 21–35        | Creation form layout and preview block                                                        |

---

## Key Design Decisions

### DD-1: Faction-first selection on canonical route

**Decision**: Use the canonical `/wh40k10e/armies/new` route with an inline form. A modal is not required as long as the route/form UX preserves the documented contract.

**Rationale**: The IA document defines `/wh40k10e/armies/new` as the canonical creation route. A modal would require additional state management and complicates deep-linking.

---

### DD-2: Detachment source

**Decision**: Detachment options must come from the `wh40k10e` plugin's `FACTION_MAP[factionId]?.detachments`, not from hard-coded UI lists.

**Current state**: `CreateArmyContainer.tsx` stubs `detachmentOptions` to `[]` because the per-faction `FactionData` getter was not wired at implementation time. This is a **BLOCKER** defect tracked in the audit.

**Impact**: The form currently treats detachment as "not applicable" for all factions (the validation rule only requires detachment when `detachmentOptions.length > 0`). Users can create armies without a detachment.

---

### DD-3: Battle size presets only

**Decision**: Use the three canonical `BattleSize` presets (Incursion, StrikeForce, Onslaught). No custom points input in this increment.

**Rationale**: Custom points would require schema changes and additional validation logic. The three presets cover all standard WH40K 10e game sizes.

---

### DD-4: Persistence via DataContext/DAO

**Decision**: Save via the existing `dataContext.armies.save` path. No new HTTP API endpoint.

**Rationale**: The local DataContext/DAO architecture already handles army persistence. Introducing a new endpoint would duplicate the persistence layer and require backend changes outside this feature's scope.

---

### DD-5: Auth owner source

**Decision**: Use the same authenticated `userId` source already used by the Forge list page (`INTERNAL_ID_CLAIM` from the Auth0 session).

**Current state**: The `INTERNAL_ID_CLAIM` reference in `armies/new/page.tsx` may be stale after the `auth0-migration-fixes` branch switched to using `sub`. This is a **BLOCKER** defect.

---

## Audit Findings (from R1 deep audit)

The following defects were identified by the oracle audit agent. They are documented here for traceability.

### BLOCKER defects

| ID  | Location                          | Description                                                                                                     |
| --- | --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| B-1 | `CreateArmyContainer.tsx:161-166` | `detachmentOptions` hard-coded to `[]` instead of deriving from `FACTION_MAP[factionId]?.detachments`           |
| B-2 | `armies/new/page.tsx:20,41`       | References `INTERNAL_ID_CLAIM` which was removed in `auth0-migration-fixes`; will break at runtime after rebase |

### MAJOR defects

| ID  | Location                         | Description                                                                        |
| --- | -------------------------------- | ---------------------------------------------------------------------------------- |
| M-1 | `CreateArmyForm.web.tsx:152-278` | No UI preview of the detachment/faction summary before submit                      |
| M-2 | `CreateArmyContainer.tsx:184`    | `dataContext.armies.save(army as never)` — unsafe cast; should use typed `ArmyDAO` |
| M-3 | `ArmyListView.test.tsx:1`        | `@ts-nocheck` blanket suppression; remove and fix any resulting errors             |

### MINOR defects

| ID  | Location                      | Description                                                             |
| --- | ----------------------------- | ----------------------------------------------------------------------- |
| m-1 | `loading.tsx:7-10`            | Empty pulsing div — add skeleton text or icon                           |
| m-2 | `CreateArmyContainer.tsx:213` | `values.battleSize as BattleSize` — guard with `isBattleSize` or assert |

### Cross-task contamination

| Commit    | Severity | Files                                                          | Action                                  |
| --------- | -------- | -------------------------------------------------------------- | --------------------------------------- |
| `a291c3b` | BLOCKER  | `package-lock.json`, `pglite/package.json`, `dao/package.json` | Verify deps still needed; revert if not |
| `da73953` | MAJOR    | `AccountSettingsContainer`, `LandingContent`, `providers.tsx`  | Port to separate branch or revert       |
| `c86af60` | MAJOR    | Same as `da73953`                                              | Consolidate with `da73953`              |

---

## Alternatives Considered

### Faction modal vs inline form

**Considered**: Show a faction-selection modal before navigating to the creation page.

**Rejected**: The IA document defines a dedicated route. A modal adds complexity without improving the documented UX contract.

### Detachment as optional always

**Considered**: Make detachment always optional regardless of faction.

**Rejected**: The UI contract specifies detachment is required when options exist. Skipping it would produce armies with no detachment even when the faction has detachments defined.

### Custom points input

**Considered**: Allow users to enter an arbitrary points limit.

**Rejected**: Explicitly out of scope per the master plan guardrails. The three battle size presets cover all standard game sizes.
