# Phase 1 — Foundation (Weeks 1-3)

> Phase: 1 | Timeline: Weeks 1-3 | Pages: 5
> Stories: 12 | UX Issues: 8 | Conflicts: C-03

## Overview

Phase 1 builds the structural skeleton every other phase depends on. Without the authenticated shell, navigation, and landing page, no game-scoped page can render. Without the Forge and Army Creation, all army-building work in Phase 2 has nowhere to live.

This phase ships five things: the app shell and navigation wrapper, Auth0 integration with conflict-resolved unauthenticated access rules, the public landing page with game system selector, the army list (The Forge), and the army creation flow. These are the only pages that can be built in true isolation — they carry no upstream Phase 2 dependencies.

**Constraint F** applies to everything in this phase: the shell must be game-agnostic. No direct game-system plugin imports in shell or navigation components.

---

## Cross-References

- Parent: `docs/frontend/FRONTEND_PLAN.md`
- Pre-requisites: [PHASE_0_SHARED_PREREQUISITES.md](PHASE_0_SHARED_PREREQUISITES.md) (adapter contracts, context scaffolds, query factory shells), [SHARED_COMPONENTS.md](SHARED_COMPONENTS.md) (shell consumes §3.1, §3.2, §3.3, §3.6, §3.8, §3.9, §3.10), [NEXTJS_RENDERING_STRATEGY.md](../NEXTJS_RENDERING_STRATEGY.md) (rendering decisions for shell and landing pages)
- Downstream: Phases 2-5 all depend on shell, auth, and navigation being stable before any page work starts

---

## Pages

### 4.1 Shell + Navigation

**Route:** Layout wrapper (no dedicated route)
**Complexity:** M | **Estimated Effort:** 5 days (combined with shared components §3.1, §3.2, §3.3)
**Blocked by Missing Mockups:** No

**Requirements:** GLB-001 through GLB-008, GLB-013, PLG-001, PLG-004

**UX Issues:** G-01 through G-15 (see Shared Components for full breakdown; Phase 1 delivery satisfies foundational layout constraints G-01, G-04, G-09, G-10)

**Implementation Notes:**

- Next.js App Router root layout with `[gameSystem]` dynamic segment for all game-scoped routes.
- Expo Router tab layout mirrors web navigation structure.
- Responsive shell: side nav at >=768px, bottom tab bar at <768px (US-GLB-09, US-GLB-10).
- Profile popover in header via Radix Popover (web) or Tamagui Sheet (mobile).
- Theme provider wraps entire app. Game-system tokens are injected via React context, never hardcoded.
- Skeleton loaders and error boundaries integrated at layout level (US-GLB-02).
- Nested pages must not show the top-level header; use breadcrumbs instead (G-10).
- Left nav collapsible on desktop and tablet (G-09).

**Acceptance Criteria:**

- Shell renders on web at 320px, 768px, 1024px, and 1440px without horizontal scroll.
- Bottom tab bar appears below 768px; side nav appears at or above 768px.
- Profile popover opens and shows username, logout, and placeholder for friend code.
- Game-system token injection is verified by switching stub plugins in tests.
- No game-system-specific imports exist in shell or navigation source files.

---

### 4.2 Authentication (Auth0)

**Route:** `/login`
**Complexity:** M | **Estimated Effort:** 3 days
**Blocked by Missing Mockups:** No

**Requirements:** AUTH-001 through AUTH-008, SEC-001 through SEC-005

**Conflict C-03 Resolution — Unauthenticated Web Access to References:**

The plan previously implied all `/[gameSystem]/*` routes required authentication. Stories (L-03, US-AUTH-005) and the conflict analysis clarify the rule: the landing page (`/`) is fully public. All `/[gameSystem]/*` routes require authentication _except_ `/[gameSystem]/references`, which is the one unauthenticated-accessible game-scoped route on web (not mobile). Auth middleware checks the route pattern, not just token existence. A read-only banner is shown for unauthenticated users on the references route; create and edit actions are blocked with an auth prompt. No personal data endpoints are called while unauthenticated.

**Implementation Notes:**

- Auth0 Universal Login redirect flow — no custom login form.
- Web: `@auth0/auth0-spa-js` with PKCE. Mobile: `react-native-auth0`.
- Protected route middleware in Next.js performs server-side session check against route pattern.
- Expo Router auth guard with secure token storage via expo-secure-store.
- Token refresh handled by Auth0 SDK. Access token attached to API calls via interceptor.
- Post-login redirect to last visited page or default (`/[gameSystem]/armies`).
- Playwright E2E tests run against Auth0 test tenant.

**Acceptance Criteria:**

- Unauthenticated users can access `/` and `/[gameSystem]/references` on web.
- All other `/[gameSystem]/*` routes redirect unauthenticated users to `/login`.
- Post-login redirect restores the originally requested URL.
- Read-only banner renders on the references route when unauthenticated.
- Mobile routes are fully gated; no unauthenticated game-scoped access on mobile.

---

### 4.3 Landing / Game System Selector

**Route:** `/`
**Complexity:** S | **Estimated Effort:** 2 days
**Blocked by Missing Mockups:** No

**Requirements:** GSS-001 through GSS-006, GLB-009

**User Stories:**

| Story ID | Description                                                                       | Status                  |
| -------- | --------------------------------------------------------------------------------- | ----------------------- |
| US-LP-01 | View landing page (app name, tagline, game system tiles, CTA)                     | MAPPED                  |
| US-LP-02 | Select a game system, navigates to `/armies`                                      | MAPPED                  |
| US-LP-03 | View unauthenticated landing page (feature overview, auth buttons, no app access) | MAPPED                  |
| US-LP-04 | Scene illustrations on landing page (WebP, lazy-loaded, responsive)               | MAPPED                  |
| US-LP-05 | Hide unavailable game systems (`GameSystem.status !== 'available'`)               | MAPPED                  |
| US-LP-06 | Clear registration CTA (descriptive text, prominent, primary color)               | PARTIAL — see gap below |

**Gap fix — US-LP-06:** The original plan notes an Auth0 CTA but does not prescribe copy, placement, or styling. The CTA must use the primary accent color, appear above the fold for unauthenticated users, and include descriptive text that communicates the app's value proposition before a visitor registers.

**UX Issues:**

- **L-01** (🔴 Blocking): Game system tiles use full-bleed scene illustration as background, not a flat card. WebP format only; no trademark-violating imagery (G-06 applies).
- **L-02** (🟡 Important): Remove "Planned" tag from unavailable game system tiles. Tiles for unavailable systems are rendered but visually disabled with no label.
- **L-03** (🟡 Important): Add registration copy to the landing page for new visitors. Satisfies the US-LP-06 gap above.

