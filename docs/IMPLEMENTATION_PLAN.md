# Implementation Plan

> Phase 1 Foundation deliverable. Comprehensive page-by-page implementation roadmap for the Armoury frontend, synthesizing requirements, UX issues, and testing strategy into a phased execution plan.

## Table of Contents

- [1. Overview](#1-overview)
- [2. Implementation Phases Overview](#2-implementation-phases-overview)
- [3. Shared Components (Pre-requisites)](#3-shared-components-pre-requisites)
- [4. Phase 1 -- Foundation (Weeks 1-3)](#4-phase-1--foundation-weeks-1-3)
- [5. Phase 2 -- Core Army Building (Weeks 4-7)](#5-phase-2--core-army-building-weeks-4-7)
- [6. Phase 3 -- Match Experience (Weeks 8-13)](#6-phase-3--match-experience-weeks-8-13)
- [7. Phase 4 -- Campaign and Social (Weeks 14-17)](#7-phase-4--campaign-and-social-weeks-14-17)
- [8. Phase 5 -- Polish and Extras (Weeks 18-20)](#8-phase-5--polish-and-extras-weeks-18-20)
- [9. Dependency Graph](#9-dependency-graph)
- [10. Risk Register](#10-risk-register)
- [11. Definition of Done (Per Page)](#11-definition-of-done-per-page)

---

## 1. Overview

### Purpose

This document defines the implementation order, effort estimates, dependencies, and risk factors for all 25 pages identified in the Information Architecture. Each page is mapped to its requirement IDs, user stories, UX issues, and blocking dependencies so that work can be sequenced correctly and progress tracked against concrete deliverables.

### Scope

All frontend pages for `@armoury/web` (Next.js 15) and `@armoury/mobile` (Expo 53). Backend services (`@armoury/authorizer`, `@armoury/campaigns`) and shared library packages (`@armoury/data`, `@armoury/models`, `@armoury/systems`) are out of scope except where they create blocking dependencies for frontend work.

### Related Documents

| Document | Relationship |
|----------|-------------|
| `docs/UI_UX_ISSUES.md` | Companion -- catalogs 75+ UI/UX issues, 6 hard constraints, and 10 missing mockups |
| `docs/TESTING_STRATEGY.md` | Companion -- defines test pyramid, Vitest configs, Playwright + Maestro E2E, CI/CD pipeline |
| `docs/design/INFORMATION_ARCHITECTURE.md` | Source -- 25-page IA, routes, navigation patterns |
| `docs/design/REQUIREMENTS.md` | Source -- all requirement IDs across 18 categories |
| `docs/design/FLOWS.md` | Source -- 12 core user journeys, state machines |
| `docs/design/MATCH_EXPERIENCE.md` | Source -- active match specification (Basic + Guided modes) |
| `docs/design/USER_STORIES.md` | Source -- 100+ user stories with acceptance criteria |
| `docs/design/STYLE_GUIDE.md` | Source -- visual specifications, dark tactical theme |
| `docs/CODING_STANDARDS.md` | Reference -- coding conventions, TDD workflow |

### How This Document Relates to Companions

- **UI_UX_ISSUES.md** identifies *what* needs design resolution before or during implementation. This plan references those issue IDs (e.g., UD-01, MB-15) on every page where they apply, so implementers know which open questions affect their work.
- **TESTING_STRATEGY.md** defines *how* each page will be verified. This plan references the testing pyramid tiers (unit, integration, E2E) in implementation notes where testing approach materially affects effort estimates.

---

## 2. Implementation Phases Overview

| Phase | Timeline | Pages | Key Deliverables |
|-------|----------|-------|-----------------|
| 1 -- Foundation | Weeks 1-3 | 5 | Shell, navigation, auth, landing, army list, army creation |
| 2 -- Core Army Building | Weeks 4-7 | 5 | Army builder, unit add, unit config, unit datasheet, unit detail drawer |
| 3 -- Match Experience | Weeks 8-13 | 6 | War ledger, match creation, match page, basic mode, guided mode, command post |
| 4 -- Campaign and Social | Weeks 14-17 | 7 | Campaign CRUD, campaign dashboard, campaign units/matches, campaign management, allies |
| 5 -- Polish and Extras | Weeks 18-20 | 4 | References, account, profile, tournaments placeholder |

### Phase Dependencies

- Phase 1 is unblocked. Shell + Navigation must complete before any feature page.
- Phase 2 depends on Phase 1 (shell, auth, navigation). Unit Detail Drawer is the critical path item.
- Phase 3 depends on Phase 2 (unit detail drawer adapter for match context). Also blocked by 5 missing mockups.
- Phase 4 depends on Phase 1 (shell, auth) and partially on Phase 2 (unit detail drawer for campaign unit page). Campaign pages are otherwise parallelizable with Phase 3.
- Phase 5 has no blocking dependencies beyond Phase 1 shell. Can be parallelized with Phase 3-4 where resources allow.

---

## 3. Shared Components (Pre-requisites)

These must be built before feature pages reference them. Ordered by dependency priority.

### 3.1 Shell Layout

**Complexity:** M | **Estimated Effort:** 3 days
**Requirements:** GLB-007, GLB-001, PRF-001
**UX Issues:** G-01 through G-05
**Notes:** Header, content area, responsive breakpoints (desktop >=1024px, tablet 768-1023px, mobile <768px). Houses navigation and profile popover. Must support game-system white-labeling via plugin theme tokens.

### 3.2 Navigation

**Complexity:** M | **Estimated Effort:** 3 days
**Requirements:** GLB-002, GLB-003, GLB-004
**UX Issues:** G-06 through G-10
**Notes:** Side navigation at >=768px, bottom tab bar at <768px. Navigation items are game-system-scoped (The Forge, War Ledger, Campaigns, References, Allies). Web uses Next.js App Router `<Link>`, mobile uses Expo Router tabs.

### 3.3 Profile Popover

**Complexity:** S | **Estimated Effort:** 1 day
**Requirements:** GLB-013, ACC-001
**UX Issues:** G-11
**Notes:** Triggered from avatar in shell header. Shows display name, avatar, links to Account and Profile pages, logout action. Radix Popover on web, Tamagui Sheet on mobile.

### 3.4 Theme System

**Complexity:** M | **Estimated Effort:** 3 days
**Requirements:** GLB-008, PLG-001, PLG-004
**UX Issues:** G-12, G-13
**Notes:** Dark tactical base theme. Game-system plugins provide color tokens, typography overrides, and iconography. Tailwind v4 CSS custom properties on web, Tamagui theme tokens on mobile. Must support runtime switching when user changes game system.

### 3.5 Unit Detail Drawer

**Complexity:** XL | **Estimated Effort:** 8 days
**Requirements:** ARM-080, ARM-081, ARM-082, MTH-050, MTH-051
**UX Issues:** UD-01 through UD-15
**Blocked By Missing Mockups:** Yes -- Unit Detail Drawer Single Model, Unit Detail Drawer Multi Model
**Notes:** Highest-risk shared component. Three rendering contexts governed by hard constraints:
- **Reference context** (Constraint A): All unit data displayed, no model list, no HP bar.
- **Builder context** (Constraint B): Model list with add/configure wargear, no HP bar.
- **Match context** (Constraint C): Model list with adjustable HP bar, equipped wargear stats, enhancements, no editing of model count or loadout.
- Constraint E mandates identical layout/UI across contexts; only displayed data changes.
- Constraint F requires injectable adapters so the drawer is game-agnostic.
- Two distinct layouts: single-model units vs. multi-model units.
- Implementation must define the adapter interface before any consuming page can integrate.

### 3.6 Skeleton Loaders

**Complexity:** S | **Estimated Effort:** 1 day
**Requirements:** GLB-005, DLP-002
**UX Issues:** G-14
**Notes:** Shimmer placeholders matching the layout shape of each major content area. Render-as-you-fetch pattern per DLP-001.

### 3.7 Error Boundaries

**Complexity:** S | **Estimated Effort:** 1 day
**Requirements:** DLP-003, DLP-004
**UX Issues:** G-15
**Notes:** Granular error boundaries per content section (not full-page). Display contextual retry actions. Log errors to Sentry.

### 3.8 UI Primitives (Card, Button, Drawer/Modal/Sheet)

**Complexity:** M | **Estimated Effort:** 3 days
**Requirements:** GLB-006, A11Y-001, A11Y-002
**UX Issues:** None identified (covered by component library defaults)
**Notes:** Radix UI primitives on web, Tamagui components on mobile. Shared prop interfaces where possible via `@armoury/shared/frontend`. Accessible by default (keyboard navigation, ARIA attributes, focus management).

### 3.9 Data Loading Patterns

**Complexity:** M | **Estimated Effort:** 2 days
**Requirements:** DLP-001, DLP-005, DLP-006, DLP-007
**UX Issues:** None identified
**Notes:** Render-as-you-fetch with React Suspense boundaries. Stale-while-revalidate caching. Optimistic updates for mutations. Shared data fetching hooks in `@armoury/shared/frontend`.

### 3.10 Form Components

**Complexity:** M | **Estimated Effort:** 2 days
**Requirements:** VAL-001, VAL-002, A11Y-003
**UX Issues:** None identified
**Notes:** Input, Select, RadioGroup, Checkbox, TextArea with consistent validation display. Form state management pattern (controlled components with validation). Shared between army creation, match creation, campaign creation, and account settings.

---

## 4. Phase 1 -- Foundation (Weeks 1-3)

### 4.1 Shell + Navigation

**Route:** Layout wrapper (no dedicated route)
**Complexity:** M
**Estimated Effort:** 5 days (combined with shared components 3.1, 3.2, 3.3)

**Requirements:** GLB-001 through GLB-008, GLB-013, PLG-001, PLG-004
**User Stories:** US-GLB-001 through US-GLB-005
**UX Issues:** G-01 through G-15
**Dependencies:** None (first deliverable)
**Blocked By Missing Mockups:** No

**Implementation Notes:**
- Next.js App Router root layout with `[gameSystem]` dynamic segment for all game-scoped routes.
- Expo Router tab layout mirroring web navigation structure.
- Responsive shell: side nav at >=768px, bottom tab bar at <768px.
- Profile popover in header (Radix Popover web, Tamagui Sheet mobile).
- Theme provider wrapping entire app with game-system token injection.
- Skeleton loaders and error boundaries integrated at layout level.
- E2E: Playwright navigation smoke tests per TESTING_STRATEGY.md.

### 4.2 Authentication (Auth0)

**Route:** `/login`
**Complexity:** M
**Estimated Effort:** 3 days

**Requirements:** AUTH-001 through AUTH-008, SEC-001 through SEC-005
**User Stories:** US-AUTH-001 through US-AUTH-004
**UX Issues:** None identified (Auth0 Universal Login handles UI)
**Dependencies:** Shell (4.1)
**Blocked By Missing Mockups:** No

**Implementation Notes:**
- Auth0 Universal Login redirect flow -- no custom login form.
- Web: `@auth0/auth0-spa-js` with PKCE. Mobile: `react-native-auth0`.
- Protected route middleware in Next.js (server-side session check).
- Expo Router auth guard with secure token storage (expo-secure-store).
- Token refresh handled by Auth0 SDK. Access token attached to API calls via interceptor.
- Post-login redirect to last visited page or default (`/[gameSystem]/armies`).
- E2E: Auth flow tested with Playwright using Auth0 test tenant.

### 4.3 Landing / Game System Selector

**Route:** `/`
**Complexity:** S
**Estimated Effort:** 2 days

**Requirements:** GSS-001 through GSS-006, GLB-009
**User Stories:** US-GSS-001 through US-GSS-003
**UX Issues:** L-01 through L-03
**Dependencies:** Shell (4.1), Auth (4.2)
**Blocked By Missing Mockups:** No

**Implementation Notes:**
- Game system selection grid/list. V1 supports only Warhammer 40K 10th Edition; UI should still render as a selection to establish the pattern for future game systems.
- Selection persists to user preferences (stored server-side via account settings or local storage for anonymous users).
- Selecting a game system navigates to `/[gameSystem]/armies` (The Forge).
- Plugin architecture: game system metadata (name, icon, description, theme tokens) provided by plugin registry.
- Mobile: identical flow via Expo Router, full-screen selector.

### 4.4 The Forge (Army List)

**Route:** `/[gameSystem]/armies`
**Complexity:** M
**Estimated Effort:** 4 days

**Requirements:** ARM-001 through ARM-010, ARM-100 through ARM-104, DLP-001
**User Stories:** US-ARM-001 through US-ARM-005
**UX Issues:** F-01, F-02
**Dependencies:** Shell (4.1), Auth (4.2), Landing (4.3), Card primitive (3.8), Skeleton loaders (3.6)
**Blocked By Missing Mockups:** No

**Implementation Notes:**
- Army list with card-based layout. Each card shows army name, faction, point total, unit count, last modified date.
- Sort/filter controls: by name, by date modified, by faction, by point total.
- Empty state for new users with prominent "Create Army" CTA.
- Swipe-to-delete on mobile (with confirmation). Context menu on web.
- Army cards are tappable, navigating to Army Detail page.
- Render-as-you-fetch with skeleton placeholders during load.
- FAB or header action for "New Army" navigating to `/[gameSystem]/armies/new`.

### 4.5 Army Creation Page

**Route:** `/[gameSystem]/armies/new`
**Complexity:** M
**Estimated Effort:** 3 days

**Requirements:** ARM-011 through ARM-020, PLG-002
**User Stories:** US-ARM-006 through US-ARM-010
**UX Issues:** AC-01, AC-02
**Dependencies:** Shell (4.1), Auth (4.2), Form components (3.10), Data loading (3.9)
**Blocked By Missing Mockups:** No

**Implementation Notes:**
- Multi-step form: select faction, enter army name, set point limit, select detachment.
- Faction list provided by game system plugin (bsdata catalog for WH40K 10e).
- Detachment selection depends on chosen faction. Plugin provides available detachments.
- Validation: army name required, point limit within game system bounds (VAL-001).
- On submit: create army record via `@armoury/data`, navigate to Army Detail page.
- Mobile: identical form flow, Tamagui form components.

---

## 5. Phase 2 -- Core Army Building (Weeks 4-7)

### 5.1 Army Detail (Builder) Page

**Route:** `/[gameSystem]/armies/[armyId]`
**Complexity:** XL
**Estimated Effort:** 8 days

**Requirements:** ARM-020 through ARM-060, ARM-080 through ARM-090, PLG-003, VAL-003
**User Stories:** US-ARM-011 through US-ARM-030
**UX Issues:** AD-01 through AD-09
**Dependencies:** Shell (4.1), The Forge (4.4), Army Creation (4.5), Unit Detail Drawer (3.5), Card (3.8), Data loading (3.9)
**Blocked By Missing Mockups:** Yes -- Unit Detail Drawer Single Model, Unit Detail Drawer Multi Model

**Implementation Notes:**
- Primary army building interface. Three-column layout on desktop (unit list, unit detail, army summary), collapsing to single column with drawer on mobile.
- Unit list shows all added units with summary cards. Tapping a unit opens the Unit Detail Drawer in builder context (Constraint B: model list, wargear config, no HP bar).
- Army summary panel: total points, unit count, detachment bonuses, validation errors.
- Real-time validation: point limit enforcement, faction restrictions, detachment rules (provided by game system plugin).
- Add unit action opens Unit Add Modal (5.2).
- Unit reordering via drag-and-drop (web) or long-press reorder (mobile).
- Delete unit with swipe (mobile) or context menu (web), with undo toast.
- Army metadata editing (name, point limit) via inline edit or settings sheet.

### 5.2 Unit Add Modal

**Route:** `/[gameSystem]/armies/[armyId]/units/add` (modal overlay, not full navigation)
**Complexity:** L
**Estimated Effort:** 5 days

**Requirements:** ARM-030 through ARM-040, PLG-003
**User Stories:** US-ARM-031 through US-ARM-035
**UX Issues:** None identified (standard modal/sheet pattern)
**Dependencies:** Army Detail (5.1), Data loading (3.9), Form components (3.10)
**Blocked By Missing Mockups:** No

**Implementation Notes:**
- Full-screen modal on mobile, side sheet on desktop. Search + filter by unit name, role, keywords.
- Unit catalog provided by game system plugin (bsdata for WH40K 10e). Grouped by battlefield role.
- Each unit entry shows name, role, base point cost, model count range.
- Selecting a unit adds it to the army with default loadout and navigates to Unit Configuration (5.3).
- Search must be fast -- client-side filtering over pre-fetched catalog data.
- Faction/detachment filtering: only show units valid for the army's faction and detachment.

### 5.3 Unit Configuration + Interactive Datasheet

**Route:** `/[gameSystem]/armies/[armyId]/units/[unitId]`
**Complexity:** XL
**Estimated Effort:** 8 days

**Requirements:** ARM-040 through ARM-070, ARM-080, ARM-081, VAL-004
**User Stories:** US-ARM-036 through US-ARM-050
**UX Issues:** UC-01, UD-01 through UD-06 (drawer integration)
**Dependencies:** Army Detail (5.1), Unit Add Modal (5.2), Unit Detail Drawer (3.5)
**Blocked By Missing Mockups:** Yes -- Unit Detail Drawer Single Model, Unit Detail Drawer Multi Model

**Implementation Notes:**
- Full unit configuration page. Uses Unit Detail Drawer in builder context (Constraint B).
- Model list with ability to add/remove models within unit's min-max range.
- Per-model wargear selection. Wargear options provided by game system plugin with constraint validation (e.g., "replace bolt rifle with...").
- Enhancement selection (if unit is eligible). One enhancement per unit, army-wide uniqueness enforced.
- Interactive datasheet: stats table, abilities, keywords. Read from plugin-provided data.
- Point cost recalculated in real-time as wargear/model changes are made.
- Validation errors displayed inline (red borders, error messages) for invalid configurations.
- Save is automatic (optimistic update to local state, sync to backend).

### 5.4 Unit Datasheet (Read-Only)

**Route:** `/[gameSystem]/references/units/[unitId]`
**Complexity:** M
**Estimated Effort:** 3 days

**Requirements:** REF-001 through REF-005, ARM-080
**User Stories:** US-REF-001 through US-REF-003
**UX Issues:** RF-01 through RF-04
**Dependencies:** Shell (4.1), Unit Detail Drawer (3.5), Data loading (3.9)
**Blocked By Missing Mockups:** Yes -- Unit Detail Drawer Single Model, Unit Detail Drawer Multi Model

**Implementation Notes:**
- Read-only unit datasheet accessed from the References section.
- Uses Unit Detail Drawer in reference context (Constraint A: all unit data, no model list, no HP bar).
- Displays full stat block, all wargear options, abilities, keywords, faction keywords.
- No editing capability. Purely informational.
- Accessible without owning an army -- available to all authenticated users.
- Data sourced from game system plugin catalog (same source as Unit Add Modal).

### 5.5 Unit Detail Drawer (Injectable Adapter)

**Route:** N/A (shared component, not a standalone page)
**Complexity:** XL
**Estimated Effort:** 8 days (included in shared components 3.5, scoped here for Phase 2 delivery)

**Requirements:** ARM-080 through ARM-082, MTH-050, MTH-051, PLG-005
**User Stories:** US-ARM-036, US-ARM-050, US-MTH-020
**UX Issues:** UD-01 through UD-15
**Dependencies:** UI Primitives (3.8), Theme (3.4), Data loading (3.9)
**Blocked By Missing Mockups:** Yes -- Unit Detail Drawer Single Model, Unit Detail Drawer Multi Model

**Implementation Notes:**
- Adapter interface definition is the first deliverable (unblocks all consuming pages).
- Three adapter implementations: ReferenceAdapter, BuilderAdapter, MatchAdapter.
- Constraint E: same layout component, different data props per adapter.
- Constraint F: adapters injected via React context or prop drilling -- game-agnostic shell never imports game-specific adapters directly.
- Single-model layout: flat stat display, wargear list.
- Multi-model layout: tabbed or grouped model display with per-model stats and wargear.
- HP bar component (match context only): adjustable per model, clamped to wound characteristic.
- Wargear config component (builder context only): dropdowns/selectors per weapon slot.
- Model list component (builder + match contexts): add/remove in builder, read-only in match.

---

## 6. Phase 3 -- Match Experience (Weeks 8-13)

### 6.1 War Ledger (Matches List)

**Route:** `/[gameSystem]/matches`
**Complexity:** M
**Estimated Effort:** 3 days

**Requirements:** MTH-001 through MTH-010
**User Stories:** US-MTH-001 through US-MTH-005
**UX Issues:** None identified beyond global
**Dependencies:** Shell (4.1), Auth (4.2), Card (3.8), Skeleton loaders (3.6)
**Blocked By Missing Mockups:** No

**Implementation Notes:**
- Match list grouped by status: Active, Upcoming, Past. Active matches pinned to top.
- Each match card shows opponent name, date, armies involved, score (if completed), status badge.
- Filter by status, opponent, date range. Sort by date (default: most recent).
- Empty state with "Create Match" CTA.
- Tapping a match navigates to Match Page (6.3).
- Match state badges: Created, Linking, Linked, Setup, Active, Concluding, Completed.

### 6.2 Match Creation

**Route:** `/[gameSystem]/matches/new`
**Complexity:** L
**Estimated Effort:** 5 days

**Requirements:** MTH-010 through MTH-025
**User Stories:** US-MTH-006 through US-MTH-012
**UX Issues:** MC-01 through MC-04
**Dependencies:** Shell (4.1), Auth (4.2), Form components (3.10), The Forge (4.4 -- army selection)
**Blocked By Missing Mockups:** No

**Implementation Notes:**
- Multi-step flow: select your army, set point limit, choose mission, invite opponent.
- Army selection from user's existing armies (filtered to compatible point range).
- Mission selection provided by game system plugin (WH40K 10e mission deck).
- Opponent invitation: search by username or friend list, or generate invite link.
- Match state machine starts at Created. Transitions to Linking when opponent is invited.
- Opponent accepts invite to transition to Linked. Both players confirm armies for Setup.
- Deployment map selection in Setup phase (game-system-specific, plugin-provided).

### 6.3 Match Page (Past/Future/Active Modes)

**Route:** `/[gameSystem]/matches/[matchId]`
**Complexity:** L
**Estimated Effort:** 4 days

**Requirements:** MTH-025 through MTH-040
**User Stories:** US-MTH-013 through US-MTH-018
**UX Issues:** MB-01 through MB-05 (shared layout issues)
**Dependencies:** War Ledger (6.1), Match Creation (6.2), Card (3.8)
**Blocked By Missing Mockups:** Yes -- Match Setup Phase, Match Deployment Phase

**Implementation Notes:**
- Three display modes determined by match state:
  - **Past** (Completed): Read-only summary with final scores, army lists, round-by-round scoring.
  - **Future** (Created/Linking/Linked): Shows pending actions (accept invite, confirm army, etc.).
  - **Active** (Setup/Active/Concluding): Redirects to Active Match Basic or Guided mode.
- Match state machine governs available actions and UI display.
- Polling sync at ~3s cadence for real-time state updates between players (V1 architecture).
- Match metadata: mission, deployment map, player armies, current round, scores.

### 6.4 Active Match -- Basic Mode

**Route:** `/[gameSystem]/matches/[matchId]?mode=basic`
**Complexity:** XL
**Estimated Effort:** 10 days

**Requirements:** MTH-040 through MTH-065
**User Stories:** US-MTH-019 through US-MTH-035
**UX Issues:** MB-01 through MB-27
**Dependencies:** Match Page (6.3), Unit Detail Drawer -- Match Adapter (5.5), Data loading (3.9)
**Blocked By Missing Mockups:** Yes -- Match Setup Phase, Match Deployment Phase

**Implementation Notes:**
- Primary match tracking interface. Shows both players' army lists side by side (desktop) or tabbed (mobile).
- Constraint D: unit list items show summary of models and wargear, total HP, and ALL interactive state tags (e.g., Battle-shocked, Stealth, Lone Operative).
- State tags are toggable: tap to activate/deactivate status effects on a unit.
- Tapping a unit opens Unit Detail Drawer in match context (Constraint C: adjustable HP bar, equipped wargear, enhancements, no editing loadout).
- Right rail (desktop) or bottom sheet (mobile): mission objectives, secondary missions, scoring.
- Round tracker: advance round, end-of-round scoring prompts.
- Command Point tracker: increment/decrement per player per round.
- Score tracking: primary and secondary objectives, running total.
- Polling sync: all state changes (HP, tags, scores, round) synced between players at ~3s cadence.
- "Switch to Guided" action available at any time.

### 6.5 Active Match -- Guided Mode

**Route:** `/[gameSystem]/matches/[matchId]?mode=guided`
**Complexity:** XL
**Estimated Effort:** 10 days

**Requirements:** MTH-065 through MTH-080
**User Stories:** US-MTH-036 through US-MTH-050
**UX Issues:** MG-01 through MG-11
**Dependencies:** Active Match Basic (6.4), Unit Detail Drawer (5.5)
**Blocked By Missing Mockups:** Yes -- Guided Mode All 5 Phases (Command, Movement, Shooting, Charge, Fight)

**Implementation Notes:**
- Phase-guided match tracking that walks players through each game phase in sequence.
- Five phases per round: Command, Movement, Shooting, Charge, Fight (WH40K 10e specific, plugin-provided).
- Constraint D: unit list items show only phase-relevant states and phase-relevant wargear, plus total HP.
  - Command phase: shows stratagems, CP spending, Battle-shock tests.
  - Movement phase: shows movement values, Advance/Fall Back toggles.
  - Shooting phase: shows ranged weapons, target selection, wound allocation.
  - Charge phase: shows charge distances, eligible units.
  - Fight phase: shows melee weapons, pile-in, consolidate.
- Phase transition prompts: "End Command Phase" advances to Movement, etc.
- Same scoring, CP tracking, and sync as Basic mode.
- "Switch to Basic" action available at any time (preserves all state).
- This is the highest-complexity page in the entire application.

### 6.6 Command Post

**Route:** `/[gameSystem]/matches/[matchId]/command-post`
**Complexity:** L
**Estimated Effort:** 5 days

**Requirements:** MTH-080 through MTH-084
**User Stories:** US-MTH-051 through US-MTH-055
**UX Issues:** None identified (new page, no prior mockup issues cataloged)
**Dependencies:** Active Match Basic (6.4) or Guided (6.5)
**Blocked By Missing Mockups:** No

**Implementation Notes:**
- Accessed from within an active match. Provides strategic overview and tools.
- Mission briefing: full mission rules, primary/secondary objectives, deployment map.
- Army overview: both armies at a glance with key stats.
- Stratagem reference: searchable list of available stratagems for the current game phase.
- Game log: chronological record of all state changes, score updates, phase transitions.
- Shareable match link for spectators (read-only view).
- Web: opens as a full page or side panel. Mobile: full-screen overlay with back-to-match navigation.

---

## 7. Phase 4 -- Campaign and Social (Weeks 14-17)

### 7.1 Campaigns List

**Route:** `/[gameSystem]/campaigns`
**Complexity:** M
**Estimated Effort:** 3 days

**Requirements:** CMP-001 through CMP-010
**User Stories:** US-CMP-001 through US-CMP-005
**UX Issues:** CP-01 through CP-04
**Dependencies:** Shell (4.1), Auth (4.2), Card (3.8)
**Blocked By Missing Mockups:** No

**Implementation Notes:**
- Campaign list grouped by status: Active, Upcoming, Completed. User's campaigns and joined campaigns in separate sections.
- Each campaign card shows name, organizer, participant count, current round, start/end dates.
- Filter by status, role (organizer vs participant). Sort by date.
- Empty state with "Create Campaign" CTA for organizers and "Browse Campaigns" for participants.
- Campaign state badges: Created, Upcoming, Active, Completed.
- Campaign state machine: Created -> Upcoming -> Active -> Completed.

### 7.2 Campaign Creation Page

**Route:** `/[gameSystem]/campaigns/new`
**Complexity:** L
**Estimated Effort:** 4 days

**Requirements:** CMP-010 through CMP-030
**User Stories:** US-CMP-006 through US-CMP-012
**UX Issues:** None identified
**Dependencies:** Shell (4.1), Auth (4.2), Form components (3.10)
**Blocked By Missing Mockups:** Yes -- Campaign Summary mockup

**Implementation Notes:**
- Multi-step form: campaign name, description, format (escalation, narrative, league), point limits, round count, schedule.
- Player invitation: search by username, friend list, or invite link.
- Scoring rules configuration: win/loss/draw points, bonus objectives.
- Campaign-specific rules (provided by game system plugin or custom).
- Army restrictions: faction limits, point escalation schedule per round.
- On creation: campaign state set to Created, organizer becomes first participant.

### 7.3 Campaign Dashboard

**Route:** `/[gameSystem]/campaigns/[campaignId]`
**Complexity:** L
**Estimated Effort:** 5 days

**Requirements:** CMP-030 through CMP-060
**User Stories:** US-CMP-013 through US-CMP-025
**UX Issues:** CD-01 through CD-06
**Dependencies:** Campaigns List (7.1), Campaign Creation (7.2), Card (3.8)
**Blocked By Missing Mockups:** Yes -- Campaign Summary mockup

**Implementation Notes:**
- Campaign hub page. Shows leaderboard, current round, upcoming matches, recent results.
- Leaderboard: ranked by campaign points, with win/loss record.
- Schedule: round-by-round pairings (generated by organizer or system).
- Participant list with army assignments.
- Campaign rules summary (format, point limits, restrictions).
- Actions vary by role: organizer sees management actions, participants see "Report Match" CTA.
- News/announcements section (organizer-posted).

### 7.4 Campaign Unit Page

**Route:** `/[gameSystem]/campaigns/[campaignId]/units/[unitId]`
**Complexity:** M
**Estimated Effort:** 3 days

**Requirements:** CMP-060 through CMP-080
**User Stories:** US-CMP-026 through US-CMP-030
**UX Issues:** CD-07 through CD-09
**Dependencies:** Campaign Dashboard (7.3), Unit Detail Drawer (5.5)
**Blocked By Missing Mockups:** Yes -- Unit Detail Drawer Single Model, Unit Detail Drawer Multi Model

**Implementation Notes:**
- Campaign-specific unit view. Shows a unit's performance across campaign matches.
- Uses Unit Detail Drawer in a read-only context similar to Reference (Constraint A).
- Additional campaign data overlaid: matches played, kills, deaths, battle honors (if campaign format supports them).
- Narrative campaigns may track unit progression (experience, upgrades, injuries) -- data structure provided by game system plugin.
- Link back to the match where each stat was recorded.

### 7.5 Campaign Matches Page

**Route:** `/[gameSystem]/campaigns/[campaignId]/matches`
**Complexity:** M
**Estimated Effort:** 3 days

**Requirements:** CMP-080 through CMP-100
**User Stories:** US-CMP-031 through US-CMP-040
**UX Issues:** CD-10 through CD-12
**Dependencies:** Campaign Dashboard (7.3), War Ledger (6.1)
**Blocked By Missing Mockups:** No

**Implementation Notes:**
- Campaign match history and scheduling. Reuses match card components from War Ledger (6.1).
- Grouped by round. Shows pairings, results, scores.
- "Report Match" action: link an existing match to the campaign round.
- Match creation shortcut: create a new match pre-populated with campaign settings (point limit, opponent from pairings).
- Organizer can override reported results if disputes arise.

### 7.6 Campaign Management (Organizer)

**Route:** `/[gameSystem]/campaigns/[campaignId]/manage`
**Complexity:** L
**Estimated Effort:** 5 days

**Requirements:** CMP-100 through CMP-123
**User Stories:** US-CMP-041 through US-CMP-055
**UX Issues:** None identified
**Dependencies:** Campaign Dashboard (7.3), Form components (3.10)
**Blocked By Missing Mockups:** Yes -- Campaign Management Page mockup

**Implementation Notes:**
- Organizer-only page (access gated by role check).
- Participant management: invite, remove, reassign armies.
- Round management: generate pairings (random, Swiss-style, manual), advance round.
- Scoring overrides: edit match results, apply bonus points.
- Campaign settings editing: modify rules, point limits, schedule mid-campaign.
- Announcement publishing: create/edit campaign news posts.
- Campaign state transitions: advance from Created -> Upcoming -> Active -> Completed.

### 7.7 Allies (Social)

**Route:** `/[gameSystem]/social`
**Complexity:** M
**Estimated Effort:** 4 days

**Requirements:** SOC-001 through SOC-011
**User Stories:** US-SOC-001 through US-SOC-008
**UX Issues:** SA-01 through SA-05
**Dependencies:** Shell (4.1), Auth (4.2), Card (3.8)
**Blocked By Missing Mockups:** No

**Implementation Notes:**
- Friend list management. Shows accepted friends, pending requests (sent and received), blocked users.
- Friend request flow: search by username, send request, accept/reject incoming requests.
- Friend request state machine: Sent -> Pending -> Accepted / Rejected / Blocked.
- Friend cards show display name, avatar, last active timestamp, game systems in common.
- Quick actions: challenge to match, invite to campaign.
- WebSocket or polling for real-time friend request notifications (uses `@armoury/streams`).
- Privacy controls: block user, hide online status.

---

## 8. Phase 5 -- Polish and Extras (Weeks 18-20)

### 8.1 References

**Route:** `/[gameSystem]/references`
**Complexity:** M
**Estimated Effort:** 3 days

**Requirements:** REF-001 through REF-005
**User Stories:** US-REF-001 through US-REF-005
**UX Issues:** RF-01 through RF-04
**Dependencies:** Shell (4.1), Unit Detail Drawer -- Reference Adapter (5.5), Data loading (3.9)
**Blocked By Missing Mockups:** No

**Implementation Notes:**
- Game system reference hub. Browse all available units, factions, detachments, rules.
- Unit browser: searchable/filterable catalog with Unit Datasheet links (5.4).
- Faction browser: faction list with lore, faction abilities, available detachments.
- Rules reference: core rules, stratagems (game-system plugin provides data).
- All content is read-only. No user-specific data beyond bookmarks/favorites.
- Data sourced from game system plugin catalog (`@armoury/systems` via bsdata).

### 8.2 Account

**Route:** `/account`
**Complexity:** S
**Estimated Effort:** 2 days

**Requirements:** ACC-001 through ACC-005
**User Stories:** US-ACC-001 through US-ACC-003
**UX Issues:** None identified
**Dependencies:** Shell (4.1), Auth (4.2), Form components (3.10)
**Blocked By Missing Mockups:** No

**Implementation Notes:**
- Account settings page. Not game-system-scoped (no `[gameSystem]` in route).
- Email management (linked to Auth0 profile).
- Password change (via Auth0 change password flow).
- Notification preferences (email, push).
- Data export/download (GDPR compliance).
- Account deletion (soft delete with grace period, per SEC-004).
- Minimal UI -- settings form with save action.

### 8.3 Profile

**Route:** `/profile`
**Complexity:** S
**Estimated Effort:** 2 days

**Requirements:** GLB-013, SOC-010, SOC-011
**User Stories:** US-SOC-009 through US-SOC-011
**UX Issues:** None identified
**Dependencies:** Shell (4.1), Auth (4.2), Form components (3.10)
**Blocked By Missing Mockups:** No

**Implementation Notes:**
- Public profile editing. Not game-system-scoped.
- Display name, avatar upload, bio text.
- Privacy settings: profile visibility (public, friends-only, private).
- Game system preferences: default game system, display preferences.
- Stats summary: total armies, matches played, win rate (read-only, computed).
- Avatar upload: image crop/resize, stored via S3 or equivalent.

### 8.4 Tournaments (Placeholder)

**Route:** `/[gameSystem]/tournaments`
**Complexity:** S
**Estimated Effort:** 1 day

**Requirements:** TRN-001
**User Stories:** None (placeholder feature)
**UX Issues:** None identified
**Dependencies:** Shell (4.1), Auth (4.2)
**Blocked By Missing Mockups:** No

**Implementation Notes:**
- Placeholder page indicating tournaments are a planned future feature.
- Static content: feature description, "Coming Soon" messaging.
- Optional: email signup for tournament feature notifications.
- No functional implementation. Route exists to reserve the URL pattern and navigation slot.
- Will be expanded in a future implementation phase beyond the current 20-week scope.

---

## 9. Dependency Graph

```
Legend: A --> B means "A must be completed before B can start"
        [SHARED] = shared component (Section 3)
        [P1-P5]  = implementation phase

[SHARED] Shell + Navigation
    |
    +--> [SHARED] Theme System
    +--> [SHARED] Skeleton Loaders
    +--> [SHARED] Error Boundaries
    +--> [SHARED] UI Primitives
    |       |
    |       +--> [SHARED] Form Components
    |
    +--> [P1] Auth (/login)
    |       |
    |       +--> [P1] Landing (/)
    |       |       |
    |       |       +--> [P1] The Forge (/armies)
    |       |       |       |
    |       |       |       +--> [P1] Army Creation (/armies/new)
    |       |       |               |
    |       |       |               +--> [P2] Army Detail (/armies/[armyId])
    |       |       |                       |
    |       |       |                       +--> [P2] Unit Add Modal
    |       |       |                       |       |
    |       |       |                       |       +--> [P2] Unit Configuration
    |       |       |                       |
    |       |       |                       +--> [P3] (via Unit Detail Drawer)
    |       |       |
    |       |       +--> [P3] War Ledger (/matches)
    |       |       |       |
    |       |       |       +--> [P3] Match Creation (/matches/new)
    |       |       |               |
    |       |       |               +--> [P3] Match Page (/matches/[matchId])
    |       |       |                       |
    |       |       |                       +--> [P3] Active Match Basic
    |       |       |                       |       |
    |       |       |                       |       +--> [P3] Active Match Guided
    |       |       |                       |       |
    |       |       |                       |       +--> [P3] Command Post
    |       |       |                       |
    |       |       |                       +--> [P4] Campaign Matches (reuses match cards)
    |       |       |
    |       |       +--> [P4] Campaigns (/campaigns)
    |       |       |       |
    |       |       |       +--> [P4] Campaign Creation
    |       |       |               |
    |       |       |               +--> [P4] Campaign Dashboard
    |       |       |                       |
    |       |       |                       +--> [P4] Campaign Unit Page
    |       |       |                       +--> [P4] Campaign Matches Page
    |       |       |                       +--> [P4] Campaign Management
    |       |       |
    |       |       +--> [P4] Allies (/social)
    |       |       |
    |       |       +--> [P5] References (/references)
    |       |               |
    |       |               +--> [P2] Unit Datasheet (read-only)
    |       |
    |       +--> [P5] Account (/account)
    |       +--> [P5] Profile (/profile)
    |       +--> [P5] Tournaments (/tournaments) [placeholder]
    |
    +--> [SHARED] Data Loading Patterns
            |
            +--> [SHARED] Unit Detail Drawer  <-- CRITICAL PATH
                    |
                    +--> [P2] Army Detail (builder adapter)
                    +--> [P2] Unit Configuration (builder adapter)
                    +--> [P2] Unit Datasheet (reference adapter)
                    +--> [P3] Active Match Basic (match adapter)
                    +--> [P3] Active Match Guided (match adapter)
                    +--> [P4] Campaign Unit Page (reference adapter)
```

### Critical Path

The critical path runs through:
1. Shell -> Auth -> Landing -> The Forge -> Army Creation (Phase 1)
2. Unit Detail Drawer adapter interface (shared component, blocks Phase 2-3)
3. Army Detail -> Unit Configuration (Phase 2)
4. Match Page -> Active Match Basic -> Active Match Guided (Phase 3)

The Unit Detail Drawer is the single highest-risk item because it blocks both the army building workflow (Phase 2) and the match experience (Phase 3).

---

## 10. Risk Register

| ID | Risk | Likelihood | Impact | Phase Affected | Mitigation |
|----|------|-----------|--------|---------------|------------|
| R-01 | **Missing mockups** block implementation. 5 critical mockups (Unit Detail Drawer single/multi model, Match Setup, Match Deployment, Guided Mode phases) remain undesigned. | High | High | Phase 2, Phase 3 | Prioritize mockup creation in Weeks 1-2. Begin Phase 2 with adapter interface definition (code-level) while mockups are finalized. If mockups are delayed beyond Week 3, Phase 2-3 timelines slip proportionally. |
| R-02 | **Unit Detail Drawer complexity** exceeds estimates. 6 blocking UX issues (UD-01 through UD-06), 3 rendering contexts, 2 layouts, injectable adapter pattern. | High | High | Phase 2, Phase 3 | Spike the adapter interface in Week 1 of Phase 2. Build reference adapter first (simplest context), then builder, then match. Time-box each adapter to 2 days; if exceeded, escalate for scope reduction. |
| R-03 | **Match experience scope** is the largest feature surface. 26+ UX issues (MB-01 through MB-27), two distinct modes (Basic/Guided), real-time sync, complex state management. | Medium | High | Phase 3 | Ship Basic mode first as MVP (Weeks 8-11), Guided mode as follow-up (Weeks 11-13). If Guided mode slips, it becomes first item in a Phase 3b extension rather than blocking Phase 4. |
| R-04 | **Real-time sync polling** architecture (~3s cadence) may have performance or UX issues at scale. V1 uses polling; WebSocket upgrade is deferred. | Medium | Medium | Phase 3 | Implement polling behind an abstraction layer (`@armoury/streams`) so that WebSocket can replace it without UI changes. Load test polling at 2-player scale early in Phase 3. Monitor for sync conflicts and implement last-write-wins with conflict toast. |
| R-05 | **Plugin architecture boundary** is not fully exercised until game-specific content is rendered. Incorrect boundary placement could require significant refactoring. | Medium | High | Phase 2, Phase 3, Phase 4 | Define plugin interface contracts (TypeScript interfaces) in Phase 1. WH40K 10e plugin is the reference implementation. Verify plugin boundary at each phase gate: can the shell render without importing game-specific code directly? |
| R-06 | **Cross-platform parity** between web (Next.js) and mobile (Expo) drifts as features are implemented. Different component libraries (Radix vs Tamagui), different routing (App Router vs Expo Router). | Low | Medium | All phases | Share business logic and data layer via `@armoury/shared`. Keep platform-specific code in `@armoury/web` and `@armoury/mobile` only. Cross-platform smoke tests at each phase gate. Accept that mobile may lag web by 1-2 weeks per phase. |

---

## 11. Definition of Done (Per Page)

A page is considered complete when all of the following criteria are met:

### Functional Completeness
- All requirement IDs listed for the page are implemented and verifiable.
- All user stories for the page have their acceptance criteria met.
- All UX issues listed for the page are resolved or have documented deferral decisions.

### Code Quality
- TypeScript strict mode: no `any` types, no `@ts-ignore`, no `@ts-expect-error`.
- Named exports only (no default exports except framework-required).
- Path aliases used for all non-relative imports.
- `@requirements` block present in every source file.
- JSDoc on all public API functions and components.
- Follows patterns established in `docs/CODING_STANDARDS.md`.

### Testing (per docs/TESTING_STRATEGY.md)
- Unit tests: >=60% line coverage for the page's module (Vitest).
- Integration tests: data flow between page and shared services verified.
- E2E tests: critical user journey covered (Playwright for web, Maestro for mobile).
- All tests pass in CI pipeline.

### Accessibility (per A11Y requirements)
- Keyboard navigation functional for all interactive elements.
- Screen reader announcements for dynamic content changes.
- Color contrast meets WCAG 2.1 AA minimum (4.5:1 for text).
- Focus management correct for modals, drawers, and navigation transitions.

### Responsive Design
- Desktop (>=1024px): full layout with side navigation.
- Tablet (768-1023px): adapted layout with side navigation.
- Mobile (<768px): mobile layout with bottom tab navigation.
- No horizontal scroll at any breakpoint.

### Cross-Platform (if applicable)
- Web implementation functional and tested.
- Mobile implementation functional and tested (may lag by 1-2 weeks per R-06).
- Shared business logic verified on both platforms.

### Review and Approval
- Code review passed (no unresolved comments).
- Product review passed (matches mockups and requirements).
- Accessibility audit passed (automated + manual spot check).
- Page merged to main branch via PR.
