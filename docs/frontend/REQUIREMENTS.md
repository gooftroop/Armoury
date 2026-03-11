# Armoury Frontend Requirements Specification

**Purpose:** Define the product requirements for the frontend architecture, component patterns, state management, navigation, UI frameworks, and cross-platform code sharing across Armoury's web and mobile applications. This document specifies what the frontend layer must support — not how to implement it.

**Scope:** Web (`@armoury/web`, Next.js 15) and Mobile (`@armoury/mobile`, Expo 53 + React Native 0.79). Shared frontend code in `src/shared/frontend/`. Game-agnostic shell with plugin-provided game-specific content.

**Audience:** Frontend engineers, UI/UX designers, AI agents implementing frontend features.

**Related Documents:**

- `docs/design/REQUIREMENTS.md` (UI feature requirements and non-functional requirements)
- `docs/design/INFORMATION_ARCHITECTURE.md` (navigation structure, URL schema, screen stacks)
- `docs/design/FLOWS.md` (user journeys and state machines)
- `docs/design/MATCH_EXPERIENCE.md` (active match layout and UX specs)
- `docs/design/STYLE_GUIDE.md` (visual design specifications)
- `docs/design/DESIGN_TOKENS.md` (design token definitions)
- `docs/design/ART_DIRECTION.md` (AI imagery and asset catalog)
- `docs/design/USER_STORIES.md` (user stories with acceptance criteria)
- `docs/shared/REQUIREMENTS.md` (data architecture and data flow requirements)
- `AGENTS.md` (architecture overview, conventions, component patterns)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Cross-Platform Architecture](#2-cross-platform-architecture)
3. [Component Architecture](#3-component-architecture)
4. [State Management](#4-state-management)
5. [Data Fetching & Remote State](#5-data-fetching--remote-state)
6. [Navigation & Routing](#6-navigation--routing)
7. [UI Framework & Design System](#7-ui-framework--design-system)
8. [Responsive Design](#8-responsive-design)
9. [Authentication Integration](#9-authentication-integration)
10. [Offline Support](#10-offline-support)
11. [Performance](#11-performance)
12. [Accessibility](#12-accessibility)
13. [Internationalization](#13-internationalization)
14. [Error Handling](#14-error-handling)
15. [Testing Strategy](#15-testing-strategy)
16. [Plugin UI Integration](#16-plugin-ui-integration)
17. [Feature Inventory](#17-feature-inventory)

---

## 1. Overview

Armoury's frontend spans two platforms — a Next.js 15 web application and an Expo 53 React Native mobile application — sharing pure TypeScript business logic, query definitions, and data utilities through a common `src/shared/frontend/` module. All React components (web) and React Native components (mobile) live in their respective platform workspaces. The architecture enforces strict separation between platform-specific UI code and shared pure TypeScript modules, enabling feature parity across platforms with native UX on each.

Primary objectives:

- Share pure TypeScript frontend logic (business logic, query/mutation factories, types, utilities) across web and mobile via `src/shared/frontend/` as long as it does not introduce anti-patterns or tech debt
- Keep all React components in `src/web/` and all React Native components in `src/mobile/` — no components in shared
- Enforce the orchestrational/render component split within each platform workspace
- Use @tanstack/react-query (v5) as the single source of truth for all remote/async state
- Use RxJS for global or reactive client-side state; prefer local state first, then RxJS — React Context only as last resort
- Deliver a dark tactical theme (no light theme in V1) via Radix UI (web) and Tamagui v2 (mobile)
- Support game-agnostic shell with plugin-provided game-specific content
- Maintain Core Web Vitals targets (FCP < 1.5s, TTI < 3s, LCP < 2.5s, CLS < 0.1)

### 1.1 Current State

| Platform                        | Status                                                                          | Stack                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Web (`src/web/`)                | Early — root layout, providers (React Query), home page, Sentry instrumentation | Next.js 15, App Router, Radix UI, Tailwind v4, React Query v5                          |
| Mobile (`src/mobile/`)          | Early — App.tsx shell with Tamagui config                                       | Expo 53, React Native 0.79, Tamagui v2                                                 |
| Shared (`src/shared/frontend/`) | Not yet created                                                                 | Pure TypeScript: query factories, mutation factories, business logic, types, utilities |

---

## 2. Cross-Platform Architecture

### 2.1 Code Location Rules

| ID     | Requirement                                                                                                                                                   | Priority | Notes                                               |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------- |
| FE-001 | `src/shared/frontend/` must contain only pure TypeScript modules — no React components, no React Native components, no React hooks                            | Critical | Shared code must have zero React/RN dependency      |
| FE-002 | All React components (orchestrational and render) must reside in `src/web/`                                                                                   | Critical | Web workspace owns all web components               |
| FE-003 | All React Native components must reside in `src/mobile/`                                                                                                      | Critical | Mobile workspace owns all mobile components         |
| FE-004 | Custom React hooks must reside in the platform workspace that uses them (`src/web/` or `src/mobile/`), not in `src/shared/frontend/`                          | Critical | Hooks import React — they are platform code         |
| FE-005 | Query key factories and `queryOptions` definitions (pure TypeScript, no React imports) must reside in `src/shared/frontend/<feature>/queries.ts`              | High     | Co-located with feature, consumed by both platforms |
| FE-006 | Mutation option factories (pure TypeScript configuration objects, no `useMutation` hook wrappers) must reside in `src/shared/frontend/<feature>/mutations.ts` | High     | Co-located with feature, consumed by both platforms |
| FE-007 | Business logic functions (pure transformations, formatters, validators) must reside in `src/shared/frontend/<feature>/` or `src/shared/`                      | High     | No React imports                                    |
| FE-008 | Shared TypeScript type definitions and interfaces must reside in `src/shared/frontend/<feature>/types.ts` or `src/shared/types/`                              | High     | Consumed by both platforms                          |

### 2.2 Platform-Specific File Extensions

| ID     | Requirement                                                                                                                         | Priority | Notes                                        |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------- |
| FE-010 | Platform-specific file variants must use `.native.ts` (iOS + Android), `.web.ts` (web only), `.ios.ts`, or `.android.ts` extensions | High     | Metro/webpack resolves automatically         |
| FE-011 | Consumers must import from the base module name without extension — the bundler resolves the correct platform variant               | High     | E.g., `import { getToken } from './storage'` |
| FE-012 | A shared interface file (`.ts`) must exist alongside platform-specific variants to define the public API                            | High     | Type safety across variants                  |

### 2.3 Dependency Boundaries

| ID     | Requirement                                                                                       | Priority | Notes                                                         |
| ------ | ------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------- |
| FE-013 | `src/shared/frontend/` must not import from `src/web/`, `src/mobile/`, `react`, or `react-native` | Critical | Shared code is pure TypeScript with zero framework dependency |
| FE-014 | `src/web/` and `src/mobile/` may import from `src/shared/frontend/` and `src/shared/`             | Critical | Platform code depends on shared code                          |
| FE-015 | Render components must not import `@tanstack/react-query` or any data-fetching library directly   | High     | Data access only via props from orchestrational components    |
| FE-016 | Business logic modules in `src/shared/frontend/` must not import React or any UI framework        | Critical | Pure TypeScript functions only                                |

---

## 3. Component Architecture

### 3.1 Orchestrational / Render Split

| ID     | Requirement                                                                                                                                   | Priority | Notes                                               |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------- |
| FE-020 | Every feature component must split into an orchestrational component and one or more render components                                        | Critical | Mandatory architecture pattern                      |
| FE-021 | Orchestrational components must own: data fetching (hooks), state subscriptions, event handlers, and business logic coordination              | Critical | Zero visual markup beyond composing render children |
| FE-022 | Render components must receive all data and callbacks via props                                                                               | Critical | Pure visual output                                  |
| FE-023 | Render components may use `useState` for local UI state (e.g., open/closed, hover) but must not call data hooks or store subscriptions        | Critical | Local UI state only                                 |
| FE-024 | Props interfaces must be named `<ComponentName>Props` using `interface` keyword                                                               | High     | Consistent naming convention                        |
| FE-025 | Components accepting more than approximately 5 props should be split further or use composition (children, render props, compound components) | High     | Prevent prop drilling                               |

### 3.2 Component Design Rules

| ID     | Requirement                                                                                                                                                                         | Priority | Notes                                 |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------- |
| FE-030 | All components must be functional components — no class components except error boundaries                                                                                          | Critical | React limitation for error boundaries |
| FE-031 | Generic components are encouraged for reusable UI primitives (e.g., `List<T>`, `Select<T>`)                                                                                         | High     | Type-safe reusable patterns           |
| FE-032 | Discriminated union props must be used for component variants with mutually exclusive prop sets                                                                                     | High     | Type safety for variant components    |
| FE-033 | `useCallback` and `useMemo` must not be used by default — only when passing callbacks to `React.memo` children, as `useEffect` dependencies, or for measured-expensive computations | High     | Optimization only when needed         |
| FE-034 | `useEffect` must only be used for synchronizing with external systems (subscriptions, timers, DOM mutations, analytics) — never for derived state or event handling                 | Critical | Prevent effect misuse                 |
| FE-035 | Custom hooks must be extracted when: logic is reused across 2+ components, logic exceeds ~15 lines, or logic combines multiple hooks into a cohesive unit                           | High     | One responsibility per hook           |

### 3.3 Server Components (Next.js 15)

| ID     | Requirement                                                                                                                      | Priority | Notes                            |
| ------ | -------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------- |
| FE-040 | Components in `src/web/app/` are Server Components by default — `'use client'` must only be added when interactivity is required | Critical | Minimize client JS               |
| FE-041 | `'use client'` boundaries must be pushed as deep as possible — wrap only the interactive leaf, not the whole tree                | High     | Maximize server-rendered content |
| FE-042 | Server Components must never be imported into Client Components — pass them as `children` instead                                | Critical | React architecture constraint    |
| FE-043 | Props passed from Server Components to Client Components must be serializable (no functions, Dates, or class instances)          | Critical | Serialization boundary           |
| FE-044 | `async` components are only valid as Server Components                                                                           | Critical | React constraint                 |
| FE-045 | Data fetching with secrets/tokens must occur in Server Components, not Client Components                                         | Critical | Security boundary                |

---

## 4. State Management

### 4.1 State Classification

| ID     | Requirement                                                                                                                             | Priority | Notes                                         |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------- |
| FE-050 | All remote/async state (armies, matches, campaigns, faction data, user account) must be managed by @tanstack/react-query                | Critical | Single source of truth for server state       |
| FE-051 | Local component state must be the preferred default for UI state (open/closed, hover, focus, scroll position) using `useState`          | Critical | Simplest option first                         |
| FE-052 | Global or reactive client-side state (event streams, real-time sync indicators, cross-cutting reactive flows) must use RxJS observables | Critical | Preferred over React Context for shared state |
| FE-053 | React Context may be used as a last resort when local state, URL state, React Query, and RxJS are all unsuitable                        | Low      | Least preferred option for state management   |
| FE-054 | URL state (filters, pagination, sort order, selected tabs, game system) must live in URL search params or path segments                 | Critical | Survives refresh, shareable                   |

### 4.2 State Preference Hierarchy

State solutions must be evaluated in this order. Use the first option that satisfies the requirement:

1. **Local state** (`useState`) — default for component-scoped state
2. **URL state** (search params / path segments) — for state that should survive refresh or be shareable
3. **React Query** — for all server/remote data
4. **RxJS** — for global/reactive state, event composition, real-time streams, and cross-cutting flows
5. **React Context** — last resort when none of the above are suitable

### 4.3 State Rules

| ID     | Requirement                                                                                                                    | Priority | Notes                    |
| ------ | ------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------------ |
| FE-055 | Derived state must be computed inline or with `useMemo` — never stored in `useState`                                           | Critical | Prevents sync bugs       |
| FE-056 | State must be lifted only as high as needed — two siblings sharing state lift to parent; broader sharing uses Context or RxJS  | High     | Minimal lift principle   |
| FE-057 | Remote state must never be duplicated into `useState` — use query results directly                                             | Critical | React Query IS the state |
| FE-058 | Complex local state should use multiple `useState` calls or a form library; for state machines with 5+ states, evaluate XState | High     | Structured state updates |
| FE-059 | RxJS subscriptions in React components must always be cleaned up in `useEffect` return functions                               | Critical | Prevent memory leaks     |

---

## 5. Data Fetching & Remote State

### 5.1 Query Key Factories

| ID     | Requirement                                                                                                                                  | Priority | Notes                             |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------- |
| FE-060 | Query keys must be co-located with query functions using `queryOptions()` from @tanstack/react-query v5                                      | Critical | Never in a separate global file   |
| FE-061 | Query keys must be structured from most generic to most specific using `as const` tuples                                                     | Critical | Enables hierarchical invalidation |
| FE-062 | Each feature must define a query key factory object following the pattern: `all()`, `lists()`, `list(filters)`, `details()`, `detail(id)`    | High     | Consistent key hierarchy          |
| FE-063 | Custom hooks wrapping `useQuery` are optional — direct `useQuery(featureOptions(params))` is acceptable when the hook would be a passthrough | High     | Avoid unnecessary abstractions    |

### 5.2 Mutations & Cache Invalidation

| ID     | Requirement                                                                                                                               | Priority | Notes                                    |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------- |
| FE-064 | Simple mutations must invalidate relevant queries in `onSettled` (runs on both success and error)                                         | Critical | Prefer `onSettled` over `onSuccess`      |
| FE-065 | Latency-sensitive mutations (army editing, VP/CP tracking) must use optimistic updates with cancel → snapshot → update → rollback pattern | High     | See DLP-007 from UI REQUIREMENTS         |
| FE-066 | Optimistic updates must cancel in-flight queries before modifying the cache, snapshot previous state, and rollback on error               | Critical | Data integrity during optimistic updates |
| FE-067 | `onSettled` must always invalidate affected queries to ensure cache freshness after both success and error                                | Critical | Final consistency guarantee              |

### 5.3 SSR / RSC Integration

| ID     | Requirement                                                                                                                     | Priority | Notes                                 |
| ------ | ------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------- |
| FE-068 | Server Components must prefetch data using `QueryClient.prefetchQuery()` and pass dehydrated state via `HydrationBoundary`      | Critical | Avoid client-side loading waterfalls  |
| FE-069 | Default `staleTime` must be set above 0 (currently 60 seconds) to prevent immediate client-side refetching of SSR-hydrated data | Critical | Already configured in `providers.tsx` |

### 5.4 Cache Configuration

| ID     | Requirement                                                                                            | Priority | Notes                                           |
| ------ | ------------------------------------------------------------------------------------------------------ | -------- | ----------------------------------------------- |
| FE-070 | User-specific data (armies, campaigns, matches) must use default `staleTime` (60s) and `gcTime` (5min) | High     | Changes from user actions; refetch on focus     |
| FE-071 | Static reference data (faction rules, unit stats) must use `staleTime: Infinity` and `gcTime: 24h`     | Critical | Changes only on BSData sync; never auto-refetch |
| FE-072 | Session/auth data must use `staleTime: 0` and `gcTime: 30min`                                          | High     | Always verify freshness                         |
| FE-073 | Lists with filters must use `staleTime: 30s` and `gcTime: 5min`                                        | High     | Stale quickly as filters change                 |

### 5.5 React Native Data Fetching

| ID     | Requirement                                                                                                                 | Priority | Notes                                           |
| ------ | --------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------- |
| FE-074 | Mobile apps must configure `focusManager` with `AppState` change events for refetch-on-foreground behavior                  | Critical | React Native has no browser focus events        |
| FE-075 | Mobile apps must configure `onlineManager` with `@react-native-community/netinfo` for offline awareness                     | Critical | React Native has no browser online events       |
| FE-076 | Offline-first features must consider `@tanstack/query-async-storage-persister` for persisting query cache to device storage | High     | Survive app restarts                            |
| FE-077 | Mutations made offline must be queued and replayed when connectivity returns                                                | High     | Via `useMutation` + `onlineManager` integration |

---

## 6. Navigation & Routing

### 6.1 Web Routing (Next.js 15 App Router)

| ID     | Requirement                                                                                | Priority | Notes                                           |
| ------ | ------------------------------------------------------------------------------------------ | -------- | ----------------------------------------------- |
| FE-080 | All game-specific routes must be scoped under `/[gameSystem]/` dynamic segment             | Critical | E.g., `/wh40k10e/armies`, `/aos/matches`        |
| FE-081 | Game-system-agnostic pages (Account, Profile) must live outside the `[gameSystem]` segment | Critical | `/account`, `/profile`                          |
| FE-082 | Modal routes must be URL-addressable and preserve back-stack navigation                    | High     | E.g., `/[gameSystem]/armies/[armyId]/units/add` |
| FE-083 | Browser back/forward navigation must work natively for all routes                          | Critical | GLB-010 from UI REQUIREMENTS                    |
| FE-084 | Active match mode (Basic/Guided) must be stored in URL query parameter                     | High     | `?mode=basic` or `?mode=guided`                 |
| FE-085 | Deep links must work for all pages — every screen is directly accessible via URL           | Critical | See IA URL Schema                               |

### 6.2 Web URL Schema

The complete URL schema is defined in `docs/design/INFORMATION_ARCHITECTURE.md` Section 2. Key routes:

| Page                           | Route                                          | Auth Required |
| ------------------------------ | ---------------------------------------------- | ------------- |
| Landing / Game System Selector | `/`                                            | No            |
| Login                          | `/login`                                       | No            |
| The Forge (Army List)          | `/[gameSystem]/armies`                         | Yes           |
| Army Creation                  | `/[gameSystem]/armies/new`                     | Yes           |
| Army Detail (Builder)          | `/[gameSystem]/armies/[armyId]`                | Yes           |
| Unit Add Modal                 | `/[gameSystem]/armies/[armyId]/units/add`      | Yes           |
| Unit Config & Datasheet        | `/[gameSystem]/armies/[armyId]/units/[unitId]` | Yes           |
| Unit Datasheet (Read-Only)     | `/[gameSystem]/references/units/[unitId]`      | No            |
| War Ledger (Matches)           | `/[gameSystem]/matches`                        | Yes           |
| Match Detail                   | `/[gameSystem]/matches/[matchId]`              | Yes           |
| Command Post                   | `/[gameSystem]/matches/[matchId]/command-post` | Yes           |
| Campaigns                      | `/[gameSystem]/campaigns`                      | Yes           |
| Campaign Detail                | `/[gameSystem]/campaigns/[campaignId]`         | Yes           |
| Allies (Social)                | `/[gameSystem]/social`                         | Yes           |
| References                     | `/[gameSystem]/references`                     | No            |
| Account                        | `/account`                                     | Yes           |
| Profile                        | `/profile`                                     | Yes           |
| Tournaments                    | `/[gameSystem]/tournaments`                    | Yes           |

### 6.3 Mobile Routing (Expo Router)

| ID     | Requirement                                                                               | Priority | Notes                                          |
| ------ | ----------------------------------------------------------------------------------------- | -------- | ---------------------------------------------- |
| FE-090 | Mobile must use Expo Router with file-based routing under `src/mobile/app/`               | Critical | Mirrors web paths for deep links               |
| FE-091 | Tab navigator must include: The Forge, War Ledger, Campaigns, Allies, References, Account | Critical | 6 tabs; Account is mobile-only                 |
| FE-092 | Each tab must contain a nested stack navigator for its screen hierarchy                   | Critical | Standard mobile navigation pattern             |
| FE-093 | Modal/sheet presentations must be used for Unit Add and Match Creation                    | High     | Modal on small screens becomes full takeover   |
| FE-094 | Header must include back button and page title on all non-root screens                    | Critical | GLB-011 from UI REQUIREMENTS                   |
| FE-095 | Mobile routes must mirror web paths to enable universal deep links                        | High     | E.g., `/armies/[armyId]` matches web structure |

### 6.4 Game System Scoping

| ID     | Requirement                                                                                        | Priority | Notes                    |
| ------ | -------------------------------------------------------------------------------------------------- | -------- | ------------------------ |
| FE-096 | `[gameSystem]` segment must scope all game-specific content and navigation                         | Critical | E.g., `wh40k10e`, `aos`  |
| FE-097 | Switching game systems must navigate to the new `[gameSystem]` root with unsaved-edit confirmation | High     | Confirm if dirty state   |
| FE-098 | Plugins must provide game system ID (slug), display name, and icon for navigation rendering        | Critical | Plugin-provided metadata |
| FE-099 | The last-used game system must be remembered in user preferences for next launch                   | High     | `Account.preferences`    |

---

## 7. UI Framework & Design System

### 7.1 Web UI Framework

| ID     | Requirement                                                            | Priority | Notes                          |
| ------ | ---------------------------------------------------------------------- | -------- | ------------------------------ |
| FE-100 | Web must use Radix UI as the component primitive library               | Critical | Headless accessible primitives |
| FE-101 | Web must use Tailwind CSS v4 for styling                               | Critical | Already configured             |
| FE-102 | Web must use Radix UI primitives for accessible interactive components | Critical | Headless accessible primitives |
| FE-103 | Web must use Lucide icons                                              | High     | Consistent icon set            |
| FE-104 | Web UI components must reside in `src/web/ui/`                         | High     | Project convention             |

### 7.2 Mobile UI Framework

| ID     | Requirement                                                                          | Priority | Notes                          |
| ------ | ------------------------------------------------------------------------------------ | -------- | ------------------------------ |
| FE-110 | Mobile must use Tamagui v2 as the component library and styling system               | Critical | Already integrated             |
| FE-111 | Mobile must use `@shopify/flash-list` instead of `FlatList` for lists with 50+ items | Critical | View recycling for performance |
| FE-112 | `FlashList` must always include `estimatedItemSize` prop                             | Critical | Required for recycling         |
| FE-113 | Mobile animations must use `react-native-reanimated` (v3+) for UI-thread animations  | High     | No JS-thread blocking          |
| FE-114 | Touch-driven animations must use `react-native-gesture-handler`                      | High     | Swipe, pinch, drag             |

### 7.3 Shared Design System

| ID     | Requirement                                                                                                                         | Priority | Notes                        |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------- |
| FE-120 | A shared design token system must exist across Tailwind (web) and Tamagui (mobile)                                                  | High     | GLB-016 from UI REQUIREMENTS |
| FE-121 | V1 must ship with dark tactical theme only — no light theme                                                                         | Critical | GLB-008 from UI REQUIREMENTS |
| FE-122 | All imagery must be AI-generated — no trademark-violating imagery                                                                   | Critical | GLB-014 from UI REQUIREMENTS |
| FE-123 | All interactive elements must use consistent accent colors and visual states (hover, focus, active, disabled) across both platforms | High     | Design consistency           |

---

## 8. Responsive Design

### 8.1 Layout Breakpoints

| ID     | Requirement                                                                                      | Priority | Notes                                    |
| ------ | ------------------------------------------------------------------------------------------------ | -------- | ---------------------------------------- |
| FE-130 | Web must support three breakpoint tiers: desktop (≥1024px), tablet (768–1023px), mobile (<768px) | Critical | Per MATCH_EXPERIENCE.md responsive specs |
| FE-131 | Side navigation must display at ≥768px (web)                                                     | Critical | GLB-003                                  |
| FE-132 | Bottom navigation must display at <768px (web) and always on mobile                              | Critical | GLB-002                                  |

### 8.2 Responsive Behaviors

| ID     | Requirement                                                                                                   | Priority | Notes                         |
| ------ | ------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------- |
| FE-133 | Modals must convert to full takeover screens on small screens (<768px)                                        | Critical | GLB-004                       |
| FE-134 | Web drawers must convert to bottom sheets below 768px                                                         | High     | Per FLOWS.md responsive notes |
| FE-135 | Split views (list + detail) on desktop must become stacked navigation on mobile                               | High     | Army builder, match views     |
| FE-136 | Weapon tables must become stacked cards on mobile                                                             | High     | Datasheet responsiveness      |
| FE-137 | Inline filter bars must collapse into bottom sheets on mobile                                                 | High     | Search/filter pattern         |
| FE-138 | Mobile must not use hardcoded dimensions — use `useWindowDimensions`, flex layouts, or responsive breakpoints | Critical | Adaptive layouts              |

### 8.3 Navigation Responsive Rules

| ID     | Requirement                                                                                                                             | Priority | Notes                                       |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------- |
| FE-139 | Web side nav (≥768px): The Forge, War Ledger, Campaigns, Allies, References with game system switcher at top and user profile at bottom | Critical | Collapsible to icon-only                    |
| FE-140 | Bottom nav (web <768px + mobile): The Forge, War Ledger, Campaigns, Allies, References — mobile adds 6th Account tab                    | Critical | Icons + text labels, accent active state    |
| FE-141 | Web header: page title + profile icon/popover                                                                                           | Critical | Popover with Profile, Account, Logout/Login |
| FE-142 | Mobile header: back button + page title                                                                                                 | Critical | Stack-based per tab                         |
| FE-143 | Army page header override: army name + points counter displayed in header                                                               | High     | Per IA spec                                 |

---

## 9. Authentication Integration

| ID     | Requirement                                                                                                                                | Priority | Notes                         |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ----------------------------- |
| FE-150 | Auth must use Auth0 Universal Login                                                                                                        | Critical | AUTH-001 from UI REQUIREMENTS |
| FE-151 | Web must use Auth0 SPA SDK                                                                                                                 | Critical | Client-side token management  |
| FE-152 | Mobile must use Auth0 React Native SDK                                                                                                     | Critical | Native token management       |
| FE-153 | Social login providers: Google, Apple, Discord                                                                                             | High     | Auth0 configuration           |
| FE-154 | Web: unauthenticated users may browse References and read-only datasheets; protected routes show read-only banners or redirect to `/login` | High     | AUTH-004                      |
| FE-155 | Mobile: unauthenticated users must be redirected to `/login`                                                                               | Critical | AUTH-003 — hard gate          |
| FE-156 | Token refresh must be handled transparently (silent renewal)                                                                               | Critical | AUTH-007                      |
| FE-157 | Session expiry must trigger silent refresh; if refresh fails, redirect to `/login`                                                         | Critical | Per IA auth state behavior    |
| FE-158 | Logout must clear all local caches (React Query cache, RxJS state, local storage)                                                          | Critical | AUTH-006                      |
| FE-159 | Account data must be cached locally via React Query                                                                                        | High     | AUTH-008                      |

---

## 10. Offline Support

| ID     | Requirement                                                                                                            | Priority | Notes                               |
| ------ | ---------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------- |
| FE-160 | Faction data and unit references must be cached locally after first BSData sync                                        | Critical | OFF-001                             |
| FE-161 | Army building must work fully offline after initial sync                                                               | Critical | OFF-002                             |
| FE-162 | Match tracking must require network connectivity for real-time sync                                                    | High     | OFF-003                             |
| FE-163 | An offline indicator must be shown when the device is disconnected                                                     | High     | OFF-004                             |
| FE-164 | Data must auto-sync when connectivity returns                                                                          | High     | OFF-005                             |
| FE-165 | Mobile apps must track network state via `@react-native-community/netinfo` and configure React Query's `onlineManager` | Critical | Platform-specific offline detection |
| FE-166 | Web apps must use browser `navigator.onLine` and `online`/`offline` events for offline detection                       | High     | Browser-native API                  |

---

## 11. Performance

### 11.1 Core Web Vitals (Web)

| ID     | Requirement                                   | Priority | Notes   |
| ------ | --------------------------------------------- | -------- | ------- |
| FE-170 | First Contentful Paint (FCP) must be < 1.5s   | Critical | PRF-001 |
| FE-171 | Time to Interactive (TTI) must be < 3s        | Critical | PRF-002 |
| FE-172 | Largest Contentful Paint (LCP) must be < 2.5s | High     | PRF-003 |
| FE-173 | Cumulative Layout Shift (CLS) must be < 0.1   | High     | PRF-004 |
| FE-174 | Initial JS bundle must be < 200KB             | High     | PRF-005 |

### 11.2 Loading & Rendering

| ID     | Requirement                                                                                                  | Priority | Notes                                                            |
| ------ | ------------------------------------------------------------------------------------------------------------ | -------- | ---------------------------------------------------------------- |
| FE-175 | Below-the-fold images must be lazy loaded; hero images must be eager loaded                                  | High     | PRF-006                                                          |
| FE-176 | Lists with > 20 items must be virtualized                                                                    | Critical | PRF-007 — use FlashList on mobile, virtualization library on web |
| FE-177 | Skeleton loaders must match the final layout to prevent layout shifts                                        | Critical | DLP-002                                                          |
| FE-178 | Render-as-you-fetch pattern must be used (initiate fetch before render via SSR prefetch or query preloading) | High     | DLP-001                                                          |
| FE-179 | Loading skeletons must be provided for every list and detail page                                            | Critical | GLB-005                                                          |

### 11.3 Mobile Performance

| ID     | Requirement                                                                                                   | Priority | Notes                                             |
| ------ | ------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------- |
| FE-180 | Heavy computation must not block the JS thread — use `InteractionManager.runAfterInteractions()` for deferral | High     | Smooth animations                                 |
| FE-181 | `renderItem` functions for lists must not include heavy computation                                           | High     | Extract to stable components or use `useCallback` |
| FE-182 | Multi-type lists must use `getItemType` for FlashList recycling optimization                                  | High     | Headers, items, footers                           |

---

## 12. Accessibility

| ID     | Requirement                                                                                  | Priority | Notes                  |
| ------ | -------------------------------------------------------------------------------------------- | -------- | ---------------------- |
| FE-190 | The app must comply with WCAG 2.1 AA                                                         | Critical | A11Y-001               |
| FE-191 | Text contrast must be ≥ 4.5:1 (normal text) and ≥ 3:1 (large text)                           | Critical | A11Y-002               |
| FE-192 | Touch targets must be ≥ 44×44px on mobile                                                    | Critical | A11Y-003               |
| FE-193 | Focus indicators must be visible on all interactive elements                                 | Critical | A11Y-004               |
| FE-194 | Screen reader labels must be provided for all interactive elements                           | Critical | A11Y-005               |
| FE-195 | Animations must respect `prefers-reduced-motion`                                             | High     | A11Y-006               |
| FE-196 | Status indicators must use both icon and color — never color alone                           | Critical | A11Y-007               |
| FE-197 | Every interactive element in tests must be findable by role, label, or text — not by test ID | High     | RTL testing convention |

### 12.1 Keyboard Navigation Targets

All interactive flows must be fully operable via keyboard alone. These targets apply to every phase:

| Pattern           | Required Behavior                                                                                                          | Applies To                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| **Tab order**     | Logical top-to-bottom, left-to-right flow matching visual layout. No focus traps outside modals.                           | All pages                                |
| **Enter / Space** | Activate buttons, links, toggles, and select options                                                                       | All interactive elements                 |
| **Escape**        | Close modals, drawers, popovers, and dropdown menus. Return focus to the trigger element.                                  | Drawer, Dialog, Popover, Select, Toast   |
| **Arrow keys**    | Navigate within composite widgets (radio groups, select options, tabs, menu items)                                         | RadioGroup, Select, Tabs, NavigationMenu |
| **Focus trap**    | Modal dialogs and drawers must trap focus within the overlay while open. Tab from last focusable → first focusable (loop). | Dialog, Drawer, DrawerStack              |
| **Focus restore** | When a modal/drawer closes, focus must return to the element that opened it                                                | Dialog, Drawer, Popover                  |
| **Skip link**     | A "Skip to main content" link must be the first focusable element on every page                                            | Shell Layout (Phase 1)                   |

### 12.2 ARIA Patterns

| Component              | Required ARIA                                                                                | Notes                                |
| ---------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| Drawer / Dialog        | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to header                   | Radix provides this by default       |
| DrawerStack            | Each stacked drawer has its own `aria-labelledby`; only topmost is `aria-modal="true"`       | Custom implementation needed         |
| Toast                  | `role="status"`, `aria-live="polite"` (info) or `aria-live="assertive"` (error)              | Radix Toast handles this             |
| Loading skeletons      | `aria-busy="true"` on the container, `aria-hidden="true"` on skeleton elements               | Announce "Loading" to screen readers |
| Form validation errors | `aria-invalid="true"` on the field, `aria-describedby` pointing to the error message element | Inline error display (FE-261)        |
| Navigation             | `<nav aria-label="Main navigation">` for primary nav, `aria-current="page"` on active link   | Shell Navigation (Phase 1)           |
| Army list / Unit list  | `role="list"` with `role="listitem"` children, or semantic `<ul>`/`<li>`                     | All list views                       |
| Match phase indicator  | `aria-label` describing current phase and progress (e.g., "Phase 2 of 5: Movement")          | Match Play (Phase 3)                 |

### 12.3 Color & Motion

| Target                                | Requirement                                                                                                                                                       |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contrast (normal text)                | ≥ 4.5:1 against background (WCAG AA)                                                                                                                              |
| Contrast (large text / UI components) | ≥ 3:1 against background (WCAG AA)                                                                                                                                |
| Focus indicator                       | 2px solid ring, contrast ≥ 3:1 against adjacent colors                                                                                                            |
| Reduced motion                        | All CSS transitions/animations wrapped in `@media (prefers-reduced-motion: no-preference)`. JS animations check `matchMedia('(prefers-reduced-motion: reduce)')`. |
| Dark mode only (V1)                   | Ensure all contrast ratios are validated against the dark palette from DESIGN_TOKENS.md                                                                           |

---

## 13. Internationalization

| ID     | Requirement                                                                                | Priority | Notes    |
| ------ | ------------------------------------------------------------------------------------------ | -------- | -------- |
| FE-200 | All user-facing strings must be externalizable (no hardcoded strings in render components) | Critical | I18N-001 |
| FE-201 | Layout structure must support RTL rendering in the future                                  | Medium   | I18N-002 |
| FE-202 | Date/time formatting must respect user locale                                              | High     | I18N-003 |
| FE-203 | Number formatting must respect locale conventions (comma/period separators)                | High     | I18N-004 |
| FE-204 | V1 language is English only — but all string access must go through the i18n-ready path    | Critical | I18N-005 |

---

## 14. Error Handling

### 14.1 Error Boundaries

| ID     | Requirement                                                                                                              | Priority | Notes                     |
| ------ | ------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------------- |
| FE-210 | Route segments must be wrapped with error boundaries via `error.tsx` (Next.js) or custom `ErrorBoundary` class component | Critical | DLP-003                   |
| FE-211 | A single shared `ErrorBoundary` component must be used — do not create per-feature error boundary components             | High     | Reusable, consistent      |
| FE-212 | Error boundaries must display user-friendly fallback UI with retry option and contact information                        | Critical | DLP-003                   |
| FE-213 | Error boundaries must log errors to Sentry in `componentDidCatch`                                                        | Critical | Production error tracking |
| FE-214 | Expo Router must use `+error.tsx` files for route-level error handling on mobile                                         | High     | Mobile error recovery     |

### 14.2 Async Error Handling

| ID     | Requirement                                                                                                                     | Priority | Notes                       |
| ------ | ------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------- |
| FE-215 | Async errors in event handlers (not caught by error boundaries) must use try/catch and surface via state or toast notifications | High     | User-visible error feedback |
| FE-216 | Failed data fetches must auto-retry (3 attempts, exponential backoff: 0.5s/1s/2s)                                               | High     | DLP-004                     |
| FE-217 | Faction data must use stale-while-revalidate caching strategy                                                                   | High     | DLP-005                     |
| FE-218 | Match data must be fetched in real-time/near-real-time (polling v1, ~3s cadence)                                                | Critical | DLP-006                     |

### 14.3 Sentry Integration

| ID     | Requirement                                                                              | Priority | Notes                                                                         |
| ------ | ---------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------- |
| FE-219 | Web must integrate Sentry for error tracking (instrumentation files already present)     | Critical | `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` |
| FE-220 | Mobile must integrate Sentry via `Sentry.wrap(App)` with source map upload via EAS Build | Critical | Native crash + JS error capture                                               |
| FE-221 | Sentry must capture both React error boundary errors and unhandled promise rejections    | Critical | Complete error coverage                                                       |

---

## 15. Testing Strategy

### 15.1 Component Testing

| ID     | Requirement                                                                     | Priority | Notes                             |
| ------ | ------------------------------------------------------------------------------- | -------- | --------------------------------- |
| FE-230 | Components must be tested using React Testing Library (RTL)                     | Critical | Test behavior, not implementation |
| FE-231 | User interactions must be simulated with `userEvent` (not `fireEvent`)          | High     | Realistic interaction simulation  |
| FE-232 | Render component tests must exercise components via props — no mocked hooks     | High     | Pure prop-based testing           |
| FE-233 | Orchestrational component tests must mock hooks and data dependencies           | High     | Isolated orchestration testing    |
| FE-234 | Interactive elements must be queried by role, label, or text — never by test ID | High     | Accessibility-first testing       |

### 15.2 Hook Testing

| ID     | Requirement                                                                                               | Priority | Notes                         |
| ------ | --------------------------------------------------------------------------------------------------------- | -------- | ----------------------------- |
| FE-235 | Custom hooks must be tested in isolation when they contain non-trivial logic                              | High     | Via `renderHook` from RTL     |
| FE-236 | React Query hooks must be tested with `QueryClientProvider` wrapper providing a test-scoped `QueryClient` | High     | Isolated query state per test |

### 15.3 Test Organization

| ID     | Requirement                                                                     | Priority | Notes              |
| ------ | ------------------------------------------------------------------------------- | -------- | ------------------ |
| FE-237 | Tests must reside in `__tests__/` directories co-located with source            | Critical | Project convention |
| FE-238 | Test fixtures must reside in `__fixtures__/` directories co-located with source | High     | Project convention |
| FE-239 | Mock modules must reside in `__mocks__/` directories co-located with source     | High     | Project convention |

---

## 16. Plugin UI Integration

| ID     | Requirement                                                                                                                   | Priority | Notes                              |
| ------ | ----------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------- |
| FE-250 | The application shell (navigation, layout, auth, social) must be completely game-agnostic — no game-specific terms or imports | Critical | PLG-001 from UI REQUIREMENTS       |
| FE-251 | Plugins must provide: faction list, units, stratagems, detachments, enhancements for rendering                                | Critical | PLG-002                            |
| FE-252 | Plugins must provide: game phases and validation rules for match and army UIs                                                 | Critical | PLG-003                            |
| FE-253 | Plugins must provide: faction imagery mappings (all AI-generated)                                                             | High     | PLG-004                            |
| FE-254 | Plugin UI extension points must be defined for game-specific UI customization                                                 | High     | PLG-005                            |
| FE-255 | The shell must render completely without any plugin-specific imports in shell code                                            | Critical | PLG-006 — dependency boundary      |
| FE-256 | Game-specific content must only render through plugin-provided data passed via the DataContext game data accessor             | Critical | No hardcoded game data in frontend |

---

## 17. Feature Inventory

All features below must be implemented across web and mobile as specified in `docs/design/REQUIREMENTS.md` Section 9. This inventory tracks the 25 screens defined in the Information Architecture:

| #   | Screen                              | Web Route                          | Mobile Tab          | Priority |
| --- | ----------------------------------- | ---------------------------------- | ------------------- | -------- |
| 1   | Landing / Game System Selector      | `/`                                | (pre-tab)           | Critical |
| 2   | Login                               | `/login`                           | (pre-tab)           | Critical |
| 3   | The Forge (Army List)               | `/[gs]/armies`                     | Armies              | Critical |
| 4   | Army Creation                       | `/[gs]/armies/new`                 | Armies → New        | Critical |
| 5   | Army Detail (Builder)               | `/[gs]/armies/[id]`                | Armies → Detail     | Critical |
| 6   | Unit Add Modal                      | `/[gs]/armies/[id]/units/add`      | Armies → Add Unit   | Critical |
| 7   | Unit Config & Interactive Datasheet | `/[gs]/armies/[id]/units/[uid]`    | Armies → Unit       | Critical |
| 8   | Unit Datasheet (Read-Only)          | `/[gs]/references/units/[uid]`     | References → Unit   | Critical |
| 9   | War Ledger (Matches List)           | `/[gs]/matches`                    | Matches             | Critical |
| 10  | Match Creation                      | `/[gs]/matches/new`                | Matches → New       | Critical |
| 11  | Match Page (Past/Future/Active)     | `/[gs]/matches/[id]`               | Matches → Detail    | Critical |
| 12  | Active Match — Basic Mode           | `/[gs]/matches/[id]?mode=basic`    | Matches → Active    | Critical |
| 13  | Active Match — Guided Mode          | `/[gs]/matches/[id]?mode=guided`   | Matches → Active    | Critical |
| 14  | Command Post                        | `/[gs]/matches/[id]/command-post`  | Matches → CP        | High     |
| 15  | Campaigns List                      | `/[gs]/campaigns`                  | Campaigns           | Critical |
| 16  | Campaign Creation                   | `/[gs]/campaigns/new`              | Campaigns → New     | High     |
| 17  | Campaign Dashboard                  | `/[gs]/campaigns/[id]`             | Campaigns → Detail  | Critical |
| 18  | Campaign Unit                       | `/[gs]/campaigns/[id]/units/[uid]` | Campaigns → Unit    | High     |
| 19  | Campaign Matches                    | `/[gs]/campaigns/[id]/matches`     | Campaigns → Matches | High     |
| 20  | Campaign Management                 | `/[gs]/campaigns/[id]/manage`      | Campaigns → Manage  | High     |
| 21  | Allies (Social/Friends)             | `/[gs]/social`                     | Social              | Critical |
| 22  | References                          | `/[gs]/references`                 | References          | Critical |
| 23  | Account                             | `/account`                         | Account (tab)       | High     |
| 24  | Profile                             | `/profile`                         | Account (section)   | High     |
| 25  | Tournaments (Placeholder)           | `/[gs]/tournaments`                | —                   | Medium   |

`[gs]` = `[gameSystem]` dynamic segment.

---

## 18. Validation Behaviors (Frontend)

| ID     | Requirement                                                                                                                       | Priority | Notes                        |
| ------ | --------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------- |
| FE-260 | Disabled UI states must always include reason text (tooltip or inline)                                                            | Critical | VAL-001 from UI REQUIREMENTS |
| FE-261 | Validation errors must be displayed inline near the field, plus in a summary panel where relevant (e.g., army validation summary) | Critical | VAL-002                      |
| FE-262 | All form submissions must be prevented on validation failure with the first error highlighted                                     | Critical | VAL-003                      |
| FE-263 | All validation rules must be sourced from the shared validation engine — no UI-only validation rules                              | Critical | VAL-004                      |
| FE-264 | Over-limit points must show a warning, not auto-block — behavior is ruleset dependent                                             | High     | VAL-005                      |

---

## 19. Data Loading Patterns

| ID     | Requirement                                                                                        | Priority | Notes                                   |
| ------ | -------------------------------------------------------------------------------------------------- | -------- | --------------------------------------- |
| FE-270 | Render-as-you-fetch must be the default data loading strategy — initiate fetch before render       | High     | DLP-001; via SSR prefetch or preloading |
| FE-271 | Skeleton loaders must match the final layout structure exactly — no layout shift when data arrives | Critical | DLP-002                                 |
| FE-272 | Error boundaries must provide graceful messaging with retry action and contact information         | Critical | DLP-003                                 |
| FE-273 | Failed fetches must auto-retry with 3 attempts and exponential backoff (500ms, 1s, 2s)             | High     | DLP-004                                 |
| FE-274 | Faction data must use stale-while-revalidate caching                                               | High     | DLP-005                                 |
| FE-275 | Match data must use real-time/near-real-time fetching (polling at ~3s intervals in V1)             | Critical | DLP-006                                 |
| FE-276 | Army editing must use optimistic updates with rollback on failure                                  | High     | DLP-007                                 |

---

## 20. Security Requirements (Frontend)

| ID     | Requirement                                                                                               | Priority | Notes                        |
| ------ | --------------------------------------------------------------------------------------------------------- | -------- | ---------------------------- |
| FE-280 | No sensitive data (tokens, keys) may be stored in plaintext on the client                                 | Critical | SEC-001 from UI REQUIREMENTS |
| FE-281 | Web must implement CSRF protection via SameSite cookies and Auth0 integration                             | High     | SEC-002                      |
| FE-282 | All user inputs must be sanitized on both client and server                                               | Critical | SEC-003                      |
| FE-283 | Rate limiting must be enforced on API calls via API Gateway                                               | High     | SEC-004                      |
| FE-284 | Client applications must never access databases directly — all server data via API Gateway + Lambda       | Critical | SEC-005                      |
| FE-285 | Secrets and tokens must only be used in Server Components or server-side code, never in Client Components | Critical | FE-045 reinforcement         |

---

**End of Frontend Requirements**
