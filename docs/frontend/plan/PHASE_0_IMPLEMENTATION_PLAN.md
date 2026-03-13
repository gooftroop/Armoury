# Phase 0 — Implementation Plan

> Agent-executable work breakdown for all Phase 0 Shared Prerequisites deliverables.
> Source: [PHASE_0_SHARED_PREREQUISITES.md](PHASE_0_SHARED_PREREQUISITES.md) · Branch: `feat/phase_0_frontend`

---

## 1. Overview

**Goal**: Produce and merge all interface definitions, context scaffolds, query factory shells, stream facade shells, error contracts, and the `@armoury/ui` design system scaffold that downstream phases depend on.

**Timeline**: Weeks 1–2 (parallel with Phase 1 Foundation and Shared Components).

**Success Criteria** (from PHASE_0_SHARED_PREREQUISITES.md §9):

- All interfaces pass `tsc --noEmit`
- No Phase 2+ code merged until all interface contracts are stable
- `npm install` succeeds with the new workspaces (`@armoury/frontend-context`, `@armoury/frontend-queries`, `@armoury/ui`)
- `turbo run typecheck` passes for all new and affected workspaces

**Working Context**:

- Worktree: `.worktrees/feat-phase-0-frontend`
- Branch: `feat/phase_0_frontend` (from `origin/main`)
- All work happens in the worktree. Main working tree is untouched.

---

## 2. Resolved Design Decisions

The following questions were raised during planning and resolved with the user:

1. **Error contract location** → `src/shared/data/src/errors.ts` — collocated with existing data layer error types. No new workspace needed.

2. **Frontend workspace structure** → Two separate workspaces:
   - `src/shared/frontend/context/` → workspace `@armoury/frontend-context` with its own `package.json` and `tsconfig.json`
   - `src/shared/frontend/queries/` → workspace `@armoury/frontend-queries` with its own `package.json` and `tsconfig.json`
   - These follow the monorepo convention: `@armoury/{name}`, one slash only, no `@shared` prefix in package names.

3. **TanStack Query dependency** → `devDependency` on `@armoury/frontend-queries`. Type-only usage, no runtime cost.

---

## 3. Work Breakdown

Six task groups, ordered by dependency. Groups 1–4 can be parallelized. Group 5 depends on no other group. Group 6 is integration/verification.

### Task Group 1 — Context Provider Scaffolds

**Deliverable**: `GameSystemContext` and `DataContext` type definitions with `createContext` calls.

**Workspace**: `@armoury/frontend-context` at `src/shared/frontend/context/`

| # | File | Exports | Notes |
|---|------|---------|-------|
| 1.1 | `src/shared/frontend/context/package.json` | — | Workspace config, `@armoury/frontend-context` |
| 1.2 | `src/shared/frontend/context/tsconfig.json` | — | Extends base, Bundler moduleResolution, jsx: react-jsx |
| 1.3 | `src/shared/frontend/context/src/GameSystemContext.ts` | `GameSystemContextValue` (interface), `GameSystemContext` (React.Context) | Default value: `null`. |
| 1.4 | `src/shared/frontend/context/src/DataContext.ts` | `DataContextValue` (interface), `DataContext` (React.Context) | Default value: `null`. |
| 1.5 | `src/shared/frontend/context/src/index.ts` | Barrel re-export of 1.3 and 1.4 | Types and values separated. |

**Type Signatures**:

```typescript
// GameSystemContext.ts
import { createContext } from 'react';

export interface GameSystemContextValue {
    /** The currently active game system identifier (e.g., 'wh40k10e'). */
    gameSystemId: string;
    /** Human-readable display name (e.g., 'Warhammer 40,000 10th Edition'). */
    displayName: string;
}

export const GameSystemContext = createContext<GameSystemContextValue | null>(null);
```

```typescript
// DataContext.ts
import { createContext } from 'react';

export interface DataContextValue {
    /** Whether the data layer has finished initializing. */
    isReady: boolean;
    /** The last sync timestamp (ISO 8601), or null if never synced. */
    lastSyncedAt: string | null;
}

export const DataContext = createContext<DataContextValue | null>(null);
```

**Effort**: XS (~1h)

---

### Task Group 2 — Query Factory Shells

