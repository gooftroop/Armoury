# Frontend Implementation Plan

Master orchestration document. All detail lives in sub-documents linked below.
State management architecture is documented in [STATE_MANAGEMENT.md](plan/STATE_MANAGEMENT.md).
Verified story total: **180 mapped + 3 orphaned = 183**.

---

## 1. Phase Timeline

| Phase                              | Document                                                                | Weeks                        | Stories | UX Issues | Conflicts        |
| ---------------------------------- | ----------------------------------------------------------------------- | ---------------------------- | ------- | --------- | ---------------- |
| **Phase 0 — Shared Prerequisites** | [PHASE_0_SHARED_PREREQUISITES.md](plan/PHASE_0_SHARED_PREREQUISITES.md) | 1–2 (parallel w/ P1, Shared) | —       | —         | —                |
| Shared Components                  | [SHARED_COMPONENTS.md](plan/SHARED_COMPONENTS.md)                       | 1–4 (parallel w/ P0, P1)     | 23      | 31        | C-04, C-05       |
| Phase 1 — Foundation               | [PHASE_1_FOUNDATION.md](plan/PHASE_1_FOUNDATION.md)                     | 1–4                          | 12      | 8         | C-03             |
| Phase 2 — Army Builder             | [PHASE_2_ARMY_BUILDER.md](plan/PHASE_2_ARMY_BUILDER.md)                 | 5–7                          | 36      | 26        | C-05             |
| Phase 3 — Match                    | [PHASE_3_MATCH.md](plan/PHASE_3_MATCH.md)                               | 8–13                         | 61      | 43        | C-01, C-02, C-07 |
| Phase 4 — Campaigns                | [PHASE_4_CAMPAIGNS.md](plan/PHASE_4_CAMPAIGNS.md)                       | 14–17                        | 34      | 22        | C-06, C-07       |
| Phase 5 — Reference                | [PHASE_5_REFERENCE.md](plan/PHASE_5_REFERENCE.md)                       | 18–20                        | 17      | 6         | C-03, C-04       |
| **Total**                          |                                                                         | **20 weeks**                 | **183** | **136**   | **7**            |
| **Cross-cutting**                  | [STATE_MANAGEMENT.md](plan/STATE_MANAGEMENT.md)                         | 1–20                         | —       | —         | —                |

> Phase 0, Shared Components, and Phase 1 overlap (Weeks 1–4). Phase 0 contracts must be merged before Phase 2+ code lands. Phases 4 and 5 can begin in parallel after Phase 3. See also [BLOCKING_DEPENDENCIES.md](plan/BLOCKING_DEPENDENCIES.md) for the full dependency graph and resolution order.

---

## 2. Hard Constraints

| ID  | Constraint                                                                                                                              |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- |
| A   | Reference context drawer: all unit data, read-only, no model list, no HP bar                                                            |
| B   | Builder context drawer: model list visible, wargear editable, no HP bar                                                                 |
| C   | Match context drawer: model list with HP bar, composition locked, wargear read-only                                                     |
| D   | Basic vs Guided modes share unit list; differ only in phase-relevant state display                                                      |
| E   | Drawer layout is visually consistent across all three contexts                                                                          |
| F   | App shell and navigation are game-agnostic; no direct game-system imports. The Unit Detail Drawer is implemented directly for wh40k10e. |

---

## 3. Architectural Conflict Resolutions

| ID   | Topic                                         | Resolution                                                                        | Resolved In                                         |
| ---- | --------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------- |
| C-01 | Match Creation — Drawer vs Page               | Right-rail drawer, not a full page                                                | [PHASE_3_MATCH.md](plan/PHASE_3_MATCH.md)           |
| C-02 | Real-Time Sync — Polling vs WebSocket         | V1: polling with abstraction layer; WebSocket migration deferred to later version | [PHASE_3_MATCH.md](plan/PHASE_3_MATCH.md)           |
| C-03 | Auth Gating — References unauthenticated      | References public, builder/match require auth                                     | [PHASE_1_FOUNDATION.md](plan/PHASE_1_FOUNDATION.md) |
| C-04 | Theme Toggle — Dark-only vs Light/Dark        | Dark-only in V1; toggle deferred                                                  | [SHARED_COMPONENTS.md](plan/SHARED_COMPONENTS.md)   |
| C-05 | Unit Detail Drawer — Add-Unit Modal vs Drawer | Shared drawer across add-unit and army builder                                    | [SHARED_COMPONENTS.md](plan/SHARED_COMPONENTS.md)   |
| C-06 | Campaign Creation — Friends Selector          | Friends selector removed from creation; manage in §7.6                            | [PHASE_4_CAMPAIGNS.md](plan/PHASE_4_CAMPAIGNS.md)   |
| C-07 | Match Creation from Deploy — Army Selector    | Army selector omitted when armyId provided in context; contextual rendering       | [PHASE_3_MATCH.md](plan/PHASE_3_MATCH.md)           |