**Implementation Notes:**

- Game system selection grid. V1 supports only Warhammer 40K 10th Edition, but the tile grid renders generically to establish the multi-system pattern.
- Plugin registry provides game system metadata: name, icon, description, theme tokens.
- Selecting a game system navigates to `/[gameSystem]/armies` (The Forge).
- Selection persists to user preferences (server-side for authenticated users; localStorage for anonymous).
- If offline before first sync, show offline indicator and disable selection until local data exists.
- Mobile: identical flow via Expo Router, full-screen selector.
- Scene illustrations (US-LP-04): at least one hero image above the fold, served as WebP, lazy-loaded below the fold, responsive across all breakpoints. All imagery must be AI-generated (G-06).

**Acceptance Criteria:**

- Game system tiles render with full-bleed scene illustrations on all breakpoints.
- No "Planned" label appears on any tile.
- Registration CTA is visible above the fold for unauthenticated users and uses the primary accent color.
- Selecting an available tile navigates to `/wh40k10e/armies`.
- Unavailable tiles are non-interactive.
- Scene illustrations load as WebP and are lazy-loaded below the fold.

---

### 4.4 The Forge (Army List)

**Route:** `/[gameSystem]/armies`
**Complexity:** M | **Estimated Effort:** 4 days
**Blocked by Missing Mockups:** No

**Requirements:** ARM-001 through ARM-010, ARM-100 through ARM-104, DLP-001

**User Stories:**

| Story ID  | Description                                                | Status                        |
| --------- | ---------------------------------------------------------- | ----------------------------- |
| US-APG-05 | Duplicate an army                                          | MISSING — added in this phase |
| US-APG-06 | Delete an army with confirmation, block if in active match | PARTIAL — gap fixed below     |
| US-APG-19 | Unit count badge on army list cards                        | PARTIAL — gap fixed below     |

**Gap fix — US-APG-05 (MISSING):** Neither the Forge (§4.4) nor Army Detail (§5.1) previously mentioned a duplicate action. The context menu (web) and swipe action (mobile) must include a **Duplicate** option. It creates a copy of the army with the same faction, detachment, units, and point limit, appends " (Copy)" to the name, and navigates to the duplicated army on success.

**Gap fix — US-APG-06 (PARTIAL):** Delete with confirmation was covered. The missing piece: attempting to delete an army currently assigned to an active or in-progress match must show an error dialog explaining the army cannot be deleted until the match is completed.

**Gap fix — US-APG-19 (PARTIAL):** Unit count was listed as a card field but not specified as a badge. Unit count must render as a badge element (distinct visual treatment from plain text) on each army card.

**UX Issues:**

- **F-01** (🟡 Important): Deploy buttons on army cards use primary styling with a crossed-swords icon. This is the primary CTA on the card; subordinate actions (edit, duplicate, delete) use secondary or ghost styling.
- **F-02** (🟡 Important): Army cards show a faction splash image as the card background or a prominent visual element. All faction imagery must be AI-generated (G-06).

**Implementation Notes:**

- Card layout: army name, faction, point total, unit count badge (US-APG-19), last modified date.
- Sort and filter controls: by name, by date modified, by faction, by point total.
- Empty state for new users with a prominent "Create Army" CTA.
- Swipe-to-delete on mobile with confirmation. Context menu on web for delete and duplicate.
- Army cards navigate to the Army Detail page on tap.
- Render-as-you-fetch with skeleton placeholders during load.
- FAB or header action for "New Army" navigating to `/[gameSystem]/armies/new`.
- Cached list shown with offline indicator when offline and cached data exists.

**Acceptance Criteria:**

- Each army card shows name, faction, point total, unit count badge, and last modified date.
- Faction splash image renders on every card.
- Deploy button uses primary styling with crossed-swords icon.
- Duplicate action appears in context menu (web) and swipe actions (mobile) and produces a correctly named copy.
- Delete confirmation dialog appears before removal.
- Deleting an army assigned to an active match shows an error dialog and does not proceed.
- Empty state renders with "Create Army" CTA when the army list is empty.

---

### 4.5 Army Creation Page

**Route:** `/[gameSystem]/armies/new`
**Complexity:** M | **Estimated Effort:** 3 days
**Blocked by Missing Mockups:** No

**Requirements:** ARM-011 through ARM-020, PLG-002

**User Stories:**

| Story ID  | Description                                                     | Status                        |
| --------- | --------------------------------------------------------------- | ----------------------------- |
| US-APG-08 | Create a new army (faction, battle size, army name)             | MAPPED                        |
| US-APG-09 | Select a detachment for the army                                | MAPPED                        |
| US-APG-12 | Conditional detachment selector (hidden if only one detachment) | MISSING — added in this phase |

**Gap fix — US-APG-12 (MISSING):** The plan described a detachment selector but did not specify conditional display. If the chosen faction has only one valid detachment, the selector must be hidden and the detachment auto-selected. This must be handled by the game system plugin; the form component receives a `detachments` array and hides the field when the array has exactly one entry.

**UX Issues:**

- **AC-01** (🔴 Blocking): The detachment selector is hidden until a faction is selected. A faction must be known before detachments are meaningful. The form field must not render (or renders disabled and empty) until `factionId` is populated.
- **AC-02** (🟢 DEFERRED): Reference the WH40K app army creation flow for UX inspiration. This is design guidance only — no concrete implementation change. Deferred to design review before Phase 3.

**Implementation Notes:**

- Multi-step form: select faction, enter army name, set point limit, select detachment (conditional on faction).
- Faction list provided by game system plugin via bsdata catalog for WH40K 10e.
- Detachment selector renders only after faction is selected (AC-01). When only one detachment exists for the chosen faction, the field is hidden and the detachment is auto-selected (US-APG-12).
- Validation: army name required, point limit within game system bounds (VAL-001).
- On submit: create army record via `@armoury/data`, navigate to Army Detail page.
- Mobile: identical form flow using Tamagui form components.

**Acceptance Criteria:**

- Detachment selector is not visible before a faction is selected.
- Selecting a faction populates and reveals the detachment selector.
- When only one detachment exists for the selected faction, the selector is hidden and the detachment is auto-selected.
- Form cannot be submitted without an army name and a valid point limit.
- Successful submission creates an army record and navigates to the Army Detail page.
- Form renders and functions identically on mobile.

