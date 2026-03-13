# Phase 5 — Polish and Extras (Weeks 18-20)

> Phase: 5 | Timeline: Weeks 18-20 | Pages: 4
> Stories: 17 | UX Issues: 5 | Conflicts: C-03, C-04
> Orphaned IDs: 3 (addressed in [Orphaned Story Disposition](#orphaned-story-disposition))

---

## Overview

Phase 5 delivers the reference browser, account/settings, user profile, and a tournaments placeholder. These pages are lower-risk than Phases 2-4 — they have no missing mockup blockers and no complex real-time interactions. The most significant design decision here is C-04 (dark-only theme), which shapes how the Account page presents preference controls.

The phase has no blocking dependencies beyond the Phase 1 shell and auth, so **References, Account, and Profile can be partially parallelized with Phase 3-4 work**. Tournaments is a one-day stub that can be written any time after Phase 1.

One external constraint applies to References: the Unit Detail Drawer must be in its reference mode (built in Phase 2 Shared). The References page calls the drawer as a read-only consumer; no match or builder mode is needed.

---

## Cross-References

- **Parent:** `docs/frontend/FRONTEND_PLAN.md`
- **Pre-requisites:** [PHASE_0_SHARED_PREREQUISITES.md](PHASE_0_SHARED_PREREQUISITES.md), [SHARED_COMPONENTS.md](SHARED_COMPONENTS.md) — Unit Detail Drawer (reference mode)
- **Upstream:** Phase 1 shell, auth, and navigation

---

## Pages

### 8.1 References

**Route:** `/wh40k10e/references`
**Complexity:** M | **Estimated Effort:** 3 days
**Stories:** REF-01, REF-02, REF-03, REF-04, REF-05, REF-06, REF-07, REF-08, REF-09
**UX Issues:** RF-01, RF-02, RF-03, RF-04
**Mockup Dependency:** Unit Detail Drawer — Single Model, Unit Detail Drawer — Multi Model (implementation proceeds with Phase 2 reference design; mockups refine final layout)

> §8.1 References depends on the Unit Detail Drawer in reference mode (delivered in Phase 2). The Phase 2 drawer mockups will refine the final layout; Phase 5 implementation proceeds with the existing Phase 2 reference design.

**Description**

The game system reference hub. All content is read-only. Data comes from the game system plugin catalog (`@armoury/systems` via bsdata). No user-specific data beyond eventual bookmarks.

Per **C-03** (resolved in Phase 1): `/wh40k10e/references` is the one unauthenticated-accessible route under the game-scoped shell on web. Mobile requires authentication for all routes. Unauthenticated web visitors see a read-only banner; any action requiring an account triggers an auth prompt. No personal data endpoints are called while unauthenticated.

**Layout and Structure**

- **REF-06 / RF-01** (MISSING in original plan): The search bar is the primary visual element, rendered full-width above the tab bar. It is not nested inside a content section or tab panel. This is the dominant affordance on the page.
- **REF-07 / RF-02** (MISSING in original plan): A tab bar sits below the search bar. Tabs are: one "Core Rules" tab and one tab per available faction (dynamically generated from plugin data). Tab count scales with game system content.
- **REF-08 / RF-03** (MISSING in original plan): Search and filter controls inside each tab panel are scoped to that tab's content only. Switching tabs resets filter state. The search input persists in the bar above, but results are always tab-scoped.
- **REF-09 / RF-04** (MISSING in original plan): Rule entries — stratagems, core rules — render as full-width tiles within their container. No two-column or card-grid layouts.

**Content Sections**

- **REF-01:** Unit browser tab (per faction). Searchable and filterable catalog. Tapping a unit opens the Unit Detail Drawer in reference (read-only) mode.
- **REF-02:** Stratagems tab (per faction/detachment). Each stratagem tile shows: CP cost, timing, effect, detachment tag.
- **REF-03:** Real-time search across all reference data. Results grouped by type (units, stratagems, rules). Matched terms highlighted in result rows.
- **REF-04:** Core Rules tab. Rules organized by game phase.
- **REF-05** (PARTIAL fix): Missions section and Deployment Zones section within the Core Rules tab (or a dedicated Missions tab, per plugin data). Both sections source content from the game system plugin.

---

### 8.2 Account / Settings

**Route:** `/account`
**Complexity:** S | **Estimated Effort:** 2 days
**Stories:** PRO-05 (DEFERRED), PRO-06, PRO-07, PRO-08, PRO-09
**UX Issues:** SA-03 (DEFERRED — see matrix)
**Mockup Dependency:** None

**Description**

Account settings page. Not game-system-scoped (no `wh40k10e` in route). Covers profile editing, preferences, game system management, and destructive account actions.

**C-04 Resolution — Dark-Only V1**

G-04 wins over PRO-05. The Account page must not render a functional theme toggle. If a theme preference section exists, it shows "Dark (default)" as the only active option. All other theme options are greyed out and labeled "Coming soon." **PRO-05 is deferred to V2.** See [Conflict C-04](#conflict-c-04) below.

**Sections**

- **Profile editing:** Display name and avatar (image crop/resize, S3 storage). Avatar uploads must use AI-generated imagery — no trademark violations.
- **Theme preference (PRO-05 — DEFERRED per C-04):** Render a read-only preference tile showing "Dark (default)." Other themes greyed out with "Coming soon" label. No theme-switching infrastructure needed in V1.
- **Language preference:** English only in V1, but the preference control is i18n-ready for future locales.
- **Notifications (PRO-06):** Push notification toggles for match and campaign updates. OS permission requested on first enable. Web and mobile permissions handled separately.
- **Data & Sync (PRO-07 — MISSING in original plan):** Lists registered game systems. Each entry has a "Sync Now" action that triggers a fresh pull of bsdata content for that system. Shows last-synced timestamp and sync status.
- **Add Game System (PRO-08 — MISSING in original plan):** An "Add Game System" action inside the Data & Sync section opens a selector modal. Choosing a system adds it to `Account.systems` and triggers initial data sync.
- **Account deletion (PRO-09):** Soft delete with grace period per SEC-004. Confirmation dialog with explicit consequences.
- **Email management:** Linked to Auth0 profile. Read-only display with a link to Auth0 account settings.
- **Data export:** GDPR compliance; triggers async export job.

**Conflict C-04**

| Aspect                         | Decision                                        |
| ------------------------------ | ----------------------------------------------- |
| Theme toggle (PRO-05)          | Deferred to V2                                  |
| V1 theme display               | "Dark (default)" — read-only, others greyed out |
| Theme-switching infrastructure | Not required in V1                              |
| Source constraint              | G-04 (🔴 Blocking) overrides PRO-05             |

---

### 8.3 Profile

**Route:** `/profile`
**Complexity:** S | **Estimated Effort:** 2 days
**Stories:** PRO-01, PRO-02, PRO-03
**UX Issues:** None beyond Global issues
**Mockup Dependency:** None

> Note: **PRO-04** (profile popover — displayName, avatar, friend code, View Profile link, Logout) is a shared component covered in `docs/frontend/SHARED_COMPONENTS.md`. It is **not** part of this page.

**Description**

Read-only profile view. Not game-system-scoped. Edits to display name and avatar are handled in Account (8.2). Profile visibility settings (public, friends-only, private) are displayed here but edited in Account.

**Sections**

- **Account info (PRO-01 — PARTIAL fix):** Displays display name, avatar, email address, and `createdAt` (account creation date). The original plan listed display name, avatar, linked providers, and stats summary but omitted email and createdAt. Both are required by PRO-01.
- **Stats summary:** Total armies, matches played, win rate.
- **Match history (PRO-02 — MISSING in original plan):** A "Match History" section shows a paginated list of completed matches: opponent name, result (W/L/D), date, final score. Default shows the last 20 entries. A "Load more" control fetches the next page.
- **Army showcase (PRO-03 — PARTIAL fix):** An "Army Showcase" section lists the user's own armies (name, faction, point total). When a friend views your profile with permission granted, their shared armies also appear per US-SOC-009. The original plan described only the friend-viewing case; own-profile showcase is equally required.
- **Privacy settings display:** Shows current visibility setting. Editing routes to Account.

Skeleton placeholders during load. Error state with retry on failure.

---

### 8.4 Tournaments (Placeholder)

**Route:** `/wh40k10e/tournaments`
**Complexity:** S | **Estimated Effort:** 1 day
**Stories:** US-TRN-001 (out-of-scope for V1 — see Orphaned Story Disposition)
**UX Issues:** None
**Mockup Dependency:** None

**Description**

Static placeholder page. No functional implementation. The route exists to reserve the URL pattern and the navigation slot for a future feature.

**Page content:**

- Heading: "Tournaments"
- Brief description of the planned feature (organized tournament play, brackets, standings)
- "Coming Soon" messaging
- Optional: email/notification signup for feature updates
- No data fetching beyond what the shell already loads

The page should feel intentional, not broken. Use the same page shell and header pattern as the rest of the app. Visual parity with a zero-state page.

---

## Story Coverage Matrix

| Story ID | Title                                                   | Status                                                        | Section |
| -------- | ------------------------------------------------------- | ------------------------------------------------------------- | ------- |
| REF-01   | View faction datasheets (readonly)                      | MAPPED                                                        | 8.1     |
| REF-02   | View faction stratagems                                 | MAPPED                                                        | 8.1     |
| REF-03   | Search across reference data                            | MAPPED                                                        | 8.1     |
| REF-04   | View core rules reference (by phase)                    | MAPPED                                                        | 8.1     |
| REF-05   | View mission and deployment references                  | PARTIAL — fixed: Missions and Deployment Zones sections added | 8.1     |
| REF-06   | Prominent search bar as primary element                 | MISSING — fixed: full-width search bar above tab bar          | 8.1     |
| REF-07   | Tab-based reference organization                        | MISSING — fixed: Core Rules tab + per-faction tabs            | 8.1     |
| REF-08   | Search and filter controls inside tab panels            | MISSING — fixed: scoped search, resets on tab switch          | 8.1     |
| REF-09   | Full-width rule tiles                                   | MISSING — fixed: full-width tiles in all rule sections        | 8.1     |
| PRO-01   | View my profile (displayName, avatar, email, createdAt) | PARTIAL — fixed: email and createdAt added                    | 8.3     |
| PRO-02   | View match history on profile                           | MISSING — fixed: paginated match history section              | 8.3     |
| PRO-03   | View army showcase on profile                           | PARTIAL — fixed: own-profile showcase described               | 8.3     |
| PRO-05   | Update theme and language preferences                   | MAPPED — DEFERRED per C-04 (dark-only V1)                     | 8.2     |
| PRO-06   | Manage notification preferences                         | MAPPED                                                        | 8.2     |
| PRO-07   | Sync faction data for a game system                     | MISSING — fixed: Data & Sync section with Sync Now            | 8.2     |
| PRO-08   | Add a game system to the account                        | MISSING — fixed: Add Game System modal in Data & Sync         | 8.2     |
| PRO-09   | Delete the account                                      | MAPPED                                                        | 8.2     |

---

## UX Issue Resolution Matrix

| Issue ID | Description                                                      | Decision                                                                    | Section     |
| -------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------- | ------ |
| RF-01    | Search bar must be prominent and visually centered               | INCORPORATE — full-width search bar above tab bar (REF-06)                  | 8.1         |
| RF-02    | References organized into tabs: core rules + per-faction         | INCORPORATE — tab bar below search bar, dynamically generated (REF-07)      | 8.1         |
| RF-03    | Search and filter inside each tab panel, not globally above tabs | INCORPORATE — scoped per-tab, resets on switch (REF-08)                     | 8.1         |
| RF-04    | Rule tiles must be full-width within their container             | INCORPORATE — full-width tiles for all rule entries (REF-09)                | 8.1         |
| SA-03    | Filters below incoming friend requests section                   | DEFER — polish item; filter placement is non-blocking and not Phase 5 scope | Phase 4     |
| G-06     | No trademark violations; all imagery must be AI-generated        | 🔴                                                                          | INCORPORATE | Global |

---

## Orphaned Story Disposition

| Story ID   | Title                                        | Disposition                                                                         | Rationale                                                                                |
| ---------- | -------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| US-TRN-001 | Tournaments placeholder                      | Out-of-scope for V1. Placeholder page built (8.4) but no functional implementation. | Tournament feature is post-V1. Route and nav slot reserved for future phase.             |
| US-ACC-005 | Linked social providers                      | Defer. Auth0 dashboard handles provider linking/unlinking.                          | No custom UI needed; Auth0 provider UI covers this flow entirely.                        |
| US-ACC-006 | Default match mode preference (Basic/Guided) | Defer. Minor preference item.                                                       | Existing matches keep their mode; new-match default is an enhancement, not a V1 blocker. |

---

## State Management for Phase 5

Phase 5 is predominantly read-only — references, account settings, and profile. State complexity is low compared to Phases 2-4. See [State Management Architecture](./STATE_MANAGEMENT.md) for the complete decision tree.

### Tier 1: Local UI State (`useState`)

| Entity                               | Component(s)           | Notes                                                  |
| ------------------------------------ | ---------------------- | ------------------------------------------------------ |
| Search input value                   | `ReferenceSearchBar`   | Controlled input; resets on tab switch                 |
| Filter selections                    | `ReferenceFilterPanel` | Active faction/keyword filters within the selected tab |
| Account deletion confirmation dialog | `AccountDeleteDialog`  | Two-step confirm with typed input                      |
| "Sync Now" loading state             | `DataSyncButton`       | Per-game-system sync indicator                         |
| "Load more" pagination state         | `MatchHistory`         | Tracks current page offset                             |

### Tier 2: URL State

| Entity                            | Route/Params                            | Stories   |
| --------------------------------- | --------------------------------------- | --------- |
| Selected game system              | `/wh40k10e/references` path segment | US-REF-01 |
| Active tab (core rules / faction) | `?tab=core-rules` or `?tab=<factionId>` | US-REF-02 |
| Search query                      | `?q=<search>`                           | US-REF-03 |
| Profile sub-section               | `/wh40k10e/profile?section=matches` | US-PRF-01 |

### Tier 3: Remote State (React Query)

| Entity                    | Query Key Factory                         | Caching Strategy                                                      | Stories              |
| ------------------------- | ----------------------------------------- | --------------------------------------------------------------------- | -------------------- |
| Faction reference data    | `factionListOptions(gameSystem)`          | `staleTime: Infinity` — reference data changes only with app releases | US-REF-01, US-REF-02 |
| Core rules / stratagems   | `coreRulesOptions(gameSystem)`            | `staleTime: Infinity` — same lifecycle as faction data                | US-REF-04            |
| Unit reference data       | `unitCatalogOptions(gameSystem, faction)` | `staleTime: Infinity` — same as Phase 2, shared cache                 | US-REF-05            |
| Account data              | `accountOptions(userId)`                  | `staleTime: 0` — always fresh on navigation                           | US-ACC-01, US-ACC-02 |
| Account update mutation   | `updateAccountMutation`                   | Invalidates `accountOptions` on success                               | US-ACC-03            |
| Game system sync mutation | `syncGameSystemMutation`                  | Invalidates faction + unit catalog queries on success                 | US-ACC-04            |
| User profile (own)        | `profileOptions(userId)`                  | `staleTime: 300_000` (5 min)                                          | US-PRF-01            |
| Match history (paginated) | `matchHistoryOptions(userId, page)`       | `staleTime: 60_000`; keepPreviousData for pagination                  | US-PRF-02            |
| Army showcase             | `armyListOptions(userId)`                 | Reuses Phase 1/2 army list query                                      | US-PRF-03            |

### Tier 5: Global Non-Reactive State (Context)

| Entity           | Provider        | Why Context                                                                                                                                                                                                 |
| ---------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Theme preference | `ThemeProvider` | V1: dark-only (C-04). Static value — no switching logic. If light theme is added in V2, evaluate migration to BehaviorSubject per [§8.4](./STATE_MANAGEMENT.md#84-migration-path-context--behaviorsubject). |
| i18n locale      | `I18nProvider`  | Static per session. No dynamic locale switching in V1.                                                                                                                                                      |

> **Note:** Phase 5 introduces no Tier 4 (RxJS) state. All data is fetched via React Query; no real-time streams are needed.

### Derived State Patterns

| Entity                   | Derived From                                   | Notes                                        |
| ------------------------ | ---------------------------------------------- | -------------------------------------------- |
| Filtered reference items | Tab selection + search query + reference data  | Computed inline from URL state + query cache |
| Account sync status      | Per-game-system sync timestamps + current time | "Last synced X ago" display                  |

See [Derived State Patterns](../DERIVED_STATE.md) for implementation guidance.

### Cross-References

- [State Management Architecture](./STATE_MANAGEMENT.md) — Complete state hierarchy and decision tree
- [§6 React Query](../REACT_QUERY.md) — Server state caching, mutations, optimistic updates
- [§8 Context](./STATE_MANAGEMENT.md#8-react-context--when-and-why) — Context DI patterns and justification requirement
- [§9 Derived State](../DERIVED_STATE.md) — Computed state patterns, memoization
- [§11 Testing](../STATE_TESTING.md) — Testing each state tier

---

## Acceptance Criteria

**References (8.1)**

- Search bar renders full-width above the tab bar on all breakpoints.
- Tab bar displays "Core Rules" plus one tab per faction from plugin data.
- Switching tabs resets filter state; search input persists but results re-scope.
- Rule tiles (stratagems, core rules) render full-width.
- Unit tiles open the Unit Detail Drawer in read-only (reference) mode.
- Unauthenticated web visitors see a read-only banner; no personal data endpoints called.
- Page accessible at `/wh40k10e/references` without authentication on web.

**Account / Settings (8.2)**

- Theme preference section renders "Dark (default)" as the only active option; others greyed with "Coming soon."
- No theme-switching logic or infrastructure present in V1 build.
- Data & Sync section lists all registered game systems with last-synced timestamp.
- "Sync Now" triggers a fresh bsdata pull for the selected game system.
- "Add Game System" modal adds a new entry to `Account.systems` and triggers initial sync.
- Account deletion flow uses soft delete with confirmation dialog.

**Profile (8.3)**

- Profile page displays email and `createdAt` in account info section.
- Match History section shows paginated completed matches (last 20 default, "Load more" control).
- Army Showcase lists user's own armies; shared armies visible to permitted friends.
- Skeleton placeholders shown during load; retry available on error.

**Tournaments (8.4)**

- Route `/wh40k10e/tournaments` renders without errors.
- Page uses standard shell and header pattern.
- "Coming Soon" message present; no data fetching beyond shell.

## Acceptance Test Checklist

> These tests verify Phase 5 is complete. Each item maps to a specific acceptance criterion or component defined above.

### End-to-End Acceptance Tests

- [ ] References page at `/wh40k10e/references` is accessible to unauthenticated users on web; `UnauthBanner` is visible and no authenticated-only interactions are rendered.
- [ ] `ReferenceSearchBar` auto-focuses on page load; typing filters units and stratagems across the active tab in real time.
- [ ] `ReferenceTabBar` renders a "Core Rules" tab and one tab per faction from `factionListOptions`; switching tabs resets `ReferenceFilterPanel` state.
- [ ] `StratagemBrowserTab` displays CP cost, timing, effect text, and detachment tag for each stratagem scoped to the active faction and detachment.
- [ ] Account page at `/account` (no `wh40k10e` segment) renders the profile edit section, theme preference section with "Dark (default)" as the only active option, and the Data & Sync section with last-synced timestamps.
- [ ] "Sync Now" on Account page triggers a bsdata pull for the selected game system and updates the last-synced timestamp on completion.
- [ ] Profile page Match History section renders the last 20 completed matches paginated; "Load more" appends the next page without a full reload.

### Component Tests (Orchestrational)

- [ ] `ReferencesContainer` fetches via `factionListOptions` and `coreRulesOptions`; passes tab list, active tab, and filter state to `ReferencesView` with no hooks in the view.
- [ ] `AccountContainer` fetches via `accountOptions`, dispatches account mutations, and owns the account deletion confirmation dialog state.
- [ ] `ProfileContainer` fetches via `profileOptions` and `matchHistoryOptions`; passes paginated match history and army showcase data as props to the profile view.
- [ ] `UnitBrowserTab` inside `ReferencesContainer` opens the `UnitDetailDrawer` in reference mode on unit tap; no wargear editors or builder controls are present in the drawer.

### Hook / Query Tests

- [ ] `factionListOptions` query returns the full faction list for the active game system; result is shared between `ReferencesContainer` and `ReferenceTabBar` via the same cache key.
- [ ] `unitCatalogOptions` query factory scoped to a faction returns units sorted by battlefield role; result is used by `UnitBrowserTab` without re-fetching when the tab is revisited.
- [ ] `matchHistoryOptions` supports cursor-based pagination; calling `fetchNextPage` appends results to the existing cache entry.

### Accessibility Tests

- [ ] `ReferenceTabBar` has `role="tablist"`; each tab has `role="tab"` with `aria-selected`; arrow keys navigate between tabs and activate the focused tab on Enter.
- [ ] `RuleTile` components for stratagems and core rules use `role="article"` and include a visually-hidden heading so screen readers can identify each rule by name.
- [ ] Account deletion confirmation dialog announces the warning message via `aria-describedby` on the confirm button; the dialog is closeable via Escape.

---

## Code Example: Orchestrational / Render Pattern

> This example demonstrates the mandatory container/view split for Phase 5.
> The orchestrational container owns all data fetching, mutations, and state.
> The render component receives everything via props and contains zero hooks except `useCallback`/`useMemo`.

```tsx
// File: src/web/app/wh40k10e/references/page.tsx

import { useSuspenseQuery } from '@tanstack/react-query';
import { useCallback, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Faction, Unit } from '@wh40k10e/types/entities.js';
import { factionListOptions, unitCatalogOptions } from '@armoury/clients-rules';

// ---------------------------------------------------------------------------
// Render component — pure props, zero data hooks
// ---------------------------------------------------------------------------

type TabKey = 'factions' | 'units' | 'rules';

interface ReferencesViewProps {
    factions: Faction[];
    units: Unit[];
    activeTab: TabKey;
    searchQuery: string;
    selectedFactionId: string | null;
    onTabChange: (tab: TabKey) => void;
    onSearch: (query: string) => void;
    onSelectFaction: (factionId: string) => void;
}

export function ReferencesView({
    factions,
    units,
    activeTab,
    searchQuery,
    selectedFactionId,
    onTabChange,
    onSearch,
    onSelectFaction,
}: ReferencesViewProps) {
    return (
        <div className="flex gap-6">
            <aside aria-label="Factions">
                <FactionSidebar factions={factions} selectedId={selectedFactionId} onSelect={onSelectFaction} />
            </aside>
            <main className="flex-1">
                <TabBar active={activeTab} onChange={onTabChange} />
                <SearchInput value={searchQuery} onChange={onSearch} />
                {activeTab === 'units' && <UnitGrid units={units} />}
                {activeTab === 'factions' && <FactionList factions={factions} />}
                {activeTab === 'rules' && <CoreRulesPanel />}
            </main>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Orchestrational container — URL-driven state, queries; no JSX
// ---------------------------------------------------------------------------

export function ReferencesContainer({ gameSystem }: { gameSystem: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const activeTab = (searchParams.get('tab') as TabKey) ?? 'factions';
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFactionId, setSelectedFactionId] = useState<string | null>(null);

    const { data: factions = [] } = useSuspenseQuery(factionListOptions(gameSystem));
    const { data: allUnits = [] } = useSuspenseQuery(unitCatalogOptions(gameSystem, selectedFactionId));

    const filteredUnits = useMemo(
        () =>
            searchQuery ? allUnits.filter((u) => u.name.toLowerCase().includes(searchQuery.toLowerCase())) : allUnits,
        [allUnits, searchQuery],
    );

    // URL-driven tab state — updates ?tab= without full navigation
    const handleTabChange = useCallback(
        (tab: TabKey) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('tab', tab);
            router.replace(`?${params.toString()}`);
        },
        [searchParams, router],
    );

    return (
        <ReferencesView
            factions={factions}
            units={filteredUnits}
            activeTab={activeTab}
            searchQuery={searchQuery}
            selectedFactionId={selectedFactionId}
            onTabChange={handleTabChange}
            onSearch={setSearchQuery}
            onSelectFaction={setSelectedFactionId}
        />
    );
}
```

---

## Component Architecture

### A. Component Inventory

Phase 5 covers four pages. Three are functional (References, Account, Profile); one is a placeholder stub (Tournaments).

**§8.1 References** — `src/web/src/app/wh40k10e/references/page.tsx`

- `ReferencesContainer` — orchestrational; owns data fetching, tab state, and filter state.
- `ReferencesView` — render; receives all data and callbacks as props, no hooks.
- `ReferenceSearchBar` — full-width above the tab bar; primary interactive element on the page. Fulfils REF-06/RF-01. Auto-focused on page load.
- `ReferenceTabBar` — renders a "Core Rules" tab plus one tab per faction, generated dynamically from faction list data. Fulfils REF-07/RF-02. `role="tablist"` with ARIA-managed keyboard navigation.
- `UnitBrowserTab` — per-faction unit catalog. Tapping a unit opens the Unit Detail Drawer in reference mode (same drawer as Phase 2 §5.4).
- `StratagemBrowserTab` — displays stratagems scoped to the active faction and detachment. Shows CP cost, timing, effect text, and detachment tag.
- `CoreRulesTab` — rules organized by game phase, plus missions and deployment zones. Fulfils REF-05.
- `ReferenceFilterPanel` — scoped to the active tab; resets automatically on tab switch. Fulfils REF-08/RF-03.
- `RuleTile` — full-width tile for stratagems and core rules, not a card grid. Fulfils REF-09/RF-04.
- `UnauthBanner` — read-only informational banner rendered for unauthenticated web users. No interactive elements that require authentication are shown. Fulfils C-03.

**§8.2 Account / Settings** — `src/web/src/app/account/page.tsx`

This page is NOT game-system-scoped. No `wh40k10e` segment in the route.

- `AccountContainer` — orchestrational; owns account query, mutation dispatch, and dialog state.
- `AccountView` — render; receives account data and all callbacks.
- `ProfileEditSection` — display name and avatar. Avatar supports image crop and resize client-side before S3 upload.
- `ThemePreferenceSection` — shows "Dark (default)" as the active selection. All other options rendered greyed out with a "Coming soon" label. Fulfils C-04.
- `LanguagePreferenceSection` — English only in V1. The control is i18n-ready for additional locales without structural changes.
- `NotificationSettingsSection` — push notification opt-in toggles. Fulfils PRO-06.
- `DataSyncSection` — lists registered game systems, each with a "Sync Now" action and a last-synced timestamp. Fulfils PRO-07.
- `AddGameSystemModal` — selector allowing the user to register additional game systems. Fulfils PRO-08.
- `AccountDeletionSection` — soft delete with a grace period. Requires a confirmation dialog before submission. Fulfils PRO-09.
- `EmailSection` — read-only display of the account email. Links out to Auth0 account settings for changes.
- `DataExportSection` — GDPR-compliant data export. Triggers an async export job; the user receives the result out-of-band.

**§8.3 Profile** — `src/web/src/app/profile/page.tsx`

Also NOT game-system-scoped.

- `ProfileContainer` — orchestrational; owns profile query, match history pagination, and army list query.
- `ProfileView` — render.
- `AccountInfoSection` — display name, avatar, email, and `createdAt`. Fulfils PRO-01.
- `StatsSection` — total armies, matches played, and win rate, computed from query data.
- `MatchHistorySection` — paginated list defaulting to the last 20 matches. "Load more" appends the next page. Uses `keepPreviousData` to avoid layout shifts. Fulfils PRO-02.
- `ArmyShowcaseSection` — the user's own armies plus any shared armies visible to permitted friends. Fulfils PRO-03.
- `PrivacySettingsDisplay` — shows current visibility settings. Links to Account page for editing.

**§8.4 Tournaments (Placeholder)** — `src/web/src/app/wh40k10e/tournaments/page.tsx`

- `TournamentsPlaceholder` — static page. Renders the standard shell and page header, displays a "Coming Soon" message, and optionally shows an email signup for feature updates.
- No data fetching beyond what the shell already performs.
- Intentionally minimal. Estimated effort: one day.

---

### B. State Management Tier Breakdown

Phase 5 is predominantly read-only. State complexity is low across all four pages. There is no Tier 4 (RxJS) in this phase because no real-time streams are required.

**§8.1 References**

- Tier 1: search input value, active filter selections per tab.
- Tier 2: `?tab` (active tab identity), `?q` (search query, for shareability).
- Tier 3: `factionListOptions` (`staleTime: Infinity` — faction list does not change within a session), `coreRulesOptions` (`staleTime: Infinity`), `unitCatalogOptions` (shared with Phase 2, same query key hierarchy).

**§8.2 Account**

- Tier 1: deletion confirmation dialog open/closed state, per-system sync loading flags.
- Tier 3: `accountOptions` (`staleTime: 0` — always fetch fresh account data), `updateAccountMutation`, `syncGameSystemMutation`.

**§8.3 Profile**

- Tier 1: current page index for match history pagination.
- Tier 2: `?section=matches` (scrolls to match history on load).
- Tier 3: `profileOptions`, `matchHistoryOptions` (`keepPreviousData: true` for seamless pagination), `armyListOptions` (reuses query factories from Phase 1/2 — no new factory needed).

**§8.4 Tournaments**

- No state beyond what the shell provides.

**Tier 5 — Global Providers**

- `ThemeProvider`: static dark-only value in V1. No switching infrastructure. Fulfils C-04. The migration path to a `BehaviorSubject`-backed provider for V2 light theme is documented in `STATE_MANAGEMENT.md §8.4`.
- `I18nProvider`: static English locale in V1. Same migration path applies if dynamic locale switching is introduced.

---

### C. Shared Component Reuse Mapping

| Component                   | Phase 5 Usage                                                    | Origin       |
| --------------------------- | ---------------------------------------------------------------- | ------------ |
| Unit Detail Drawer          | §8.1 References — opens from `UnitBrowserTab`, reference context | Phase 2 §5.4 |
| Shell Layout and Navigation | All four pages                                                   | Phase 1      |
| Skeleton Loaders            | §8.1 References, §8.2 Account, §8.3 Profile                      | Shared       |
| Error Boundaries            | All four pages                                                   | Shared       |
| Form Components             | §8.2 Account settings forms                                      | Shared       |
| Theme System                | C-04 dark-only enforced across all Phase 5 pages                 | Phase 1      |

The Unit Detail Drawer is the only component from another phase that carries a distinct mode contract in Phase 5 (see §D below).

---

### D. Drawer Mode Usage

Phase 5 introduces no new drawer mode implementations.

**Unit Detail Drawer — reference mode**

The drawer opened from `UnitBrowserTab` in §8.1 uses the reference mode defined under Constraint A. This is identical to the reference mode used in Phase 2 §5.4. No new implementation is written; the existing drawer is consumed. The drawer surface, data shape, and dismiss behaviour are unchanged.

**`ThemeProvider`**

Supplies a static dark-only theme value. No subject, no subscription, no switching logic in V1. The migration path to a `BehaviorSubject`-backed value is documented in `STATE_MANAGEMENT.md §8.4` for when the light theme is added in V2.

**`I18nProvider`**

Supplies a static English locale. The same migration path documented for `ThemeProvider` applies here if dynamic locale switching is added.

---

### E. Component Composition Hierarchy

**§8.1 References**

```
ReferencesContainer
  ReferencesView
    UnauthBanner               (unauthenticated sessions only)
    ReferenceSearchBar
    ReferenceTabBar
      [tab: Core Rules]
        CoreRulesTab
          ReferenceFilterPanel
          RuleTile[]
      [tab: <Faction>]         (one per faction, dynamically generated)
        UnitBrowserTab
          ReferenceFilterPanel
          UnitTile[]
            UnitDetailDrawer   (opens on tap, reference mode)
        StratagemBrowserTab
          ReferenceFilterPanel
          RuleTile[]
```

**§8.2 Account**

```
AccountContainer
  AccountView
    ProfileEditSection
    EmailSection
    ThemePreferenceSection
    LanguagePreferenceSection
    NotificationSettingsSection
    DataSyncSection
      AddGameSystemModal       (opens on action)
    DataExportSection
    AccountDeletionSection
      ConfirmDeleteDialog      (opens on action)
```

**§8.3 Profile**

```
ProfileContainer
  ProfileView
    AccountInfoSection
    StatsSection
    MatchHistorySection
    ArmyShowcaseSection
    PrivacySettingsDisplay
```

**§8.4 Tournaments**

```
Shell
  PageHeader
  TournamentsPlaceholder
```

---

### F. Responsive and Accessibility Specs

**References (§8.1)**

- Search bar is full-width at all breakpoints. It sits above the tab bar and receives focus on page load.
- Tab bar scrolls horizontally on mobile when the faction count overflows the viewport. No wrapping.
- Rule tiles are full-width at all breakpoints. There is no card grid layout for rules.
- Unit Detail Drawer uses the same sizing and breakpoint behaviour as Phase 2 §5.4.
- Keyboard: Tab key navigates through the tab bar. Arrow keys move between tabs once the tab bar has focus. Escape clears the search input.
- Screen reader: `role="tablist"` on `ReferenceTabBar`, `aria-selected` on each tab, `aria-controls` pointing to the active panel. Search input has a visible label and an `aria-label`. Each `RuleTile` is announced with a type prefix (e.g. "Stratagem:" or "Core Rule:").
- Focus management: focus returns to the search bar after a tab switch.
- `UnauthBanner` is announced as a status region. No interactive elements requiring authentication are rendered for unauthenticated users.

**Account (§8.2) and Profile (§8.3)**

- Single-column form layout at all breakpoints. No responsive grid switching.
- All interactive controls meet the 44px minimum touch target requirement.
- Confirmation dialogs trap focus while open and return focus to the trigger element on close.
- Error messages are associated with their inputs via `aria-describedby` and `aria-invalid`.

**Tournaments (§8.4)**

- Static content. Standard shell accessibility requirements apply. No additional specs.

---

### G. Dependencies and Blockers

Phase 5 has no pending mockup dependencies that gate implementation. All four pages can begin implementation now.

**Upstream dependencies**

- Phase 1 shell and auth middleware is a soft dependency for all pages. §8.1 requires the unauthenticated access route (`/wh40k10e/references`) implemented in Phase 1 auth middleware (C-03). All other pages require an authenticated session.
- Phase 2 Unit Detail Drawer (reference mode) is required for §8.1 `UnitBrowserTab`. The drawer itself does not need to be re-implemented, only consumed.

**Constraints**

- C-03: unauthenticated read access to `/wh40k10e/references` is enforced at the Next.js middleware level in Phase 1, not in Phase 5 components. Phase 5 only renders the `UnauthBanner` based on session state.
- C-04: dark-only enforcement requires no theme-switching infrastructure in V1. `ThemeProvider` is a static value. No work deferred within Phase 5 on this constraint.

**Parallelization**

- §8.1 References, §8.2 Account, and §8.3 Profile can be developed in parallel with Phase 3 and Phase 4 work, provided Phase 1 shell is available.
- §8.4 Tournaments is a one-day stub. It can be written at any point after Phase 1 is complete and has no dependencies on other Phase 5 pages.

---

### H. Code Organization and Exports

**Pages**

| Page        | Path                                                |
| ----------- | --------------------------------------------------- |
| References  | `src/web/src/app/wh40k10e/references/page.tsx`  |
| Account     | `src/web/src/app/account/page.tsx`                  |
| Profile     | `src/web/src/app/profile/page.tsx`                  |
| Tournaments | `src/web/src/app/wh40k10e/tournaments/page.tsx` |

Account and Profile have no `wh40k10e` segment. They are user-scoped, not game-system-scoped.

**Components**

| Domain     | Path pattern                                        |
| ---------- | --------------------------------------------------- |
| References | `src/web/src/components/references/[Component].tsx` |
| Account    | `src/web/src/components/account/[Component].tsx`    |
| Profile    | `src/web/src/components/profile/[Component].tsx`    |

Each domain directory has a barrel `index.ts` exporting only the public-facing components. Internal sub-components (e.g. individual drawer panels, form field wrappers) are not re-exported from the barrel.

**Query Factories** (shared, pure TypeScript, no React)

| Factory file                                | Queries                                                                                       |
| ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `src/shared/clients/rules/src/queries.ts`   | `factionListOptions`, `coreRulesOptions`, `unitCatalogOptions`                                |
| `src/shared/clients/users/src/queries.ts`   | `accountOptions`, `updateAccountMutation`, `syncGameSystemMutation`                           |
| `src/shared/clients/users/src/queries.ts`   | `profileOptions`, `matchHistoryOptions`, `armyListOptions` (re-export from Phase 1/2 factory) |

`unitCatalogOptions` and `armyListOptions` are not duplicated. They are imported from the factories defined in Phase 2 and re-exported from the Phase 5 query files for co-location with the feature that consumes them.

**Hooks** (web-only, wrap query factories with `useQuery`)

| Hook file                            | Wraps                                                               |
| ------------------------------------ | ------------------------------------------------------------------- |
| `src/web/src/hooks/useReferences.ts` | `factionListOptions`, `coreRulesOptions`, `unitCatalogOptions`      |
| `src/web/src/hooks/useAccount.ts`    | `accountOptions`, `updateAccountMutation`, `syncGameSystemMutation` |

Profile hooks reuse `useArmyList` from Phase 1/2 and `useProfile` / `useMatchHistory` defined in `src/web/src/hooks/useProfile.ts`. A separate hooks file is not introduced for Profile unless the existing hook file grows beyond a single concern.
