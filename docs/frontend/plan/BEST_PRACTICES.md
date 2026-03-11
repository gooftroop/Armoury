# Frontend Best Practices

**Purpose:** Consolidate all frontend coding patterns, conventions, and anti-patterns for the Armoury web and mobile applications.

**Scope:** `@armoury/web` (Next.js 15), `@armoury/mobile` (Expo/React Native), and `src/shared/frontend/` (pure TypeScript shared modules).

**Related Documents:**

- [`AGENTS.md`](../../../AGENTS.md) (agent behavioral instructions)
- [`docs/frontend/REQUIREMENTS.md`](../REQUIREMENTS.md) (frontend requirements)
- [`docs/CODING_STANDARDS.md`](../../CODING_STANDARDS.md) (general coding standards)
- [`docs/backend/BEST_PRACTICES.md`](../../backend/BEST_PRACTICES.md) (backend best practices)
- [`docs/frontend/plan/STATE_MANAGEMENT.md`](./STATE_MANAGEMENT.md) — Canonical state management architecture (↗ §4)
- [`docs/frontend/REACT_QUERY.md`](../REACT_QUERY.md) — Server state patterns via React Query (↗ §10, §11)
- [`docs/frontend/RXJS_STATE.md`](../RXJS_STATE.md) — Global/reactive state via RxJS (↗ §12)
- [`docs/frontend/DERIVED_STATE.md`](../DERIVED_STATE.md) — Derived state patterns
- [`docs/frontend/STATE_TESTING.md`](../STATE_TESTING.md) — State management testing strategy
- [`docs/frontend/COMPONENT_ARCHITECTURE.md`](../COMPONENT_ARCHITECTURE.md) — Component composition patterns, hook design, colocation, cross-platform sharing, error boundaries, testing strategies

---

## Table of Contents

