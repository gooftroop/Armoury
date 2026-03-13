# Phase 0 — Shared Prerequisites

All blocking dependencies, shared contracts, and cross-phase infrastructure that must be completed before Phases 1–5 can operate as independent workstreams. This phase runs **Weeks 1–2**, parallel with Phase 1 Foundation and Shared Components.

Cross-references: [FRONTEND_PLAN.md](../FRONTEND_PLAN.md), [SHARED_COMPONENTS.md](SHARED_COMPONENTS.md), [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md)

---

## 1. Overview

Phase 0 exists to extract all upstream blockers from the individual phase documents and resolve them before any downstream phase begins independent development. Without locked contracts, phases cannot build against each other's interfaces — every team ends up waiting or building against assumptions that drift.

**Purpose**: Produce and merge all interface definitions, context scaffolds, and query factory shells that two or more downstream phases depend on.

**Scope**:

- Stream facade contracts for `MatchStream` and supporting reactive facades
- React Context provider type definitions and default values
- Query factory file stubs with exported function signatures and query key factories
- Mockup delivery gates tracked and committed by design

**Timeline**: Weeks 1–2. Every item in Section 9 (Definition of Done) must be merged before any Phase 2+ code lands.

**Relationship to Shared Components**: Phase 0 defines the _contracts_ — TypeScript interfaces, union types, context shapes. Shared Components (§3.x in [SHARED_COMPONENTS.md](SHARED_COMPONENTS.md)) implements the visual components that _consume_ those contracts. The two workstreams can proceed in parallel as long as Phase 0 contracts are stable before Shared Components ships consumable components.

> 📚 **Data Models Reference:** All core domain models consumed by query factories and components are defined in `src/shared/models/src/`. Key types: `Account`, `User`, `Friend`, `Match` (with `MatchPlayer`, `MatchTurn`, `MatchScore`), `Campaign` (with `CampaignParticipant`, `CampaignPhase`, `CampaignRanking`), `UserPresence`. Game-specific models live in `src/systems/wh40k10e/src/models/` (`Army`, `ArmyUnit`, `MatchData`) and `src/systems/wh40k10e/src/types/entities.ts` (`Faction`, `Unit`, `Weapon`, `Ability`, `Stratagem`, `Detachment`, `Enhancement`). Import from `@armoury/models` and `@wh40k10e/models/*.js` / `@wh40k10e/types/*.js` respectively.

---

## 2. Stream Facade Contracts

All interfaces in this section must be merged to their respective packages before downstream phases begin. Implementations are delivered in each phase's own scope.

### 2.1 MatchStream

**File**: `src/shared/streams/src/matches/MatchStream.ts`

**Consumed by**: Phase 3 (§6.1–§6.6), Phase 4 (§7.3 indirectly via match creation drawer)

Reactive cache facade wrapping `MatchesRealtimeClient` (WebSocket transport from `@armoury/clients-matches`). Maintains a live `BehaviorSubject<ReadonlyMap<string, Match>>` updated from WebSocket messages:

```typescript
export class MatchStream implements IMatchStream {
    readonly matches$: Observable<ReadonlyMap<string, Match>>;
    readonly connectionState$: Observable<ConnectionState>;
    match$(matchId: string): Observable<Match | undefined>;
    subscribeMatch(matchId: string): void;
    unsubscribeMatch(matchId: string): void;
    sendMatchUpdate(matchId: string, data: UpdateMatchFields): void;
    dispose(): void;
}
```

The `MatchStream` does not own transport lifecycle — it delegates to `MatchesRealtimeClient` for WebSocket connectivity. Connection management (connect/disconnect) is the consumer's responsibility.

**Conflict C-02 resolution**: All real-time sync flows through `MatchStream`. No UI component may call `setTimeout` or `setInterval` directly. The stream owns the reactive cache; components subscribe to observables only.

### 2.2 Stream Facade Interfaces

Both facades wrap a WebSocket client, expose a `BehaviorSubject` for current state, and implement `destroy()` for cleanup. Interface and class shell are Phase 0 deliverables. Full implementations are Phase 4 scope.

**`FriendPresenceStream`**

- File: `src/shared/streams/src/social/FriendPresenceStream.ts`
- Consumed by: Phase 4 (§7.3, §7.7)

**`CampaignNotificationStream`**

- File: `src/shared/streams/src/campaigns/CampaignNotificationStream.ts`
- Consumed by: Phase 4 (§7.3, §7.7)

```typescript
export interface FriendPresenceStream {
    readonly presence$: BehaviorSubject<FriendPresenceMap>;
    destroy(): void;
}

export interface CampaignNotificationStream {
    readonly notifications$: BehaviorSubject<CampaignNotification[]>;
    destroy(): void;
}
```

---

## 3. Context Provider Scaffolds

All React Context providers below must be defined with their type and a `createContext` call (with default value) before downstream phases consume them. Provider component implementations that wire up real values are Phase 1 and Phase 2 scope.

| Context                | File                                               | Default Value | Wired In            |
| ---------------------- | -------------------------------------------------- | ------------- | ------------------- |
| `GameSystemContext`    | `src/web/src/providers/GameSystemProvider.tsx` | `null`        | Phase 1 root layout |
| `DataContext`          | `src/web/src/providers/DataContextProvider.tsx`       | `null`        | Phase 1 root layout |
| Web `ThemeProvider`    | `src/web/src/providers/ThemeProvider.tsx`          | Dark static   | Phase 1             |
| Mobile `ThemeProvider` | `src/mobile/src/providers/ThemeProvider.tsx`       | Dark static   | Phase 1             |

**`ThemeProvider`** is dark-only and static per Conflict C-04. No switching logic in V1. The provider exists to satisfy Tamagui/Radix theme tree requirements, not to enable toggling.

> Note: `src/shared/clients/` is pure TypeScript with no React or platform imports. `GameSystemContext` and `DataContext` must export plain TypeScript types alongside the `createContext` call. The `createContext` import comes from React but lives in `.ts` files only because these files are consumed exclusively by React workspaces. If this restriction conflicts with lint rules, move the context factory to web/mobile workspace boundaries and export only the TypeScript types from `@armoury/clients-*`.

---

## 4. Query Factory Shells

Query factory files must exist with exported function signatures and query key definitions before phases that depend on them can build hooks. The Phase 0 deliverable is the file structure and type signatures only. Full implementations are delivered in each phase.