---

## Story Coverage Matrix

| Story ID  | Description                                  | Page | Status  | Notes                                                                 |
| --------- | -------------------------------------------- | ---- | ------- | --------------------------------------------------------------------- |
| US-LP-01  | View landing page                            | §4.3 | MAPPED  |                                                                       |
| US-LP-02  | Select game system                           | §4.3 | MAPPED  |                                                                       |
| US-LP-03  | Unauthenticated landing page                 | §4.3 | MAPPED  |                                                                       |
| US-LP-04  | Scene illustrations (WebP, lazy, responsive) | §4.3 | MAPPED  |                                                                       |
| US-LP-05  | Hide unavailable game systems                | §4.3 | MAPPED  |                                                                       |
| US-LP-06  | Clear registration CTA                       | §4.3 | PARTIAL | Gap fixed: prescribed copy tone, placement, and primary color styling |
| US-APG-05 | Duplicate an army                            | §4.4 | MISSING | Added: context menu + swipe, appends " (Copy)", navigates on success  |
| US-APG-06 | Delete army with confirmation                | §4.4 | PARTIAL | Gap fixed: added active-match block with error dialog                 |
| US-APG-08 | Create a new army                            | §4.5 | MAPPED  |                                                                       |
| US-APG-09 | Select a detachment                          | §4.5 | MAPPED  |                                                                       |
| US-APG-12 | Conditional detachment selector              | §4.5 | MISSING | Added: hidden when single detachment; driven by plugin adapter        |
| US-APG-19 | Unit count badge on army cards               | §4.4 | PARTIAL | Gap fixed: specified as a badge element, not plain text               |

---

## UX Issue Resolution Matrix

| Issue ID | Description                                                  | Severity     | Decision    | Page   |
| -------- | ------------------------------------------------------------ | ------------ | ----------- | ------ |
| L-01     | Game system tiles: full-bleed scene illustration             | 🔴 Blocking  | INCORPORATE | §4.3   |
| L-02     | Remove "Planned" tag from unavailable tiles                  | 🟡 Important | INCORPORATE | §4.3   |
| L-03     | Add registration copy for new visitors                       | 🟡 Important | INCORPORATE | §4.3   |
| F-01     | Deploy button: primary style, crossed-swords icon            | 🟡 Important | INCORPORATE | §4.4   |
| F-02     | Army cards: faction splash as background or prominent visual | 🟡 Important | INCORPORATE | §4.4   |
| AC-01    | Detachment hidden until faction selected                     | 🔴 Blocking  | INCORPORATE | §4.5   |
| AC-02    | Reference WH40K app flow for army creation UX                | 🟢 Guidance  | DEFERRED    | §4.5   |
| G-06     | No trademark violations; all imagery must be AI-generated    | 🔴           | INCORPORATE | Global |

---

## Phase 1 Dependencies

**This phase depends on:**

- `docs/frontend/SHARED_COMPONENTS.md` — Shell (§4.1) is assembled from §3.1 Shell Layout, §3.2 Navigation, §3.3 Profile Popover. The Forge (§4.4) requires Card primitives (§3.8) and Skeleton loaders (§3.6). Army Creation (§4.5) requires Form components (§3.10) and Data loading patterns (§3.9). These shared components must be spec'd and started in parallel with Phase 1 (Weeks 1-3).

**Phases 2-5 depend on this phase:**

- Phase 2 (Core Army Building): Army Detail page and Unit Add Modal require the authenticated shell, the Forge route, and Army Creation to exist as navigation targets.
- Phase 3 (Match Play): Match creation, War Ledger, and active match views all operate within the game-scoped shell established here.
- Phase 4 (Campaigns): Campaign pages require the same shell and auth infrastructure.
- Phase 5 (Profile and References): The References page uses the C-03 unauthenticated access rule defined in §4.2.

---

## State Management for Phase 1

This phase introduces the foundational state entities. See [State Management Architecture](./STATE_MANAGEMENT.md) for the complete decision tree.

### Tier 1: Local UI State (`useState`)

Local component state for UI chrome — modals, drawers, form inputs. Each state is scoped to a single component or small subtree.

| Entity                              | Component(s)                  | Notes                                   |
| ----------------------------------- | ----------------------------- | --------------------------------------- |
| Filter panel expanded/collapsed     | `ArmyListFilterPanel`         | Simple boolean toggle                   |
| Army creation form inputs           | `ArmyCreationForm`            | Field values, validation display state  |
| Profile popover open/close          | `ProfilePopover`              | Shell-level UI state                    |
| Mobile navigation drawer open/close | `NavigationDrawer`            | Shell-level UI state                    |
| Confirm dialog open/close           | `ConfirmDialog` (army delete) | Two-state toggle with match-block guard |

### Tier 2: URL State

State that survives refresh and is shareable via URL.

| Entity                     | Route/Params                     | Stories                                    |
| -------------------------- | -------------------------------- | ------------------------------------------ |
| Selected game system       | `/[gameSystem]/...` path segment | US-LND-03, US-LND-04                       |
| Army list filters (future) | `?faction=...&points=...`        | Prepared in Phase 1, fully used in Phase 2 |

### Tier 3: Remote State (React Query)

All server/async data. Cached, auto-refetched based on staleness.

| Entity                  | Query Key Factory                     | Caching Strategy                                     | Stories                         |
| ----------------------- | ------------------------------------- | ---------------------------------------------------- | ------------------------------- |
| Auth session            | `sessionOptions`                      | `staleTime: 0` — always fresh; silent refresh on 401 | US-AUTH-01 through US-AUTH-04   |
| User account data       | `accountOptions(userId)`              | `staleTime: 300_000` (5 min)                         | US-AUTH-01                      |
| Army list (The Forge)   | `armyListOptions()`                   | `staleTime: 60_000`; invalidate on create/delete     | US-APG-01, US-APG-02, US-APG-03 |
| Army creation mutation  | `createArmyMutation`                  | Invalidates `armyListOptions` on success             | US-APG-10, US-APG-11, US-APG-12 |
| Game system plugin data | Loaded via `DataContext` (see Tier 5) | Static — loaded once per app session                 | US-LND-03                       |

### Tier 5: Global Non-Reactive State (Context)

Dependency injection for stable singletons. Set once at boot, read everywhere.