---

## 4. Business Logic Architecture

The orchestrational/render split (BEST_PRACTICES.md §7) prevents **UI spaghetti** — components that mix data fetching with rendering. But it does not prevent **logic spaghetti** — hooks, utilities, or orchestrational components that accumulate hundreds of lines of unstructured conditionals, transformations, and decision logic.

This section defines how agents must structure business logic itself.

### 4a. Extraction Signals

Extract business logic into a dedicated module in `src/shared/clients/` when **any** of the following are true:

| Signal                     | Threshold                                                                     | Action                                               |
| -------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------- |
| Conditional nesting        | ≥ 3 levels of `if`/`switch`/ternary                                           | Extract to a named function or decision engine       |
| Function/hook length       | > 60 lines of logic (excluding imports, types, JSX)                           | Split into composable functions                      |
| Duplicated branching       | Same condition checked in 2+ places                                           | Extract to a shared predicate or strategy            |
| Testing requires rendering | Business logic can only be tested by mounting a component                     | Extract to pure TypeScript in `src/shared/clients/` |
| Multiple concerns          | A single function handles validation AND transformation AND state transitions | Split into one function per concern                  |

When in doubt, ask: _"Can I unit-test this logic by importing a plain function, without rendering anything?"_ If no, extract.

### 4b. Pattern Ladder

Choose the simplest pattern that fits. Escalate only when the simpler option creates duplication or unreadable code.

```
Pure Function  →  Predicate/Guard  →  Strategy Map  →  State Machine  →  Decision Engine
  (simplest)                                                               (most complex)
```

| Pattern               | When to Use                                                             | Shape                                              | Example Context                                                     |
| --------------------- | ----------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------- |
| **Pure function**     | Single transformation, no branching or 1-level branching                | `(input) => output`                                | `calculatePointsTotal(units)`                                       |
| **Predicate / guard** | Boolean decision reused across components                               | `(input) => boolean`                               | `canDeployUnit(unit, phase)`, `isArmyValid(army)`                   |
| **Strategy map**      | 3+ behavior variants keyed by a discriminator (mode, phase, role)       | `Record<Key, (ctx) => Result>`                     | Match phase display logic, drawer mode rendering rules              |
| **State machine**     | Ordered phases with legal transitions and guards                        | Explicit state + transition table                  | Match flow (setup → deploy → battle → conclusion)                   |
| **Decision engine**   | Complex multi-factor decisions with many inputs and cross-cutting rules | Class or module with `evaluate(context): Decision` | Unit eligibility (faction, detachment, points, slots, restrictions) |

### 4c. Concrete Examples

**Pure function** — simple extraction:

```typescript
// src/shared/clients/matches/src/scoring.ts
export function calculateVictoryPoints(primaryScore: number, secondaryScores: ReadonlyArray<SecondaryScore>): number {
    return primaryScore + secondaryScores.reduce((sum, s) => sum + s.points, 0);
}
```

**Strategy map** — replacing nested conditionals:

