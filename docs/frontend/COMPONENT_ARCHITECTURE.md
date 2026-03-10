> **Document Status:** This document defines the **target architecture** for component design in the Armoury monorepo. Code examples use planned component names (e.g., `ArmyListContainer`, `ArmyCard`) from [FRONTEND_PLAN.md](./FRONTEND_PLAN.md) to illustrate patterns — these components do not exist in code yet. The `src/shared/frontend/` directory referenced throughout is a **Phase 0 planned directory** (see [PHASE_0_SHARED_PREREQUISITES.md](./plan/PHASE_0_SHARED_PREREQUISITES.md)) that has not been created. Where existing code is referenced, it is noted explicitly. All patterns and guidelines are approved architectural decisions ready for implementation.

# Component Architecture

**Purpose:** Actionable guidelines for structuring React components in the Armoury monorepo. Covers composition patterns, hook design, state placement, colocation, cross-platform sharing, server component boundaries, error handling, testing strategies, TypeScript APIs, and performance patterns.

**Audience:** Engineers and AI agents implementing features in `@armoury/web`, `@armoury/mobile`, or `@armoury/systems`.

**Related Documents:**

- [BEST_PRACTICES.md](./plan/BEST_PRACTICES.md) — §5 React Component Design, §6 React Hooks, §7 Orchestrational/Render Pattern, §9 Server Components, §14 Error Handling, §19 Testing, §20 Performance, §21 Anti-Patterns
- [FRONTEND_FILE_ORGANIZATION.md](./FRONTEND_FILE_ORGANIZATION.md) — §4 Component File Organization, §5 Decision Tree
- [STATE_MANAGEMENT.md](./plan/STATE_MANAGEMENT.md) — Full 5-tier state architecture
- [REACT_QUERY.md](./REACT_QUERY.md) — Server state patterns
- [RXJS_STATE.md](./RXJS_STATE.md) — Global reactive state
- [SHARED_COMPONENTS.md](./plan/SHARED_COMPONENTS.md) — Shared UI component registry and styling contracts
- [DERIVED_STATE.md](./DERIVED_STATE.md) — Derived state patterns

---

## Table of Contents

