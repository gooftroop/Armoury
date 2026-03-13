# Frontend File Organization

**Purpose:** Reference guide for organizing components, utilities, and modules in the Armoury frontend workspaces. Use this when creating new files or deciding where existing code should live.

**Audience:** Engineers adding new components, hooks, or utilities to `@armoury/web`, `@armoury/mobile`, or `@armoury/ui`.

**Related Documents:**

- [PHASE_0_SHARED_PREREQUISITES.md](./plan/PHASE_0_SHARED_PREREQUISITES.md) — §11 (`@armoury/ui` design system), §12 (component registry)
- [SHARED_COMPONENTS.md](./plan/SHARED_COMPONENTS.md) — Component styling contracts, CVA variants
- [BEST_PRACTICES.md](./plan/BEST_PRACTICES.md) — §8 App Router file conventions
- [NEXTJS_RENDERING_STRATEGY.md](./NEXTJS_RENDERING_STRATEGY.md) — §1 RSC composition, §11 route rendering modes

---

## Table of Contents

1. [Directory Structure Overview](#1-directory-structure-overview)
2. [Naming Conventions](#2-naming-conventions)
3. [Import Rules](#3-import-rules)
4. [Component File Organization](#4-component-file-organization)
5. [Where to Put New Code (Decision Tree)](#5-where-to-put-new-code-decision-tree)
6. [Utils vs. Libs vs. Helpers](#6-utils-vs-libs-vs-helpers)
7. [Shared UI Component Registry](#7-shared-ui-component-registry)
8. [Route File Conventions (Next.js App Router)](#8-route-file-conventions-nextjs-app-router)

---

## 1. Directory Structure Overview

```
src/
├── shared/                    → @armoury/shared (core library)
│   ├── data/                  → Adapters, DAOs, DataContext, schema, codecs
│   ├── models/                → Core models (Account, Friend)
│   ├── providers/bsdata/      → BSData external data provider
│   ├── clients/               → API clients
│   │   ├── github/            → GitHub API client
│   │   └── wahapedia/         → Wahapedia API client
│   ├── types/                 → Core types, enums, errors, interfaces
│   ├── validation/            → Game-agnostic validation engine
│   ├── frontend/              → Pure TypeScript shared frontend modules (NO React)
│   │   └── utils/             → Shared frontend utilities
│   └── streams/               → @armoury/streams (RxJS reactive facades)
│
├── systems/                   → @armoury/systems (game system plugins)
│   └── src/
│       └── wh40k10e/          → Warhammer 40K 10th Edition
│           ├── public/        → Downloadable content (localization, config)
│           ├── dao/           → Game-specific DAOs
│           ├── models/        → Game-specific models
│           ├── types/         → Game-specific types
│           ├── validation/    → Game-specific validation rules
│           └── components/    → Game-specific UI components
│
├── web/                       → @armoury/web (Next.js 15)
│   └── src/
│       ├── app/               → Next.js App Router (routes only)
│       │   └── [locale]/[gameSystem]/
│       │       ├── (marketing)/   → Public pages
│       │       ├── (app)/         → Authenticated app pages
│       │       │   ├── armies/
│       │       │   ├── matches/
│       │       │   └── campaigns/
│       │       └── reference/     → Game reference data
│       ├── components/        → React components (web-specific)
│       │   ├── shared/        → Cross-feature components
│       │   ├── armies/        → Army builder components
│       │   ├── matches/       → Match play components
│       │   ├── campaigns/     → Campaign components
│       │   └── reference/     → Reference data components
│       ├── dal/               → Data Access Layer (Server-only)
│       ├── lib/               → Library wrappers (auth0, queryClient)
│       ├── hooks/             → Custom React hooks
│       ├── utils/             → Web-specific utilities
│
├── mobile/                    → @armoury/mobile (Expo 53)
│   └── src/
│       ├── app/               → Expo Router (file-based routing)
│       ├── components/        → React Native components
│       │   ├── shared/        → Cross-feature components
│       │   └── ...            → Feature-grouped (mirrors web structure)
│       ├── hooks/             → Mobile-specific hooks
│       ├── utils/             → Mobile-specific utilities
│
└── ui/                        → @armoury/ui (shared design system — future)
    └── src/
        ├── web/               → Radix + Tailwind + CVA implementations
        ├── mobile/            → Tamagui implementations
        └── types.ts           → Shared prop interfaces
```

---

## 2. Naming Conventions

| Entity                    | Convention                               | Examples                            |
| ------------------------- | ---------------------------------------- | ----------------------------------- |
| **React components**      | PascalCase file + PascalCase folder      | `ArmyBuilder/ArmyBuilder.tsx`       |
| **Data models**           | PascalCase matching the class            | `FactionDataModel.ts`               |
| **Functions / utilities** | camelCase                                | `xmlParser.ts`, `dataManager.ts`    |
| **Constants**             | UPPER_SNAKE_CASE                         | `MAX_RETRIES`, `DEFAULT_USER_AGENT` |
| **Hooks**                 | camelCase with `use` prefix              | `useArmyQuery.ts`                   |
| **Type files**            | camelCase or PascalCase matching content | `types.ts`, `ArmyTypes.ts`          |
| **Test files**            | `*.test.ts` / `*.test.tsx`               | `ArmyBuilder.test.tsx`              |
| **Fixture factories**     | `make*` prefix in `__fixtures__/`        | `makeArmy.ts`                       |
| **Mock files**            | Colocated in `__mocks__/`                | `__mocks__/db.ts`                   |

**Component folders** always contain at minimum:

```
ComponentName/
├── ComponentName.tsx      → The component itself (one component per file)
├── types.ts               → Component-specific types/interfaces
├── styles.ts              → Component-specific styling (CVA variants, Tailwind)
├── index.ts               → Barrel export
├── __tests__/
│   └── ComponentName.test.tsx
└── __mocks__/             → Optional — colocated mocks
```

> **Rule**: Never put the component implementation in `index.ts`. The index file is a barrel — it re-exports from the component file.

---

## 3. Import Rules

### Extension Rules

| Import Type          | Extension      | Why                                                                     |
| -------------------- | -------------- | ----------------------------------------------------------------------- |
| **Relative imports** | `.ts` / `.tsx` | TypeScript rewrites these automatically                                 |
| **Aliased imports**  | `.js` / `.jsx` | TypeScript cannot rewrite non-relative paths in `.d.ts` output (TS2877) |

### Import Order

1. External packages (`react`, `vitest`, `@tanstack/react-query`)
2. Aliased internal (`@shared/types/enums.js`, `@web/src/dal/armies.js`)
3. Relative (`./ArmyCard.ts`, `../hooks/useArmy.ts`)

```typescript
// ✅ Correct
import { Suspense } from 'react';
import type { Army } from '@armoury/models';
import { getArmies } from '@web/src/dal/armies.js';
import { ArmyCard } from './ArmyCard.js';

// ❌ Wrong — .ts extension on aliased import
import type { Army } from '@armoury/models';

// ❌ Wrong — relative when alias is available
import type { Army } from '../../shared/models/Army.js';
```

### Path Aliases

| Alias          | Resolves To                  | Available In                                  |
| -------------- | ---------------------------- | --------------------------------------------- |
| `@shared/*`    | `src/shared/*`               | All workspaces                                |
| `@streams/*`   | `src/shared/streams/*`       | `@armoury/streams` only                       |
| `@wh40k10e/*`  | `src/systems/src/wh40k10e/*` | `@armoury/systems`, `@armoury/shared` (tests) |
| `@web/*`       | `src/web/*`                  | `@armoury/web` only                           |
| `@mobile/*`    | `src/mobile/*`               | `@armoury/mobile` only                        |
| `@campaigns/*` | `src/services/campaigns/*`   | `@armoury/campaigns` only                     |

---

## 4. Component File Organization

### Principle: Components are organized by domain, not by type

**Do NOT** group by generic type (`/buttons/`, `/modals/`, `/forms/`).
**DO** group by feature domain (`/armies/`, `/matches/`, `/reference/`).

Cross-feature components live in `/shared/`.

### Decision: Where does a component go?

```
Is the component used across multiple feature domains?
├── YES → src/{web|mobile}/src/components/shared/{ComponentName}/
└── NO
    Is it specific to one feature domain?
    ├── YES → src/{web|mobile}/src/components/{domain}/{ComponentName}/
    └── Is it game-system-specific?
        ├── YES → src/systems/src/{gameSystem}/components/{ComponentName}/
        └── Is it a design system primitive (Button, Dialog, etc.)?
            └── YES → src/ui/src/{web|mobile}/{ComponentName}/
```

### Platform Split

| Concern             | Web                                     | Mobile                              |
| ------------------- | --------------------------------------- | ----------------------------------- |
| **UI primitives**   | Radix + Tailwind v4 + CVA               | Tamagui                             |
| **Components path** | `src/web/src/components/`               | `src/mobile/src/components/`        |
| **Routing**         | Next.js App Router (`src/web/src/app/`) | Expo Router (`src/mobile/src/app/`) |
| **Shared logic**    | Import from `@shared/*`                 | Import from `@shared/*`             |

> **Shared frontend modules** (`src/shared/frontend/`) are pure TypeScript — no React, no JSX. They define interfaces and utilities consumed by both platforms.

---

## 5. Where to Put New Code (Decision Tree)

```
What are you creating?
│
├── React Component
│   ├── Is it a design system primitive (Button, Dialog, Select)?
│   │   └── src/ui/src/{web|mobile}/{ComponentName}/
│   ├── Is it used across 2+ feature domains?
│   │   └── src/{web|mobile}/src/components/shared/{ComponentName}/
│   ├── Is it game-system-specific?
│   │   └── src/systems/src/{gameSystem}/components/{ComponentName}/
│   └── Is it feature-specific?
│       └── src/{web|mobile}/src/components/{domain}/{ComponentName}/
│
├── Custom Hook
│   ├── Is it web-specific (or platform-agnostic)?
│   │   └── src/web/src/hooks/
│   │       (Hooks depend on React APIs and belong in platform workspaces.
│   │        For hooks shared across web and mobile, duplicate or extract to
│   │        a future @armoury/ui package.)
│   └── Is it mobile-specific?
│       └── src/mobile/src/hooks/
│
├── Utility Function
│   ├── Is it platform-agnostic?
│   │   └── src/shared/frontend/utils/ (or src/shared/types/ for type utils)
│   ├── Is it web-specific?
│   │   └── src/web/src/utils/
│   └── Is it mobile-specific?
│       └── src/mobile/src/utils/
│
├── Data Access (DAL function / Server-only)
│   └── src/web/src/dal/  (Server Components only — not available on client)
│
├── API Client
│   └── src/shared/clients/{serviceName}/
├── Type / Interface / Enum
│   ├── Is it core/cross-cutting?
│   │   └── src/shared/types/
│   ├── Is it game-system-specific?
│   │   └── src/systems/src/{gameSystem}/types/
│   └── Is it component-scoped?
│       └── Colocated: {ComponentName}/types.ts
│
└── Library Wrapper (auth0, queryClient, analytics)
    └── src/{web|mobile}/src/lib/
```

---

## 6. Utils vs. Libs vs. Helpers

| Directory  | Purpose                                                       | Examples                                                               | Rules                                                                                     |
| ---------- | ------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `utils/`   | Pure functions — no side effects, no I/O                      | `formatDate()`, `slugify()`, `parseGameSystem()`                       | Stateless, easily testable, no imports from `lib/`                                        |
| `lib/`     | Library wrappers — configure and export third-party instances | `auth0.ts` (Auth0 client), `queryClient.ts` (TanStack), `analytics.ts` | Singleton instances, may have side effects on import                                      |
| `helpers/` | **Do not use.**                                               | —                                                                      | `helpers/` is banned. Use `utils/` for pure functions or `lib/` for configured instances. |
| `dal/`     | Data Access Layer — server-only functions                     | `getArmies()`, `getCachedFactions()`                                   | Only imported from Server Components or Server Actions                                    |

> **Rule of thumb**: If it creates or configures an instance → `lib/`. If it transforms data → `utils/`. If it fetches data → `dal/`.

---

## 7. Shared UI Component Registry

Master index of all 27 shared `@armoury/ui` components. For full implementation details, see [PHASE_0_SHARED_PREREQUISITES.md §12](./plan/PHASE_0_SHARED_PREREQUISITES.md).

### Tier A — Radix-Based Primitives

| #   | Component          | Radix Base                    | Usage Phases |
| --- | ------------------ | ----------------------------- | ------------ |
| 1   | Button             | `@radix-ui/react-slot`        | 1–5          |
| 2   | Dialog             | `@radix-ui/react-dialog`      | 2, 3, 4      |
| 3   | Drawer             | `@radix-ui/react-dialog`      | 1–5          |
| 4   | DrawerStack        | Composition                   | 1, 2, 5      |
| 5   | Popover            | `@radix-ui/react-popover`     | 1, 3, 4      |
| 6   | Select             | `@radix-ui/react-select`      | 2, 3         |
| 7   | Toast / ToastStack | `@radix-ui/react-toast`       | 1–5          |
| 8   | Checkbox           | `@radix-ui/react-checkbox`    | 2, 4         |
| 9   | RadioGroup         | `@radix-ui/react-radio-group` | 3            |
| 10  | Switch             | `@radix-ui/react-switch`      | 4            |
| 11  | Separator          | `@radix-ui/react-separator`   | 2, 5         |

### Tier B — Custom Shared Components

| #   | Component        | Defined In             | Usage Phases |
| --- | ---------------- | ---------------------- | ------------ |
| 12  | ShellLayout      | SHARED_COMPONENTS §3.1 | 1–5          |
| 13  | Navigation       | SHARED_COMPONENTS §3.2 | 1–5          |
| 14  | ProfilePopover   | SHARED_COMPONENTS §3.5 | 1            |
| 15  | ThemeProvider    | SHARED_COMPONENTS §3.3 | 1–5          |
| 16  | UnitDetailDrawer | SHARED_COMPONENTS §3.6 | 1, 2, 5      |
| 17  | ErrorBoundary    | Phase 1                | 1–5          |
| 18  | SuspenseQuery    | Phase 1                | 1–5          |

### Tier C — Presentational Atoms

| #   | Component            | Usage Phases |
| --- | -------------------- | ------------ |
| 19  | CardSkeleton         | 1, 2, 4      |
| 20  | ListItemSkeleton     | 1, 2, 5      |
| 21  | DrawerHeaderSkeleton | 1, 2, 5      |
| 22  | StatTableSkeleton    | 2, 5         |
| 23  | WeaponTableSkeleton  | 2, 5         |
| 24  | IconButton           | 2, 3, 4      |
| 25  | Badge                | 2, 3, 4, 5   |
| 26  | Chip                 | 3, 4         |
| 27  | Avatar               | 4            |

**Tier key**: **A** = Radix primitive + CVA styling + shared props interface · **B** = Custom game-agnostic logic · **C** = Stateless presentational atoms

---

## 8. Route File Conventions (Next.js App Router)

Every route segment can contain these special files. They are **not components** — they are route-level configuration files that Next.js uses to construct the rendering tree.

| File            | Purpose                                       | Export                             |
| --------------- | --------------------------------------------- | ---------------------------------- |
| `page.tsx`      | Route content                                 | `default` (required)               |
| `layout.tsx`    | Shared wrapper (persists across navigations)  | `default`                          |
| `loading.tsx`   | Suspense fallback for the page                | `default`                          |
| `error.tsx`     | Error boundary for the segment                | `default` (must be `'use client'`) |
| `not-found.tsx` | 404 UI for the segment                        | `default`                          |
| `template.tsx`  | Like layout but re-mounts on navigation       | `default`                          |
| `route.ts`      | API endpoint (cannot coexist with `page.tsx`) | `GET`, `POST`, etc.                |

**Route segment config exports** (in `page.tsx` or `layout.tsx`):

```typescript
// Static generation with ISR
export const revalidate = 3600; // seconds
export const dynamic = 'auto'; // 'auto' | 'force-dynamic' | 'error' | 'force-static'
export const dynamicParams = true;
export const fetchCache = 'auto';

// For PPR routes (experimental)
export const experimental_ppr = true;
```

**Key rule**: Route files (`page.tsx`, `layout.tsx`, etc.) should be thin orchestrators. They fetch data and compose components — they should not contain complex UI logic. Push UI into the `components/` directory.

```typescript
// ✅ Correct — page is an orchestrator
// app/[locale]/[gameSystem]/(app)/armies/page.tsx
export default async function ArmiesPage() {
    const session = await auth0.getSession();
    const armies = await getArmies(session.user.sub);
    return <ArmyList armies={armies} />;
}

// ❌ Wrong — page contains complex UI logic
export default async function ArmiesPage() {
    const session = await auth0.getSession();
    const armies = await getArmies(session.user.sub);
    return (
        <main>
            {/* 200 lines of JSX that should be in a component */}
        </main>
    );
}
```

---

**End of Frontend File Organization Guide**