```typescript
// ❌ Before: nested conditionals in a hook
function getDrawerConfig(mode: DrawerMode, unit: Unit) {
    if (mode === 'reference') {
        return { showModels: false, showHpBar: false, editable: false };
    } else if (mode === 'builder') {
        if (unit.models.length > 1) {
            return { showModels: true, showHpBar: false, editable: true };
        }
        return { showModels: false, showHpBar: false, editable: true };
    } else if (mode === 'match') {
        return { showModels: true, showHpBar: true, editable: false };
    }
    // ... grows with every new mode
}

// ✅ After: strategy map in src/shared/clients/
// src/shared/clients/matches/src/drawerConfig.ts
import type { DrawerMode, Unit, DrawerConfig } from '@armoury/models';

const strategies: Record<DrawerMode, (unit: Unit) => DrawerConfig> = {
    reference: () => ({ showModels: false, showHpBar: false, editable: false }),
    builder: (unit) => ({
        showModels: unit.models.length > 1,
        showHpBar: false,
        editable: true,
    }),
    match: () => ({ showModels: true, showHpBar: true, editable: false }),
};

export function resolveDrawerConfig(mode: DrawerMode, unit: Unit): DrawerConfig {
    return strategies[mode](unit);
}
```

**State machine** — match phase transitions:

```typescript
// src/shared/clients/matches/src/matchPhase.ts
import type { MatchPhase } from '@armoury/models';

const transitions: Record<MatchPhase, ReadonlyArray<MatchPhase>> = {
    setup: ['deployment'],
    deployment: ['battle'],
    battle: ['battle', 'conclusion'], // battle loops (rounds)
    conclusion: [], // terminal
};

export function canTransition(from: MatchPhase, to: MatchPhase): boolean {
    return transitions[from].includes(to);
}

export function nextPhases(current: MatchPhase): ReadonlyArray<MatchPhase> {
    return transitions[current];
}
```

### 4d. Where Extracted Logic Lives

| Logic Type                   | Location                                | Why                                                   |
| ---------------------------- | --------------------------------------- | ----------------------------------------------------- |
| Game-agnostic business logic | `src/shared/clients/<domain>/src/`      | Shared by web + mobile, pure TypeScript, no React     |
| Game-specific business logic | `src/systems/src/<game>/<domain>/`      | Plugin-scoped, game-specific rules                    |
| React hook wiring            | `src/web/hooks/` or `src/mobile/hooks/` | Platform-specific, consumes extracted logic           |
| Orchestrational components   | `src/web/` or `src/mobile/`             | Platform-specific, composes hooks + render components |

The boundary is: **logic that can be expressed without React imports goes in `src/shared/clients/` or `src/systems/`**. Hooks and components consume that logic — they don't contain it.

### 4e. Anti-Pattern: The Monolithic Hook

```typescript
// ❌ This hook will grow to 300+ lines as match features are added.
// It handles data fetching, phase logic, scoring, validation, and UI state.
function useMatchState(matchId: string) {
    const stream = useContext(MatchStreamContext);
    const queryClient = useQueryClient();
    const [phase, setPhase] = useState<MatchPhase>('setup');
    const [scores, setScores] = useState<Scores>(emptyScores);

    useEffect(() => {
        const sub = stream.match$(matchId).subscribe((match) => {
            // 80 lines: validate phase transitions
            // 40 lines: recalculate scores
            // 30 lines: determine which UI panels to show
            // 20 lines: handle errors and edge cases
            setPhase(/* ... */);
            setScores(/* ... */);
        });
        return () => sub.unsubscribe();
    }, [matchId]);

    return { phase, scores /* 12 more fields */ };
}
```

The fix is not "make the hook shorter" — it's **extract the logic into testable modules**:

```typescript
// ✅ The hook becomes thin wiring; logic lives in pure functions.
import { canTransition, nextPhases } from '@armoury/clients-matches';
import { calculateVictoryPoints } from '@armoury/clients-matches';
import { resolveVisiblePanels } from '@armoury/clients-matches';

function useMatchState(matchId: string) {
    const stream = useContext(MatchStreamContext);
    // Hook only wires: subscribe, delegate to pure functions, set state.
    // Each imported function is independently unit-tested.
}
```

### 4f. Agent Checklist

Before completing any component or hook implementation, verify:

