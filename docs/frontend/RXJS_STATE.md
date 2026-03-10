# Global / Reactive State via RxJS

**Purpose:** Canonical reference for global and reactive state management via RxJS in the Armoury applications.

**Scope:** `@armoury/streams`, `src/shared/frontend/`, and platform-specific RxJS integrations in `@armoury/web` and `@armoury/mobile`.

**Parent document:** [State Management Architecture](./plan/STATE_MANAGEMENT.md)

**Related Documents:**

- [State Management Architecture](./plan/STATE_MANAGEMENT.md) — Overview, philosophy, state hierarchy
- [Server State via React Query](./REACT_QUERY.md) — Server/remote state patterns
- [Derived State Patterns](./DERIVED_STATE.md) — Computing derived values
- [State Testing Strategy](./STATE_TESTING.md) — Testing patterns for all state tiers
- [Requirements](./REQUIREMENTS.md) — FE-050 through FE-077

---

## Table of Contents

1. [When to Use RxJS](#1-when-to-use-rxjs)
2. [The @armoury/streams Pattern](#2-the-armourystreams-pattern)
3. [Higher-Order Mapping Operators](#3-higher-order-mapping-operators)
4. [Subscribing to RxJS in React](#4-subscribing-to-rxjs-in-react)
5. [Memory Management](#5-memory-management)
6. [Error Handling in RxJS](#6-error-handling-in-rxjs)
7. [RxJS → React Query Cache Bridge](#7-rxjs--react-query-cache-bridge)

---

RxJS manages state that is inherently reactive: event streams, WebSocket messages, and global state that needs to propagate to many subscribers simultaneously without React's rendering cycle as the coordination mechanism.

> **FE-052**: Global and reactive state uses RxJS.

---

## 1. When to Use RxJS

RxJS is powerful but carries cognitive overhead. Use it only where reactivity, composition, or cross-component event propagation genuinely justifies it.

| Scenario                            | Tool                              | Why                                                                      |
| ----------------------------------- | --------------------------------- | ------------------------------------------------------------------------ |
| Fetch army data                     | React Query                       | Caching, deduplication, staleTime, background refetch                    |
| Toggle modal open/closed            | `useState`                        | Two states, no composition needed                                        |
| Live match state via WebSocket      | RxJS `BehaviorSubject`            | Event-driven, real-time, multiple subscribers                            |
| Player presence (online/offline)    | RxJS `BehaviorSubject`            | Continuously updated from external source                                |
| Search input debouncing             | RxJS `switchMap` + `debounceTime` | Natural operator composition for async cancellation                      |
| Global user preferences (in-memory) | RxJS `BehaviorSubject`            | Shared across unrelated component subtrees, reactive to external changes |
| Form field value                    | `useState`                        | No reactivity needed, local to form                                      |
| Auth session                        | React Query (`staleTime: 0`)      | Server source of truth; use cache invalidation on sign-in/out            |

**RxJS is for:**

- Event composition (debounce, throttle, merge, combineLatest)
- Real-time streams that update state continuously from external sources
- Global reactive state that crosses unrelated component subtrees

**RxJS is NOT for:**

- One-off HTTP fetches (use React Query)
- Simple UI state (use `useState`)
- Server data caching (use React Query's `staleTime` / `gcTime`)

---

> **Clarification:** Streams are RxJS facades, not adapters. They wrap WebSocket clients to expose observable state. Clients handle transport abstraction; streams handle reactivity abstraction. No intermediate "adapter" layer exists or is needed between these layers and React components. See [SHARED_COMPONENTS.md §D](./plan/SHARED_COMPONENTS.md) for why the adapter abstraction was removed.

## 2. The @armoury/streams Pattern

The `@armoury/streams` package provides stream classes backed by `BehaviorSubject`. Each stream owns a slice of reactive state and exposes it as read-only `Observable`s.

Key design decisions:

- **`BehaviorSubject` for state** — holds the current value and replays it to new subscribers immediately.
- **`asObservable()`** — the public interface is read-only; subscribers cannot push values directly.
- **`ReadonlyMap`** — immutable collection prevents accidental mutation of shared state.
- **`distinctUntilChanged()`** — suppresses emissions when the value did not change, preventing unnecessary re-renders.
- **Streams do not own the client lifecycle** — they are stateless about connection management; the `@armoury/streams` package wraps WebSocket clients separately.
- **`dispose()` is idempotent** — safe to call multiple times; subsequent calls are no-ops.

```typescript
// src/shared/streams/src/matches/MatchStream.ts
// @requirements FE-052, FE-059

import { BehaviorSubject, map, distinctUntilChanged, type Observable, type Subscription } from 'rxjs';
import type { Match } from '@shared/types/entities.js';

/**
 * Reactive stream of live match state.
 * Updated by the WebSocket client as match events arrive.
 * Consumed by React components via useSyncExternalStore.
 */
export class MatchStream {
    private readonly state$ = new BehaviorSubject<ReadonlyMap<string, Match>>(new Map());
    private disposed = false;

    /** All currently tracked matches. */
    get matches$(): Observable<ReadonlyMap<string, Match>> {
        return this.state$.asObservable();
    }

    /** Single match by ID, emits only when that match changes. */
    match$(id: string): Observable<Match | undefined> {
        return this.state$.pipe(
            map((m) => m.get(id)),
            distinctUntilChanged(),
        );
    }

    /** Returns the current snapshot (synchronous — for useSyncExternalStore). */
    getMatch(id: string): Match | undefined {
        return this.state$.getValue().get(id);
    }

    /** Apply an incoming match update from the WebSocket layer. */
    updateMatch(match: Match): void {
        if (this.disposed) {
            return;
        }

        const current = new Map(this.state$.getValue());
        current.set(match.id, match);
        this.state$.next(current);
    }

    /** Remove a match (e.g., when a session ends). */
    removeMatch(id: string): void {
        if (this.disposed) {
            return;
        }

        const current = new Map(this.state$.getValue());
        current.delete(id);
        this.state$.next(current);
    }

    /** Idempotent cleanup — safe to call multiple times. */
    dispose(): void {
        if (this.disposed) {
            return;
        }

        this.disposed = true;
        this.state$.complete();
    }
}
```

---

## 3. Higher-Order Mapping Operators

Choosing the correct higher-order mapping operator is one of the most consequential RxJS decisions. The wrong choice causes race conditions, duplicate requests, or missed events.

| Operator     | Strategy                    | Use When                                                                        |
| ------------ | --------------------------- | ------------------------------------------------------------------------------- |
| `switchMap`  | Cancel previous, use latest | User input → server lookup (search, typeahead). Only the latest value matters.  |
| `concatMap`  | Queue, process in order     | Ordered write operations (e.g., create → update). Order must be preserved.      |
| `exhaustMap` | Ignore new while busy       | Idempotent triggers (e.g., a button that submits a form). Ignore double-clicks. |
| `mergeMap`   | All concurrent, no ordering | Independent parallel fire-and-forget operations (analytics events, logging).    |

```typescript
// src/web/src/components/armies/ArmySearch.tsx
// @requirements FE-052

'use client';

import { useEffect, useRef, useState } from 'react';
import {
    Subject,
    switchMap,
    debounceTime,
    distinctUntilChanged,
    catchError,
    of,
} from 'rxjs';
import { dc } from '@shared/data/DataContext.js';
import type { ArmySearchResult } from '@shared/types/entities.js';

/**
 * Typeahead search using switchMap + debounceTime.
 * switchMap cancels the previous in-flight search when the user types again,
 * preventing stale results from overwriting newer ones.
 */
export function ArmySearch(): JSX.Element {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ArmySearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Subject acts as the input event bridge from React into the RxJS pipeline
    const query$ = useRef(new Subject<string>());

    useEffect(() => {
        const sub = query$.current
            .pipe(
                debounceTime(300),
                distinctUntilChanged(),
                // switchMap: cancel the previous search request when a new query arrives
                switchMap((q) => {
                    if (!q.trim()) { return of([]); }

                    setIsSearching(true);

                    return dc.armies.search(q);
                }),
                catchError((_err, source$) => {
                    // Recover from error by continuing the stream
                    setIsSearching(false);

                    return source$;
                }),
            )
            .subscribe((res) => {
                setResults(res as ArmySearchResult[]);
                setIsSearching(false);
            });

        return () => sub.unsubscribe();
    }, []);

    const handleChange = (value: string): void => {
        setQuery(value);
        query$.current.next(value);
    };

    return (
        <div>
            <input
                value={query}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Search armies…"
                aria-busy={isSearching}
            />
            {results.length > 0 && (
                <ul role="listbox">
                    {results.map((r) => (
                        <li key={r.id} role="option">{r.name}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}
```

---

## 4. Subscribing to RxJS in React

The preferred integration point between RxJS streams and React components in React 18+/19 is `useSyncExternalStore`. It is concurrent-safe, tear-free, and compatible with the React 19 Compiler's automatic memoization.

> **FE-052**: Global reactive state uses RxJS.
> **FE-059**: RxJS subscriptions cleaned up in `useEffect` return.

#### `useSyncExternalStore` — Preferred (React 18+/19)

```typescript
// src/shared/frontend/hooks/useObservable.ts
// Pure TypeScript utility — usable in both web and mobile
// @requirements FE-052, FE-059

import { useSyncExternalStore } from 'react';
import { type BehaviorSubject } from 'rxjs';

/**
 * Subscribe to a BehaviorSubject using React's concurrent-safe primitive.
 *
 * Why useSyncExternalStore over useEffect+useState:
 *   - Concurrent-safe: React can interrupt a render and replay it; useSyncExternalStore
 *     guarantees a consistent snapshot across the interrupted render.
 *   - No tearing: all components reading the same subject see the same value in a
 *     given render pass, even under concurrent features (Transitions, Suspense).
 *   - React 19 Compiler: the Compiler can reason about useSyncExternalStore subscriptions
 *     and will not generate spurious memoization for them.
 *   - Simpler: no intermediate state, no double-render, no stale closure risk.
 */
export function useObservableValue<T>(subject: BehaviorSubject<T>): T {
    return useSyncExternalStore(
        // subscribe: returns an unsubscribe function
        (callback) => {
            const subscription = subject.subscribe(callback);

            return () => subscription.unsubscribe();
        },
        // getSnapshot: returns the current value synchronously
        () => subject.getValue(),
        // getServerSnapshot: React Server Components / SSR snapshot
        () => subject.getValue(),
    );
}
```

Usage:

```typescript
// src/web/src/components/matches/MatchPresence.tsx

'use client';

import { useObservableValue } from '@shared/frontend/hooks/useObservable.js';
import { usePresenceStream } from '@web/hooks/usePresenceStream.js';

interface Props {
    matchId: string;
}

/** Displays player presence for a match — updates reactively as WebSocket events arrive. */
export function MatchPresence({ matchId }: Props): JSX.Element {
    const stream = usePresenceStream();

    // presence$ is a BehaviorSubject — useSyncExternalStore subscribes concurrently safely
    const presence = useObservableValue(stream.presenceForMatch$(matchId));

    return (
        <ul>
            {[...presence.entries()].map(([playerId, status]) => (
                <li key={playerId}>
                    {playerId}: {status}
                </li>
            ))}
        </ul>
    );
}
```

#### `useEffect` Fallback — For Generic `Observable` (Not BehaviorSubject)

When you have a generic `Observable` (not a `BehaviorSubject`), there is no synchronous `getValue()`, so `useSyncExternalStore` requires additional adaptation. Use the `useEffect` pattern as a fallback, but be aware it does not provide the same concurrent-safety guarantees.

```typescript
// src/web/src/hooks/useObservableState.ts

import { useEffect, useState } from 'react';
import { type Observable } from 'rxjs';

/**
 * Subscribes to a generic Observable and returns its latest emitted value.
 *
 * NOTE: Prefer useObservableValue (useSyncExternalStore) for BehaviorSubjects.
 * Use this only when you have a non-behavior Observable with no initial value.
 *
 * Limitations:
 *   - Not concurrent-safe: the value may be "torn" across a concurrent re-render.
 *   - An initial undefined is emitted before the first observable value arrives.
 *
 * @requirements FE-059 — cleanup via useEffect return
 */
export function useObservableState<T>(observable: Observable<T>, initialValue: T): T {
    const [value, setValue] = useState<T>(initialValue);

    useEffect(() => {
        const subscription = observable.subscribe({
            next: setValue,
            // Do not swallow errors — let them propagate to an error boundary
            error: (err: unknown) => {
                throw err;
            },
        });

        return () => subscription.unsubscribe();
    }, [observable]);

    return value;
}
```

---

## 5. Memory Management

RxJS subscriptions that are not cleaned up cause memory leaks and ghost event handlers. Every subscription created in a React component **must** be cleaned up.

> **FE-059**: RxJS subscriptions cleaned up in `useEffect` return.

#### `useEffect` Cleanup — Component-Level Subscriptions

```typescript
// src/web/src/components/matches/LiveMatchScore.tsx

'use client';

import { useEffect, useState } from 'react';
import { useMatchStream } from '@web/hooks/useMatchStream.js';
import type { MatchScore } from '@shared/types/entities.js';

interface Props {
    matchId: string;
}

/** ✅ Correct: subscription is cleaned up in the useEffect return. */
export function LiveMatchScore({ matchId }: Props): JSX.Element {
    const stream = useMatchStream();
    const [score, setScore] = useState<MatchScore | null>(null);

    useEffect(() => {
        const subscription = stream
            .match$(matchId)
            .subscribe((match) => setScore(match?.score ?? null));

        // Cleanup: unsubscribe when component unmounts or matchId changes
        return () => subscription.unsubscribe();
    }, [stream, matchId]);

    if (!score) { return <Skeleton />; }

    return <ScoreDisplay score={score} />;
}
```

#### `takeUntil` — Service/Class-Level Subscriptions

For long-lived streams in service classes (not React components), use `takeUntil` to complete all internal subscriptions when the service is disposed. **`takeUntil` must be the last operator in the pipe** — placing it before other operators can cause operators that complete the source to swallow the termination signal.

```typescript
// src/shared/streams/src/matches/MatchEventProcessor.ts
// @requirements FE-059

import { Subject, takeUntil, mergeMap, type Observable } from 'rxjs';
import type { MatchEvent, Match } from '@shared/types/entities.js';

/** Processes incoming match events and applies them to the MatchStream. */
export class MatchEventProcessor {
    private readonly destroy$ = new Subject<void>();

    constructor(
        private readonly events$: Observable<MatchEvent>,
        private readonly stream: MatchStream,
    ) {
        this.initialize();
    }

    private initialize(): void {
        this.events$
            .pipe(
                mergeMap((event) => this.processEvent(event)),
                // takeUntil MUST be last — ensures all inner observables
                // complete before the source is terminated
                takeUntil(this.destroy$),
            )
            .subscribe((match) => {
                if (match) {
                    this.stream.updateMatch(match);
                }
            });
    }

    private processEvent(event: MatchEvent): Observable<Match | null> {
        // Process event and return updated match
        return this.stream
            .match$(event.matchId)
            .pipe
            // ... transformation logic
            ();
    }

    /** Stop all internal subscriptions. Idempotent. */
    dispose(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
```

---

## 6. Error Handling in RxJS

Unlike `Promise` rejections, unhandled errors in an RxJS `Observable` complete the stream and silently stop future emissions. Every stream that can error must handle errors explicitly.

**Key rules:**

1. Use `catchError` inside inner observables (e.g., inside `switchMap`) — this recovers the outer stream.
2. Use `retry` for transient failures (network errors, rate limits).
3. Never return `EMPTY` from `catchError` without logging — silent failures are invisible bugs.

```typescript
// src/shared/streams/src/matches/MatchDataService.ts
// @requirements FE-059

import { Observable, catchError, retry, throwError, timer, switchMap, type MonoTypeOperatorFunction } from 'rxjs';
import type { Match } from '@shared/types/entities.js';

/**
 * Retry with exponential backoff for transient network errors.
 * Retries up to 3 times with delays: 1s, 2s, 4s.
 */
function retryWithBackoff<T>(maxRetries = 3): MonoTypeOperatorFunction<T> {
    return retry({
        count: maxRetries,
        delay: (_error, retryCount) => timer(Math.pow(2, retryCount - 1) * 1000),
    });
}

/** Fetch match data with retry and explicit error propagation. */
export function fetchMatchWithRetry(matchId: string, fetchFn: (id: string) => Observable<Match>): Observable<Match> {
    return fetchFn(matchId).pipe(
        retryWithBackoff(3),
        catchError((err: unknown) => {
            // ✅ Always log before re-throwing — silent failures are invisible
            console.error('[MatchDataService] Failed to fetch match after retries', {
                matchId,
                error: err,
            });

            // Re-throw so the subscriber can handle the error (e.g., show error UI)
            return throwError(() => err);
        }),
    );
}

/** ❌ WRONG: returning EMPTY hides the error — the stream just silently stops */
export function fetchMatchSilentlyWrong(
    matchId: string,
    fetchFn: (id: string) => Observable<Match>,
): Observable<Match> {
    return fetchFn(matchId).pipe(
        catchError((_err) => {
            // ❌ Caller has no idea the fetch failed — data just never arrives
            return EMPTY;
        }),
    );
}
```

---

## 7. RxJS → React Query Cache Bridge

This is the critical integration pattern for real-time features. RxJS is the transport layer for WebSocket events; React Query is the cache. When a stream emits an updated entity, write it directly into the React Query cache via `setQueryData`. This ensures every `useQuery` subscriber re-renders with the latest data without polling or manual state synchronization.

**The rule:** RxJS is the transport. React Query is the cache. Never duplicate state by maintaining parallel copies in both.

```typescript
// src/web/src/lib/streamCacheBridge.ts
// @requirements FE-052, FE-050

import { type QueryClient } from '@tanstack/react-query';
import { type MatchStream } from '@armoury/streams';
import { matchDetailOptions } from '@shared/frontend/matches/queries.js';
import type { Match } from '@shared/types/entities.js';

/**
 * Bridges the real-time MatchStream into the React Query cache.
 *
 * When a WebSocket event arrives and MatchStream emits an updated match,
 * this function writes it into the React Query cache via setQueryData.
 * All useQuery(matchDetailOptions(id)) subscribers re-render automatically —
 * no polling, no separate state, no manual coordination.
 *
 * Returns a cleanup function to unsubscribe when the bridge is torn down.
 */
export function bridgeMatchStreamToQueryCache(
    stream: MatchStream,
    queryClient: QueryClient,
    matchId: string,
): () => void {
    const subscription = stream.match$(matchId).subscribe((match: Match | undefined) => {
        if (!match) {
            return;
        }

        // Write the stream event directly into the React Query cache.
        // All components subscribed via useQuery(matchDetailOptions(matchId))
        // will re-render with the updated data.
        queryClient.setQueryData<Match>(matchDetailOptions(matchId).queryKey, match);
    });

    return () => subscription.unsubscribe();
}
```

Mounting the bridge in a component:

```typescript
// src/web/src/components/matches/LiveMatchProvider.tsx

'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMatchStream } from '@web/hooks/useMatchStream.js';
import { bridgeMatchStreamToQueryCache } from '@web/lib/streamCacheBridge.js';

interface Props {
    matchId: string;
    children: React.ReactNode;
}

/**
 * Mounts the RxJS → React Query cache bridge for a live match.
 * Any component in the subtree calling useQuery(matchDetailOptions(matchId))
 * will receive real-time updates from the WebSocket stream.
 */
export function LiveMatchProvider({ matchId, children }: Props): JSX.Element {
    const queryClient = useQueryClient();
    const stream = useMatchStream();

    useEffect(() => {
        const cleanup = bridgeMatchStreamToQueryCache(stream, queryClient, matchId);

        return cleanup;
    }, [stream, queryClient, matchId]);

    return <>{children}</>;
}
```

Consuming the bridged data — the component has no knowledge of RxJS:

```typescript
// src/web/src/components/matches/MatchScorecard.tsx

'use client';

import { useQuery } from '@tanstack/react-query';
import { matchDetailOptions } from '@shared/frontend/matches/queries.js';

interface Props {
    matchId: string;
}

/**
 * Reads match data from React Query.
 * When LiveMatchProvider is mounted above this component, real-time
 * WebSocket updates arrive via setQueryData — this component re-renders
 * automatically without any RxJS knowledge.
 */
export function MatchScorecard({ matchId }: Props): JSX.Element {
    const { data: match } = useQuery(matchDetailOptions(matchId));

    if (!match) { return <Skeleton />; }

    return (
        <section aria-label="Match scorecard">
            <h2>{match.name}</h2>
            <ScoreDisplay score={match.score} />
            <TurnCounter turn={match.currentTurn} maxTurns={match.maxTurns} />
        </section>
    );
}
```

---

**Navigation:**

- ← [Server State via React Query](./REACT_QUERY.md)
- → [Derived State Patterns](./DERIVED_STATE.md)