| Factory File                                 | Exports                                                                                                                                                                                                            | Provided By Phase | Consumed By Phase(s) |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- | -------------------- |
| `src/shared/clients/armies/src/queries.ts`      | `armyListOptions`, `createArmyMutation`                                                                                                                                                                            | 1                 | 2, 3, 4, 5           |
| `src/shared/clients/factions/src/queries.ts`    | `factionListOptions`                                                                                                                                                                                               | 1                 | 2, 5                 |
| `src/shared/clients/rules/src/gameSystems.ts` | `gameSystemsOptions`                                                                                                                                                                                               | 1                 | All                  |
| `src/shared/clients/rules/src/units.ts`       | `unitCatalogOptions`                                                                                                                                                                                               | 2                 | 3, 5                 |
| `src/shared/clients/matches/src/queries.ts`     | `matchListOptions`, `matchDetailOptions`, `matchSummaryOptions`                                                                                                                                                    | 3                 | 4                    |
| `src/shared/clients/missions/src/queries.ts`    | `missionOptions`, `missionDetailOptions`                                                                                                                                                                           | 3                 | —                    |
| `src/shared/clients/campaigns/src/queries.ts`   | `campaignListOptions`, `campaignDetailOptions`, `campaignParticipantsOptions`, `crusadeUnitOptions`, `createCampaignMutation`, `updateCampaignMutation`, `transitionCampaignMutation`, `inviteParticipantMutation` | 4                 | —                    |
| `src/shared/clients/friends/src/queries.ts`     | `friendListOptions`, `friendRequestMutations`                                                                                                                                                                      | 4                 | —                    |
| `src/shared/clients/rules/src/references.ts`  | `factionListOptions`, `coreRulesOptions`, `unitCatalogOptions`                                                                                                                                                     | 5                 | —                    |
| `src/shared/clients/users/src/account.ts`     | `accountOptions`, `updateAccountMutation`, `syncGameSystemMutation`                                                                                                                                                | 5                 | —                    |
| `src/shared/clients/users/src/profile.ts`     | `profileOptions`, `matchHistoryOptions`, `armyListOptions` (re-export)                                                                                                                                             | 5                 | —                    |

**Phase 0 requirement applies only to cross-phase factories**: `armies.ts`, `factions.ts`, `gameSystems.ts`, `units.ts`, and `matches.ts`. Factories consumed only within their own phase (missions, campaigns, friends, references, account, profile) can be created inline during that phase.

### 4a. API Error Response Contract

All API endpoints return errors in a consistent shape. Mutation error handlers, error boundaries, and validation feedback UI must all consume this contract. Define in `src/shared/types/src/errors.ts` alongside existing error classes:

```typescript
/**
 * Standard API error response shape returned by all Lambda endpoints.
 * Mutations must type their `onError` callbacks against this shape.
 * Error boundaries parse `ApiErrorResponse` from failed fetch responses.
 */
export interface ApiErrorResponse {
    /** HTTP status code (e.g., 400, 404, 409, 500) */
    status: number;
    /** Machine-readable error code for programmatic handling */
    code: ApiErrorCode;
    /** Human-readable error message (safe to display to users) */
    message: string;
    /** Field-level validation errors. Keys are field paths, values are error message arrays. */
    details?: Record<string, string[]>;
    /** Correlation ID for support/debugging */
    requestId?: string;
}

export type ApiErrorCode =
    | 'VALIDATION_ERROR'
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'RATE_LIMITED'
    | 'INTERNAL_ERROR';
```

**Usage in mutations:**

```typescript
const createArmyMutation = mutationAction({
    mutationFn: (data: CreateArmyInput) => api.post('/armies', data),
    onError: (error: ApiErrorResponse) => {
        if (error.code === 'VALIDATION_ERROR' && error.details) {
            // Map field errors to form state
        }
    },
});
```

**Usage in error boundaries:**

```typescript
// In error.tsx — parse the ApiErrorResponse from the thrown error
function getApiError(error: unknown): ApiErrorResponse | null {
    if (error instanceof Response) {
        return error.json() as Promise<ApiErrorResponse>;
    }
    return null;
}
```

---

## 5. Mockup Delivery Registry

### Registry

| Mockup                          | UX Issues             | Needed By Week | Informs Phase(s)   | Informs Sections             |
| ------------------------------- | --------------------- | -------------- | ------------------ | ---------------------------- |
| Single-Model Unit Drawer        | UD-11, UD-12, UD-13   | Week 4         | Shared, P2, P3, P5 | §3.5, §5.1, §5.3, §5.4, §5.5 |
| Multi-Model Unit Drawer         | UD-14, UD-15          | Week 4         | Shared, P2, P3, P5 | §3.5, §5.1, §5.3, §5.4, §5.5 |
| Match Setup Phase (Basic)       | MB-20, MB-26, MPG-30  | Week 8         | P3                 | US-MTH-021–023               |
| Match Deployment Phase          | MB-21, MB-26, MPG-31  | Week 8         | P3                 | US-MTH-024–026               |
| Right Rail — Secondary Missions | MB-22, MG-09, MPG-32  | Week 9         | P3                 | US-MTH-034–036               |
| Right Rail — Mission Rules      | MB-23, MPG-32         | Week 9         | P3                 | US-MTH-037–039               |
| Guided Mode — All 5 Phases      | MG-02, MG-06, MPG-40  | Week 10        | P3                 | US-MTH-040–049               |
| Match Summary / Conclusion      | MB-27, MPG-36, MPG-02 | Week 12        | P3                 | US-MTH-055–060               |
| Campaign Management Page        | CD-07, CD-09          | Week 14        | P4                 | US-CMP-025–030               |
| Campaign Summary / Report       | CP-04                 | Week 16        | P4                 | US-CMP-031–034               |

### Priority Order

- **P0 (Weeks 1–2)**: UD-13, UD-15 — these inform the widest number of downstream phases
- **P1 (Weeks 7–8)**: Setup Phase, Deployment Phase — informs Phase 3 start
- **P2 (Weeks 8–10)**: Right Rail × 2, Guided Mode — informs Phase 3 mid-sections
- **P3 (Week 12)**: Match Summary — informs Phase 3 conclusion
- **P4 (Weeks 13–14)**: Campaign Management, Campaign Summary — informs Phase 4 mid-sections

### Partial Unblocking Strategy

Waiting on a mockup doesn't mean the surrounding work stalls. Each outstanding mockup has a safe zone of work that can proceed.

**While UD-13/UD-15 are outstanding**: Drawer shell sizing and close behavior, content section stubs, and skeleton variants can all proceed. The drawer shell layout (position, width, scroll region, header/footer anatomy) does not depend on detailed content mockups.

**While Phase 3 match mockups are outstanding**: War Ledger, Match Creation Drawer (all 7 steps), the basic mode unit list, `MatchHeader`, and `MatchStickyFooter` can all proceed. These components have independent layout specs that don't depend on the phase/right-rail mockups.

**While Phase 4 campaign mockups are outstanding**: §7.1 Campaigns List, §7.2 Campaign Creation, and §7.7 Allies can all proceed. The management and summary pages are the only sections awaiting mockup refinement.

---

## 6. Cross-Phase Dependency Matrix

| Phase             | Provides (to downstream)                                                                          | Needs (from upstream)                                                             | Can Start When                                      |
| ----------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------- |
| Phase 0           | Context scaffolds, query factory shells                                                           | Nothing                                                                           | Immediately                                         |
| Shared Components | Shell Layout, Nav, Theme, Unit Detail Drawer visual, Skeletons, Error Boundaries, Form Primitives | Phase 0 contracts                                                                 | Phase 0 contracts merged                            |
| Phase 1           | Auth, shell routing, `GameSystemContext` wired, landing/forge pages                               | Shared Components §3.1–§3.3, §3.6–§3.10                                           | Shared Components started (parallel)                |
| Phase 2           | Army builder drawer, unit configuration flow, Army CRUD, unit add/config flow                     | Phase 1 shell + auth stable, UD-13/UD-15 mockups                                  | Phase 1 complete + mockups delivered                |
| Phase 3           | Match tracking drawer, `MatchStream`, Match Creation Drawer, `MatchCreationDrawer` context API    | `MatchStream` interface merged                                                    | Phase 2 complete                                    |
| Phase 4           | `FriendPresenceStream`, `CampaignNotificationStream`, Campaign CRUD                               | Phase 3 Match Creation Drawer stable (for §7.3, §7.5), Phase 2 drawer (for §7.4a) | Phase 3 stable (§7.1, §7.2, §7.7 can start earlier) |
| Phase 5           | Reference browser, Account, Profile                                                               | Phase 1 shell + auth, Phase 2 Unit Detail Drawer (for §8.1)                       | Phase 1 complete (can parallel with P3/P4)          |

