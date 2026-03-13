# Derived State Patterns

**Purpose:** Canonical reference for computing derived state across all state tiers — avoiding the "stored derived state" anti-pattern.

**Scope:** `@armoury/web`, `@armoury/mobile`, and shared `@armoury/clients-*` derived state patterns.

**Parent document:** [State Management Architecture](./plan/STATE_MANAGEMENT.md)

**Related Documents:**

- [State Management Architecture](./plan/STATE_MANAGEMENT.md) — Overview, philosophy, state hierarchy
- [Server State via React Query](./REACT_QUERY.md) — The `select` option for server-derived values
- [RxJS State Patterns](./RXJS_STATE.md) — RxJS → React Query cache bridge for stream-derived state
- [State Testing Strategy](./STATE_TESTING.md) — Testing patterns for all state tiers
- [Requirements](./REQUIREMENTS.md) — FE-055

---

## Table of Contents

1. [The Problem](#1-the-problem)
2. [Tier 1 — Pure Server Transform (`select`)](#2-tier-1--pure-server-transform-select)
3. [Tier 2 — Server + Client Combined (Custom Hook)](#3-tier-2--server--client-combined-custom-hook)
4. [Tier 3 — RxJS → React Query Cache Bridge (`setQueryData`)](#4-tier-3--rxjs--react-query-cache-bridge-setquerydata)
5. [Anti-Patterns](#5-anti-patterns)

---

> **Requirement reference**: FE-055

Derived state is any value that can be computed deterministically from existing state. The cardinal rule: **never store derived state**. Storing it creates two sources of truth that can diverge.

## 1. The Problem

```typescript
// ❌ NEVER: Derived state stored in useState
function ArmyEditor({ armyId }: { armyId: string }) {
    const { data: army } = useQuery(armyDetailOptions(armyId));
    // Sync bug waiting to happen: pointsTotal only updates when the effect fires,
    // not immediately when army changes. Race conditions are possible.
    const [pointsTotal, setPointsTotal] = useState(0);

    useEffect(() => {
        if (army) {
            setPointsTotal(army.units.reduce((acc, u) => acc + u.points, 0));
        }
    }, [army]);

    return <div>Total: {pointsTotal}</div>;
}
```

The `useEffect` sync pattern introduces a render cycle gap: the component renders once with stale `pointsTotal`, then the effect fires, then it renders again with the correct value. With async effects or complex dependency arrays the gap widens into a bug.

The correct model has three tiers based on where the source state lives.

## 2. Tier 1 — Pure Server Transform (`select`)

When the derived value comes entirely from a single React Query result, use the `select` option. React Query applies structural sharing: `select` runs on every query update, but the component only re-renders when the selected value has changed by reference or value equality.

```typescript
// src/web/hooks/useArmyUnitCount.ts
import { useQuery } from '@tanstack/react-query';
import { armyDetailOptions } from '@armoury/clients-armies';

/**
 * Returns the unit count for an army.
 *
 * Re-renders only when the count changes, not when unrelated army
 * fields (name, notes, lastModified) change. React Query's structural
 * sharing prevents spurious re-renders.
 */
export function useArmyUnitCount(armyId: string): number | undefined {
    const { data: unitCount } = useQuery({
        ...armyDetailOptions(armyId),
        select: (army) => army.units.length,
    });

    return unitCount;
}
```

```typescript
// src/web/hooks/useArmyPointTotal.ts
import { useQuery } from '@tanstack/react-query';
import { armyDetailOptions } from '@armoury/clients-armies';

/** Returns the total points cost of all units in an army. */
export function useArmyPointTotal(armyId: string): number | undefined {
    const { data: pointTotal } = useQuery({
        ...armyDetailOptions(armyId),
        select: (army) => army.units.reduce((total, unit) => total + unit.points, 0),
    });

    return pointTotal;
}
```

> The `select` function must be **stable** across renders to avoid defeating structural sharing. Define it outside the component or with `useCallback` if it closes over props.

```typescript
// src/web/hooks/useArmyUnitsAbovePoints.ts
import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { armyDetailOptions } from '@armoury/clients-armies';
import type { Army, ArmyUnit } from '@armoury/models';

/**
 * Returns units whose point cost exceeds a given threshold.
 *
 * The select function is memoized with useCallback so structural
 * sharing is not defeated when the component re-renders for unrelated reasons.
 */
export function useArmyUnitsAbovePoints(armyId: string, threshold: number): ArmyUnit[] | undefined {
    const select = useCallback((army: Army) => army.units.filter((u) => u.points > threshold), [threshold]);

    const { data: units } = useQuery({
        ...armyDetailOptions(armyId),
        select,
    });

    return units;
}
```

## 3. Tier 2 — Server + Client Combined (Custom Hook)

When the derived value depends on both server data and client-side state (URL params, user input, local toggles), compute at the render boundary. Never sync the result to `useState`.

```typescript
// src/web/hooks/useFilteredArmies.ts
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { armyListOptions } from '@armoury/clients-armies';
import type { Army } from '@armoury/models';

interface FilteredArmiesResult {
    readonly armies: Army[];
    readonly search: string;
    readonly isLoading: boolean;
}

/**
 * Returns armies filtered by the current URL search term.
 *
 * The filter is computed inline at the render boundary. The result is
 * never stored in useState — doing so would introduce a one-render lag
 * and potential desync between the URL and displayed results.
 */
export function useFilteredArmies(): FilteredArmiesResult {
    const searchParams = useSearchParams();
    const search = searchParams.get('q') ?? '';
    const { data: armies = [], isLoading } = useQuery(armyListOptions({ status: 'active' }));

    // Compute at the boundary — inline, no useState, no useEffect sync.
    const filtered =
        search.length > 0 ? armies.filter((a) => a.name.toLowerCase().includes(search.toLowerCase())) : armies;

    return { armies: filtered, search, isLoading };
}
```

```typescript
// src/web/hooks/useArmySortedUnits.ts
import { useQuery } from '@tanstack/react-query';
import { armyDetailOptions } from '@armoury/clients-armies';
import type { ArmyUnit } from '@armoury/models';

type SortField = 'name' | 'points' | 'models';
type SortDirection = 'asc' | 'desc';

interface SortedUnitsResult {
    readonly units: ArmyUnit[];
    readonly isLoading: boolean;
}

/**
 * Returns an army's units sorted by a field and direction determined
 * by the caller (typically from URL state or local toggle state).
 *
 * Sorting is computed inline. The sorted array is a new reference on
 * every render where units or sort params change — this is intentional
 * and correct. Never cache this in useState.
 */
export function useArmySortedUnits(
    armyId: string,
    sortField: SortField,
    sortDirection: SortDirection,
): SortedUnitsResult {
    const { data: army, isLoading } = useQuery(armyDetailOptions(armyId));

    const units =
        army?.units.slice().sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];
            const order = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;

            return sortDirection === 'asc' ? order : -order;
        }) ?? [];

    return { units, isLoading };
}
```

## 4. Tier 3 — RxJS → React Query Cache Bridge (`setQueryData`)

When a real-time stream emits data that matches an entity already managed by React Query, write the stream updates directly into the query cache. Components that read from the cache via `useQuery` receive the update automatically — no parallel state, no duplicate subscriptions.

```typescript
// src/web/hooks/useMatchSync.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { matchDetailOptions } from '@armoury/clients-matches';
import type { IMatchStream } from '@armoury/streams';

/**
 * Bridges real-time match updates from an RxJS stream into the React Query cache.
 *
 * Architecture:
 * - RxJS MatchStream is the transport layer (WebSocket → BehaviorSubject).
 * - React Query cache is the single source of truth for match data.
 * - Components call useQuery(matchDetailOptions(matchId)) as normal and
 *   receive stream updates without any additional subscriptions.
 *
 * This pattern avoids duplicating state: the stream is not a second store,
 * it is a write path into the existing cache.
 */
export function useMatchSync(matchStream: IMatchStream, matchId: string): void {
    const queryClient = useQueryClient();

    useEffect(() => {
        const subscription = matchStream.match$(matchId).subscribe((match) => {
            if (match) {
                queryClient.setQueryData(matchDetailOptions(matchId).queryKey, match);
            }
        });

        return () => subscription.unsubscribe();
    }, [matchStream, matchId, queryClient]);
}
```

The same bridge pattern applies to presence data:

```typescript
// src/web/hooks/usePresenceSync.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { presenceOptions } from '@armoury/clients-friends';
import type { IPresenceStream } from '@armoury/streams';
import type { PresenceState } from '@armoury/models';

/**
 * Bridges real-time presence updates from the PresenceStream into the
 * React Query cache keyed by match ID.
 *
 * The bridge is mount-scoped: when the component unmounts (user leaves
 * the match view), the subscription is torn down automatically.
 */
export function usePresenceSync(presenceStream: IPresenceStream, matchId: string): void {
    const queryClient = useQueryClient();

    useEffect(() => {
        const subscription = presenceStream.presence$(matchId).subscribe((presence: PresenceState) => {
            queryClient.setQueryData(presenceOptions(matchId).queryKey, presence);
        });

        return () => subscription.unsubscribe();
    }, [presenceStream, matchId, queryClient]);
}
```

**The bridge pattern is not always appropriate.** Use it only when:

- The stream data is an entity that also has a REST/static representation (armies, matches, campaigns).
- Other parts of the UI already consume the entity via `useQuery`.

For presence indicators, ephemeral counters, or stream-only data (chat messages), prefer `useSyncExternalStore` directly against the BehaviorSubject.

## 5. Anti-Patterns

| Never do this                                                                                                   | Do this instead                                               | Why                                                          |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------ |
| `const [total, setTotal] = useState(0); useEffect(() => setTotal(compute(data)), [data])`                       | Compute inline: `const total = data ? compute(data) : 0`      | Eliminates the render gap and sync bug surface               |
| `const [filtered, setFiltered] = useState([]); useEffect(() => setFiltered(data?.filter(...)), [data, search])` | `const filtered = data?.filter(...) ?? []` at render boundary | One source of truth, zero extra renders                      |
| Mirror server data into local state: `const [army, setArmy] = useState<Army>()` + effect                        | Use `const { data: army } = useQuery(...)` directly           | React Query is the cache; duplicating it creates divergence  |
| Maintain parallel RxJS observable + React state for same entity                                                 | Bridge stream into query cache via `setQueryData`             | Eliminates two-store divergence; cache becomes single source |
| `useMemo` for trivial derivations                                                                               | Compute inline                                                | `useMemo` has overhead; use it only for expensive operations |

> **When to use `useMemo`**: Only when the derivation is computationally expensive (sorting/filtering arrays of hundreds of items) and benchmarking confirms it is a bottleneck. Premature memoization obscures data flow without measurable benefit.

---

**Navigation:**

- ← [RxJS State Patterns](./RXJS_STATE.md)
- → [State Testing Strategy](./STATE_TESTING.md)
