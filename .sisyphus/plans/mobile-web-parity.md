# Mobile/Web Parity Plan

## Shared-Code Migration Outcomes (updated 2026-05-03)

The `shared-code-migration` plan ran before this plan's execution and extracted several
cross-platform concerns into dedicated shared workspaces. The items below are **pre-resolved**
and do not need to be implemented as part of this plan.

### New workspaces created by shared-code-migration

| Workspace | Package | Resolved parity item |
|---|---|---|
| `src/shared/query` | `@armoury/query` | Query infrastructure (TanStack Query singleton, provider) |
| `src/shared/i18n` | `@armoury/i18n` | i18n catalog and message types (web runtime only) |
| `src/shared/clients/auth` | `@armoury/auth-client` | Auth0 SPA client (web runtime only) |
| `src/shared/features/profile` | `@armoury/feature-profile` | Profile components and hooks |
| `src/shared/features/forge` | `@armoury/feature-forge` | Forge components and hooks |
| `src/shared/features/game-system` | `@armoury/feature-game-system` | Game-system components and hooks |
| `src/shared/ui` (updated) | `@armoury/ui` | EmptyState, ConfirmDialog primitives added |

### Deferred items (mobile runtime not yet wired)

- **Mobile auth runtime**: `@armoury/auth-client` ships the Auth0 SPA client for web. The
  mobile auth runtime (react-native-auth0 wiring) remains deferred to this plan (T4).
- **Mobile i18n runtime**: `@armoury/i18n` ships the shared catalog and message types. The
  mobile runtime wiring (expo-localization + IntlProvider) remains deferred to this plan (T2, T7, T24).

### Hard cutover note

The shared-code-migration used a hard cutover with no re-export shims. Consumers in
`src/web` and `src/mobile` were updated in the same commits as the moves.

---

## TL;DR

> **Quick Summary**: Bring the Expo mobile app to full feature + architectural parity with the Next.js web app, including porting the PR 45 `DataContextManager` rewrite to mobile (with SQLite + AppState lifecycle handling), adding i18n, building a Tamagui UI primitive kit, completing all placeholder screens, and adding native enhancements (haptics, gestures, push, deep links, share sheets).
>
> **Deliverables**:
> - `MobileDataContextManager` singleton owning a single `SQLiteAdapter` for the app lifetime, mirroring PR 45 architecture
> - i18n parity (expo-localization + shared message catalog with web)
> - Tamagui UI primitive kit mirroring 16 web Radix primitives
> - Real screens for `matches`, `references`, `campaigns`, `social` (currently placeholders)
> - Account settings parity including DangerZone (account deletion)
> - Landing decomposition matching web (UnauthenticatedLanding/AuthenticatedLanding/SilentAuthCheck)
> - Navigation kit (SideNav for tablet, BottomNav verification)
> - System components parity (SystemAccessGate, SystemAutoRestore, SystemGridContainer, SystemGridView, SystemsSection)
> - `useGameSystem` hook + `auth0`/`auth0SpaClient`/`getQueryClient`/`utils` lib parity
> - Native enhancements: haptics, gestures, push notifications, deep links, share sheets
> - Vitest unit tests + Maestro E2E flow coverage for every new surface
>
> **Estimated Effort**: XL
> **Parallel Execution**: YES — 6 waves, 5–8 tasks per wave
> **Critical Path**: T1 (shared interfaces) → T6 (`MobileDataContextManager`) → T11 (provider/bridge) → T17 (placeholder tab rewrites) → T28 (native enhancements) → F1–F4 → user okay

---

## Context

### Original Request
> "Including PR 45, I need you to evaluate the current state of the mobile app and the web app and then create a plan for achieving full parity in mobile."
> "I need mobile to be in lock-step and have full parity with the web app. Right now it is not."

### Branch Strategy & Prerequisites (CRITICAL — read before T1)

**PR 45 lives on the unmerged branch `feat/datacontext-manager-rewrite`.** The canonical web reference files for this plan (`DataContextManager.ts`, `managerBridge.ts`, `managerContext.tsx`, `managerState.ts`, `useDataContext.ts`, the `ownsAdapter()` API on `DataContextBuilder.ts`, and the providers-cutover state of `src/web/src/providers/`) **DO NOT exist on `main`**. They exist only on `feat/datacontext-manager-rewrite`.

**Required prerequisite for execution:**
- Create the parity feature branch off `feat/datacontext-manager-rewrite` (NOT off `main`):
  `git checkout feat/datacontext-manager-rewrite && git checkout -b feat/mobile-web-parity`
- All "References" sections below that cite `src/web/src/data/*` or `ownsAdapter()` are valid against `feat/datacontext-manager-rewrite` HEAD.
- If PR 45 merges to `main` before this plan starts, rebase `feat/mobile-web-parity` onto `main` and proceed unchanged.
- If PR 45 is significantly revised before merge, T1/T6/T11/T12/T23 references must be re-validated against the final merged state.

**Verification before starting Wave 1:**
```
git rev-parse --verify feat/datacontext-manager-rewrite       # must succeed
git show feat/datacontext-manager-rewrite:src/web/src/data/DataContextManager.ts | head -5
git show feat/datacontext-manager-rewrite:src/shared/data/context/src/DataContextBuilder.ts | grep "ownsAdapter"
```
All three must succeed. If any fail, STOP and re-validate references before proceeding.

### Maestro/E2E Path Convention

The mobile E2E setup lives at `src/mobile/e2e/flows/*.yaml` with the runner at `src/mobile/e2e/scripts/run-all.sh`. **All references in this plan to "Maestro flows" mean files under `src/mobile/e2e/flows/`.** Existing flows: `army-creation.yaml`, `army-delete.yaml`, `army-list.yaml`, `data-sync.yaml`, plus `common/`. New flows added by this plan land in the same directory and are picked up by `run-all.sh` automatically.

### Interview Summary
**Key Discussions**:
- **PR 45 inclusion**: Apply PR 45 architecture to mobile in the same plan, not as a follow-up.
- **Parity definition**: Feature + architectural parity (lock-step), not just visual parity.
- **Backend strategy**: Mobile consumes the same Next.js API routes; recreate middleware logic client-side where applicable.
- **i18n**: Infrastructure parity with web — same wiring, same catalog format, mobile uses expo-localization. Mobile ships with whatever locales the web ships (currently `en` only); when web adds locales, the mobile catalog port (T7) auto-mirrors them. **Single-locale (`en`) parity is the explicit current scope.**
- **Native scope**: All native enhancements in scope (haptics, gestures, push, deep links, share sheets).
- **Test discipline**: TDD with Vitest + Maestro; agent QA via Maestro CLI + tmux + curl.

**Research Findings**:
- PR 45 (OPEN): rewrites web data layer around `DataContextManager` (558 LOC) + single `PGliteAdapter` ownership; eliminates duplicate-adapter race during 40K sync; mobile changes in PR 45 are minor (smoke test + type fixes only).
- Web has 30+ routes (locale-nested with per-route error/loading), mobile has 9 (4 placeholder tabs).
- Web has 16 Radix UI primitives + landing/navigation component kits; mobile has none.
- Mobile data layer is still on legacy `DataContextProvider` + `SyncQueueProvider`.
- Mobile has `AuthProvider` but no `auth0`/`auth0SpaClient` lib equivalents.
- i18n is entirely missing on mobile (hardcoded English).
- Existing mobile test infra: Vitest + Maestro (.yaml flows for login, army-list, etc.).

### Metis Review
**Identified Gaps** (addressed):
- **Phasing**: Metis flagged this as too large for single-wave execution → broken into 6 waves with shippable increments.
- **Mobile lifecycle**: PR 45 doesn't address AppState/background/foreground transitions → explicitly handled in `MobileDataContextManager` (T6).
- **SQLite ownership**: PR 45 owns PGlite; mobile must own `SQLiteAdapter` analogously → `ownsAdapter` flag in builder honored on mobile (T1, T6).
- **Backend coupling**: Mobile pointing at web API routes creates implicit coupling → documented as accepted constraint (Must Have section).
- **i18n delivery format**: Next.js uses `next-intl`; RN has no SSR → use formatjs/`react-intl` with shared catalog files (T7).
- **Push notification scope**: Could become a rabbit hole → constrained to "sync complete" + "presence change" only (T28).
- **Account deletion**: Web has DangerZone; mobile lacks parity → explicitly added (T22).
- **Maestro coverage**: Need flows per new screen → enforced via QA scenarios on each screen task.

---

## Work Objectives

### Core Objective
Bring `src/mobile` to **mobile-first catch-up parity** with `src/web` — i.e. every web route, component family, and architectural pattern that EXISTS on web today must have a real, functional mobile counterpart, AND the four web routes that are themselves placeholders today (`matches`, `references`, `campaigns`, `social`) get a real, canonical mobile implementation that a follow-up plan (`mobile-web-parity-web-followup`) will mirror back to web. Adopt the PR 45 `DataContextManager` pattern with mobile-specific lifecycle handling, while preserving Expo Router conventions and native UX affordances.

> **Parity scope clarification (resolves the apparent contradiction in T17–T20):**
> "Lock-step parity" in this plan means **mobile is never behind web on any feature web actually ships**. It does NOT mean "mobile must wait for web." Where web is itself a placeholder (verified at planning time: matches/references/campaigns/social `page.tsx` are stubs), mobile ships the canonical UX first and the follow-up plan reconciles web. This is intentional and explicitly in-scope; modifying those four web placeholder pages is explicitly OUT-of-scope for THIS plan to keep blast radius bounded and the PR reviewable.

### Concrete Deliverables
- `src/mobile/src/data/MobileDataContextManager.ts` — singleton class, single SQLiteAdapter ownership, RxJS observables, AppState-aware
- `src/mobile/src/data/{managerBridge.ts,managerContext.tsx,managerState.ts,useDataContext.ts}` — React bridge mirroring web PR 45
- `src/mobile/src/providers/DataContextManagerProvider.tsx` — replaces `DataContextProvider` + `SyncQueueProvider`
- `src/mobile/src/i18n/{config.ts,messages/}` — expo-localization wiring + locale catalogs (mirroring `src/web/src/i18n/`)
- `src/mobile/src/components/ui/` — Tamagui primitives matching web Radix kit
- `src/mobile/src/components/landing/` — UnauthenticatedLanding, AuthenticatedLanding, SilentAuthCheck, LandingContent, LandingSkeleton
- `src/mobile/src/components/navigation/` — SideNav, SideNavUserTile (BottomNav handled by Expo tabs)
- `src/mobile/src/components/system/` — SystemAccessGate, SystemAutoRestore, SystemGridContainer, SystemGridView, SystemsSection, SystemTile, ProgressBar
- `src/mobile/src/components/account/` — DangerZoneSection, ProfileSection (parity with web)
- Real screens for `matches`, `references`, `campaigns`, `social` tabs
- `src/mobile/src/hooks/useGameSystem.ts`
- `src/mobile/src/lib/{auth0.ts,auth0SpaClient.ts,getQueryClient.ts,queryClient.ts,utils.ts}`
- Native enhancement modules (haptics utility, gesture wrappers, push registration, deep link config, share sheet wrappers)
- Maestro flows per new screen
- Vitest unit tests for every new module/hook/component

### Definition of Done
- [ ] `npm run typecheck --workspace=@armoury/mobile` → 0 errors
- [ ] `npm run lint --workspace=@armoury/mobile` → 0 errors
- [ ] `npm run test --workspace=@armoury/mobile` → all green
- [ ] Maestro flows pass for: login, army-list, matches, references, campaigns, social, account-danger-zone, locale-switch, deep-link-army
- [ ] Single `SQLiteAdapter` instance for app lifetime (verified by adapter ID logging in dev mode)
- [ ] All 6 tabs render real content, no placeholders **on mobile** (web `matches`/`references`/`campaigns`/`social` placeholders remain unchanged in this plan; mobile-canonical implementations are the seed for the `mobile-web-parity-web-followup` plan)
- [ ] All locales shipped by web are loadable from the mobile i18n catalog (currently: `en` only — multi-locale follows when web adds locales)
- [ ] All new tasks have evidence files in `.sisyphus/evidence/`

### Must Have
- Single `SQLiteAdapter` ownership for app lifetime (PR 45 invariant on mobile)
- AppState-aware lifecycle (background → suspend sync, foreground → resume + reconcile)
- All web tabs have a real mobile counterpart with equivalent core actions
- Same locale catalog as web (single source of truth in `src/shared/i18n/` or copied)
- Same backend API consumption (no mobile-only endpoints)
- TDD discipline: failing test → implementation → green
- Every new module documented with `@requirements` block per `docs/CODING_STANDARDS.md`

