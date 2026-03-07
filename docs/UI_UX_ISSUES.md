# UI/UX Issues, Decisions, and Constraints

**Purpose:** Catalog every UI/UX issue, constraint, and open question identified during mockup review. This is the single reference for all known design debt and pending implementation decisions.

**Scope:** Web (`@armoury/web`) and Mobile (`@armoury/mobile`). V1 — Warhammer 40K 10th Edition via `@armoury/systems`.

**Source Files:**
- `ui_notes.txt` (171 lines) — initial UI specification notes
- `note_02_12_2025.txt` (124 lines) — detailed mockup review feedback, Feb 12 2025
- `notes_02_15_2025.txt` (58 lines) — final refinement notes, Feb 15 2025

**Related Documents:**
- `docs/design/REQUIREMENTS.md` — canonical requirement IDs (GLB-*, ARM-*, MTH-*, CMP-*, SOC-*, REF-*, etc.)
- `docs/design/FLOWS.md` — routes and user journeys per page
- `docs/design/MATCH_EXPERIENCE.md` — active match layout and mode detail
- `docs/design/USER_STORIES.md` — user stories with acceptance criteria
- `docs/design/INFORMATION_ARCHITECTURE.md` — IA and URL schema
- `docs/design/STYLE_GUIDE.md` — visual specifications and component patterns

---

## Status Key

| Marker | Meaning |
|--------|---------|
| 🔴 | **Blocking** — must resolve before implementation of that feature can begin |
| 🟡 | **Important** — must fix during implementation |
| 🟢 | **Enhancement** — can defer to a follow-up iteration |

---

## Table of Contents