| Entity                              | Provider              | Why Context                                                                                                                                                                                     |
| ----------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GameSystemContext` (active plugin) | `GameSystemProvider`  | Complex object (functions, closures) — not serializable to URL; not remote data; not reactive. Canonical DI. See [STATE_MANAGEMENT.md §8](./STATE_MANAGEMENT.md#8-react-context--when-and-why). |
| `DataContext` (data access adapter) | `DataContextProvider` | Infrastructure singleton required before any query runs. See [STATE_MANAGEMENT.md §8.2](./STATE_MANAGEMENT.md#82-the-datacontextprovider-pattern).                                              |

> **Note:** Phase 1 introduces no Tier 4 (RxJS) state. Real-time reactive state begins in Phase 3.

### Cross-References

- [State Management Architecture](./STATE_MANAGEMENT.md) — Complete state hierarchy and decision tree
- [§6 React Query](../REACT_QUERY.md) — Server state caching, mutations, optimistic updates
- [§8 Context](./STATE_MANAGEMENT.md#8-react-context--when-and-why) — Context DI patterns and justification requirement
- [§11 Testing](../STATE_TESTING.md) — Testing each state tier

---

## Acceptance Criteria

Phase 1 is complete when all of the following are true:

1. The app shell renders without errors on web (320px to 1440px) and mobile; no horizontal scroll at any breakpoint.
2. Auth0 login and logout flows complete end-to-end on both platforms.
3. Unauthenticated users can access `/` and `/[gameSystem]/references` on web; all other game-scoped routes redirect to `/login`.
4. The landing page displays game system tiles with full-bleed illustrations, no "Planned" tags, and a visible registration CTA in primary color.
5. The Forge renders an army list with faction splash cards, unit count badges, and Deploy buttons in primary style; duplicate and delete (with match-block guard) function correctly.
6. Army Creation form enforces the faction-first detachment rule (AC-01) and hides the detachment selector for single-detachment factions (US-APG-12).
7. All 12 assigned stories have passing acceptance tests.
8. `lsp_diagnostics` reports no errors on changed files.
9. `turbo run typecheck --filter=@armoury/web --filter=@armoury/mobile` passes clean.

## Acceptance Test Checklist

> These tests verify Phase 1 is complete. Each item maps to a specific acceptance criterion or component defined above.

### End-to-End Acceptance Tests

- [ ] Unauthenticated user visiting `/[gameSystem]/armies` is redirected to `/login`; after Auth0 login completes, they are returned to the original route.
- [ ] Auth0 logout flow clears the session cookie and redirects to `/`; subsequent navigation to a protected route redirects to `/login` again.
- [ ] Game System Selector page at `/` renders all available game system tiles with full-bleed illustrations and no "Planned" tags visible.
- [ ] The Forge at `/[gameSystem]/armies` renders the army list with faction splash cards, unit count badges, and functional Deploy buttons.
- [ ] Duplicate army action on The Forge creates a copy with a "(Copy)" suffix and the new entry appears immediately in the list.
- [ ] Delete army on The Forge is blocked when the army has an in-progress match; the guard UI prevents deletion and shows an explanatory message.
- [ ] Army Creation form at `/[gameSystem]/armies/new` blocks submission when no faction is selected (AC-01 enforcement).
- [ ] Detachment selector is hidden for single-detachment factions (US-APG-12) and visible for multi-detachment factions.

### Component Tests (Orchestrational)

- [ ] `ShellContainer` resolves navigation items from the plugin registry and passes correct `navItems` to `ShellView` for the active game system.
- [ ] `LoginContainer` renders the Auth0 redirect button and does not render any credential input fields.
- [ ] `GameSystemSelectorContainer` fetches via `gameSystemsOptions`, passes hydrated tile data to the view, and shows skeleton loaders while loading.
- [ ] `ForgeContainer` fetches via `armyListOptions`, dispatches duplicate and delete mutations, and passes the `isDeleteBlocked` flag per army to the view.
- [ ] `ArmyCreationContainer` calls `factionListOptions` on mount, enforces faction-first selection before enabling the detachment field, and calls `createArmyMutation` on submit.

### Hook / Query Tests

- [ ] `gameSystemsOptions` query factory returns a correctly shaped list of game systems; stale-while-revalidate cache entry is invalidated after a forced sync.
- [ ] `armyListOptions` query factory returns armies sorted by last-modified descending; empty list resolves without error.
- [ ] `createArmyMutation` on success navigates to the new army's builder route and invalidates `armyListOptions`.
- [ ] `factionListOptions` filters out factions unavailable for the selected detachment context when a detachment is pre-selected.

### Accessibility Tests

- [ ] Shell sidebar navigation is fully keyboard-navigable: Tab moves focus through nav items, Enter activates links, collapsed sidebar exposes icon-only buttons with visible focus rings.
- [ ] Game System Selector tiles pass WCAG 2.1 AA color contrast on both the illustration overlay text and the registration CTA button.
- [ ] Army Creation form announces validation errors via `aria-describedby` on invalid fields; error messages are associated with their inputs and read by screen readers.

---

## Code Example: Orchestrational / Render Pattern

> This example demonstrates the mandatory container/view split for Phase 1.
> The orchestrational container owns all data fetching, mutations, and state.
> The render component receives everything via props and contains zero hooks except `useCallback`/`useMemo`.

```tsx
// File: src/web/app/[gameSystem]/forge/page.tsx