- [ ] No function exceeds 60 lines of logic (excluding imports, types, boilerplate)
- [ ] No conditional nesting exceeds 3 levels
- [ ] All business logic is importable and testable without mounting a component
- [ ] Pattern choice matches the complexity level (don't use a state machine for a simple transform)
- [ ] Extracted modules live in the correct location per §4d

---

## 5. Unit Detail Drawer

The Unit Detail Drawer supports three modes (reference, builder, match) implemented directly for wh40k10e. Abstract adapter interfaces will be introduced when additional game systems are added.

---

## 6. Missing Mockup Registry

10 mockups are outstanding and will refine implementation as they become available.

| Mockup                            | Needed By | Phase             | Blocks         |
| --------------------------------- | --------- | ----------------- | -------------- |
| Unit Detail Drawer — Single Model | Week 4    | Shared Components | P2, P3, P5     |
| Unit Detail Drawer — Multi Model  | Week 4    | Shared Components | P2, P3, P5     |
| Match Setup Phase                 | Week 8    | Phase 3           | US-MTH-021–023 |
| Match Deployment Phase            | Week 8    | Phase 3           | US-MTH-024–026 |
| Right Rail — Secondary Missions   | Week 9    | Phase 3           | US-MTH-034–036 |
| Right Rail — Mission Rules        | Week 9    | Phase 3           | US-MTH-037–039 |
| Guided Mode — All 5 Phases        | Week 10   | Phase 3           | US-MTH-040–049 |
| Match Summary (Past / Read-Only)  | Week 12   | Phase 3           | US-MTH-055–060 |
| Campaign Management Page          | Week 14   | Phase 4           | US-CMP-025–030 |
| Campaign Summary (Completed)      | Week 16   | Phase 4           | US-CMP-031–034 |

---

## 7. Dependency Graph

```
Phase 0 — Shared Prerequisites  (context scaffolds, query factory shells)
        │
        ▼
@armoury/data-context        (contracts locked)
        │
        ▼
  Shared Components  ──────────────────────────────┐
        │                                           │
  Phase 1 — Foundation                             │
        │                                           │
  Phase 2 — Army Builder                            │
        │                                           │
  Phase 3 — Match ◄──────────────────────────────┘
       ┌┴────────────────────┐
       ▼                     ▼
 Phase 4 — Campaigns   Phase 5 — Reference
```

- **Phase 0** must lock all context scaffolds and query factory shells before Phase 2+ code merges.
- **Shared Components** must ship visual components consuming Phase 0 contracts before any phase merges drawer code.
- **Phase 1** (auth, shell, routing) must complete before Phases 2–5.
- **Phase 2** (army builder) must complete before Phase 3 (match needs a built army).
- **Phases 4 & 5** may proceed in parallel once Phase 3 is stable.

---

## 8. Risk Register

| Risk                                                    | Likelihood | Impact | Mitigation                                                                  |
| ------------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------- |
| 10 missing mockups may influence visual polish          | Medium     | Medium | Implement with placeholder UI; refine when mockups arrive                   |
| WebSocket complexity (C-02) spills Phase 3 timeline     | Medium     | High   | Spike `@armoury/streams` integration in Week 7 before Phase 3 begins        |
| Campaign Management scope creep (C-06 friends selector) | Medium     | Medium | Freeze scope at Phase 4 kick-off; defer permissions model to a follow-on PR |
| Guided match mode state machine complexity              | High       | Medium | Build Basic mode first; Guided is additive — do not couple state machines   |

---

## 9. Definition of Done

Each phase is **done** when all of the following are true:

**Phase 0 — Shared Prerequisites**

- [ ] `GameSystemContext`, `DataContext` created in `@armoury/data-context`
- [ ] `MatchStream` class merged to `@armoury/streams/src/matches/`
- [ ] `FriendPresenceStream` and `CampaignNotificationStream` class shells merged to `@armoury/streams/`
- [ ] Cross-phase query factory shells (`armies.ts`, `factions.ts`, `gameSystems.ts`, `units.ts`, `matches.ts`) created with type signatures
- [ ] All interfaces pass `tsc --noEmit`
- [ ] UD-13/UD-15 mockup design references tracked with design team

**Shared Components**

- [ ] Drawer renders correctly in all three contexts (reference, builder, match)
- [ ] Design tokens and Radix primitives applied; dark theme only (C-04)

**Phase 1 — Foundation**

- [ ] Auth0 login/logout flow works end-to-end
- [ ] Shell, nav, and route guards in place; unauthenticated access to references works (C-03)
- [ ] Landing and Forge pages render with correct data

**Phase 2 — Army Builder**

- [ ] Army CRUD complete; points calculation live
- [ ] Unit add/configure/remove cycle complete with shared drawer (C-05)
- [ ] Validation errors surface inline; no silent failures

**Phase 3 — Match**

- [ ] War Ledger, Match Creation drawer, Active Match (Basic), and Conclusion pages ship
- [ ] WebSocket sync functional for match state (C-02)
- [ ] Guided mode gated behind feature flag; visual refinement deferred until Phase 3 mockups are available

**Phase 4 — Campaigns**

- [ ] Campaign CRUD with friends selector (C-06) complete
- [ ] Campaign match history and unit history linked to Phase 3 match data
- [ ] Campaign Management and Summary pages implemented; visual layout refined when mockups become available

**Phase 5 — Reference**

- [ ] Reference browser functional and publicly accessible (C-03)
- [ ] Account, Profile, and Settings pages complete
- [ ] Orphaned tournament stories (§11) in backlog; not blocking done criteria

---

## 10. Monorepo Code Organization

### 9a. Package Granularity Philosophy

Small, focused packages beat large shared dumping grounds. Each package has one reason to change. The existing structure is the exemplar:

- `@armoury/models` — core data models only
- `@armoury/data` — adapters, DAOs, DataContext, schema, codecs
- `@armoury/clients-github`, `@armoury/clients-wahapedia`, etc. — one client per external service
- `@armoury/streams` — RxJS WebSocket facades only
- `@armoury/validation` — game-agnostic validation engine
- Tooling split: `@armoury/eslint`, `@armoury/typescript`, `@armoury/vitest`, `@armoury/prettier`, `@armoury/esbuild`

Anti-pattern: a single `@armoury/shared-frontend` that accumulates everything.

### 9b. Where Code Lives — Decision Matrix

| Code Type                   | Location                        | Consumed By                        | Examples                            |
| --------------------------- | ------------------------------- | ---------------------------------- | ----------------------------------- |
| Core data models            | `src/shared/models/`            | All workspaces                     | Account, Army, Match                |
| Data layer (adapters, DAOs) | `src/shared/data/`              | Web, Mobile, Services              | DatabaseAdapter, ArmyDAO            |
| External API clients        | `src/shared/clients/<service>/` | Varies per client                  | GitHubClient, WahapediaClient       |
| RxJS stream facades         | `src/shared/streams/`           | Web, Mobile                        | MatchStream, PresenceStream         |
| Query/mutation factories    | `src/shared/clients/<domain>/src/` | Web, Mobile                     | armyListOptions, createArmyMutation |
| Shared types & interfaces   | `src/shared/types/`             | All workspaces                     | Platform enum, error classes        |
| Validation engine           | `src/shared/validation/`        | Web, Mobile, Systems               | ValidationRule, ValidationEngine    |
| Game system plugins         | `src/systems/src/<game>/`       | Web, Mobile (via @armoury/systems) | wh40k10e models, DAOs, types        |
| React components (web)      | `src/web/`                      | Web only                           | Next.js pages, components           |
| React Native components     | `src/mobile/`                   | Mobile only                        | Expo screens, components            |
| React hooks (web)           | `src/web/hooks/`                | Web only                           | useArmies, useUrlState              |
| React hooks (mobile)        | `src/mobile/hooks/`             | Mobile only                        | useArmies, useOffline               |
| Lambda services             | `src/services/<service>/`       | Deployed independently             | authorizer, campaigns               |
| Shared tooling configs      | `src/tooling/<tool>/`           | All workspaces (devDep)            | ESLint, TypeScript, Vitest configs  |

### 9c. The `src/shared/clients/` Boundary

This is the critical boundary for code sharing between web and mobile.

**Must contain (pure TypeScript only):**

- Query key factories and `queryOptions` definitions
- Mutation options definitions
- Business logic functions (validators, formatters, transformers)
- Type definitions (interfaces, types, enums)
- Utility functions (helpers, constants)

**Must not contain:**

- React components (no JSX)
- React Native components
- React hooks (no `useState`, `useEffect`, `useQuery`, etc.)
- Platform-specific imports (`react-dom`, `react-native`, `next/navigation`, `expo-router`)
- CSS, Tailwind classes, StyleSheet objects

Both Next.js and Expo consume `src/shared/clients/` packages. React hooks or JSX create platform coupling. Pure TypeScript functions are universally consumable.

### 9d. Package Naming Conventions

- `@armoury/<domain>` for core packages: `@armoury/models`, `@armoury/data`, `@armoury/validation`
- `@armoury/clients-<service>` for external API clients: `@armoury/clients-github`, `@armoury/clients-wahapedia`
- `@armoury/adapters-<backend>` for storage adapters
- `@armoury/providers-<source>` for data providers: `@armoury/providers-bsdata`
- `@armoury/<tool>` for tooling: `@armoury/eslint`, `@armoury/typescript`
- `@armoury/web`, `@armoury/mobile` for platform apps
- `@armoury/authorizer`, `@armoury/campaigns` for Lambda services

### 9e. When to Create a New Package vs Extend an Existing One

1. Does it have an independent reason to change? New package.
2. Is it consumed by a strict subset of workspaces? New package (avoid pulling deps into workspaces that don't need them).
3. Does it introduce new external dependencies? Consider a new package to isolate the dep graph.
4. Is it a single file used by one other module? Keep inline; extract when reuse is proven.
5. Would adding it increase the blast radius of an existing package? New package.

Blast-radius reference from AGENTS.md:

- High blast-radius: `@armoury/models`, `@armoury/data`, `@armoury/clients-github`
- Leaf nodes: all `tooling/*`, all `clients-*`, `@armoury/providers-bsdata`, `@armoury/authorizer`

### 9f. Testing Strategy Per Package Type

| Package Type        | Test Location                     | Test Runner | Environment | Key Patterns                                              |
| ------------------- | --------------------------------- | ----------- | ----------- | --------------------------------------------------------- |
| Core models         | `__tests__/` colocated            | Vitest      | Node        | Pure unit tests, fixture factories                        |
| Data layer          | `__tests__/` + `__integration__/` | Vitest      | Node        | Mock adapters for unit, real DB for integration           |
| API clients         | `__tests__/`                      | Vitest      | Node        | Mock HTTP responses, test error handling                  |
| Streams             | `__tests__/`                      | Vitest      | Node        | `firstValueFrom`, `TestScheduler`, subscription lifecycle |
| Query factories     | `__tests__/`                      | Vitest      | Node        | Test key generation, mock client responses                |
| Web components      | `__tests__/`                      | Vitest      | happy-dom   | `@testing-library/react`, QueryClient wrapper             |
| Mobile components   | `__tests__/`                      | Vitest      | happy-dom   | `@testing-library/react-native`, mock RN modules          |
| Game system plugins | `__tests__/`                      | Vitest      | Node        | Test against fixture data, validate game rules            |
| Lambda services     | `__tests__/` + `__integration__/` | Vitest      | Node        | Mock event payloads, test handler logic                   |

### 9g. Import Rules Recap

Full rules are in CODING_STANDARDS.md. Key points:

- Aliased imports use `.js` extension: `import { Army } from '@armoury/models'`
- Relative imports use `.js` extension: `import { makeArmy } from '../__fixtures__/makeArmy.js'`
- Import order: external packages, aliased internal, relative
- Named exports only (no default exports unless a framework requires it)

### 9h. Dependency Graph Awareness

Before adding a dependency to a shared package, check the blast radius using the dependency graph in AGENTS.md §Workspace Dependency Graph.

- Adding to `@armoury/models` affects all downstream packages
- Adding to `@armoury/clients-github` affects `@armoury/data` and `@armoury/wh40k10e`
- Adding to a `clients-*` leaf affects only its direct consumers
- Tooling changes (`@armoury/eslint`, etc.) affect development only, not runtime

---

## 11. Orphaned Stories

The following story IDs appear in source notes but are **not assigned to any phase sub-document**. They are tracked here to prevent loss; scheduling is deferred.

| Story ID   | Topic                          | Source                                                         |
| ---------- | ------------------------------ | -------------------------------------------------------------- |
| US-TRN-001 | Tournament listing / entry     | [PHASE_5_REFERENCE.md](plan/PHASE_5_REFERENCE.md) §orphan note |
| US-ACC-005 | Account deletion / GDPR export | [PHASE_5_REFERENCE.md](plan/PHASE_5_REFERENCE.md) §orphan note |
| US-ACC-006 | Notification preferences       | [PHASE_5_REFERENCE.md](plan/PHASE_5_REFERENCE.md) §orphan note |

These stories should be assigned to a phase or a separate backlog ticket before Phase 5 planning begins.