### Must NOT Have (Guardrails)
- **NO** PGlite on mobile — mobile uses `expo-sqlite` only
- **NO** server-side rendering parity (impossible on RN; document Next.js-only behaviors instead)
- **NO** new mobile-only features not present on web
- **NO** mobile-specific backend endpoints
- **NO** tablet responsive overhaul beyond SideNav
- **NO** EAS production submission (build configs only)
- **NO** scope expansion to address pre-existing mobile bugs unless they block parity
- **NO** mocking the data layer in tests where the real `SQLiteAdapter` can be used in-memory
- **NO** _manual_ duplication of the web message catalog. Mobile catalogs MUST be **mechanically derived** from `src/web/messages/` via a build/copy script run in CI, AND a key-diff CI check (T7) MUST fail the build on drift. The on-disk `src/mobile/src/i18n/messages/*.json` files are generated artifacts, not hand-edited copies — single source of truth remains `src/web/messages/`.
- **NO** parallel `DataContextProvider`/`SyncQueueProvider` shipped alongside the new manager — clean cutover

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed.

### Test Decision
- **Infrastructure exists**: YES (Vitest + Maestro)
- **Automated tests**: YES (TDD)
- **Framework**: Vitest (units/integration), Maestro (E2E flows)
- **TDD pattern**: RED (failing test) → GREEN (minimal impl) → REFACTOR

### QA Policy
Every task includes agent-executed QA scenarios. Evidence saved to `.sisyphus/evidence/task-{N}-{slug}.{ext}`.

- **Mobile screens**: Maestro CLI runs `.yaml` flows; screenshots captured per step
- **Mobile providers/hooks**: Vitest + React Native Testing Library; output captured to log
- **Native modules**: tmux runs `expo start` and asserts boot logs; Maestro verifies UX
- **Lib utilities**: Bash + Vitest; assert exact return values

#### Default Expected-Result Convention (applies to ALL scenarios)

Where a per-scenario `Expected Result:` line is omitted in the task body below, the **executor MUST treat the following as the binding pass condition** (and the scenario is INVALID if none of these can be evaluated):

1. **Exit code**: The invoked tool/command exits `0`. Any non-zero exit is a FAIL.
2. **Evidence file**: The named evidence path under `.sisyphus/evidence/` exists, is non-empty, and was written during the scenario run (mtime within scenario window).
3. **No error keywords in stdout/stderr**: None of the substrings `FAIL`, `Error:`, `error TS`, `at Object.<anonymous>` (stack frames), `Flow FAILED`, `AssertionError`, `Unhandled` appear in captured output. (Case-sensitive match on these exact tokens.)
4. **For Maestro scenarios**: Final screenshot artifact for the asserted screen exists at the evidence path AND Maestro reports `Flow PASSED` for that flow.
5. **For Vitest scenarios**: `Tests:` summary line shows `0 failed` and `0` skipped (or skips are explicitly approved in the task body).
6. **For curl/HTTP scenarios**: HTTP status falls within the 2xx range AND response body is valid JSON when a JSON content-type is returned.

The executor MUST capture the actual output that satisfies these conditions and place it in the named evidence file. If a task's scenario has a more specific `Expected Result:` line, that line **overrides** this default for that scenario.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — start immediately, all parallel):
├── T1: Shared interfaces (DataContext, DataContextBuilder ownsAdapter contract for mobile) [quick]
├── T2: Mobile i18n scaffolding (expo-localization + react-intl wiring) [quick]
├── T3: Tamagui UI primitive kit setup + first 4 primitives (Button, Card, Input, Label) [visual-engineering]
├── T4: Mobile lib parity (auth0, auth0SpaClient, getQueryClient, queryClient, utils) [quick]
├── T5: useGameSystem hook (Expo Router pathname-based) [quick]
└── T6: MobileDataContextManager singleton class + RxJS observables + SQLite ownership + AppState handling [deep]

Wave 2 (Core architecture + UI kit completion — depends on Wave 1):
├── T7: i18n message catalog port (locales + keys mirroring web) [quick] [deps: T2]
├── T8: Tamagui primitives batch 2 (Avatar, Badge, Skeleton, Switch) [visual-engineering] [deps: T3]
├── T9: Tamagui primitives batch 3 (Tooltip, Toast, Dropdown, Select) [visual-engineering] [deps: T3]
├── T10: Tamagui primitives batch 4 (Dialog, AlertDialog, Tabs, Separator) [visual-engineering] [deps: T3]
├── T11: managerBridge + managerContext + managerState + useDataContext (React bridge) [deep] [deps: T1, T6]
└── T12: DataContextManagerProvider (replaces DataContextProvider + SyncQueueProvider) [deep] [deps: T11]

Wave 3 (Component kits — depends on Wave 2):
├── T13: Landing decomposition (UnauthenticatedLanding, AuthenticatedLanding, SilentAuthCheck, LandingContent, LandingSkeleton) [visual-engineering] [deps: T8, T12]
├── T14: Navigation kit (SideNav + SideNavUserTile, BottomNav verification) [visual-engineering] [deps: T8]
├── T15: System components (SystemAccessGate, SystemAutoRestore, SystemGridContainer, SystemGridView, SystemsSection, SystemTile, ProgressBar) [visual-engineering] [deps: T8, T12]
└── T16: Account components (DangerZoneSection, ProfileSection, PreferencesSection refresh) [visual-engineering] [deps: T8, T9]

Wave 4 (Screen rewrites — depends on Wave 3, MAX PARALLEL):
├── T17: Matches/War Ledger screen (real implementation) [visual-engineering] [deps: T12, T15]
├── T18: References screen (real implementation) [visual-engineering] [deps: T12, T15]
├── T19: Campaigns screen (real implementation) [visual-engineering] [deps: T12, T15]
├── T20: Social/Allies screen (real implementation) [visual-engineering] [deps: T12, T15]
├── T21: Armies screen parity refresh (use new providers + UI kit) [visual-engineering] [deps: T12, T15]
└── T22: Account screen parity (incl. DangerZone wiring + i18n) [visual-engineering] [deps: T16, T7]

Wave 5 (Integration + native — depends on Wave 4):
├── T23: Provider stack cutover in src/mobile/app/_layout.tsx (remove legacy providers) [deep] [deps: T12]
├── T24: Locale-aware layout integration + locale switch UI [visual-engineering] [deps: T7, T16]
├── T25: Backend API integration audit (wahapedia/github proxies, BSData foreground refresh) [unspecified-high] [deps: T23]
├── T26: useGameSystem wiring across screens [quick] [deps: T5, T17-T22]
├── T27: Mobile-specific lifecycle smoke (background→foreground, lock screen, low memory) [deep] [deps: T23]
└── T28: Native enhancements bundle (haptics, gestures, push notifications, deep links, share sheets) [unspecified-high] [deps: T23]

Wave 6 (Verification — depends on Wave 5):
├── T29: Maestro flow expansion (per-screen flows + locale + deep link + danger zone) [unspecified-high] [deps: T17-T28]
├── T30: Vitest sweep + coverage report [quick] [deps: T17-T28]
└── T31: docs/services-style mobile architecture doc [writing] [deps: T23, T28]

Wave FINAL (Parallel reviews — after all tasks):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real manual QA via Maestro (unspecified-high)
└── F4: Scope fidelity check (deep)
→ Present results → Get explicit user okay