1. [General Coding Standards](#1-general-coding-standards)
2. [Frontend Architecture](#2-frontend-architecture)
3. [Cross-Platform Code Sharing](#3-cross-platform-code-sharing)
4. [State Management](#4-state-management) ↗
5. [React Component Design](#5-react-component-design)
6. [React Hooks](#6-react-hooks)
7. [Orchestrational / Render Component Pattern](#7-orchestrational--render-component-pattern)
8. [Next.js 15 App Router](#8-nextjs-15-app-router)
9. [Server Components vs Client Components](#9-server-components-vs-client-components)
10. [Data Fetching & Caching](#10-data-fetching--caching) ↗
11. [React Query (TanStack Query v5)](#11-react-query-tanstack-query-v5) ↗
12. [RxJS Guidelines](#12-rxjs-guidelines) ↗
13. [Routing & Navigation](#13-routing--navigation)
14. [Error Handling](#14-error-handling)
15. [Metadata & SEO](#15-metadata--seo)
16. [Fonts & Assets](#16-fonts--assets)
17. [Internationalization (i18n)](#17-internationalization-i18n)
18. [React Native & Expo](#18-react-native--expo)
19. [Testing](#19-testing)
20. [Performance](#20-performance)
21. [Anti-Patterns](#21-anti-patterns)
22. [Component Architecture ↗](../COMPONENT_ARCHITECTURE.md) — Composition patterns, hook design, colocation, cross-platform, error handling, testing, TypeScript APIs, performance

---

## 1. General Coding Standards

These apply to all frontend code. See `docs/CODING_STANDARDS.md` for the full guide.

### Braces and Formatting

Always use braces for control structures, even for single-line statements.

```typescript
// Good
if (condition) {
    doSomething();
}

// Bad
if (condition) doSomething();
```

Add a blank line after block statements and before return statements.

### Constants and Enums

Use constants and enums instead of hardcoded string or number literals.

```typescript
// Good
import { Platform } from '@shared/types/enums.js';
if (adapter.platform === Platform.SQLite) { ... }

// Bad
if (adapter.platform === 'sqlite') { ... }
```

### Documentation

Every exported function, class, interface, type, and field must have JSDoc documentation. Use `@param`, `@returns`, and `@throws` tags for non-trivial functions.

### Imports

Always use aliased imports — never relative imports. Order: external packages first, then aliased internal imports. Always use `.js` extensions in aliased imports.

```typescript
// Good
import { describe, it, expect } from 'vitest';
import type { Unit } from '@shared/types/entities.js';

// Bad — relative imports
import type { Unit } from '../../types/entities';
```

### Pure Functions

Prefer pure functions that avoid side effects. When side effects are necessary (I/O, subscriptions, DOM access), isolate them and document clearly.

---

## 2. Frontend Architecture

### Layered Separation

Frontend code must maintain strict separation between four concerns:

| Layer              | Responsibility                                         | Examples                                    |
| ------------------ | ------------------------------------------------------ | ------------------------------------------- |
| **UI**             | Visual rendering, layout, styling, animations          | Render components, design system primitives |
| **Business Logic** | Domain rules, data transformations, computations       | Pure functions, validators, formatters      |
| **Global State**   | Client-side application state shared across components | RxJS stores, user preferences, UI mode      |
| **Remote State**   | Server/async data — fetching, caching, synchronization | @tanstack/react-query queries and mutations |

These layers must not bleed into each other. A render component should never fetch data. A business logic function should never import React. Global state should never duplicate remote state.

> 📖 **Structuring business logic:** For extraction signals, pattern selection (pure function → strategy → state machine → decision engine), and concrete examples, see [FRONTEND_PLAN.md §4 "Business Logic Architecture"](../FRONTEND_PLAN.md#4-business-logic-architecture).

### Workspace Boundaries

| Location               | Contains                                                                                                          |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `src/shared/frontend/` | Pure TypeScript modules only: business logic, query/mutation factories, types, utilities                          |
| `src/web/`             | Next.js pages/routes, React components, SSR/RSC logic, web-specific hooks, web-only integrations                  |
| `src/mobile/`          | Expo screens/navigation, React Native components, native modules, mobile-specific hooks, mobile-only integrations |

**Critical Rule:** `src/shared/frontend/` must contain **only pure TypeScript** — no React components, no React Native components, no React hooks, no JSX. React components live in `src/web/`, React Native components live in `src/mobile/`.

---

## 3. Cross-Platform Code Sharing

Share pure TypeScript frontend logic (business logic, query/mutation factories, types, utilities) across web and mobile via `src/shared/frontend/` as long as it does not introduce anti-patterns or tech debt.

### What Belongs in `src/shared/frontend/`

- Query key factories and `queryOptions()` definitions
- Mutation factories
- Business logic functions (validators, formatters, transformers)
- TypeScript types and interfaces
- Constants and enums
- Utility functions

### What Does NOT Belong in `src/shared/frontend/`

- React components (`*.tsx` with JSX)
- React hooks (`use*` functions importing from `react`)
- React Native components
- Platform-specific code (browser APIs, native modules)
- UI primitives or design system components

### Platform-Specific File Extensions

Use platform-specific file extensions for code that differs by platform:

| Extension      | Resolved On             |
| -------------- | ----------------------- |
| `.ts` / `.tsx` | All platforms (default) |
| `.native.ts`   | iOS + Android only      |
| `.web.ts`      | Web only                |
| `.ios.ts`      | iOS only                |
| `.android.ts`  | Android only            |

```typescript
// storage.ts        → shared interface
// storage.native.ts → uses expo-secure-store
// storage.web.ts    → uses localStorage

// Consumers import from 'storage' — Metro/webpack resolves the right file
import { getToken } from './storage';
```

For conditional logic within a single file, use `Platform.select` or `Platform.OS`:

```typescript
import { Platform } from 'react-native';

const hitSlop = Platform.select({
    ios: { top: 10, bottom: 10 },
    android: { top: 12, bottom: 12 },
    default: undefined,
});
```

---

## 4. State Management

Covers the 5-tier state management hierarchy (local → URL → React Query → RxJS → Context), core rules (derive don't store, URL is state, lift appropriately, Query is your remote state, RxJS over Context), and `useState` decision criteria.

> 📖 **Canonical reference:** [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) — Full architecture, decision trees, and code examples for all 5 tiers (§1–§5).

---

## 5. React Component Design

### General Rules

- Functional components only. No class components except for error boundaries.
- Props: Use `interface` for public component APIs, `type` for unions/intersections/utility types. Name props interfaces `<ComponentName>Props`.
- Prefer composition over prop drilling. If a component accepts more than ~5 props, consider splitting it or using composition (children, render props, compound component pattern).
- Generic components are encouraged for reusable UI primitives (e.g., `List<T>`, `Select<T>`).

```typescript
// Discriminated union props for component variants
interface ButtonProps {
    variant: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    children: React.ReactNode;
    onClick: () => void;
}
```

### Component File Organization

- **Web components**: `src/web/` — Next.js pages, layouts, React components
- **Mobile components**: `src/mobile/` — Expo screens, React Native components
- **No components in shared**: `src/shared/frontend/` is pure TypeScript only

### Naming

- Component files: PascalCase matching the component name (`ArmyBuilder.tsx`, `UnitCard.tsx`)
- Props interfaces: `<ComponentName>Props`
- Event handler props: `on<Event>` (e.g., `onClick`, `onDelete`, `onFilterChange`)
- Boolean props: use `is` / `has` / `should` prefixes (e.g., `isLoading`, `hasError`)

---

## 6. React Hooks

### useEffect

- Only for synchronizing with external systems (subscriptions, timers, DOM mutations, analytics). If something can be computed during render, do not use `useEffect`.
- Always return a cleanup function for subscriptions, timers, and event listeners.
- Dependency arrays use reference equality (`===`). Objects and functions in deps cause re-runs — extract them or memoize.

```typescript
// Good — synchronizing with external system
useEffect(() => {
    const subscription = eventBus$.subscribe(handler);

    return () => subscription.unsubscribe();
}, [eventBus$]);

// Bad — derived state in effect
useEffect(() => {
    setFilteredItems(items.filter((i) => i.active));
}, [items]);
// Fix: compute inline
const filteredItems = items.filter((i) => i.active);
```

### useCallback / useMemo

- Do NOT use by default. These are optimizations, not best practices.
- Use `useCallback` when passing callbacks to memoized child components (`React.memo`) or when the callback is a `useEffect` dependency.
- Use `useMemo` when a computation is genuinely expensive (measured, not assumed) or when an object/array reference must remain stable.

### Custom Hooks

- Extract a custom hook when: (a) logic is reused across 2+ components, (b) a component's hook logic exceeds ~15 lines, or (c) logic involves a combination of multiple hooks that form a cohesive unit.
- Name with `use` prefix. Keep hooks focused — one responsibility per hook.
- Custom hooks live in the platform workspace that uses them (`src/web/` or `src/mobile/`), not in `src/shared/frontend/`.

---

## 7. Orchestrational / Render Component Pattern

Every feature component splits into two:

| Type                            | Role                                                                                 | Rules                                                                                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Orchestrational** (container) | Owns data fetching, state subscriptions, event handlers, business logic coordination | May use hooks, call stores, invoke mutations. Passes everything to render components via props. Contains **zero** visual markup beyond composing render components. |
| **Render** (presentational)     | Pure visual output from props                                                        | No hooks for data/state (`useState` for local UI state like open/closed is fine). No direct store/query access. Fully testable by passing props.                    |

```typescript
// Orchestrational — lives in src/web/ (web-specific)
function ArmyListContainer() {
    const { data: armies, isLoading } = useArmies();
    const deleteArmy = useDeleteArmy();

    return <ArmyListView armies={armies} isLoading={isLoading} onDelete={deleteArmy} />;
}

// Render — lives in src/web/ (web-specific UI)
function ArmyListView({ armies, isLoading, onDelete }: ArmyListViewProps) {
    if (isLoading) {
        return <LoadingSkeleton />;
    }

    return <ul>{armies.map(a => <ArmyCard key={a.id} army={a} onDelete={onDelete} />)}</ul>;
}
```

**Why this split matters:**

- Render components are platform-specific (web uses `<ul>`, mobile uses `<FlatList>`) — both the orchestrational and render components live in their respective platform workspaces
- Business logic (pure TS in `src/shared/frontend/`) is testable without rendering
- UI is testable without mocking data layers
- Query/mutation factories in `src/shared/frontend/` are consumed by orchestrational components in both platforms

---

## 8. Next.js 15 App Router

> 📖 **Canonical reference:** [NEXTJS_RENDERING_STRATEGY.md](../NEXTJS_RENDERING_STRATEGY.md) — Route-level rendering decisions (SSR vs SSG vs ISR vs PPR), streaming patterns, and performance tradeoffs for each page type.

### File Conventions

| File               | Purpose                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `page.tsx`         | Route UI — renders the page content                                |
| `layout.tsx`       | Shared layout wrapping child routes (persistent across navigation) |
| `loading.tsx`      | Instant loading UI (React Suspense boundary)                       |
| `error.tsx`        | Error boundary for the route segment (must be a Client Component)  |
| `not-found.tsx`    | UI for `notFound()` calls or unmatched routes                      |
| `template.tsx`     | Like layout but re-mounts on navigation (rare)                     |
| `default.tsx`      | Fallback for parallel routes                                       |
| `global-error.tsx` | Root-level error boundary (catches errors in root layout)          |

### Route Organization

```
src/web/app/
├── layout.tsx              → Root layout (providers, fonts, global styles)
├── page.tsx                → Home page
├── not-found.tsx           → Global 404
├── global-error.tsx        → Root error boundary
├── (auth)/
│   ├── login/page.tsx
│   └── callback/page.tsx
├── armies/
│   ├── page.tsx            → Army list
│   ├── loading.tsx         → List skeleton
│   ├── error.tsx           → List error boundary
│   └── [id]/
│       ├── page.tsx        → Army detail
│       └── edit/page.tsx   → Army editor
├── campaigns/
│   ├── page.tsx
│   └── [id]/page.tsx
└── settings/
    └── page.tsx
```

### Route Groups

Use route groups `(groupName)` to organize routes without affecting the URL structure:

```
app/
├── (marketing)/        → /about, /pricing (no /marketing in URL)
│   ├── about/page.tsx
│   └── pricing/page.tsx
├── (app)/              → /armies, /campaigns
│   ├── armies/page.tsx
│   └── campaigns/page.tsx
```

Route groups can also have their own layouts, enabling different layouts for different sections of the app.

### Middleware

Use `middleware.ts` at the project root for cross-cutting concerns that run before every request:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Handles auth redirects and locale detection. */
export function middleware(request: NextRequest) {
    // Auth check
    const token = request.cookies.get('auth-token');

    if (!token && request.nextUrl.pathname.startsWith('/armies')) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### Streaming & Suspense

Use `loading.tsx` or manual `<Suspense>` boundaries to stream content progressively:

```typescript
// app/armies/page.tsx (Server Component)
import { Suspense } from 'react';

export default function ArmiesPage() {
    return (
        <div>
            <h1>Armies</h1>
            <Suspense fallback={<ArmyListSkeleton />}>
                <ArmyList />
            </Suspense>
        </div>
    );
}
```

### Parallel Data Fetching

Fetch independent data in parallel using `Promise.all` in Server Components:

```typescript
// Good — parallel fetches
export default async function DashboardPage() {
    const [armies, campaigns, friends] = await Promise.all([
        getArmies(),
        getCampaigns(),
        getFriends(),
    ]);

    return <DashboardView armies={armies} campaigns={campaigns} friends={friends} />;
}

// Bad — sequential (waterfall)
export default async function DashboardPage() {
    const armies = await getArmies();
    const campaigns = await getCampaigns();  // waits for armies
    const friends = await getFriends();       // waits for campaigns
    // ...
}
```

### Partial Prerendering (PPR)

PPR combines static and dynamic rendering in a single route. The static shell is served instantly from the CDN, while dynamic parts stream in via Suspense boundaries.

```typescript
// next.config.ts
const nextConfig = {
    experimental: {
        ppr: true, // Enable Partial Prerendering
    },
};
```

Static parts of the page render at build time; dynamic parts (wrapped in `<Suspense>`) render on request. This gives the speed of SSG with the flexibility of SSR.

---

## 9. Server Components vs Client Components

> 📖 **See also:** [NEXTJS_RENDERING_STRATEGY.md](../NEXTJS_RENDERING_STRATEGY.md) — How rendering strategy (SSR/SSG/ISR/PPR) interacts with the Server/Client Component boundary for each route.

### Decision Matrix

| Use Server Component (default)             | Use Client Component (`'use client'`)   |
| ------------------------------------------ | --------------------------------------- |
| Data fetching with secrets/tokens          | `useState`, `useEffect`, or any hooks   |
| Static rendering, no JS shipped to client  | Event handlers (`onClick`, `onChange`)  |
| Accessing backend resources directly       | Browser APIs (`localStorage`, `window`) |
| Rendering Markdown, heavy transforms       | Animations, real-time updates           |
| Metadata exports (`export const metadata`) | Form inputs, controlled components      |
| Reading cookies, headers for auth          | Third-party client-side libraries       |

### Boundary Rules

- Components in the `app/` directory are Server Components by default. Add `'use client'` only when interactivity is needed.
- Never import a Server Component into a Client Component. Pass Server Components as `children` to Client Components instead.
- Props passed from Server → Client must be serializable (no functions, Dates, or class instances).
- `async` components are only valid as Server Components.
- Push `'use client'` boundaries as deep as possible — wrap only the interactive leaf, not the whole tree.

```typescript
// Good — Server Component passes children to Client Component
// app/armies/page.tsx (Server Component)
export default async function ArmiesPage() {
    const armies = await getArmies();

    return (
        <InteractiveShell>              {/* Client Component */}
            <ArmyList armies={armies} /> {/* Server Component passed as children */}
        </InteractiveShell>
    );
}

// Bad — importing Server Component inside Client Component
'use client';
import { ArmyList } from './ArmyList'; // ERROR if ArmyList is a Server Component
```

### Composing Server and Client Components

```typescript
// layout.tsx (Server Component)
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <Providers>    {/* Client Component wrapping server children */}
                    {children}  {/* Server Components rendered as children */}
                </Providers>
            </body>
        </html>
    );
}

// providers.tsx (Client Component)
'use client';
import { QueryClientProvider } from '@tanstack/react-query';

/** Client-side providers wrapper. */
export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
```

---

## 10. Data Fetching & Caching

> 📖 **See also:** [NEXTJS_RENDERING_STRATEGY.md](../NEXTJS_RENDERING_STRATEGY.md) — Rendering strategy per route affects which caching approach applies (static cache vs request-time fetch vs streaming).

Covers server-side data fetching in Server Components (`async`/`await`), React Query hydration for SSR (`dehydrate` / `HydrationBoundary`), `staleTime` configuration to avoid double-fetching, and Next.js `fetch` caching options (`force-cache`, `revalidate`, `no-store`, `cache()`).

> 📖 **Canonical reference:** [REACT_QUERY.md](../REACT_QUERY.md) — SSR/RSC integration patterns (§4), cache configuration tiers (§5), and prefetch strategies.

---

## 11. React Query (TanStack Query v5)

Covers query key factories (`queryOptions` helper, hierarchical key structure), custom hooks (platform-specific wrappers in `src/web/` or `src/mobile/`), mutations and cache invalidation (simple invalidation and optimistic update patterns), stale/cache time configuration by data type, and common anti-patterns.

> 📖 **Canonical reference:** [REACT_QUERY.md](../REACT_QUERY.md) — Complete patterns for query keys (§1), mutations (§2), optimistic updates (§3), SSR/RSC (§4), cache configuration (§5), and mobile-specific concerns (§6).

---

## 12. RxJS Guidelines

Covers when to use RxJS vs simpler alternatives, higher-order mapping operators (`switchMap` for reads, `concatMap` for writes), Subject types (`BehaviorSubject` for state, `Subject` for events), memory management (`takeUntil` last in pipe, `useEffect` cleanup), error handling (`catchError` inside inner observables), and the `@armoury/streams` reactive WebSocket facade pattern.

> 📖 **Canonical reference:** [RXJS_STATE.md](../RXJS_STATE.md) — Complete RxJS patterns for BehaviorSubject state stores (§1), `useSyncExternalStore` bridge (§2), higher-order operators (§3), error handling (§4), testing (§5), performance (§6), and the `@armoury/streams` package (§7).

---

## 13. Routing & Navigation

### Web (Next.js App Router)

- File-based routing under `src/web/app/`
- Dynamic routes: `[id]` folder convention
- Catch-all routes: `[...slug]`
- Route groups: `(groupName)` for layout organization without URL impact
- Parallel routes: `@slot` convention for simultaneous rendering
- Intercepting routes: `(.)path` for modal overlays

### Mobile (Expo Router)

Structure routes under `src/mobile/app/`:

```
src/mobile/app/
├── _layout.tsx          → Root layout (Stack navigator, providers)
├── (tabs)/
│   ├── _layout.tsx      → Tab navigator
│   ├── index.tsx        → Home tab
│   ├── armies.tsx       → Armies tab
│   └── settings.tsx     → Settings tab
├── army/[id].tsx        → Dynamic route (army detail)
└── modal.tsx            → Modal screen
```

- Use typed routes: `useLocalSearchParams<{ id: string }>()` for type-safe route parameters.
- Place navigation logic in orchestrational components; render components receive navigation callbacks as props.

---

## 14. Error Handling

### Web Error Boundaries (Next.js)

Every route segment should have error handling via `error.tsx`:

```typescript
// app/armies/error.tsx (MUST be a Client Component)
'use client';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

/** Error boundary for the armies route segment. */
export default function ArmiesError({ error, reset }: ErrorProps) {
    useEffect(() => {
        // Log to Sentry or error tracking service
        console.error('Armies error:', error);
    }, [error]);

    return (
        <div>
            <h2>Something went wrong</h2>
            <button onClick={reset}>Try again</button>
        </div>
    );
}
```

**Key rules:**

- `error.tsx` must be a Client Component (uses hooks for error logging and the `reset` function)
- Use `global-error.tsx` at the app root to catch errors in the root layout
- `not-found.tsx` handles 404 states (triggered by `notFound()` or unmatched routes)
- Error boundaries catch errors during rendering and in Server Component data fetching
- For async errors in event handlers (not caught by boundaries), use try/catch and surface errors via state or toast notifications

### Shared Error Boundary Component

Use a single shared `ErrorBoundary` class component — don't rewrite per feature:

```typescript
// Error boundaries must be class components (React limitation)
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log to Sentry
        Sentry.captureException(error, { extra: errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }

        return this.props.children;
    }
}
```

### Mobile Error Handling

- Wrap the app root with Sentry: `Sentry.wrap(App)`
- Expo Router supports `+error.tsx` files for route-level error handling
- For native crashes (OOM, native module failures), Sentry captures these automatically — ensure source maps are uploaded via EAS Build

---

## 15. Metadata & SEO

### Static Metadata

Export a `metadata` object from Server Component pages and layouts:

```typescript
// app/armies/page.tsx (Server Component)
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'My Armies | Armoury',
    description: 'Manage your tabletop game army rosters.',
    openGraph: {
        title: 'My Armies | Armoury',
        description: 'Manage your tabletop game army rosters.',
        type: 'website',
    },
};
```

### Dynamic Metadata

Use `generateMetadata` for pages with dynamic content:

```typescript
// app/armies/[id]/page.tsx
import type { Metadata } from 'next';

interface Params {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { id } = await params;
    const army = await getArmy(id);

    return {
        title: `${army.name} | Armoury`,
        description: `${army.faction} army roster with ${army.units.length} units.`,
    };
}
```

### Metadata Rules

- `metadata` exports are only valid in Server Components (pages and layouts)
- Child metadata merges with and overrides parent metadata
- Use `title.template` in the root layout to create consistent page titles: `title: { template: '%s | Armoury', default: 'Armoury' }`
- Always include Open Graph metadata for social sharing

---

## 16. Fonts & Assets

### Font Loading

Use `next/font` for optimized font loading with zero layout shift:

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',  // Prevents invisible text during font load
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={inter.className}>
            <body>{children}</body>
        </html>
    );
}
```

**Rules:**

- Always use `display: 'swap'` to prevent Flash of Invisible Text (FOIT)
- Define fonts in the root layout — they apply globally
- Use `next/font/local` for self-hosted font files
- Fonts are automatically self-hosted by Next.js — no external requests at runtime

### Image Optimization

Use `next/image` for automatic image optimization:

```typescript
import Image from 'next/image';

<Image
    src="/faction-logo.png"
    alt="Space Marines faction logo"
    width={200}
    height={200}
    priority  // Use for above-the-fold images (disables lazy loading)
/>
```

**Rules:**

- Always provide `alt` text for accessibility
- Use `priority` for Largest Contentful Paint (LCP) images (hero images, above-the-fold content)
- Images are lazy-loaded by default — `priority` disables this for critical images
- Use `fill` prop with `sizes` for responsive images in dynamic containers
- All static images live in `public/` at the repo root

---

## 17. Internationalization (i18n)

### Recommended Library: `next-intl`

`next-intl` provides full i18n support for Next.js 15 App Router with SSG compatibility.

### Setup

**1. Install and configure the plugin:**

```typescript
// next.config.ts
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
    // ... other config
};

export default withNextIntl(nextConfig);
```

**2. Define routing configuration:**

```typescript
// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    locales: ['en', 'es', 'fr', 'de'],
    defaultLocale: 'en',
});
```

**3. Create request configuration:**

```typescript
// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
    let locale = await requestLocale;

    if (!locale || !routing.locales.includes(locale as any)) {
        locale = routing.defaultLocale;
    }

    return {
        locale,
        messages: (await import(`../../messages/${locale}.json`)).default,
    };
});
```

**4. Create message files:**

```
messages/
├── en.json
├── es.json
├── fr.json
└── de.json
```

```json
// messages/en.json
{
    "ArmyList": {
        "title": "My Armies",
        "empty": "No armies yet. Create your first roster!",
        "delete": "Delete",
        "confirmDelete": "Are you sure you want to delete {name}?"
    }
}
```

### Route Structure for i18n

Use a `[locale]` dynamic segment to prefix all routes:

```
app/
└── [locale]/
    ├── layout.tsx          → Locale-aware root layout
    ├── page.tsx            → Home page
    ├── armies/
    │   └── page.tsx
    └── campaigns/
        └── page.tsx
```

### SSG Compatibility

To maintain static site generation with i18n, use `generateStaticParams` and `setRequestLocale`:

```typescript
// app/[locale]/layout.tsx
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';

/** Generate static params for all supported locales. */
export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);  // Enable static rendering for this locale

    return (
        <html lang={locale}>
            <body>{children}</body>
        </html>
    );
}
```

**Every page and layout using next-intl must call `setRequestLocale(locale)` to enable static rendering.** Without this call, pages fall back to dynamic rendering.

```typescript
// app/[locale]/armies/page.tsx
import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';

export default function ArmiesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);

    const t = useTranslations('ArmyList');

    return <h1>{t('title')}</h1>;
}
```

### Middleware for Locale Detection

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

export default createMiddleware(routing);

export const config = {
    matcher: ['/((?!api|_next|.*\\..*).*)'],
};
```

The middleware handles:

- Detecting the user's preferred locale from `Accept-Language` headers
- Redirecting `/` to `/{defaultLocale}`
- Setting locale cookies for subsequent requests

### i18n Rules

- All user-facing strings must be externalized to message JSON files — no hardcoded text in components
- Use ICU message format for plurals, dates, and interpolation
- Message keys should be namespaced by feature/component (e.g., `ArmyList.title`, `CampaignDetail.status`)
- Server Components use `useTranslations` from `next-intl` (works in both Server and Client Components)
- Always call `setRequestLocale(locale)` in every page and layout to preserve SSG

---

## 18. React Native & Expo

### List Performance

Use `@shopify/flash-list` instead of `FlatList` for lists with 50+ items. FlashList recycles views like native list components and eliminates blank cells.

```typescript
import { FlashList } from '@shopify/flash-list';

<FlashList
    data={armies}
    renderItem={({ item }) => <ArmyCard army={item} />}
    estimatedItemSize={80}  // REQUIRED — estimate average item height in px
    keyExtractor={(item) => item.id}
/>
```

**Performance rules:**

- Always provide `estimatedItemSize` — FlashList needs this for recycling
- Never use inline functions for `renderItem` in hot paths — extract to a stable component or use `useCallback`
- Use `getItemType` if the list has multiple item types (headers, items, footers) to improve recycling
- Avoid heavy computation in `renderItem` — defer with `InteractionManager.runAfterInteractions()`

### Offline & Network

Configure React Query's `onlineManager` for offline awareness:

```typescript
import { AppState, Platform } from 'react-native';
import { focusManager, onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

/** Refetch on app foreground (mobile only). */
if (Platform.OS !== 'web') {
    focusManager.setEventListener((handleFocus) => {
        const subscription = AppState.addEventListener('change', (state) => {
            handleFocus(state === 'active');
        });

        return () => subscription.remove();
    });
}

/** Track network state for offline support. */
onlineManager.setEventListener((setOnline) => {
    return NetInfo.addEventListener((state) => {
        setOnline(!!state.isConnected);
    });
});
```

- Use `@react-native-community/netinfo` to detect connectivity changes
- For offline-first features, consider `@tanstack/query-async-storage-persister` to persist query cache to device storage
- Queue mutations made offline and replay when connectivity returns (via `useMutation` + `onlineManager`)

### Animations

Use `react-native-reanimated` (v3+) for performant animations. Animations run on the UI thread via worklets — they don't block the JS thread.

- Prefer `useAnimatedStyle` and shared values (`useSharedValue`) over `Animated` from React Native core
- Use `react-native-gesture-handler` for touch-driven animations (swipe, pinch, drag)
- For layout animations (items entering/leaving lists), use Reanimated's `Layout` animations or FlashList's built-in animation support

### React Native Anti-Patterns

| Never Do This                                | Do This Instead                                            |
| -------------------------------------------- | ---------------------------------------------------------- |
| Use `FlatList` for 50+ items                 | Use `@shopify/flash-list`                                  |
| Animate with `Animated` from RN core         | Use `react-native-reanimated` (UI thread)                  |
| Block JS thread with heavy computation       | Use `InteractionManager.runAfterInteractions()`            |
| Import platform-specific APIs in shared code | Use `.native.ts` / `.web.ts` extensions                    |
| Store large blobs in AsyncStorage            | Use filesystem (`expo-file-system`)                        |
| Hardcode dimensions                          | Use `useWindowDimensions`, flex, or responsive breakpoints |

---

## 19. Testing

### React Testing Library (RTL)

- Test behavior, not implementation. Never test internal state or hook return values directly.
- Use `userEvent` over `fireEvent` — it simulates real user interactions (typing, clicking) more accurately.
- Render component tests: test render components via props. Orchestrational component tests: mock the hooks/stores.
- Test accessibility: every interactive element should be findable by role, label, or text — not by test ID.

### Query Priority

Prefer queries in this order (most accessible → least):

1. `getByRole` — accessible roles (`button`, `heading`, `textbox`)
2. `getByLabelText` — form elements with labels
3. `getByPlaceholderText` — form inputs
4. `getByText` — visible text content
5. `getByDisplayValue` — form element current values
6. `getByAltText` — images
7. `getByTitle` — title attributes
8. `getByTestId` — **last resort only**

### Testing Patterns

```typescript
// Good — testing behavior via accessible queries
test('deletes army when confirm button is clicked', async () => {
    const onDelete = vi.fn();
    render(<ArmyCard army={mockArmy} onDelete={onDelete} />);

    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }));

    expect(onDelete).toHaveBeenCalledWith(mockArmy.id);
});

// Bad — testing implementation details
test('sets isDeleting state to true', () => {
    const { result } = renderHook(() => useDeleteState());
    act(() => result.current.setDeleting(true));
    expect(result.current.isDeleting).toBe(true);
});
```

### Testing Rules

- Shared business logic tests: `src/shared/frontend/__tests__/` — test pure TypeScript functions directly
- Web component tests: `src/web/__tests__/` — test React components with RTL
- Mobile component tests: `src/mobile/__tests__/` — test React Native components with RNTL
- Mock React Query with `@tanstack/react-query` test utilities (`QueryClientProvider` wrapper)
- Use `vi.mock()` for module mocking, `vi.fn()` for function mocking (Vitest)

---

## 20. Performance

### Core Web Vitals

| Metric                              | Target  | Key Strategies                                                                                                      |
| ----------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------- |
| **LCP** (Largest Contentful Paint)  | < 2.5s  | Use `priority` on hero images, prefetch critical data in Server Components, use `next/font` with `display: 'swap'`  |
| **INP** (Interaction to Next Paint) | < 200ms | Keep event handlers fast, defer heavy work with `startTransition`, avoid blocking the main thread                   |
| **CLS** (Cumulative Layout Shift)   | < 0.1   | Always set `width`/`height` on images, use `next/font` to prevent font-swap shifts, reserve space for async content |

### Bundle Size

- Push `'use client'` boundaries as deep as possible — minimize client-side JavaScript
- Use dynamic imports (`next/dynamic`) for heavy components not needed on initial render
- Analyze bundle with `@next/bundle-analyzer`
- Tree-shake unused exports — avoid barrel files that re-export everything

### Image Optimization

- Use `next/image` for automatic format conversion (WebP/AVIF), resizing, and lazy loading
- Set `priority` on LCP images only
- Use `sizes` prop for responsive images to prevent downloading oversized images
- All static images live in `public/`

### React Native Performance

- Use `@shopify/flash-list` for long lists (50+ items)
- Animate on UI thread with `react-native-reanimated`
- Defer non-critical work with `InteractionManager.runAfterInteractions()`
- Avoid inline object/function creation in render paths of hot components

---

## 21. Anti-Patterns

### React Anti-Patterns

| Never Do This                                    | Do This Instead                              |
| ------------------------------------------------ | -------------------------------------------- |
| Store derived state in `useState`                | Compute inline or `useMemo`                  |
| `useEffect` to sync two state values             | Derive one from the other                    |
| `useEffect` to handle user events                | Put logic in the event handler               |
| Spread `{...props}` on DOM elements blindly      | Destructure and pass only known props        |
| Use array index as `key` for dynamic lists       | Use a stable unique ID                       |
| Nest ternaries in JSX                            | Extract to variables or early returns        |
| `// eslint-disable` without justification        | Fix the lint error                           |
| Place React components in `src/shared/frontend/` | Components go in `src/web/` or `src/mobile/` |
| Place React hooks in `src/shared/frontend/`      | Hooks go in `src/web/` or `src/mobile/`      |
| Use React Context for global state               | Use RxJS (`BehaviorSubject`)                 |
| Suppress type errors with `as any`               | Fix the underlying type issue                |
| Use empty catch blocks `catch(e) {}`             | Handle or rethrow with typed errors          |
| Delete failing tests to "pass"                   | Fix the underlying issue                     |

### Next.js Anti-Patterns

| Never Do This                                       | Do This Instead                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------- |
| Import Server Components in Client Components       | Pass Server Components as `children`                                 |
| Pass non-serializable props from Server → Client    | Serialize data before passing (no functions, Dates, class instances) |
| Use `'use client'` at the top of the component tree | Push `'use client'` to the deepest interactive leaf                  |
| Hardcode text strings in components                 | Use `next-intl` message files                                        |
| Skip `setRequestLocale()` in i18n pages             | Always call it to preserve SSG                                       |
| Use `<img>` tags directly                           | Use `next/image` for optimization                                    |
| Load fonts via `<link>` tags                        | Use `next/font` for zero-CLS font loading                            |
| Fetch sequentially when data is independent         | Use `Promise.all` for parallel fetches                               |
| Skip `error.tsx` in route segments                  | Add error boundaries for graceful recovery                           |

---

**End of Frontend Best Practices**
