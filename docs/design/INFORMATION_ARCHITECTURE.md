# Armoury Information Architecture

**Purpose:** Define navigation structure, page hierarchy, URL schema, screen stacks, content model, and labeling system for Armoury across web and mobile.

**Scope:** Web (Next.js 15 App Router) and Mobile (Expo Router). Game-agnostic shell with plugin-provided game-specific content.

**Related Documents:**
- `REQUIREMENTS.md`
- `DECISIONS.md` (page naming and navigation decisions; names referenced as TBD placeholders)
- `STYLE_GUIDE.md`
- `ART_DIRECTION.md` (asset requirements per page)
- `FLOWS.md`
- `MATCH_EXPERIENCE.md`
- `USER_STORIES.md`

**Naming Policy:** Page labels finalized per `DECISIONS.md`. See DD-001 through DD-006 for rationale.

---

## 1. Site Map / App Map

Text-based hierarchy of all pages and deep links.

```
Armoury (Shell)
├── / — Landing (Game System Selector)
├── /login — Auth0 Login
└── /wh40k10e/ — Game System Root
    ├── armies/ — The Forge (HOME)
    │   ├── new — [Army Creation page]
    │   └── [armyId]/ — [Army page]
    │       ├── units/add — [Unit Add modal] (addressable)
    │       └── units/[unitId] — [Unit Configuration & Datasheet page]
    ├── matches/ — War Ledger
    │   ├── new — [Match Creation]
    │   └── [matchId]/ — [Match page] (mode varies by status)
    │       └── command-post — Command Post
    ├── campaigns/ — Campaigns
    │   ├── new — [Campaign Creation page]
    │   └── [campaignId]/ — [Campaign page]
    │       ├── units/[unitId] — [Campaign Unit page]
    │       ├── matches/ — [Campaign Matches page]
    │       └── manage — [Campaign Management page]
    ├── social/ — Allies
    ├── references/ — References
    ├── tournaments/ — [Tournaments page] (placeholder)
    ├── account/ — [Account page] (mobile-only tab; optional alias)
    └── profile/ — [Profile page] (optional alias)
```

**Notes:**
- `wh40k10e` is a slug (e.g., `wh40k10e`, `aos`, `horus-heresy`).
- Account/Profile are game-system-agnostic; see URL Schema for canonical routes.
- Unit Datasheet is also exposed under References for read-only public access.

---

## 2. URL Schema (Web — Next.js App Router)

Map every page to its Next.js route. All game-specific routes are scoped under `wh40k10e`.

| Page | Route | Route Type | Auth Required | Notes |
|------|-------|------------|---------------|-------|
| [Landing / Game System Selector] | `/` | Static | No | Game system selection & sync | 
| [Login] | `/login` | Static | No | Auth0 Universal Login | 
| The Forge | `/wh40k10e/armies` | Dynamic | Yes | Game system home | 
| [Army Creation page] | `/wh40k10e/armies/new` | Dynamic | Yes | | 
| [Army page] | `/wh40k10e/armies/[armyId]` | Dynamic | Yes | Builder view | 
| [Unit Add modal] | `/wh40k10e/armies/[armyId]/units/add` | Dynamic | Yes | Modal but URL-addressable | 
| [Unit Configuration & Datasheet page] | `/wh40k10e/armies/[armyId]/units/[unitId]` | Dynamic | Yes | Interactive | 
| [Unit Datasheet page] | `/wh40k10e/references/units/[unitId]` | Dynamic | No | Read-only, public | 
| War Ledger | `/wh40k10e/matches` | Dynamic | Yes | List | 
| [Match Creation] | `/wh40k10e/matches/new` | Dynamic | Yes | Drawer/screen | 
| [Match page] | `/wh40k10e/matches/[matchId]` | Dynamic | Yes | Past/Future/Active modes | 
| [Active Match — Basic mode] | `/wh40k10e/matches/[matchId]?mode=basic` | Dynamic | Yes | Mode via query/state | 
| [Active Match — Guided mode] | `/wh40k10e/matches/[matchId]?mode=guided` | Dynamic | Yes | Mode via query/state | 
| Command Post | `/wh40k10e/matches/[matchId]/command-post` | Dynamic | Yes | In-match reference | 
| Campaigns | `/wh40k10e/campaigns` | Dynamic | Yes | List | 
| [Campaign Creation page] | `/wh40k10e/campaigns/new` | Dynamic | Yes | | 
| [Campaign page] | `/wh40k10e/campaigns/[campaignId]` | Dynamic | Yes | Dashboard | 
| [Campaign Unit page] | `/wh40k10e/campaigns/[campaignId]/units/[unitId]` | Dynamic | Yes | | 
| [Campaign Matches page] | `/wh40k10e/campaigns/[campaignId]/matches` | Dynamic | Yes | | 
| [Campaign Management page] | `/wh40k10e/campaigns/[campaignId]/manage` | Dynamic | Yes | Organizer-only | 
| Allies | `/wh40k10e/social` | Dynamic | Yes | Friends | 
| References | `/wh40k10e/references` | Dynamic | No | Public | 
| [Account page] | `/account` | Static | Yes | Game-system-agnostic | 
| [Profile page] | `/profile` | Static | Yes | Game-system-agnostic | 
| [Tournaments page] | `/wh40k10e/tournaments` | Dynamic | Yes | Placeholder | 