Critical Path: T1 → T6 → T11 → T12 → T17 → T23 → T28 → F1–F4 → user okay
Parallel Speedup: ~75% faster than sequential
Max Concurrent: 6 (Wave 1, Wave 4)
```

### Dependency Matrix (abbreviated)

- **T1**: — → T6, T11
- **T6**: T1 → T11, T12
- **T11**: T1, T6 → T12, T13, T15
- **T12**: T11 → T13, T15, T17–T22, T23
- **T17–T22**: T12, T15 → T26, T29
- **T23**: T12 → T25, T27, T28
- **T28**: T23 → T29
- **F1–F4**: ALL → user okay

### Agent Dispatch Summary

- **Wave 1**: 6 — T1/T2/T4/T5 → `quick`, T3 → `visual-engineering`, T6 → `deep`
- **Wave 2**: 6 — T7 → `quick`, T8/T9/T10 → `visual-engineering`, T11/T12 → `deep`
- **Wave 3**: 4 — T13/T14/T15/T16 → `visual-engineering`
- **Wave 4**: 6 — T17–T22 → `visual-engineering`
- **Wave 5**: 6 — T23/T27 → `deep`, T24 → `visual-engineering`, T25/T28 → `unspecified-high`, T26 → `quick`
- **Wave 6**: 3 — T29 → `unspecified-high`, T30 → `quick`, T31 → `writing`
- **Wave FINAL**: 4 — F1 → `oracle`, F2/F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [ ] 1. **Document `ownsAdapter` contract for mobile parity in shared data-context**

  **What to do**:
  - Audit `src/shared/data/context/src/{DataContext.ts,DataContextBuilder.ts}` for the `ownsAdapter` flag introduced by PR 45.
  - Add JSDoc on `DataContextBuilder.ownsAdapter()` clarifying that mobile callers MUST set `true` for the singleton manager and `false` everywhere else.
  - Add a `@requirements` block referencing PR 45 invariants ("single adapter ownership per app lifetime").
  - Add a **type-level + documentation-level** test (vitest) that:
    1. Asserts `ownsAdapter()` is callable with a boolean and is fluent (returns the builder), AND
    2. Constructs two builders against the same adapter, calls `.ownsAdapter(true)` on both, asserts the call signature does not throw at compile/runtime today (documenting current behavior), AND
    3. Includes an `it.todo("enforces single ownership at runtime — tracked separately, requires runtime change")` placeholder so the contract gap is visible in the test report.
  - **Do NOT** add a test that would require runtime enforcement to pass — runtime enforcement is explicitly out of scope for T1 and is filed as a follow-up.

  **Must NOT do**:
  - Modify runtime behavior beyond docs/test additions (no throw, no warn, no new validation in `ownsAdapter()` itself).
  - Edit `src/web/` or `src/mobile/` in this task.
  - Add a "two builders both own the same adapter throws" test — that test cannot pass without a runtime change and would force scope creep.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `git-worktree-agent-workflow`

  **Parallelization**: Wave 1, no dependencies, blocks T6/T11.

  **References**:
  - `src/shared/data/context/src/DataContext.ts` — current contract.
  - `src/shared/data/context/src/DataContextBuilder.ts` — builder with `ownsAdapter` flag.
  - PR 45 description on GitHub — invariants.

  **Acceptance Criteria**:
  - [ ] `npm run typecheck --workspace=@armoury/data-context` → 0 errors
  - [ ] `npm run test --workspace=@armoury/data-context` → new ownership test green

  **QA Scenarios**:
  ```
  Scenario: ownsAdapter contract documented + fluent API verified
    Tool: Bash (vitest)
    Steps:
      1. Run `npm run test --workspace=@armoury/data-context -- ownsAdapter`
      2. Assert: documentation/fluent-API tests pass; `it.todo` for runtime enforcement is reported as TODO (not failure).
    Expected Result: All non-TODO assertions green; one `it.todo` reported.
    Failure Indicators: Any non-TODO test red; runtime enforcement test added by mistake (would fail and indicate scope creep).
    Evidence: .sisyphus/evidence/task-1-ownsadapter-test.log
  ```

  **Commit**: YES — `docs(data-context): clarify ownsAdapter contract for single-adapter invariant`

- [ ] 2. **Scaffold mobile i18n with expo-localization + react-intl**

  > **RESOLVED (partial) — shared-code-migration T10**: The shared i18n catalog and message
  > types now live in `@armoury/i18n` (`src/shared/i18n`). The mobile runtime wiring
  > (expo-localization, IntlProvider, stub catalog) remains in scope for this task.

  **What to do**:
  - Add `expo-localization` and `react-intl` to `src/mobile/package.json`.
  - Create `src/mobile/src/i18n/{config.ts,IntlProvider.tsx,detectLocale.ts}` mirroring web's `src/web/src/i18n/`.
  - Wire `IntlProvider` into the provider stack (placeholder for now; T23 finalizes).
  - Add a stub message catalog `src/mobile/src/i18n/messages/en.json` with one key (`app.title`).

  **Must NOT do**:
  - Port the full catalog (T7 does this).
  - Wire locale switch UI (T24 does this).

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `frontend-ux-engineer`, `git-worktree-agent-workflow`

  **Parallelization**: Wave 1, no dependencies, blocks T7/T24.

  **References**:
  - `src/web/src/i18n/request.ts` and `src/web/src/i18n/routing.ts` — web pattern.
  - `expo-localization` docs — for device locale detection.
  - `react-intl` docs — for `IntlProvider` usage in React Native.

  **Acceptance Criteria**:
  - [ ] `npm run typecheck --workspace=@armoury/mobile` → 0 errors
  - [ ] `IntlProvider` resolves `app.title` to "Armoury" in a Vitest render

  **QA Scenarios**:
  ```
  Scenario: IntlProvider resolves stub key
    Tool: Bash (vitest + RNTL)
    Steps:
      1. Render `<IntlProvider><Text><FormattedMessage id="app.title"/></Text></IntlProvider>`
      2. Assert text content is "Armoury"
    Expected Result: Test passes
    Evidence: .sisyphus/evidence/task-2-intl-stub.log
  ```

  **Commit**: YES — `feat(mobile/i18n): scaffold expo-localization + react-intl`

- [ ] 3. **Tamagui UI primitive kit setup + batch 1 (Button, Card, Input, Label)**

  > **RESOLVED (partial) — shared-code-migration T2**: `EmptyState` and `ConfirmDialog`
  > components are now in `@armoury/ui` (`src/shared/ui`). The Tamagui-specific mobile
  > primitives (Button, Card, Input, Label) remain in scope for this task.

  **What to do**:
  - Create `src/mobile/src/components/ui/` with index barrel.
  - Implement `Button`, `Card`, `Input`, `Label` Tamagui-based primitives mirroring web Radix API surface where possible (props parity for `variant`, `size`, `disabled`).
  - Each primitive ships with a Vitest snapshot + a11y assertion (role, accessibilityLabel).

  **Must NOT do**:
  - Build other primitives (covered in T8/T9/T10).
  - Style with inline `StyleSheet`; use Tamagui tokens.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `frontend-ux-engineer`, `accessibility`, `git-worktree-agent-workflow`

  **Parallelization**: Wave 1, no dependencies, blocks T8/T9/T10/T13–T22.

  **References**:
  - `src/web/src/components/ui/{button,card,input,label}.tsx` — API surface to mirror.
  - Tamagui v2 docs.

  **Acceptance Criteria**:
  - [ ] All 4 primitives exported from `src/mobile/src/components/ui/index.ts`
  - [ ] Vitest snapshots match
  - [ ] Each primitive has accessibilityRole

  **QA Scenarios**:
  ```
  Scenario: Button primitive renders + dispatches onPress
    Tool: Bash (vitest + RNTL)
    Steps:
      1. Render `<Button onPress={fn}>Tap</Button>`
      2. Fire press event
    Expected Result: fn called once, accessibilityRole="button"
    Evidence: .sisyphus/evidence/task-3-button.log
  ```

  **Commit**: YES — `feat(mobile/ui): add Tamagui primitives batch 1 (Button, Card, Input, Label)`

- [ ] 4. **Mobile lib parity (auth0, auth0SpaClient, getQueryClient, queryClient, utils)**

  > **RESOLVED (partial) — shared-code-migration T9 + T11**:
  > - Query infrastructure (`getQueryClient`, `queryClient`) is now in `@armoury/query`
  >   (`src/shared/query`). Mobile should consume `@armoury/query` directly.
  > - Auth0 SPA client (`auth0SpaClient`) is now in `@armoury/auth-client`
  >   (`src/shared/clients/auth`). The mobile auth runtime (react-native-auth0 wiring,
  >   `auth0.ts` mobile variant) remains in scope for this task.

  **What to do**:
  - Port `src/web/src/lib/{auth0SpaClient.ts,getQueryClient.ts,queryClient.ts,utils.ts}` into `src/mobile/src/lib/`, replacing browser-specific bits with React Native equivalents.
  - `auth0.ts` mobile variant uses `react-native-auth0` or existing mobile Auth0 setup; `auth0SpaClient.ts` is a thin wrapper.
  - `utils.ts` `cn()` helper — Tamagui-compatible className merge or no-op equivalent.

  **Must NOT do**:
  - Re-implement `AuthProvider` (already exists).
  - Add server-only helpers (e.g., the Next.js server `auth0.ts`).

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `git-worktree-agent-workflow`

  **Parallelization**: Wave 1, no dependencies, blocks T11/T12.

  **References**:
  - `src/web/src/lib/{auth0SpaClient.ts,getQueryClient.ts,queryClient.ts,utils.ts}`.
  - `src/mobile/src/providers/AuthProvider.tsx` — existing mobile auth wiring.

  **Acceptance Criteria**:
  - [ ] All 5 modules typecheck
  - [ ] `getQueryClient()` returns a singleton across calls (test asserts identity)

  **QA Scenarios**:
  ```
  Scenario: queryClient singleton
    Tool: Bash (vitest)
    Steps:
      1. Call `getQueryClient()` twice
      2. Assert `===`
    Expected Result: Same reference
    Evidence: .sisyphus/evidence/task-4-querysingleton.log
  ```

  **Commit**: YES — `feat(mobile/lib): port auth0/queryClient/utils parity from web`

- [ ] 5. **`useGameSystem` hook (Expo Router pathname-based)**

  > **RESOLVED — shared-code-migration T14**: Game-system components and hooks are now in
  > `@armoury/feature-game-system` (`src/shared/features/game-system`). The `useGameSystem`
  > hook ships from that package. Mobile should import from `@armoury/feature-game-system`
  > rather than implementing a local copy. The Expo Router pathname adapter (wrapping
  > `usePathname()`) may still need a thin mobile-specific shim if the shared hook does not
  > accept a pathname override — verify at implementation time.

  **What to do**:
  - Implement `src/mobile/src/hooks/useGameSystem.ts` mirroring web's `useGameSystem`.
  - Use `usePathname()` from `expo-router` to derive `wh40k10e` (or future systems).
  - Return `{ system, isLoading, error }` matching web's API.
  - Add Vitest covering pathname → system resolution.

  **Must NOT do**:
  - Hardcode `wh40k10e` — use `resolveGameSystem` from existing mobile lib.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `frontend-ux-engineer`, `git-worktree-agent-workflow`

  **Parallelization**: Wave 1, no dependencies, blocks T17–T22 wiring (T26).

  **References**:
  - `src/web/src/hooks/useGameSystem.ts`
  - `src/mobile/src/lib/resolveGameSystem.ts` (existing).
  - `expo-router` `usePathname` docs.

  **Acceptance Criteria**:
  - [ ] Hook returns `wh40k10e` for path `/wh40k10e/armies`
  - [ ] Returns `null` system on `/account`

  **QA Scenarios**:
  ```
  Scenario: pathname resolves system
    Tool: Bash (vitest)
    Steps:
      1. Mock pathname `/wh40k10e/armies`
      2. Assert hook returns `system.id === 'wh40k10e'`
    Expected Result: Pass
    Evidence: .sisyphus/evidence/task-5-usegamesystem.log
  ```

  **Commit**: YES — `feat(mobile/hooks): add useGameSystem`

- [ ] 6. **`MobileDataContextManager` singleton (SQLite ownership + AppState handling)**

  **What to do**:
  - Implement `src/mobile/src/data/MobileDataContextManager.ts` mirroring `src/web/src/data/DataContextManager.ts` (PR 45).
  - Singleton class owning ONE `SQLiteAdapter` for app lifetime; expose RxJS observables for sync state, presence, manifest.
  - Subscribe to `AppState` (active/background): on background → suspend non-critical observers; on foreground → reconcile + resume.
  - Lifecycle methods: `init()`, `dispose()`, `getAdapter()`, `subscribe(...)`.
  - Use `DataContextBuilder` with `ownsAdapter: true`.
  - Vitest coverage: singleton invariant, AppState transitions, adapter not re-created on hot reload.

  **Must NOT do**:
  - Touch `DataContextProvider` or `SyncQueueProvider` (T23 cuts over).
  - Use PGlite anywhere.

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `git-worktree-agent-workflow`

  **Parallelization**: Wave 1, depends on T1, blocks T11/T12.

  **References**:
  - `src/web/src/data/DataContextManager.ts` — canonical PR 45 implementation (558 LOC).
  - `src/shared/data/context/src/DataContextBuilder.ts` — builder API.
  - `src/mobile/src/providers/DataContextProvider.tsx` (legacy) — current adapter wiring to replace.
  - React Native `AppState` API.

  **Acceptance Criteria**:
  - [ ] Singleton: `MobileDataContextManager.getInstance()` returns same ref across calls
  - [ ] `getAdapter()` returns same `SQLiteAdapter` ref across screen transitions (assert via test)
  - [ ] AppState background → `isSuspended` observable emits `true`
  - [ ] AppState foreground → reconcile method called once

  **QA Scenarios**:
  ```
  Scenario: Single adapter across getAdapter calls
    Tool: Bash (vitest)
    Steps:
      1. `await MobileDataContextManager.getInstance().init()`
      2. Call `getAdapter()` 3 times
      3. Assert `a === b === c`
    Expected Result: Pass
    Evidence: .sisyphus/evidence/task-6-singleadapter.log

  Scenario: AppState background suspends
    Tool: Bash (vitest)
    Steps:
      1. Init manager, subscribe to `isSuspended$`
      2. Emit AppState change `background`
      3. Assert observable emits `true`
    Expected Result: Pass
    Evidence: .sisyphus/evidence/task-6-appstate-background.log
  ```

  **Commit**: YES — `feat(mobile/data): add MobileDataContextManager with single SQLiteAdapter ownership and AppState lifecycle`

- [ ] 7. **i18n message catalog port (locale parity with web — currently `en`)**

  **What to do**:
  - Enumerate every locale file present under `src/web/messages/` AND every locale declared in `src/web/src/i18n/routing.ts`. **At time of writing, web ships `en` only.** This task mirrors whatever set web exposes — no more, no less.
  - **Source of truth: `src/web/messages/`.** Add a generator script `src/mobile/scripts/sync-i18n.mjs` that reads `src/web/messages/*.json` and writes `src/mobile/src/i18n/messages/*.json` (mechanically derived, never hand-edited). Wire it into `prebuild` for the mobile workspace and into the root `build` pipeline so CI always regenerates before bundling.
  - Add a CI key-diff check (separate npm script `mobile:i18n:check`) that re-runs the generator into a temp dir and `diff`s against checked-in mobile catalogs — non-zero diff fails the build (catches stale checked-in artifacts).
  - Wire `IntlProvider` to load the detected locale's catalog at boot; fallback to `en`.
  - Document in `src/mobile/src/i18n/README.md` that the mobile catalog files are **generated** and must not be edited directly.

  **Must NOT do**:
  - Translate any new keys (parity only — no scope creep).
  - Restructure web's catalog.

  **Recommended Agent Profile**: `quick` + `frontend-ux-engineer`, `git-worktree-agent-workflow`
  **Parallelization**: Wave 2, deps T2, blocks T24.
  **References**: `src/web/src/i18n/*`, `src/web/messages/` if exists.
  **Acceptance Criteria**:
  - [ ] Mobile ships exactly the locale set web ships (currently `{en}`); zero extra locales, zero missing locales
  - [ ] At least 5 sample keys resolve identically between web and mobile for the `en` catalog

  **QA Scenarios**:
  ```
  Scenario: Locale catalog parity
    Tool: Bash (node script comparing key sets)
    Steps:
      1. Diff web message keys vs mobile message keys
    Expected Result: Identical key set
    Evidence: .sisyphus/evidence/task-7-i18n-keydiff.log
  ```
  **Commit**: YES — `feat(mobile/i18n): port full locale catalog from web`

- [ ] 8. **Tamagui primitives batch 2 (Avatar, Badge, Skeleton, Switch)**

  **What to do**: Mirror `src/web/src/components/ui/{avatar,badge,skeleton,switch}.tsx` in Tamagui. Snapshot + a11y assertions per primitive.
  **Must NOT do**: Add primitives outside the 4 listed.
  **Recommended Agent Profile**: `visual-engineering` + `frontend-ux-engineer`, `accessibility`, `git-worktree-agent-workflow`
  **Parallelization**: Wave 2, deps T3, blocks T13–T22.
  **References**: web `src/web/src/components/ui/{avatar,badge,skeleton,switch}.tsx`.
  **Acceptance Criteria**: All 4 primitives exported and snapshot-tested.
  **QA Scenarios**:
  ```
  Scenario: Avatar renders fallback
    Tool: Bash (vitest)
    Steps: Render <Avatar fallback="BD" /> ; assert text "BD" present
    Evidence: .sisyphus/evidence/task-8-avatar.log
  ```
  **Commit**: YES — `feat(mobile/ui): add primitives batch 2`

- [ ] 9. **Tamagui primitives batch 3 (Tooltip, Toast, Dropdown, Select)**

  **What to do**: Mirror web Radix equivalents using Tamagui patterns (Toast via `burnt` or Tamagui Toast; Dropdown/Select via Tamagui Sheet on mobile).
  **Must NOT do**: Use any web-only Radix module.
  **Recommended Agent Profile**: `visual-engineering` + `frontend-ux-engineer`, `accessibility`, `git-worktree-agent-workflow`
  **Parallelization**: Wave 2, deps T3, blocks T13–T22.
  **References**: `src/web/src/components/ui/{tooltip.tsx,toast.tsx,DropdownMenu.tsx,select.tsx}` (note PascalCase for `DropdownMenu`, kebab/lowercase for the others — this matches the actual on-disk filenames).
  **Acceptance Criteria**: All 4 primitives exported, accessible via screen reader.
  **QA Scenarios**:
  ```
  Scenario: Select opens and selects
    Tool: Bash (vitest + RNTL)
    Steps: Render Select with 3 options; press; choose option 2; assert onChange called with index 1
    Evidence: .sisyphus/evidence/task-9-select.log
  ```
  **Commit**: YES — `feat(mobile/ui): add primitives batch 3`

- [ ] 10. **Tamagui primitives batch 4 (Dialog, AlertDialog, Tabs, Separator)**

  **What to do**: Mirror Radix dialog/alert-dialog/tabs/separator. Dialog uses Tamagui Sheet/Modal; AlertDialog uses native `Alert.alert` wrapper or Tamagui modal.
  **Must NOT do**: Build navigation tabs (Expo Router handles those).
  **Recommended Agent Profile**: `visual-engineering` + `frontend-ux-engineer`, `accessibility`, `git-worktree-agent-workflow`
  **Parallelization**: Wave 2, deps T3, blocks T13–T22.
  **References**: `src/web/src/components/ui/{dialog.tsx,AlertDialog.tsx,tabs.tsx,separator.tsx}` (note PascalCase for `AlertDialog`; verified against the actual on-disk filenames).
  **Acceptance Criteria**: All 4 primitives exported and tested.
  **QA Scenarios**:
  ```
  Scenario: AlertDialog confirm path
    Tool: Bash (vitest + RNTL)
    Steps: Render AlertDialog with confirm + cancel; press confirm; assert onConfirm called
    Evidence: .sisyphus/evidence/task-10-alertdialog.log
  ```
  **Commit**: YES — `feat(mobile/ui): add primitives batch 4`

- [ ] 11. **`managerBridge` + `managerContext` + `managerState` + `useDataContext` (React bridge)**

  **What to do**: Port `src/web/src/data/{managerBridge.ts,managerContext.tsx,managerState.ts,useDataContext.ts}` to `src/mobile/src/data/` adapting for React Native (no `'use client'`, no Next.js cache primitives).
  **Must NOT do**: Couple to web-only React Server Components.
  **Recommended Agent Profile**: `deep` + `git-worktree-agent-workflow`
  **Parallelization**: Wave 2, deps T1+T6, blocks T12.
  **References**: `src/web/src/data/{managerBridge.ts,managerContext.tsx,managerState.ts,useDataContext.ts}`.
  **Acceptance Criteria**: `useDataContext()` returns the same context across renders; bridge propagates RxJS emissions to React state.
  **QA Scenarios**:
  ```
  Scenario: useDataContext stable across renders
    Tool: Bash (vitest + RNTL)
    Steps: Render hook twice in tree; assert reference identity
    Evidence: .sisyphus/evidence/task-11-usedatacontext.log
  ```
  **Commit**: YES — `feat(mobile/data): add manager bridge + context + state + useDataContext`

- [ ] 12. **`DataContextManagerProvider` (replaces legacy providers)**

  **What to do**: Implement `src/mobile/src/providers/DataContextManagerProvider.tsx`. **There is no `DataContextManagerProvider` file on web — web composes the manager inline via `src/web/src/data/managerContext.tsx` + `managerBridge.ts`. This task therefore defines the mobile provider explicitly using the web composition as the behavioral spec, not as a file-for-file mirror.**

  Explicit composition spec:
  - Module exports a single React component `DataContextManagerProvider({ children }: { children: ReactNode })`.
  - On mount: call `MobileDataContextManager.getInstance()` (singleton from T6); call `manager.init()` if not already initialized; subscribe to manager state changes to drive a `useState` snapshot used by the bridge (mirror of `src/web/src/data/managerBridge.ts` lines that wire React state to manager events — copy the subscription topology, not the file).
  - Provide value through the React context exported by T11's `src/mobile/src/data/managerContext.tsx` (mirroring `src/web/src/data/managerContext.tsx` 1:1 in shape).
  - On unmount: call `manager.dispose()` exactly once; cancel all subscriptions; guard against double-dispose with an internal `disposed` flag.
  - Initialization MUST be idempotent across React StrictMode double-invoke (use `useEffect` cleanup correctly; do not call `init()` from render).
  - File header: `@requirements` block linking to T6 and T11 source files.

  **Must NOT do**: Ship alongside `DataContextProvider` + `SyncQueueProvider` long-term — T23 cuts over. Do NOT create a new `DataContextManagerProvider.tsx` on web (out of scope for this plan).
  **Recommended Agent Profile**: `deep` + `git-worktree-agent-workflow`
  **Parallelization**: Wave 2, deps T11, blocks T13/T15/T17–T23.
  **References**:
  - `src/web/src/data/managerContext.tsx` — context shape to mirror exactly.
  - `src/web/src/data/managerBridge.ts` — subscription/state-snapshot topology to copy (adapted for RN, no `'use client'`).
  - `src/web/src/data/managerState.ts` — state shape consumed by the bridge.
  - `src/web/src/data/useDataContext.ts` — consumer hook the provider must satisfy.
  - `src/mobile/src/data/MobileDataContextManager.ts` (from T6) — singleton being mounted.
  - `src/mobile/src/providers/` — legacy providers location (sibling layout).
  **Acceptance Criteria**: Provider mounts manager exactly once across re-renders AND across StrictMode double-invoke; teardown disposes adapter exactly once; double-mount in tests does not throw.
  **QA Scenarios**:
  ```
  Scenario: Provider mounts manager once under StrictMode
    Tool: Bash (vitest + RNTL)
    Preconditions: `MobileDataContextManager.getInstance()` mocked with `init` and `dispose` spies; tree wrapped in `<React.StrictMode>`.
    Steps: Render provider inside StrictMode; trigger 3 re-renders of an inner consumer; unmount.
    Expected Result: `init` called exactly 1 time; `dispose` called exactly 1 time on unmount; no errors logged.
    Failure Indicators: `init`/`dispose` call count ≠ 1; "double-dispose" warnings; React act() warnings.
    Evidence: .sisyphus/evidence/task-12-providermount.log
  ```
  **Commit**: YES — `feat(mobile/providers): add DataContextManagerProvider`

- [ ] 13. **Landing decomposition (Unauthenticated/Authenticated/SilentAuthCheck/LandingContent/LandingSkeleton)**

  **What to do**: Refactor mobile landing into 5 components mirroring `src/web/src/components/landing/*`. Reuse Tamagui primitives.
  **Must NOT do**: Add features beyond what web landing has.
  **Recommended Agent Profile**: `visual-engineering` + `frontend-ux-engineer`, `git-worktree-agent-workflow`
  **Parallelization**: Wave 3, deps T8+T12, blocks final QA.
  **References**: `src/web/src/components/landing/{UnauthenticatedLanding,LandingContent,SilentAuthCheck,AuthenticatedLanding,LandingSkeleton}.tsx`; mobile current `LandingContainer.tsx`/`LandingView.tsx`.
  **Acceptance Criteria**: 5 components exported; existing landing screen wires them; no visual regressions in Maestro screenshot diff.
  **QA Scenarios**:
  ```
  Scenario: Unauthenticated path renders sign-in CTA
    Tool: Maestro
    Steps: Launch app logged out; assert "Sign in" visible
    Evidence: .sisyphus/evidence/task-13-landing-unauth.png
  Scenario: Authenticated path renders systems
    Tool: Maestro
    Steps: Launch app logged in; assert SystemTile visible
    Evidence: .sisyphus/evidence/task-13-landing-auth.png
  ```
  **Commit**: YES — `feat(mobile/landing): decompose landing into web-parity components`

- [ ] 14. **Navigation kit (SideNav + SideNavUserTile, BottomNav verification)**

  **What to do**: Build SideNav + SideNavUserTile components for tablet form factor (use Tamagui media queries to render only at tablet width). Verify Expo Router tab bar matches web BottomNav semantics; if gaps exist (icons, labels), close them.
  **Must NOT do**: Re-implement Expo Router tabs from scratch.
  **Recommended Agent Profile**: `visual-engineering` + `frontend-ux-engineer`, `accessibility`, `git-worktree-agent-workflow`
  **Parallelization**: Wave 3, deps T8.
  **References**: `src/web/src/components/navigation/{SideNav,SideNavUserTile,BottomNav}.tsx`.
  **Acceptance Criteria**: SideNav renders ≥768pt width; collapses below; tab labels match web.
  **QA Scenarios**:
  ```
  Scenario: SideNav renders on tablet width
    Tool: Maestro (with iPad simulator)
    Steps: Launch on iPad; assert SideNav visible
    Evidence: .sisyphus/evidence/task-14-sidenav-tablet.png
  ```
  **Commit**: YES — `feat(mobile/navigation): add SideNav kit`

- [ ] 15. **System components (SystemAccessGate, SystemAutoRestore, SystemGridContainer, SystemGridView, SystemsSection, SystemTile, ProgressBar)**

  **What to do**: Port 7 system-related components from `src/web/src/components/system/*` (or wherever they live) to mobile. Reuse Tamagui primitives. `SystemAccessGate` enforces auth + system entitlement; `SystemAutoRestore` rehydrates last-used system on cold boot.
  **Must NOT do**: Add new system gating logic not present on web.
  **Recommended Agent Profile**: `visual-engineering` + `frontend-ux-engineer`, `git-worktree-agent-workflow`
  **Parallelization**: Wave 3, deps T8+T12.
  **References**: web equivalents (search `src/web/src/components/` for `System*`/`ProgressBar`).
  **Acceptance Criteria**: All 7 components exported, `SystemAccessGate` denies entry when no entitlement.
  **QA Scenarios**:
  ```
  Scenario: SystemAccessGate denies w/o entitlement
    Tool: Bash (vitest + RNTL)
    Steps: Render gate with `entitlements: []`; assert children NOT rendered, fallback message visible
    Evidence: .sisyphus/evidence/task-15-accessgate.log
  Scenario: SystemAutoRestore rehydrates
    Tool: Bash (vitest)
    Steps: Seed AsyncStorage with `lastSystem=wh40k10e`; mount component; assert router pushed to `/wh40k10e`
    Evidence: .sisyphus/evidence/task-15-autorestore.log
  ```
  **Commit**: YES — `feat(mobile/system): port system components from web`

- [ ] 16. **Account components (DangerZoneSection, ProfileSection, PreferencesSection refresh)**

  > **RESOLVED (partial) — shared-code-migration T12**: Profile components and hooks are now
  > in `@armoury/feature-profile` (`src/shared/features/profile`). `ProfileSection` and
  > related profile hooks should be consumed from that package. `DangerZoneSection` and
  > `PreferencesSection` remain in scope for this task.

  **What to do**: Port `DangerZoneSection` (account deletion) and refresh `ProfileSection`/`PreferencesSection` to consume new providers + i18n. Confirm + delete uses AlertDialog (T10).
  **Must NOT do**: Implement actual deletion endpoint (assume backend exists).
  **Recommended Agent Profile**: `visual-engineering` + `frontend-ux-engineer`, `accessibility`, `git-worktree-agent-workflow`
  **Parallelization**: Wave 3, deps T8+T9.
  **References**: `src/web/src/components/DangerZoneSection.tsx`, `src/web/src/components/ProfileSection.tsx`, `src/web/src/components/PreferencesSection.tsx` (note: web keeps these flat under `components/`, not nested under `components/account/`).
  **Acceptance Criteria**: All 3 components exported; DangerZone fires delete API on confirm.
  **QA Scenarios**:
  ```
  Scenario: DangerZone confirm path
    Tool: Maestro
    Steps: Open Account > scroll to DangerZone > tap Delete > confirm; assert API called + sign-out triggered
    Evidence: .sisyphus/evidence/task-16-dangerzone.png
  ```
  **Commit**: YES — `feat(mobile/account): port DangerZone + refresh account components`

- [ ] 17. **Matches/War Ledger screen (real implementation — mobile spec canonical)**

  **What to do**: Replace placeholder `src/mobile/app/(tabs)/matches/index.tsx` with a real War Ledger screen. **The web counterpart at `src/web/app/[locale]/wh40k10e/matches/page.tsx` is currently only a placeholder title page — there is no web implementation to mirror. This task therefore defines the canonical product spec inline; a follow-up plan will mirror this design back to web.**

  Concrete spec (inline source of truth):
  - Top-level list of matches read from `useDataContext().matches.list()` (extend the data-context API in `src/shared/data/context/` if missing — coordinate with T1 scope; no schema changes beyond what the existing match table allows).
  - Each row shows: opponent name, date (relative), result chip (`W`/`L`/`D`), army-played name. Tap → detail.
  - Detail screen: header (date, opponent, result), notes field (read-only), `Delete` action (uses `AlertDialog` from T10).
  - `+` FAB → create form: opponent (Input), date (date picker via `expo-router` modal), result (Select from T9), army (Select populated from `useDataContext().armies.list()`), notes (multiline Input). Submit calls `matches.create(...)`; cancel returns to list.
  - All copy uses `formatMessage()` keys under `mobile.matches.*`; new keys added to `src/web/messages/en.json` (source of truth) and regenerated to mobile via T7's sync script.
  **Must NOT do**: Add stats/analytics/elo (out of scope). Do NOT modify the web placeholder page in this PR. Do NOT introduce a new database table.
  **Recommended Agent Profile**: `visual-engineering` + `frontend-ux-engineer`, `git-worktree-agent-workflow`
  **Parallelization**: Wave 4, deps T12+T15.
  **References**:
  - `src/web/app/[locale]/wh40k10e/matches/page.tsx` — placeholder; confirms route exists and reserves the slug. **Not a behavioral reference.**
  - `src/shared/data/context/src/DataContextBuilder.ts` — extend the matches accessor here if `list/create/delete` aren't already exposed.
  - `src/mobile/src/components/ui/{Input,Select,AlertDialog,Button,Card}.tsx` — primitives to compose.
  - `src/mobile/app/(tabs)/armies/index.tsx` — reference for tab-screen + list pattern in mobile.
  **Acceptance Criteria**: Screen lists matches, opens detail, creates new entry, deletes via AlertDialog; Maestro flow passes; no hardcoded user-visible strings.
  **QA Scenarios**:
  ```
  Scenario: List + create + delete round-trip
    Tool: Maestro
    Preconditions: Logged in; armies list contains seeded `test-army`; matches list initially empty
    Steps: Tap Matches tab; assert empty-state copy renders; tap `+`; fill opponent=`Bob`, date=today, result=`W`, army=`test-army`, notes=`good game`; submit; assert one row visible with opponent `Bob` and result chip `W`; tap row; assert detail shows the same fields; tap `Delete`; confirm in AlertDialog; assert list returns to empty state
    Expected Result: All assertions pass; no error toast
    Failure Indicators: Form does not submit; row not visible; detail shows stale/empty fields; delete leaves row in place
    Evidence: .sisyphus/evidence/task-17-matches.png + .sisyphus/evidence/task-17-matches-detail.png
  ```
  **Commit**: YES — `feat(mobile/matches): real War Ledger screen`

- [ ] 18. **References screen (real implementation — mobile spec canonical)**

  **What to do**: Replace placeholder with browse + search of game-system reference entries. **The web page at `src/web/app/[locale]/wh40k10e/references/page.tsx` is also a placeholder; this task defines canonical mobile behavior.**

  Concrete spec:
  - Source: read from `useGameSystem().references` (the wh40k10e plugin already exposes a static reference catalog — confirm shape via T5; if missing, expose a `references()` accessor on the game-system plugin in `src/systems/wh40k10e/` as part of this task).
  - List view: virtualized FlatList of reference entries (name + short subtitle). Search box at top filters by name (case-insensitive, debounced 200 ms).
  - Detail view: full markdown body (use existing markdown renderer in `src/mobile/src/components/markdown/` if present; else add `react-native-markdown-display`).
  - All copy via `formatMessage()` keys `mobile.references.*`.
  **Must NOT do**: Cache reference content beyond the in-memory game-system plugin. Do NOT add favoriting/bookmarking (out of scope). Do NOT modify web placeholder.
  **Recommended Agent Profile**: `visual-engineering` + `frontend-ux-engineer`, `git-worktree-agent-workflow`
  **Parallelization**: Wave 4, deps T12+T15 (and T5 for `useGameSystem`).
  **References**:
  - `src/web/app/[locale]/wh40k10e/references/page.tsx` — placeholder; route reservation only.
  - `src/systems/wh40k10e/src/index.ts` — game-system plugin entry; extend with `references()` if absent.
  - `src/mobile/src/hooks/useGameSystem.ts` — consumer (added in T5).
  - `src/mobile/src/components/ui/Input.tsx` — search field primitive.
  **Acceptance Criteria**: List renders with ≥1 entry from the wh40k10e plugin; search filters live; detail opens with rendered markdown; no hardcoded strings.
  **QA Scenarios**:
  ```
  Scenario: Search filters list and detail opens
    Tool: Maestro
    Preconditions: wh40k10e plugin loaded with at least one reference whose name contains `tactical`
    Steps: Open References tab; assert ≥1 row visible; type `tactical` in search; assert ≥1 result remains and rows not matching are hidden; tap first result; assert detail screen renders non-empty markdown body
    Expected Result: Filtering and detail navigation succeed
    Failure Indicators: Search produces zero results when matching entries exist; detail body empty
    Evidence: .sisyphus/evidence/task-18-references.png + .sisyphus/evidence/task-18-references-detail.png
  ```
  **Commit**: YES — `feat(mobile/references): real references screen`

- [ ] 19. **Campaigns screen (real implementation — mobile spec canonical)**

  **What to do**: Replace placeholder with campaigns list + detail + create. **Web placeholder at `src/web/app/[locale]/wh40k10e/campaigns/page.tsx` does not implement this; mobile defines the canonical UX.** Backend already exists: `@armoury/campaigns` Lambda exposes the API; this task wires mobile against it.

  Concrete spec:
  - Data: call the `@armoury/campaigns` Lambda via the auth0-authenticated `queryClient` from T4. Verified endpoints (against `src/services/campaigns/src/routes/campaigns.ts` and `src/services/campaigns/src/utils/validation.ts`):
    - `GET /campaigns` — list
    - `POST /campaigns` — create; **REQUIRED body fields**: `name: string`, `type: string`, `narrative: { schemaVersion: number, ... }`, `startDate: string` (ISO 8601), `status: 'upcoming' | 'active' | 'completed' | 'cancelled'`. Optional: `endDate: string`.
    - `GET /campaigns/:id` — detail
    - If any endpoint shape differs from this when read at implementation time, **stop and surface** rather than guessing.
  - List view: campaign name, member count, last-activity timestamp. Tap → detail.
  - Detail: name, narrative summary (rendered from `narrative.summary` if present, else "No narrative yet."), startDate (localized), status badge, member list (avatars from T8 if present), `Add member` action (deferred to follow-up — show disabled placeholder button with tooltip "Coming soon" — single allowed deferral, surfaced explicitly).
  - `+` FAB → create form. **Form must collect every required field — no field may be omitted just because the original mobile mock lacked it:**
    - `name` — single-line `Input`, required, min length 1, max 100.
    - `type` — `Select` (Tamagui Select primitive); options sourced from the wh40k10e plugin via `useGameSystem().campaignTypes` if exposed, else a hardcoded constant `['skirmish', 'narrative', 'matched-play']` (document the fallback in code).
    - `startDate` — date picker (use `@react-native-community/datetimepicker` or existing primitive in `src/mobile/src/components/ui/`); defaults to today; serialized as `YYYY-MM-DD` (ISO 8601 date).
    - `status` — `Select` with the four valid values from the validator; defaults to `'upcoming'`.
    - `narrative` — built automatically by the form: `{ schemaVersion: 1, summary: <multiline Input value> }`. The multiline Input is labeled "Narrative summary" and is optional; if blank, send `{ schemaVersion: 1 }`.
    - On submit: validate locally (required fields populated, startDate parseable, status in allowed set), POST, navigate to detail on success, show inline error toast on 4xx.
  - All copy via `formatMessage()` keys `mobile.campaigns.*` (including new keys for `type`, `startDate`, `status`, `narrative`, and validation error strings).
  **Must NOT do**: Implement member-management UX (deferred; only the disabled placeholder button ships). Do NOT cache campaign data beyond TanStack Query defaults. Do NOT modify web placeholder or Lambda code. Do NOT shorten the create form to omit any required backend field — the form is the canonical UX precisely because the web placeholder is empty.
  **Recommended Agent Profile**: `visual-engineering` + `frontend-ux-engineer`, `git-worktree-agent-workflow`
  **Parallelization**: Wave 4, deps T12+T15+T4.
  **References**:
  - `src/web/app/[locale]/wh40k10e/campaigns/page.tsx` — placeholder; route reservation only.
  - `src/services/campaigns/src/routes/campaigns.ts` — route handlers; confirms HTTP path/method shape.
  - `src/services/campaigns/src/utils/validation.ts` — `parseCreateCampaignRequest`; **canonical source of required fields and `VALID_CAMPAIGN_STATUSES`**.
  - `src/mobile/src/lib/queryClient.ts` — TanStack Query client (added in T4).
  - `src/mobile/src/components/ui/{Input,Button,Card,AlertDialog}.tsx` — primitives.
  - `@armoury/models` `CampaignStatus` type — re-export for the mobile form union type.
  **Acceptance Criteria**: List/detail/create round-trip works against Lambda (or mocked Lambda in test env) **with all required fields populated**; disabled "Add member" button visible on detail; no hardcoded strings; submitting with a missing required field shows inline validation error and does NOT POST.
  **QA Scenarios**:
  ```
  Scenario: Campaign create + detail (happy path with full required payload)
    Tool: Maestro + Bash (mock Lambda or staging)
    Preconditions: `@armoury/campaigns` reachable from test env (staging URL OR mock server returning the endpoint contract); logged-in test user
    Steps: Tap Campaigns tab; assert list loads (empty state acceptable); tap `+`; fill name=`Test Campaign`, type=`narrative`, startDate=today, status=`upcoming`, narrative summary=`E2E`; submit; assert POST body contains all five required fields with correct types (capture via mock server log); assert navigation to detail screen; assert name, status badge, and startDate visible; assert `Add member` button visible AND disabled (not tappable)
    Expected Result: Create succeeds (HTTP 201); detail renders; disabled button enforced
    Failure Indicators: POST 4xx; missing field in POST body; detail does not render; "Add member" button enabled
    Evidence: .sisyphus/evidence/task-19-campaign-create.png + .sisyphus/evidence/task-19-campaign-post-body.json
  ```
  ```
  Scenario: Create form rejects missing required field (negative)
    Tool: Maestro
    Preconditions: Same
    Steps: Tap `+`; leave `name` blank; fill other required fields; tap submit
    Expected Result: Inline validation error shown on `name`; no network POST occurs (assert via mock server: zero requests received).
    Failure Indicators: POST fires; navigation occurs; no error shown.
    Evidence: .sisyphus/evidence/task-19-campaign-create-validation.png
  ```
  **Commit**: YES — `feat(mobile/campaigns): real campaigns screen`

- [ ] 20. **Social/Allies screen (real implementation — mobile spec canonical)**

  **What to do**: Replace placeholder with friends/presence UI. **Web `src/web/app/[locale]/wh40k10e/social/page.tsx` is a placeholder; mobile defines canonical UX.** Reuses the existing `PresenceProvider` (already in mobile tree from prior work — confirm path before wiring).

  Concrete spec:
  - List of allies (friends). Each row: avatar (T8), display name, presence indicator (green=online, gray=offline) driven by `PresenceProvider` events.
  - `Invite` action in header → opens Share Sheet (uses T28's share wrapper if available; else `expo-sharing` directly). **Tokenized invites are explicitly OUT OF SCOPE for this plan** — repo grep confirms no invite endpoint or token implementation exists. Ship the Invite button sharing a static, tokenless app-install URL only: `https://armoury.app/install` (constant in `src/mobile/src/constants/links.ts` — create file). A follow-up plan owns the tokenized invite flow once the backend lands.
  - No chat, no DM, no friend requests UI (out of scope).
  - All copy via `formatMessage()` keys `mobile.social.*`.
  **Must NOT do**: Add chat, DMs, friend-request management, block lists, **or tokenized invites** (deferred — no backend endpoint exists). Do NOT modify `PresenceProvider` internals. Do NOT modify web placeholder.
  **Recommended Agent Profile**: `visual-engineering` + `frontend-ux-engineer`, `git-worktree-agent-workflow`
  **Parallelization**: Wave 4, deps T12+T15 (T8 if avatars rendered; T28 share wrapper is a soft dep — fall back to `expo-sharing` direct call if T28 hasn't landed).
  **References**:
  - `src/web/app/[locale]/wh40k10e/social/page.tsx` — placeholder; route reservation only.
  - Existing `PresenceProvider` in mobile tree — locate via `grep -r "PresenceProvider" src/mobile/`; **if not present, surface the gap and stop** (do not invent presence infrastructure).
  - `src/mobile/src/components/ui/Avatar.tsx` (T8) — friend row avatars.
  **Acceptance Criteria**: Friends list renders; presence indicator reacts to mocked presence event; Invite opens share sheet; no hardcoded strings.
  **QA Scenarios**:
  ```
  Scenario: Presence updates list badge
    Tool: Bash (vitest)
    Preconditions: `PresenceProvider` mocked to emit controllable presence events; component test renders the Allies screen with one seeded friend `friend-1`
    Steps: Render screen; emit `{ userId: 'friend-1', status: 'offline' }`; assert badge for `friend-1` resolves to gray (assert via testID `presence-badge-friend-1` and color token `gray.500`); emit `{ userId: 'friend-1', status: 'online' }`; assert badge resolves to green (`green.500`)
    Expected Result: Badge color reflects each emitted status
    Failure Indicators: Badge color does not change; component crashes on emit
    Evidence: .sisyphus/evidence/task-20-presence.log

  Scenario: Invite opens share sheet (tokenless install URL)
    Tool: Maestro
    Preconditions: Logged in; at least one ally row visible (or empty state with Invite button); `src/mobile/src/constants/links.ts` exports `INSTALL_URL = 'https://armoury.app/install'`
    Steps: Open Allies tab; tap `Invite` in header; assert OS share sheet appears (Maestro `assertVisible: "Share"` or platform-specific share UI element); assert share payload equals `INSTALL_URL` (capture via spied `Share.share` mock in companion vitest if Maestro cannot inspect payload)
    Expected Result: Share sheet visible; payload is the static install URL, no token
    Failure Indicators: No share sheet appears; tap is a no-op; payload contains `armoury://invite/`
    Evidence: .sisyphus/evidence/task-20-invite-sheet.png
  ```
  **Commit**: YES — `feat(mobile/social): real Allies screen`

- [ ] 21. **Armies screen parity refresh**

  > **RESOLVED (partial) — shared-code-migration T13**: Forge components and hooks (army
  > builder/editor UI) are now in `@armoury/feature-forge` (`src/shared/features/forge`).
  > The armies screen refresh should consume components from `@armoury/feature-forge` rather
  > than duplicating them. The provider wiring and screen-level integration remain in scope.

  **What to do**: Update `src/mobile/app/(tabs)/armies/index.tsx` to use new `useDataContext`, new UI primitives, new system components. Maintain feature parity with web armies.
  **Must NOT do**: Add army features absent from web.
  **Recommended Agent Profile**: `visual-engineering` + `frontend-ux-engineer`, `git-worktree-agent-workflow`
  **Parallelization**: Wave 4, deps T12+T15.
  **References**: web `src/web/app/[locale]/wh40k10e/armies/*`; current mobile `src/mobile/app/(tabs)/armies/index.tsx`.
  **Acceptance Criteria**: Existing army flows still pass Maestro; new providers wired.
  **QA Scenarios**:
  ```
  Scenario: Army list still works post-refresh
    Tool: Maestro
    Steps: Run existing armies flow
    Evidence: .sisyphus/evidence/task-21-armies.png
  ```
  **Commit**: YES — `refactor(mobile/armies): use new providers + UI kit`

- [ ] 22. **Account screen parity (DangerZone wiring + i18n labels)**

  **What to do**: Update `src/mobile/app/(tabs)/account/index.tsx` to render `ProfileSection`/`PreferencesSection`/`DangerZoneSection`; wrap subtree in `IntlProvider` so all labels resolve from the message catalog (T7) using the device default locale. **Locale switch UI is OUT OF SCOPE for this task — it ships in T24.**
  **Must NOT do**: Re-implement existing PreferencesSection (T16 refreshed it). Do NOT add a locale switcher control here (T24 adds it inside PreferencesSection).
  **Recommended Agent Profile**: `visual-engineering` + `frontend-ux-engineer`, `git-worktree-agent-workflow`
  **Parallelization**: Wave 4, deps T16+T7. (Independent of T24 — T22 only consumes the catalog from T7, not the switcher from T24.)
  **References**: `src/web/src/components/AccountSettingsContainer.tsx`, `src/web/src/components/AccountSettingsView.tsx`, `src/web/src/components/DangerZoneSection.tsx` for section composition; T7's `IntlProvider` + message catalog for label resolution.
  **Acceptance Criteria**: Account screen renders all 3 sections; every visible string resolves from the message catalog (no hardcoded English) for every locale shipped by web (currently `en` only); DangerZone confirmation dialog uses translated strings.
  **QA Scenarios**:
  ```
  Scenario: Account screen renders all sections with translated labels (en — currently the only shipped locale)
    Tool: Maestro
    Preconditions: Device locale = en, signed in
    Steps: Launch > navigate to Account tab; assert ProfileSection, PreferencesSection, DangerZoneSection are all visible; assert each section header text matches the en catalog value (not a fallback key like "account.profile.title")
    Expected Result: All three sections render; no untranslated keys (no raw dot-notation strings) visible
    Evidence: .sisyphus/evidence/task-22-en-render.png

  Scenario: No hardcoded English strings (catalog-only rendering)
    Tool: Bash (rg)
    Preconditions: T22 implementation merged
    Steps: Run `rg -n '"[A-Z][a-z]+ [a-z]+"' src/mobile/app/\\(tabs\\)/account/` (catches sentence-case literal strings outside the catalog)
    Expected Result: Zero matches OR every match is whitelisted (test fixture, key constant) with an inline comment justifying it
    Evidence: .sisyphus/evidence/task-22-hardcode-scan.log
  ```
  **Commit**: YES — `feat(mobile/account): full parity screen with DangerZone + i18n labels`

- [ ] 23. **Provider stack cutover in `_layout.tsx` (remove legacy providers)**

  **What to do**: Update `src/mobile/app/_layout.tsx` to wrap app in `DataContextManagerProvider` only (plus `AuthProvider`, `IntlProvider`, `PresenceProvider`, `SyncManifestProvider`). Delete `DataContextProvider.tsx` + `SyncQueueProvider.tsx` after grep confirms no remaining usages.
  **Must NOT do**: Leave legacy providers in tree "just in case".
  **Recommended Agent Profile**: `deep` + `git-worktree-agent-workflow`
  **Parallelization**: Wave 5, deps T12.
  **References**: PR 45 web `_layout` cutover (analogous).
  **Acceptance Criteria**: `grep -r DataContextProvider src/mobile` returns 0 (besides docs); app boots; Maestro smoke passes.
  **QA Scenarios**:
  ```
  Scenario: Boot smoke after cutover
    Tool: Maestro
    Steps: Launch; assert landing renders within 5s
    Evidence: .sisyphus/evidence/task-23-bootsmoke.png
  Scenario: Legacy providers removed
    Tool: Bash (grep)
    Steps: `grep -r "DataContextProvider\\|SyncQueueProvider" src/mobile/src/providers`; assert empty
    Evidence: .sisyphus/evidence/task-23-grep.log
  ```
  **Commit**: YES — `refactor(mobile): cut over to DataContextManagerProvider, remove legacy providers`

- [ ] 24. **Locale-aware layout integration + locale switch UI (single-locale ready)**

  **What to do**: Wire `IntlProvider` at root; add a locale switcher control in PreferencesSection driven by the catalog set from T7; persist user's choice to AsyncStorage under key `armoury.locale`; reflect on next boot. **The control enumerates whatever locales T7 ports — currently only `en`, so the control renders a single disabled-but-visible option labeled `English`.** Persistence + selection plumbing must be fully functional so adding a future locale to web requires zero mobile code changes.

  Also ship a **dev-only debug helper** `src/mobile/src/dev/dumpStorage.ts` that exports an async function reading every `armoury.*` key from AsyncStorage and writing the result to the device file system at `${FileSystem.cacheDirectory}/dump-storage.json`, then logs the absolute path to console. Expose it via a hidden Maestro-triggerable testID on the Preferences screen (`testID="dev-dump-storage"`, only mounted when `__DEV__ === true`). This helper is consumed by the T24 persistence QA scenario and may be reused by future tasks.
  **Must NOT do**: Server-route locales (mobile has no server). Do NOT hard-code a list of locales — the switcher MUST read from the same catalog index T7 produces. Do NOT ship placeholder locales (no `es-stub.json` etc.).
  **Recommended Agent Profile**: `visual-engineering` + `frontend-ux-engineer`, `git-worktree-agent-workflow`
  **Parallelization**: Wave 5, deps T7+T16.
  **References**: web locale switch (if any in `src/web/src/components/`); T7 catalog index.
  **Acceptance Criteria**: Switcher renders one option per shipped locale; selection persists across cold restarts; with only `en` shipped, the switcher renders exactly one option and selecting it is a no-op (and that no-op is verified, not skipped).
  **QA Scenarios**:
  ```
  Scenario: Switcher enumerates only shipped locales
    Tool: Maestro
    Preconditions: T7 merged with current web locale set (en only)
    Steps: Open Preferences; tap locale switcher; capture options list
    Expected Result: Exactly 1 option visible: `English`. Zero ghost/placeholder locales.
    Evidence: .sisyphus/evidence/task-24-switcher-options.png

  Scenario: Selection persists across cold restart
    Tool: Maestro
    Preconditions: App freshly installed, dev build (so `__DEV__` is true and the `dev-dump-storage` testID is mounted), single-locale (en) build
    Steps: Open Preferences > switcher > tap `English` (records selection); kill app process; relaunch; reopen Preferences; assert `English` is still the selected indicator; tap the hidden `testID="dev-dump-storage"` element to invoke the `dumpStorage` helper shipped in this task; pull the resulting `dump-storage.json` from the device cache directory via `adb pull` (Android) or `xcrun simctl` (iOS) into `.sisyphus/evidence/`; assert the JSON contains `{"armoury.locale":"en"}`
    Expected Result: Indicator and dumped AsyncStorage value both reflect `en` after restart
    Evidence: .sisyphus/evidence/task-24-localepersist.png + .sisyphus/evidence/task-24-asyncstorage.json
  ```
  **Commit**: YES — `feat(mobile/i18n): locale switch UI + persistence (single-locale ready)`
  **Recommended Agent Profile**: `visual-engineering` + `frontend-ux-engineer`, `git-worktree-agent-workflow`
  **Parallelization**: Wave 5, deps T7+T16.
  **References**: web locale switch.
  **Acceptance Criteria**: Locale switch persists across cold boot.
  **QA Scenarios**:
  ```
  Scenario: Locale persists across boot
    Tool: Maestro
    Steps: Switch locale; kill app; relaunch; assert locale unchanged
    Evidence: .sisyphus/evidence/task-24-localepersist.png
  ```
  **Commit**: YES — `feat(mobile/i18n): locale switch UI + persistence`

- [ ] 25. **Backend API integration audit (wahapedia/github proxies, BSData refresh)**

  **What to do**: Audit mobile data fetches: ensure they hit web Next.js API routes (`/api/wahapedia/*`, `/api/github/*`) with correct base URL config (env-driven). Replace any direct external calls. BSData runs as foreground refresh (no cron on mobile) — implement pull-to-refresh trigger.
  **Must NOT do**: Add mobile-only endpoints; modify web API.
  **Recommended Agent Profile**: `unspecified-high` + `git-worktree-agent-workflow`
  **Parallelization**: Wave 5, deps T23.
  **References**: `src/web/app/api/*` routes.
  **Acceptance Criteria**: All mobile fetches go through configured base URL; BSData refresh triggers on pull.
  **QA Scenarios**:
  ```
  Scenario: BSData refresh on pull-to-refresh hits the configured proxy
    Tool: Maestro + Bash (Metro/dev-server log capture)
    Preconditions: Mobile app running against a dev build with `EXPO_PUBLIC_API_BASE_URL` pointing at the local Next.js dev server; Metro and Next.js dev-server logs are being tee'd to files (`metro.log`, `next-dev.log`) by the test harness; References tab loaded.
    Steps:
      1. (Bash) Truncate `next-dev.log` to a known marker so the assertion window is bounded.
      2. (Maestro) Open References screen; perform pull-to-refresh; assert the refresh spinner appears then disappears.
      3. (Bash) `grep -E "GET /api/github/bsdata/" next-dev.log` AFTER the marker; capture matching lines.
    Expected Result: Spinner observed in Maestro screenshot AND ≥1 matching `/api/github/bsdata/` request line appears in `next-dev.log` after the marker.
    Failure Indicators: Spinner observed but zero matching log lines (mobile bypassed the proxy); OR matching log lines hit a different host (proxy mis-routing).
    Evidence: .sisyphus/evidence/task-25-bsdata.png + .sisyphus/evidence/task-25-bsdata-proxy.log

  Scenario: No direct external calls from mobile source
    Tool: Bash (rg)
    Preconditions: T25 implementation merged.
    Steps: Run `rg -n "raw\\.githubusercontent\\.com|wahapedia\\.ru" src/mobile/src src/mobile/app`
    Expected Result: Zero matches.
    Failure Indicators: Any non-test, non-comment match indicating a direct external fetch.
    Evidence: .sisyphus/evidence/task-25-grep.log
  ```
  **Commit**: YES — `feat(mobile): route data through web API + foreground BSData refresh`

- [ ] 26. **`useGameSystem` wiring across screens**

  **What to do**: Replace any hardcoded system references in screens with `useGameSystem()`. Audit mobile screens after T17–T22.
  **Must NOT do**: Touch component internals beyond hook adoption.
  **Recommended Agent Profile**: `quick` + `git-worktree-agent-workflow`
  **Parallelization**: Wave 5, deps T5+T17–T22.
  **References**: `src/mobile/src/hooks/useGameSystem.ts`.
  **Acceptance Criteria**: `grep "wh40k10e" src/mobile/app` returns only path patterns, not hardcoded logic.
  **QA Scenarios**:
  ```
  Scenario: System derived from path
    Tool: Bash (grep + vitest)
    Steps: grep mobile screens; assert no hardcoded system IDs in conditionals
    Evidence: .sisyphus/evidence/task-26-grep.log
  ```
  **Commit**: YES — `refactor(mobile): adopt useGameSystem across screens`

- [ ] 27. **Mobile-specific lifecycle smoke (background→foreground, lock screen, low memory)**

  **What to do**: Add Vitest covering AppState transitions: background → suspend, foreground → reconcile, low-memory warning → cache trim. Add a Maestro flow simulating background→foreground.
  **Must NOT do**: Test iOS-only or Android-only behaviors as cross-platform.
  **Recommended Agent Profile**: `deep` + `git-worktree-agent-workflow`
  **Parallelization**: Wave 5, deps T23.
  **References**: `MobileDataContextManager` (T6).
  **Acceptance Criteria**: All 3 lifecycle transitions covered; Maestro flow passes.
  **QA Scenarios**:
  ```
  Scenario: Background then foreground
    Tool: Maestro
    Steps: Login; sync; press home; wait 30s; reopen; assert no error toast, sync resumes
    Evidence: .sisyphus/evidence/task-27-bgfg.png
  ```
  **Commit**: YES — `test(mobile): cover lifecycle transitions`

- [ ] 28. **Native enhancements bundle (haptics, gestures, push notifications, deep links, share sheets)**

  **What to do**: Add cross-cutting native modules:
  - Haptics: `expo-haptics` wrapper invoked on key actions (delete, save, sync complete).
  - Gestures: `react-native-gesture-handler` wrappers for swipe-to-delete on lists.
  - Push notifications: `expo-notifications` registration; backend topics for "sync complete" + "presence change" only.
  - Deep links: `expo-linking` configuration for `armoury://armies/:id`. (Tokenized invite links are explicitly out of scope — no backend endpoint exists; see T20.)
  - Share sheets: `expo-sharing` wrapper invoked from army detail.
  **Must NOT do**: Add chat, in-app purchase, or other native features outside the listed five.
  **Recommended Agent Profile**: `unspecified-high` + `frontend-ux-engineer`, `accessibility`, `git-worktree-agent-workflow`
  **Parallelization**: Wave 5, deps T23.
  **References**: Expo docs for each module.
  **Acceptance Criteria**: All 5 modules wired with at least one usage site each; Maestro flow per enhancement.
  **QA Scenarios**:
  ```
  Scenario: Deep link opens army
    Tool: Maestro
    Preconditions: Dev build installed; an army with id `test-id` seeded
    Steps: Trigger `armoury://armies/test-id` via `maestro launch armoury://armies/test-id`; wait for army detail screen
    Expected Result: Army detail screen renders with the seeded army's name visible (asserted via testID on the title)
    Evidence: .sisyphus/evidence/task-28-deeplink.png

  Scenario: Haptic on save
    Tool: Bash (vitest spy on expo-haptics)
    Preconditions: Vitest config mocks `expo-haptics`
    Steps: Render save flow; trigger save; assert `Haptics.impactAsync` called exactly once with `Haptics.ImpactFeedbackStyle.Medium`
    Expected Result: Spy assertion passes
    Evidence: .sisyphus/evidence/task-28-haptic.log

  Scenario: Push notification registers
    Tool: Bash (vitest)
    Preconditions: Vitest mocks `expo-notifications`
    Steps: Simulate post-login boot; assert `Notifications.registerForPushNotificationsAsync` called once
    Expected Result: Spy assertion passes
    Evidence: .sisyphus/evidence/task-28-pushreg.log

  Scenario: Swipe-to-delete gesture removes army from list
    Tool: Maestro
    Preconditions: Logged in; armies list contains a seeded army `test-army-swipe`
    Steps: Open armies list; perform `swipe` gesture (left direction) on the row containing `test-army-swipe`; assert a `Delete` action button becomes visible; tap `Delete`; confirm in alert dialog
    Expected Result: The `test-army-swipe` row is no longer present in the list (asserted via Maestro `assertNotVisible`); a screenshot before-and-after confirms the row removal
    Failure Indicators: Swipe produces no visible action; row remains after delete confirmation
    Evidence: .sisyphus/evidence/task-28-gesture-before.png + .sisyphus/evidence/task-28-gesture-after.png

  Scenario: Share sheet invocation from army detail
    Tool: Maestro + Bash (Metro/dev-server log capture)
    Preconditions: Dev build with Metro logs tee'd to `metro.log`; `expo-sharing` wrapper instrumented in dev to log `[share-sheet] invoked path=<path>` to console; logged in; an army with id `test-id` opened
    Steps:
      1. (Bash) Truncate `metro.log` marker.
      2. (Maestro) Tap the `share` button on army detail (`testID="army-share"`).
      3. (Maestro) Take screenshot of the OS share sheet appearing (assert visibility of either iOS `UIActivityViewController` or Android share intent picker via accessibility ID / `assertVisible: "Share"`).
      4. (Bash) `grep "\\[share-sheet\\] invoked" metro.log` after the marker.
    Expected Result: Screenshot shows the OS share sheet AND the Metro log contains exactly one `[share-sheet] invoked` line.
    Failure Indicators: Tap produces no system share sheet OR no log line (indicates the wrapper was not called).
    Evidence: .sisyphus/evidence/task-28-sharesheet.png + .sisyphus/evidence/task-28-sharesheet.log
  ```
  **Commit**: YES — `feat(mobile/native): haptics + gestures + push + deep links + share`

- [ ] 29. **Maestro flow expansion (per-screen + locale + deep link + danger zone)**

  **What to do**: Author/refresh `src/mobile/e2e/flows/*.yaml` flows: per-screen smoke, locale switch, deep link, danger zone delete. Wire to CI via the existing `src/mobile/e2e/scripts/run-all.sh` runner (no new runner script needed).
  **Must NOT do**: Run flows requiring physical device features unavailable in CI. Do NOT introduce a parallel `.maestro/` directory — all flows live under `src/mobile/e2e/flows/`.
  **Recommended Agent Profile**: `unspecified-high` + `git-worktree-agent-workflow`
  **Parallelization**: Wave 6, deps T17–T28.
  **References**: existing Maestro flows in `src/mobile/e2e/flows/` (`army-creation.yaml`, `army-delete.yaml`, `army-list.yaml`, `data-sync.yaml`, `common/`); runner at `src/mobile/e2e/scripts/run-all.sh`.
  **Acceptance Criteria**: All flows pass locally via `bash src/mobile/e2e/scripts/run-all.sh`; CI job green.
  **QA Scenarios**:
  ```
  Scenario: Full Maestro suite
    Tool: Bash (maestro test via runner)
    Preconditions: Mobile app booted in simulator, all parity tasks T17-T28 merged
    Steps: `bash src/mobile/e2e/scripts/run-all.sh` (which iterates `src/mobile/e2e/flows/*.yaml`)
    Expected Result: Runner exits 0; every flow logs "Flow PASSED"; zero "Flow FAILED" lines in output
    Failure Indicators: Non-zero exit, "Flow FAILED" anywhere in stdout, missing screenshot artifacts
    Evidence: .sisyphus/evidence/task-29-maestro.log
  ```
  **Commit**: YES — `test(mobile): expand Maestro coverage to parity screens`

- [ ] 30. **Vitest sweep + coverage report**

  **What to do**: Run `npm run test --workspace=@armoury/mobile -- --coverage`. Fix any failing tests. Document coverage delta vs pre-parity.
  **Must NOT do**: Lower coverage thresholds.
  **Recommended Agent Profile**: `quick` + `git-worktree-agent-workflow`
  **Parallelization**: Wave 6, deps T17–T28.
  **References**: `src/tooling/vitest`.
  **Acceptance Criteria**: Tests green; coverage report generated.
  **QA Scenarios**:
  ```
  Scenario: Coverage report
    Tool: Bash
    Steps: Run coverage; assert exit 0; archive report
    Evidence: .sisyphus/evidence/task-30-coverage.log
  ```
  **Commit**: YES — `test(mobile): coverage sweep post-parity`

- [ ] 31. **Mobile architecture doc**

  **What to do**: Add `docs/mobile/ARCHITECTURE.md` documenting: provider stack, `MobileDataContextManager` lifecycle, AppState handling, i18n strategy, native enhancements, deep link scheme, push notification topics. Mirror the layout of `docs/services/` docs.
  **Must NOT do**: Duplicate `docs/CODING_STANDARDS.md` content.
  **Recommended Agent Profile**: `writing` + `docs-writer`, `docs-guardian`, `git-worktree-agent-workflow`
  **Parallelization**: Wave 6, deps T23+T28.
  **References**: `docs/services/INDEX.md` and one concrete service doc directory (e.g. `docs/services/campaigns/`) — mirror their layout (overview, architecture, lifecycle, links section). `docs/adr/` does not exist in this repo; do **not** create an ADR as part of this task.
  **Acceptance Criteria**: Doc passes `docs-guardian` checks; linked from root `README.md`.
  **QA Scenarios**:
  ```
  Scenario: Doc renders + cross-links resolve
    Tool: Bash (markdown-link-check)
    Steps: Lint links in `docs/mobile/ARCHITECTURE.md`
    Evidence: .sisyphus/evidence/task-31-doclint.log
  ```
  **Commit**: YES — `docs(mobile): add architecture overview`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
>
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists. For each "Must NOT Have": search codebase for forbidden patterns (PGlite imports in mobile, parallel legacy providers, mobile-only endpoints, etc.) — reject with file:line if found. Check evidence files exist in `.sisyphus/evidence/`. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`
  **QA Scenarios**:
  ```
  Scenario: Forbidden patterns audit
    Tool: Bash (rg)
    Preconditions: All tasks T1-T31 marked complete
    Steps: Run `rg -n "@electric-sql/pglite|DataContextProvider|SyncQueueProvider" src/mobile/src/` and `rg -n "from ['\"]@armoury/data['\"]" src/mobile/src/`
    Expected Result: Zero matches for PGlite imports in mobile; zero matches for legacy provider imports; only allowed `@armoury/data` import sites match the cutover spec
    Failure Indicators: Any match in mobile source; any retained legacy provider reference outside removal commits
    Evidence: .sisyphus/evidence/final-f1-forbidden-scan.log

  Scenario: Evidence completeness audit
    Tool: Bash
    Preconditions: All task evidence written
    Steps: For each task N in 1..31, assert at least one file matching `.sisyphus/evidence/task-{N}-*` exists and is non-empty
    Expected Result: 31/31 tasks have ≥1 non-empty evidence artifact
    Evidence: .sisyphus/evidence/final-f1-evidence-manifest.log
  ```

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npm run typecheck`, `npm run lint`, `npm run test` on `@armoury/mobile`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names. Verify `@requirements` blocks present.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`
  **QA Scenarios**:
  ```
  Scenario: Typecheck + lint + test green
    Tool: Bash
    Preconditions: Cutover task T23 merged
    Steps: Run `npm run typecheck --workspace=@armoury/mobile` then `npm run lint --workspace=@armoury/mobile` then `npm run test --workspace=@armoury/mobile`
    Expected Result: All three commands exit 0; lint reports 0 errors / 0 warnings; vitest summary shows `0 failed` and no unexplained skips
    Failure Indicators: Any non-zero exit; any TS error; any lint error; any failed test
    Evidence: .sisyphus/evidence/final-f2-quality.log

  Scenario: AI-slop and forbidden-construct scan
    Tool: Bash (rg)
    Preconditions: Same as above
    Steps: Run `rg -n "as any|@ts-ignore|catch.*\{\s*\}|console\.log" src/mobile/src/` and `rg -L "@requirements" src/mobile/src/**/*.ts src/mobile/src/**/*.tsx`
    Expected Result: Zero matches for `as any` / `@ts-ignore` / empty catches / `console.log`; zero source files missing `@requirements` block
    Evidence: .sisyphus/evidence/final-f2-slop-scan.log
  ```