import { HydrationBoundary, dehydrate, useSuspenseQuery, useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import type { Army } from '@wh40k10e/models/ArmyModel.js';
import type { Faction } from '@wh40k10e/types/entities.js';
import { armyListOptions, factionListOptions } from '@shared/frontend/queries/armies.js';
import { deleteArmyMutation, duplicateArmyMutation } from '@shared/frontend/mutations/armies.js';
import { getQueryClient } from '@web/lib/queryClient.ts';

// ---------------------------------------------------------------------------
// Render component — pure props, zero data hooks
// ---------------------------------------------------------------------------

interface ForgeViewProps {
    armies: Army[];
    factions: Faction[];
    isLoading: boolean;
    sortKey: 'name' | 'updatedAt';
    onDeploy: (armyId: string) => void;
    onDuplicate: (armyId: string) => void;
    onDelete: (armyId: string) => void;
    onSortChange: (key: 'name' | 'updatedAt') => void;
}

export function ForgeView({
    armies,
    factions,
    isLoading,
    sortKey,
    onDeploy,
    onDuplicate,
    onDelete,
    onSortChange,
}: ForgeViewProps) {
    if (isLoading) return <div aria-busy="true">Loading armies…</div>;

    return (
        <section aria-label="Your Armies">
            <SortBar value={sortKey} onChange={onSortChange} />
            <ul className="grid grid-cols-2 gap-4">
                {armies.map((army) => (
                    <ArmyCard
                        key={army.id}
                        army={army}
                        faction={factions.find((f) => f.id === army.factionId)}
                        onDeploy={() => onDeploy(army.id)}
                        onDuplicate={() => onDuplicate(army.id)}
                        onDelete={() => onDelete(army.id)}
                    />
                ))}
            </ul>
        </section>
    );
}

// ---------------------------------------------------------------------------
// Orchestrational container — data, mutations, and derived state; no JSX
// ---------------------------------------------------------------------------

export function ForgeContainer({ gameSystem }: { gameSystem: string }) {
    const queryClient = useQueryClient();
    const [sortKey, setSortKey] = useState<'name' | 'updatedAt'>('updatedAt');

    const { data: armies = [] } = useSuspenseQuery(armyListOptions(gameSystem));
    const { data: factions = [] } = useSuspenseQuery(factionListOptions(gameSystem));

    const { mutate: deleteArmy } = useMutation(deleteArmyMutation(queryClient));
    const { mutate: duplicateArmy } = useMutation(duplicateArmyMutation(queryClient));

    const sorted = [...armies].sort((a, b) =>
        sortKey === 'name' ? a.name.localeCompare(b.name) : b.updatedAt.localeCompare(a.updatedAt),
    );

    const handleDeploy = useCallback(
        (armyId: string) => {
            window.location.href = `/${gameSystem}/army/${armyId}`;
        },
        [gameSystem],
    );

    return (
        <ForgeView
            armies={sorted}
            factions={factions}
            isLoading={false}
            sortKey={sortKey}
            onDeploy={handleDeploy}
            onDuplicate={(id) => duplicateArmy({ armyId: id })}
            onDelete={(id) => deleteArmy({ armyId: id })}
            onSortChange={setSortKey}
        />
    );
}

// ---------------------------------------------------------------------------
// Page — server component, prefetches data into HydrationBoundary
// ---------------------------------------------------------------------------

export default async function ForgePage({ params }: { params: { gameSystem: string } }) {
    const queryClient = getQueryClient();
    await Promise.all([
        queryClient.prefetchQuery(armyListOptions(params.gameSystem)),
        queryClient.prefetchQuery(factionListOptions(params.gameSystem)),
    ]);

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <ForgeContainer gameSystem={params.gameSystem} />
        </HydrationBoundary>
    );
}
```

---

## Component Architecture

### A. Component Inventory

This section maps each Phase 1 page to its concrete component tree. Each entry names the page-level component, its orchestrational container, the pure render components it owns, and the shared components it consumes from §3.x.

#### §4.1 Shell + Navigation

**Page-level component**

- `RootLayout` — `src/web/src/app/[gameSystem]/layout.tsx` (Next.js App Router root layout; default export required by framework). Wraps every game-scoped route with the full provider stack, shell chrome, and navigation.
- Mobile equivalent: `TabLayout` — `src/mobile/src/app/(tabs)/_layout.tsx`. Provides the Expo Router tab navigator with the same provider stack.

**Orchestrational container**

- `ShellContainer` — `src/web/src/components/shell/ShellContainer.tsx`. Reads active game system from `GameSystemContext`, resolves navigation items from the plugin registry, and forwards derived props to `ShellView`. On mobile, this role is split across the Expo Router layout file directly.

**Render / view components**

- `ShellView` — `src/web/src/components/shell/ShellView.tsx`. Props: `{ navItems: NavItem[]; user: User | null; sidebarCollapsed: boolean; onCollapseToggle: () => void; children: React.ReactNode }`. Composes the sidebar, top header, and main content slot.
- `SidebarNav` — `src/web/src/components/shell/SidebarNav.tsx`. Props: `{ items: NavItem[]; collapsed: boolean }`. Renders the navigation list with icon-only mode when collapsed.
- `TopHeader` — `src/web/src/components/shell/TopHeader.tsx`. Props: `{ user: User | null; onProfileOpen: () => void }`. Renders breadcrumbs, game system badge, and the profile popover trigger.

**Shared component dependencies**

- Shell Layout (§3.1), Navigation (§3.2), Profile Popover (§3.3), Theme Provider (§3.4), Skeleton Loaders (§3.6), Error Boundaries (§3.7).

#### §4.2 Auth0

**Page-level component**

- `LoginPage` — `src/web/src/app/login/page.tsx` (default export). Renders a full-screen centered card with the Auth0 Universal Login redirect button. No custom form fields — Auth0 hosts the credential entry. Auth0 SDK handles the redirect flow; this page is the entry point and post-login callback target.
- Route protection is handled by `src/web/src/middleware.ts` (Next.js middleware), which intercepts unauthenticated requests to game-scoped routes and redirects to `/login`. This is not a React component but is part of the Auth page implementation scope.

**Orchestrational container**

- `LoginContainer` — `src/web/src/components/auth/LoginContainer.tsx`. Reads the Auth0 session state, triggers the redirect, and handles the loading/error state before redirect completes.

**Render / view components**

- `LoginView` — `src/web/src/components/auth/LoginView.tsx`. Props: `{ onLogin: () => void; isLoading: boolean; error: string | null }`. Pure visual: centered card, primary CTA button, error message slot.

**Shared component dependencies**

- Error Boundaries (§3.7), Skeleton Loaders (§3.6) for the redirect loading state.

#### §4.3 Landing / Game System Selector

**Page-level component**

- `LandingPage` — `src/web/src/app/page.tsx` (default export). Renders the game system selector and registration CTA.
- Mobile equivalent: `LandingScreen` — `src/mobile/src/screens/LandingScreen.tsx` (named export). Same responsibility; adapts layout to Tamagui primitives.

**Orchestrational container**

- `GameSystemSelectorContainer` — `src/web/src/components/landing/GameSystemSelectorContainer.tsx`. Queries the plugin registry for available game systems via `useGameSystems()`, derives tile data, and forwards to `GameSystemGrid`.

**Render / view components**

- `GameSystemGrid` — `src/web/src/components/landing/GameSystemGrid.tsx`. Props: `{ systems: GameSystemTileData[]; onSelect: (id: string) => void }`. Renders the responsive tile grid.
- `GameSystemTile` — `src/web/src/components/landing/GameSystemTile.tsx`. Props: `{ system: GameSystemTileData; onSelect: (id: string) => void }`. Full-bleed illustration, name, and selection affordance. Accepts an `aria-label` built from the system name.
- `RegistrationCTA` — `src/web/src/components/landing/RegistrationCTA.tsx`. Props: `{ authenticated: boolean }`. Conditionally renders the sign-up prompt in primary color when the user is unauthenticated.

**Shared component dependencies**

- Skeleton Loaders (§3.6) for the tile loading state, Error Boundaries (§3.7), Theme Provider (§3.4) for color tokens.

#### §4.4 The Forge (Army List)

**Page-level component**

- `ForgePage` — `src/web/src/app/[gameSystem]/armies/page.tsx` (default export). SSR-prefetches the army list via `HydrationBoundary` + `armyListOptions` before handing off to `ForgeContainer`.

**Orchestrational container**

- `ForgeContainer` — `src/web/src/components/forge/ForgeContainer.tsx`. Reads URL search params (`?faction`, `?points`) for filter state (Tier 2), calls `useArmies(filters)` (Tier 3), exposes `createArmyMutation` and `deleteArmyMutation` to the view. Throws errors to the nearest Error Boundary.

**Render / view components**

- `ArmyListView` — `src/web/src/components/forge/ArmyListView.tsx`. Props: `{ armies: Army[]; isLoading: boolean; filters: ArmyFilters; onFilterChange: (f: ArmyFilters) => void; onDeploy: (id: string) => void; onDuplicate: (id: string) => void; onDelete: (id: string) => void }`. Renders the responsive grid and delegates to `ArmyCard`.
- `ArmyCard` — `src/web/src/components/forge/ArmyCard.tsx`. Props: `{ army: Army; onDeploy: () => void; onDuplicate: () => void; onDelete: () => void }`. Displays faction splash, army name, unit count badge, and action triggers.
- `ArmyCardActions` — `src/web/src/components/forge/ArmyCardActions.tsx`. Props: `{ onDeploy: () => void; onDuplicate: () => void; onDelete: () => void; hasActiveMatch: boolean }`. Renders the Deploy (primary), Duplicate, and Delete (guarded by match-block check) buttons.
- `ArmyFilterPanel` — `src/web/src/components/forge/ArmyFilterPanel.tsx`. Props: `{ filters: ArmyFilters; factions: Faction[]; onFilterChange: (f: ArmyFilters) => void }`. Collapsible filter drawer (Tier 1 open/close state lives here).

**Shared component dependencies**

- Shell Layout (§3.1), Navigation (§3.2), Skeleton Loaders (§3.6), Error Boundaries (§3.7), Empty States (§3.8), Confirmation Dialog (§3.9).

#### §4.5 Army Creation

**Page-level component**

- `ArmyCreationPage` — `src/web/src/app/[gameSystem]/armies/new/page.tsx` (default export). Prefetches the faction list before rendering. Redirects to The Forge on successful creation.

**Orchestrational container**

- `ArmyCreationContainer` — `src/web/src/components/army-creation/ArmyCreationContainer.tsx`. Calls `useFactions()` (Tier 3), owns `createArmyMutation`, handles form submission, and forwards props to `ArmyCreationForm`.

**Render / view components**

- `ArmyCreationForm` — `src/web/src/components/army-creation/ArmyCreationForm.tsx`. Props: `{ factions: Faction[]; onSubmit: (data: CreateArmyInput) => void; isSubmitting: boolean; errors: FormErrors | null }`. Renders the single-column form with name input, faction selector, and detachment selector.
- `FactionSelector` — `src/web/src/components/army-creation/FactionSelector.tsx`. Props: `{ factions: Faction[]; value: string | null; onChange: (id: string) => void }`. Radix Select with faction art thumbnails.
- `DetachmentSelector` — `src/web/src/components/army-creation/DetachmentSelector.tsx`. Props: `{ detachments: Detachment[]; value: string | null; onChange: (id: string) => void; hidden: boolean }`. Hidden when the selected faction has only one detachment (AC-01, US-APG-12).

**Shared component dependencies**

- Skeleton Loaders (§3.6), Error Boundaries (§3.7), Empty States (§3.8), Form Primitives (§3.10).

---

### B. State Management Tier Breakdown

Phase 1 uses state tiers 1, 2, 3, and 5 only. Tier 4 (RxJS reactive streams) is not introduced until Phase 3 (real-time match sync).

#### §4.1 Shell + Navigation

| Tier                | Usage                                                                                            | Rationale                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Tier 1 — `useState` | Sidebar collapsed/expanded, profile popover open                                                 | Ephemeral UI toggles; not shareable or server-relevant                                 |
| Tier 5 — Context    | `GameSystemContext` (active plugin), `DataContext` (data adapter), `ThemeProvider` (dark tokens) | Cross-cutting concerns that all descendants read; injected once at the layout boundary |

#### §4.2 Auth0

| Tier                    | Usage                                              | Rationale                                                            |
| ----------------------- | -------------------------------------------------- | -------------------------------------------------------------------- |
| Tier 3 — TanStack Query | Auth session state via `useSession()`              | Auth state is remote/async; TQ manages loading, error, and staleness |
| Tier 5 — Context        | Auth0 Provider injects session into the React tree | SDK-managed; not owned by application state                          |

#### §4.3 Landing / Game System Selector

| Tier                    | Usage                                              | Rationale                                                              |
| ----------------------- | -------------------------------------------------- | ---------------------------------------------------------------------- |
| Tier 1 — `useState`     | Tile hover state, selected system (pre-navigation) | Local, transient UI state with no persistence requirement              |
| Tier 3 — TanStack Query | Plugin registry metadata via `useGameSystems()`    | Plugin list is fetched async and may be stale; TQ handles caching      |
| Tier 5 — Context        | Plugin registry read via `GameSystemContext`       | Registry is injected at shell boundary; Landing reads, does not own it |

#### §4.4 The Forge

| Tier                    | Usage                                                                  | Rationale                                                                            |
| ----------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Tier 1 — `useState`     | Filter panel open/closed, delete confirmation dialog open              | Ephemeral UI state; no benefit to URL encoding                                       |
| Tier 2 — URL params     | `?faction`, `?points` filters                                          | Filter state should survive refresh and be shareable via URL                         |
| Tier 3 — TanStack Query | `armyListOptions(filters)`, `createArmyMutation`, `deleteArmyMutation` | All army data is remote; mutations use optimistic updates per §5 of CODING_STANDARDS |

#### §4.5 Army Creation

| Tier                    | Usage                                                                    | Rationale                                                                |
| ----------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Tier 1 — `useState`     | Controlled form inputs (name, faction, detachment), submit pending state | Form state is transient; destroyed on navigation                         |
| Tier 3 — TanStack Query | `useFactions()` for the faction list, `createArmyMutation`               | Faction list is remote; mutation handles loading/error/success lifecycle |

---

### C. Shared Component Reuse Mapping

The table below shows which shared components from §3.1-§3.10 each Phase 1 page consumes. A dot indicates the page depends on that component being implemented before or in parallel.

| Shared Component         | §4.1 Shell | §4.2 Auth | §4.3 Landing | §4.4 Forge | §4.5 Creation |
| ------------------------ | :--------: | :-------: | :----------: | :--------: | :-----------: |
| §3.1 Shell Layout        |    Yes     |           |              |            |               |
| §3.2 Navigation          |    Yes     |           |              |            |               |
| §3.3 Profile Popover     |    Yes     |           |              |            |               |
| §3.4 Theme Provider      |    Yes     |    Yes    |     Yes      |    Yes     |      Yes      |
| §3.5 Loading Spinner     |            |    Yes    |              |            |               |
| §3.6 Skeleton Loaders    |    Yes     |    Yes    |     Yes      |    Yes     |      Yes      |
| §3.7 Error Boundaries    |    Yes     |    Yes    |     Yes      |    Yes     |      Yes      |
| §3.8 Empty States        |            |           |              |    Yes     |      Yes      |
| §3.9 Confirmation Dialog |            |           |              |    Yes     |               |
| §3.10 Form Primitives    |            |           |              |            |      Yes      |

All five pages inherit Theme Provider and Error Boundaries from the shell layout, so even pages that don't directly import those components benefit from them through the component tree.

---

### D. Drawer and Plugin Usage

Phase 1 introduces no Unit Detail Drawer usage. The drawer and game system plugin integration are not consumed until Phase 2, when the unit drawer and roster builder are introduced.

The only dependency injection in Phase 1 is provided through three React contexts:

- `GameSystemContext` — injects the active game system plugin at the root layout boundary. All descendants read the active plugin via `useGameSystem()` without coupling to a specific game system implementation.
- `DataContext` — injects the data layer adapter (SQLite on mobile, server-side on web). Consumers call data hooks without knowing which adapter is active.
- `ThemeProvider` — injects dark theme tokens from Tailwind v4's `@theme` configuration on web and Tamagui's token system on mobile.

No page in Phase 1 directly imports a game system module or a data adapter class. All dependencies arrive through context.

---

### E. Component Composition Hierarchy

The following ASCII trees show the runtime render hierarchy for each Phase 1 surface. Indentation represents parent-child composition, not import depth.

#### Shell Layout

```
RootLayout (layout.tsx)
└── ThemeProvider
    └── DataContext.Provider
        └── GameSystemContext.Provider
            └── Auth0Provider
                └── QueryClientProvider
                    └── ErrorBoundary
                        └── ShellContainer
                            └── ShellView
                                ├── SidebarNav          (desktop >=768px)
                                ├── TopHeader
                                │   └── ProfilePopover
                                └── <main>{children}</main>