---

## 7. Cross-Phase Component Reuse Registry

| Component                          | Defined In             | Consumed By        | Reuse Mechanism                                                      |
| ---------------------------------- | ---------------------- | ------------------ | -------------------------------------------------------------------- |
| Unit Detail Drawer (visual shell)  | Shared Components §3.5 | P2, P3, P4, P5     | Same component, different drawer mode (reference, builder, match)    |
| Match Creation Drawer              | Phase 3 §6.2           | Phase 4 §7.3, §7.5 | Context object with `armyId?`, `campaignId?`, `opponentScope` (C-07) |
| `CampaignFormContainer`            | Phase 4 §7.2           | Phase 4 §7.6       | `mode` prop: `'create' \| 'manage'`                                  |
| `armyListOptions` query factory    | Phase 1                | Phase 2, 3, 4, 5   | Direct import from `@armoury/clients-armies`              |
| `unitCatalogOptions` query factory | Phase 2                | Phase 5            | Re-exported from Phase 5 references query file                       |
| `matchDetailOptions` query factory | Phase 3                | Phase 4            | Direct import                                                        |

---

## 8. Conflict Resolution Cross-Reference

| Conflict | Resolution                                             | Resolved In  | Affects    |
| -------- | ------------------------------------------------------ | ------------ | ---------- |
| C-01     | Match Creation is a drawer, not a page                 | PHASE_3 §6.2 | P3, P4     |
| C-02     | All sync via `MatchStream`; no direct timers           | PHASE_3 §6   | P3, P4     |
| C-03     | References public; all else requires auth              | PHASE_1 §4.1 | P1, P5     |
| C-04     | Dark-only V1; no theme toggle                          | SHARED §3.4  | All        |
| C-05     | Shared drawer for add-unit and army builder            | SHARED §3.5  | Shared, P2 |
| C-06     | Friends selector in Campaign Management, not creation  | PHASE_4 §7.6 | P4         |
| C-07     | Match creation drawer renders conditionally on context | PHASE_3 §6.2 | P3, P4     |

---

## 9. Definition of Done for Phase 0

Phase 0 is complete when ALL of the following are true:

- [ ] `MatchStream` class merged to `@armoury/streams/src/matches/`
- [ ] `FriendPresenceStream` class shell (interface + `BehaviorSubject` + `destroy()`) merged to `@armoury/streams/src/social/`
- [ ] `CampaignNotificationStream` class shell merged to `@armoury/streams/src/campaigns/`
- [ ] `GameSystemContext` type and `createContext` call merged to `@armoury/shared/frontend/context/`
- [ ] `DataContext` type and `createContext` call merged to `@armoury/shared/frontend/context/`
- [ ] Query factory files created with type signatures for cross-phase factories: `armies.ts`, `factions.ts`, `gameSystems.ts`, `units.ts`, `matches.ts`
- [ ] UD-13 and UD-15 mockup delivery tracked (not necessarily delivered, but delivery date committed by design)
- [ ] All interfaces pass `tsc --noEmit` type check
- [ ] No Phase 2+ code merged until all interface contracts above are stable
- [ ] §12 Shared UI Component Registry reviewed and consistent with SHARED_COMPONENTS.md §A and §I
- [ ] SHARED_COMPONENTS.md §I styling contracts reviewed and consistent with §11.8 CVA patterns

---

## 10. Hard Constraints Reference

Reproduced from FRONTEND_PLAN.md §2 for self-containment.

| ID  | Constraint                                                                          |
| --- | ----------------------------------------------------------------------------------- |
| A   | Reference context drawer: all unit data, read-only, no model list, no HP bar        |
| B   | Builder context drawer: model list visible, wargear editable, no HP bar             |
| C   | Match context drawer: model list with HP bar, composition locked, wargear read-only |
| D   | Basic vs Guided modes share unit list; differ only in phase-relevant state display  |
| E   | Drawer layout is visually consistent across all three contexts                      |

---

## 11. `@armoury/ui` Design System

This section defines the architecture, placement rules, scaffolding requirements, and implementation patterns for `@armoury/ui` — the Armoury design system and UI library. It is a Phase 0 deliverable: the design system scaffold (tokens, themes, styles, and component stubs) must be in place before any feature phase builds UI.

### 11.1 Purpose and Scope

`@armoury/ui` is the **design system and UI library** for Armoury. It is the single source of truth for:

- **Design tokens** — colors (OKLCH), spacing, radii, typography scales, and animation durations.
- **Themes** — dark tactical theme (V1), game-system theme overrides, and the theme provider contract.
- **Shared styles** — utility functions (`cn()`), CVA base configurations, and global style patterns.
- **UI components** — every component used on **both** the web (`@armoury/web`) and mobile (`@armoury/mobile`) platforms, shipped as platform-specific implementations (`.web.tsx` / `.native.tsx`).

Both platform apps import tokens, themes, and components from `@armoury/ui`. The design system owns the visual language; platform apps own page-level composition and routing.

**What belongs in `@armoury/ui`:**

- Design tokens and theme definitions (colors, spacing, radii, typography, animation).
- Theme provider implementations for web (CSS custom properties) and mobile (Tamagui config).
- Shared style utilities (`cn()`, `cva` base patterns, `tailwind-merge` wrappers).
- Any component rendered on both web and mobile (regardless of whether it uses Radix, Tamagui, or neither).
- Shared prop interfaces, variant type definitions, and token contracts that both platforms reference.
- Platform-specific implementations of shared components, co-located under the same package using `.web.tsx` / `.native.tsx` extensions.

**What does NOT belong in `@armoury/ui`:**

- Components used only on web — these live in `src/web/src/components/`.
- Components used only on mobile — these live in `src/mobile/src/components/`.
- React hooks — hooks import React and must live in the platform workspace that uses them.
- Pure TypeScript utilities (formatters, validators, query factories) — these live in `src/shared/clients/`.

> **Decision rule:** If a component is used on both platforms, it belongs in `@armoury/ui`. If it is used only on one platform (even if used multiple times there), it belongs in that platform's `src/components/` directory. Tokens, themes, and styles always belong in `@armoury/ui` regardless of which platform consumes them.

---

### 11.2 Workspace Location and Registration

**Location:** `src/shared/ui/`

**Package name:** `@armoury/ui`

> **Migration note:** The workspace was originally scaffolded at `src/ui/`. It must be moved to `src/shared/ui/` and the root `package.json` workspaces entry updated accordingly. All other shared packages already live under `src/shared/`.

**Registration in root `package.json` workspaces array:**

```json
"workspaces": [
  "src/shared/ui",
  ...existing entries...
]
```

**Directory structure to scaffold:**

