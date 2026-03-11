# State Testing Strategy

**Purpose:** Canonical reference for testing state management patterns across all tiers — local state, URL state, React Query, mutations, RxJS streams, and Context.

**Scope:** `@armoury/web`, `@armoury/mobile`, and `@armoury/streams` test patterns.

**Parent document:** [State Management Architecture](./plan/STATE_MANAGEMENT.md)

**Related Documents:**

- [State Management Architecture](./plan/STATE_MANAGEMENT.md) — Overview, philosophy, state hierarchy
- [Server State via React Query](./REACT_QUERY.md) — Server state patterns being tested
- [RxJS State Patterns](./RXJS_STATE.md) — RxJS patterns being tested
- [Derived State Patterns](./DERIVED_STATE.md) — Derived state patterns being tested
- [Requirements](./REQUIREMENTS.md) — FE-050 through FE-077

---

## Table of Contents

1. [Testing Local State](#1-testing-local-state)
2. [Testing URL State](#2-testing-url-state)
3. [Testing React Query](#3-testing-react-query)
4. [Testing Mutations](#4-testing-mutations)
5. [Testing RxJS Streams](#5-testing-rxjs-streams)
6. [Testing Context](#6-testing-context)

---

State management tests verify behavior through the public interface — rendered output, emitted values, cache contents — never implementation internals. The following sections address each state tier.

## 1. Testing Local State

Local state (`useState`) is tested by rendering the component with controlled inputs and asserting on rendered output. Never reach into component internals to read state variables directly.

```typescript
// src/web/src/components/__tests__/ArmyCardView.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArmyCardView } from '@web/src/components/ArmyCardView.js';
import { makeArmy } from '../__fixtures__/makeArmy.ts';

describe('ArmyCardView', () => {
    it('renders army name and unit count', () => {
        const army = makeArmy({
            name: 'Iron Hands',
            units: [{ id: 'u1' }, { id: 'u2' }],
        });

        render(<ArmyCardView army={army} onDelete={vi.fn()} />);

        expect(
            screen.getByRole('heading', { name: /iron hands/i }),
        ).toBeInTheDocument();
        expect(screen.getByText('2 units')).toBeInTheDocument();
    });

    it('calls onDelete with army ID when delete is confirmed', async () => {
        const user = userEvent.setup();
        const onDelete = vi.fn();
        const army = makeArmy({ id: 'a1', name: 'Death Guard' });

        render(<ArmyCardView army={army} onDelete={onDelete} />);

        await user.click(screen.getByRole('button', { name: /delete/i }));
        await user.click(screen.getByRole('button', { name: /confirm/i }));

        expect(onDelete).toHaveBeenCalledOnce();
        expect(onDelete).toHaveBeenCalledWith('a1');
    });
});
```

For components with complex local state, test through the rendered output. If business logic functions are extracted, test them as pure functions:

```typescript
// src/web/hooks/__tests__/armyEditorUtils.test.ts
import { describe, it, expect } from 'vitest';
import { calculatePointsTotal, validateArmyComposition } from '@shared/frontend/armies/validators.js';
import { makeUnit } from '../__fixtures__/makeUnit.ts';

describe('calculatePointsTotal', () => {
    it('sums all unit point costs', () => {
        const units = [makeUnit({ points: 100 }), makeUnit({ points: 150 })];

        expect(calculatePointsTotal(units)).toBe(250);
    });

    it('returns zero for empty unit list', () => {
        expect(calculatePointsTotal([])).toBe(0);
    });
});
```

## 2. Testing URL State

Mock `next/navigation` at the module level. The mock must be established before the component module is imported, so place `vi.mock` calls at the top of the test file.

```typescript
// src/web/src/components/__tests__/ArmyListPage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
    useSearchParams: () => new URLSearchParams('q=space+marines'),
    usePathname: () => '/armies',
    useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

// Import AFTER mocks are established
import { ArmyListPage } from '@web/src/app/armies/page.js';
import { createTestQueryClient, renderWithQuery } from '../__utils__/renderWithQuery.ts';
import { makeArmy } from '../__fixtures__/makeArmy.ts';

describe('ArmyListPage', () => {
    beforeEach(() => {
        mockPush.mockReset();
        mockReplace.mockReset();
    });

    it('filters armies by the search param in the URL', () => {
        const queryClient = createTestQueryClient();

        queryClient.setQueryData(
            ['armies', 'list', { status: 'active' }],
            [
                makeArmy({ name: 'Space Marines' }),
                makeArmy({ name: 'Death Guard' }),
            ],
        );

        renderWithQuery(<ArmyListPage />, queryClient);

        expect(screen.getByText('Space Marines')).toBeInTheDocument();
        expect(screen.queryByText('Death Guard')).not.toBeInTheDocument();
    });
});
```

## 3. Testing React Query

Every test that exercises React Query must use a fresh `QueryClient` instance to prevent cache pollution between tests. Extract this into a shared test utility.

```typescript
// src/web/src/__utils__/renderWithQuery.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

/** Creates a QueryClient configured for test isolation. */
export function createTestQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Disable retries so failed queries fail immediately in tests
                retry: false,
                // Keep cache alive for test duration to avoid premature GC
                gcTime: Infinity,
                // Disable refetch on window focus during tests
                refetchOnWindowFocus: false,
            },
            mutations: {
                retry: false,
            },
        },
    });
}

interface WrapperProps {
    readonly children: ReactNode;
}

/** Renders a component tree wrapped in a fresh QueryClientProvider. */
export function renderWithQuery(
    ui: ReactElement,
    queryClient: QueryClient = createTestQueryClient(),
): RenderResult {
    function Wrapper({ children }: WrapperProps) {
        return (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
    }

    return render(ui, { wrapper: Wrapper });
}
```

Seed the cache with `queryClient.setQueryData` to test loading, success, and error states without network calls:

```typescript
// src/web/src/components/__tests__/ArmyDetail.test.tsx
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { ArmyDetail } from '@web/src/components/ArmyDetail.js';
import { armyDetailOptions } from '@shared/frontend/armies/queries.js';
import {
    createTestQueryClient,
    renderWithQuery,
} from '../__utils__/renderWithQuery.ts';
import { makeArmy } from '../__fixtures__/makeArmy.ts';

describe('ArmyDetail', () => {
    it('renders army detail from cache', async () => {
        const queryClient = createTestQueryClient();
        const army = makeArmy({ id: 'a1', name: 'Ultramarines' });

        queryClient.setQueryData(armyDetailOptions('a1').queryKey, army);
        renderWithQuery(<ArmyDetail armyId="a1" />, queryClient);

        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: /ultramarines/i }),
            ).toBeInTheDocument();
        });
    });

    it('renders loading skeleton when data is not cached', () => {
        const queryClient = createTestQueryClient();

        renderWithQuery(<ArmyDetail armyId="a1" />, queryClient);

        expect(screen.getByTestId('army-detail-skeleton')).toBeInTheDocument();
    });
});
```

## 4. Testing Mutations

Test mutations by mocking the underlying service call and asserting on cache invalidation. Spy on `queryClient.invalidateQueries` to verify the mutation side effects.

```typescript
// src/web/src/components/__tests__/DeleteArmyButton.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteArmyButton } from '@web/src/components/DeleteArmyButton.js';
import * as armyService from '@shared/frontend/armies/service.js';
import {
    createTestQueryClient,
    renderWithQuery,
} from '../__utils__/renderWithQuery.ts';

vi.mock('@shared/frontend/armies/service.js');

describe('DeleteArmyButton', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('invalidates army list cache on successful delete', async () => {
        const user = userEvent.setup();
        vi.mocked(armyService.deleteArmy).mockResolvedValue(undefined);

        const queryClient = createTestQueryClient();
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        renderWithQuery(<DeleteArmyButton armyId="a1" />, queryClient);

        await user.click(screen.getByRole('button', { name: /delete army/i }));
        await user.click(screen.getByRole('button', { name: /confirm/i }));

        await waitFor(() => {
            expect(invalidateSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    queryKey: expect.arrayContaining(['armies']),
                }),
            );
        });
    });

    it('shows error toast when delete fails', async () => {
        const user = userEvent.setup();
        vi.mocked(armyService.deleteArmy).mockRejectedValue(
            new Error('Network error'),
        );

        renderWithQuery(<DeleteArmyButton armyId="a1" />);

        await user.click(screen.getByRole('button', { name: /delete army/i }));
        await user.click(screen.getByRole('button', { name: /confirm/i }));

        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent(/failed to delete/i);
        });
    });
});
```

## 5. Testing RxJS Streams

RxJS stream classes are pure TypeScript — they require no React, no DOM, and no test renderer. Test them as unit classes by constructing them with a mock client and asserting on the emitted BehaviorSubject values.

```typescript
// src/shared/streams/src/matches/__tests__/MatchStream.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Subject } from 'rxjs';
import { MatchStream } from '@streams/matches/MatchStream.js';
import type { IMatchesRealtimeClient } from '@streams/matches/types.js';
import type { MatchesServerMessage, Match } from '@shared/types/entities.js';
import { makeMatch } from '../__fixtures__/makeMatch.ts';

describe('MatchStream', () => {
    let messages$: Subject<MatchesServerMessage>;
    let mockClient: IMatchesRealtimeClient;
    let stream: MatchStream;

    beforeEach(() => {
        messages$ = new Subject<MatchesServerMessage>();
        mockClient = {
            messages$: messages$.asObservable(),
            send: vi.fn(),
        } as unknown as IMatchesRealtimeClient;
        stream = new MatchStream(mockClient);
    });

    afterEach(() => {
        stream.dispose();
    });

    it('reflects initial empty state before any messages', () => {
        let result: ReadonlyMap<string, Match> | undefined;

        stream.matches$.subscribe((m) => {
            result = m;
        });

        expect(result).toEqual(new Map());
    });

    it('adds a match to the map on matchState message', () => {
        const mockMatch = makeMatch({ id: 'm1' });

        messages$.next({ type: 'matchState', matchId: 'm1', state: mockMatch });

        let result: ReadonlyMap<string, Match> | undefined;

        stream.matches$.subscribe((m) => {
            result = m;
        });

        expect(result?.get('m1')).toEqual(mockMatch);
    });

    it('removes a match from the map on matchEnded message', () => {
        const mockMatch = makeMatch({ id: 'm1' });

        messages$.next({ type: 'matchState', matchId: 'm1', state: mockMatch });
        messages$.next({ type: 'matchEnded', matchId: 'm1' });

        let result: ReadonlyMap<string, Match> | undefined;

        stream.matches$.subscribe((m) => {
            result = m;
        });

        expect(result?.has('m1')).toBe(false);
    });

    it('match$ emits undefined for unknown match IDs', () => {
        let result: Match | undefined = makeMatch();

        stream.match$('nonexistent').subscribe((m) => {
            result = m;
        });

        expect(result).toBeUndefined();
    });

    it('completes all subjects on dispose', () => {
        let completed = false;

        stream.matches$.subscribe({
            complete: () => {
                completed = true;
            },
        });

        stream.dispose();

        expect(completed).toBe(true);
    });
});
```

For hooks that bridge streams to React state, test via rendered output:

```typescript
// src/web/hooks/__tests__/useMatchSync.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { Subject } from 'rxjs';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMatchSync } from '@web/hooks/useMatchSync.js';
import { matchDetailOptions } from '@shared/frontend/matches/queries.js';
import { makeMatch } from '../__fixtures__/makeMatch.ts';
import type { IMatchStream } from '@armoury/streams';
import type { Match } from '@shared/types/entities.js';
import type { ReactNode } from 'react';

describe('useMatchSync', () => {
    let queryClient: QueryClient;
    let matchSubject: Subject<Match | undefined>;
    let mockStream: IMatchStream;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        });
        matchSubject = new Subject<Match | undefined>();
        mockStream = {
            match$: () => matchSubject.asObservable(),
        } as unknown as IMatchStream;
    });

    function wrapper({ children }: { children: ReactNode }) {
        return (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
    }

    it('writes stream updates into the query cache', () => {
        const match = makeMatch({ id: 'm1' });

        renderHook(
            () => useMatchSync(mockStream, 'm1'),
            { wrapper },
        );

        matchSubject.next(match);

        const cached = queryClient.getQueryData(
            matchDetailOptions('m1').queryKey,
        );

        expect(cached).toEqual(match);
    });
});
```

## 6. Testing Context

Test Context through rendered component trees with the provider. Test the `useXxx` hook's guard separately to confirm it throws outside the provider.

```typescript
// src/web/src/providers/__tests__/DataContextProvider.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
    DataContextProvider,
    useDataContext,
} from '@web/src/providers/DataContextProvider.js';
import type { IDataContext } from '@shared/data/types.js';

const mockDataContext = {
    getArmy: vi.fn(),
    listArmies: vi.fn(),
} as unknown as IDataContext;

function ConsumerComponent() {
    const ctx = useDataContext();

    return <div data-testid="ctx-available">{ctx ? 'present' : 'absent'}</div>;
}

describe('DataContextProvider', () => {
    it('provides data context to consumers', () => {
        render(
            <DataContextProvider dataContext={mockDataContext}>
                <ConsumerComponent />
            </DataContextProvider>,
        );

        expect(screen.getByTestId('ctx-available')).toHaveTextContent('present');
    });

    it('throws when useDataContext is called outside the provider', () => {
        // Suppress the React error boundary console output during this test
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        expect(() => render(<ConsumerComponent />)).toThrow(
            'useDataContext must be used within a DataContextProvider',
        );

        consoleSpy.mockRestore();
    });
});
```

---

**Navigation:**

- ← [Derived State Patterns](./DERIVED_STATE.md)
- → [State Management Architecture](./plan/STATE_MANAGEMENT.md) (hub)