- [ ] F3. **Real Manual QA** — `unspecified-high`
  Boot mobile app via `expo start` in tmux. Execute EVERY Maestro flow. Verify: single SQLiteAdapter ID across screen transitions, locale switch persists, all 6 tabs render real content, account deletion flow completes, deep link opens correct army, push notification renders. Save evidence to `.sisyphus/evidence/final-qa/`.
  Output: `Flows [N/N pass] | Single Adapter [VERIFIED/FAIL] | Tabs [6/6 real] | VERDICT`
  **QA Scenarios**:
  ```
  Scenario: Full Maestro suite + adapter-identity proof
    Tool: interactive_bash (tmux) + Bash (maestro)
    Preconditions: iOS simulator booted; backend reachable; `expo start` running in a tmux pane
    Steps:
      1. Start `expo start --ios` in tmux pane `mobile-qa`; wait for "Bundling complete"
      2. Run `bash src/mobile/e2e/scripts/run-all.sh` and capture full stdout
      3. Tail metro logs and grep for `SQLiteAdapter id=`; collect every distinct id observed during the run
    Expected Result: Runner exits 0; every flow logs `Flow PASSED`; exactly ONE distinct `SQLiteAdapter id=` value appears across the entire session
    Failure Indicators: ≥2 distinct adapter ids; any `Flow FAILED`; non-zero runner exit
    Evidence: .sisyphus/evidence/final-qa/maestro-run.log + .sisyphus/evidence/final-qa/adapter-ids.log

  Scenario: Tab census + placeholder absence
    Tool: Maestro
    Preconditions: App at home screen post-login
    Steps: Tap each of the 6 tabs in sequence; assert each renders a content element (not the placeholder text "Coming soon" / "TODO" / empty state without data)
    Expected Result: 6/6 tabs render real content; zero placeholder strings observed
    Evidence: .sisyphus/evidence/final-qa/tab-census/
  ```

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance per task. Detect cross-task contamination. Flag unaccounted changes (web edits, shared edits beyond T1).
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`
  **QA Scenarios**:
  ```
  Scenario: Per-task diff scope audit (file-path mapping, no commit-message dependency)
    Tool: Bash (git + node)
    Preconditions: All task implementation work landed on the parity branch; commit messages follow the plan's Commit Strategy (semantic, no `task-N` token required)
    Steps:
      1. Build a path-allowlist map by parsing this plan: for each task N, extract every file path mentioned in its "What to do", "References", and "Commit Strategy" sections (the Commit Strategy block at the bottom of the plan lists `**TN**: <message> — <paths>` for every committing task).
      2. Run `git diff --name-only $(git merge-base main HEAD)..HEAD` to get every file changed on the branch.
      3. For each changed file, find the task(s) whose allowlist contains it (or a parent directory glob, e.g. `src/mobile/src/i18n/*` covers `src/mobile/src/i18n/messages/en.json`).
      4. Emit two lists: `mapped` (file → task N) and `unmapped` (file with no owning task).
    Expected Result: `unmapped` list is empty; every changed file maps to ≥1 task spec entry.
    Failure Indicators: Any file in `unmapped`; any task in the plan with zero changed files attributable to it (indicates missing implementation).
    Evidence: .sisyphus/evidence/final-f4-scope-map.log (full mapped/unmapped report)

  Scenario: Out-of-scope edit detection (web/shared beyond explicitly allowed paths)
    Tool: Bash (git)
    Preconditions: Same
    Steps: Run `git diff --name-only main... -- src/web/ src/shared/` and exclude paths covered by T1 AND the explicitly allowed cross-workspace edits listed below.
    Allowed cross-workspace edits (NOT a violation when present):
      - `src/shared/data/context/src/*` — T1 only (documentation of `ownsAdapter` contract).
      - `src/web/messages/*.json` — T7, T17, T18, T19, T20, T22 (web is the i18n source of truth; new `mobile.*` keys MUST land here and are then mechanically regenerated to `src/mobile/src/i18n/messages/*` by `src/mobile/scripts/sync-i18n.mjs`).
      - `src/shared/data/context/src/DataContextBuilder.ts` (and only this file) — T17 only, IF and only IF a matches accessor (`list/create/delete`) is genuinely missing; the task body requires the implementer to **stop and surface** rather than invent unrelated API.
      - `src/systems/wh40k10e/src/*` — T18 only, IF and only IF the references accessor is genuinely missing on the game-system plugin.
    Expected Result: Empty diff output AFTER the allowlist above is applied.
    Failure Indicators: Any web or shared file changed outside this allowlist; any allowed file changed by a task NOT listed in its allowlist row.
    Evidence: .sisyphus/evidence/final-f4-cross-workspace-diff.log (raw diff) + .sisyphus/evidence/final-f4-cross-workspace-allowlist.log (post-allowlist filtered diff, MUST be empty)
  ```

---

## Commit Strategy

Each task ships an atomic commit. Group commits land via the worktree workflow per `git-worktree-agent-workflow` skill.

- **T1**: `feat(data-context): document ownsAdapter contract for mobile parity` — `src/shared/data/context/src/*`
- **T2**: `feat(mobile): scaffold i18n with expo-localization + react-intl` — `src/mobile/src/i18n/*`
- **T3**: `feat(mobile/ui): add Tamagui primitives batch 1 (Button, Card, Input, Label)` — `src/mobile/src/components/ui/*`
- **T4**: `feat(mobile/lib): add auth0/auth0SpaClient/queryClient/utils parity` — `src/mobile/src/lib/*`
- **T5**: `feat(mobile/hooks): add useGameSystem hook` — `src/mobile/src/hooks/useGameSystem.ts`
- **T6**: `feat(mobile/data): add MobileDataContextManager with SQLite ownership + AppState` — `src/mobile/src/data/MobileDataContextManager.ts`
- **T7**: `feat(mobile/i18n): mirror web message catalog via generator + CI parity check` — `src/mobile/src/i18n/messages/*`, `src/mobile/scripts/sync-i18n.mjs`, `src/mobile/package.json`
- **T8**: `feat(mobile/ui): add Avatar primitive` — `src/mobile/src/components/ui/Avatar.tsx`
- **T9**: `feat(mobile/ui): add Select primitive` — `src/mobile/src/components/ui/Select.tsx`
- **T10**: `feat(mobile/ui): add AlertDialog primitive` — `src/mobile/src/components/ui/AlertDialog.tsx`
- **T11**: `feat(mobile/data): add useDataContext hook backed by MobileDataContextManager` — `src/mobile/src/data/useDataContext.ts`
- **T12**: `feat(mobile/providers): add DataContextManagerProvider mounting MobileDataContextManager at root` — `src/mobile/src/providers/DataContextManagerProvider.tsx`, `src/mobile/app/_layout.tsx`
- **T13**: `feat(mobile/landing): real landing screen with auth + unauth states` — `src/mobile/app/index.tsx`, `src/mobile/src/components/landing/*`
- **T14**: `feat(mobile/navigation): tablet side nav + responsive shell` — `src/mobile/app/(tabs)/_layout.tsx`, `src/mobile/src/components/navigation/*`
- **T15**: `feat(mobile/system): port system components (gate, auto-restore, grid, tile, progress)` — `src/mobile/src/components/system/*`
- **T16**: `feat(mobile/account): port DangerZone + Profile + Preferences sections` — `src/mobile/src/components/account/*`, `src/mobile/app/(tabs)/account/*`
- **T17**: `feat(mobile/matches): real War Ledger screen` — `src/mobile/app/(tabs)/matches/*`, `src/mobile/src/components/matches/*`
- **T18**: `feat(mobile/references): real references screen` — `src/mobile/app/(tabs)/references/*`, `src/mobile/src/components/references/*`
- **T19**: `feat(mobile/campaigns): real campaigns screen` — `src/mobile/app/(tabs)/campaigns/*`, `src/mobile/src/components/campaigns/*`
- **T20**: `feat(mobile/social): real Allies screen` — `src/mobile/app/(tabs)/social/*`, `src/mobile/src/components/social/*`, `src/mobile/src/constants/links.ts`
- **T21**: `refactor(mobile/armies): refresh armies screen against new useDataContext` — `src/mobile/app/(tabs)/armies/*`, `src/mobile/src/components/armies/*`
- **T22**: `feat(mobile/i18n): wrap app in IntlProvider + replace hardcoded strings` — `src/mobile/app/_layout.tsx`, `src/mobile/src/**/*.tsx` (translation-only edits)
- **T23**: `refactor(mobile): cut over to DataContextManagerProvider, remove legacy providers` — `src/mobile/app/_layout.tsx`, `src/mobile/src/data/*` (delete legacy `DataContextProvider`/`SyncQueueProvider`)
- **T24**: `feat(mobile/preferences): locale switch UI + persistence + dev dumpStorage helper` — `src/mobile/src/components/account/PreferencesSection.tsx`, `src/mobile/src/dev/dumpStorage.ts`
- **T25**: `feat(mobile/data): bsdata catalog browser via web proxy endpoint` — `src/mobile/src/components/bsdata/*`, `src/mobile/src/lib/bsdata.ts`
- **T26**: `chore(mobile): remove legacy provider grep targets` — `src/mobile/src/**/*` (deletions only)
- **T27**: `feat(mobile/data): foreground/background sync coordination` — `src/mobile/src/data/MobileDataContextManager.ts`
- **T28**: `feat(mobile/native): haptics + gestures + push + deep links + share` — `src/mobile/src/native/*`, `src/mobile/app.config.ts`, `src/mobile/src/components/armies/ArmyDetail.tsx`
- **T29**: `test(mobile/e2e): expand Maestro flows (per-screen + locale + deep link + danger zone)` — `src/mobile/e2e/flows/*`
- **T30**: `test(mobile): coverage uplift on data + components` — `src/mobile/src/**/*.test.ts(x)`
- **T31**: `docs(mobile): add architecture overview` — `docs/mobile/ARCHITECTURE.md` (new), `README.md` (add link under Documentation section)
- **Cutover (T23)** is the single hard-cut commit; no parallel providers ship before or after it.

---

## Success Criteria

### Verification Commands
```bash
npm run typecheck --workspace=@armoury/mobile  # Expected: 0 errors
npm run lint --workspace=@armoury/mobile        # Expected: 0 errors
npm run test --workspace=@armoury/mobile        # Expected: all green
bash src/mobile/e2e/scripts/run-all.sh        # Expected: all flows pass (exit 0)
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] All Maestro flows pass
- [ ] Single SQLiteAdapter ID logged across screen transitions
- [ ] Zero placeholder tabs remain
- [ ] i18n catalog parity with web verified
- [ ] All evidence files present in `.sisyphus/evidence/`