TabLayout (mobile, _layout.tsx)
└── ThemeProvider (Tamagui)
    └── DataContext.Provider
        └── GameSystemContext.Provider
            └── Auth0Provider
                └── QueryClientProvider
                    └── ErrorBoundary
                        └── Tabs.Navigator
                            ├── Tabs.Screen (Forge)
                            ├── Tabs.Screen (Landing)
                            └── Tabs.Screen (Profile)
```

#### Landing Page

```
LandingPage (page.tsx)
└── GameSystemSelectorContainer
    ├── GameSystemGrid
    │   ├── GameSystemTile (system 1)
    │   ├── GameSystemTile (system 2)
    │   └── GameSystemTile (system n)
    └── RegistrationCTA
```

#### The Forge

```
ForgePage (page.tsx)
└── HydrationBoundary
    └── ForgeContainer
        ├── ArmyFilterPanel       (Tier 1 open state)
        └── ArmyListView
            ├── ArmyCardSkeleton[]  (while isLoading)
            ├── EmptyState          (when armies.length === 0)
            └── ArmyCard[]
                └── ArmyCardActions
                    ├── DeployButton
                    ├── DuplicateButton
                    └── DeleteButton → ConfirmationDialog
```

#### Army Creation

```
ArmyCreationPage (new/page.tsx)
└── HydrationBoundary
    └── ArmyCreationContainer
        └── ArmyCreationForm
            ├── ArmyNameInput
            ├── FactionSelector
            │   └── Radix Select
            └── DetachmentSelector    (hidden when single-detachment faction)
                └── Radix Select