```
src/shared/ui/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                          ← barrel: re-exports tokens, themes, styles, and all components
│   ├── types.ts                          ← shared prop interfaces consumed by both platforms
│   ├── tokens/
│   │   ├── index.ts                      ← barrel: re-exports all token modules
│   │   ├── colors.ts                     ← OKLCH color palette (source of truth for both CSS and Tamagui)
│   │   ├── spacing.ts                    ← spacing scale (gap, padding, margin values)
│   │   ├── radii.ts                      ← border-radius tokens
│   │   ├── typography.ts                 ← font sizes, weights, line heights, letter spacing
│   │   └── animation.ts                  ← durations, easings, reduced-motion fallbacks
│   ├── themes/
│   │   ├── index.ts                      ← barrel: re-exports all themes
│   │   ├── dark.ts                       ← dark tactical theme (V1 default, C-04)
│   │   └── types.ts                      ← Theme interface, ThemeTokens type
│   ├── styles/
│   │   ├── index.ts                      ← barrel: re-exports all style utilities
│   │   ├── cn.ts                         ← cn() utility (clsx + tailwind-merge)
│   │   ├── cva.ts                        ← CVA re-export with project defaults
│   │   └── globals.css                   ← Tailwind v4 @theme inline + CSS custom properties (web entry point)
│   ├── components/
│   │   ├── index.ts                      ← barrel: re-exports all components
│   │   ├── button/
│   │   │   ├── Button.web.tsx            ← Radix UI + Tailwind v4 + CVA implementation
│   │   │   ├── Button.native.tsx         ← Tamagui implementation
│   │   │   ├── button.variants.ts        ← CVA variant definitions (consumed by .web.tsx)
│   │   │   ├── Button.types.ts           ← shared ButtonProps interface
│   │   │   └── index.ts                  ← barrel: exports Button + ButtonProps
│   │   ├── badge/
│   │   │   ├── Badge.web.tsx
│   │   │   ├── Badge.native.tsx
│   │   │   ├── Badge.types.ts
│   │   │   └── index.ts
│   │   ├── chip/
│   │   │   ├── Chip.web.tsx
│   │   │   ├── Chip.native.tsx
│   │   │   ├── Chip.types.ts
│   │   │   └── index.ts
│   │   ├── avatar/
│   │   │   ├── Avatar.web.tsx
│   │   │   ├── Avatar.native.tsx
│   │   │   ├── Avatar.types.ts
│   │   │   └── index.ts
│   │   ├── skeleton/
│   │   │   ├── Skeleton.web.tsx
│   │   │   ├── Skeleton.native.tsx
│   │   │   ├── Skeleton.types.ts
│   │   │   └── index.ts
│   │   ├── input/
│   │   │   ├── Input.web.tsx
│   │   │   ├── Input.native.tsx
│   │   │   ├── Input.types.ts
│   │   │   └── index.ts
│   │   ├── select/
│   │   │   ├── Select.web.tsx
│   │   │   ├── Select.native.tsx
│   │   │   ├── Select.types.ts
│   │   │   └── index.ts
│   │   ├── checkbox/
│   │   │   ├── Checkbox.web.tsx
│   │   │   ├── Checkbox.native.tsx
│   │   │   ├── Checkbox.types.ts
│   │   │   └── index.ts
│   │   ├── radio-group/
│   │   │   ├── RadioGroup.web.tsx
│   │   │   ├── RadioGroup.native.tsx
│   │   │   ├── RadioGroup.types.ts
│   │   │   └── index.ts
│   │   ├── switch/
│   │   │   ├── Switch.web.tsx
│   │   │   ├── Switch.native.tsx
│   │   │   ├── Switch.types.ts
│   │   │   └── index.ts
│   │   ├── drawer/
│   │   │   ├── Drawer.web.tsx
│   │   │   ├── Drawer.native.tsx
│   │   │   ├── Drawer.types.ts
│   │   │   └── index.ts
│   │   ├── toast/
│   │   │   ├── Toast.web.tsx
│   │   │   ├── Toast.native.tsx
│   │   │   ├── Toast.types.ts
│   │   │   └── index.ts
│   │   └── separator/
│   │       ├── Separator.web.tsx
│   │       ├── Separator.native.tsx
│   │       ├── Separator.types.ts
│   │       └── index.ts
│   └── __tests__/
│       └── (component unit tests, platform-agnostic logic only)
└── __tests__/
    └── (integration tests)
```

> **Token flow**: `src/tokens/*.ts` defines raw values as platform-agnostic TypeScript objects → `src/styles/globals.css` consumes them as CSS custom properties (web) → `src/themes/dark.ts` assembles tokens into a complete theme → platform apps import from `@armoury/ui/tokens` and `@armoury/ui/themes` to configure their respective styling systems (Tailwind v4 for web, Tamagui for mobile).

### 11.3 Component Tiers

Components in `@armoury/ui` fall into one of three implementation tiers:

| Tier               | Description                                                              | Web Implementation                        | Mobile Implementation                  |
| ------------------ | ------------------------------------------------------------------------ | ----------------------------------------- | -------------------------------------- |
| **A — Primitives** | Interactive components with structural accessibility requirements        | Radix UI primitive + Tailwind v4 + CVA    | Tamagui equivalent primitive           |
| **B — Composites** | Multi-part components assembled from primitives                          | Compound component pattern wrapping Radix | Compound component wrapping Tamagui    |
| **C — Decorative** | Non-interactive visual components (badges, chips, skeletons, separators) | Tailwind v4 styled `div`/`span`           | Tamagui `Stack`/`Text` styled variants |

Tier C components have no library dependency — they are pure React (web) or pure React Native (mobile) with styling only. They should never import Radix or Tamagui directly.

---

### 11.4 `package.json` Scaffold

```json
{
    "name": "@armoury/ui",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "exports": {
        ".": {
            "types": "./dist/index.d.ts",
            "import": "./dist/index.js"
        },
        "./tokens": {
            "types": "./dist/tokens/index.d.ts",
            "import": "./dist/tokens/index.js"
        },
        "./themes": {
            "types": "./dist/themes/index.d.ts",
            "import": "./dist/themes/index.js"
        },
        "./styles": {
            "types": "./dist/styles/index.d.ts",
            "import": "./dist/styles/index.js"
        },
        "./styles/globals.css": "./src/styles/globals.css",
        "./components/*": {
            "types": "./dist/components/*/index.d.ts",
            "import": "./dist/components/*/index.js"
        }
    },
    "scripts": {
        "build": "tsc --emitDeclarationOnly && node build.js",
        "typecheck": "tsc --noEmit",
        "lint": "eslint src",
        "format": "prettier --write src",
        "format:check": "prettier --check src"
    },
    "devDependencies": {
        "@armoury/eslint": "*",
        "@armoury/typescript": "*",
        "@armoury/prettier": "*",
        "@types/react": "^19.0.0",
        "@types/react-native": "^0.79.0",
        "typescript": "^5"
    },
    "peerDependencies": {
        "react": ">=19.0.0",
        "react-native": ">=0.79.0",
        "@radix-ui/react-slot": "^1",
        "class-variance-authority": "^0.7",
        "clsx": "^2",
        "tailwind-merge": "^2",
        "@tamagui/core": "^1",
        "tamagui": "^1"
    },
    "peerDependenciesMeta": {
        "react-native": { "optional": true },
        "@tamagui/core": { "optional": true },
        "tamagui": { "optional": true },
        "@radix-ui/react-slot": { "optional": true },
        "class-variance-authority": { "optional": true }
    }
}
```

> Radix and Tamagui are **peer dependencies**, not direct dependencies. Platform workspaces (`@armoury/web`, `@armoury/mobile`) own these as direct dependencies. `@armoury/ui` declares them as peers to avoid bundling them twice.