**Routing conventions:**
- Modal routes are URL-addressable and preserve back-stack (e.g., unit add modal).
- Account/Profile are canonical without `wh40k10e`.

---

## 3. Mobile Screen Stack (Expo Router)

Expo Router layout groups with tabs and nested stacks. All routes mirror web paths for deep links.

```
(tabs)
├── armies (tab)
│   ├── index → The Forge
│   ├── new → [Army Creation page]
│   ├── [armyId] → [Army page]
│   ├── [armyId]/units/add → [Unit Add modal] (modal presentation)
│   └── [armyId]/units/[unitId] → [Unit Configuration & Datasheet page]
├── matches (tab)
│   ├── index → War Ledger
│   ├── new → [Match Creation]
│   ├── [matchId] → [Match page]
│   └── [matchId]/command-post → Command Post
├── campaigns (tab)
│   ├── index → Campaigns
│   ├── new → [Campaign Creation page]
│   ├── [campaignId] → [Campaign page]
│   ├── [campaignId]/units/[unitId] → [Campaign Unit page]
│   ├── [campaignId]/matches → [Campaign Matches page]
│   └── [campaignId]/manage → [Campaign Management page]
├── social (tab)
│   └── index → Allies
├── references (tab)
│   ├── index → References
│   └── units/[unitId] → [Unit Datasheet page] (read-only)
└── account (tab, mobile only)
    └── index → [Account page] + [Profile page] summary
```

**Presentation rules:**
- Unit Add uses modal/sheet presentation; on narrow screens it becomes a full takeover.
- Match Creation uses drawer/sheet presentation; can elevate to full screen on small devices.

---

## 4. Navigation Components

### 4.1 Web Side Nav (≥768px)
- Items (top to bottom): `The Forge`, `War Ledger`, `Campaigns`, `Allies`, `References`.
- Game system switcher at top.
- User avatar/profile at bottom (popover with `[Profile page]`, `[Account page]`, Logout/Login).
- Collapsible to icon-only.

### 4.2 Bottom Nav (Web <768px + Mobile)
- Tabs: `The Forge`, `War Ledger`, `Campaigns`, `Allies`, `References`.
- Mobile adds a 6th tab: `[Account page]`.
- Icons: Lucide + text label; active state uses accent color + indicator.

### 4.3 Header
- Web: page title + profile icon/popover.
- Mobile: back button + page title.
- Army page override: army name + points counter in header.

---

## 5. Labeling System

Top-level navigation names are finalized (see `DECISIONS.md`):
- **The Forge** (army list), **War Ledger** (matches), **Campaigns**, **Allies** (social), **References**
- **Command Post** (in-match reference), **Deploy** (combat view action)

Sub-page labels (e.g., `[Army page]`, `[Campaign Unit page]`) use brackets as descriptive identifiers in this document. These are internal reference names for specs and tickets, not user-facing labels.

| Placeholder Label | Intended Screen |
|-------------------|-----------------|
| The Forge | Army list/home within game system |
| [Army Creation page] | New army flow |
| [Army page] | Army builder/detail |
| [Unit Add modal] | Add unit selection |
| [Unit Configuration & Datasheet page] | Unit config + interactive datasheet |
| [Unit Datasheet page] | Read-only datasheet |
| War Ledger | Matches list |
| [Match Creation] | Match creation drawer/screen |
| [Match page] | Match detail; past/future/active |
| Command Post | In-match army reference |
| Campaigns | Campaigns list |
| [Campaign Creation page] | New campaign flow |
| [Campaign page] | Campaign dashboard |
| [Campaign Unit page] | Crusade unit progression |
| [Campaign Matches page] | Campaign-linked matches |
| [Campaign Management page] | Organizer controls |
| Allies | Friends & sharing |
| References | Rules reference |
| [Account page] | Account settings |
| [Profile page] | User profile |
| [Tournaments page] | Placeholder |
| [Landing / Game System Selector] | Game system selection |
| [Login] | Auth0 login |