1. [Component Organization](#1-component-organization)
2. [Component Composition Patterns](#2-component-composition-patterns)
3. [Custom Hook Patterns](#3-custom-hook-patterns)
4. [State Placement Decision Tree](#4-state-placement-decision-tree)
5. [Colocation Principle](#5-colocation-principle)
6. [Props Drilling Alternatives](#6-props-drilling-alternatives)
7. [Cross-Platform Patterns](#7-cross-platform-patterns)
8. [Server Component Boundaries](#8-server-component-boundaries)
9. [Error Handling & Recovery](#9-error-handling--recovery)
10. [Testing Strategies](#10-testing-strategies)
11. [TypeScript Component APIs](#11-typescript-component-apis)
12. [Performance Patterns](#12-performance-patterns)

---

## 1. Component Organization

> For file system placement (which directory a component lives in), see [FRONTEND_FILE_ORGANIZATION.md §4–§5](./FRONTEND_FILE_ORGANIZATION.md).

This section covers **when to split a component**, **when to leave it alone**, and **how big is too big**.

### Component Size Heuristics

| Signal                                           | Action                                                                                                                                        |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| File exceeds ~150 JSX lines                      | Split into sub-components                                                                                                                     |
| More than 7 props                                | Consider composition or splitting                                                                                                             |
| More than 3 `useState` calls                     | Extract a custom hook or split concerns                                                                                                       |
| Component handles both data and rendering        | Apply orchestrational/render split (mandatory — [BEST_PRACTICES.md §7](./plan/BEST_PRACTICES.md#7-orchestrational--render-component-pattern)) |
| Multiple unrelated responsibilities              | Split into focused components                                                                                                                 |
| A section of JSX has its own loading/error state | Extract as a separate Suspense boundary                                                                                                       |

### When to Split — Decision Tree

```
Is this component doing both data-fetching/state AND visual rendering?
├── YES → MANDATORY: Apply orchestrational/render split (FE-020)
└── NO
    Does the component exceed ~150 lines of JSX?
    ├── YES → Identify cohesive visual sections → extract as render sub-components
    └── NO
        Does the component accept more than 7 props?
        ├── YES → Consider:
        │   ├── Can you use composition (children/slots) instead of props? → Do that
        │   ├── Are some props always passed together? → Group into a compound component
        │   └── Are the props for two unrelated concerns? → Split into two components
        └── NO
            Is the component reused in multiple places with different configurations?
            ├── YES → Extract variant behavior into props or composition
            └── NO → Leave it. A focused single-purpose component is fine as-is.
```

### When NOT to Split

- A component is under 100 lines and has a single clear responsibility — **leave it alone**.
- Extracting a sub-component would require passing 5+ props just to thread data through — the cure is worse than the disease. Consider composition instead.
- The "sub-component" would only ever be used inside this one parent — it may not warrant a separate file. A locally-defined render function or a same-file sub-component is fine.

### One Component Per File Rule

Every `.tsx` file should export **one** React component. Exceptions:

- **Orchestrational + render pairs** that are tightly coupled may live in the same file, but prefer separate files once either exceeds ~50 lines.
- **Small sub-components** that are only used by the parent (e.g., a `ListItem` inside a `List`) may be defined in the same file if they are under ~30 lines.

### Naming Convention

| Entity                    | Convention                            | Example                         |
| ------------------------- | ------------------------------------- | ------------------------------- |
| Orchestrational component | `<Feature>Container`                  | `ArmyListContainer`             |
| Render component          | `<Feature>View` or descriptive name   | `ArmyListView`, `ArmyCard`      |
| Layout component          | `<Name>Layout`                        | `ShellLayout`, `TabLayout`      |
| Compound component root   | `<Name>` (with static sub-components) | `StatBlock`, `StatBlock.Label`  |
| Utility render component  | Descriptive name                      | `LoadingSkeleton`, `EmptyState` |

---

## 2. Component Composition Patterns

### Pattern Catalog

The project uses four primary composition patterns, listed by preference:

| Priority | Pattern                             | When to Use                                  | Complexity |
| -------- | ----------------------------------- | -------------------------------------------- | ---------- |
| 1        | **Orchestrational/Render**          | Every feature component (MANDATORY — FE-020) | Low        |
| 2        | **Children composition**            | Wrapping/slotting content into a container   | Low        |
| 3        | **Compound components**             | Multi-part UI with shared implicit state     | Medium     |
| 4        | **Render props / render callbacks** | Dynamic rendering logic delegated to parent  | Medium     |

> Higher-order components (HOCs) are **not used** in this project. Use hooks or composition instead.

### Pattern 1: Orchestrational / Render Split (MANDATORY)

> Canonical reference: [BEST_PRACTICES.md §7](./plan/BEST_PRACTICES.md#7-orchestrational--render-component-pattern)
> All component names below (`ArmyListContainer`, `ArmyCard`, etc.) are planned names from [FRONTEND_PLAN.md](./FRONTEND_PLAN.md) — they illustrate the pattern but do not exist in code yet.

Every feature component must split into:

- **Orchestrational** — owns data fetching, state, side effects. Zero visual markup beyond composing render components.
- **Render** — pure visual output from props. No data hooks. `useState` for local UI state only (open/closed, hover).

```typescript
// Orchestrational — src/web/src/components/armies/ArmyListContainer.tsx
function ArmyListContainer() {
    const filters = useArmyFilters();              // URL state
    const { data, isLoading, error } = useArmies(filters);
    const deleteArmy = useDeleteArmy();

    if (error) throw error;                        // Let error boundary handle

    return (
        <ArmyListView
            armies={data ?? []}
            isLoading={isLoading}
            filters={filters}
            onDelete={deleteArmy.mutate}
        />
    );
}

// Render — src/web/src/components/armies/ArmyListView.tsx
interface ArmyListViewProps {
    readonly armies: readonly Army[];
    readonly isLoading: boolean;
    readonly filters: ArmyFilters;
    readonly onDelete: (id: string) => void;
}

function ArmyListView({ armies, isLoading, filters, onDelete }: ArmyListViewProps) {
    if (isLoading) return <ArmyListSkeleton />;
    if (armies.length === 0) return <EmptyState type="armies" filters={filters} />;

    return (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
            {armies.map((army) => (
                <li key={army.id}>
                    <ArmyCard army={army} onDelete={onDelete} />
                </li>
            ))}
        </ul>
    );
}
```

**Key rules:**

- Render components must NOT import `@tanstack/react-query` or any data-fetching library directly (FE-015).
- Both the orchestrational and render component live in the same platform workspace (`src/web/` or `src/mobile/`).
- Query/mutation factories live in `src/shared/frontend/` _(Phase 0 — planned, not yet created; current query factories are in `src/shared/clients/_/queries/`)\* as pure TypeScript (FE-002).

### Pattern 2: Children Composition

Use `children` to compose content into containers without the container knowing what it renders. This is the simplest way to avoid props drilling.

```typescript
// Container doesn't know what it wraps
interface CardProps {
    readonly children: React.ReactNode;
    readonly variant?: 'default' | 'highlighted';
}

function Card({ children, variant = 'default' }: CardProps) {
    return (
        <div className={cn('rounded-lg border p-4', variant === 'highlighted' && 'border-accent-primary')}>
            {children}
        </div>
    );
}

// Usage — parent controls the content
<Card variant="highlighted">
    <ArmyHeader army={army} />
    <UnitList units={army.units} />
</Card>
```

**When to prefer children over props:**

- The content varies significantly between use sites.
- You'd otherwise be passing JSX as a prop (e.g., `header={<ArmyHeader />}`).
- The component is a layout or container, not a data-aware feature.

**Named slots via props** — when a component needs multiple distinct content areas:

```typescript
interface PageLayoutProps {
    readonly header: React.ReactNode;
    readonly sidebar: React.ReactNode;
    readonly children: React.ReactNode;
}

function PageLayout({ header, sidebar, children }: PageLayoutProps) {
    return (
        <div className="grid grid-cols-[240px_1fr]">
            <aside>{sidebar}</aside>
            <main>
                <header>{header}</header>
                {children}
            </main>
        </div>
    );
}
```

### Pattern 3: Compound Components

Use compound components when multiple sub-components share implicit state and must work together as a cohesive unit. The parent controls shared context; children consume it.

**When to use compound components:**

- A UI element has multiple parts that must coordinate (e.g., Accordion, Tabs, Menu).
- The parts need shared state but the consumer should compose them freely.
- You want a flexible API where the consumer decides layout/order of sub-components.

**When NOT to use:**

- Components that don't share state — just use children composition.
- Only two parts (container + content) — too much ceremony for simple composition.

#### Web (Radix-based)

Radix UI primitives are already compound components. Extend them with project styling:

```typescript
import * as Tabs from '@radix-ui/react-tabs';

// Wrap Radix compound parts with project-specific styling
function GameTabs({ children, ...props }: Tabs.TabsProps) {
    return <Tabs.Root className="flex flex-col gap-2" {...props}>{children}</Tabs.Root>;
}

function GameTabsList({ children }: { children: React.ReactNode }) {
    return (
        <Tabs.List className="flex gap-1 border-b border-border-subtle">
            {children}
        </Tabs.List>
    );
}

function GameTabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
    return (
        <Tabs.Trigger
            value={value}
            className="px-4 py-2 text-sm text-text-secondary
                data-[state=active]:text-text-primary data-[state=active]:border-b-2
                data-[state=active]:border-accent-primary"
        >
            {children}
        </Tabs.Trigger>
    );
}

// Usage
<GameTabs defaultValue="units">
    <GameTabsList>
        <GameTabsTrigger value="units">Units</GameTabsTrigger>
        <GameTabsTrigger value="enhancements">Enhancements</GameTabsTrigger>
    </GameTabsList>
    <Tabs.Content value="units"><UnitList units={army.units} /></Tabs.Content>
    <Tabs.Content value="enhancements"><EnhancementList items={army.enhancements} /></Tabs.Content>
</GameTabs>
```

#### Mobile (Tamagui-based)

Use Tamagui's `createStyledContext` + `withStaticProperties` pattern:

```typescript
import { createStyledContext, styled, withStaticProperties, YStack, Text } from 'tamagui';

const StatBlockContext = createStyledContext({
    size: 'md' as 'sm' | 'md' | 'lg',
});

const StatBlockFrame = styled(YStack, {
    context: StatBlockContext,
    gap: '$1',
    alignItems: 'center',
    variants: {
        size: {
            sm: { gap: '$0.5' },
            md: { gap: '$1' },
            lg: { gap: '$2' },
        },
    } as const,
});

const StatBlockValue = styled(Text, {
    context: StatBlockContext,
    fontFamily: '$mono',
    fontWeight: '700',
    color: '$textPrimary',
    variants: {
        size: {
            sm: { fontSize: '$4' },
            md: { fontSize: '$6' },
            lg: { fontSize: '$8' },
        },
    } as const,
});

const StatBlockLabel = styled(Text, {
    context: StatBlockContext,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '$textTertiary',
    variants: {
        size: {
            sm: { fontSize: 10 },
            md: { fontSize: 11 },
            lg: { fontSize: 12 },
        },
    } as const,
});

export const StatBlock = withStaticProperties(StatBlockFrame, {
    Value: StatBlockValue,
    Label: StatBlockLabel,
});

// Usage — size prop cascades to all children via context
<StatBlock size="lg">
    <StatBlock.Value>1,250</StatBlock.Value>
    <StatBlock.Label>Total Points</StatBlock.Label>
</StatBlock>
```

> **Critical (Tamagui):** Always add `as const` to the `variants` object. Tamagui silently fails without it.

### Pattern 4: Render Props / Render Callbacks

Use when a child needs to delegate rendering decisions back to its parent. This is less common than children composition but useful for lists, virtualization, and dynamic item rendering. _(The `FlashList` example below is aspirational — `@shopify/flash-list` is not yet installed. See [PHASE_0_SHARED_PREREQUISITES.md](./plan/PHASE_0_SHARED_PREREQUISITES.md).)_

```typescript
interface VirtualListProps<T> {
    readonly items: readonly T[];
    readonly estimatedItemSize: number;
    readonly renderItem: (item: T, index: number) => React.ReactNode;
    readonly keyExtractor: (item: T) => string;
}

function VirtualList<T>({ items, estimatedItemSize, renderItem, keyExtractor }: VirtualListProps<T>) {
    return (
        <FlashList
            data={items}
            renderItem={({ item, index }) => renderItem(item, index)}
            estimatedItemSize={estimatedItemSize}
            keyExtractor={keyExtractor}
        />
    );
}

// Usage
<VirtualList
    items={units}
    estimatedItemSize={88}
    renderItem={(unit) => <UnitCard unit={unit} onSelect={handleSelect} />}
    keyExtractor={(unit) => unit.id}
/>
```

### Pattern Selection Decision Tree

```
Does the component need to fetch data or manage complex state?
├── YES → Orchestrational/Render split (Pattern 1 — MANDATORY)
└── NO
    Does the component wrap other content the parent controls?
    ├── YES
    │   Does it need multiple named content areas?
    │   ├── YES → Named slots via props (Pattern 2 variant)
    │   └── NO → children composition (Pattern 2)
    └── NO
        Do multiple sub-components share implicit state?
        ├── YES → Compound component (Pattern 3)
        └── NO
            Does the parent need to control how items render?
            ├── YES → Render callback prop (Pattern 4)
            └── NO → Simple component with props
```

---

## 3. Custom Hook Patterns

> For `useEffect`, `useCallback`, and `useMemo` rules, see [BEST_PRACTICES.md §6](./plan/BEST_PRACTICES.md#6-react-hooks).

### Hook Extraction Heuristics

Extract a custom hook when **any** of these conditions is true:

| Condition                                    | Example                                                    |
| -------------------------------------------- | ---------------------------------------------------------- |
| Hook logic is reused across 2+ components    | `useArmyFilters()` used in list and search                 |
| A component's hook block exceeds ~15 lines   | 4+ hooks coordinating together                             |
| Hooks form a cohesive unit with a clear name | `useMatchTimer()` = shared value + interval + cleanup      |
| The hook combination is a recurring pattern  | `useInfiniteScroll()` = intersection observer + pagination |

### Hook Structure

Every custom hook should follow this template:

```typescript
/**
 * Manages army list filter state synchronized with URL search params.
 *
 * @returns Current filters and setter functions.
 */
export function useArmyFilters() {
    const searchParams = useSearchParams();

    // Derive state from URL (single source of truth)
    const filters: ArmyFilters = useMemo(
        () => ({
            faction: searchParams.get('faction') ?? undefined,
            sort: (searchParams.get('sort') as ArmySortField) ?? 'name',
            search: searchParams.get('q') ?? '',
        }),
        [searchParams],
    );

    const setFilter = useCallback(
        (key: keyof ArmyFilters, value: string | undefined) => {
            const params = new URLSearchParams(searchParams);
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
            router.replace(`?${params.toString()}`);
        },
        [searchParams, router],
    );

    return { filters, setFilter } as const;
}
```

### God-Hook Prevention

A "god hook" is a custom hook that does too much — fetching data, managing multiple state values, subscribing to events, and handling mutations all in one. These are hard to test, hard to reuse, and hard to understand.

**Symptoms of a god hook:**

- More than ~25 lines of hook logic
- Combines data fetching + local state + subscriptions + mutations
- Returns more than 5 values
- Name is vague (`useArmyPage`, `useMatchState`)

**Fix: Compose smaller hooks.**

```typescript
// ❌ God hook — does everything
function useArmyPage(armyId: string) {
    const { data: army } = useQuery(armyDetailOptions(armyId));
    const { data: factions } = useQuery(factionListOptions());
    const deleteArmy = useDeleteArmy();
    const [isEditing, setIsEditing] = useState(false);
    const [selectedTab, setSelectedTab] = useState<Tab>('units');
    const subscription = usePresence(armyId);
    // ... 40 more lines
    return { army, factions, deleteArmy, isEditing, setIsEditing, selectedTab, setSelectedTab, subscription };
}

// ✅ Compose focused hooks — each does one thing
function useArmyDetail(armyId: string) {
    return useQuery(armyDetailOptions(armyId));
}

function useArmyActions(armyId: string) {
    return {
        deleteArmy: useDeleteArmy(),
        updateArmy: useUpdateArmy(armyId),
    };
}

function useArmyEditing() {
    const [isEditing, setIsEditing] = useState(false);
    return { isEditing, startEditing: () => setIsEditing(true), stopEditing: () => setIsEditing(false) };
}

// Orchestrational component composes them
function ArmyDetailContainer({ armyId }: { armyId: string }) {
    const { data: army, isLoading } = useArmyDetail(armyId);
    const actions = useArmyActions(armyId);
    const editing = useArmyEditing();

    return <ArmyDetailView army={army} isLoading={isLoading} actions={actions} editing={editing} />;
}
```

### Hook Composition Rules

1. **Hooks compose upward.** Small hooks compose into larger hooks. Never reach down — a hook should not call another hook's internals.

2. **One concern per hook.** Each hook manages exactly one thing: a query, a mutation, a subscription, a piece of local state, or a browser API integration.

3. **Hooks don't render.** A hook returns data and callbacks — never JSX. If a hook needs to produce UI, it's a component, not a hook.

4. **Query hooks stay thin.** Platform-specific query hooks should be thin wrappers over shared `queryOptions` factories:

    ```typescript
    // src/web/src/hooks/useArmies.ts — thin wrapper
    export function useArmies(filters: ArmyFilters) {
        return useQuery(armyListOptions(filters));
    }
    ```

5. **Hooks live in the platform workspace that uses them.** Never put React hooks in `src/shared/frontend/` (FE-002). The shared layer contains only `queryOptions` factories, mutation functions, and pure TypeScript utilities. _(Note: `src/shared/frontend/` is a Phase 0 planned directory — see [PHASE_0_SHARED_PREREQUISITES.md](./plan/PHASE_0_SHARED_PREREQUISITES.md). Current query factories are in `src/shared/clients/_/queries/`.)\*

### Platform-Agnostic Hook Logic

When hook logic is identical across web and mobile, extract the **pure TypeScript** part into `src/shared/frontend/` _(Phase 0 — planned, not yet created)_ and wrap it in platform-specific hooks:

```typescript
// src/shared/frontend/utils/armyFilters.ts — pure TS, no React (planned path)
export function parseArmyFilters(params: Record<string, string | undefined>): ArmyFilters {
    return {
        faction: params['faction'] ?? undefined,
        sort: (params['sort'] as ArmySortField) ?? 'name',
        search: params['q'] ?? '',
    };
}

// src/web/src/hooks/useArmyFilters.ts — web hook using shared logic
import { parseArmyFilters } from '@shared/frontend/utils/armyFilters.js';

export function useArmyFilters() {
    const searchParams = useSearchParams();
    const params = Object.fromEntries(searchParams.entries());
    return parseArmyFilters(params);
}

// src/mobile/src/hooks/useArmyFilters.ts — mobile hook using shared logic
import { parseArmyFilters } from '@shared/frontend/utils/armyFilters.js';

export function useArmyFilters() {
    const params = useLocalSearchParams<Record<string, string>>();
    return parseArmyFilters(params);
}
```

---

## 4. State Placement Decision Tree

> Canonical reference: [STATE_MANAGEMENT.md](./plan/STATE_MANAGEMENT.md) — Full 5-tier architecture with code examples.

This section provides a quick-reference decision tree for the 5-tier hierarchy.

### The Decision Tree

```
Where should this state live?

Is it derived from other state?
├── YES → Compute inline. Do NOT store it. (See DERIVED_STATE.md)
└── NO
    Is it only used by one component (open/closed, hover, input value)?
    ├── YES → useState (Tier 1)
    └── NO
        Should it survive page refresh? Be shareable via URL? Affect back/forward?
        ├── YES → URL search params (Tier 2)
        └── NO
            Is it data from a server (fetched, cacheable, belongs to the backend)?
            ├── YES → React Query / TanStack Query (Tier 3)
            └── NO
                Is it a real-time stream, WebSocket event, or globally reactive value?
                ├── YES → RxJS BehaviorSubject (Tier 4)
                └── NO
                    Is it truly global client state shared across distant components?
                    ├── YES → React Context (Tier 5 — LAST RESORT, document why)
                    └── NO → Lift useState to the nearest common ancestor
```

### Quick Reference Table

| Tier | Tool                   | Examples                                               | Rules                                                                                                                                                                        |
| ---- | ---------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `useState`             | Dropdown open/closed, input value, selected tab        | Scoped to one component. Reset on unmount.                                                                                                                                   |
| 2    | URL params             | Filters, pagination, sort order, selected army ID      | Shareable, bookmarkable. Use `useSearchParams` (web) or `useLocalSearchParams` (mobile).                                                                                     |
| 3    | React Query            | Army list, match details, faction data, user profile   | All server/async data. Never store in useState. Use `queryOptions` factories from `src/shared/frontend/` _(Phase 0 planned; currently in `src/shared/clients/_/queries/`)\*. |
| 4    | RxJS `BehaviorSubject` | Presence map, WebSocket streams, real-time match state | Global reactive state. Subscribe via `useSyncExternalStore`. See [RXJS_STATE.md](./RXJS_STATE.md).                                                                           |
| 5    | React Context          | Theme, locale, auth session                            | LAST RESORT. Document why other tiers don't work. Never for server data or frequently-changing values.                                                                       |

### Common Mistakes

| Mistake                                                                            | Fix                                                   |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Storing server data in `useState` + `useEffect`                                    | Use React Query (`useQuery` + `queryOptions`)         |
| Storing derived state in `useState`                                                | Compute inline or `useMemo`                           |
| Using Context for "global" data fetched from API                                   | Use React Query — it's already global                 |
| Creating a Context for theme/locale without checking if the framework provides one | Next.js `next-intl` and Tamagui already provide these |
| Using RxJS for simple local toggle state                                           | Use `useState` — don't over-engineer                  |

---

## 5. Colocation Principle

### What Lives in the Component Folder

Each component folder contains everything that component needs — and nothing else:

```
ArmyCard/
├── ArmyCard.tsx              → The component
├── types.ts                  → Props interface, internal types
├── styles.ts                 → CVA variants, Tailwind class helpers (web)
├── index.ts                  → Barrel export
├── useArmyCardActions.ts     → Hook ONLY used by this component (optional)
├── ArmyCardSkeleton.tsx      → Loading placeholder (optional)
├── __tests__/
│   └── ArmyCard.test.tsx     → Unit tests
└── __mocks__/                → Test mocks (optional)
```

### Colocation Decision Tree

```
Where does this code live?

Is it a type/interface used ONLY by this component?
├── YES → ComponentName/types.ts
└── NO → src/{web|mobile}/src/types/ or src/shared/types/

Is it a hook used ONLY by this component?
├── YES → ComponentName/useHookName.ts
└── NO → src/{web|mobile}/src/hooks/

Is it a utility function used ONLY by this component?
├── YES → ComponentName/utils.ts (or inline if short)
└── NO → src/{web|mobile}/src/utils/ or src/shared/frontend/utils/ *(Phase 0 planned)*

Is it a style definition (CVA variants, class helpers)?
├── YES → ComponentName/styles.ts
└── NO → Not applicable

Is it test data or mock?
├── Test fixture → ComponentName/__tests__/__fixtures__/
└── Module mock → ComponentName/__mocks__/
```

### When to Centralize vs. Colocate

| Signal → Colocate                             | Signal → Centralize                          |
| --------------------------------------------- | -------------------------------------------- |
| Used by only 1 component                      | Used by 2+ components                        |
| Would require importing from a distant folder | Already exists in a shared location          |
| Changes only when the component changes       | Changes independently from any one component |
| Is an implementation detail                   | Is a public API or shared contract           |

### Promotion Pattern

When something starts colocated and later needs sharing:

1. **Move** the file from `ComponentName/` to the appropriate centralized location (`hooks/`, `utils/`, `types/`).
2. **Update imports** in the original component to reference the new location.
3. **Add the new import** in the second consumer.
4. **Do not leave a proxy re-export** in the old location — clean break.

```
// Before: colocated
ArmyCard/useArmyActions.ts  →  used only by ArmyCard

// After: another component needs it
src/web/src/hooks/useArmyActions.ts  →  used by ArmyCard and ArmyDetail
```

---

## 6. Props Drilling Alternatives

### The Problem

Props drilling = passing data through multiple component layers that don't use it. Three levels of pass-through is the threshold where it becomes a code smell.

### Decision Tree

```
Data needs to reach a deeply nested component. How?

Can you restructure the component tree to remove intermediate layers?
├── YES → Composition (preferred)
│   Move the consuming component up, or use children to skip intermediaries.
└── NO
    Is the data a server query result?
    ├── YES → Each consumer calls useQuery() with the same queryOptions.
    │   React Query deduplicates — no drilling needed.
    └── NO
        Is the data a reactive global value (presence, WebSocket)?
        ├── YES → RxJS BehaviorSubject + useSyncExternalStore
        └── NO
            Is the data genuinely global AND rarely changes (theme, locale, auth)?
            ├── YES → React Context (Tier 5 — document why)
            └── NO
                Can you lift state to a common ancestor that's ≤2 levels above consumers?
                ├── YES → Lift state + pass props (acceptable if ≤2 levels)
                └── NO → Reconsider your component tree structure.
                    You may have too many intermediary wrapper components.
```

### Pattern: Composition Over Drilling

Instead of threading props down, move the data-aware component higher and pass the consuming component as children:

```typescript
// ❌ Props drilling — Header doesn't use userName, just passes it through
function Page({ userName }: { userName: string }) {
    return <Header userName={userName} />;
}
function Header({ userName }: { userName: string }) {
    return <nav><UserBadge userName={userName} /></nav>;
}

// ✅ Composition — Page composes UserBadge directly
function Page({ userName }: { userName: string }) {
    return <Header userBadge={<UserBadge userName={userName} />} />;
}
function Header({ userBadge }: { userBadge: React.ReactNode }) {
    return <nav>{userBadge}</nav>;
}
```

### Pattern: Query Deduplication

Multiple components can call `useQuery()` with the same query key — React Query deduplicates the network request:

```typescript
// Both components independently fetch armies — only ONE network request fires
function ArmyListContainer() {
    const { data: armies } = useQuery(armyListOptions(filters));
    return <ArmyListView armies={armies ?? []} />;
}

function ArmyCountBadge() {
    const { data: armies } = useQuery(armyListOptions(filters));
    return <Badge>{armies?.length ?? 0}</Badge>;
}
```

---

## 7. Cross-Platform Patterns

> For file extension conventions, see [BEST_PRACTICES.md §3](./plan/BEST_PRACTICES.md#3-cross-platform-code-sharing).
> **Current status:** The mobile workspace (`src/mobile/`) contains only Expo providers and no feature components. Cross-platform patterns below are target architecture for when mobile development begins. The web workspace (`src/web/`) has UI primitives and layout but no feature components yet either.

### Architecture: Share Logic, Not UI

The project's cross-platform strategy is:

```
┌──────────────────────────────────────────┐
│      src/shared/frontend/ (Phase 0)    │
│     Pure TypeScript — no React, no JSX   │
│  (query factories, business logic, types)│
└──────────────┬───────────────────────────┘
               │ imports
      ┌────────┴────────┐
      │                 │
┌─────┴─────┐    ┌─────┴─────┐
│  src/web/  │    │src/mobile/│
│  Next.js   │    │  Expo     │
│  Radix +   │    │  Tamagui  │
│  Tailwind  │    │  + RN     │
└────────────┘    └───────────┘
```

**Rules:**

1. **Shared layer is pure TypeScript** — no React, no hooks, no JSX, no platform APIs (FE-002).
2. **UI components are platform-specific** — web components in `src/web/`, mobile components in `src/mobile/`.
3. **Hooks are platform-specific** — they wrap shared `queryOptions` factories or pure TS utilities.
4. **Business logic is shared** — validators, formatters, transformers, query factories live in `src/shared/frontend/` _(Phase 0 planned; currently query factories are in `src/shared/clients/_/queries/`)\*.

### Pattern: Shared Query Factory + Platform Hook

```typescript
// src/shared/frontend/queries/armies.ts — pure TS (planned path)
export const armyListOptions = (filters: ArmyFilters) =>
    queryOptions({
        queryKey: ['armies', 'list', filters] as const,
        queryFn: () => api.armies.list(filters),
        staleTime: 5 * 60 * 1000,
    });

// src/web/src/hooks/useArmies.ts — web hook
export function useArmies(filters: ArmyFilters) {
    return useQuery(armyListOptions(filters));
}

// src/mobile/src/hooks/useArmies.ts — mobile hook (identical logic, different file)
export function useArmies(filters: ArmyFilters) {
    return useQuery(armyListOptions(filters));
}
```

### Pattern: Platform-Specific Files

When the same feature has fundamentally different implementations on web vs. mobile:

```
storage.ts          → shared interface / types
storage.web.ts      → uses localStorage
storage.native.ts   → uses expo-secure-store
```

Metro (mobile) and webpack (web) resolve the correct file automatically based on the extension. Consumers just import from `'./storage'`.

**Rules for platform splits:**

- Only split UI and platform API calls — **never** split business logic.
- Each platform file must satisfy the same interface.
- Prefer `.native.ts` (iOS + Android) over separate `.ios.ts` / `.android.ts` unless behavior truly differs per OS.

### What Goes Where — Quick Reference

| Code                     | Location                                                                                       | Why                             |
| ------------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------- |
| `queryOptions()` factory | `src/shared/frontend/queries/` _(Phase 0 planned; currently `src/shared/clients/_/queries/`)\* | Pure TS, used by both platforms |
| `useQuery()` hook        | `src/{web\|mobile}/src/hooks/`                                                                 | React hook = platform-specific  |
| Validator function       | `src/shared/frontend/utils/` _(Phase 0 planned)_                                               | Pure TS logic                   |
| Date formatter           | `src/shared/frontend/utils/` _(Phase 0 planned)_                                               | Pure TS logic                   |
| React component          | `src/{web\|mobile}/src/components/`                                                            | UI is platform-specific         |
| TypeScript interface     | `src/shared/types/`                                                                            | Cross-cutting type              |
| Component-scoped type    | `ComponentName/types.ts`                                                                       | Colocated                       |

---

## 8. Server Component Boundaries

> Canonical reference: [BEST_PRACTICES.md §9](./plan/BEST_PRACTICES.md#9-server-components-vs-client-components). This section adds placement heuristics.

### The Key Rule

**Push `'use client'` as deep as possible.** The default is Server Component. Only add the directive to the leaf component that needs interactivity.

### Boundary Placement Decision Tree

```
Does this component need interactivity (state, effects, event handlers, browser APIs)?
├── NO → Server Component (default). Do NOT add 'use client'.
└── YES
    Can you extract the interactive part into a smaller child component?
    ├── YES → Make the CHILD a Client Component. Keep the parent as Server Component.
    └── NO
        Does the component fetch data AND have interactivity?
        ├── YES → Split into:
        │   ├── Server Component parent (fetches data, passes as props)
        │   └── Client Component child (handles interactivity)
        └── NO → This component is a Client Component. Add 'use client'.
```

### Example: Pushing the Boundary Deep

```typescript
// ❌ Bad — entire page is a Client Component because of one interactive element
'use client';
export default function ArmyDetailPage({ params }: { params: { id: string } }) {
    const [isEditing, setIsEditing] = useState(false);
    // ... fetching, rendering, everything is client-side
}

// ✅ Good — page stays Server Component, only the toggle is Client
// app/armies/[id]/page.tsx (Server Component)
export default async function ArmyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const army = await getArmy(id);
    return (
        <div>
            <h1>{army.name}</h1>
            <ArmyStats army={army} />             {/* Server Component */}
            <EditToggle armyId={army.id} />        {/* Client Component — interactive leaf */}
        </div>
    );
}

// components/armies/EditToggle.tsx
'use client';
function EditToggle({ armyId }: { armyId: string }) {
    const [isEditing, setIsEditing] = useState(false);
    return <button onClick={() => setIsEditing(!isEditing)}>{isEditing ? 'Cancel' : 'Edit'}</button>;
}
```

### Server Components and the Orchestrational/Render Split

In Next.js App Router pages, the **page file itself is an orchestrational Server Component**:

```
page.tsx (Server Component — orchestrational)
├── Fetches data via async/await or DAL functions
├── Dehydrates React Query state (if using client-side hydration)
└── Composes:
    ├── Server render components (static content, no interactivity)
    └── Client Components (interactive leaves, wrapped in 'use client')
        └── Which may themselves follow the orchestrational/render split
            using client-side hooks (useQuery, useState, etc.)
```

### What Crosses the Boundary

Props from Server → Client must be serializable:

| ✅ Serializable              | ❌ Not Serializable              |
| ---------------------------- | -------------------------------- |
| Strings, numbers, booleans   | Functions, callbacks             |
| Plain objects, arrays        | Class instances                  |
| `null`, `undefined`          | `Date` objects (use ISO strings) |
| React elements as `children` | Symbols, Maps, Sets              |

### Radix UI and `'use client'` — What You Need to Know

Radix primitives are **heterogeneous** with respect to `'use client'`. Not all Radix components require client-side rendering. Understanding which do and which don't is critical for keeping the client bundle small.

**Radix packages that ship with `'use client'`** (they use hooks, state, or browser APIs internally):

- `@radix-ui/react-dialog` — focus trapping, `useState`, `useEffect`
- `@radix-ui/react-select` — `useLayoutEffect`, pointer tracking
- `@radix-ui/react-tabs` — `useControllableState`, `useRef`
- `@radix-ui/react-tooltip` — `window.setTimeout`, event listeners
- `@radix-ui/react-label` — event handlers (`onClick`, `onMouseDown`)
- `@radix-ui/react-dropdown-menu` — full interactive menu state
- `@radix-ui/react-alert-dialog` — modal state, focus trapping
- `@radix-ui/react-switch` — toggle state, ARIA management
- `@radix-ui/react-checkbox` — controlled/uncontrolled state

**Radix packages that do NOT ship with `'use client'`** (pure utilities, safe in RSC):

- `@radix-ui/react-slot` — pure `forwardRef` + `cloneElement`, no hooks
- `@radix-ui/react-separator` — just a `<div>` with ARIA `role="separator"`
- `@radix-ui/react-visually-hidden` — pure CSS utility
- `@radix-ui/react-arrow` — SVG rendering, no interactivity

**Rule for our UI primitives:** Do NOT add `'use client'` to a wrapper component unless the component itself uses hooks, state, effects, or event handlers. If the wrapper only composes Radix primitives that don't ship `'use client'` (e.g., `Slot`, `Separator`) with HTML + Tailwind, the wrapper is RSC-safe and should remain a Server Component.

**Examples:**

- `Button` uses only `Slot` (RSC-safe) + CVA class variants → **no `'use client'` needed** in wrapper
- `Card`, `Badge`, `Skeleton` use zero Radix imports, pure HTML + Tailwind → **no `'use client'` needed**
- `Dialog` wraps `@radix-ui/react-dialog` (ships `'use client'`) → wrapper inherits client requirement
- `Select` wraps `@radix-ui/react-select` (ships `'use client'`) → wrapper inherits client requirement

## For the full RSC compatibility matrix per shared component, see [SHARED_COMPONENTS.md §I.4](./plan/SHARED_COMPONENTS.md).

## 9. Error Handling & Recovery

> For Next.js error file conventions and shared ErrorBoundary, see [BEST_PRACTICES.md §14](./plan/BEST_PRACTICES.md#14-error-handling).

This section covers **where to place error boundaries** and **recovery UX patterns**.

### Error Boundary Placement

```
App Root
├── global-error.tsx          → Catches errors in root layout (last resort)
├── layout.tsx
│   └── error.tsx             → Catches errors in top-level pages
│       └── [feature]/
│           ├── error.tsx     → Feature-level error boundary (recommended)
│           ├── page.tsx      → List page
│           └── [id]/
│               ├── error.tsx → Detail-level error boundary
│               └── page.tsx  → Detail page
```

**Placement heuristic:** Place `error.tsx` at the **feature boundary** — the route segment that represents a distinct area of the app (armies, matches, campaigns). This catches errors within the feature without bringing down the entire app.

### Granularity Rules

| Error Type                      | Boundary Level                        | Recovery                             |
| ------------------------------- | ------------------------------------- | ------------------------------------ |
| Data fetch failure (list page)  | Feature `error.tsx`                   | "Try again" button (calls `reset()`) |
| Data fetch failure (detail)     | Detail `error.tsx`                    | "Try again" + "Back to list" link    |
| Render error in a single card   | Component-level `<ErrorBoundary>`     | Hide the card, show inline error     |
| Root layout failure             | `global-error.tsx`                    | Full-page error with "Reload" button |
| Mutation failure (e.g., delete) | No boundary — handle in event handler | Toast notification with retry option |
| Form validation failure         | Inline form errors                    | Field-level error messages           |

### Component-Level Error Boundaries

For non-critical sections that shouldn't bring down the whole page:

```typescript
// Wrap individual cards/widgets that might fail independently
<div className="grid grid-cols-3 gap-4">
    {armies.map((army) => (
        <ErrorBoundary key={army.id} fallback={<ArmyCardError armyId={army.id} />}>
            <Suspense fallback={<ArmyCardSkeleton />}>
                <ArmyCard army={army} />
            </Suspense>
        </ErrorBoundary>
    ))}
</div>
```

### Recovery Patterns

**1. Reset + Retry:**

```typescript
// error.tsx — user clicks "Try again" to re-render the errored segment
export default function ArmiesError({ error, reset }: ErrorBoundaryProps) {
    return (
        <div role="alert">
            <p>Failed to load armies.</p>
            <button onClick={reset}>Try again</button>
        </div>
    );
}
```

**2. Graceful Degradation:**

```typescript
// Show partial UI when a non-critical section fails
function ArmyDetailView({ army }: { army: Army }) {
    return (
        <div>
            <h1>{army.name}</h1>
            <ArmyStats army={army} />
            <ErrorBoundary fallback={<p>Related armies unavailable.</p>}>
                <Suspense fallback={<RelatedArmiesSkeleton />}>
                    <RelatedArmies factionId={army.factionId} />
                </Suspense>
            </ErrorBoundary>
        </div>
    );
}
```

**3. Toast for Mutation Errors:**

```typescript
// Mutations don't use error boundaries — handle in the event handler
const deleteArmy = useMutation({
    mutationFn: (armyId: string) => api.armies.delete(armyId),
    onError: (error) => {
        toast.error(`Failed to delete army: ${error.message}`);
    },
});
```

### Error Reporting

All error boundaries should report to Sentry:

```typescript
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, { extra: errorInfo });
}
```

For mutation errors, report in the `onError` callback:

```typescript
onError: (error) => {
    Sentry.captureException(error, { tags: { mutation: 'deleteArmy' } });
    toast.error('Failed to delete army.');
},
```

---

## 10. Testing Strategies

> For RTL query priority and testing rules, see [BEST_PRACTICES.md §19](./plan/BEST_PRACTICES.md#19-testing).
> For state management testing, see [STATE_TESTING.md](./STATE_TESTING.md).

This section covers how the orchestrational/render split affects testing strategy.

### Testing the Orchestrational / Render Split

| Component Type                | What to Test                                                    | How                                                                     |
| ----------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Render component**          | Visual output, conditional rendering, event callback invocation | Pass props directly. No mocking needed. Test via RTL.                   |
| **Orchestrational component** | Data flow, hook composition, error handling                     | Mock hooks (`vi.mock`). Verify render component receives correct props. |
| **Shared business logic**     | Pure function behavior, edge cases                              | Direct function calls. No rendering. No mocking.                        |
| **Custom hooks**              | Hook return values, state transitions                           | `renderHook()` from `@testing-library/react`.                           |

### Render Component Tests (Easiest)

Render components are pure functions of props — test them like any function:

```typescript
describe('ArmyListView', () => {
    it('renders army cards for each army', () => {
        const armies = [makeArmy({ id: '1', name: 'Alpha' }), makeArmy({ id: '2', name: 'Beta' })];
        render(<ArmyListView armies={armies} isLoading={false} filters={{}} onDelete={vi.fn()} />);

        expect(screen.getByText('Alpha')).toBeInTheDocument();
        expect(screen.getByText('Beta')).toBeInTheDocument();
    });

    it('renders skeleton when loading', () => {
        render(<ArmyListView armies={[]} isLoading={true} filters={{}} onDelete={vi.fn()} />);

        expect(screen.getByTestId('army-list-skeleton')).toBeInTheDocument();
    });

    it('renders empty state when no armies', () => {
        render(<ArmyListView armies={[]} isLoading={false} filters={{}} onDelete={vi.fn()} />);

        expect(screen.getByText(/no armies/i)).toBeInTheDocument();
    });

    it('calls onDelete with army id when delete is confirmed', async () => {
        const onDelete = vi.fn();
        const army = makeArmy({ id: 'army-1' });
        render(<ArmyListView armies={[army]} isLoading={false} filters={{}} onDelete={onDelete} />);

        await userEvent.click(screen.getByRole('button', { name: /delete/i }));
        await userEvent.click(screen.getByRole('button', { name: /confirm/i }));

        expect(onDelete).toHaveBeenCalledWith('army-1');
    });
});
```

### Orchestrational Component Tests

> Examples below use planned component names (`ArmyListContainer`, `useArmies`, etc.) to illustrate testing patterns. These components do not exist in code yet — see [FRONTEND_PLAN.md](./FRONTEND_PLAN.md).

```typescript
vi.mock('@web/src/hooks/useArmies.js', () => ({
    useArmies: vi.fn(),
}));

vi.mock('@web/src/hooks/useDeleteArmy.js', () => ({
    useDeleteArmy: vi.fn(() => ({ mutate: vi.fn() })),
}));

describe('ArmyListContainer', () => {
    it('passes fetched armies to ArmyListView', () => {
        const armies = [makeArmy()];
        vi.mocked(useArmies).mockReturnValue({ data: armies, isLoading: false, error: null });

        render(<ArmyListContainer />);

        // Verify render component received the data
        expect(screen.getByText(armies[0].name)).toBeInTheDocument();
    });

    it('passes isLoading state through', () => {
        vi.mocked(useArmies).mockReturnValue({ data: undefined, isLoading: true, error: null });

        render(<ArmyListContainer />);

        expect(screen.getByTestId('army-list-skeleton')).toBeInTheDocument();
    });
});
```

### Custom Hook Tests

Use `renderHook` for hooks that don't produce UI:

```typescript
describe('useArmyFilters', () => {
    it('parses filters from URL search params', () => {
        // Mock useSearchParams to return specific values
        const { result } = renderHook(() => useArmyFilters(), {
            wrapper: createRouterWrapper({ searchParams: { faction: 'space-marines', sort: 'points' } }),
        });

        expect(result.current.filters).toEqual({
            faction: 'space-marines',
            sort: 'points',
            search: '',
        });
    });
});
```

### Shared Business Logic Tests

Pure functions — no React, no rendering:

```typescript
// src/shared/frontend/__tests__/armyFilters.test.ts (planned path)
describe('parseArmyFilters', () => {
    it('returns defaults when no params provided', () => {
        expect(parseArmyFilters({})).toEqual({
            faction: undefined,
            sort: 'name',
            search: '',
        });
    });

    it('parses all filter params', () => {
        expect(parseArmyFilters({ faction: 'orks', sort: 'points', q: 'dakka' })).toEqual({
            faction: 'orks',
            sort: 'points',
            search: 'dakka',
        });
    });
});
```

---

## 11. TypeScript Component APIs

### Props Interface Conventions

> For general TypeScript rules, see `docs/CODING_STANDARDS.md`.

```typescript
// Always use interface for component props
interface ArmyCardProps {
    /** The army to display. */
    readonly army: Army;
    /** Called when the user confirms deletion. */
    readonly onDelete: (id: string) => void;
    /** Optional variant for card display. */
    readonly variant?: 'compact' | 'detailed';
}
```

**Rules:**

- Name: `<ComponentName>Props`
- Use `readonly` on all prop fields (prevents accidental mutation).
- JSDoc on every prop.
- `interface` for props, `type` for unions and utility types.

### Discriminated Union Props

Use discriminated unions when a component's behavior changes significantly based on a variant:

```typescript
// Each variant has its own required props
type NotificationProps =
    | { readonly type: 'success'; readonly message: string }
    | { readonly type: 'error'; readonly message: string; readonly retry: () => void }
    | { readonly type: 'loading'; readonly progress: number };

function Notification(props: NotificationProps) {
    switch (props.type) {
        case 'success':
            return <div className="text-success">{props.message}</div>;
        case 'error':
            return (
                <div className="text-danger">
                    {props.message}
                    <button onClick={props.retry}>Retry</button>
                </div>
            );
        case 'loading':
            return <ProgressBar value={props.progress} />;
    }
}

// TypeScript enforces correct props per variant
<Notification type="error" message="Failed" retry={() => refetch()} />  // ✅
<Notification type="success" message="Done" retry={() => {}} />         // ❌ 'retry' doesn't exist on success
```

**When to use discriminated unions vs. optional props:**

| Use Discriminated Unions         | Use Optional Props                 |
| -------------------------------- | ---------------------------------- |
| Variants require different props | Props are truly optional additions |
| Invalid combinations exist       | All combinations are valid         |
| 3+ distinct behavior modes       | Simple on/off toggle               |

### Generic Components

Use generics for reusable components that operate on different data types:

```typescript
interface SelectProps<T> {
    readonly items: readonly T[];
    readonly value: T | null;
    readonly onChange: (item: T) => void;
    readonly getLabel: (item: T) => string;
    readonly getKey: (item: T) => string;
}

function Select<T>({ items, value, onChange, getLabel, getKey }: SelectProps<T>) {
    return (
        <RadixSelect.Root
            value={value ? getKey(value) : undefined}
            onValueChange={(key) => {
                const item = items.find((i) => getKey(i) === key);
                if (item) onChange(item);
            }}
        >
            {items.map((item) => (
                <RadixSelect.Item key={getKey(item)} value={getKey(item)}>
                    {getLabel(item)}
                </RadixSelect.Item>
            ))}
        </RadixSelect.Root>
    );
}

// Usage — TypeScript infers T from items
<Select
    items={factions}
    value={selectedFaction}
    onChange={setSelectedFaction}
    getLabel={(f) => f.name}
    getKey={(f) => f.id}
/>
```

### Polymorphic `as` Prop

For design system primitives that need to render as different HTML elements:

```typescript
type PolymorphicProps<E extends React.ElementType> = {
    readonly as?: E;
} & Omit<React.ComponentPropsWithoutRef<E>, 'as'>;

function Text<E extends React.ElementType = 'span'>({ as, ...props }: PolymorphicProps<E>) {
    const Component = as ?? 'span';
    return <Component {...props} />;
}

// Usage
<Text>Regular span</Text>
<Text as="h1" className="text-2xl">Heading</Text>
<Text as="label" htmlFor="name">Label</Text>  // TypeScript knows htmlFor is valid on label
```

### Event Handler Typing

```typescript
// For custom events, define the handler type explicitly
type ArmySelectHandler = (armyId: string, army: Army) => void;

interface ArmyPickerProps {
    readonly armies: readonly Army[];
    readonly onSelect: ArmySelectHandler;
}

// For DOM events, use React's built-in types
interface SearchInputProps {
    readonly onSearch: (query: string) => void;
    readonly onChange?: React.ChangeEventHandler<HTMLInputElement>;
    readonly onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
}
```

---

## 12. Performance Patterns

> For Core Web Vitals targets and image optimization, see [BEST_PRACTICES.md §20](./plan/BEST_PRACTICES.md#20-performance).

### Memoization Strategy (React Compiler)

React 19's compiler (React Compiler / Forget) auto-memoizes components and expressions. This changes the optimization approach:

**Do NOT manually memoize unless:**

1. You're passing callbacks to native event handlers in performance-critical lists (FlashList items).
2. A verified re-render issue is confirmed by React DevTools profiler.
3. The compiler cannot optimize (complex closures over mutable refs).

**Do focus on:**

- Keeping components pure — no side effects during render.
- Referential stability of complex objects/arrays passed as props (the compiler handles primitives but may miss complex constructions).
- Extracting expensive computations into shared pure functions.

```typescript
// ❌ Unnecessary with React Compiler
const handleClick = useCallback(() => deleteArmy(id), [deleteArmy, id]);
const sortedArmies = useMemo(() => armies.toSorted(compareFn), [armies, compareFn]);

// ✅ Just write it — the compiler handles memoization
const handleClick = () => deleteArmy(id);
const sortedArmies = armies.toSorted(compareFn);

// ✅ Exception: FlashList renderItem in performance-critical mobile lists
const renderItem = useCallback(({ item }: { item: Army }) => (
    <ArmyCard army={item} />
), []);
```

### Code Splitting

Split heavy components that aren't needed on initial render:

```typescript
// Web — next/dynamic
import dynamic from 'next/dynamic';

const ArmyEditor = dynamic(() => import('./ArmyEditor'), {
    loading: () => <EditorSkeleton />,
});

// Mobile — React.lazy (for non-critical screens)
const CampaignMap = React.lazy(() => import('./CampaignMap'));
```

**What to split:**

- Heavy editors (rich text, army builder with drag-and-drop)
- Chart/visualization components
- Admin-only features
- Modals and drawers (load on trigger)

**What NOT to split:**

- Components visible on initial render (they'll flash a loading state)
- Small components (splitting overhead exceeds bundle savings)
- Shared layout components (Shell, Navigation)

### List Virtualization

> `@shopify/flash-list` and `@tanstack/react-virtual` are not yet installed. The table below defines the target architecture. See [PHASE_0_SHARED_PREREQUISITES.md](./plan/PHASE_0_SHARED_PREREQUISITES.md).

| Platform | Items  | Solution                          |
| -------- | ------ | --------------------------------- |
| Web      | < 50   | Plain `map()` in JSX              |
| Web      | 50–500 | TanStack Virtual                  |
| Web      | 500+   | TanStack Virtual with windowing   |
| Mobile   | < 20   | `ScrollView` + `map()`            |
| Mobile   | 20–200 | `FlatList`                        |
| Mobile   | 200+   | `@shopify/flash-list` (MANDATORY) |

```typescript
// FlashList — always provide estimatedItemSize and keyExtractor
<FlashList
    data={units}
    renderItem={({ item }) => <UnitCard unit={item} />}
    estimatedItemSize={88}
    keyExtractor={(item) => item.id}
    getItemType={(item) => item.type}  // Required for heterogeneous lists
/>
```

### Bundle Size Discipline

1. **Import specifics, not barrels:**

    ```typescript
    // ✅ Specific import
    import { debounce } from 'lodash-es';

    // ❌ Imports entire library
    import _ from 'lodash';
    ```

2. **Never import server-side libs in Client Components.**

3. **Push `'use client'` deep** — every Client Component adds to the client bundle. Do not add `'use client'` to wrapper components that don't need it (see [§8: Radix and `'use client'`](#radix-ui-and-use-client--what-you-need-to-know)).

4. **Analyze regularly:**
    ```bash
    # Web bundle analysis
    ANALYZE=true npm run build -w @armoury/web
    ```

### Image Optimization

> `expo-image` is available in the mobile workspace but not yet used in any component. `next/image` is available in the web workspace. The patterns below are target guidelines.

- Use `next/image` on web, `expo-image` on mobile.
- Set `priority` only on above-the-fold images (LCP candidates).
- Always provide `width`/`height` or use `fill` with `sizes` to prevent CLS.
- Use `blurhash` placeholders on mobile for perceived performance.

```typescript
// Web
import Image from 'next/image';
<Image src={faction.logoUrl} alt={faction.name} width={48} height={48} />

// Mobile
import { Image } from 'expo-image';
<Image
    source={{ uri: faction.logoUrl }}
    style={{ width: 48, height: 48 }}
    contentFit="contain"
    placeholder={{ blurhash: faction.blurhash }}
    transition={200}
    recyclingKey={faction.id}
/>
```

---

## Agent Guidance: Preventing Spaghetti Without an Adapter Layer

> **Context:** An earlier planning iteration introduced a phantom "frontend adapter" layer (`src/shared/frontend/adapters/`, `src/{web|mobile}/src/adapters/`, `src/systems/src/{gameSystem}/adapters/`) intended to prevent behavior variants from spaghettifying components. That layer was never implemented because **the existing architecture already solves this problem through simpler, proven patterns**. This section documents the actual anti-spaghetti strategy so future agents do not re-introduce unnecessary abstraction.

### Why the Adapter Layer Was Removed

The adapter pattern solves a real problem — swapping implementations behind a stable interface — but it requires **multiple concrete implementations to justify its cost**. With a single game system (wh40k10e) and no platform-specific behavior variance in streams or clients, the adapter layer had:

- Zero implementations (only interfaces were planned, never written)
- Zero consumers (hooks instantiated streams/clients directly)
- Pure overhead (indirection without polymorphism)

See [SHARED_COMPONENTS.md §D](./plan/SHARED_COMPONENTS.md) for the original removal rationale.

### The Actual Anti-Spaghetti Strategy

Component complexity is managed through **four complementary patterns** already documented in this codebase. Agents must use these instead of introducing new abstraction layers:

**1. Orchestrational / Render Split (Mandatory — [BEST_PRACTICES.md §7](./plan/BEST_PRACTICES.md#7-orchestrational--render-component-pattern))**

Every component that touches data AND renders UI must be split:

- **Orchestrational component** — owns data fetching, state, side effects. Zero visual markup.
- **Render component** — pure props-in, JSX-out. No hooks that fetch or mutate.

This is the single most effective anti-spaghetti pattern. It prevents the most common failure mode: a component that grows to 500+ lines because it mixes API calls, state transformations, and conditional rendering.

**2. Mode Props Instead of Adapter Injection**

When a component has behavior variants (e.g., the Unit Detail Drawer in reference/builder/match modes), pass a `mode` prop or a configuration object — not an injected adapter class.

```typescript
// ✅ Mode prop — simple, explicit, type-safe
<UnitDetailDrawer mode="reference" unit={unit} />
<UnitDetailDrawer mode="match" unit={unit} onHpChange={handleHp} />

// ❌ Adapter injection — over-engineered for a single game system
<UnitDetailDrawer adapter={new ReferenceAdapter()} unit={unit} />
```

The mode prop approach is sufficient until there are genuinely multiple game system implementations that need runtime dispatch. At that point (and not before), introduce a plugin interface.

**3. Custom Hooks for Logic Isolation**

Extract complex data logic into custom hooks. The hook encapsulates the wiring; the component stays thin. **However, hooks themselves can become monolithic.** For guidance on structuring the business logic inside hooks and utilities — extraction signals, pattern selection (pure function → strategy → state machine → decision engine), and testability rules — see [FRONTEND_PLAN.md §4 "Business Logic Architecture"](./FRONTEND_PLAN.md#4-business-logic-architecture).

```typescript
// Hook owns all complexity
function useMatchSync(matchId: string) {
  const stream = useContext(MatchStreamContext);
  const queryClient = useQueryClient();
  // ... bridge logic, error handling, cleanup
  return { match, isLive, error };
}

// Component is trivially simple
function MatchScorecard({ matchId }: Props) {
  const { match } = useMatchSync(matchId);
  return <ScoreDisplay score={match.score} />;
}
```

**4. Context DI for Infrastructure Singletons**

`DataContext` and `GameSystemContext` inject infrastructure dependencies (database adapter, active plugin) without prop-drilling. This is the only place where the word "adapter" is correct — the data layer genuinely has multiple implementations (SQLite, PGlite, Aurora DSQL).

### When to Introduce a New Abstraction Layer

Only introduce a new shared abstraction (adapter, strategy, plugin interface) when **all three** conditions are met:

1. **Two or more concrete implementations exist today** (not "might exist someday")
2. **Consumers need to switch between implementations at runtime** (not just at build time)
3. **The switching logic would otherwise be duplicated** across multiple components/hooks

If any condition is unmet, use the simpler patterns above. Premature abstraction is more expensive than the duplication it prevents.

---

**End of Component Architecture Guide**
