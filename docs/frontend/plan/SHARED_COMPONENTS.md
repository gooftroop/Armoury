# Shared Components (Pre-requisites)

> Phase: Shared (Pre-requisite) | Builds before all feature phases
> Stories: 23 | UX Issues: 30 | Conflicts: C-04, C-05

## Overview

The components in this document are foundational infrastructure. No feature phase can begin until they exist. The shell layout, navigation, theme tokens, and data-loading patterns must be stable before any page-level work starts. The Unit Detail Drawer is the highest-risk item: it is the only shared component complex enough to block multiple downstream phases simultaneously.

Every component here is game-agnostic by design. Game-system plugins inject their tokens and icons via React context. The shell knows nothing about Warhammer; it only knows about layout slots, navigation items, and theme token slots. This separation is non-negotiable and maps directly to Constraint F.

## Cross-References

- Parent: `docs/frontend/FRONTEND_PLAN.md`
- Downstream: All phase documents depend on these components
- Related: `docs/design/USER_STORIES.md`
- Contracts: [PHASE_0 §11](PHASE_0_SHARED_PREREQUISITES.md#11-armouryui-package-architecture) (scaffold patterns), [PHASE_0 §12](PHASE_0_SHARED_PREREQUISITES.md#12-shared-ui-component-registry) (component registry)
- Styling Contracts: §I below (CVA variants, a11y matrix)

---

## Components

### 3.1 Shell Layout

**Complexity:** M | **Effort:** 3 days
**Requirements:** GLB-007, GLB-001, PRF-001
**Stories:** US-GLB-01, US-GLB-08
**UX Issues:** G-01, G-10

## The outermost layout wrapper. Defines the three-zone structure: sidebar/bottom-nav, main content area, and header. Responsive breakpoints are desktop `>=1024px`, tablet `768–1023px`, mobile `<768px`. No horizontal scroll permitted at any breakpoint and touch targets must be `>=44px` (US-GLB-01). Top-level pages display a page header with title on the left and actions on the right (US-GLB-08). Nested pages must suppress the top-level page header and show breadcrumbs instead (G-10). The shell provides these slots; page components decide which to populate. Game-system white-labeling is injected via plugin theme tokens at the shell root; the shell applies `data-theme` and CSS custom properties and never references game-specific constants.

### 3.2 Navigation

**Complexity:** M | **Effort:** 3 days
**Requirements:** GLB-002, GLB-003, GLB-004
**Stories:** US-GLB-09, US-GLB-10
**UX Issues:** G-09

## Side navigation renders at `>=768px`; bottom tab bar renders at `<768px` (US-GLB-09, US-GLB-10). Navigation items are game-system-scoped: The Forge, War Ledger, Campaigns, References, Allies. The sidebar must be collapsible on desktop and tablet (G-09) — collapsed state shows icons only. Navigation items are provided by the active game-system plugin, not hardcoded. Items not relevant to the current game system are hidden. Web uses Next.js App Router `<Link>`. Mobile uses Expo Router tabs.

### 3.3 Profile Popover

**Complexity:** S | **Effort:** 1 day
**Requirements:** GLB-013, ACC-001
**Stories:** US-PRO-04, US-ALY-10
**UX Issues:** G-08, G-15, SA-04

Triggered from the avatar button in the shell header. Replaces the "Commander" label entirely (G-15).

**Content (both US-PRO-04 and US-ALY-10 addressed here):**

- Display name and avatar
- Friend code (own) — missing from the original §3.3 plan; added to close the gap in US-ALY-10 and US-PRO-04
- View Profile link (navigates to profile page)
- Logout action

Web: Radix Popover. Mobile: Tamagui Sheet.

**Acceptance criteria:**

- Avatar button in header opens popover on click/tap
- Friend code is visible and copyable
- Logout terminates session and redirects to landing page

---

### 3.4 Theme System

**Complexity:** M | **Effort:** 3 days
**Requirements:** GLB-008, PLG-001, PLG-004
**Stories:** US-GLB-03, US-GLB-04, US-GLB-05, US-GLB-06, US-GLB-07
**UX Issues:** G-04, G-05, G-11, G-13, G-14
**Conflict:** C-04

**Constraint from C-04:** Dark-only in V1. No light mode. The profile theme toggle (US-PRO-05) is deferred to V2. If a theme preference UI exists on the Account page, it shows "Dark (default)" as the only active option with remaining choices greyed out and labeled "Coming soon."

Token categories:

- Base colors: dark grays (`gray-900`/`gray-800` backgrounds, off-white text) per US-GLB-06
- Accent: primary action color (darkened blue to meet contrast on dark backgrounds, per G-14)
- Interactive vs. static distinction: interactive elements use primary color; static/informational elements use subordinate colors (US-GLB-05, G-11)
- Typography scale with minimum sizes that scale to game-play legibility requirements
- Faction tokens: `FactionData.themeColor` injected at runtime when a game system is active (US-GLB-07, G-13)

US-GLB-04 (PARTIAL gap): Section header prominence was not explicitly called out in the original plan. Headers below page-title level must use a reduced weight/size to avoid competing with primary content. Web: Tailwind v4 CSS custom properties. Mobile: Tamagui theme tokens. Runtime switching when user changes game system is required for plugin architecture.

**Acceptance criteria:**

- Dark theme only; no light-mode rendering path in V1
- Faction accent color updates without page reload when game system changes
- Section headers are visually subordinate to page titles

---

### 3.5 Unit Detail Drawer

**Complexity:** XL | **Effort:** 8 days
**Requirements:** ARM-080, ARM-081, ARM-082, MTH-050, MTH-051
**Stories:** US-UDD-01, US-UDD-02, US-UDD-03, US-UDD-04, US-UDD-05, US-UDD-06, US-UDD-18, US-UDD-19, US-UDD-25
**UX Issues:** UD-01 through UD-15
**Conflict:** C-05

This is the highest-risk shared component. All six hard constraints apply here.

#### Hard Constraints

**Constraint A — Reference context:** Everything for a unit is displayed and there is no model list or HP bar. The drawer shows the complete datasheet: stats, abilities, weapons, composition options, keywords, leader attachment rules.

**Constraint B — Builder context:** Model list view with the ability to add models and configure wargear per model. No HP bar. Editing model count and wargear loadout is active.

**Constraint C — Match context:** Model list which contains the adjustable HP bar and the weapon stats for equipped wargear. Unable to change model count or loadout. HP is adjustable; composition is locked.

**Constraint D — Basic vs. Guided (applies to match context):** Both modes have the same unit list. Difference is that in basic mode the drawer shows all the state tags. In guided mode the drawer shows only the togglable states relevant for the current phase.

**Constraint E — Layout consistency:** Unit detail drawers must all have the same layout and UI across all three contexts. Only the data that gets displayed changes based on context.

**Constraint F — Game-agnostic shell:** The app shell and navigation are game-agnostic; no direct game-system imports. The Unit Detail Drawer is currently implemented directly for wh40k10e and will be abstracted when additional game systems are added.

#### Drawer Sizing (UD-02, UD-03, US-UDD-19)

Current mockups are too narrow. The drawer must be approximately `+200px` wider than initial mockups, targeting `60–70%` of viewport width on desktop (`min(60vw, 900px)`), `100vw` on mobile. Content must never require horizontal scrolling. US-UDD-19 was PARTIAL — pixel specs were not stated in the original plan; this document adds them.

#### Drawer Closure (UD-01, US-UDD-18)

The drawer must be closeable via: explicit close button, Escape key, swipe-down on mobile, and a "dismiss all" action that closes the entire drawer stack (US-GLB-11). US-UDD-18 was PARTIAL because the close-all behavior was implied by US-GLB-11 but not stated in §3.5. It is stated here explicitly.

#### Content Sections

Shared across all contexts (US-UDD-01 through US-UDD-06):

- Unit stat line: M, T, SV, W, LD, OC, optional INV (US-UDD-01)
- Unit abilities, untruncated (US-UDD-02)
- Weapon profiles: ranged and melee, reflow on mobile (US-UDD-03)
- Composition options: model count, points (US-UDD-04)
- Leader attachment rules (`canAttachTo`) — visible in all contexts (US-UDD-05, gap: was only called out in builder context; reference context must also show it)
- Keywords as chips: faction and unit keywords (US-UDD-06)

Weapon font size inside the drawer uses a smaller scale than page-level text (UD-08). The "equipped loadout" label is removed; wargear appears under Melee directly (UD-09, US-UDD-24).

#### Single-Model Layout (UD-11, UD-13)

Order: Name → Keywords → Stat Line → HP Bar (match context only, inline next to name per UD-12) → Ranged Weapons → Melee Weapons → Wargear → Abilities

**Mockup Reference:** UD-13 describes a single-model drawer mockup using Captain in Terminator Armour as the reference unit. Use as design guidance; implementation proceeds without it.

#### Multi-Model Layout (UD-14, UD-15)

Order: Name → Keywords → Stat Line → Wargear → Abilities → Model List

The Model List section placement is the key structural difference from the single-model layout. HP bars appear per model in this section (match context only).

**Mockup Reference:** UD-15 describes a multi-model drawer mockup using Intercessor Squad as the reference unit. Use as design guidance; implementation proceeds without it.

#### Real Data Requirement (UD-10, US-UDD-25)

All drawer development and testing must use real BSData units — specifically Intercessor Squad and Captain in Terminator Armour. Placeholder/mock data is not acceptable for this component. US-UDD-25 is MAPPED and fully addressed here.

#### Conflict C-05 Resolution — Two-Step Add-Unit Drawer

The original §5.2 "Unit Add Modal" was a separate full-screen modal that navigated to §5.3 after unit selection. Stories (UD-06) state both unit detail drawers on the army page must be identical.

**Resolution (C-05):** Add Unit uses two drawers in sequence: (1) a search/filter/catalog drawer, then (2) upon unit selection, the Unit Detail Drawer in builder context as a stacked layer. The catalog drawer and Unit Detail Drawer are separate components, but the Unit Detail Drawer shown post-selection must be identical to the one accessed from the unit list. §5.2 no longer navigates to §5.3 as a separate page.

---

### 3.6 Skeleton Loaders

**Complexity:** S | **Effort:** 1 day
**Requirements:** GLB-005, DLP-002
**Stories:** US-GLB-02
**UX Issues:** G-02

Shimmer placeholder components matching the layout shape of each major content area. Prevents Cumulative Layout Shift (CLS) by reserving space before data arrives. Each page registers its own skeleton variant. The skeleton library must include: card skeleton, list-item skeleton, drawer-header skeleton, stat-table skeleton, and weapon-table skeleton.

Render-as-you-fetch pattern (DLP-001) is the trigger mechanism. Skeletons appear immediately on navigation; they never wait for a loading flag.

**Acceptance criteria:**

- No visible layout shift between skeleton and loaded state
- All major page regions have a skeleton variant
- Skeleton width/height matches the corresponding loaded component dimensions

Each page registers its own skeleton variant sized to match its loaded state. The skeleton library must include: card skeleton, list-item skeleton, drawer-header skeleton, stat-table skeleton, and weapon-table skeleton to cover the drawer contexts.

Render-as-you-fetch pattern (DLP-001) is the trigger mechanism. Skeletons appear immediately on navigation; they never wait for a loading flag.

**Acceptance criteria:**

- No visible layout shift between skeleton and loaded state
- All major page regions have a skeleton variant
- Skeleton width/height matches the corresponding loaded component dimensions

---

### 3.7 Error Boundaries

**Complexity:** S | **Effort:** 1 day
**Requirements:** DLP-003, DLP-004
**Stories:** (no dedicated story; supports all stories via error resilience)
**UX Issues:** G-15

Granular error boundaries per content section. A single failed data fetch does not blank the entire page. Each boundary displays a contextual retry action, logs to Sentry, and catches both render errors and async data errors via the Suspense error boundary protocol. Full-page boundaries exist only for unrecoverable states (auth failure, corrupt session). Errors are captured in Sentry with relevant context.

---

### 3.8 UI Primitives

**Complexity:** M | **Effort:** 3 days
**Requirements:** GLB-006, A11Y-001, A11Y-002
**Stories:** US-GLB-11, US-GLB-12
**UX Issues:** G-07, G-12

Web: Radix UI primitives. Mobile: Tamagui components. Shared prop interfaces in `@armoury/ui`. All components are accessible by default: keyboard navigation, ARIA attributes, focus management, minimum contrast ratios.

**Toast notification system (US-GLB-12 — MISSING in original plan, added here):**

- Auto-dismiss at 4 seconds for success/info toasts
- Error toasts persist until explicitly dismissed
- Toasts stack vertically, maximum 3 visible simultaneously
- Oldest toast is dismissed first when the stack exceeds 3

**Drawer/modal stacking system (US-GLB-11 — PARTIAL in original plan):**

- Multiple drawers can be open simultaneously (e.g., catalog drawer + unit detail drawer for C-05 two-step flow)
- Each drawer layer has an independent close action
- A "dismiss all" action closes the entire stack
- Stack depth is capped at 3 layers to prevent UX confusion

G-12 (avoid Material Design patterns) applies here. Components must feel contemporary SaaS, not Android-native. No floating action buttons, no bottom sheets that snap to fractional heights on desktop.

**Acceptance criteria:**

- Toast system functions per spec (4s dismiss, error persists, 3-stack max)
- Drawer stack supports minimum 2 layers with independent close actions
- All primitives pass axe accessibility audit

---

### 3.9 Data Loading Patterns

**Complexity:** M | **Effort:** 2 days
**Requirements:** DLP-001, DLP-005, DLP-006, DLP-007
**Stories:** (pattern; supports all data-fetching stories)
**UX Issues:** G-03

Render-as-you-fetch with React Suspense boundaries. Data fetching is initiated before rendering begins, not inside `useEffect`. Stale-while-revalidate caching for reference data. Optimistic updates for mutations (army edits, match state changes). Data-fetching is satisfied by the existing client packages under `src/shared/clients/` (e.g., `@armoury/clients-github`, `@armoury/clients-wahapedia`, `@armoury/clients-campaigns`, etc.), which export React Query option factories. Page-level components import query option factories from the relevant client package, not raw fetch calls.

G-03 (render-as-you-fetch) is a blocking architectural constraint. Any page that uses `useEffect` for initial data loading violates this constraint and must be refactored before merging. Optimistic updates revert on error with an error toast.

---

### 3.10 Form Components

**Complexity:** M | **Effort:** 2 days
**Requirements:** VAL-001, VAL-002, A11Y-003
**Stories:** (foundation; used by army creation, match creation, campaign creation, account settings)
**UX Issues:** (none specific; constrained by G-01 for responsive layout)

Input, Select, RadioGroup, Checkbox, TextArea with consistent validation display. Form state management uses controlled components with inline validation errors shown on blur, not on submit. All fields meet `>=44px` touch target requirement. Shared between: army creation (Phase 1), match creation drawer (Phase 3), campaign creation (Phase 4), account settings (Phase 5). Building these before any feature phase prevents four separate teams implementing diverging form patterns.

---

## Story Coverage Matrix

| Story ID  | Description                                                         | Component               | Status                                                                            |
| --------- | ------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------- |
| US-GLB-01 | Responsive layout, no horizontal scroll, 44px touch targets         | §3.1 Shell Layout       | MAPPED                                                                            |
| US-GLB-02 | Skeleton loading states                                             | §3.6 Skeleton Loaders   | MAPPED                                                                            |
| US-GLB-03 | Design token system                                                 | §3.4 Theme System       | MAPPED                                                                            |
| US-GLB-04 | Reduced section header prominence                                   | §3.4 Theme System       | PARTIAL → fixed: explicit token for section header weight added                   |
| US-GLB-05 | Color hierarchy for interactive vs. static elements                 | §3.4 Theme System       | PARTIAL → fixed: interactive/static token distinction made explicit               |
| US-GLB-06 | Modern dark UI aesthetic                                            | §3.4 Theme System       | MAPPED                                                                            |
| US-GLB-07 | Faction-themed color accents (`FactionData.themeColor`)             | §3.4 Theme System       | MAPPED                                                                            |
| US-GLB-08 | Consistent page header layout (title left, actions right)           | §3.1 Shell Layout       | MAPPED                                                                            |
| US-GLB-09 | Bottom navigation bar for mobile                                    | §3.2 Navigation         | MAPPED                                                                            |
| US-GLB-10 | Sidebar navigation for desktop                                      | §3.2 Navigation         | MAPPED                                                                            |
| US-GLB-11 | Drawer and modal stacking system with close-all                     | §3.8 UI Primitives      | PARTIAL → fixed: stacking depth, close-all, and cap of 3 layers stated explicitly |
| US-GLB-12 | Toast notification system (4s dismiss, error persists, stacks)      | §3.8 UI Primitives      | MISSING → added: full toast spec added to §3.8                                    |
| US-UDD-01 | View unit stat line (M, T, SV, W, LD, OC, optional INV)             | §3.5 Unit Detail Drawer | MAPPED                                                                            |
| US-UDD-02 | View unit abilities, untruncated                                    | §3.5 Unit Detail Drawer | MAPPED                                                                            |
| US-UDD-03 | View unit weapon profiles (ranged and melee, reflow on mobile)      | §3.5 Unit Detail Drawer | MAPPED                                                                            |
| US-UDD-04 | View unit composition options                                       | §3.5 Unit Detail Drawer | MAPPED                                                                            |
| US-UDD-05 | View leader attachment rules (`canAttachTo`)                        | §3.5 Unit Detail Drawer | PARTIAL → fixed: reference context coverage added explicitly                      |
| US-UDD-06 | View unit keywords as chips                                         | §3.5 Unit Detail Drawer | MAPPED                                                                            |
| US-UDD-18 | Closeable drawer (button, Escape, swipe-down, dismiss all)          | §3.5 Unit Detail Drawer | PARTIAL → fixed: close-all behavior now explicit; linked to US-GLB-11             |
| US-UDD-19 | Wider fluid-responsive drawer (60–70% viewport, full-screen mobile) | §3.5 Unit Detail Drawer | PARTIAL → fixed: `min(60vw, 900px)` desktop spec added                            |
| US-UDD-25 | Use real BSData for reference units                                 | §3.5 Unit Detail Drawer | MAPPED                                                                            |
| US-PRO-04 | Profile summary popover (displayName, avatar, friend code, links)   | §3.3 Profile Popover    | PARTIAL → fixed: friend code field added explicitly                               |
| US-ALY-10 | Friend code in profile popover                                      | §3.3 Profile Popover    | PARTIAL → fixed: same fix as US-PRO-04; friend code is a first-class field        |

---

## UX Issue Resolution Matrix

| Issue ID | Description                                                                              | Severity | Decision    | Component                                 |
| -------- | ---------------------------------------------------------------------------------------- | -------- | ----------- | ----------------------------------------- |
| G-01     | Responsive layout: desktop/tablet/mobile breakpoints                                     | 🔴       | INCORPORATE | §3.1 Shell Layout                         |
| G-02     | Skeleton loaders for all loading states, CLS prevention                                  | 🔴       | INCORPORATE | §3.6 Skeleton Loaders                     |
| G-03     | Render-as-you-fetch: data initiated before render                                        | 🔴       | INCORPORATE | §3.9 Data Loading Patterns                |
| G-04     | Dark tactical theme only in V1                                                           | 🔴       | INCORPORATE | §3.4 Theme System (C-04 resolution)       |
| G-05     | Shared design token system across web and mobile                                         | 🟡       | INCORPORATE | §3.4 Theme System                         |
| G-07     | Maximize shared code; diverge only where platform requires                               | 🟡       | INCORPORATE | §3.8 UI Primitives, §3.9 Data Loading     |
| G-08     | Profile button opens popover; shows username, friend code, logout                        | 🟡       | INCORPORATE | §3.3 Profile Popover                      |
| G-09     | Left navigation collapsible on desktop/tablet                                            | 🟡       | INCORPORATE | §3.2 Navigation                           |
| G-10     | Nested pages must not show top-level header; use breadcrumbs                             | 🟡       | INCORPORATE | §3.1 Shell Layout                         |
| G-11     | Color hierarchy: primary actions use primary color                                       | 🟡       | INCORPORATE | §3.4 Theme System                         |
| G-12     | UI must feel modern; avoid Material Design patterns                                      | 🟡       | INCORPORATE | §3.8 UI Primitives                        |
| G-13     | Game system white-labeling via plugin tokens                                             | 🟡       | INCORPORATE | §3.4 Theme System                         |
| G-14     | Blue accent too light; darken for dark tactical theme                                    | 🟡       | INCORPORATE | §3.4 Theme System                         |
| G-15     | Remove "Commander" label; replace with profile popover                                   | 🟡       | INCORPORATE | §3.3 Profile Popover                      |
| UD-01    | Drawer closeable; close button closes all open modals/drawers                            | 🔴       | INCORPORATE | §3.5 Unit Detail Drawer                   |
| UD-02    | Drawer ~200px wider than current mockups; no horizontal scroll                           | 🔴       | INCORPORATE | §3.5 Unit Detail Drawer                   |
| UD-03    | Drawer twice as wide as initially mocked; fluid-responsive                               | 🔴       | INCORPORATE | §3.5 Unit Detail Drawer                   |
| UD-04    | All unit detail drawers (Reference, Builder, Match) use same layout                      | 🔴       | INCORPORATE | §3.5 Unit Detail Drawer (Constraint E)    |
| UD-05    | Unit items in Army page list must open drawer, not navigate                              | 🔴       | INCORPORATE | §3.5 (downstream: Phase 2)                |
| UD-06    | Both Army page drawers identical layout; full Unit Config content                        | 🔴       | INCORPORATE | §3.5 Unit Detail Drawer (C-05 resolution) |
| UD-07    | Unit filters in Add Unit drawer not cut off                                              | 🟡       | INCORPORATE | §3.5 (downstream: Phase 2)                |
| UD-08    | Weapon font size smaller inside drawer                                                   | 🟡       | INCORPORATE | §3.5 Unit Detail Drawer                   |
| UD-09    | Remove "equipped loadout" label                                                          | 🟡       | INCORPORATE | §3.5 Unit Detail Drawer                   |
| UD-10    | Fetch real unit data from BSData                                                         | 🔴       | INCORPORATE | §3.5 Unit Detail Drawer (US-UDD-25)       |
| UD-11    | Single-model layout order (Name, Keywords, Stats, HP, Ranged, Melee, Wargear, Abilities) | 🔴       | INCORPORATE | §3.5 Unit Detail Drawer                   |
| UD-12    | Single-model match context: HP bar inline with unit name                                 | 🟡       | INCORPORATE | §3.5 Unit Detail Drawer                   |
| UD-13    | Mockup required: single-model drawer, Captain in Terminator Armour                       | 🔴       | INCORPORATE | §3.5 Unit Detail Drawer                   |
| UD-14    | Multi-model layout order (Name, Keywords, Stats, Wargear, Abilities, Model List)         | 🔴       | INCORPORATE | §3.5 Unit Detail Drawer                   |
| UD-15    | Multi-model drawer structurally distinct; mockup required                                | 🔴       | INCORPORATE | §3.5 Unit Detail Drawer                   |
| SA-04    | Friend code (own) in profile popover                                                     | 🟡       | INCORPORATE | §3.3 Profile Popover                      |
| G-06     | No trademark violations; all imagery must be AI-generated                                | 🔴       | INCORPORATE | Global                                    |

---

## Mockup References

Two mockups provide design guidance for the Unit Detail Drawer. They are reference material, not implementation gates.

| Mockup                            | Issue IDs           | Reference Unit               | Informs                                               |
| --------------------------------- | ------------------- | ---------------------------- | ----------------------------------------------------- |
| Unit Detail Drawer — Single Model | UD-11, UD-12, UD-13 | Captain in Terminator Armour | §3.5 single-model layout, HP bar positioning          |
| Unit Detail Drawer — Multi Model  | UD-14, UD-15        | Intercessor Squad            | §3.5 multi-model layout, model list section placement |

## These are the two highest-priority mockups in the project. See Section C of `_scratch_consolidated.md` for the full priority order.

## Component Architecture

This section documents the engineering-level architecture of the shared components: their interfaces, state tiers, composition relationships, and organizational conventions. It is the implementation contract that developers and reviewers use during Phase 3 and Phase 4.

---

### A. Component Inventory

Each entry documents the component's responsibility, its props interface, composition slots, internal dependencies on other shared components, and the meaningful differences between the web and mobile implementations.

#### Shell Layout

- **Web:** `src/web/src/components/shared/ShellLayout.tsx`
- **Mobile:** `src/mobile/src/components/shared/ShellLayout.tsx`
- **Responsibility:** Defines the three-zone page structure (sidebar/bottom-nav, main content area, header) and applies the game-system `data-theme` attribute at the root.
- **Props interface:** `ShellLayoutProps`
    - `children: React.ReactNode` — main content slot
    - `header?: React.ReactNode` — page-level header slot (title + actions row)
    - `breadcrumbs?: React.ReactNode` — breadcrumb slot for nested pages; suppresses `header` when provided
- **Composition slots:** `header`, `breadcrumbs`, `children`
- **Shared dependencies:** Navigation (§3.2), Theme System (§3.4)
- **Platform variants:** Web renders a CSS Grid layout with a persistent sidebar column. Mobile renders a Stack with a `<Tabs>` navigator at the bottom; the sidebar column does not exist. The `breadcrumbs` slot uses Next.js `<Link>` on web and Expo Router `<Link>` on mobile.

#### Navigation

- **Web:** `src/web/src/components/shared/Navigation.tsx`
- **Mobile:** `src/mobile/src/components/shared/Navigation.tsx`
- **Responsibility:** Renders the game-system-scoped navigation items as a collapsible sidebar on desktop/tablet and as a bottom tab bar on mobile.
- **Props interface:** `NavigationProps`
    - `items: NavigationItem[]` — injected by the active game-system plugin
    - `collapsed?: boolean` — controls icon-only sidebar state (web/tablet only)
    - `onCollapseToggle?: () => void`
- **Composition slots:** None; item rendering is internal.
- **Shared dependencies:** Theme System (§3.4) for token consumption
- **Platform variants:** Web uses Next.js App Router `<Link>` with `usePathname()` for active-state detection. Mobile uses Expo Router tab configuration; bottom tab icons come from the game-system plugin token set. The collapsed state only exists on web.

#### Profile Popover

- **Web:** `src/web/src/components/shared/ProfilePopover.tsx`
- **Mobile:** `src/mobile/src/components/shared/ProfilePopover.tsx`
- **Responsibility:** Triggered from the shell header avatar button, shows display name, avatar, copyable friend code, View Profile link, and Logout action.
- **Props interface:** `ProfilePopoverProps`
    - `displayName: string`
    - `avatarUrl?: string`
    - `friendCode: string`
    - `onLogout: () => void`
    - `profileHref: string`
- **Composition slots:** None.
- **Shared dependencies:** UI Primitives (§3.8) for the avatar button trigger
- **Platform variants:** Web uses Radix `Popover.Root` anchored to the avatar button. Mobile uses Tamagui `Sheet` triggered by the same avatar button; the sheet slides up from the bottom. Content and prop interface are identical across platforms.

#### Theme System

- **Web:** `src/web/src/components/shared/ThemeProvider.tsx`
- **Mobile:** `src/mobile/src/components/shared/ThemeProvider.tsx`
- **Responsibility:** Injects design tokens into the component tree and applies the game-system faction color override when an active game system is present.
- **Props interface:** `ThemeProviderProps`
    - `children: React.ReactNode`
    - `gameSystemTokens?: GameSystemThemeTokens` — injected by the active plugin at runtime
- **Composition slots:** `children`
- **Shared dependencies:** None (foundational layer).
- **Platform variants:** Web applies tokens as CSS custom properties on a wrapping `<div data-theme="dark">`. Mobile configures a Tamagui `TamaguiProvider` with the merged token set. Per C-04, dark-only in V1; the `gameSystemTokens` prop is the only runtime-switchable surface.

#### Unit Detail Drawer

- **Web:** `src/web/src/components/shared/UnitDetailDrawer.tsx`
- **Mobile:** `src/mobile/src/components/shared/UnitDetailDrawer.tsx`
- **Responsibility:** Renders the complete unit datasheet in one of three modes (reference, builder, match). Currently implemented directly for wh40k10e.
- **Props interface:** `UnitDetailDrawerProps`
    - `unitId: string`
    - `open: boolean`
    - `onClose: () => void`
    - `onCloseAll?: () => void` — dismiss-all action for stacked drawer scenarios
- **Composition slots:** None; all content sections are rendered internally based on the active drawer mode.
- **Shared dependencies:** Skeleton Loaders (§3.6), Error Boundaries (§3.7), UI Primitives (§3.8), Data Loading Patterns (§3.9)
- **Platform variants:** Web renders a Radix `Sheet` sliding in from the right at `min(60vw, 900px)` width. Mobile renders a Tamagui `Sheet` at `100vw` full-screen. Swipe-down to close is native to both platforms via their respective Sheet primitives. The content sections are identical across platforms.

#### Skeleton Loaders

- **Web:** `src/web/src/components/shared/SkeletonLoaders.tsx`
- **Mobile:** `src/mobile/src/components/shared/SkeletonLoaders.tsx`
- **Responsibility:** Exports a family of shimmer placeholder components — `CardSkeleton`, `ListItemSkeleton`, `DrawerHeaderSkeleton`, `StatTableSkeleton`, `WeaponTableSkeleton` — sized to match their loaded counterparts.
- **Props interface:** `SkeletonProps` (shared across all variants)
    - `count?: number` — number of list-item rows to render (for `ListItemSkeleton`)
    - `animate?: boolean` — defaults `true`; set `false` when `prefers-reduced-motion` is active
- **Composition slots:** None.
- **Shared dependencies:** Theme System (§3.4) for token-based shimmer gradient colors
- **Platform variants:** Web uses a CSS `@keyframes shimmer` animation on a `background-gradient` element. Mobile uses Reanimated v4 `withRepeat`/`withTiming` on opacity. The `animate` prop disables animation on both platforms when `prefers-reduced-motion` is detected.

#### Error Boundaries

- **Web:** `src/web/src/components/shared/ErrorBoundary.tsx`
- **Mobile:** `src/mobile/src/components/shared/ErrorBoundary.tsx`
- **Responsibility:** Wraps individual content sections with granular error containment; renders a contextual retry action and reports to Sentry on catch.
- **Props interface:** `ErrorBoundaryProps`
    - `children: React.ReactNode`
    - `fallback?: React.ReactNode` — custom fallback; defaults to an inline retry card
    - `fullPage?: boolean` — renders a full-page error state for unrecoverable failures
- **Composition slots:** `children`, `fallback`
- **Shared dependencies:** UI Primitives (§3.8) for the retry button
- **Platform variants:** Both platforms extend React's `Component`-based error boundary class. Web uses `next/navigation` `useRouter` in the reset callback. Mobile uses Expo Router's `useRouter`. The `fullPage` variant uses platform-specific full-screen centering.

#### UI Primitives

- **Web:** `src/web/src/components/shared/UIPrimitives.tsx`
- **Mobile:** `src/mobile/src/components/shared/UIPrimitives.tsx`
- **Responsibility:** Exports the foundational interactive components — `Button`, `IconButton`, `Toast`, `ToastStack`, `Drawer`, `DrawerStack`, `Badge`, `Chip`, `Avatar` — with accessibility built in.
- **Props interface:** Per-export interfaces (`ButtonProps`, `ToastProps`, `DrawerProps`, `DrawerStackProps`, etc.); shared prop interfaces are defined in `src/shared/ui/src/types.ts`.
- **Composition slots:** `Drawer` accepts `children`; `DrawerStack` accepts an ordered array of `Drawer` instances.
- **Shared dependencies:** Theme System (§3.4)
- **Platform variants:** Web uses Radix primitives as the underlying implementation for `Button`, `Drawer`, and `Toast`. Mobile uses Tamagui equivalents. The `DrawerStack` implementation is web-only using Radix `Dialog`; mobile stacks are managed by Tamagui `Sheet` with `zIndex` layering. Shared prop interfaces in `@armoury/ui` ensure consuming components reference a single contract.

#### Data Loading Patterns

- **Web:** `src/web/src/components/shared/DataLoadingPatterns.tsx`
- **Mobile:** `src/mobile/src/components/shared/DataLoadingPatterns.tsx`
- **Responsibility:** Provides the `SuspenseQuery` wrapper component and the `useOptimisticMutation` hook factory that enforce render-as-you-fetch and optimistic update conventions across the codebase.
- **Props interface:** `SuspenseQueryProps<T>`
    - `queryOptions: UseQueryOptions<T>`
    - `children: (data: T) => React.ReactNode`
    - `skeleton: React.ReactNode`
- **Composition slots:** `children` (render prop), `skeleton`
- **Shared dependencies:** Skeleton Loaders (§3.6), Error Boundaries (§3.7)
- **Platform variants:** Both platforms use TanStack Query v5. The `SuspenseQuery` component wraps `useSuspenseQuery` inside a `<Suspense>` and `<ErrorBoundary>` pair. No platform-specific divergence beyond import paths.

#### Form Components

- **Web:** `src/web/src/components/shared/FormComponents.tsx`
- **Mobile:** `src/mobile/src/components/shared/FormComponents.tsx`
- **Responsibility:** Exports `Input`, `Select`, `RadioGroup`, `Checkbox`, `TextArea` with consistent inline validation display and `>=44px` touch targets.
- **Props interface:** Per-export interfaces (`InputProps`, `SelectProps`, etc.); validation error display follows a shared `FieldErrorProps` contract in `src/shared/ui/src/types.ts`. Component-scoped types live in the component's own `types.ts` file.
- **Composition slots:** None; all form fields are self-contained.
- **Shared dependencies:** UI Primitives (§3.8) for button-adjacent actions, Theme System (§3.4) for border and focus token consumption
- **Platform variants:** Web uses Radix `Select` for the select primitive. Mobile uses Tamagui `Select`. All other fields (`Input`, `Checkbox`, `RadioGroup`, `TextArea`) use native React Native controlled inputs on mobile with Tamagui styling. Validation errors display on blur on both platforms.

---

### B. State Management Tier Breakdown

Each tier below corresponds to the hierarchy defined in the AGENTS.md state management section. Tier 4 (RxJS) is absent from all shared components: RxJS is reserved for global reactive client state driven by real-time events (match WebSocket, presence), none of which originate in shared pre-requisite components.

| Component             | Tier 1 (useState)                                    | Tier 2 (URL)                             | Tier 3 (React Query)                  | Tier 4 (RxJS)  | Tier 5 (Context)                             |
| --------------------- | ---------------------------------------------------- | ---------------------------------------- | ------------------------------------- | -------------- | -------------------------------------------- |
| Shell Layout          | Sidebar collapsed/expanded                           | No                                       | No                                    | Not applicable | GameSystemThemeTokens via ThemeProvider      |
| Navigation            | No                                                   | Active route (read-only via router hook) | No                                    | Not applicable | NavigationItems via plugin context           |
| Profile Popover       | Popover open/closed                                  | No                                       | No                                    | Not applicable | Auth session via auth context                |
| Theme System          | No                                                   | No                                       | No                                    | Not applicable | Token tree via ThemeProvider context         |
| Unit Detail Drawer    | Drawer open/closed, active tab                       | No                                       | Unit data via direct fetch (wh40k10e) | Not applicable | No                                           |
| Skeleton Loaders      | No                                                   | No                                       | No                                    | Not applicable | No                                           |
| Error Boundaries      | Error state (class component state)                  | No                                       | No                                    | Not applicable | No                                           |
| UI Primitives         | Toast stack array, drawer stack array                | No                                       | No                                    | Not applicable | No                                           |
| Data Loading Patterns | No                                                   | No                                       | All data via useSuspenseQuery         | Not applicable | QueryClient via TanStack QueryClientProvider |
| Form Components       | Field values, touched/dirty flags, validation errors | No                                       | No                                    | Not applicable | No                                           |

**Notes:**

- Tier 4 is explicitly not applicable to any shared pre-requisite component. The RxJS layer is wired in at the feature-phase level (match WebSocket in Phase 3, friend presence in Phase 4), not here.
- The Unit Detail Drawer's Tier 3 usage calls query option factories defined in the relevant `src/shared/clients/` packages. The drawer never calls `useQuery` directly.
- Shell Layout's Tier 1 collapsed state persists to `localStorage` on web via a custom `usePersistedState` hook. This is still Tier 1, not Tier 2, because it is not shareable via URL.

---

### C. Shared Component Reuse Mapping

The table below shows which feature phases consume each shared component. Phases are: P1 (The Forge — army builder), P2 (War Ledger — army list), P3 (Campaigns), P4 (References), P5 (Allies).

Drawer mode annotations appear in parentheses where the Unit Detail Drawer is consumed in a specific mode.

| Component             | Phase 1 (Forge)                                 | Phase 2 (War Ledger)                    | Phase 3 (Campaigns)                 | Phase 4 (References)                  | Phase 5 (Allies)  |
| --------------------- | ----------------------------------------------- | --------------------------------------- | ----------------------------------- | ------------------------------------- | ----------------- |
| Shell Layout          | Yes                                             | Yes                                     | Yes                                 | Yes                                   | Yes               |
| Navigation            | Yes                                             | Yes                                     | Yes                                 | Yes                                   | Yes               |
| Profile Popover       | Yes (header)                                    | Yes (header)                            | Yes (header)                        | Yes (header)                          | Yes (header)      |
| Theme System          | Yes                                             | Yes                                     | Yes                                 | Yes                                   | Yes               |
| Unit Detail Drawer    | Yes (builder mode — unit config, C-05 two-step) | Yes (builder mode — edit existing unit) | Yes (match mode — live HP tracking) | Yes (reference mode — datasheet view) | No                |
| Skeleton Loaders      | Yes (army list, unit config)                    | Yes (army list)                         | Yes (match unit list)               | Yes (catalog, unit detail)            | Yes (friend list) |
| Error Boundaries      | Yes                                             | Yes                                     | Yes                                 | Yes                                   | Yes               |
| UI Primitives         | Yes (drawers, toasts)                           | Yes (toasts)                            | Yes (drawers, toasts)               | Yes (drawers)                         | Yes (toasts)      |
| Data Loading Patterns | Yes                                             | Yes                                     | Yes                                 | Yes                                   | Yes               |
| Form Components       | Yes (army creation, unit wargear)               | No                                      | Yes (match creation)                | No                                    | No                |

The Unit Detail Drawer is the only shared component whose behavior meaningfully differs per phase. All other components are consumed identically regardless of phase.

---

### D. Adapter Implementations

_Removed._ The adapter system is not needed with a single game system. The Unit Detail Drawer is implemented directly for wh40k10e. When a second game system is added, a game-agnostic abstraction layer can be introduced.

### E. Component Composition Hierarchy

#### Shell and Navigation Tree

```
ThemeProvider
└── ShellLayout
    ├── [header slot]
    │   └── ProfilePopover (avatar button trigger)
    ├── Navigation
    │   └── NavigationItem[] (from game-system plugin)
    └── [children slot]
        └── <page content>
```

`ThemeProvider` is the outermost wrapper. It must wrap `ShellLayout` so that all tokens are available at the shell level (sidebar background, nav icon colors). `ShellLayout` renders `Navigation` internally — the nav is not a slot because its position and responsive behavior are part of the shell's layout contract, not a consumer concern.

#### Unit Detail Drawer Tree

```
└── UnitDetailDrawer
    ├── <Suspense fallback=<DrawerHeaderSkeleton>>
    │   └── UnitDetailContent
    │       ├── KeywordChips
    │       ├── StatLine
    │       ├── HpBar (match mode only, single-model: inline; multi-model: per-model)
    │       ├── WeaponTable (ranged)
    │       ├── WeaponTable (melee)
    │       ├── WargearSection
    │       ├── AbilitiesSection
    │       ├── ModelList (builder and match modes only)
    │       └── LeaderAttachSection
    └── ErrorBoundary (wraps UnitDetailContent)
```

#### C-05 Two-Step Drawer Stack

The C-05 two-step add-unit flow uses the `DrawerStack` from UI Primitives (§3.8). The catalog drawer is the first layer; the Unit Detail Drawer in builder context is stacked on top when a unit is selected.

```
DrawerStack (max depth 3)
├── Layer 1: CatalogDrawer
│   └── UnitSearchFilter + UnitCatalogList
│       └── on unit select →
└── Layer 2: UnitDetailDrawer (mode: builder)
```

Layer 1 remains mounted and visible beneath Layer 2. Each layer has an independent close button. The `onCloseAll` prop on `UnitDetailDrawer` closes both layers simultaneously via the `DrawerStack` dismiss-all action (US-GLB-11).

---

### F. Responsive and Accessibility Specs

#### Breakpoints

| Breakpoint | Range        | Shell Behavior                            | Drawer Behavior                      |
| ---------- | ------------ | ----------------------------------------- | ------------------------------------ |
| Mobile     | `<768px`     | Bottom tab bar; sidebar absent            | Full-screen (`100vw`, `100dvh`)      |
| Tablet     | `768–1023px` | Sidebar visible, collapsible to icon-only | Side slide, `60vw` min-width `540px` |
| Desktop    | `>=1024px`   | Sidebar visible, collapsible to icon-only | Side slide, `min(60vw, 900px)`       |

The breakpoint values are defined as CSS custom properties in the Theme System (`--breakpoint-sm: 768px`, `--breakpoint-lg: 1024px`) and as Tamagui `$gtSm` / `$gtMd` media tokens on mobile.

#### Touch Targets

All interactive elements must meet the `>=44px` touch target requirement (US-GLB-01). This applies to: navigation items (both sidebar and bottom bar), the avatar button, drawer close buttons, toast dismiss buttons, all form inputs, and all chip/badge interactive variants. On web, Tailwind `min-h-11 min-w-11` (`44px`) is the enforcement primitive. On mobile, `minHeight={44}` is set as a Tamagui base style on all Pressable-derived components.

#### WCAG 2.1 AA Requirements

- **Contrast ratios:** Normal text `>=4.5:1`; large text and UI components `>=3:1`. The darkened accent blue (G-14) was chosen specifically to meet the `4.5:1` threshold against the `gray-900` background. Faction `themeColor` values must be validated against the background token before injection; the Theme System raises a console warning in development if a plugin-supplied color fails the ratio.
- **Focus indicators:** All interactive elements use `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary` on web. Mobile uses React Native's `accessibilityState` and the system focus ring. Focus indicators must never be suppressed (`outline: none` without a `focus-visible` replacement is a lint error).
- **Keyboard navigation:** Shell and Navigation are fully keyboard-operable. Tab order follows visual reading order. The drawer traps focus while open; Escape closes the top drawer layer. The `DrawerStack` dismiss-all is accessible via a visible button, not a keyboard shortcut alone.
- **Screen reader labels:** Icon-only buttons carry `aria-label`. Navigation items with icons only (collapsed sidebar) carry `aria-label` matching the item title. The Unit Detail Drawer sets `aria-labelledby` pointing to the unit name heading. Toast messages use `role="status"` for polite announcements; error toasts use `role="alert"` for assertive interruption.
- **Semantic HTML:** Shell uses `<header>`, `<nav>`, `<main>`. Navigation uses `<nav aria-label="Main">` with `<ul>/<li>` structure. Drawers use `role="dialog"` with `aria-modal="true"`.

#### `prefers-reduced-motion` Handling

Skeleton shimmer animation is the primary animation in the shared layer. When `prefers-reduced-motion: reduce` is active:

- Web: the `@keyframes shimmer` animation is disabled via a `@media (prefers-reduced-motion: reduce)` rule that sets `animation: none` on `.skeleton-shimmer`. The skeleton still renders as a static muted block.
- Mobile: the `animate` prop on `SkeletonProps` is set to `false` by a top-level `useReducedMotion()` hook that reads `AccessibilityInfo.isReduceMotionEnabled()`. With `animate=false`, the Reanimated animation is never started.

Drawer slide animations follow the same pattern. Web uses `data-[state=open]:animate-in` Radix primitives with the motion media query overriding transition duration to `0.01ms`. Mobile passes `animation="none"` to Tamagui Sheet when reduced motion is detected.

---

### G. Dependencies

#### Mockup References

Two mockups inform Unit Detail Drawer layout decisions. They are design references, not implementation gates. Implementation proceeds using existing specifications; mockups refine final layout when available.

| Mockup                            | Issue | Reference Unit               | Informs                                                                                         |
| --------------------------------- | ----- | ---------------------------- | ----------------------------------------------------------------------------------------------- |
| Unit Detail Drawer — Single Model | UD-13 | Captain in Terminator Armour | Single-model layout (UD-11), inline HP bar positioning (UD-12), overall drawer width validation |
| Unit Detail Drawer — Multi Model  | UD-15 | Intercessor Squad            | Multi-model layout (UD-14), model list section placement, per-model HP bar design               |

UD-13 and UD-15 must use real BSData units (UD-10, US-UDD-25). Mockups built from placeholder data are not acceptable because the weapon table row count, ability text length, and composition option complexity vary significantly between units.

#### Phase 1 Prerequisite

Shell Layout, Navigation, and Theme System must be shipped and stable before any feature phase work begins. These three components are the foundation that all pages render inside. A broken shell blocks every parallel workstream simultaneously. Unit Detail Drawer, Skeleton Loaders, Error Boundaries, UI Primitives, Data Loading Patterns, and Form Components can be developed in parallel with feature phases as long as their interfaces are stable, but they must be merged before the first feature component that consumes them is submitted for review.

---

### H. Code Organization and Exports

#### File Locations

| Concern                                    | Location                                                              |
| ------------------------------------------ | --------------------------------------------------------------------- |
| Web shared components                      | `src/web/src/components/shared/[Component].tsx`                       |
| Mobile shared components                   | `src/mobile/src/components/shared/[Component].tsx`                    |
| Query option factories (pure TS, no hooks) | `src/shared/clients/*/queries/` and `src/shared/clients/*/mutations/` |
| Shared UI types (cross-component)          | `src/shared/ui/src/types.ts`                                          |
| Component-scoped types                     | `src/shared/ui/src/components/[Component]/types.ts`                   |
| Match stream provider                      | `src/web/src/app/(game)/match/[matchId]/providers/`                   |

Nothing in `src/shared/ui/` may import from `src/web/` or `src/mobile/`. The shared UI layer is pure TypeScript: no platform-specific APIs. Components in `src/web/` and `src/mobile/` import from `src/shared/ui/` but never the reverse. Similarly, nothing in `src/shared/clients/` may import from `src/web/` or `src/mobile/`.

#### Export Conventions

All shared components use named exports. No default exports except where Next.js or Expo Router requires them (page files, layout files).

```
// Correct
export { ShellLayout } from './ShellLayout.ts';
export type { ShellLayoutProps } from './ShellLayout.ts';

// Incorrect
export default ShellLayout;
```

#### Import Extensions

All imports use `.js` (or `.jsx`) extensions via path aliases — no relative imports:

- `import { ShellLayout } from '@web/components/shared/ShellLayout.js'`
- `import { StatLine } from '@web/components/units/StatLine.js'`

#### Barrel File

Each platform's shared component directory exposes a barrel file:

- Web: `src/web/src/components/shared/index.ts`
- Mobile: `src/mobile/src/components/shared/index.ts`

The barrel re-exports every public component and its associated props type. Internal sub-components (e.g., `StatLine`, `WeaponTable`) are not re-exported from the barrel unless a feature-phase component needs to compose them directly. Deep imports into the shared directory (`@web/components/shared/UnitDetailDrawer.js`) are acceptable within the web workspace; external workspaces must always go through `@web/components/shared/index.js`.

---

### I. Component Styling Contracts

Per-component CVA variant tables, Radix vs Custom classification, and accessibility responsibility matrix. This section provides the binding contracts between design tokens (§F) and implementation patterns ([PHASE_0 §11.8](PHASE_0_SHARED_PREREQUISITES.md#118-web-component-patterns-radix--cva--tailwind-v4)). For the full component inventory with effort and phase mapping, see [PHASE_0 §12](PHASE_0_SHARED_PREREQUISITES.md#12-shared-ui-component-registry).

#### I.1 Component Classification

Every shared component falls into exactly one classification. The classification determines its implementation pattern and which layer owns styling decisions.

| Classification          | Description                                       | Implementation Pattern                                 | Styling Owner                                           | Components                                                                                                                    |
| ----------------------- | ------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Radix Primitive**     | Wraps a Radix UI headless primitive               | Radix + CVA + Tailwind v4 (PHASE_0 §11.8)              | `@armoury/ui`                                           | Button, Dialog, Drawer, Popover, Select, Toast, Checkbox, RadioGroup, Switch, Separator                                       |
| **Composition**         | Composed from Radix Primitives                    | CVA for container + Radix children                     | `@armoury/ui`                                           | DrawerStack, ToastStack                                                                                                       |
| **Custom Shared**       | Game-agnostic layout / logic; no Radix dependency | Tailwind v4 utility classes + CVA where variants exist | `@armoury/ui` (structure) + consuming workspace (slots) | ShellLayout, Navigation, ProfilePopover, ThemeProvider, UnitDetailDrawer, ErrorBoundary, SuspenseQuery                        |
| **Presentational Atom** | Stateless, styling-only leaf node                 | CVA (if variants) or plain Tailwind                    | `@armoury/ui`                                           | IconButton, Badge, Chip, Avatar, CardSkeleton, ListItemSkeleton, DrawerHeaderSkeleton, StatTableSkeleton, WeaponTableSkeleton |

#### I.2 CVA Variant Contracts

Components with user-facing visual variants expose a CVA `variants` object. The tables below define the variant axes and their values. All variants use OKLCH color space tokens from §F / PHASE_0 §11.8.4.

**Button**

| Axis        | Values                                                                              | Default   |
| ----------- | ----------------------------------------------------------------------------------- | --------- |
| `variant`   | `primary`, `secondary`, `highlight`, `ghost`, `destructive`, `outline`              | `primary` |
| `size`      | `sm` (h-8, px-3, text-xs), `md` (h-10, px-4, text-sm), `lg` (h-12, px-6, text-base) | `md`      |
| `fullWidth` | `true`, `false`                                                                     | `false`   |

**Badge**

| Axis      | Values                                           | Default   |
| --------- | ------------------------------------------------ | --------- |
| `variant` | `default`, `secondary`, `destructive`, `outline` | `default` |

**Toast**

| Axis       | Values                                | Default |
| ---------- | ------------------------------------- | ------- |
| `severity` | `success`, `info`, `warning`, `error` | `info`  |

**Drawer**

| Axis   | Values                                                             | Default |
| ------ | ------------------------------------------------------------------ | ------- |
| `side` | `right`, `left`, `top`, `bottom`                                   | `right` |
| `size` | `sm` (max-w-sm), `md` (min(60vw, 900px)), `full` (100vw on mobile) | `md`    |

**IconButton**

| Axis      | Values                           | Default |
| --------- | -------------------------------- | ------- |
| `variant` | `ghost`, `outline`               | `ghost` |
| `size`    | `sm` (h-8 w-8), `md` (h-10 w-10) | `md`    |

**Chip**

| Axis        | Values                               | Default   |
| ----------- | ------------------------------------ | --------- |
| `variant`   | `default`, `selected`, `destructive` | `default` |
| `removable` | `true`, `false`                      | `false`   |

**Skeleton components** (CardSkeleton, ListItemSkeleton, DrawerHeaderSkeleton, StatTableSkeleton, WeaponTableSkeleton) do not use CVA — they are single-variant, animation-only (`animate-pulse` with `prefers-reduced-motion: reduce` fallback to static gray fill).

#### I.3 Accessibility Responsibility Matrix

Maps each shared component to the WCAG 2.1 AA responsibility it must fulfill. "Built-in" means Radix or the component itself handles it; "Consumer" means the page-level component must provide it.

| Component          | Focus Management                | Keyboard Nav                | ARIA Labels                          | Color Contrast          | Touch Target (44px)          | Reduced Motion                |
| ------------------ | ------------------------------- | --------------------------- | ------------------------------------ | ----------------------- | ---------------------------- | ----------------------------- |
| Button             | Built-in                        | Built-in                    | Consumer (`aria-label` if icon-only) | Built-in (CVA tokens)   | Built-in (`min-h-10`)        | N/A                           |
| Dialog             | Built-in (Radix trap)           | Built-in (Radix)            | Consumer (`aria-labelledby`)         | Built-in                | N/A (overlay)                | Consumer (entry animation)    |
| Drawer             | Built-in (Radix trap)           | Built-in (Esc close)        | Consumer (`aria-label`)              | Built-in                | Built-in (`min-h-11` close)  | Consumer (slide animation)    |
| DrawerStack        | Built-in (delegates to Drawer)  | Built-in                    | Consumer (per-drawer)                | Built-in                | Built-in                     | Consumer                      |
| Popover            | Built-in (Radix)                | Built-in (Radix)            | Consumer (`aria-label`)              | Built-in                | N/A (trigger is separate)    | N/A                           |
| Select             | Built-in (Radix)                | Built-in (Radix arrow keys) | Consumer (`aria-label`)              | Built-in                | Built-in                     | N/A                           |
| Toast / ToastStack | Built-in (`aria-live="polite"`) | Built-in (Radix)            | Built-in (severity prefix)           | Built-in                | Built-in (swipe dismiss)     | Built-in (no entry animation) |
| Checkbox           | Built-in (Radix)                | Built-in (Space toggle)     | Consumer (`aria-label`)              | Built-in (3:1 UI)       | Built-in (min 44px)          | N/A                           |
| RadioGroup         | Built-in (Radix)                | Built-in (arrow keys)       | Consumer (`aria-label` on group)     | Built-in                | Built-in                     | N/A                           |
| Switch             | Built-in (Radix)                | Built-in (Space toggle)     | Consumer (`aria-label`)              | Built-in (3:1 UI)       | Built-in (min 44px)          | N/A                           |
| ShellLayout        | Consumer (page manages)         | Consumer (Tab order)        | Consumer (landmarks)                 | Built-in (theme tokens) | Consumer (nav items)         | N/A                           |
| Navigation         | Built-in (`role="navigation"`)  | Built-in (Tab + arrow)      | Built-in (`aria-current`)            | Built-in                | Built-in (44px nav items)    | N/A                           |
| UnitDetailDrawer   | Built-in (focus trap)           | Built-in (Esc + Tab)        | Consumer (`aria-label`)              | Built-in                | Built-in                     | Consumer (slide-in)           |
| ErrorBoundary      | Consumer (retry focus)          | N/A                         | Consumer (error message)             | N/A                     | Consumer (retry button)      | N/A                           |
| Skeletons (all 5)  | N/A                             | N/A                         | Built-in (`aria-hidden="true"`)      | N/A                     | N/A                          | Built-in (pulse disabled)     |
| Badge / Chip       | N/A                             | Consumer (if interactive)   | Consumer (`aria-label` if status)    | Built-in (CVA tokens)   | Consumer (if tappable: 44px) | N/A                           |
| Avatar             | N/A                             | N/A                         | Consumer (`alt` text)                | N/A                     | N/A                          | N/A                           |
| IconButton         | Built-in                        | Built-in                    | Consumer (`aria-label` required)     | Built-in                | Built-in (min 44px)          | N/A                           |

**Key**: "Built-in" = handled by the component/Radix internally · "Consumer" = the page-level component using this shared component must provide · "N/A" = not applicable to this component.

**Enforcement**: All "Consumer" cells must be documented in the consuming phase's component spec. Phase-level review checklists (Phases 1–5) must verify that every Consumer responsibility has a corresponding implementation note.

#### I.4 RSC Compatibility Matrix

Documents which shared UI components require `'use client'` and which are safe to use in React Server Components (RSC). Based on analysis of Radix UI source code and each component's internal dependencies.

> **Rule:** Do not add `'use client'` to a wrapper component unless it uses hooks, state, effects, or event handlers. If the underlying Radix primitive doesn't ship `'use client'`, the wrapper shouldn't either. See [COMPONENT_ARCHITECTURE.md §8](../COMPONENT_ARCHITECTURE.md#radix-ui-and-use-client--what-you-need-to-know) for the full rationale.

| Component                      | Requires `'use client'`? | Reason                                                                                                                               | Radix Package (if any)                  |
| ------------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| Button                         | **No**                   | Uses only `@radix-ui/react-slot` (RSC-safe) + CVA class variants. No hooks, no state.                                                | `react-slot` (no directive)             |
| Card                           | **No**                   | Pure HTML + Tailwind. Zero Radix imports.                                                                                            | None                                    |
| Badge                          | **No**                   | Pure HTML + Tailwind + CVA. Zero Radix imports.                                                                                      | None                                    |
| Skeleton                       | **No**                   | Pure HTML + Tailwind animation. Zero Radix imports.                                                                                  | None                                    |
| Avatar                         | **Yes**                  | Wraps `@radix-ui/react-avatar` which ships `'use client'` — uses `useState`, `useEffect`, `useLayoutEffect` for image load tracking. | `react-avatar` (ships directive)        |
| Separator                      | **No**                   | Wraps `@radix-ui/react-separator` which does not ship `'use client'`.                                                                | `react-separator` (no directive)        |
| Dialog                         | **Yes**                  | Wraps `@radix-ui/react-dialog` — focus trapping, `useState`, `useEffect`.                                                            | `react-dialog` (ships directive)        |
| Drawer                         | **Yes**                  | Built on Dialog + animation state. Inherits client requirement.                                                                      | `react-dialog` (ships directive)        |
| DrawerStack                    | **Yes**                  | Manages drawer stack state with `useState`/`useReducer`.                                                                             | Inherits from Drawer                    |
| Select                         | **Yes**                  | Wraps `@radix-ui/react-select` — `useLayoutEffect`, pointer tracking.                                                                | `react-select` (ships directive)        |
| Tabs                           | **Yes**                  | Wraps `@radix-ui/react-tabs` — `useControllableState`, `useRef`.                                                                     | `react-tabs` (ships directive)          |
| Tooltip                        | **Yes**                  | Wraps `@radix-ui/react-tooltip` — `window.setTimeout`, event listeners.                                                              | `react-tooltip` (ships directive)       |
| Label                          | **Yes**                  | Wraps `@radix-ui/react-label` — event handlers (`onClick`, `onMouseDown`).                                                           | `react-label` (ships directive)         |
| Checkbox                       | **Yes**                  | Wraps `@radix-ui/react-checkbox` — controlled/uncontrolled state.                                                                    | `react-checkbox` (ships directive)      |
| Switch                         | **Yes**                  | Wraps `@radix-ui/react-switch` — toggle state, ARIA management.                                                                      | `react-switch` (ships directive)        |
| DropdownMenu                   | **Yes**                  | Wraps `@radix-ui/react-dropdown-menu` — full interactive menu state.                                                                 | `react-dropdown-menu` (ships directive) |
| AlertDialog                    | **Yes**                  | Wraps `@radix-ui/react-alert-dialog` — modal state, focus trapping.                                                                  | `react-alert-dialog` (ships directive)  |
| Toast / ToastStack             | **Yes**                  | Manages toast queue state, timers, animations.                                                                                       | `react-toast` (ships directive)         |
| Input                          | **Yes**                  | Uses `React.forwardRef` with `onChange` handlers; typically composed with form state.                                                | None (React hooks)                      |
| Popover                        | **Yes**                  | Wraps `@radix-ui/react-popover` — positioning, focus management.                                                                     | `react-popover` (ships directive)       |
| Skeletons (CardSkeleton, etc.) | **No**                   | Pure HTML + Tailwind `animate-pulse`. No hooks, no state.                                                                            | None                                    |
| IconButton                     | Inherits from Button     | Same as Button — if Button doesn't need it, neither does IconButton.                                                                 | Same as Button                          |
| Chip                           | **No**                   | Pure HTML + CVA. `onRemove` callback is passed as prop, not managed internally.                                                      | None                                    |

**Key takeaways:**

- 5 components (Button, Card, Badge, Skeleton, Separator) are RSC-safe and do **not** have `'use client'` — their wrappers use no hooks, state, or effects.
- All interactive Radix-backed components (Dialog, Select, Tabs, etc.) legitimately require `'use client'`.
- When wrapping a Radix primitive, check whether the **Radix package itself** ships `'use client'`. If it doesn't (Slot, Separator, VisuallyHidden, Arrow), your wrapper likely doesn't need it either.