1. [User Constraints (Verbatim)](#1-user-constraints-verbatim)
2. [Global / Cross-cutting](#2-global--cross-cutting)
3. [Landing Page](#3-landing-page)
4. [The Forge (Army List)](#4-the-forge-army-list)
5. [Army Creation](#5-army-creation)
6. [Army Details (Army Builder)](#6-army-details-army-builder)
7. [Unit Configuration](#7-unit-configuration)
8. [Unit Detail Drawer (All Contexts)](#8-unit-detail-drawer-all-contexts)
9. [Match Basic Mode](#9-match-basic-mode)
10. [Match Guided Mode](#10-match-guided-mode)
11. [War Ledger (Matches List)](#11-war-ledger-matches-list)
12. [Match Creation Drawer](#12-match-creation-drawer)
13. [Campaigns List](#13-campaigns-list)
14. [Campaign Detail](#14-campaign-detail)
15. [Social / Allies](#15-social--allies)
16. [References](#16-references)
17. [Missing Mockups](#17-missing-mockups)

---

## 1. User Constraints (Verbatim)

These are hard constraints on unit detail drawer behavior across contexts. They override any mockup that contradicts them.

> **Constraint A — Reference and Army Creation (read-only view):**
> "everything for a unit is displayed and there is no model list or HP bar for when users are looking at the unit stats in the reference page and the army creation page when they are just looking at the unit information, not after they have added that unit"

> **Constraint B — Army Builder (configuration view):**
> "when they are configuring a unit in the army page, they don't see the HP bar, but they see the model list view with the ability to add models and configure wargear per model"

> **Constraint C — Match (tracking view):**
> "In the match page, they see the and the model list, which contains the adjustable HP bar and the weapon stats for the equipped war gear, plus the enhancements for that unit (if applicable), but they are unable to change the model count or loadout"

> **Constraint D — Basic vs. Guided unit list items:**
> "both the guided and basic army page have the same unit list in the main content area. The difference is that in the basic mode, the unit item in the list shows a summary of the unit models and wargear, the total HP of the unit, and all the state tags (interactive tags) that the unit has. In the guided mode, the unit item in the list show the unit information, but only shows the toggable states relevant for the current phase and the relevant wargear for the current phase, as well as the total HP of the unit"

> **Constraint E — Drawer layout consistency:**
> "The unit detail drawers should all have the same layout and UI, just that the data that gets displayed changes based on the context"

---

## 2. Global / Cross-cutting

| # | Issue | Source | Related Requirements | Status |
|---|-------|--------|----------------------|--------|
| G-01 | Responsive layout must handle desktop, tablet, and mobile breakpoints. Specific failures noted at ≤1024px (see M-09). | `note_02_12_2025.txt`, `ui_notes.txt` | GLB-001, GLB-002, GLB-003 | 🔴 |
| G-02 | Skeleton loaders required for all loading states, sized to match final layout to prevent CLS. | `ui_notes.txt` | GLB-005, DLP-002 | 🔴 |
| G-03 | Render-as-you-fetch: data fetching must be initiated before render, not after mount. | `ui_notes.txt` | GLB-006, DLP-001 | 🔴 |
| G-04 | Dark tactical theme only in V1. No light mode. | `ui_notes.txt` | GLB-008 | 🔴 |
| G-05 | Shared style guide and design token system required across web and mobile. No one-off color or spacing values. | `ui_notes.txt` | GLB-016 | 🟡 |
| G-06 | No trademark violations. All imagery must be AI-generated. No game publisher logos, icons, or official artwork. | `ui_notes.txt` | GLB-014 | 🔴 |
| G-07 | Maximize shared code between web and mobile. Diverge only where platform conventions require it. | `ui_notes.txt` | GLB-016, PLG-006 | 🟡 |
| G-08 | Profile button must open a popover (not navigate to a new page) containing: username, friend code, logout action. Not labeled "Commander" or any game-specific term. | `note_02_12_2025.txt` | GLB-012, GLB-013, ACC-004 | 🟡 |
| G-09 | Left navigation must be collapsible on desktop/tablet. | `note_02_12_2025.txt` | GLB-003 | 🟡 |
| G-10 | Nested pages must not show a top-level header. Use breadcrumbs or in-page back navigation instead. | `note_02_12_2025.txt` | GLB-011, GLB-012 | 🟡 |
| G-11 | Color hierarchy must be consistently enforced. Primary actions use the primary color; secondary and tertiary actions must be visually subordinate. Specific violations noted in Campaigns and Campaign Detail. | `note_02_12_2025.txt` | GLB-016 | 🟡 |
| G-12 | UI aesthetic must feel modern. Avoid Material Design-ish patterns (card borders, elevated shadows, Google-style controls). | `note_02_12_2025.txt` | GLB-008, GLB-016 | 🟡 |
| G-13 | Game system white-labeling: the shell uses faction colors when a game system and faction are active. Color tokens must support per-faction theming via plugin. | `note_02_12_2025.txt` | PLG-001, PLG-004 | 🟡 |
| G-14 | Blue accent color is too light. Darken it to better suit the dark tactical theme. | `note_02_12_2025.txt` | GLB-008 | 🟡 |
| G-15 | The "Commander" label on the profile area must be removed and replaced with the profile button popover pattern (see G-08). | `note_02_12_2025.txt` | GLB-012, GLB-013 | 🟡 |

---

## 3. Landing Page

Route: `/` → `[Landing / Game System Selector]` (FLOWS.md Journey 1)

| # | Issue | Source | Related Requirements | Status |
|---|-------|--------|----------------------|--------|
| L-01 | Game system tiles must use a full-bleed scene illustration as the background, not an icon or logo. No icons inside tiles. | `note_02_12_2025.txt`, `ui_notes.txt` | GSS-001, GLB-014 | 🔴 |
| L-02 | Remove "Planned" tag from any game system tile that is not yet available. Tiles for unavailable systems should not appear or should be visually neutral without labeling them as planned. | `note_02_12_2025.txt`, `ui_notes.txt` | GSS-001 | 🟡 |
| L-03 | Add registration copy to the landing page. New visitors need context on what the app does before being prompted to select a game system. | `note_02_12_2025.txt` | AUTH-004 | 🟡 |

---

## 4. The Forge (Army List)

Route: `/[gameSystem]/armies` (FLOWS.md Journey 2)

| # | Issue | Source | Related Requirements | Status |
|---|-------|--------|----------------------|--------|
| F-01 | Deploy buttons on army cards must be primary-styled (most prominent). Use a crossed swords icon. | `note_02_12_2025.txt`, `ui_notes.txt` | ARM-001, ARM-002 | 🟡 |
| F-02 | Army cards must include a splash/faction image as the card background or prominent visual element. | `ui_notes.txt` | ARM-002, ARM-007 | 🟡 |

---

## 5. Army Creation

Route: `/[gameSystem]/armies/new` (FLOWS.md Journey 2)

| # | Issue | Source | Related Requirements | Status |
|---|-------|--------|----------------------|--------|
| AC-01 | Detachment selector must be hidden until the user has selected a faction. Showing it before faction selection is misleading because detachments are faction-specific. | `note_02_12_2025.txt` | ARM-022 | 🔴 |
| AC-02 | Reference the WH40K app flow for army creation UX patterns. The creation flow should feel familiar to players already using official tools. | `note_02_12_2025.txt` | ARM-020 through ARM-027 | 🟢 |

---

## 6. Army Details (Army Builder)

Route: `/[gameSystem]/armies/[armyId]` (FLOWS.md Journey 3)

| # | Issue | Source | Related Requirements | Status |
|---|-------|--------|----------------------|--------|
| AD-01 | Banner image must be larger. The current size is insufficient for the tactical aesthetic. | `note_02_12_2025.txt` | ARM-040 | 🟡 |
| AD-02 | Detachment and battle size must be clearly changeable from the Army Details page. Users must be able to see these fields and understand they are editable without ambiguity. | `note_02_12_2025.txt` | ARM-041 | 🟡 |
| AD-03 | Remove the page header. Points total and army name should not be duplicated in a top bar. Use a breadcrumb for navigation context instead. | `note_02_12_2025.txt` | ARM-040 | 🟡 |
| AD-04 | Add breadcrumb navigation (The Forge → Army Name) on Army Details. | `note_02_12_2025.txt` | ARM-040 | 🟡 |
| AD-05 | Section label "Infantry" is incorrect. Use "Auxiliary" per the WH40K 10th Edition category naming. | `note_02_12_2025.txt` | ARM-042 | 🔴 |
| AD-06 | All unit sections must always be visible, even when empty. An empty section should display a disabled state with a message (e.g., "No units added yet") rather than being hidden. | `note_02_12_2025.txt` | ARM-042 | 🟡 |
| AD-07 | Remove the "saved" status indicator from the Army Details page. Optimistic updates make this redundant and it creates noise. | `note_02_12_2025.txt` | ARM-048 | 🟢 |
| AD-08 | Deploy button must appear in the army summary panel. It should not only live on the army card in The Forge. | `note_02_12_2025.txt` | ARM-040 | 🟡 |
| AD-09 | Army sections must include: Characters, Battleline, Transports, Dreadnoughts, Walkers, Vehicles, Auxiliary, Allied. Verify this list matches the plugin's unit category taxonomy. | `ui_notes.txt` | ARM-042 | 🟡 |

---

## 7. Unit Configuration

Route: `/[gameSystem]/armies/[armyId]/units/[unitId]` (FLOWS.md Journey 3)

| # | Issue | Source | Related Requirements | Status |
|---|-------|--------|----------------------|--------|
| UC-01 | Keywords section must appear below Enhancements, not inside the Unit Composition section. | `note_02_12_2025.txt` | ARM-080, ARM-083 | 🟡 |

---

## 8. Unit Detail Drawer (All Contexts)

The unit detail drawer appears in three contexts: Reference (read-only), Army Builder (configurable), and Match (HP tracking). See Section 1 (User Constraints) for the authoritative behavioral rules.

### 8.1 Shared Layout and Behavior

| # | Issue | Source | Related Requirements | Status |
|---|-------|--------|----------------------|--------|
| UD-01 | The drawer must be closeable. The close button closes all open modals/drawers in the stack, not just the top one. | `note_02_12_2025.txt`, `notes_02_15_2025.txt` | ARM-080 | 🔴 |
| UD-02 | The drawer must be approximately 200px wider than current mockups. No horizontal scrolling allowed inside the drawer at any breakpoint. | `note_02_12_2025.txt` | ARM-080 | 🔴 |
| UD-03 | Unit detail drawers must be twice as wide as initially mocked, and fluid-responsive (full-screen on small viewports). | `notes_02_15_2025.txt` | ARM-080, GLB-001 | 🔴 |
| UD-04 | All unit detail drawers (Reference, Army Builder, Match) must use the same layout and visual structure. Only the data shown changes. See Constraints A–E in Section 1. | `notes_02_15_2025.txt` | ARM-080, ARM-100 | 🔴 |
| UD-05 | Unit items in the Army page unit list must open the unit detail drawer, not navigate to a new page. | `notes_02_15_2025.txt` | ARM-080 | 🔴 |
| UD-06 | The Add Unit drawer on the Army page: both unit detail drawers on the army page (unit list drawer and add-unit drawer) must be identical in layout. They should contain the full content of the Unit Config page (route: `.../units/[unitId]`). | `notes_02_15_2025.txt` | ARM-080, ARM-060 | 🔴 |
| UD-07 | Unit filters in the Add Unit drawer are cut off because the container is not tall enough. The filter UI must be fully visible without scrolling past it. | `notes_02_15_2025.txt` | ARM-061 | 🟡 |
| UD-08 | Weapon font size inside the drawer must be smaller to allow more content without scrolling. | `note_02_12_2025.txt` | ARM-080 | 🟡 |
| UD-09 | Remove the "equipped loadout" section label. Show wargear under the Melee section directly. | `note_02_12_2025.txt` | ARM-082 | 🟡 |
| UD-10 | Fetch real unit data from BSData for implementation and testing. Use the Intercessor Squad as the reference multi-model unit and the Captain in Terminator Armour as the reference single-model unit. | `notes_02_15_2025.txt` | ARM-080, PLG-002 | 🔴 |

### 8.2 Single-Model Drawer Structure

Applies when the unit has exactly one model (e.g., Captain in Terminator Armour).

| # | Issue | Source | Related Requirements | Status |
|---|-------|--------|----------------------|--------|
| UD-11 | Single-model drawer layout (in order): Unit Name, Keywords, M/T/SV/W/LD/OC stat line, Health Bar (match context only), Ranged Weapons, Melee Weapons, Wargear, Abilities. | `notes_02_15_2025.txt` | ARM-080, MTH-063 | 🔴 |
| UD-12 | For single-model units in the Match context, the HP bar must appear to the right of the unit name (inline in the header area), not below the stat line. | `note_02_12_2025.txt` | MTH-063 | 🟡 |
| UD-13 | A mockup is required for the single-model drawer. Use the Captain in Terminator Armour as the representative unit. | `notes_02_15_2025.txt` | ARM-080 | 🔴 |

### 8.3 Multi-Model Drawer Structure

Applies when the unit has more than one model (e.g., Intercessor Squad).

| # | Issue | Source | Related Requirements | Status |
|---|-------|--------|----------------------|--------|
| UD-14 | Multi-model drawer layout (in order): Unit Name, Keywords, M/T/SV/W/LD/OC stat line, Wargear (unit-level), Unit-specific Abilities, Model List. Each model in the list shows: model name, health (match context only), ranged weapons for that model, melee weapons for that model, model-specific wargear. | `notes_02_15_2025.txt` | ARM-080, ARM-081 | 🔴 |
| UD-15 | The multi-model structure is distinct from the single-model structure. The mockup must show both layouts. A mockup for the multi-model drawer is required using the Intercessor Squad. | `notes_02_15_2025.txt` | ARM-080 | 🔴 |

### 8.4 Context-Specific Behavior Summary

| Context | Model List | HP Bar | Loadout Editing | Model Count Editing |
|---------|-----------|--------|-----------------|---------------------|
| Reference (`/references/units/[unitId]`) | No | No | No | No |
| Army Creation (browsing, not yet added) | No | No | No | No |
| Army Builder (unit added, drawer from unit list) | Yes | No | Yes (per model) | Yes |
| Match (Basic or Guided) | Yes | Yes (adjustable) | No | No |

---

## 9. Match Basic Mode

Route: `/[gameSystem]/matches/[matchId]?mode=basic` (FLOWS.md Journey 5, MATCH_EXPERIENCE.md)

| # | Issue | Source | Related Requirements | Status |
|---|-------|--------|----------------------|--------|
| MB-01 | The "Detachment" label must appear on the relevant section or card in the Basic Match view. | `note_02_12_2025.txt` | MTH-060, MTH-066 | 🟡 |
| MB-02 | All icons in the Basic Match view must be white on dark backgrounds. No colored icons. | `note_02_12_2025.txt` | GLB-008 | 🟡 |
| MB-03 | Rules text must be larger. Current mockups render it too small to read during play. | `note_02_12_2025.txt` | MTH-060 | 🟡 |
| MB-04 | The unit detail drawer must be closeable from the Basic Match view. | `note_02_12_2025.txt` | MTH-063, UD-01 | 🔴 |
| MB-05 | The drawer must be approximately 200px wider in the match context. No horizontal scrolling inside it. | `note_02_12_2025.txt` | MTH-063, UD-02 | 🔴 |
| MB-06 | The match view header must be taller. It currently lacks enough vertical space for the content it contains. | `note_02_12_2025.txt` | MTH-064 | 🟡 |
| MB-07 | The match header must display the match name and a back button. | `note_02_12_2025.txt` | MTH-040 | 🟡 |
| MB-08 | Add breadcrumb navigation in the Match header (War Ledger → Match Name). | `note_02_12_2025.txt` | MTH-040 | 🟡 |
| MB-09 | Add a Basic / Guided toggle in the match header or a prominent location. Switching modes preserves round/turn/phase state. | `note_02_12_2025.txt` | MTH-060, MTH-061 | 🔴 |
| MB-10 | HP tracking must support three input methods: increment/decrement buttons, a directly editable text field, and a draggable bar. All three must be present for each model. | `note_02_12_2025.txt` | MTH-063 | 🔴 |
| MB-11 | Responsive breakpoint failure at ≤1024px in the match view. Layout must be verified and fixed at this breakpoint. | `note_02_12_2025.txt` | GLB-001, MTH-042 | 🔴 |
| MB-12 | The match view must have a sticky footer (action bar). It must not scroll out of view during unit list scrolling. | `note_02_12_2025.txt` | MTH-064 | 🟡 |
| MB-13 | The actions section must be labeled "Available Stratagems", not "Available Actions". | `note_02_12_2025.txt` | MTH-067 | 🟡 |
| MB-14 | CP readout is too visually compressed. Give it more horizontal space or restructure the counter layout. | `note_02_12_2025.txt` | MTH-062 | 🟡 |
| MB-15 | Remove the green dot indicator from the match view. | `note_02_12_2025.txt` | MTH-065 | 🟡 |
| MB-16 | Clicking a stratagem must close any open unit drawers. | `note_02_12_2025.txt` | MTH-067 | 🟡 |
| MB-17 | The unit list in the Basic Match view must show: a summary of unit models and wargear, total HP of the unit, and all state tags (interactive). See Constraint D in Section 1. | `note_02_12_2025.txt` | MTH-063 | 🔴 |
| MB-18 | Unit action states must be tracked for mission completion. Units must be markable as "Not Shot / Shot" and "Not Fought / Fought" in the unit list items. (These are the states needed for secondary mission objectives.) | `note_02_12_2025.txt` | MTH-063, MTH-067 | 🔴 |
| MB-19 | The weapon count must appear in the readout within the unit list item. | `note_02_12_2025.txt` | MTH-063 | 🟡 |
| MB-20 | Setup phase zero state: the setup phase must include UI for deep strike placement, strategic reserves designation, mission card display (referencing gdmissions.app format), and fixed/tactical secondary mission selection. | `note_02_12_2025.txt` | MTH-064 | 🔴 |
| MB-21 | Deployment phase: the match flow must include a distinct deployment phase with appropriate UI before the first game turn begins. | `note_02_12_2025.txt` | MTH-064 | 🔴 |
| MB-22 | Secondary missions must be displayed in a right-rail drawer (tab). The rail must be 48px wide on desktop when collapsed and 48px tall on mobile. The secondary mission cards show two side-by-side, shaped like playing cards. | `note_02_12_2025.txt`, `notes_02_15_2025.txt` | MTH-067 | 🔴 |
| MB-23 | Mission rules must be displayed in a second right-rail tab alongside the secondary missions tab. Same card layout (two cards side-by-side). | `notes_02_15_2025.txt` | MTH-067 | 🔴 |
| MB-24 | The main content area must overflow-scroll, not the window. The right rail remains fixed. | `notes_02_15_2025.txt` | MTH-042 | 🟡 |
| MB-25 | At end-of-turn, prompt the user to mark secondary mission completion. This prompt must appear before advancing to the next turn. | `note_02_12_2025.txt` | MTH-067 | 🟡 |
| MB-26 | The full match flow is: Tournament Match 2 → Match Setup → Deployment → Basic/Guided match. This sequence must be reflected in the match state machine and page flow. | `notes_02_15_2025.txt` | MTH-040 through MTH-043 | 🔴 |
| MB-27 | Completed matches must navigate to a Match Summary view (read-only). | `notes_02_15_2025.txt` | MTH-084 | 🔴 |

---

## 10. Match Guided Mode

Route: `/[gameSystem]/matches/[matchId]?mode=guided` (FLOWS.md Journey 6, MATCH_EXPERIENCE.md)

| # | Issue | Source | Related Requirements | Status |
|---|-------|--------|----------------------|--------|
| MG-01 | Guided mode unit detail must be identical to the Basic mode unit detail drawer (see Section 8 and Constraint E). | `note_02_12_2025.txt` | MTH-061, UD-04 | 🔴 |
| MG-02 | Mockups are required for all phases in Guided mode: Command, Movement, Shooting, Charge, Fight. | `note_02_12_2025.txt` | MTH-061, MTH-064 | 🔴 |
| MG-03 | CP must be directly editable in the Guided mode header. | `note_02_12_2025.txt` | MTH-062 | 🟡 |
| MG-04 | Guided mode header must be the same as the Basic mode header. Do not create a separate header component. | `note_02_12_2025.txt` | MTH-061 | 🟡 |
| MG-05 | Model cards in Guided mode must display HP bars. | `note_02_12_2025.txt` | MTH-063 | 🔴 |
| MG-06 | The unit list item in Guided mode must show a "Not Shot" toggle (and equivalents per phase). Only the toggleable states relevant to the current phase must be shown. Only the wargear relevant to the current phase must be shown. Total HP shown. See Constraint D in Section 1. | `note_02_12_2025.txt` | MTH-061, MTH-063 | 🔴 |
| MG-07 | Weapon font must be larger than currently mocked. Weapon count must be shown. | `note_02_12_2025.txt` | MTH-061 | 🟡 |
| MG-08 | Same responsive breakpoint issue as Basic mode: layout must work at ≤1024px. | `note_02_12_2025.txt` | GLB-001 | 🔴 |
| MG-09 | Secondary missions drawer must be the same right-rail tab used in Basic mode. | `note_02_12_2025.txt` | MTH-067 | 🔴 |
| MG-10 | Secondary missions must be auto-issued to the player during the Command phase in Guided mode. | `note_02_12_2025.txt` | MTH-067 | 🟡 |
| MG-11 | End-of-turn secondary completion prompt must appear in Guided mode as well (same behavior as MB-25). | `note_02_12_2025.txt` | MTH-067 | 🟡 |

---

## 11. War Ledger (Matches List)

Route: `/[gameSystem]/matches` (FLOWS.md Journey 4)

No additional issues beyond the global notes. Existing requirements MTH-001 through MTH-005 cover this page. Review G-09 and G-10 for nav/header behavior.

---

## 12. Match Creation Drawer

Opened from: The Forge "Deploy" button, War Ledger "Create Match" CTA, Campaign Detail "Play Match" button.

| # | Issue | Source | Related Requirements | Status |
|---|-------|--------|----------------------|--------|
| MC-01 | When the drawer is opened from the "Deploy" button on an army card, the army selector field must be omitted. The army is already known from context. | `note_02_12_2025.txt` | MTH-021 | 🔴 |
| MC-02 | Match time/date field is optional. Do not require it. | `note_02_12_2025.txt` | MTH-022 | 🟡 |
| MC-03 | The opponents field must support multi-select from the user's friends list. | `note_02_12_2025.txt` | MTH-021 | 🟡 |
| MC-04 | All match creation pages (standalone, campaign-scoped) must show the friends list alongside the barcode/match ID side-by-side. | `notes_02_15_2025.txt` | MTH-023 | 🟡 |

---

## 13. Campaigns List

Route: `/[gameSystem]/campaigns` (FLOWS.md Journey 8)

| # | Issue | Source | Related Requirements | Status |
|---|-------|--------|----------------------|--------|
| CP-01 | Remove the Floating Action Button (FAB) from the Campaigns list. Use a header button only for the "Create Campaign" action. | `note_02_12_2025.txt` | CMP-003 | 🟡 |
| CP-02 | Color hierarchy violations: apply the same enforcement described in G-11 to the Campaigns list. Primary/secondary actions must be visually distinct. | `note_02_12_2025.txt` | CMP-003 | 🟡 |
| CP-03 | Campaigns must be deletable by the organizer. Add a delete action with confirmation. | `note_02_12_2025.txt` | CMP-001 | 🟡 |
| CP-04 | Completed campaigns must navigate to a Campaign Summary view (read-only), not the Campaign Detail page. | `notes_02_15_2025.txt` | CMP-001 | 🔴 |

---

## 14. Campaign Detail

Route: `/[gameSystem]/campaigns/[campaignId]` (FLOWS.md Journey 9)

| # | Issue | Source | Related Requirements | Status |
|---|-------|--------|----------------------|--------|
| CD-01 | Standings must be at the bottom of the Campaign Detail page, not near the top. | `note_02_12_2025.txt` | CMP-040 | 🟡 |
| CD-02 | Army card must be positioned to the left of the campaign info section. | `note_02_12_2025.txt` | CMP-042 | 🟡 |
| CD-03 | Remove the phase progress bar from Campaign Detail. | `note_02_12_2025.txt` | CMP-040 | 🟡 |
| CD-04 | Remove the player count from Campaign Detail. | `note_02_12_2025.txt` | CMP-040 | 🟡 |
| CD-05 | Remove the page header. Place the campaign name where the breadcrumb was. Keep the "Play Match" and "Manage" buttons in the upper-right. | `note_02_12_2025.txt` | CMP-040 | 🟡 |
| CD-06 | "Manage" button must include an icon (not text only). | `note_02_12_2025.txt` | CMP-043 | 🟢 |
| CD-07 | A mockup of the Campaign Management page is required. | `note_02_12_2025.txt` | CMP-100 through CMP-103 | 🔴 |
| CD-08 | The "Create Match" drawer must not be open by default when navigating to Campaign Detail. | `notes_02_15_2025.txt` | CMP-080 | 🔴 |
| CD-09 | The Create Campaign page must be structurally identical to the Campaign Management page with all fields in empty/default state. Implement as a single page with an empty-data mode. | `note_02_12_2025.txt` | CMP-020 through CMP-024 | 🟡 |
| CD-10 | When creating a match from Campaign Detail, the army selector must be omitted (same rule as MC-01). | `note_02_12_2025.txt` | CMP-080, MTH-021 | 🔴 |
| CD-11 | Opponent selection in the campaign match creation flow must be limited to campaign participants, not the full friends list. | `note_02_12_2025.txt` | CMP-080 | 🔴 |
| CD-12 | The Create Campaign drawer must not include a friends selector. Friends are added to campaigns separately via the manage flow. | `notes_02_15_2025.txt` | CMP-020 | 🟡 |

---

## 15. Social / Allies

Route: `/[gameSystem]/social` (FLOWS.md Journey 11)

| # | Issue | Source | Related Requirements | Status |
|---|-------|--------|----------------------|--------|
| SA-01 | Three-dot action menu must be visible on friend row items. Do not hide it behind hover-only states. | `note_02_12_2025.txt` | SOC-005, SOC-008 | 🟡 |
| SA-02 | Row tap behavior must be visible — tapping a friend row must clearly navigate or trigger an action. The affordance must be obvious. | `note_02_12_2025.txt` | SOC-001 | 🟡 |
| SA-03 | Filters must appear below the incoming friend requests section, not above or mixed in with it. | `note_02_12_2025.txt` | SOC-001 | 🟢 |
| SA-04 | Friend code display (own code) must be in the profile popover (see G-08). Verify it is also accessible from the Allies page if needed. | `ui_notes.txt`, `note_02_12_2025.txt` | SOC-006 | 🟡 |
| SA-05 | Add friend flow must include tabs: by code, by QR, by NFC (NFC is Android-only). | `ui_notes.txt` | SOC-002, SOC-003, SOC-004 | 🟡 |

---

## 16. References

Route: `/[gameSystem]/references` (REQUIREMENTS.md REF-*)

| # | Issue | Source | Related Requirements | Status |
|---|-------|--------|----------------------|--------|
| RF-01 | Search bar must be prominent and visually centered on the References page. It is the primary interaction, not a secondary utility. | `note_02_12_2025.txt` | REF-003 | 🟡 |
| RF-02 | References must be organized into tabs: one tab for core rules, and one tab per faction. | `note_02_12_2025.txt` | REF-001, REF-002 | 🟡 |
| RF-03 | Search and filter controls must live inside each tab panel, not globally above the tabs. | `note_02_12_2025.txt` | REF-003 | 🟡 |
| RF-04 | Rule tiles must be full-width within their container. No constrained or centered tile widths. | `note_02_12_2025.txt` | REF-001 | 🟢 |

---

## 17. Missing Mockups

The following pages and states need UI design work before implementation can begin. None have sufficient mockup coverage.

| Page / State | What's Needed | Status |
|---|---|---|
| Match Setup Phase | UI for deep strike, strategic reserves, mission cards, secondary selection (see MB-20) | 🔴 |
| Match Deployment Phase | Distinct deployment phase UI before turn 1 (see MB-21) | 🔴 |
| Guided Mode — All Phases | Phase-specific layouts for Command, Movement, Shooting, Charge, Fight (see MG-02) | 🔴 |
| Unit Detail Drawer — Single Model | Final mockup using Captain in Terminator Armour, all three contexts (see UD-13) | 🔴 |
| Unit Detail Drawer — Multi Model | Final mockup using Intercessor Squad, all three contexts (see UD-15) | 🔴 |
| Match Summary (Past / Read-Only) | Completed match summary view (see MB-27) | 🔴 |
| Campaign Summary (Completed) | Read-only view for completed campaigns (see CP-04) | 🔴 |
| Campaign Management Page | Organizer management UI; doubles as Create Campaign in empty state (see CD-07, CD-09) | 🔴 |
| Right Rail — Secondary Missions | 48px collapsed rail, card-deck layout, two cards side-by-side (see MB-22) | 🔴 |
| Right Rail — Mission Rules | Same rail, second tab for mission rules (see MB-23) | 🔴 |

---

*End of UI/UX Issues*