> **Subpath exports**: Each design system concern (`tokens`, `themes`, `styles`, `components/*`) has its own subpath export. This enables tree-shaking — `@armoury/web` can import `@armoury/ui/tokens` without pulling in all components. The `./styles/globals.css` export is a raw CSS file, not transpiled — it is imported directly by `@armoury/web/src/app/globals.css`.

---

### 11.5 `tsconfig.json` Scaffold

```json
{
    "extends": "@armoury/typescript/base.json",
    "compilerOptions": {
        "module": "Bundler",
        "moduleResolution": "Bundler",
        "jsx": "react-jsx",
        "outDir": "dist",
        "rootDir": "src",
        "paths": {
            "@ui/*": ["./src/*"],
            "@ui-tokens/*": ["./src/tokens/*"],
            "@ui-themes/*": ["./src/themes/*"],
            "@ui-styles/*": ["./src/styles/*"],
            "@ui-components/*": ["./src/components/*"]
        }
    },
    "include": ["src"],
    "exclude": ["node_modules", "dist", "**/__tests__/**"]
}
```

> **Path alias convention**: The generic `@ui/*` alias resolves to the entire `src/` tree. The narrower aliases (`@ui-tokens/*`, `@ui-components/*`, etc.) are optional shortcuts for internal use within `@armoury/ui` itself. External consumers always use the package subpath exports (`@armoury/ui/tokens`, `@armoury/ui/components/button`, etc.).

---

### 11.6 Import and Resolution Pattern

Platform workspaces import from `@armoury/ui` using the package name. The bundler (Next.js webpack for web, Metro for mobile) resolves the correct platform-specific file automatically via the `.web.tsx` / `.native.tsx` extension convention.

**Web (`@armoury/web`):** Metro is not involved; webpack resolves `.web.tsx` by convention only if configured. For Next.js, use explicit re-exports from `@armoury/ui` that re-export the `.web.tsx` variant directly. The barrel `index.ts` for each component must export the web variant when the ambient environment is web.

**Mobile (`@armoury/mobile`):** Metro resolves `.native.tsx` automatically when the `resolver.sourceExts` config includes `native`. No explicit configuration is required beyond Metro defaults.

**Recommended pattern** — component barrel `index.ts`:

```typescript
// src/shared/ui/src/components/button/index.ts
// Exports are resolved by the bundler via platform extension.
// Do NOT use explicit conditional imports here.
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button.types.js';
export { buttonVariants } from './button.variants.js';
// The bundler resolves Button.web.tsx on web, Button.native.tsx on mobile.
export { Button } from './Button.js';
```

```typescript
// src/shared/ui/src/components/button/Button.ts — re-export shim resolved by bundler
// This file intentionally has no content. Metro/webpack replace it
// with Button.web.tsx or Button.native.tsx at bundle time.
// Do not write logic here; write it in the platform files.
export { Button } from './Button.web.jsx'; // overridden by bundler
```

> **Note:** This re-export shim pattern is required because TypeScript declaration emit resolves the `.ts` path while the bundler overrides it at runtime. Confirm this pattern against the Metro and Next.js configs during the scaffold task.

---

### 11.7 Shared Prop Interface Rules

Every component in `@armoury/ui` must define its props in a `*.types.ts` file that has **zero platform imports**. This file may only import from:

- Other `*.types.ts` files within `@armoury/ui`
- `src/shared/types/src/`
- Pure TypeScript utility types (`React.ReactNode` is allowed as it is type-only)

```typescript
// src/shared/ui/src/components/button/Button.types.ts

/**
 * @requirements
 * 1. Must be importable from both web and mobile without platform dependencies.
 * 2. Must not import from Radix UI, Tamagui, react-native, or any DOM type.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'highlight' | 'ghost' | 'destructive' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
    /** Visual variant. Defaults to 'primary'. */
    variant?: ButtonVariant;
    /** Size. Defaults to 'md'. */
    size?: ButtonSize;
    /** If true, renders as a slot (web) / pressable passthrough (mobile). */
    asChild?: boolean;
    /** Whether the button is disabled. */
    disabled?: boolean;
    /** Accessible label. Required when button has no visible text. */
    'aria-label'?: string;
    children?: React.ReactNode;
}
```

Platform files then extend this interface with platform-specific props:

```typescript
// src/shared/ui/src/components/button/Button.web.tsx
import type { ButtonProps } from './Button.types.js';

// Web-specific extension: adds all standard <button> HTML attributes
export interface WebButtonProps
    extends ButtonProps, Omit<React.ComponentPropsWithRef<'button'>, keyof ButtonProps | 'children'> {}
```

```typescript
// src/shared/ui/src/components/button/Button.native.tsx
import type { ButtonProps } from './Button.types.js';
import type { PressableProps } from 'react-native';

// Mobile-specific extension: adds Pressable props
export interface NativeButtonProps extends ButtonProps, Omit<PressableProps, keyof ButtonProps | 'children'> {}
```

---

### 11.8 Web Implementation Patterns (Radix + Tailwind v4 + CVA)

#### 11.8.1 CVA Setup

All Tier A and Tier B web components use `class-variance-authority` (CVA) for variant management. Export `*Variants` functions alongside the component so consuming code can compute class strings without rendering a component (useful for dynamic styling).

```typescript
// src/shared/ui/src/components/button/button.variants.ts
import { cva } from 'class-variance-authority';

/**
 * CVA variant definitions for Button.
 * Exported separately so consuming code can compute class strings standalone.
 */
export const buttonVariants = cva(
    // Base classes — applied to every variant
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ' +
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
        'focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
        'disabled:pointer-events-none disabled:opacity-50 ' +
        '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                primary: 'bg-primary text-primary-foreground shadow hover:bg-primary/90 active:bg-primary/80',
                secondary:
                    'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 active:bg-secondary/70',
                highlight: 'bg-highlight text-highlight-foreground shadow hover:bg-highlight/90 active:bg-highlight/80',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
                destructive:
                    'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:bg-destructive/80',
                outline: 'border border-border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
            },
            size: {
                sm: 'h-8 px-3 text-xs',
                md: 'h-9 px-4 py-2',
                lg: 'h-10 px-6 text-base',
            },
        },
        defaultVariants: { variant: 'primary', size: 'md' },
    },
);
```

#### 11.8.2 Web Component Pattern (Button)

```typescript
// src/shared/ui/src/components/button/Button.web.tsx
'use client';

/**
 * @requirements
 * 1. Must extend shared ButtonProps from Button.types.ts.
 * 2. Must use Radix Slot for asChild composition.
 * 3. Must use buttonVariants for class computation.
 * 4. Must use cn() for className merging.
 * 5. Must preserve all native <button> attributes via spread.
 * 6. Must NOT use React.forwardRef — React 19 passes ref as a prop directly.
 */

import { Slot } from '@radix-ui/react-slot';
import { type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@armoury/ui/styles';
import type { ButtonProps } from './Button.types.js';
import { buttonVariants } from './button.variants.js';

export interface WebButtonProps
  extends ButtonProps,
    Omit<React.ComponentPropsWithRef<'button'>, keyof ButtonProps | 'children'>,
    VariantProps<typeof buttonVariants> {}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ref,
  ...props
}: WebButtonProps): React.ReactElement {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
}

Button.displayName = 'Button';
```

> **React 19 note:** `ref` is passed as a prop directly (`ref` in the destructured props). Do **not** use `React.forwardRef` — it is deprecated in React 19 and its use generates a console warning.