```

---

### F. Responsive and Accessibility Specs

#### Shell + Navigation (§4.1)

**Responsive behavior**

- At >=768px: persistent sidebar at 240px width. Collapsible to 64px icon-only mode via the collapse toggle (US-GLB-09, G-09). The `sidebarCollapsed` boolean lives in Tier 1 state on `ShellContainer`.
- At <768px: sidebar is hidden; navigation moves to a bottom tab bar at 56px + safe-area inset (US-GLB-10). On web at narrow viewport, the sidebar is replaced with a hamburger-triggered drawer.
- The main content area fills remaining horizontal space at all breakpoints. No horizontal scroll permitted at 320px or wider.

**Accessibility**

- `<nav aria-label="Primary">` wraps the sidebar navigation list.
- `<main id="main-content">` receives a skip-link target.
- The collapse toggle has `aria-expanded` bound to `sidebarCollapsed` and `aria-label="Collapse sidebar"` / `"Expand sidebar"`.
- Profile popover uses Radix `Popover.Root`, which manages `aria-haspopup`, `aria-expanded`, and focus return on close.

#### Landing / Game System Selector (§4.3)

**Responsive behavior**

- Game system tiles render in a responsive CSS grid: 3 columns on desktop (>=1024px), 2 columns on tablet (>=640px), 1 column on mobile (<640px).
- Full-bleed tile illustrations use `object-fit: cover` with a fixed aspect ratio (16:9) so they scale without distortion at any width.
- `RegistrationCTA` stacks below the grid on all breakpoints.

**Accessibility**

- Each `GameSystemTile` renders as a `<button>` (or `Pressable` on mobile) with `aria-label="Select [system name]"` to give screen readers a meaningful label beyond the illustration.
- Focus-visible ring is applied via `focus-visible:ring-2 ring-accent-primary` on web.

#### The Forge (§4.4)

**Responsive behavior**

- Army cards render in a 3-column grid on desktop (>=1024px), 2-column on tablet (>=640px), and single-column on mobile (<640px).
- On mobile, `ArmyCard` supports swipe-to-reveal the delete and duplicate actions (RNGH v3 `PanGesture`), matching the mobile interaction pattern referenced in §5 CODING_STANDARDS.
- `ArmyFilterPanel` is a side drawer on desktop (persistent) and a bottom sheet on mobile (toggled by a filter button in the header).

**Accessibility**

- `ArmyCard` has `aria-label` composed from army name and faction.
- Delete confirmation dialog uses `role="alertdialog"` with `aria-labelledby` and `aria-describedby` pointing to the dialog title and body.
- All button touch targets are at minimum 44x44px.

#### Army Creation (§4.5)

**Responsive behavior**

- Single-column form layout at all breakpoints. No multi-column behavior.
- All inputs have a minimum height of 44px to satisfy touch target requirements.
- `FactionSelector` and `DetachmentSelector` expand to full width on mobile.

**Accessibility**

- Every form field has an explicit `<label>` (web) or `accessibilityLabel` (mobile).
- `DetachmentSelector` is conditionally hidden via the `hidden` prop; when hidden it renders `null` (not `visibility: hidden`) to remove it from the accessibility tree entirely.
- Form submission errors are announced via `role="alert"` on the error container.
- `aria-invalid` and `aria-describedby` are applied to inputs with validation errors, matching the Form Primitives spec in §3.10.

---

### G. Dependencies and Blockers

#### Blocking status

All five Phase 1 pages are unblocked. There are no Figma mockups or external design deliverables gating implementation. The UX issues in §7 document known open questions but none block coding from starting.

#### Conflict C-03

C-03 (Auth0 route protection scope) must be resolved before the Auth middleware in `src/web/src/middleware.ts` is finalized. The resolution determines the exact matcher pattern applied to game-scoped routes. Both options proposed in §8 are implementable without changing the `LoginPage` or `LoginContainer` components; only the middleware config changes.

#### Shared component dependencies

Phase 1 pages depend on the following §3.x shared components being started in parallel:

| Shared Component         | Required By | Notes                                                         |
| ------------------------ | ----------- | ------------------------------------------------------------- |
| §3.1 Shell Layout        | §4.1        | Structural dependency; must be available before shell renders |
| §3.2 Navigation          | §4.1        | Nav items rendered by shell                                   |
| §3.3 Profile Popover     | §4.1        | Rendered in top header                                        |
| §3.6 Skeleton Loaders    | All pages   | Every page shows skeletons during SSR hydration               |
| §3.8 Empty States        | §4.4, §4.5  | Forge shows empty state when no armies exist                  |
| §3.9 Confirmation Dialog | §4.4        | Delete army requires confirmation                             |
| §3.10 Form Primitives    | §4.5        | Army Creation form uses shared input components               |

Shared components §3.4 (Theme Provider), §3.5 (Loading Spinner), and §3.7 (Error Boundaries) are injected at the layout level and do not block individual pages directly, but must be implemented before any page can render in a valid state.

#### Downstream impact

Phase 1 is the foundation for all downstream phases. Specifically:

- **All Phase 2-5 pages** depend on the shell and navigation being stable. Any breaking change to `RootLayout`, `ShellContainer`, or `GameSystemContext` propagates to every subsequent phase.
- **Phase 2 (Roster Builder)** depends on the Army Creation form being navigable and the `createArmyMutation` contract being stable.
- **Phase 3 (Reference Data)** depends on the shell's side navigation rendering plugin-provided nav items correctly.
- **Auth middleware** (C-03 resolution) blocks any phase that introduces a new protected route.

---

### H. Code Organization and Exports

#### Web pages (`@armoury/web`)

Next.js App Router requires default exports for page and layout files. All other files in the web workspace use named exports.

| File type   | Path pattern                                      | Export style                   |
| ----------- | ------------------------------------------------- | ------------------------------ |
| Root layout | `src/web/src/app/[gameSystem]/layout.tsx`         | Default (required by Next.js)  |
| Page        | `src/web/src/app/[gameSystem]/[route]/page.tsx`   | Default (required by Next.js)  |
| Middleware  | `src/web/src/middleware.ts`                       | Named (`config`, `middleware`) |
| Component   | `src/web/src/components/[domain]/[Component].tsx` | Named                          |
| Hook        | `src/web/src/hooks/[useHook].ts`                  | Named                          |
| Barrel      | `src/web/src/components/[domain]/index.ts`        | Named re-exports               |

Example domain groupings for Phase 1 components: `shell/`, `auth/`, `landing/`, `forge/`, `army-creation/`.

#### Mobile screens (`@armoury/mobile`)

Expo Router layout files follow the same default-export convention as Next.js. All screen components and hooks use named exports.

| File type  | Path pattern                            | Export style                      |
| ---------- | --------------------------------------- | --------------------------------- |
| Tab layout | `src/mobile/src/app/(tabs)/_layout.tsx` | Default (required by Expo Router) |
| Screen     | `src/mobile/src/screens/[Screen].tsx`   | Named                             |
| Hook       | `src/mobile/src/hooks/[useHook].ts`     | Named                             |

#### Shared query factories (`@armoury/shared`)

Query option factories are pure TypeScript with no React imports. They live in `src/shared/frontend/queries/` and are imported by both web and mobile platform hooks. The hooks that call `useQuery()` live in each platform workspace; the factories do not.

| Factory              | Path                                         | Consumed by                                          |
| -------------------- | -------------------------------------------- | ---------------------------------------------------- |
| `armyListOptions`    | `src/shared/frontend/queries/armies.ts`      | `ForgeContainer` via `useArmies()`                   |
| `factionListOptions` | `src/shared/frontend/queries/factions.ts`    | `ArmyCreationContainer` via `useFactions()`          |
| `gameSystemsOptions` | `src/shared/frontend/queries/gameSystems.ts` | `GameSystemSelectorContainer` via `useGameSystems()` |

All factories use `.js` extensions on aliased imports (`@shared/...`) and `.ts` extensions on relative imports, per the import rules in `AGENTS.md`.

#### Aliased imports in Phase 1

Web components import shared query factories with the `@shared/` alias and `.js` extension:

```
import { armyListOptions } from '@shared/frontend/queries/armies.js';
```

Cross-workspace imports from `@armoury/systems` (game system plugin data) are accessed through `GameSystemContext`, not through direct imports, keeping Phase 1 game-agnostic per Constraint F.
