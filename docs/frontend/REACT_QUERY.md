# Server State via React Query

**Purpose:** Canonical reference for all server/remote state management via `@tanstack/react-query`.

**Scope:** `@armoury/web`, `@armoury/mobile`, and `src/shared/frontend/` query factories.

**Parent document:** [State Management Architecture](./plan/STATE_MANAGEMENT.md)

**Related Documents:**

- [State Management Architecture](./plan/STATE_MANAGEMENT.md) — Overview, philosophy, state hierarchy
- [RxJS State Patterns](./RXJS_STATE.md) — Global reactive state via RxJS
- [Derived State Patterns](./DERIVED_STATE.md) — Computing derived values
- [State Testing Strategy](./STATE_TESTING.md) — Testing patterns for all state tiers
- [Requirements](./REQUIREMENTS.md) — FE-050 through FE-077

---

## Table of Contents

1. [Query Key Factories](#1-query-key-factories)
2. [Custom Hooks (Platform-Specific)](#2-custom-hooks-platform-specific)
3. [Mutations & Cache Invalidation](#3-mutations--cache-invalidation)
4. [SSR / RSC Integration](#4-ssr--rsc-integration)
5. [Cache Configuration](#5-cache-configuration)
6. [React Native Data Fetching](#6-react-native-data-fetching)

---

React Query is the single owner of all server/remote data. Every piece of data that originates from an API call — armies, rosters, matches, user profile, reference data, auth session — lives in the React Query cache.

> **FE-050**: All remote and asynchronous state is managed via `@tanstack/react-query`.

Never pull server data out of the cache and into `useState`. Never initiate fetches in `useEffect`. Never maintain a parallel copy of server data in a `BehaviorSubject` (use the [RxJS → React Query Cache Bridge](./RXJS_STATE.md#7-rxjs--react-query-cache-bridge) for stream-driven updates instead).

---

## 1. Query Key Factories

Query keys are the identity of every cached query. A consistent, hierarchical key structure enables fine-grained and coarse-grained cache invalidation without guessing key shapes across files.

**The canonical rules:**

1. **Co-locate** keys with their `queryOptions` in the same file.
2. **Use `as const`** — key arrays must be readonly tuples for type-safe invalidation.
3. **Structure generic → specific**: `['armies'] → ['armies', 'list'] → ['armies', 'list', { faction }]`.
4. **Use `queryOptions()`** — wraps key + `queryFn` + `staleTime` together, enabling TypeScript to infer the return type at call sites without explicit generics.
5. **Keep factories in `src/shared/frontend/`** — they are pure TypeScript with no React dependency and can be used in both web and mobile without duplication.

> **FE-060**: Query keys co-located with `queryOptions()`.
> **FE-061**: Query keys structured generic → specific, with `as const`.
> **FE-062**: Factory pattern: `all()`, `lists()`, `list(filters)`, `details()`, `detail(id)`.

```typescript
// src/shared/frontend/armies/queries.ts (pure TypeScript — no React)
// @requirements FE-060, FE-061, FE-062

import { queryOptions } from '@tanstack/react-query';
import { dc } from '@shared/data/DataContext.js';
import type { ArmyFilters, ArmyListResult, Army } from '@shared/types/entities.js';

// ---------------------------------------------------------------------------
// Key factory
// ---------------------------------------------------------------------------

/**
 * Query key factory for army-related queries.
 *
 * Hierarchy:
 *   armies
 *   └─ armies / list
 *      └─ armies / list / { filters }
 *   └─ armies / detail
 *      └─ armies / detail / { id }
 *
 * Use `armyKeys.all()` to invalidate everything army-related.
 * Use `armyKeys.lists()` to invalidate all list queries without touching details.
 */
const armyKeys = {
    all: () => ['armies'] as const,
    lists: () => [...armyKeys.all(), 'list'] as const,
    list: (filters: ArmyFilters) => [...armyKeys.lists(), filters] as const,
    details: () => [...armyKeys.all(), 'detail'] as const,
    detail: (id: string) => [...armyKeys.details(), id] as const,
};

// ---------------------------------------------------------------------------
// Query options factories
// ---------------------------------------------------------------------------

/**
 * Options for the paginated army list query.
 * staleTime omitted — inherits the global default (3 600 000 ms).
 * Override per-call site if you need shorter freshness (e.g., staleTime: 30_000 for filtered lists).
 */
export const armyListOptions = (filters: ArmyFilters) =>
    queryOptions<ArmyListResult>({
        queryKey: armyKeys.list(filters),
        queryFn: () => dc.armies.list(filters),
    });

/**
 * Options for a single army detail query.
 * 5-minute staleTime: army content changes infrequently but must not be globally stale.
 */
export const armyDetailOptions = (id: string) =>
    queryOptions<Army>({
        queryKey: armyKeys.detail(id),
        queryFn: () => dc.armies.get(id),
        staleTime: 5 * 60 * 1000,
    });

/** Re-export keys for invalidation use in mutation files. */
export { armyKeys };
```

**Why `queryOptions()` over a plain object?**

```typescript
// With queryOptions() — TypeScript infers the return type from queryFn
const opts = armyDetailOptions('army-123');
// opts.queryKey  → readonly ['armies', 'detail', 'army-123']
// opts.queryFn   → () => Promise<Army>
// useQuery(opts) → UseQueryResult<Army>  ← fully typed, no explicit generic needed

// Without queryOptions() — you must annotate everywhere
useQuery<Army>({ queryKey: ['armies', 'detail', id], queryFn: () => dc.armies.get(id) });
// ← fragile: easy to mistype the generic, key is not co-located with options
```

**Hierarchical invalidation in practice:**

```typescript
// src/shared/frontend/armies/mutations.ts (pure TypeScript — no React)

import { type QueryClient } from '@tanstack/react-query';
import { armyKeys } from '@shared/frontend/armies/queries.js';

/**
 * Invalidate all army-related queries after any army mutation.
 * Because keys are hierarchical, this hits lists AND details in one call.
 */
export function invalidateArmyQueries(queryClient: QueryClient): Promise<void> {
    return queryClient.invalidateQueries({ queryKey: armyKeys.all() });
}

/**
 * Invalidate only army list queries (e.g., after a bulk operation
 * that should not evict individual detail caches).
 */
export function invalidateArmyLists(queryClient: QueryClient): Promise<void> {
    return queryClient.invalidateQueries({ queryKey: armyKeys.lists() });
}
```

---

## 2. Custom Hooks (Platform-Specific)

Custom hooks that wrap `useQuery` live in `src/web/` or `src/mobile/` — **never** in `src/shared/frontend/`. React is a peer dependency, not a dependency of the shared package.

A custom hook adds value when it:

- Composes multiple queries into a single interface
- Adds platform-specific logic (e.g., mobile network awareness)
- Encapsulates non-trivial derived state from the query result
- Is reused across three or more call sites in the same platform

For single-use or straightforward queries, **call `useQuery(options)` directly** — a custom hook is unnecessary indirection.

> **FE-063**: Custom hooks are optional. Direct `useQuery(options)` is fine for most cases.

```typescript
// ✅ Direct usage — no custom hook needed for a single-use query
// src/web/src/components/armies/ArmyCard.tsx

'use client';

import { useQuery } from '@tanstack/react-query';
import { armyDetailOptions } from '@shared/frontend/armies/queries.js';

export function ArmyCard({ id }: { id: string }): JSX.Element {
    const { data: army, isPending } = useQuery(armyDetailOptions(id));

    if (isPending) { return <Skeleton />; }

    return <div>{army?.name}</div>;
}
```

```typescript
// ✅ Custom hook adds value: composes army + roster into a single interface,
// used across ArmyEditor, ArmyPrintView, and ArmyExportDialog
// src/web/src/hooks/useArmyWithRoster.ts

import { useQuery } from '@tanstack/react-query';
import { armyDetailOptions } from '@shared/frontend/armies/queries.js';
import { rosterOptions } from '@shared/frontend/rosters/queries.js';
import type { Army, Roster } from '@shared/types/entities.js';

interface ArmyWithRoster {
    army: Army;
    roster: Roster;
}

interface UseArmyWithRosterResult {
    data: ArmyWithRoster | undefined;
    isPending: boolean;
    isError: boolean;
}

/**
 * Returns an army and its associated roster in a single hook.
 * Both queries run in parallel; the combined result is only defined
 * when both succeed.
 */
export function useArmyWithRoster(armyId: string): UseArmyWithRosterResult {
    const armyQuery = useQuery(armyDetailOptions(armyId));
    const rosterQuery = useQuery(rosterOptions(armyId));

    const isPending = armyQuery.isPending || rosterQuery.isPending;
    const isError = armyQuery.isError || rosterQuery.isError;

    const data = armyQuery.data && rosterQuery.data ? { army: armyQuery.data, roster: rosterQuery.data } : undefined;

    return { data, isPending, isError };
}
```

---

## 3. Mutations & Cache Invalidation

All writes go through `useMutation`. The pattern for cache consistency is:

- **Simple mutations**: invalidate in `onSettled` (runs on both success and error).
- **Latency-sensitive mutations**: use optimistic updates — cancel → snapshot → update → rollback.

> **FE-064**: Simple mutations invalidate in `onSettled`.
> **FE-065**: Latency-sensitive mutations use optimistic updates.
> **FE-066**: Optimistic: cancel in-flight → snapshot current cache → apply optimistic update → rollback on error.
> **FE-067**: `onSettled` always invalidates, even after a successful optimistic update.

#### Simple Mutation (Invalidate on Settled)

```typescript
// src/web/src/hooks/useDeleteArmy.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dc } from '@shared/data/DataContext.js';
import { armyKeys } from '@shared/frontend/armies/queries.js';

interface UseDeleteArmyResult {
    deleteArmy: (id: string) => void;
    isPending: boolean;
}

/** Deletes an army and invalidates all army list queries on completion. */
export function useDeleteArmy(): UseDeleteArmyResult {
    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
        mutationFn: (id: string) => dc.armies.delete(id),

        onSettled: async (_data, _error, id) => {
            // Always invalidate — success clears stale data, error ensures
            // the UI stays consistent even if partial state was applied
            await queryClient.invalidateQueries({ queryKey: armyKeys.all() });
        },
    });

    return { deleteArmy: mutate, isPending };
}
```

#### Optimistic Mutation (Cancel → Snapshot → Update → Rollback)

```typescript
// src/web/src/hooks/useRenameArmy.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dc } from '@shared/data/DataContext.js';
import { armyDetailOptions, armyKeys } from '@shared/frontend/armies/queries.js';
import type { Army } from '@shared/types/entities.js';

interface RenameArmyVariables {
    id: string;
    name: string;
}

/**
 * Renames an army with optimistic UI — the name updates immediately in
 * the cache, then rolls back if the server request fails.
 */
export function useRenameArmy() {
    const queryClient = useQueryClient();

    return useMutation<Army, Error, RenameArmyVariables, { previousArmy: Army | undefined }>({
        mutationFn: ({ id, name }) => dc.armies.rename(id, name),

        onMutate: async ({ id, name }) => {
            // Step 1: Cancel any in-flight queries for this army to prevent
            // a race where a background refetch overwrites the optimistic update
            await queryClient.cancelQueries({ queryKey: armyDetailOptions(id).queryKey });

            // Step 2: Snapshot the current cache value so we can roll back
            const previousArmy = queryClient.getQueryData<Army>(armyDetailOptions(id).queryKey);

            // Step 3: Apply the optimistic update — the UI re-renders immediately
            queryClient.setQueryData<Army>(armyDetailOptions(id).queryKey, (old) => (old ? { ...old, name } : old));

            return { previousArmy };
        },

        onError: (_error, { id }, context) => {
            // Step 4: Roll back to the snapshot if the mutation failed
            if (context?.previousArmy) {
                queryClient.setQueryData(armyDetailOptions(id).queryKey, context.previousArmy);
            }
        },

        onSettled: async (_data, _error, { id }) => {
            // Step 5: Always invalidate to sync with the server's true state
            // (even on success, the server may have normalized the name)
            await queryClient.invalidateQueries({ queryKey: armyDetailOptions(id).queryKey });
        },
    });
}
```

---

## 4. SSR / RSC Integration

Next.js Server Components can prefetch React Query data before the page renders. This eliminates loading states for above-the-fold content and ensures the client receives a fully-hydrated page.

> **FE-068**: Server Components prefetch using `QueryClient.prefetchQuery()` + `HydrationBoundary`.
> **FE-069**: `staleTime > 0` prevents an immediate client-side refetch of data that was just returned by the server.

The pattern has three parts:

1. **Server Component** creates a `QueryClient`, prefetches, and passes dehydrated state to the client via `HydrationBoundary`.
2. **Client Component** calls `useQuery` with the same `queryOptions` — React Query finds the data in the hydrated cache and renders immediately without a loading state.
3. **`staleTime > 0`** on the `queryOptions` prevents the client from re-fetching data it literally just received from the server.

```typescript
// src/web/src/app/armies/[id]/page.tsx (Server Component — no 'use client')
// @requirements FE-068, FE-069

import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { armyDetailOptions } from '@shared/frontend/armies/queries.js';
import { ArmyDetailView } from '@web/components/armies/ArmyDetailView.js';

interface Props {
    params: Promise<{ id: string }>;
}

/**
 * Server Component: prefetches army detail so the client renders immediately.
 * HydrationBoundary serialises the QueryClient state into the page HTML.
 */
export default async function ArmyDetailPage({ params }: Props): Promise<JSX.Element> {
    const { id } = await params;
    const queryClient = new QueryClient();

    // Prefetch — result lands in the QueryClient cache.
    // armyDetailOptions has staleTime: 5 * 60 * 1000 (FE-069)
    await queryClient.prefetchQuery(armyDetailOptions(id));

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            {/* ArmyDetailView calls useQuery(armyDetailOptions(id)) —
                finds the data in the hydrated cache, renders immediately */}
            <ArmyDetailView id={id} />
        </HydrationBoundary>
    );
}
```

```typescript
// src/web/src/components/armies/ArmyDetailView.tsx

'use client';

import { useQuery } from '@tanstack/react-query';
import { armyDetailOptions } from '@shared/frontend/armies/queries.js';

interface Props {
    id: string;
}

/** Client Component: reads from the hydrated cache — no loading state on first render. */
export function ArmyDetailView({ id }: Props): JSX.Element {
    // On initial render: data is already in cache (hydrated from server).
    // staleTime: 5min means React Query does NOT refetch immediately.
    const { data: army } = useQuery(armyDetailOptions(id));

    // army is guaranteed defined on first render when prefetched correctly
    if (!army) { return <Skeleton />; }

    return (
        <article>
            <h1>{army.name}</h1>
            <ArmyMetadata army={army} />
            <DetachmentList detachments={army.detachments} />
        </article>
    );
}
```

**Why `staleTime > 0` is critical for SSR:**

```typescript
// ❌ WRONG: staleTime: 0 (the default) causes an immediate background refetch
// The client receives data from the server, then immediately fires another
// network request to check if it's still fresh. This defeats the purpose of SSR.
export const armyDetailOptions = (id: string) =>
    queryOptions({
        queryKey: armyKeys.detail(id),
        queryFn: () => dc.armies.get(id),
        // staleTime: 0 ← missing! React Query treats data as instantly stale
    });

// ✅ CORRECT: staleTime: 5 * 60 * 1000 suppresses the redundant refetch
export const armyDetailOptions = (id: string) =>
    queryOptions({
        queryKey: armyKeys.detail(id),
        queryFn: () => dc.armies.get(id),
        staleTime: 5 * 60 * 1000, // ✅ data is fresh for 5 minutes after SSR
    });
```

---

## 5. Cache Configuration

The global `QueryClient` at `src/web/src/lib/queryClient.ts` sets `staleTime: 3_600_000` (1 hour) as a conservative application-wide fallback for data types that do not define a per-query override. This is intentionally high — most Armoury data (armies, factions, reference data) changes infrequently. Individual `queryOptions` factories **must override this default** for their data category according to the table below. For example, FE-070 requires user data to use a 60-second `staleTime`, which is set as a per-query override in the user profile query factory — not as the global default.

> **FE-070**: User data: staleTime 60s, gcTime 5min.
> **FE-071**: Static reference data: staleTime Infinity, gcTime 24h.
> **FE-072**: Session/auth: staleTime 0, gcTime 30min.
> **FE-073**: Filtered lists: staleTime 30s, gcTime 5min.

| Data Type                                | `staleTime`       | `gcTime`             | Rationale                                            |
| ---------------------------------------- | ----------------- | -------------------- | ---------------------------------------------------- |
| Global default                           | `3_600_000` (1 h) | `300_000` (5 min)    | Conservative; most Armoury data changes infrequently |
| User profile / account                   | `60_000` (60 s)   | `300_000` (5 min)    | User data should reflect changes reasonably quickly  |
| Army detail                              | `300_000` (5 min) | `600_000` (10 min)   | Army content is edited rarely in a session           |
| Army list (filtered)                     | `30_000` (30 s)   | `300_000` (5 min)    | List views should stay reasonably fresh              |
| Static reference data (factions, BSData) | `Infinity`        | `86_400_000` (24 h)  | Reference data does not change mid-session           |
| Session / auth                           | `0`               | `1_800_000` (30 min) | Auth state must always reflect server; errors matter |

```typescript
// src/shared/frontend/armies/queries.ts (pure TypeScript — no React)

import { queryOptions } from '@tanstack/react-query';
import { dc } from '@shared/data/DataContext.js';
import type { ArmyFilters, ArmyListResult, Army } from '@shared/types/entities.js';

// Filtered list: short staleTime so filters feel responsive (FE-073)
export const armyListOptions = (filters: ArmyFilters) =>
    queryOptions<ArmyListResult>({
        queryKey: armyKeys.list(filters),
        queryFn: () => dc.armies.list(filters),
        staleTime: 30_000,
        gcTime: 300_000,
    });

// Detail: medium staleTime — content changes slowly (FE-070 baseline)
export const armyDetailOptions = (id: string) =>
    queryOptions<Army>({
        queryKey: armyKeys.detail(id),
        queryFn: () => dc.armies.get(id),
        staleTime: 300_000,
        gcTime: 600_000,
    });
```

```typescript
// src/shared/frontend/reference/queries.ts (pure TypeScript — no React)

import { queryOptions } from '@tanstack/react-query';
import { dc } from '@shared/data/DataContext.js';
import type { FactionList } from '@shared/types/entities.js';

// Static reference data: never refetch during a session (FE-071)
export const factionListOptions = () =>
    queryOptions<FactionList>({
        queryKey: ['reference', 'factions'],
        queryFn: () => dc.reference.listFactions(),
        staleTime: Infinity,
        gcTime: 24 * 60 * 60 * 1000,
    });
```

```typescript
// src/shared/frontend/auth/queries.ts (pure TypeScript — no React)

import { queryOptions } from '@tanstack/react-query';
import { dc } from '@shared/data/DataContext.js';
import type { Session } from '@shared/types/auth.js';

// Auth: always check freshness (FE-072)
export const sessionOptions = () =>
    queryOptions<Session | null>({
        queryKey: ['auth', 'session'],
        queryFn: () => dc.auth.getSession(),
        staleTime: 0,
        gcTime: 30 * 60 * 1000,
        retry: 0, // Do not retry auth failures — surface them immediately
    });
```

---

## 6. React Native Data Fetching

React Native requires additional configuration because the mobile platform has no native browser focus/visibility events or network status APIs. React Query provides adapter hooks for both.

> **FE-074**: Configure `focusManager` with React Native `AppState`.
> **FE-075**: Configure `onlineManager` with `@react-native-community/netinfo`.
> **FE-076**: Offline persistence with `@tanstack/query-async-storage-persister`.
> **FE-077**: Offline mutation queuing.

#### Focus Manager (AppState)

React Query refetches stale queries when the window regains focus. On React Native, this event comes from `AppState`.

```typescript
// src/mobile/src/lib/queryConfig.ts
// @requirements FE-074

import { AppState, type AppStateStatus } from 'react-native';
import { focusManager } from '@tanstack/react-query';

/**
 * Wire React Native AppState to React Query's focusManager.
 * Call once at app startup, before QueryClientProvider mounts.
 * Returns a cleanup function to remove the event listener.
 */
export function configureFocusManager(): () => void {
    const onAppStateChange = (status: AppStateStatus): void => {
        focusManager.setFocused(status === 'active');
    };

    const subscription = AppState.addEventListener('change', onAppStateChange);

    return () => subscription.remove();
}
```

#### Online Manager (NetInfo)

React Query pauses queries when offline and retries them when connectivity is restored. On React Native, use `@react-native-community/netinfo`.

```typescript
// src/mobile/src/lib/queryConfig.ts
// @requirements FE-075

import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

/**
 * Wire NetInfo to React Query's onlineManager.
 * Queries will pause when offline and resume when connectivity is restored.
 * Returns a cleanup function to unsubscribe the NetInfo listener.
 */
export function configureOnlineManager(): () => void {
    return NetInfo.addEventListener((state) => {
        onlineManager.setOnline(state.isConnected != null && state.isConnected && Boolean(state.isInternetReachable));
    });
}
```

#### Offline Persistence

For durable offline support, persist the query cache to AsyncStorage so data survives app restarts.

```typescript
// src/mobile/src/lib/queryClient.ts
// @requirements FE-076

import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type ReactNode } from 'react';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data persisted to storage is considered fresh for 24 hours
            staleTime: 24 * 60 * 60 * 1000,
            gcTime: 24 * 60 * 60 * 1000,
            networkMode: 'offlineFirst',
        },
    },
});

const asyncStoragePersister = createAsyncStoragePersister({
    storage: AsyncStorage,
    key: 'armoury-query-cache',
});

interface Props {
    children: ReactNode;
}

/** Mobile QueryClient provider with AsyncStorage persistence. */
export function MobileQueryClientProvider({ children }: Props): JSX.Element {
    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister: asyncStoragePersister }}
        >
            {children}
        </PersistQueryClientProvider>
    );
}
```

#### Offline Mutation Queuing

Mutations issued while offline should be queued and replayed when connectivity is restored.

```typescript
// src/mobile/src/lib/queryClient.ts
// @requirements FE-077

import { QueryClient, onlineManager } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

/**
 * Mutation cache with offline queuing.
 * When a mutation fails due to network error and networkMode is 'offlineFirst',
 * React Query will retry it automatically once the device comes back online.
 */
export const offlineQueryClient = new QueryClient({
    defaultOptions: {
        mutations: {
            // Retry once on network error; React Query will queue if offline
            networkMode: 'offlineFirst',
            retry: 1,
            retryDelay: 1000,
        },
        queries: {
            networkMode: 'offlineFirst',
        },
    },
});
```

---

**Navigation:**

- ← [State Management Architecture](./plan/STATE_MANAGEMENT.md)
- → [RxJS State Patterns](./RXJS_STATE.md)