#### 11.8.3 Compound Component Pattern (Dialog)

Multi-part components (Dialog, Drawer, Select) use the compound component pattern. Each sub-component is named and exported individually. Consumers compose them explicitly.

```typescript
// src/shared/ui/src/components/drawer/Drawer.web.tsx — abbreviated pattern
'use client';

import { Dialog } from 'radix-ui';
import * as React from 'react';
import { cn } from '@armoury/ui/styles';
import type { DrawerSide } from './Drawer.types.js';

// Root — re-export Radix primitive directly
const DrawerRoot = Dialog.Root;
const DrawerTrigger = Dialog.Trigger;
const DrawerClose = Dialog.Close;
const DrawerPortal = Dialog.Portal;

// Overlay — styled wrapper
function DrawerOverlay({ className, ...props }: React.ComponentPropsWithRef<typeof Dialog.Overlay>) {
  return (
    <Dialog.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out ' +
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  );
}
DrawerOverlay.displayName = 'DrawerOverlay';

// Content — side variants via data attributes + conditional classes
const sideClasses: Record<DrawerSide, string> = {
  right:  'inset-y-0 right-0 h-full w-[min(60vw,900px)] data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
  left:   'inset-y-0 left-0 h-full w-[min(60vw,900px)] data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left',
  top:    'inset-x-0 top-0 data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top',
  bottom: 'inset-x-0 bottom-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
};

interface DrawerContentProps extends React.ComponentPropsWithRef<typeof Dialog.Content> {
  side?: DrawerSide;
}

function DrawerContent({ className, side = 'right', children, ...props }: DrawerContentProps) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <Dialog.Content
        className={cn(
          'fixed z-50 flex flex-col gap-4 bg-background p-6 shadow-lg duration-300',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          sideClasses[side],
          className,
        )}
        {...props}
      >
        {children}
      </Dialog.Content>
    </DrawerPortal>
  );
}
DrawerContent.displayName = 'DrawerContent';

export {
  DrawerRoot as Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
};
```

#### 11.8.4 Tailwind v4 CSS Setup Requirements

The `@armoury/web` globals CSS must include the following setup. This is a **Phase 0 deliverable** — the CSS layer order must be correct before any component styling works.

> **Source of truth**: The actual OKLCH color values and spacing tokens are defined in `@armoury/ui/tokens` (TypeScript). The CSS below references those tokens via CSS custom properties that are generated from the TypeScript source. During the Phase 0 scaffold, the `:root` block below is manually kept in sync with `src/shared/ui/src/tokens/colors.ts`. In a future phase, a build step may auto-generate the CSS custom properties from the TypeScript token definitions.

```css
/* src/web/src/app/globals.css */

/* 0. Import design system globals (CSS custom properties generated from @armoury/ui tokens) */
@import '@armoury/ui/styles/globals.css';

/* 1. Import Tailwind base */
@import 'tailwindcss';

/* 2. Import animation library (NOT tailwindcss-animate — use tw-animate-css) */
@import 'tw-animate-css';

/* 3. Define theme tokens using @theme inline (Tailwind v4 CSS-first syntax).
      All values reference CSS custom properties defined in :root below.
      This avoids duplication: tokens are set once in :root; Tailwind reads them via var(). */
@theme inline {
    --color-background: var(--background);
    --color-foreground: var(--foreground);
    --color-primary: var(--primary);
    --color-primary-foreground: var(--primary-foreground);
    --color-secondary: var(--secondary);
    --color-secondary-foreground: var(--secondary-foreground);
    --color-muted: var(--muted);
    --color-muted-foreground: var(--muted-foreground);
    --color-accent: var(--accent);
    --color-accent-foreground: var(--accent-foreground);
    --color-destructive: var(--destructive);
    --color-destructive-foreground: var(--destructive-foreground);
    --color-border: var(--border);
    --color-ring: var(--ring);
    --color-popover: var(--popover);
    --color-popover-foreground: var(--popover-foreground);
    --color-highlight: var(--highlight);
    --color-highlight-foreground: var(--highlight-foreground);

    --radius-sm: calc(var(--radius) - 4px);
    --radius-md: calc(var(--radius) - 2px);
    --radius-lg: var(--radius);
    --radius-xl: calc(var(--radius) + 4px);
}

/* 4. Dark mode variant (class-based — Tailwind v4 syntax) */
@custom-variant dark (&:is(.dark *));
```

The corresponding `@armoury/ui` globals CSS file defines the actual token values as CSS custom properties:

```css
/* src/shared/ui/src/styles/globals.css — design system CSS entry point */

/* CSS custom properties (actual values in OKLCH color space — not HSL).
   These are the GENERATED output of @armoury/ui/tokens — the TypeScript source of truth.
   Both @armoury/web (via this file) and @armoury/mobile (via direct TS import) consume
   the same token values, ensuring cross-platform consistency. */
:root {
    --radius: 0.625rem;

    /* Dark tactical theme (V1 is dark-only per C-04) */
    --background: oklch(0.145 0 0);
    --foreground: oklch(0.985 0 0);
    --primary: oklch(0.922 0 0);
    --primary-foreground: oklch(0.205 0 0);
    --secondary: oklch(0.269 0 0);
    --secondary-foreground: oklch(0.985 0 0);
    --muted: oklch(0.269 0 0);
    --muted-foreground: oklch(0.708 0 0);
    --accent: oklch(0.269 0 0);
    --accent-foreground: oklch(0.985 0 0);
    --destructive: oklch(0.704 0.191 22.216);
    --destructive-foreground: oklch(0.985 0 0);
    --border: oklch(1 0 0 / 10%);
    --ring: oklch(0.556 0 0);
    --popover: oklch(0.205 0 0);
    --popover-foreground: oklch(0.985 0 0);
    /* Tactical blue accent — darkened to meet 4.5:1 contrast on oklch(0.145 0 0) */
    --highlight: oklch(0.546 0.165 264.3);
    --highlight-foreground: oklch(0.985 0 0);
}
```

> **Gotcha — CSS layer ordering:** Radix UI injects its own CSS outside any `@layer`. In Tailwind v4, `@layer utilities` rules have lower specificity than unlayered rules. If Radix CSS conflicts with your utility classes, wrap the Radix import with an explicit layer:
>
> ```css
> @layer components {
>     @import '@radix-ui/themes/styles.css'; /* only if using @radix-ui/themes */
> }
> ```
>
> For unstyled Radix primitives (which Armoury uses), this is not required — the primitives emit no stylesheet.

---

### 11.9 Mobile Implementation Patterns (Tamagui)

#### 11.9.1 Token Alignment

Both platforms consume the same token values from `@armoury/ui/tokens` — the single source of truth. The TypeScript token modules (`src/shared/ui/src/tokens/*.ts`) define raw values; each platform applies them through its own styling system:

- **Web**: `src/shared/ui/src/styles/globals.css` maps TypeScript token values to CSS custom properties in `:root`. The `@armoury/web` globals CSS imports this file.
- **Mobile**: `src/mobile/src/tamagui.config.ts` imports token values directly from `@armoury/ui/tokens` and passes them to Tamagui’s `createTamagui()` config.

**Token mapping convention** (CSS custom property → Tamagui token path):