---

## 6. Content Model (Entity → Screen Mapping)

| Domain Entity | List Screen | Detail Screen | Create Screen | Edit Context |
|---------------|------------|---------------|---------------|-------------|
| Army | The Forge | [Army page] | [Army Creation page] | [Army page] (inline) |
| ArmyUnit | [Army page] (sections) | [Unit Configuration & Datasheet page] | [Unit Add modal] | [Unit Configuration & Datasheet page] |
| Unit (reference) | [Unit Add modal], References | [Unit Datasheet page] (read-only) | N/A | N/A |
| MatchRecord | War Ledger | [Match page] (3 modes) | [Match Creation] | [Match page] (active mode) |
| MasterCampaign | Campaigns | [Campaign page] | [Campaign Creation page] | [Campaign Management page] |
| ParticipantCampaign | [Campaign page] (participants) | [Campaign page] | Auto-created on join | [Campaign page] |
| CrusadeUnitProgression | [Campaign page] (army section) | [Campaign Unit page] | Auto-created | [Campaign Unit page] |
| Friend | Allies | [Profile page] (friend view) | Add Friend flow | Allies |
| Account | N/A | [Account page] | Auth0 (external) | [Account page] |
| FactionData | [Landing / Game System Selector] | References | N/A (synced) | N/A |

---

## 7. Auth State Behavior

| State | Web Behavior | Mobile Behavior |
|-------|-------------|-----------------|
| Unauthenticated | Can view References and [Unit Datasheet page]; protected routes redirect to `/login`. | Redirect to `/login` on app load. |
| Authenticated, no game system | Redirect to `/` (game system selector). | Same behavior. |
| Authenticated, game system selected | Full access to all `wh40k10e` routes. | Same behavior. |
| Session expired | Silent token refresh; if failure → `/login`. | Same behavior. |

---

## 8. Search and Filter Patterns

| Page | Searchable Fields | Filter Dimensions | Default Sort | Default Filter |
|------|-------------------|-------------------|-------------|----------------|
| The Forge | Army name | Faction, battle size | Updated (newest) | None |
| War Ledger | Match name | Status, army, date range | Date (newest) | Active + Planned |
| Campaigns | Campaign name | Status, type (crusade/generic), date | Date (newest) | Active + Upcoming |
| [Unit Add modal] | Unit name | Section (pre-filtered), keywords | Name (A–Z) | Current section |
| References | Rule/stratagem/ability name | Type, phase, detachment | Name (A–Z) | None |
| Allies | Friend name | Status (pending/accepted) | Name (A–Z) | Accepted |

---

## 9. Back Navigation and Breadcrumbs

**Web:** Browser back/forward. Breadcrumbs on detail pages:
- `Armies > [Army Name] > [Unit Name]`
- `Matches > [Match Name] > Command Post`
- `Campaigns > [Campaign Name] > Units > [Unit Name]`

**Mobile:** Header back button, stack-based per tab.

**Special case — Unit Add modal:**
- Navigating from [Unit Add modal] to [Unit Datasheet page] preserves modal state.
- Back returns to modal (URL remains addressable and stateful).

---

## 10. Deep Linking

- All web pages are deep-linkable via URL.
- Mobile routes mirror web paths for Expo Router deep links.
- Shareable URLs for Army, Match, Campaign pages.
- Match linking via QR code into Match join flow (see `DECISIONS.md`).

---

## 11. Game System Scoping

- `wh40k10e` segment scopes all game-specific content and navigation.
- Switching game systems = navigate to a different `wh40k10e` root.
- Plugins provide game system ID (slug), display name, and icon.
- Account/Profile are game-system-agnostic and live outside the `wh40k10e` segment.

---

## 12. Screen Coverage Checklist

Every requirement-listed page is mapped in Site Map, URL Schema, and Screen Stack.

1. [Landing / Game System Selector]
2. [Login]
3. The Forge
4. [Army Creation page]
5. [Army page]
6. [Unit Add modal]
7. [Unit Configuration & Datasheet page]
8. [Unit Datasheet page]
9. War Ledger
10. [Match Creation]
11. [Match page]
12. [Active Match — Basic mode]
13. [Active Match — Guided mode]
14. Command Post
15. Campaigns
16. [Campaign Creation page]
17. [Campaign page]
18. [Campaign Unit page]
19. [Campaign Matches page]
20. [Campaign Management page]
21. Allies
22. References
23. [Account page]
24. [Profile page]
25. [Tournaments page]