**Deliverable**: Cross-phase query factory files with exported function signatures and query key definitions. Bodies are `throw new Error('Not implemented')` stubs.

**Workspace**: `@armoury/frontend-queries` at `src/shared/frontend/queries/`

| # | File | Exports | Consumed By |
|---|------|---------|-------------|
| 2.1 | `src/shared/frontend/queries/package.json` | — | Workspace config, `@armoury/frontend-queries` |
| 2.2 | `src/shared/frontend/queries/tsconfig.json` | — | Extends base, Bundler moduleResolution |
| 2.3 | `src/shared/frontend/queries/src/keys.ts` | `queryKeys` object (centralized key factory) | All query files |
| 2.4 | `src/shared/frontend/queries/src/armies.ts` | `armyListOptions`, `createArmyMutation` | P2, P3, P4, P5 |
| 2.5 | `src/shared/frontend/queries/src/factions.ts` | `factionListOptions` | P2, P5 |
| 2.6 | `src/shared/frontend/queries/src/gameSystems.ts` | `gameSystemsOptions` | All |
| 2.7 | `src/shared/frontend/queries/src/units.ts` | `unitCatalogOptions` | P3, P5 |
| 2.8 | `src/shared/frontend/queries/src/matches.ts` | `matchListOptions`, `matchDetailOptions`, `matchSummaryOptions` | P4 |
| 2.9 | `src/shared/frontend/queries/src/index.ts` | Barrel re-export of 2.3–2.8 | — |

**Type Signatures** (example — `armies.ts`):

```typescript
// armies.ts
import type { UseMutationOptions } from '@tanstack/react-query';

/**
 * @requirements
 * 1. Must export armyListOptions as a query factory returning queryOptions-compatible shape.
 * 2. Must export createArmyMutation as a mutation factory returning UseMutationOptions-compatible shape.
 * 3. Must use centralized query keys from keys.ts.
 * 4. Bodies are stub-only — Phase 1 provides implementations.
 */

export function armyListOptions() {
    return {
        queryKey: queryKeys.armies.list(),
        queryFn: async (): Promise<Army[]> => {
            throw new Error('Not implemented — provided by Phase 1');
        },
        staleTime: 5 * 60 * 1000,
    };
}

export function createArmyMutation(): UseMutationOptions<Army, ApiErrorResponse, CreateArmyInput> {
    return {
        mutationFn: async (_input: CreateArmyInput): Promise<Army> => {
            throw new Error('Not implemented — provided by Phase 1');
        },
    };
}
```

**Key Factory** (`keys.ts`):

```typescript
export const queryKeys = {
    armies: {
        all: () => ['armies'] as const,
        list: () => [...queryKeys.armies.all(), 'list'] as const,
        detail: (id: string) => [...queryKeys.armies.all(), 'detail', id] as const,
    },
    factions: {
        all: () => ['factions'] as const,
        list: () => [...queryKeys.factions.all(), 'list'] as const,
    },
    gameSystems: {
        all: () => ['game-systems'] as const,
        list: () => [...queryKeys.gameSystems.all(), 'list'] as const,
    },
    units: {
        all: () => ['units'] as const,
        catalog: (factionId?: string) => [...queryKeys.units.all(), 'catalog', { factionId }] as const,
    },
    matches: {
        all: () => ['matches'] as const,
        list: () => [...queryKeys.matches.all(), 'list'] as const,
        detail: (id: string) => [...queryKeys.matches.all(), 'detail', id] as const,
        summary: (id: string) => [...queryKeys.matches.all(), 'summary', id] as const,
    },
} as const;
```

**Dependencies**: `@tanstack/react-query` as `devDependency` for type-only imports. Also needs model types from `@armoury/models` and the `ApiErrorResponse` from Task Group 4 (via `@armoury/data`).

**Effort**: S (~2–3h)

---

### Task Group 3 — Stream Facade Shells

**Deliverable**: `FriendPresenceStream` and `CampaignNotificationStream` class shells with interfaces, `BehaviorSubject`, and `dispose()`.

**Directory**: `src/shared/streams/src/social/` and `src/shared/streams/src/campaigns/` (new subdirectories within existing `@armoury/streams` workspace)