| CSS Custom Property    | Tamagui Token Path                                  | Source (`@armoury/ui/tokens`) |
| ---------------------- | --------------------------------------------------- | ----------------------------- |
| `--background`         | `$background`                                       | `colors.background`           |
| `--foreground`         | `$color`                                            | `colors.foreground`           |
| `--primary`            | `$primary`                                          | `colors.primary`              |
| `--primary-foreground` | `$primaryForeground`                                | `colors.primaryForeground`    |
| `--secondary`          | `$secondary`                                        | `colors.secondary`            |
| `--accent`             | `$accent`                                           | `colors.accent`               |
| `--destructive`        | `$red10` (Tamagui built-in)                         | `colors.destructive`          |
| `--border`             | `$borderColor`                                      | `colors.border`               |
| `--highlight`          | `$blue9` (Tamagui built-in, darkened)               | `colors.highlight`            |
| `--muted-foreground`   | `$placeholderColor`                                 | `colors.mutedForeground`      |
| `--radius`             | `$radius` (set to `10` = 10px, matching `0.625rem`) | `radii.default`               |

> **Note**: Tamagui tokens like `$red10` and `$blue9` are built-in Tamagui color tokens used as aliases. The actual OKLCH values are imported from `@armoury/ui/tokens/colors` and overridden in the Tamagui config to match exactly.

#### 11.9.2 Mobile Component Pattern (Button)

```typescript
// src/shared/ui/src/components/button/Button.native.tsx

/**
 * @requirements
 * 1. Must extend shared ButtonProps from Button.types.ts.
 * 2. Must use Tamagui Button primitive as the underlying implementation.
 * 3. Must map ButtonVariant to Tamagui theme/variant props.
 * 4. Must enforce minHeight={44} for touch target compliance (A11Y-003).
 * 5. Must support disabled state with visual feedback.
 */

import { Button as TamaguiButton, type ButtonProps as TamaguiButtonProps } from 'tamagui';
import * as React from 'react';
import type { ButtonProps, ButtonVariant, ButtonSize } from './Button.types.js';

// Map shared variants to Tamagui themes
const variantThemeMap: Record<ButtonVariant, string | undefined> = {
  primary:     undefined,           // uses default Tamagui theme
  secondary:   'alt1',
  highlight:   'blue',
  ghost:       'alt2',
  destructive: 'red',
  outline:     'alt1',
};

const sizeHeightMap: Record<NonNullable<ButtonProps['size']>, number> = {
  sm: 44,   // minimum touch target even for small buttons
  md: 44,
  lg: 52,
};

export interface NativeButtonProps
  extends ButtonProps,
    Omit<TamaguiButtonProps, keyof ButtonProps | 'children'> {}

export function Button({
  variant = 'primary',
  size = 'md',
  disabled,
  children,
  ...props
}: NativeButtonProps): React.ReactElement {
  return (
    <TamaguiButton
      theme={variantThemeMap[variant]}
      height={sizeHeightMap[size]}
      minHeight={44}         // always enforced for accessibility
      disabled={disabled}
      opacity={disabled ? 0.5 : 1}
      {...props}
    >
      {children}
    </TamaguiButton>
  );
}

Button.displayName = 'Button';
```

#### 11.9.3 Mobile Compound Pattern (Drawer via Tamagui Sheet)

```typescript
// src/shared/ui/src/components/drawer/Drawer.native.tsx — abbreviated pattern

import { Sheet } from 'tamagui';
import * as React from 'react';
import type { DrawerProps } from './Drawer.types.js';

export function Drawer({ open, onOpenChange, children, snapPoints = [85], ...props }: DrawerProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={snapPoints}
      dismissOnSnapToBottom
      {...props}
    >
      <Sheet.Overlay />
      <Sheet.Frame padding="$4" gap="$4">
        <Sheet.Handle />
        {children}
      </Sheet.Frame>
    </Sheet>
  );
}

Drawer.displayName = 'Drawer';
```

---

### 11.10 Existing Web Components — Migration Note

`@armoury/web` currently has components in `src/web/src/components/ui/` (Button, Dialog, Select, Input, etc.) that were built before `@armoury/ui` existed. These are web-only implementations and are correct. They do **not** need to be moved unless and until their equivalent is needed on mobile.

**Migration trigger:** When any component in `src/web/src/components/ui/` is first needed on mobile, it must be promoted to `@armoury/ui`:

1. Create the component directory under `src/shared/ui/src/components/<component>/`.
2. Extract the shared prop interface into `<Component>.types.ts`.
3. Move the web implementation to `<Component>.web.tsx` and update its imports.
4. Create the mobile implementation in `<Component>.native.tsx`.
5. Update `@armoury/web` imports to point to `@armoury/ui/components/<component>` instead of `@web/src/components/ui/<Component>`.
6. Delete the original file from `src/web/src/components/ui/`.

Until this migration trigger is reached, the existing web-only components remain in place. **Do not pre-migrate** components that are not yet needed on mobile.

**Components currently in `src/web/src/components/ui/` that are candidates for future promotion:**

| Component      | Mobile Equivalent Needed?                  | Notes                                     |
| -------------- | ------------------------------------------ | ----------------------------------------- |
| `Button`       | Yes — used everywhere                      | First candidate for promotion             |
| `Badge`        | Yes — keyword chips on Unit Drawer         | Second candidate                          |
| `Avatar`       | Yes — Profile Popover                      | Third candidate                           |
| `Input`        | Yes — all forms                            | Fourth candidate                          |
| `Select`       | Yes — form controls                        | Fifth candidate                           |
| `Skeleton`     | Yes — loading states                       | Sixth candidate                           |
| `Dialog`       | No — web-only modal                        | Sheet on mobile is structurally different |
| `Tabs`         | Conditional — mobile uses Expo Router tabs | Evaluate at implementation time           |
| `Toast`        | Yes — notifications                        | Via Sonner (web) / Tamagui Toast (mobile) |
| `Switch`       | Yes — account settings                     | Seventh candidate                         |
| `Card`         | Conditional                                | Evaluate at implementation time           |
| `Separator`    | Yes — drawer sections                      | Simple enough to promote early            |
| `DropdownMenu` | No — web-only affordance                   | Mobile uses ActionSheet                   |
| `AlertDialog`  | Conditional                                | Evaluate at implementation time           |

---

### 11.11 Definition of Done for `@armoury/ui` Phase 0

Phase 0 for `@armoury/ui` is complete when ALL of the following are true:

**Workspace scaffold:**

- [ ] `src/shared/ui/` directory created with the scaffolded structure from §11.2
- [ ] `package.json` created per §11.4 (with `./tokens`, `./themes`, `./styles`, `./components/*` subpath exports)
- [ ] `tsconfig.json` created per §11.5
- [ ] `src/shared/ui` registered in root `package.json` workspaces array
- [ ] `npm install` succeeds with the new workspace
- [ ] `turbo run typecheck --filter=@armoury/ui` passes (empty package with correct tsconfig)

**Design system scaffold (tokens, themes, styles):**

