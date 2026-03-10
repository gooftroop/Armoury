# State Management Architecture

**Purpose:** Canonical reference for all state management decisions across the Armoury web and mobile applications.

**Scope:** `@armoury/web` (Next.js 15), `@armoury/mobile` (Expo 53/React Native), and `src/shared/frontend/` (pure TypeScript shared modules).

**Related Documents:**

- `docs/frontend/REQUIREMENTS.md` — State management requirements (§4, FE-050 through FE-077)
- `docs/frontend/BEST_PRACTICES.md` — Frontend coding patterns and conventions
- `docs/frontend/REACT_QUERY.md` — Server state patterns via React Query (↗ extracted from §6)
- `docs/frontend/RXJS_STATE.md` — Global/reactive state via RxJS (↗ extracted from §7)
- `docs/frontend/DERIVED_STATE.md` — Derived state patterns (↗ extracted from §9)
- `docs/frontend/STATE_TESTING.md` — State management testing strategy (↗ extracted from §11)
- `docs/CODING_STANDARDS.md` — General coding standards
- `docs/frontend/FRONTEND_PLAN.md` — Frontend plan and monorepo code organization (§9)

---

## Table of Contents

1. [Overview & Philosophy](#1-overview--philosophy)
2. [State Classification Matrix](#2-state-classification-matrix)
3. [State Preference Hierarchy](#3-state-preference-hierarchy)
4. [Local State Patterns](#4-local-state-patterns)
5. [URL State Patterns](#5-url-state-patterns)
6. [Server State via React Query](#6-server-state-via-react-query) ↗
7. [Global / Reactive State via RxJS](#7-global--reactive-state-via-rxjs) ↗
8. [React Context — When and Why](#8-react-context--when-and-why)
9. [Derived State](#9-derived-state) ↗
10. [Library Alternatives Assessment](#10-library-alternatives-assessment)
11. [Testing Strategy](#11-testing-strategy) ↗
12. [File Organization Summary](#12-file-organization-summary)
13. [Migration Path / Implementation Order](#13-migration-path--implementation-order)

---

## 1. Overview & Philosophy

### Why State Management Matters in a Cross-Platform Monorepo

Armoury runs across three distinct runtime surfaces — Next.js 15 (web), Expo 53/React Native (mobile), and Lambda (services) — while sharing a common data layer in `src/shared/`. Each surface has different constraints: the web app must support SSR and URL-driven navigation; the mobile app must handle offline queuing, background sync, and native lifecycle events; both must coordinate real-time updates from WebSocket streams.

Without deliberate state architecture, the codebase accumulates these failure modes:

- **Duplicate remote state** — server data stored in both React Query and `useState`, leading to stale reads and double fetches.
- **Over-fetching** — components trigger redundant network requests because cache state is not shared.
- **Broken real-time** — stream events update local state but React Query subscribers never re-render.
- **Untestable business logic** — state mixed into render logic, making unit tests require full component mounting.
- **State leaks** — RxJS subscriptions left alive after component unmount, or `QueryClient` instances created inside components.

The state architecture in this document solves each of these problems by assigning every piece of state to exactly one owner.

### The Core Principle: Choose the Simplest Tool That Fits

State tools exist on a spectrum of complexity. Use the simplest tool that satisfies the requirements — and resist the temptation to reach for a heavier tool "just in case":

```
useState
  └─ works? → use it
  └─ needs to survive refresh or be shareable? → URL state
  └─ is server/remote data? → React Query
  └─ is global reactive / event-driven? → RxJS
  └─ none of the above? → React Context (document why in a code comment)
```

### State Tier Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    State Tier Hierarchy                      │
├───────┬─────────────────────────────────────────────────────┤
│ Tier  │ Tool / Location                                     │
├───────┼─────────────────────────────────────────────────────┤
│  1    │ useState  (component-local)                          │
│  2    │ URL / search params    (navigable, shareable)       │
│  3    │ React Query            (server/remote/async)        │
│  4    │ RxJS BehaviorSubject   (global reactive / streams)  │
│  5    │ React Context          (last resort: DI, config)    │
└───────┴─────────────────────────────────────────────────────┘
```

### Mental Model

> State lives where it is consumed.
> Remote state is managed by React Query.
> Reactive state is managed by RxJS.
> Everything else is local.

That one sentence resolves most state debates. If a piece of state is only read and written within a single component tree, it is local. If it originates from the server, React Query owns it — even if you need it "globally". If it is event-driven, asynchronous, or crosses the React tree in a reactive way, RxJS owns it. React Context is not a state management solution; it is a dependency injection mechanism.

### Requirements Traceability

| Requirement | Summary                                                    |
| ----------- | ---------------------------------------------------------- |
| FE-050      | All remote/async state managed via `@tanstack/react-query` |
| FE-051      | Local component state preferred for UI state               |
| FE-052      | Global/reactive state uses RxJS                            |
| FE-053      | React Context is last resort                               |
| FE-054      | URL state for filters, pagination, sort, tabs              |

---

## 2. State Classification Matrix

The following table maps every category of application state to the tool that owns it. The "Examples" column uses concrete Armoury domain objects.

| State Type               | Tool                                        | Scope                        | Persistence                                  | Examples                                                                                                                                                                          |
| ------------------------ | ------------------------------------------- | ---------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Local UI**             | `useState`                                  | Component tree               | In-memory (unmounts with component)          | Modal open/closed, form field values, collapsed panel, hover state, loading spinner                                                                                               |
| **URL / Navigation**     | Search params / path params                 | Browser/router               | Survives refresh, shareable via URL          | Army list filters (`faction`, `pointLimit`), pagination (`page`, `pageSize`), sort (`sortBy`, `sortDir`), active tab (`tab=roster`), selected game system (`gameSystem=wh40k10e`) |
| **Server / Remote**      | React Query (`useQuery`, `useMutation`)     | QueryClient (app-wide)       | Configurable staleTime / gcTime              | Army list, army detail, roster, match history, campaign data, user profile, faction reference data, BSData catalogue                                                              |
| **Global / Reactive**    | RxJS `BehaviorSubject` + `@armoury/streams` | App-wide (singleton streams) | In-memory; persisted by mobile offline layer | Live match state, presence/online status, WebSocket event stream, real-time campaign events                                                                                       |
| **Dependency Injection** | React Context                               | Subtree                      | In-memory                                    | `DataContext` (data access object), `GameSystemContext` (active plugin), theme, i18n locale                                                                                       |

### Armoury-Specific Mapping

```
Army list (fetched from API)         → React Query  (armyListOptions)
Army detail (single army by ID)      → React Query  (armyDetailOptions)
Army editor form state               → useState     (colocated local state)
Filter panel expanded/collapsed      → useState
Active filters (faction, pointLimit) → URL params   (?faction=aeldari&points=2000)
Active match (live WebSocket data)   → RxJS         (MatchStream)
Player presence (online/offline)     → RxJS         (PresenceStream)
Current game system plugin           → React Context (GameSystemContext)
DataContext (DAO access)             → React Context (DataContext)
Auth session                         → React Query  (sessionOptions, staleTime: 0)
```

### Requirements Traceability

| Requirement | Summary                    |
| ----------- | -------------------------- |
| FE-050      | Remote state → React Query |
| FE-051      | UI state → local           |
| FE-052      | Reactive state → RxJS      |
| FE-053      | DI/config → Context        |
| FE-054      | Navigation state → URL     |

---

## 3. State Preference Hierarchy

Use this decision tree every time you introduce a new piece of state. Work top to bottom and stop at the first match.

### Decision Flowchart

```
1. Is it scoped to a single component (or a small, tightly coupled subtree)?
   └─ YES → useState (colocated with the component)
   └─ NO  → continue ↓

2. Should the state survive a page refresh or be shareable via URL?
   └─ YES → URL state (useSearchParams / useLocalSearchParams)
   └─ NO  → continue ↓

3. Does the state represent data that lives on the server?
   └─ YES → React Query (queryOptions / useMutation)
   └─ NO  → continue ↓

4. Is the state event-driven, stream-based, or needs to reactively
   coordinate across unrelated components in real time?
   └─ YES → RxJS (BehaviorSubject via @armoury/streams)
   └─ NO  → continue ↓

5. Is this a cross-cutting concern like DI, theming, or config that
   genuinely has no better home?
   └─ YES → React Context (add a comment explaining why no other tier fits)
   └─ NO  → re-examine: you may be over-engineering
```

### Step 1 — Component-Scoped UI → `useState`

```typescript
// src/web/src/components/armies/ArmyListFilterPanel.tsx

'use client';

import { useState } from 'react';

/** Tracks whether the filter panel is open. Pure UI state — no network, no URL. */
export function ArmyListFilterPanel(): JSX.Element {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div>
            <button onClick={() => setIsOpen((prev) => !prev)}>
                {isOpen ? 'Hide Filters' : 'Show Filters'}
            </button>

            {isOpen && <FilterForm />}
        </div>
    );
}
```

### Step 2 — Survives Refresh / Shareable → URL State

```typescript
// src/web/src/app/armies/page.tsx

import { ArmyList } from '@web/components/armies/ArmyList.js';
import { parseArmyFilters } from '@web/lib/urlParams.js';

interface SearchParams {
    faction?: string;
    points?: string;
    page?: string;
}

interface Props {
    searchParams: Promise<SearchParams>;
}

/** Army list page — filters live in the URL so they survive refresh and can be shared. */
export default async function ArmiesPage({ searchParams }: Props): Promise<JSX.Element> {
    const params = await searchParams;
    const filters = parseArmyFilters(params);

    return <ArmyList filters={filters} />;
}
```

### Step 3 — Server Data → React Query

```typescript
// src/web/src/components/armies/ArmyDetail.tsx

'use client';

import { useQuery } from '@tanstack/react-query';
import { armyDetailOptions } from '@shared/frontend/armies/queries.js';

interface Props {
    id: string;
}

/** ✅ Correct: server data lives in React Query — not useState. */
export function ArmyDetail({ id }: Props): JSX.Element {
    const { data: army, isPending, isError } = useQuery(armyDetailOptions(id));

    if (isPending) { return <Skeleton />; }
    if (isError) { return <ErrorBoundaryFallback />; }

    return <ArmyCard army={army} />;
}
```

### Step 4 — Event-Driven / Real-Time → RxJS

```typescript
// src/web/src/components/matches/LiveMatchStatus.tsx

'use client';

import { useSyncExternalStore } from 'react';
import { useMatchStream } from '@web/hooks/useMatchStream.js';

interface Props {
    matchId: string;
}

/** ✅ Correct: live WebSocket data is event-driven — it lives in RxJS. */
export function LiveMatchStatus({ matchId }: Props): JSX.Element {
    const stream = useMatchStream();
    const match = useSyncExternalStore(
        (cb) => {
            const sub = stream.match$(matchId).subscribe(cb);

            return () => sub.unsubscribe();
        },
        () => stream.getMatch(matchId),
        () => stream.getMatch(matchId),
    );

    if (!match) { return <span>Waiting for match data…</span>; }

    return <MatchScoreboard match={match} />;
}
```

### Anti-Example — Wrong Tool: Storing Server Data in `useState`

```typescript
// ❌ WRONG: Never store server data in useState.
// Problems:
//   - No caching → refetches on every mount
//   - No deduplication → two components each trigger their own request
//   - No background revalidation
//   - Violates FE-057

'use client';

import { useState, useEffect } from 'react';
import { dc } from '@shared/data/DataContext.js';
import type { Army } from '@shared/types/entities.js';

function ArmyDetail({ id }: { id: string }): JSX.Element {
    const [army, setArmy] = useState<Army | null>(null);

    useEffect(() => {
        // ❌ No error handling, no loading state, no stale detection
        dc.armies.get(id).then(setArmy);
    }, [id]);

    return <div>{army?.name}</div>;
}
```

### Step 5 — React Context as Last Resort

```typescript
// src/web/src/components/providers/GameSystemContext.tsx

import { createContext, useContext, type ReactNode } from 'react';
import type { GameSystemPlugin } from '@shared/types/plugins.js';

// Context is justified here because:
//   - GameSystemPlugin is a DI concern (swap implementations per environment)
//   - It does not change at runtime — it is set once at app boot
//   - No other tier (URL, Query, RxJS) is appropriate for a stable plugin reference
interface GameSystemContextValue {
    plugin: GameSystemPlugin;
}

const GameSystemContext = createContext<GameSystemContextValue | null>(null);

export function GameSystemProvider({
    plugin,
    children,
}: {
    plugin: GameSystemPlugin;
    children: ReactNode;
}): JSX.Element {
    return (
        <GameSystemContext.Provider value={{ plugin }}>
            {children}
        </GameSystemContext.Provider>
    );
}

/** Returns the active game system plugin. Throws if used outside GameSystemProvider. */
export function useGameSystem(): GameSystemContextValue {
    const ctx = useContext(GameSystemContext);

    if (!ctx) {
        throw new Error('useGameSystem must be used within a GameSystemProvider');
    }

    return ctx;
}
```

---

## 4. Local State Patterns

Local state is the default. If a piece of state is consumed only within a component and its direct children, keep it local. Do not lift it prematurely.

### `useState` — Simple, Independent Values

Use `useState` when you have one or two independent values with no meaningful relationship between them.

```typescript
// src/web/src/components/ui/ConfirmDialog.tsx

'use client';

import { useState, type ReactNode } from 'react';

interface Props {
    onConfirm: () => void;
    children: ReactNode;
}

/** Simple two-state open/closed — local UI state. */
export function ConfirmDialog({ onConfirm, children }: Props): JSX.Element {
    const [isOpen, setIsOpen] = useState(false);

    const handleConfirm = (): void => {
        onConfirm();
        setIsOpen(false);
    };

    return (
        <>
            <button onClick={() => setIsOpen(true)}>{children}</button>

            {isOpen && (
                <dialog open>
                    <p>Are you sure?</p>
                    <button onClick={handleConfirm}>Confirm</button>
                    <button onClick={() => setIsOpen(false)}>Cancel</button>
                </dialog>
            )}
        </>
    );
}
```

### Complex Local State — Multiple `useState` Calls

When a component manages several related values, use multiple `useState` calls rather than a single state object. Keep each state variable independent and derive any combined values inline. For complex forms with many fields, consider a form library (React Hook Form) rather than manual state management.

> **FE-051**: Local component state is the preferred default for UI state.

```typescript
// src/web/src/components/armies/ArmyEditor.tsx
// @requirements FE-051, FE-055

'use client';

import { useState, useMemo } from 'react';
import type { Army, Detachment, Unit } from '@shared/types/entities.js';

interface Props {
    armyId: string;
}

export function ArmyEditor({ armyId }: Props): JSX.Element {
    const [selectedDetachmentId, setSelectedDetachmentId] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'saving' | 'error'>('idle');

    // Army data comes from React Query — not local state (FE-057)
    const { data: army } = useQuery(armyDetailOptions(armyId));

    // Derived value — computed inline, never stored in state (FE-055)
    const selectedDetachment = useMemo(
        () => army?.detachments.find((d) => d.id === selectedDetachmentId) ?? null,
        [army?.detachments, selectedDetachmentId],
    );

    return (
        <div>
            <ArmyNameInput
                value={army?.name ?? ''}
                onChange={() => setIsDirty(true)}
            />
            <DetachmentList
                detachments={army?.detachments ?? []}
                selectedId={selectedDetachmentId}
                onSelect={setSelectedDetachmentId}
            />
        </div>
    );
}
```

### When to Lift State

Lift state up when two sibling components need to read or write the same value. The canonical signal is: "I need to pass a value down to component A and a setter to component B." Lift to their nearest common ancestor — no higher.

```typescript
// ✅ Correct: lift to the nearest common ancestor only

function ArmyEditorPage(): JSX.Element {
    // selectedDetachmentId is shared between the list (writes) and the panel (reads)
    // Lift to the page — do NOT put it in Context or a global store
    const [selectedDetachmentId, setSelectedDetachmentId] = useState<string | null>(null);

    return (
        <div>
            <DetachmentList onSelect={setSelectedDetachmentId} />
            {selectedDetachmentId && (
                <DetachmentPanel detachmentId={selectedDetachmentId} />
            )}
        </div>
    );
}
```

### Anti-Patterns

#### Storing Derived State in `useState`

```typescript
// ❌ WRONG: unitCount is derived from units — never store derived state.
// Violates FE-055: if units changes and you forget to update unitCount, they diverge.

const [units, setUnits] = useState<Unit[]>([]);
const [unitCount, setUnitCount] = useState(0); // ❌

const addUnit = (unit: Unit): void => {
    setUnits((prev) => [...prev, unit]);
    setUnitCount((prev) => prev + 1); // ❌ synchronization debt
};

// ✅ CORRECT: compute inline
const [units, setUnits] = useState<Unit[]>([]);
const unitCount = units.length; // ✅ always consistent
```

#### Syncing Server Data to `useState`

```typescript
// ❌ WRONG: Pulling React Query data into useState creates two sources of truth.
// If the query refetches in the background, the local copy goes stale.
// Violates FE-057.

const { data: army } = useQuery(armyDetailOptions(id));
const [localArmy, setLocalArmy] = useState(army); // ❌ stale after background refetch

// ✅ CORRECT: read directly from the query, use a mutation to write back
const { data: army } = useQuery(armyDetailOptions(id));
const { mutate: saveArmy } = useMutation(saveArmyMutation);
// army is always the server's latest; mutations update via cache invalidation
```

### Requirements Traceability

| Requirement | Summary                                                              |
| ----------- | -------------------------------------------------------------------- |
| FE-051      | Local component state preferred for UI state                         |
| FE-055      | Derived state computed inline, never stored in `useState`            |
| FE-056      | Lift state only as high as needed                                    |
| FE-057      | Never duplicate remote state into `useState`                         |
| FE-058      | Complex local state uses multiple `useState` calls or a form library |

---

## 5. URL State Patterns

URL state is the correct tool when the value should survive a page refresh, appear in browser history, or be shareable via a link. The most common cases are list filters, pagination, sort order, selected tabs, and the active game system.

> **FE-054**: Use URL state for filters, pagination, sort, tabs, and game system selection.

### When URL State Is Appropriate

| State                       | URL? | Why                                    |
| --------------------------- | ---- | -------------------------------------- |
| Active faction filter       | ✅   | Shareable link, survives refresh       |
| Point limit filter          | ✅   | Shareable link                         |
| Page number                 | ✅   | Back button should return to same page |
| Sort column + direction     | ✅   | Consistent with user expectation       |
| Active tab in a detail view | ✅   | Deep-linkable                          |
| Modal open/closed           | ❌   | Transient UI — not meaningful in a URL |
| Hover state                 | ❌   | Ephemeral — would pollute URL          |
| Server data                 | ❌   | Use React Query                        |

### Next.js App Router

The App Router exposes URL state via the `next/navigation` hooks. **These are client-only** — use them only in Client Components (`'use client'`).

```typescript
// src/web/src/components/armies/ArmyListFilters.tsx
// @requirements FE-054

'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';

/** Type-safe representation of army list URL filters. */
interface ArmyListFilters {
    faction: string | null;
    pointLimit: number | null;
    page: number;
    sortBy: 'name' | 'pointLimit' | 'updatedAt';
    sortDir: 'asc' | 'desc';
}

/** Parse URL search params into typed filters with safe defaults. */
function parseArmyListFilters(params: URLSearchParams): ArmyListFilters {
    const faction = params.get('faction');
    const pointLimitRaw = params.get('points');
    const pageRaw = params.get('page');
    const sortBy = params.get('sortBy');
    const sortDir = params.get('sortDir');

    return {
        faction: faction ?? null,
        pointLimit: pointLimitRaw ? Number(pointLimitRaw) : null,
        page: pageRaw ? Math.max(1, Number(pageRaw)) : 1,
        sortBy: (sortBy === 'name' || sortBy === 'pointLimit' || sortBy === 'updatedAt')
            ? sortBy
            : 'updatedAt',
        sortDir: sortDir === 'asc' ? 'asc' : 'desc',
    };
}

/** Serialize typed filters back to URLSearchParams, omitting defaults. */
function serializeArmyListFilters(filters: ArmyListFilters): URLSearchParams {
    const params = new URLSearchParams();

    if (filters.faction) { params.set('faction', filters.faction); }
    if (filters.pointLimit) { params.set('points', String(filters.pointLimit)); }
    if (filters.page > 1) { params.set('page', String(filters.page)); }
    if (filters.sortBy !== 'updatedAt') { params.set('sortBy', filters.sortBy); }
    if (filters.sortDir !== 'desc') { params.set('sortDir', filters.sortDir); }

    return params;
}

/** Army list filter bar — reads from and writes to the URL. */
export function ArmyListFilters(): JSX.Element {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    const filters = parseArmyListFilters(searchParams);

    const updateFilters = useCallback(
        (patch: Partial<ArmyListFilters>): void => {
            // Reset to page 1 when filters change (patch page explicitly to override)
            const next = serializeArmyListFilters({
                ...filters,
                page: 1,
                ...patch,
            });
            router.replace(`${pathname}?${next.toString()}`);
        },
        [filters, pathname, router],
    );

    return (
        <div>
            <FactionSelect
                value={filters.faction}
                onChange={(faction) => updateFilters({ faction })}
            />
            <PointLimitSelect
                value={filters.pointLimit}
                onChange={(pointLimit) => updateFilters({ pointLimit })}
            />
            <SortControl
                sortBy={filters.sortBy}
                sortDir={filters.sortDir}
                onChange={(sortBy, sortDir) => updateFilters({ sortBy, sortDir })}
            />
        </div>
    );
}
```

Consuming the filters in the list component:

```typescript
// src/web/src/components/armies/ArmyList.tsx

'use client';

import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { armyListOptions } from '@shared/frontend/armies/queries.js';
import { parseArmyListFilters } from '@web/lib/urlParams.js';

/** Army list — derives filters from URL, passes them to React Query. */
export function ArmyList(): JSX.Element {
    const searchParams = useSearchParams();
    const filters = parseArmyListFilters(searchParams);

    // Filters are part of the query key — React Query re-fetches automatically when they change
    const { data, isPending } = useQuery(armyListOptions(filters));

    if (isPending) { return <Skeleton />; }

    return (
        <ul>
            {data?.armies.map((army) => (
                <ArmyListItem key={army.id} army={army} />
            ))}
        </ul>
    );
}
```

### Expo Router (React Native)

Expo Router provides analogous hooks. `useLocalSearchParams` reads params for the current route segment; `useGlobalSearchParams` reads the full URL tree.

```typescript
// src/mobile/src/screens/armies/ArmyListScreen.tsx
// @requirements FE-054

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { armyListOptions } from '@shared/frontend/armies/queries.js';
import { parseArmyListFilters } from '@mobile/lib/urlParams.ts';

/** Mobile army list — same URL-driven pattern as web, using Expo Router hooks. */
export function ArmyListScreen(): JSX.Element {
    const params = useLocalSearchParams<{
        faction?: string;
        points?: string;
        page?: string;
    }>();
    const router = useRouter();
    const filters = parseArmyListFilters(new URLSearchParams(params as Record<string, string>));

    const { data, isPending } = useQuery(armyListOptions(filters));

    const applyFilter = (faction: string): void => {
        router.setParams({ faction });
    };

    if (isPending) { return <LoadingSpinner />; }

    return (
        <FlatList
            data={data?.armies}
            renderItem={({ item }) => (
                <ArmyListItem army={item} />
            )}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={
                <FactionFilter
                    value={filters.faction}
                    onChange={applyFilter}
                />
            }
        />
    );
}
```

### Helper Pattern: Type-Safe URL Params

Centralise parsing and serialization in a shared helper. The same logic applies to both web (`URLSearchParams`) and mobile (Expo Router params object).

```typescript
// src/web/src/lib/urlParams.ts

import type { ArmyFilters } from '@shared/types/entities.js';

/** Canonical defaults for army list filters. */
const ARMY_FILTER_DEFAULTS = {
    faction: null,
    pointLimit: null,
    page: 1,
    sortBy: 'updatedAt',
    sortDir: 'desc',
} as const satisfies ArmyFilters;

/**
 * Parse a URLSearchParams object into a validated ArmyFilters.
 * Falls back to canonical defaults for missing or invalid values.
 */
export function parseArmyFilters(params: URLSearchParams | Record<string, string>): ArmyFilters {
    const p = params instanceof URLSearchParams ? params : new URLSearchParams(params);

    const faction = p.get('faction');
    const pointsRaw = p.get('points');
    const pageRaw = p.get('page');
    const sortBy = p.get('sortBy');
    const sortDir = p.get('sortDir');

    return {
        faction: faction ?? ARMY_FILTER_DEFAULTS.faction,
        pointLimit: pointsRaw ? Number(pointsRaw) : ARMY_FILTER_DEFAULTS.pointLimit,
        page: pageRaw ? Math.max(1, Number(pageRaw)) : ARMY_FILTER_DEFAULTS.page,
        sortBy:
            sortBy === 'name' || sortBy === 'pointLimit' || sortBy === 'updatedAt'
                ? sortBy
                : ARMY_FILTER_DEFAULTS.sortBy,
        sortDir: sortDir === 'asc' ? 'asc' : ARMY_FILTER_DEFAULTS.sortDir,
    };
}
```

### Requirements Traceability

| Requirement | Summary                                       |
| ----------- | --------------------------------------------- |
| FE-054      | URL state for filters, pagination, sort, tabs |

---

## 6. Server State via React Query

> **↗ Full document: [Server State via React Query](../REACT_QUERY.md)**

React Query is the single owner of all server/remote data. Every piece of data that originates from an API call — armies, rosters, matches, user profile, reference data, auth session — lives in the React Query cache. Never pull server data out of the cache and into `useState`. Never initiate fetches in `useEffect`.

**Key topics covered in the full document:**

- **Query Key Factories** — Co-located `queryOptions()` with hierarchical `as const` keys enabling fine-grained invalidation (FE-060, FE-061, FE-062)
- **Custom Hooks** — Platform-specific wrappers in `src/web/` and `src/mobile/`; direct `useQuery(options)` preferred for single-use queries (FE-063)
- **Mutations & Cache Invalidation** — Simple mutations invalidate in `onSettled`; latency-sensitive mutations use optimistic updates with cancel → snapshot → update → rollback (FE-064, FE-065, FE-066, FE-067)
- **SSR / RSC Integration** — Server Components prefetch with `QueryClient.prefetchQuery()` + `HydrationBoundary`; `staleTime > 0` prevents redundant client-side refetch (FE-068, FE-069)
- **Cache Configuration** — Per-query `staleTime`/`gcTime` overrides: user data 60s, static reference `Infinity`, auth 0, filtered lists 30s (FE-070, FE-071, FE-072, FE-073)
- **React Native Data Fetching** — Mobile-specific `focusManager`/`onlineManager`, offline mutation persistence with `persistQueryClient` (FE-074, FE-075, FE-076, FE-077)

---

## 7. Global / Reactive State via RxJS

> **↗ Full document: [Global / Reactive State via RxJS](../RXJS_STATE.md)**

RxJS powers all global reactive and event-driven state in Armoury. The existing `@armoury/streams` package provides BehaviorSubject-backed facades over WebSocket clients for live matches, presence, and campaign events.

**Key topics covered in the full document:**

- **When to Use RxJS** — Event-driven data, cross-component coordination, WebSocket streams, complex async composition (FE-052)
- **The @armoury/streams Pattern** — BehaviorSubject + facade class with `dispose()` lifecycle and typed message protocols
- **Higher-Order Mapping Operators** — `switchMap` (latest only), `mergeMap` (parallel), `concatMap` (ordered), `exhaustMap` (ignore during active)
- **Subscribing to RxJS in React** — `useSyncExternalStore` as the canonical bridge; custom `useObservable` hook pattern
- **Memory Management** — `takeUntil(destroy$)` for class-based teardown; `useEffect` cleanup for hook-based teardown
- **Error Handling in RxJS** — `catchError` + `retry`/`retryWhen` strategies; never let errors propagate to BehaviorSubject
- **RxJS → React Query Cache Bridge** — `setQueryData` pattern for writing stream updates into the query cache (FE-055)

---

## 8. React Context — When and Why

Context sits at **tier 5** — the last resort in the state hierarchy. Before reaching for Context, exhaust every lower-tier option:

1. URL state (tier 1) — navigable, shareable, free SSR
2. React Query (tier 2) — server data, caching, background refresh
3. Local component state (tier 3) — `useState`
4. RxJS streams (tier 4) — real-time, cross-component reactive state

Context is appropriate in exactly three scenarios:

| Scenario                                  | Example                                   | Why lower tiers are insufficient     |
| ----------------------------------------- | ----------------------------------------- | ------------------------------------ |
| Third-party library integration           | Theme providers, i18n, toast systems      | Library API requires it              |
| Dependency injection of stable singletons | `DataContextProvider`, game system plugin | Not remote data; not reactive        |
| Feature flags loaded once at startup      | A/B flags resolved on the server          | Value is stable; no re-render needed |

### 8.1 The Justification Requirement

**Every** Context definition must include a JSDoc comment that explicitly names the alternatives considered and explains why each is insufficient. This is not optional — it prevents the category of "Context by default" that degrades render performance across the tree.

```typescript
/**
 * GameSystemContext provides the active game system plugin instance.
 *
 * Why Context over alternatives:
 * - Not URL state: the game system is resolved from the URL segment, but
 *   the plugin instance is a complex object (functions, closures, internal
 *   state) that cannot be serialized into a URL parameter.
 * - Not React Query: the plugin is not remote or async data — it is a local
 *   singleton resolved synchronously at app startup from the registered
 *   plugin registry. React Query adds overhead with no benefit.
 * - Not RxJS: the plugin instance is stable within a route segment (it only
 *   changes when the user navigates to a different game system). Reactive
 *   subscription adds no value for a value that rarely changes.
 * - Context is appropriate: this is canonical dependency injection of a
 *   stable singleton that the entire component subtree depends on, with
 *   no meaningful runtime mutations.
 */
```

### 8.2 The DataContextProvider Pattern

The existing `DataContextProvider` is the reference implementation for Context in this codebase. It injects a stable `DataContext` instance (the data layer adapter) into the component tree — a textbook dependency injection use case.

```typescript
// src/web/src/providers/DataContextProvider.tsx
'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { IDataContext } from '@shared/data/types.js';

/**
 * DataContext provides the active IDataContext adapter to the component tree.
 *
 * Why Context over alternatives:
 * - Not URL state: IDataContext is a class instance with methods and
 *   internal connection state — not serializable.
 * - Not React Query: the adapter is not fetched data; it is the mechanism
 *   by which data is fetched. It must exist before any query can run.
 * - Not RxJS: the adapter is resolved once at app initialization and does
 *   not change. Reactive subscription would add subscription overhead
 *   with zero benefit.
 * - Not local state: the adapter is needed by components at every level
 *   of the tree. Prop-drilling an adapter instance is unworkable.
 * - Context is appropriate: canonical DI of a stable infrastructure
 *   singleton required by the entire component tree.
 */
const DataContext = createContext<IDataContext | null>(null);

interface DataContextProviderProps {
    readonly dataContext: IDataContext;
    readonly children: ReactNode;
}

/** Provides a DataContext adapter instance to the component tree. */
export function DataContextProvider({
    dataContext,
    children,
}: DataContextProviderProps): React.JSX.Element {
    return (
        <DataContext.Provider value={dataContext}>
            {children}
        </DataContext.Provider>
    );
}

/**
 * Returns the active IDataContext adapter.
 *
 * @throws {Error} If called outside a DataContextProvider subtree.
 */
export function useDataContext(): IDataContext {
    const context = useContext(DataContext);

    if (!context) {
        throw new Error('useDataContext must be used within a DataContextProvider');
    }

    return context;
}
```

The guard in `useDataContext` surfaces misconfigured trees at development time rather than producing silent null-dereference failures in production.

### 8.3 Non-Reactive Derived Global State

When a Context-provided value needs to be combined with other state at the consumption boundary, compute it inline rather than storing the derived value. Context values are stable singletons — deriving from them is cheap.

```typescript
// src/web/src/components/armies/ArmyValidationPanel.tsx
'use client';

import { useMemo } from 'react';
import { useDataContext } from '@web/src/providers/DataContextProvider.js';
import { useGameSystem } from '@web/src/providers/GameSystemProvider.js';
import { useQuery } from '@tanstack/react-query';
import { armyDetailOptions } from '@shared/frontend/armies/queries.js';

/**
 * Derives validation results from Context-provided singletons + query data.
 * The derivation is pure and cheap — no need to store in state.
 */
export function ArmyValidationPanel({ armyId }: { armyId: string }): JSX.Element {
    const dataContext = useDataContext();
    const gameSystem = useGameSystem();
    const { data: army } = useQuery(armyDetailOptions(armyId));

    // Derived at the render boundary — never stored (FE-055)
    const validationErrors = useMemo(
        () => army ? gameSystem.validate(army, dataContext) : [],
        [army, gameSystem, dataContext],
    );

    return (
        <ul>
            {validationErrors.map((err) => (
                <li key={err.code}>{err.message}</li>
            ))}
        </ul>
    );
}
```

### 8.4 Migration Path: Context → BehaviorSubject

Context is sufficient when the provided value is **stable** (set once, read many). When requirements change and the value needs to be **reactive** (multiple updates over time, subscribers notified), migrate to a BehaviorSubject with `useSyncExternalStore`.

**Migration triggers** (any one is sufficient):

- The Context value changes more than once per user session
- Multiple components need to re-render on value changes with fine-grained control
- The value participates in RxJS operator chains (`combineLatest`, `switchMap`)
- Performance profiling shows unnecessary subtree re-renders from Context changes

**Migration steps:**

1. Extract the mutable value from the Context provider into a `BehaviorSubject` in a stream facade class (following the `@armoury/streams` pattern — see [RXJS_STATE.md](../RXJS_STATE.md)).
2. Keep the Context provider for DI of the stream facade instance (Context becomes the injection mechanism, not the state holder).
3. Components subscribe to the `BehaviorSubject` via `useSyncExternalStore`, receiving fine-grained updates without re-rendering the entire subtree.

```typescript
// BEFORE: Context holds a mutable theme value (causes full subtree re-render on change)
const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>(...);

// AFTER: Context injects the stream; BehaviorSubject holds the mutable value
// src/shared/streams/src/theme/ThemeStream.ts
import { BehaviorSubject } from 'rxjs';
import type { Theme } from '@shared/types/theme.js';

export class ThemeStream {
    private readonly theme$ = new BehaviorSubject<Theme>('dark');

    get current(): Theme { return this.theme$.getValue(); }
    setTheme(theme: Theme): void { this.theme$.next(theme); }

    // useSyncExternalStore-compatible API
    subscribe(callback: () => void): () => void {
        const sub = this.theme$.subscribe(callback);
        return () => sub.unsubscribe();
    }
    getSnapshot(): Theme { return this.theme$.getValue(); }
}

// src/web/hooks/useTheme.ts
import { useSyncExternalStore } from 'react';
import { useThemeStream } from '@web/src/providers/ThemeStreamProvider.js';

export function useTheme(): Theme {
    const stream = useThemeStream(); // Context provides the stream instance (DI)
    return useSyncExternalStore(
        (cb) => stream.subscribe(cb),
        () => stream.getSnapshot(),
    );
}
```

> **Key insight**: Context's role shifts from "state holder" to "dependency injector" for the reactive store. This preserves the DI pattern while gaining fine-grained reactivity.

### 8.5 Feature Flags Context

Feature flags resolved at startup qualify for Context: they are loaded once (from a server-side request or environment variable) and are stable for the lifetime of the session.

```typescript
// src/web/src/providers/FeatureFlagsProvider.tsx
'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * FeatureFlagsContext provides feature flag values resolved at app startup.
 *
 * Why Context over alternatives:
 * - Not React Query: flags are resolved server-side and passed as a prop
 *   to the provider. There is no client-side fetch to manage.
 * - Not URL state: flags are not user-navigable state; they are
 *   infrastructure configuration.
 * - Not RxJS: flags do not change at runtime. A BehaviorSubject that
 *   never emits a new value is pure overhead.
 * - Context is appropriate: stable, startup-resolved configuration
 *   injected into the entire application tree.
 */

export interface FeatureFlags {
    readonly enableCampaigns: boolean;
    readonly enableMatchPlay: boolean;
    readonly enableBetaEditor: boolean;
}

const FeatureFlagsContext = createContext<FeatureFlags | null>(null);

interface FeatureFlagsProviderProps {
    readonly flags: FeatureFlags;
    readonly children: ReactNode;
}

/** Provides resolved feature flags to the component tree. */
export function FeatureFlagsProvider({
    flags,
    children,
}: FeatureFlagsProviderProps): React.JSX.Element {
    return (
        <FeatureFlagsContext.Provider value={flags}>
            {children}
        </FeatureFlagsContext.Provider>
    );
}

/**
 * Returns the resolved feature flags for the current session.
 *
 * @throws {Error} If called outside a FeatureFlagsProvider subtree.
 */
export function useFeatureFlags(): FeatureFlags {
    const context = useContext(FeatureFlagsContext);

    if (!context) {
        throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
    }

    return context;
}
```

### 8.6 Anti-Patterns

**Frequently changing values in Context** cause every consumer in the tree to re-render on every change, regardless of whether the individual consumer uses the changed value.

```typescript
// ❌ NEVER: Frequently changing values in Context
const MatchStateContext = createContext<MatchState | null>(null);

function MatchStateProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<MatchState>(initialState);

    // Every subscriber re-renders whenever any part of MatchState changes.
    // With real-time WebSocket updates this could be dozens of re-renders/second.
    return (
        <MatchStateContext.Provider value={state}>
            {children}
        </MatchStateContext.Provider>
    );
}
```

```typescript
// ✅ CORRECT: Use RxJS BehaviorSubject + useSyncExternalStore for reactive state
import { useSyncExternalStore } from 'react';
import type { IMatchStream } from '@armoury/streams';

/** Subscribe to the current match state from the RxJS stream. */
export function useMatchState(stream: IMatchStream, matchId: string): Match | undefined {
    return useSyncExternalStore(
        (onStoreChange) => {
            const subscription = stream.match$(matchId).subscribe(onStoreChange);

            return () => subscription.unsubscribe();
        },
        () => stream.getMatch(matchId),
    );
}
```

**Server data in Context** bypasses React Query's caching, deduplication, and background refresh:

```typescript
// ❌ NEVER: Server data in Context
const ArmyListContext = createContext<Army[]>([]);

// ✅ CORRECT: Use React Query directly
import { useQuery } from '@tanstack/react-query';
import { armyListOptions } from '@shared/frontend/armies/queries.js';

export function useArmyList() {
    return useQuery(armyListOptions());
}
```

> **Requirement reference**: FE-053 — Context must be the last resort in the state hierarchy and every use must carry a written justification.

---

## 9. Derived State

> **↗ Full document: [Derived State Patterns](../DERIVED_STATE.md)**

Derived state is any value computed deterministically from existing state. The cardinal rule: **never store derived state** — storing it creates two sources of truth that can diverge (FE-055).

**Key topics covered in the full document:**

- **The Problem** — Why `useState` + `useEffect` sync patterns introduce render-cycle gaps and divergence bugs
- **Tier 1: Pure Server Transform (`select`)** — React Query's `select` option with structural sharing for server-derived values
- **Tier 2: Server + Client Combined** — Inline computation at the render boundary combining query data with URL/local state
- **Tier 3: RxJS → React Query Cache Bridge** — `setQueryData` pattern for writing stream updates into the query cache
- **Anti-Patterns** — Comprehensive table of wrong patterns and their correct replacements; `useMemo` guidance

---

## 10. Library Alternatives Assessment

The current stack — React Query for server state, RxJS for real-time reactive state, `useState` for local state — covers the full range of state management needs in this application. The assessment below evaluates alternatives against the existing stack to inform future decisions.

| Library           | Category              | Strengths                                                                                                     | Weaknesses vs Current Stack                                                                                                        | Recommendation                                                                                |
| ----------------- | --------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Zustand**       | Global client state   | Tiny API surface; vanilla stores via `createStore`; `useSyncExternalStore` compatible; React 19 Compiler safe | Overlaps with RxJS `BehaviorSubject`; team already has RxJS expertise; adds a dependency for patterns already achievable with RxJS | **Consider for Phase 3+** if RxJS becomes unwieldy for non-reactive global state              |
| **Jotai**         | Atomic state          | Fine-grained atom-level reactivity; excellent for independent pieces of UI state                              | Fundamentally different mental model from stream-based reactivity; migration from BehaviorSubject patterns is non-trivial          | **Not recommended**                                                                           |
| **Valtio**        | Proxy-based state     | Mutable API; very easy to learn for newcomers                                                                 | Proxy-based mutation does not compose with RxJS operators; debugging proxy traps is opaque                                         | **Not recommended**                                                                           |
| **Legend State**  | Full state solution   | Extremely fast reactive updates; observable-based                                                             | Overlaps with both React Query (server state) and RxJS (reactive); introducing a third state paradigm increases cognitive overhead | **Not recommended**                                                                           |
| **XState**        | Finite state machines | Formal state machine semantics; excellent for complex multi-step workflows with explicit transitions          | Significant API surface; overkill for most UI state where `useState` suffices                                                      | **Consider** for complex multi-step flows (campaign creation wizard, match setup) in Phase 3+ |
| **Redux Toolkit** | Global state          | Mature ecosystem; excellent DevTools                                                                          | Significant boilerplate even with RTK; React Query already handles server state (the primary Redux use case in this domain)        | **Not recommended**                                                                           |

### 10.1 The Only Viable Candidate: Zustand

Zustand's vanilla `createStore` produces a store that behaves like a `BehaviorSubject` but with a more ergonomic API for teams less familiar with RxJS. It integrates with React via `useSyncExternalStore`, the same primitive used to bridge RxJS to React.

```typescript
// Zustand equivalent of a BehaviorSubject-backed match store (for reference)
// This pattern would live in src/web/src/stores/matchStore.ts IF adopted
import { createStore } from 'zustand/vanilla';
import type { Match } from '@shared/types/entities.js';

interface MatchStoreState {
    readonly matches: ReadonlyMap<string, Match>;
    readonly setMatch: (id: string, match: Match) => void;
    readonly removeMatch: (id: string) => void;
}

/**
 * Vanilla Zustand store for real-time match state.
 *
 * Equivalent to the MatchStream BehaviorSubject pattern but with
 * Zustand's mutation API rather than RxJS operators.
 *
 * Note: This is a reference implementation. The current stack uses
 * MatchStream (RxJS) + React Query cache bridge. Adopt this only if
 * the RxJS expertise gap becomes a maintenance issue.
 */
const matchStore = createStore<MatchStoreState>((set) => ({
    matches: new Map(),
    setMatch: (id, match) =>
        set((state) => {
            const next = new Map(state.matches);

            next.set(id, match);

            return { matches: next };
        }),
    removeMatch: (id) =>
        set((state) => {
            const next = new Map(state.matches);

            next.delete(id);

            return { matches: next };
        }),
}));
```

```typescript
// React hook consuming the vanilla Zustand store via useSyncExternalStore
// src/web/hooks/useMatchStore.ts (hypothetical, not yet adopted)
import { useSyncExternalStore } from 'react';
import type { Match } from '@shared/types/entities.js';

/** Returns the current match state for a given match ID from the vanilla store. */
export function useMatch(matchId: string): Match | undefined {
    return useSyncExternalStore(matchStore.subscribe, () => matchStore.getState().matches.get(matchId));
}
```

Zustand's `createStore` and RxJS `BehaviorSubject` are architecturally equivalent: both are subscribable stores that hold a snapshot and notify subscribers on change. The difference is API ergonomics and operator composability. Zustand wins on simplicity; RxJS wins on composability (operators, combineLatest, switchMap).

### 10.2 React 19 Compiler Compatibility

All options in the table above are compatible with the React 19 Compiler's automatic memoization, with one caveat: proxy-based libraries (Valtio) rely on mutation detection that can conflict with the Compiler's assumptions about referential stability. This is an additional reason to exclude Valtio.

### 10.3 Decision Criteria for Future Adoption

Revisit the Zustand assessment in Phase 3 if **both** conditions are met:

1. The team identifies BehaviorSubject patterns as a recurring friction point in code reviews.
2. The use case does not require RxJS operators (no `combineLatest`, `switchMap`, `debounceTime` in the hot path).

For complex multi-step UI workflows (campaign creation wizard, multi-phase match setup), evaluate XState when the state machine has more than ~5 distinct states with conditional transitions.

---

## 11. Testing Strategy

> **↗ Full document: [State Management Testing Strategy](../STATE_TESTING.md)**

State management tests verify behavior through the public interface — rendered output, emitted values, cache contents — never implementation internals.

**Key topics covered in the full document:**

- **Testing Local State** — Render with controlled inputs, assert on output; test event handlers and state transitions through rendered output
- **Testing URL State** — Mock `next/navigation` at module level; verify router calls
- **Testing React Query** — Fresh `QueryClient` per test; `renderWithQuery` utility; seed cache with `setQueryData`
- **Testing Mutations** — Mock service calls; spy on `invalidateQueries`; test optimistic rollback
- **Testing RxJS Streams** — Pure TypeScript unit tests with `Subject` drivers; no DOM needed
- **Testing Context** — Render within provider; verify `useXxx` guard throws outside provider

---

## 12. File Organization Summary

The file layout enforces separation of concerns between pure TypeScript shared code and platform-specific React/React Native code.

| Concern                                 | Location                            | Example Path                                      |
| --------------------------------------- | ----------------------------------- | ------------------------------------------------- |
| Query key factories + `queryOptions`    | `src/shared/frontend/<feature>/`    | `src/shared/frontend/armies/queries.ts`           |
| Mutation option factories               | `src/shared/frontend/<feature>/`    | `src/shared/frontend/armies/mutations.ts`         |
| Business logic (validators, formatters) | `src/shared/frontend/<feature>/`    | `src/shared/frontend/armies/formatters.ts`        |
| Types and interfaces                    | `src/shared/types/`                 | `src/shared/types/entities.ts`                    |
| RxJS stream facades                     | `src/shared/streams/src/<feature>/` | `src/shared/streams/src/matches/MatchStream.ts`   |
| Web-specific hooks                      | `src/web/hooks/`                    | `src/web/hooks/useArmy.ts`                        |
| Mobile-specific hooks                   | `src/mobile/hooks/`                 | `src/mobile/hooks/useArmy.ts`                     |
| Web React components                    | `src/web/src/components/`           | `src/web/src/components/ArmyList.tsx`             |
| Mobile React Native components          | `src/mobile/src/components/`        | `src/mobile/src/components/ArmyCard.tsx`          |
| Context providers (web)                 | `src/web/src/providers/`            | `src/web/src/providers/DataContextProvider.tsx`   |
| Context providers (mobile)              | `src/mobile/src/providers/`         | `src/mobile/src/providers/AuthProvider.tsx`       |
| Test utilities                          | `src/web/src/__utils__/`            | `src/web/src/__utils__/renderWithQuery.tsx`       |
| Test fixtures                           | colocated `__fixtures__/`           | `src/web/src/components/__fixtures__/makeArmy.ts` |

### 12.1 The Shared Boundary Rule

`src/shared/frontend/` must contain **pure TypeScript only**. No React, no hooks, no JSX. Violations break the mobile build because Expo does not bundle Next.js or React DOM APIs.

The boundary is enforced by the `@armoury/shared` package's `tsconfig.json`, which does not include `@types/react` or JSX settings. Any import of a React API will fail type-checking.

```
src/shared/frontend/
├── armies/
│   ├── queries.ts          ← queryOptions factories (pure TS)
│   ├── mutations.ts        ← MutationOptions factories (pure TS)
│   ├── formatters.ts       ← display formatters (pure TS)
│   └── validators.ts       ← client-side validation (pure TS)
├── matches/
│   ├── queries.ts
│   └── mutations.ts
└── presence/
    └── queries.ts
```

Hooks that call these factories live in the platform-specific workspaces:

```
src/web/hooks/
├── useArmy.ts              ← calls armyDetailOptions, web-only
├── useFilteredArmies.ts    ← combines URL state + React Query, web-only
├── useMatchSync.ts         ← RxJS bridge, web-only
└── usePresenceSync.ts      ← RxJS bridge, web-only

src/mobile/hooks/
├── useArmy.ts              ← same query factories, mobile-specific wrappers
└── useOfflineMutations.ts  ← offline mutation queuing, mobile-only
```

### 12.2 Naming Conventions

| Pattern                 | Convention                                                                | Example                                       |
| ----------------------- | ------------------------------------------------------------------------- | --------------------------------------------- |
| Query option factory    | `<entity>DetailOptions`, `<entity>ListOptions`                            | `armyDetailOptions`, `armyListOptions`        |
| Mutation option factory | `create<Entity>Options`, `update<Entity>Options`, `delete<Entity>Options` | `createArmyOptions`                           |
| Custom hooks            | `use<Feature><Concern>`                                                   | `useArmyUnitCount`, `useFilteredArmies`       |
| Context hook            | `use<ContextName>`                                                        | `useDataContext`, `useFeatureFlags`           |
| Context provider        | `<ContextName>Provider`                                                   | `DataContextProvider`, `FeatureFlagsProvider` |
| Stream hook             | `use<Stream>Sync`                                                         | `useMatchSync`, `usePresenceSync`             |
| Test fixture factory    | `make<Entity>`                                                            | `makeArmy`, `makeUnit`, `makeMatch`           |

---

## 13. Migration Path / Implementation Order

The migration timeline aligns with FRONTEND_PLAN.md phases. Each phase builds on the previous — do not start Phase N+1 patterns before Phase N foundations are stable.

### Phase 1 — Foundation (Weeks 1–3)

**Goal**: Establish the state management infrastructure. All subsequent phases depend on this.

| Task                             | Status     | Notes                                                         |
| -------------------------------- | ---------- | ------------------------------------------------------------- |
| QueryClient singleton            | ✅ Done    | `src/web/src/lib/queryClient.ts` with `staleTime: 3_600_000`  |
| QueryClientProvider wiring       | ✅ Done    | `src/web/src/components/providers.tsx`                        |
| DataContextProvider              | ✅ Done    | `src/web/src/providers/DataContextProvider.tsx`               |
| Mobile QueryClient               | 🔲 Pending | Add `focusManager` + `onlineManager` (React Native App State) |
| `src/shared/frontend/` structure | 🔲 Pending | Create directory, add first query factories                   |
| Army query key factories         | 🔲 Pending | `armyDetailOptions`, `armyListOptions`                        |
| Auth query factories             | 🔲 Pending | `currentUserOptions`                                          |
| `renderWithQuery` test utility   | 🔲 Pending | Shared across all future tests                                |

```typescript
// src/mobile/src/lib/queryClient.ts — Mobile QueryClient with focus/online management
import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

// React Native does not have window focus events; bridge AppState instead.
if (Platform.OS !== 'web') {
    focusManager.setEventListener((handleFocus) => {
        const subscription = AppState.addEventListener('change', (state) => {
            handleFocus(state === 'active');
        });

        return () => subscription.remove();
    });

    onlineManager.setEventListener((setOnline) => {
        return NetInfo.addEventListener((state) => {
            setOnline(Boolean(state.isConnected));
        });
    });
}

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 3_600_000,
            gcTime: 7_200_000,
            retry: 2,
        },
    },
});
```

### Phase 2 — Army Builder (Weeks 4–8)

**Goal**: Full army CRUD with optimistic updates and complex local state for the editor.

| Task                        | Pattern                                               |
| --------------------------- | ----------------------------------------------------- |
| Army list + detail queries  | `useQuery` + `select` for derived values              |
| Army CRUD mutations         | `useMutation` + `invalidateQueries`                   |
| Optimistic create/update    | `onMutate` + `onError` rollback                       |
| Army editor state           | Multiple `useState` calls + React Query for army data |
| URL state for filters       | `useSearchParams` + `useRouter`                       |
| URL state for selected unit | `?unitId=` search param                               |

```typescript
// Optimistic update skeleton for army name edit (Phase 2)
// src/shared/frontend/armies/mutations.ts
import type { MutationOptions } from '@tanstack/react-query';
import type { UpdateArmyInput, Army } from '@shared/types/entities.js';
import { armyDetailOptions, armyListOptions } from '@shared/frontend/armies/queries.js';
import { updateArmy } from '@shared/frontend/armies/service.js';

/**
 * Mutation options for updating an army with optimistic updates.
 *
 * Optimistically applies the update to the cache immediately, then
 * rolls back on error and invalidates to re-fetch authoritative state.
 */
export function updateArmyOptions(queryClient: QueryClient): MutationOptions<Army, Error, UpdateArmyInput> {
    return {
        mutationFn: (input) => updateArmy(input),
        onMutate: async (input) => {
            await queryClient.cancelQueries(armyDetailOptions(input.id));

            const previous = queryClient.getQueryData<Army>(armyDetailOptions(input.id).queryKey);

            queryClient.setQueryData(armyDetailOptions(input.id).queryKey, (old) => (old ? { ...old, ...input } : old));

            return { previous };
        },
        onError: (_error, input, context) => {
            if (context?.previous) {
                queryClient.setQueryData(armyDetailOptions(input.id).queryKey, context.previous);
            }
        },
        onSettled: (_data, _error, input) => {
            void queryClient.invalidateQueries(armyDetailOptions(input.id));
            void queryClient.invalidateQueries(armyListOptions());
        },
    };
}
```

### Phase 3 — Match Play (Weeks 9–13)

**Goal**: Real-time state via RxJS streams bridged into React Query cache.

| Task                       | Pattern                                                             |
| -------------------------- | ------------------------------------------------------------------- |
| MatchStream integration    | `useSyncExternalStore` for raw stream reads                         |
| RxJS → React Query bridge  | `useMatchSync` with `setQueryData`                                  |
| PresenceStream integration | `useSyncExternalStore` for ephemeral presence                       |
| RxJS → React Query bridge  | `usePresenceSync` with `setQueryData`                               |
| Zustand evaluation         | Assess if BehaviorSubject patterns are a maintenance friction point |

```typescript
// Phase 3 entry point: mount stream bridges at the match layout level
// src/web/src/app/matches/[matchId]/layout.tsx
'use client';

import { useMatchStream, usePresenceStream } from '@web/hooks/useStreams.js';
import { useMatchSync } from '@web/hooks/useMatchSync.js';
import { usePresenceSync } from '@web/hooks/usePresenceSync.js';
import type { ReactNode } from 'react';

interface MatchLayoutProps {
    readonly params: { matchId: string };
    readonly children: ReactNode;
}

/**
 * Mounts RxJS → React Query cache bridges for the duration of the match view.
 * The bridges are torn down automatically when the user navigates away.
 */
export default function MatchLayout({
    params: { matchId },
    children,
}: MatchLayoutProps): React.JSX.Element {
    const matchStream = useMatchStream();
    const presenceStream = usePresenceStream();

    // Bridges write stream updates into the React Query cache.
    // Components in this subtree read from cache via useQuery as normal.
    useMatchSync(matchStream, matchId);
    usePresenceSync(presenceStream, matchId);

    return <>{children}</>;
}
```

### Phase 4 — Campaigns (Weeks 14–17)

**Goal**: Campaign CRUD with complex state machine and offline mobile support.

| Task                            | Pattern                                                     |
| ------------------------------- | ----------------------------------------------------------- |
| Campaign CRUD                   | `useQuery` + `useMutation` (same as armies)                 |
| Campaign state machine          | XState or server-driven state machine (evaluate in Phase 4) |
| Offline mutation queue (mobile) | `useMutation` + `persistQueryClient`                        |

```typescript
// Campaign state is managed server-side. The client reads campaign phase
// from React Query and dispatches mutations to transition between phases.
// If a client-side state machine is needed, evaluate XState (see §10).
// src/shared/frontend/campaigns/queries.ts

export function campaignDetailOptions(campaignId: string) {
    return queryOptions<Campaign>({
        queryKey: ['campaigns', campaignId],
        queryFn: () => getCampaign(campaignId),
        staleTime: 30_000,
    });
}
```

### Phase 5 — Reference Data (Weeks 18–20)

**Goal**: Offline-capable reference data browsing with persistent cache.

| Task                      | Pattern                                              |
| ------------------------- | ---------------------------------------------------- |
| Static reference queries  | `staleTime: Infinity` + server prefetch              |
| Server Component prefetch | `prefetchQuery` in RSC, dehydrate, hydrate on client |
| Mobile offline cache      | `persistQueryClient` with AsyncStorage adapter       |

```typescript
// Reference data query options — never goes stale (Phase 5)
// src/shared/frontend/reference/queries.ts
import { queryOptions } from '@tanstack/react-query';
import type { FactionReference } from '@shared/types/entities.js';
import { listFactions } from '@shared/frontend/reference/service.js';

/**
 * Query options for faction reference data.
 *
 * staleTime: Infinity — reference data changes only with game system updates,
 * which correspond to app releases. No background refresh needed.
 *
 * gcTime: 24 hours — keep in cache across multiple sessions on mobile.
 */
export function factionListOptions(gameSystem: string) {
    return queryOptions<FactionReference[]>({
        queryKey: ['reference', 'factions', gameSystem],
        queryFn: () => listFactions(gameSystem),
        staleTime: Infinity,
        gcTime: 86_400_000,
    });
}
```

```typescript
// Server Component prefetch for reference data (Phase 5, web only)
// src/web/src/app/reference/[gameSystem]/page.tsx
import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
} from '@tanstack/react-query';
import { factionListOptions } from '@shared/frontend/reference/queries.js';
import { FactionBrowser } from '@web/src/components/FactionBrowser.js';

interface ReferencePageProps {
    readonly params: { gameSystem: string };
}

/** Prefetches faction reference data on the server so the client renders immediately. */
export default async function ReferencePage({
    params: { gameSystem },
}: ReferencePageProps): Promise<React.JSX.Element> {
    const queryClient = new QueryClient();

    await queryClient.prefetchQuery(factionListOptions(gameSystem));

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <FactionBrowser gameSystem={gameSystem} />
        </HydrationBoundary>
    );
}
```

### 13.1 Never Regress Between Tiers

Once a feature is implemented at a given tier, do not regress to a lower-tier pattern under time pressure:

- ✅ Upgrade: `useState` → `useQuery` when a value becomes server-sourced
- ✅ Upgrade: inline computation → multiple `useState` calls when local state grows
- ❌ Regress: `useQuery` → `useState` with `useEffect` fetch — this re-introduces the sync bugs React Query was adopted to eliminate
- ❌ Regress: RxJS cache bridge → parallel `useState` mirror — this creates two sources of truth

When a pattern feels insufficient for a new requirement, escalate within the hierarchy rather than reaching for a parallel solution outside it.