| # | File | Exports | Pattern Source |
|---|------|---------|---------------|
| 3.1 | `src/shared/streams/src/types.ts` | Add `IFriendPresenceStream`, `ICampaignNotificationStream` interfaces + supporting types | Extend existing file |
| 3.2 | `src/shared/streams/src/social/FriendPresenceStream.ts` | `FriendPresenceStream` class, `createFriendPresenceStream` factory | Follow `PresenceStream` pattern |
| 3.3 | `src/shared/streams/src/campaigns/CampaignNotificationStream.ts` | `CampaignNotificationStream` class, `createCampaignNotificationStream` factory | Follow `PresenceStream` pattern |
| 3.4 | `src/shared/streams/src/index.ts` | Update barrel to export new streams | Extend existing file |

**Type Signatures** (from PHASE_0 §2.2):

```typescript
// Add to types.ts

/** Map of friend userId → presence status. */
export type FriendPresenceMap = ReadonlyMap<string, FriendPresence>;

export interface FriendPresence {
    userId: string;
    status: 'online' | 'away' | 'in-match';
    /** Match ID if status is 'in-match'. */
    matchId?: string;
}

export interface IFriendPresenceStream extends IStream {
    readonly presence$: Observable<FriendPresenceMap>;
    destroy(): void;
}

export interface CampaignNotification {
    id: string;
    campaignId: string;
    type: 'invitation' | 'phase-change' | 'result-posted';
    message: string;
    /** ISO 8601 timestamp. */
    timestamp: string;
    read: boolean;
}

export interface ICampaignNotificationStream extends IStream {
    readonly notifications$: Observable<CampaignNotification[]>;
    destroy(): void;
}
```

**Implementation Pattern** (shell — Phase 4 provides full implementation):

```typescript
// FriendPresenceStream.ts — shell
export class FriendPresenceStream implements IFriendPresenceStream {
    private readonly presenceSubject = new BehaviorSubject<FriendPresenceMap>(new Map());
    readonly presence$ = this.presenceSubject.asObservable();
    readonly connectionState$: Observable<ConnectionState>;
    private disposed = false;

    constructor() {
        // Shell — no client wiring. Phase 4 provides the real constructor.
        this.connectionState$ = new BehaviorSubject<ConnectionState>('disconnected').asObservable();
    }

    destroy(): void {
        if (this.disposed) return;
        this.disposed = true;
        this.presenceSubject.complete();
    }

    dispose(): void {
        this.destroy();
    }
}

export function createFriendPresenceStream(): FriendPresenceStream {
    return new FriendPresenceStream();
}
```

**Note**: The existing `PresenceStream` handles `friendOnline`/`friendOffline` messages. `FriendPresenceStream` is a _different_ stream that adds richer presence info (status, matchId). The spec (§2.2) defines it as a separate stream. The naming follows the spec exactly.

**Effort**: S (~2h)

---

### Task Group 4 — API Error Response Contract

**Deliverable**: `ApiErrorResponse` interface and `ApiErrorCode` type.

**Location**: `src/shared/data/src/errors.ts` (new file — collocated with existing data layer types in `@armoury/data`)

| # | File | Exports |
|---|------|---------|
| 4.1 | `src/shared/data/src/errors.ts` | `ApiErrorResponse`, `ApiErrorCode`, `isApiErrorResponse` type guard |
| 4.2 | `src/shared/data/src/index.ts` | Update barrel to export new error types |

**Type Signatures** (from PHASE_0 §4a — verbatim):

```typescript
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

export function isApiErrorResponse(error: unknown): error is ApiErrorResponse {
    return (
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        'code' in error &&
        'message' in error &&
        typeof (error as ApiErrorResponse).status === 'number' &&
        typeof (error as ApiErrorResponse).code === 'string' &&
        typeof (error as ApiErrorResponse).message === 'string'
    );
}
```

**Effort**: XS (~30min)

---

### Task Group 5 — `@armoury/ui` Design System Scaffold

**Deliverable**: Full `@armoury/ui` workspace scaffold per PHASE_0 §11.

This is the largest task group. It creates the workspace, directory structure, package config, token files, theme, styles, and component stubs.

#### 5A — Workspace Setup