- [ ] `src/shared/ui/src/tokens/index.ts` barrel file created
- [ ] `src/shared/ui/src/tokens/colors.ts` created with OKLCH color palette (source of truth)
- [ ] `src/shared/ui/src/tokens/spacing.ts` created with spacing scale
- [ ] `src/shared/ui/src/tokens/radii.ts` created with border-radius tokens
- [ ] `src/shared/ui/src/tokens/typography.ts` created with font size/weight/line-height tokens
- [ ] `src/shared/ui/src/tokens/animation.ts` created with duration/easing tokens
- [ ] `src/shared/ui/src/themes/index.ts` barrel file created
- [ ] `src/shared/ui/src/themes/dark.ts` created with dark tactical theme (V1 default, C-04)
- [ ] `src/shared/ui/src/themes/types.ts` created with `Theme` interface and `ThemeTokens` type
- [ ] `src/shared/ui/src/styles/index.ts` barrel file created
- [ ] `src/shared/ui/src/styles/cn.ts` created with `cn()` utility (clsx + tailwind-merge)
- [ ] `src/shared/ui/src/styles/cva.ts` created with CVA re-export
- [ ] `src/shared/ui/src/styles/globals.css` created with CSS custom properties per §11.8.4

**Component scaffold:**

- [ ] `src/shared/ui/src/index.ts` barrel file created (re-exports tokens, themes, styles, and component barrels)
- [ ] `src/shared/ui/src/types.ts` created with shared base types (at minimum: `ButtonVariant`, `ButtonSize`, `DrawerSide`)
- [ ] `src/shared/ui/src/components/index.ts` barrel file created (empty stubs are acceptable; populated during feature phases)

**Integration:**

- [ ] `@armoury/ui` added to `@armoury/web` and `@armoury/mobile` as a workspace dependency in their respective `package.json` files
- [ ] Tailwind v4 `globals.css` in `@armoury/web` imports `@armoury/ui/styles/globals.css` and includes `@theme inline` per §11.8.4
- [ ] `@armoury/mobile` `tamagui.config.ts` imports token values from `@armoury/ui/tokens` per §11.9.1
- [ ] §12 component registry table reviewed — all 27 components listed with correct tier, Radix base, and phase mapping
- [ ] SHARED_COMPONENTS.md §I styling contracts cross-referenced from §12 notes

---

## 12. Shared UI Component Registry

Consolidated master index of all 27 shared components across `@armoury/ui`, organized by classification tier (see §11.3 for tier definitions). This table complements §7 (cross-phase reuse tracking) by providing implementation metadata and §11 (scaffold patterns) by enumerating the full component surface area.

For per-component styling contracts, CVA variant tables, and accessibility responsibility matrices, see [SHARED_COMPONENTS.md §I](SHARED_COMPONENTS.md#i-component-styling-contracts).

| #   | Component            | Tier | Radix Base                    | Defined In             | Usage Phases | Effort | Mobile Variant             |
| --- | -------------------- | ---- | ----------------------------- | ---------------------- | ------------ | ------ | -------------------------- |
| 1   | Button               | A    | `@radix-ui/react-slot`        | §11.8.2                | 1–5          | S      | Tamagui `Button` (§11.9.2) |
| 2   | Dialog               | A    | `@radix-ui/react-dialog`      | §11.8.3                | 2, 3, 4      | M      | Tamagui `Sheet`            |
| 3   | Drawer               | A    | `@radix-ui/react-dialog`      | §11.8.3                | 1–5          | L      | Tamagui `Sheet` (§11.9.3)  |
| 4   | DrawerStack          | A    | — (composition)               | SHARED_COMPONENTS §3.6 | 1, 2, 5      | M      | Stacked `Sheet`            |
| 5   | Popover              | A    | `@radix-ui/react-popover`     | SHARED_COMPONENTS §3.5 | 1, 3, 4      | S      | Tamagui `Popover`          |
| 6   | Select               | A    | `@radix-ui/react-select`      | Phase 2                | 2, 3         | S      | RN `Picker`                |
| 7   | Toast / ToastStack   | A    | `@radix-ui/react-toast`       | SHARED_COMPONENTS §3.8 | 1–5          | M      | RN `Toast`                 |
| 8   | Checkbox             | A    | `@radix-ui/react-checkbox`    | Phase 2                | 2, 4         | S      | Tamagui `Checkbox`         |
| 9   | RadioGroup           | A    | `@radix-ui/react-radio-group` | Phase 3                | 3            | S      | Tamagui `RadioGroup`       |
| 10  | Switch               | A    | `@radix-ui/react-switch`      | Phase 4                | 4            | S      | Tamagui `Switch`           |
| 11  | Separator            | A    | `@radix-ui/react-separator`   | Phase 2                | 2, 5         | XS     | Tamagui `Separator`        |
| 12  | ShellLayout          | B    | —                             | SHARED_COMPONENTS §3.1 | 1–5          | L      | Expo `Tabs` + `Stack`      |
| 13  | Navigation           | B    | —                             | SHARED_COMPONENTS §3.2 | 1–5          | M      | Expo Router                |
| 14  | ProfilePopover       | B    | —                             | SHARED_COMPONENTS §3.5 | 1            | S      | Modal screen               |
| 15  | ThemeProvider        | B    | —                             | SHARED_COMPONENTS §3.3 | 1–5          | M      | Tamagui `TamaguiProvider`  |
| 16  | UnitDetailDrawer     | B    | —                             | SHARED_COMPONENTS §3.6 | 1, 2, 5      | XL     | Full-screen `Sheet`        |
| 17  | ErrorBoundary        | B    | —                             | Phase 1                | 1–5          | S      | Same (React API)           |
| 18  | SuspenseQuery        | B    | —                             | Phase 1                | 1–5          | S      | Same (TanStack)            |
| 19  | CardSkeleton         | C    | —                             | Phase 1                | 1, 2, 4      | XS     | Tamagui skeleton           |
| 20  | ListItemSkeleton     | C    | —                             | Phase 1                | 1, 2, 5      | XS     | Tamagui skeleton           |
| 21  | DrawerHeaderSkeleton | C    | —                             | Phase 1                | 1, 2, 5      | XS     | Tamagui skeleton           |
| 22  | StatTableSkeleton    | C    | —                             | Phase 2                | 2, 5         | XS     | Tamagui skeleton           |
| 23  | WeaponTableSkeleton  | C    | —                             | Phase 2                | 2, 5         | XS     | Tamagui skeleton           |
| 24  | IconButton           | C    | —                             | Phase 2                | 2, 3, 4      | XS     | Tamagui `Button` icon-only |
| 25  | Badge                | C    | —                             | Phase 2                | 2, 3, 4, 5   | XS     | Tamagui `Badge`            |
| 26  | Chip                 | C    | —                             | Phase 3                | 3, 4         | XS     | Tamagui `Badge` variant    |
| 27  | Avatar               | C    | —                             | Phase 4                | 4            | XS     | Tamagui `Avatar`           |

**Tier key**: **A** = Radix-based primitives (wrap Radix with CVA styling + shared props interface) · **B** = Custom shared components (no Radix dependency; game-agnostic logic) · **C** = Presentational atoms (stateless, styling-only, leaf nodes)

**Effort key**: XS = <2h · S = 2–4h · M = 1–2d · L = 3–5d · XL = 5–8d

**Notes**:

- Components 1–11 (Tier A) follow the Radix + CVA + Tailwind v4 pattern from §11.8. Radix and Tamagui are peer dependencies (§11.6).
- Components 12–18 (Tier B) are custom implementations defined in [SHARED_COMPONENTS.md](SHARED_COMPONENTS.md).
- Components 19–27 (Tier C) are thin presentational wrappers. Most share a base skeleton/badge pattern and diverge only in dimension and slot count.
- Mobile variants column shows the Tamagui/RN equivalent; cross-platform prop interfaces are defined in `@armoury/ui/src/types.ts` (§11.7).