| # | Task | Details |
|---|------|---------|
| 5A.1 | Move `src/ui/` → `src/shared/ui/` | Git mv to preserve history. Copy existing `types.ts` and `index.ts`. |
| 5A.2 | Create `src/shared/ui/package.json` | Per §11.4 — subpath exports for tokens, themes, styles, components. |
| 5A.3 | Create `src/shared/ui/tsconfig.json` | Per §11.5 — Bundler module resolution, jsx: react-jsx. |
| 5A.4 | Update root `package.json` workspaces | Add `"src/shared/ui"`, `"src/shared/frontend/context"`, `"src/shared/frontend/queries"`. Remove `"src/ui"` if present (it's not currently in workspaces). |
| 5A.5 | Run `npm install` | Verify workspace links resolve. |

#### 5B — Design Tokens

| # | File | Content |
|---|------|---------|
| 5B.1 | `src/shared/ui/src/tokens/colors.ts` | OKLCH color palette (source of truth). All values from §11.8.4 `:root` block. |
| 5B.2 | `src/shared/ui/src/tokens/spacing.ts` | Spacing scale (4px base, up to 96). |
| 5B.3 | `src/shared/ui/src/tokens/radii.ts` | Border-radius tokens (sm, md, lg, xl, full). Base: `0.625rem`. |
| 5B.4 | `src/shared/ui/src/tokens/typography.ts` | Font sizes, weights, line heights, letter spacing. |
| 5B.5 | `src/shared/ui/src/tokens/animation.ts` | Durations, easings, reduced-motion fallbacks. |
| 5B.6 | `src/shared/ui/src/tokens/index.ts` | Barrel re-export. |

#### 5C — Themes

| # | File | Content |
|---|------|---------|
| 5C.1 | `src/shared/ui/src/themes/types.ts` | `Theme` interface, `ThemeTokens` type. |
| 5C.2 | `src/shared/ui/src/themes/dark.ts` | Dark tactical theme (V1 default, C-04). Assembles tokens into a theme object. |
| 5C.3 | `src/shared/ui/src/themes/index.ts` | Barrel re-export. |

#### 5D — Styles

| # | File | Content |
|---|------|---------|
| 5D.1 | `src/shared/ui/src/styles/cn.ts` | `cn()` utility (clsx + tailwind-merge). |
| 5D.2 | `src/shared/ui/src/styles/cva.ts` | CVA re-export with project defaults. |
| 5D.3 | `src/shared/ui/src/styles/globals.css` | CSS custom properties per §11.8.4 — `:root` block with OKLCH values. |
| 5D.4 | `src/shared/ui/src/styles/index.ts` | Barrel re-export. |

#### 5E — Component Stubs

Per §11.11, component stubs are acceptable for Phase 0. Each component gets its directory with:
- `<Component>.types.ts` — shared prop interface (zero platform imports)
- `index.ts` — barrel re-exporting the types

Full `.web.tsx` / `.native.tsx` implementations come during feature phases.

**Phase 0 component stubs** (13 components from the registry that are Tier A primitives or used in Weeks 1–4):

| # | Component | Directory | Types to Define |
|---|-----------|-----------|-----------------|
| 5E.1 | Button | `components/button/` | `ButtonProps`, `ButtonVariant`, `ButtonSize` |
| 5E.2 | Badge | `components/badge/` | `BadgeProps`, `BadgeVariant` |
| 5E.3 | Chip | `components/chip/` | `ChipProps` |
| 5E.4 | Avatar | `components/avatar/` | `AvatarProps` |
| 5E.5 | Skeleton | `components/skeleton/` | `SkeletonProps` |
| 5E.6 | Input | `components/input/` | `InputProps` |
| 5E.7 | Select | `components/select/` | `SelectProps`, `SelectOption` |
| 5E.8 | Checkbox | `components/checkbox/` | `CheckboxProps` |
| 5E.9 | RadioGroup | `components/radio-group/` | `RadioGroupProps`, `RadioItemProps` |
| 5E.10 | Switch | `components/switch/` | `SwitchProps` |
| 5E.11 | Drawer | `components/drawer/` | `DrawerProps`, `DrawerSide` |
| 5E.12 | Toast | `components/toast/` | `ToastProps`, `ToastVariant` |
| 5E.13 | Separator | `components/separator/` | `SeparatorProps` |

Plus barrel files:
| 5E.14 | `components/index.ts` | Barrel re-exporting all component type barrels |

#### 5F — Top-Level Barrels and Types

| # | File | Content |
|---|------|---------|
| 5F.1 | `src/shared/ui/src/types.ts` | Shared base types (`ButtonVariant`, `ButtonSize`, `DrawerSide`, etc.). Migrated from `src/ui/src/types.ts`. |
| 5F.2 | `src/shared/ui/src/index.ts` | Main barrel — re-exports tokens, themes, styles, and component barrels. |

**Effort**: L (~3–5 days) — largest task group due to file count.

---

### Task Group 6 — Integration and Verification

**Deliverable**: All contracts pass `tsc --noEmit` and workspaces are operational.

| # | Task | Verification Command |
|---|------|---------------------|
| 6.1 | `npm install` succeeds | `npm install` exit code 0 |
| 6.2 | `@armoury/ui` typechecks | `turbo run typecheck --filter=@armoury/ui` |
| 6.3 | `@armoury/streams` typechecks | `turbo run typecheck --filter=@armoury/streams` |
| 6.4 | `@armoury/frontend-context` typechecks | `turbo run typecheck --filter=@armoury/frontend-context` |
| 6.5 | `@armoury/frontend-queries` typechecks | `turbo run typecheck --filter=@armoury/frontend-queries` |
| 6.6 | `@armoury/data` typechecks (error contract) | `turbo run typecheck --filter=@armoury/data` |
| 6.7 | Full monorepo typecheck | `npm run typecheck` |
| 6.8 | Lint passes | `npm run lint` |

**Effort**: S (~1–2h)

---

## 4. Dependency Graph (Between Task Groups)

```
Task Group 1 (Context Scaffolds)     ─┐
Task Group 2 (Query Factory Shells)   ├─→ Task Group 6 (Integration)
Task Group 3 (Stream Facade Shells)   │
Task Group 4 (Error Contract)        ─┤
Task Group 5A (UI Workspace Setup)   ─┤
                                      │
Task Group 5B–5F (UI Scaffold)  ──────┘
      └── depends on 5A
```

**Parallelizable**: Groups 1, 2, 3, 4, and 5A can all start simultaneously.
**Sequential**: 5B–5F depend on 5A. Group 6 depends on all others.

**Cross-group dependency**: Group 2 (`@armoury/frontend-queries`) imports `ApiErrorResponse` from Group 4 (`@armoury/data`). Both workspaces must be registered in root `package.json` before `npm install`.

---

## 5. Execution Strategy

### Recommended PR Structure

Given the AGENTS.md requirement of "commit small, commit fast" and "one concern per PR", the work splits into **4 focused PRs**:

| PR | Contents | Groups | Est. Files |
|----|----------|--------|------------|
| PR 1: Contracts | Context workspace + Query workspace + Error contract + root workspace registration | 1, 2, 4 | ~16 files |
| PR 2: Streams | Stream facade shells (types + classes + barrel update) | 3 | ~4 files |
| PR 3: Design System | Full `@armoury/ui` scaffold (workspace move + tokens + themes + styles + component stubs) | 5 | ~45 files |
| PR 4: Verification | Integration verification, any fixups | 6 | 0 new files |

PR 1 and PR 2 can be created in parallel. PR 3 is independent but largest. PR 4 is a verification pass after the others merge.

### Delegation Plan

| PR | Category | Skills | Rationale |
|----|----------|--------|-----------|
| PR 1 | `quick` | — | Small files, explicit type signatures, minimal logic. Includes workspace setup (package.json, tsconfig.json). |
| PR 2 | `quick` | — | Follow exact existing stream patterns, shell only |
| PR 3 | `visual-engineering` | `frontend-ux-engineer`, `best-practices` | Design system scaffold, token architecture, CSS patterns |

### Cost Estimate

```
Phase: Implementation

Estimated operations:
  - ~15 file reads (already done during discovery)
  - ~65 file writes/edits (mostly new files)
  - 3 delegated tasks: 2x quick, 1x visual-engineering
  - 0 agent calls (all context already gathered)

Delegation plan:
  - task(category="quick") x 2 → Haiku (Low)
  - task(category="visual-engineering") x 1 → Gemini Pro (Mid-High)

Relative cost: Moderate
Confidence: High (scope is fully defined, no unknowns)
```

---

## 6. File Creation Checklist

Complete ordered list of every file to create or modify. Agent must verify each file passes `tsc --noEmit` after creation.

### New Directories

```
src/shared/frontend/                        (new)
src/shared/frontend/context/                (new — workspace root)
src/shared/frontend/context/src/            (new)
src/shared/frontend/queries/                (new — workspace root)
src/shared/frontend/queries/src/            (new)
src/shared/streams/src/social/              (new)
src/shared/streams/src/campaigns/           (new)
src/shared/ui/                              (moved from src/ui/)
src/shared/ui/src/tokens/                   (new)
src/shared/ui/src/themes/                   (new)
src/shared/ui/src/styles/                   (new)
src/shared/ui/src/components/               (new)
src/shared/ui/src/components/button/
src/shared/ui/src/components/badge/
src/shared/ui/src/components/chip/
src/shared/ui/src/components/avatar/
src/shared/ui/src/components/skeleton/
src/shared/ui/src/components/input/
src/shared/ui/src/components/select/
src/shared/ui/src/components/checkbox/
src/shared/ui/src/components/radio-group/
src/shared/ui/src/components/switch/
src/shared/ui/src/components/drawer/
src/shared/ui/src/components/toast/
src/shared/ui/src/components/separator/
```

### New Files (by Task Group)

**Group 1 — Context Scaffolds** (5 files):
- [ ] `src/shared/frontend/context/package.json`
- [ ] `src/shared/frontend/context/tsconfig.json`
- [ ] `src/shared/frontend/context/src/GameSystemContext.ts`
- [ ] `src/shared/frontend/context/src/DataContext.ts`
- [ ] `src/shared/frontend/context/src/index.ts`

**Group 2 — Query Factory Shells** (9 files):
- [ ] `src/shared/frontend/queries/package.json`
- [ ] `src/shared/frontend/queries/tsconfig.json`
- [ ] `src/shared/frontend/queries/src/keys.ts`
- [ ] `src/shared/frontend/queries/src/armies.ts`
- [ ] `src/shared/frontend/queries/src/factions.ts`
- [ ] `src/shared/frontend/queries/src/gameSystems.ts`
- [ ] `src/shared/frontend/queries/src/units.ts`
- [ ] `src/shared/frontend/queries/src/matches.ts`
- [ ] `src/shared/frontend/queries/src/index.ts`

**Group 3 — Stream Facade Shells** (2 new files, 2 modified):
- [ ] `src/shared/streams/src/social/FriendPresenceStream.ts` (new)
- [ ] `src/shared/streams/src/campaigns/CampaignNotificationStream.ts` (new)
- [ ] `src/shared/streams/src/types.ts` (modify — add interfaces)
- [ ] `src/shared/streams/src/index.ts` (modify — add exports)

**Group 4 — Error Contract** (1 new file, 1 modified):
- [ ] `src/shared/data/src/errors.ts` (new)
- [ ] `src/shared/data/src/index.ts` (modify — add export)

**Group 5 — `@armoury/ui` Scaffold** (~45 files):
- [ ] `src/shared/ui/package.json`
- [ ] `src/shared/ui/tsconfig.json`
- [ ] `src/shared/ui/src/index.ts`
- [ ] `src/shared/ui/src/types.ts`
- [ ] `src/shared/ui/src/tokens/index.ts`
- [ ] `src/shared/ui/src/tokens/colors.ts`
- [ ] `src/shared/ui/src/tokens/spacing.ts`
- [ ] `src/shared/ui/src/tokens/radii.ts`
- [ ] `src/shared/ui/src/tokens/typography.ts`
- [ ] `src/shared/ui/src/tokens/animation.ts`
- [ ] `src/shared/ui/src/themes/index.ts`
- [ ] `src/shared/ui/src/themes/types.ts`
- [ ] `src/shared/ui/src/themes/dark.ts`
- [ ] `src/shared/ui/src/styles/index.ts`
- [ ] `src/shared/ui/src/styles/cn.ts`
- [ ] `src/shared/ui/src/styles/cva.ts`
- [ ] `src/shared/ui/src/styles/globals.css`
- [ ] `src/shared/ui/src/components/index.ts`
- [ ] `src/shared/ui/src/components/button/Button.types.ts`
- [ ] `src/shared/ui/src/components/button/index.ts`
- [ ] `src/shared/ui/src/components/badge/Badge.types.ts`
- [ ] `src/shared/ui/src/components/badge/index.ts`
- [ ] `src/shared/ui/src/components/chip/Chip.types.ts`
- [ ] `src/shared/ui/src/components/chip/index.ts`
- [ ] `src/shared/ui/src/components/avatar/Avatar.types.ts`
- [ ] `src/shared/ui/src/components/avatar/index.ts`
- [ ] `src/shared/ui/src/components/skeleton/Skeleton.types.ts`
- [ ] `src/shared/ui/src/components/skeleton/index.ts`
- [ ] `src/shared/ui/src/components/input/Input.types.ts`
- [ ] `src/shared/ui/src/components/input/index.ts`
- [ ] `src/shared/ui/src/components/select/Select.types.ts`
- [ ] `src/shared/ui/src/components/select/index.ts`
- [ ] `src/shared/ui/src/components/checkbox/Checkbox.types.ts`
- [ ] `src/shared/ui/src/components/checkbox/index.ts`
- [ ] `src/shared/ui/src/components/radio-group/RadioGroup.types.ts`
- [ ] `src/shared/ui/src/components/radio-group/index.ts`
- [ ] `src/shared/ui/src/components/switch/Switch.types.ts`
- [ ] `src/shared/ui/src/components/switch/index.ts`
- [ ] `src/shared/ui/src/components/drawer/Drawer.types.ts`
- [ ] `src/shared/ui/src/components/drawer/index.ts`
- [ ] `src/shared/ui/src/components/toast/Toast.types.ts`
- [ ] `src/shared/ui/src/components/toast/index.ts`
- [ ] `src/shared/ui/src/components/separator/Separator.types.ts`
- [ ] `src/shared/ui/src/components/separator/index.ts`

**Modified Files**:
- [ ] `package.json` (root — add `src/shared/ui`, `src/shared/frontend/context`, `src/shared/frontend/queries` to workspaces)

**Deleted/Moved**:
- [ ] `src/ui/` → `src/shared/ui/` (git mv)

---

## 7. Definition of Done (from PHASE_0 §9 + §11.11)

### Core Contracts
- [ ] `GameSystemContext` type and `createContext` call merged in `@armoury/frontend-context`
- [ ] `DataContext` type and `createContext` call merged in `@armoury/frontend-context`
- [ ] Cross-phase query factory shells created with type signatures in `@armoury/frontend-queries`: `armies.ts`, `factions.ts`, `gameSystems.ts`, `units.ts`, `matches.ts`
- [ ] `ApiErrorResponse` and `ApiErrorCode` defined with type guard in `@armoury/data`

### Stream Facades
- [ ] `MatchStream` class verified as already merged (✅ exists)
- [ ] `FriendPresenceStream` class shell merged to `src/shared/streams/src/social/`
- [ ] `CampaignNotificationStream` class shell merged to `src/shared/streams/src/campaigns/`

### `@armoury/ui` Scaffold
- [ ] `src/shared/ui/` directory created with full structure per §11.2
- [ ] `package.json` created per §11.4
- [ ] `tsconfig.json` created per §11.5
- [ ] `src/shared/ui` registered in root workspaces
- [ ] Token files (colors, spacing, radii, typography, animation) created
- [ ] Theme files (dark, types) created
- [ ] Style files (cn, cva, globals.css) created
- [ ] Component type stubs created for all 13 components
- [ ] `npm install` succeeds
- [ ] `turbo run typecheck --filter=@armoury/ui` passes

### New Workspaces
- [ ] `@armoury/frontend-context` registered in root workspaces and typechecks
- [ ] `@armoury/frontend-queries` registered in root workspaces and typechecks

### Verification
- [ ] All interfaces pass `tsc --noEmit` on affected packages
- [ ] `npm run typecheck` passes for entire monorepo
- [ ] UD-13/UD-15 mockup delivery tracked (not blocking)
