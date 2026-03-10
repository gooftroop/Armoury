# Phase 2 — Core Army Building (Weeks 4-7)

> Phase: 2 | Timeline: Weeks 4-7 | Pages: 5
> Stories: 36 | UX Issues: 25 | Conflicts: C-05

---

## Overview

Phase 2 delivers the primary army building experience: the Army Detail page, the two-step Add-Unit flow, Unit Configuration, the read-only Unit Datasheet, and the Unit Detail Drawer. All five sections share the Unit Detail Drawer as a foundational component.

The drawer is the single most critical shared component in the frontend. Three modes consume it (reference, builder, match), and the layout must be identical across all three per Constraint E.

---

## Cross-References

- **Parent**: `docs/frontend/FRONTEND_PLAN.md`
- **Pre-requisites**: [PHASE_0_SHARED_PREREQUISITES.md](PHASE_0_SHARED_PREREQUISITES.md), [SHARED_COMPONENTS.md](SHARED_COMPONENTS.md) — Unit Detail Drawer visual component
- **Upstream**: Phase 1 (shell, auth, navigation)
- **Downstream**: Phase 3 depends on the Unit Detail Drawer match mode and the match-context layout specs from this phase

---

## Hard Constraints

These constraints govern every page in this phase. Violations block code review approval.

| ID  | Constraint                                                                                                                                                      | Scope               |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| A   | **Reference context**: drawer shows all unit data (stat line, weapons, abilities, keywords); no model list, no HP bar, no wargear editors                       | §5.4 Unit Datasheet |
| B   | **Builder context**: drawer shows model list with add/remove controls, wargear selectors, enhancement picker, warlord/leader attachment UI; no HP bar           | §5.1, §5.3          |
| E   | **Drawer layout consistency**: the same layout component renders in all three modes; mode-specific sections are conditionally rendered based on the active mode | All pages           |

---

## Pages

### 5.1 Army Detail (Builder) Page

**Route:** `/[gameSystem]/armies/[armyId]`
**Complexity:** XL | **Estimated Effort:** 8 days

**Stories:** APG-01, APG-02, APG-03, APG-04, APG-07, APG-10, APG-11, APG-13, APG-14, APG-15, APG-16, APG-17, APG-18
**UX Issues:** AD-01 through AD-09

#### Layout and Structure

Three-column layout on desktop: unit list (left), unit detail (center), army summary (right). On tablet and mobile the layout collapses to a single column; tapping a unit opens the Unit Detail Drawer as an overlay.

The army summary panel displays: total points vs. limit (APG-17), detachment bonuses, and validation errors/warnings. Points always render as `current / limit`. Validation is real-time, driven by the game system plugin.

**Breadcrumb (APG-14, AD-04):** The Army Detail page renders a breadcrumb trail positioned in the page header below the shell header: `The Forge → [Army Name]`. No separate page header duplicating the army name is shown (AD-03).

**Banner (APG-11, APG-13, AD-01):** The faction banner at the top of the page has a minimum height of 200px at all breakpoints. The banner image is sourced from the game system plugin as WebP, lazy-loaded, and responsive. If no plugin image is available, the banner falls back to the faction theme color swatch.

#### Unit List

Units are grouped under WH40K 10e category section headers (APG-15, AD-05, AD-09):

- Characters
- Battleline
- Transports
- Dreadnoughts
- Walkers
- Vehicles
- Auxiliary
- Allied

Each section header is always rendered even when the section is empty; an empty section shows a placeholder (AD-06). The label "Infantry" must not appear; use "Auxiliary" per AD-05.

Tapping a unit opens the Unit Detail Drawer in builder context. Units must not navigate to a separate page (UD-05).

Unit reordering is supported via drag-and-drop on web and long-press reorder on mobile. Deletion uses swipe-to-delete on mobile and a context menu on web, with an undo toast.

**Empty zero-state (APG-18):** When the army has no units, the unit list area shows a zero-state with an "Add Your First Unit" CTA that opens the Unit Add step (5.2).

#### Actions

**Add Unit:** Header action that opens the two-step Add-Unit drawer (5.2).

**Deploy (APG-16, AD-08):** The Deploy action appears in both the army summary panel and the page header. It uses secondary (outlined) button styling, not primary filled (APG-10). Tapping it opens the Match Creation drawer pre-populated with this army — the army selection step inside the drawer is skipped (see Conflict C-07). The Deploy button is only active when the army passes validation.

**Share (APG-04):** A share action in the army settings sheet generates a plain-text army list export and, on supported platforms, a deep link. On web it uses the Web Share API; on mobile it uses the native share sheet.

**Version History (APG-07):** Accessible via a secondary action in the army settings sheet. Lists snapshots by date with a restore option. Snapshots are taken on each save cycle; V1 retains the last 10.

**Army metadata editing:** Army name and point limit are editable inline or via a settings sheet.

**Detachment and battle size (AD-02):** Both are clearly editable from Army Details. They do not require navigating away. If rule data is stale offline, warn before applying a detachment change.

**Saved indicator (AD-07):** Do not show a "saved" status indicator. Saves are optimistic; the indicator is redundant and adds noise.

**Detachment and stratagem view (APG-03):** Detachment bonuses are surfaced in the army summary panel. Stratagems are not a first-class view on this page; users access them through the References section (§8.1). This is a known gap; full stratagem browsing on Army Detail is deferred post-V1.

---

### 5.2 Unit Add (Two-Step Drawer)

**Route:** `/[gameSystem]/armies/[armyId]/units/add` (drawer overlay, not full navigation)
**Complexity:** L | **Estimated Effort:** 5 days

**Stories:** ULV-01, ULV-02, ULV-03, ULV-04, UDD-21, UDD-22
**UX Issues:** UD-06, UD-07

#### Two-Step Pattern (C-05 Resolution)

The original plan described the Unit Add Modal as a separate full-screen modal that navigates to Unit Configuration after selection. This is replaced by a two-step stacked drawer pattern per Conflict C-05.

**Step 1 — Catalog Drawer:** A search and filter catalog opens as a drawer. It displays all units valid for the army's faction and detachment, grouped by battlefield role. Filters and search controls are visible without scrolling (UDD-22, UD-07) — they render at the top of the drawer, not behind a scroll threshold.

Each unit entry shows: unit name, battlefield role, base point cost, and model count range.

**Points preview (ULV-03):** Each unit entry shows the projected army total if that unit were added. If adding would exceed the army's point limit, the projected total renders in red with an inline warning. This behavior is new; it was missing from the original plan.

Search is client-side, filtering over pre-fetched catalog data. Faction and detachment filtering run on the same pre-fetched set.

**Step 2 — Stacked Unit Detail Drawer (Builder Context):** Selecting a unit from the catalog opens the Unit Detail Drawer stacked on top of the catalog drawer (not replacing it). The Unit Detail Drawer renders in builder context (Constraint B): model list with add/remove controls, wargear selectors, enhancement picker, warlord toggle, and leader attachment UI.

This stacked drawer is identical in layout to the Unit Detail Drawer opened from the army unit list (UD-06, UDD-21). The same component is used, parameterized by a `mode` prop (`'add' | 'configure' | 'match-readonly'`). The catalog drawer is a separate component.

Confirming from the stacked drawer adds the unit to the army with the configured loadout.

**Filter visibility (ULV-01, ULV-04):** The catalog supports filtering by faction keyword and text search. Text search is case-insensitive and clears back to the full faction list on reset.

**Add unit action (ULV-02):** Confirming the Unit Detail Drawer creates an `ArmyUnit` record with the selected composition and wargear as the default loadout.

---

### 5.3 Unit Configuration (inside Unit Detail Drawer)

**Route:** Accessed via Unit Detail Drawer in builder context (no standalone page in the add-unit flow per C-05)
**Complexity:** XL | **Estimated Effort:** 8 days

**Stories:** UDD-07, UDD-08, UDD-09, UDD-10, UDD-11, UDD-12
**UX Issues:** UC-01

#### Configuration Controls

Unit configuration now lives entirely inside the Unit Detail Drawer when in builder context. There is no separate configuration page in the add-unit flow. The Unit Detail Drawer accessed from the army unit list and the one shown after selecting a unit in Step 2 of the add flow are the same component.

**Squad size (UDD-07):** A size selector lets the user pick from the unit's valid composition range (e.g., 5 or 10 models). Changing size recalculates `modelCount` and `totalPoints` in real-time.

**Per-model wargear (UDD-08):** Each model in the unit displays its own wargear options. Selections update `ArmyUnit.modelConfigs`. Wargear constraints (min/max counts, replacement rules) are validated by the game system plugin.

**Unit-level wargear (UDD-09):** Unit-wide wargear options (those that apply to the unit as a whole rather than per model) are shown separately with their own min/max constraint validation.

**Enhancement (UDD-10):** If the unit is eligible for an enhancement, an enhancement picker appears. At most one enhancement per unit; at most three per army; enhancements must be unique. Epic Hero units are not eligible.

**Warlord designation (UDD-11):** A "Designate as Warlord" toggle appears on Character units. Only one unit per army may be Warlord. The toggle is disabled (with tooltip) if another unit is already designated. This requirement was previously implied only by validation rules (VAL-004); it is now explicitly required in the builder UI.

**Leader attachment (UDD-12):** Character units that satisfy `canAttachTo` for a bodyguard unit show an "Attach to..." control. The control lists valid bodyguard units and enforces the one-leader-per-bodyguard constraint. The specific UI interaction (dropdown, inline selector, or drag target) should follow the Unit Detail Drawer single-model layout spec (UD-13).

**Keywords section (UC-01, UDD-28):** The Keywords section appears below the Enhancements section, not inside Unit Composition. Faction and unit keywords render as chips in clearly labelled groups.

---

### 5.4 Unit Datasheet (Read-Only Reference)

**Route:** `/[gameSystem]/references/units/[unitId]`
**Complexity:** M | **Estimated Effort:** 3 days

**Stories:** UDD-13 through UDD-17 (read-only context), UDD-23, UDD-24, UDD-26, UDD-27, UDD-28
**UX Issues:** UD-08, UD-09, UD-11, UD-14

**Constraint A applies.** The datasheet uses the Unit Detail Drawer in reference context: all unit data (stat line, weapons, abilities, keywords) is shown. There is no model list, no wargear editor, no HP bar, and no builder-specific controls.

Data is sourced from the game system plugin catalog (same source as the catalog drawer in 5.2). Real BSData units must be used for testing — reference units are the Intercessor Squad and the Captain in Terminator Armour.

**Unauthenticated access:** This route is accessible without authentication on web only (per Conflict C-03). Unauthenticated users see a read-only banner. No personal data endpoints are called. Any create/edit affordances that would appear for authenticated users are replaced with an auth prompt.

**Typography and layout (UDD-23, UD-08):** Weapon names and stat text use a smaller font size than body text (minimum 12px), allowing more weapon rows to be visible without scrolling.

**Wargear label cleanup (UDD-24, UD-09):** The "equipped loadout" section label is removed. Wargear is shown directly under the Melee Weapons section with no redundant header.

---

### 5.5 Unit Detail Drawer (Builder and Match Integration)

**Route:** N/A (shared component)
**Complexity:** XL | **Estimated Effort:** 8 days (scoped here for Phase 2 delivery)

**Stories:** UDD-13, UDD-14, UDD-15, UDD-16, UDD-17, UDD-20, UDD-21, UDD-22, UDD-23, UDD-24, UDD-26, UDD-27, UDD-28
**UX Issues:** UD-01 through UD-15

#### Sizing and Close Behavior

The drawer must be approximately 200px wider than the initial mockups, fluid-responsive, reaching 60-70% of the viewport on desktop and full-screen on mobile (UD-02, UD-03). No horizontal scrolling is permitted at any breakpoint.

The drawer is closeable via: close button, Escape key, swipe down on mobile, and a "dismiss all" action that closes all stacked drawers (UD-01). The close mechanism must work in all three drawer modes.

#### Layout Specs

**Single-model content order (UDD-26, UD-11):**

1. Unit Name
2. Keywords
3. Stat line (M / T / SV / W / LD / OC, optional INV)
4. Ranged Weapons
5. Melee Weapons
6. Wargear
7. Abilities

In match context the HP bar appears inline to the right of the unit name in the header area, not below the stat line (UD-12).

**Multi-model content order (UDD-27, UD-14):**

1. Unit Name
2. Keywords
3. Stat line
4. Wargear (unit-level)
5. Unit-specific Abilities
6. Model List

Each model in the Model List shows: model name, ranged weapons, melee weapons, model-specific wargear. In match context each model entry additionally shows an HP bar.

**Keywords placement (UDD-28):** Keywords appear below the Enhancements section, not inside Unit Composition. Faction and unit keywords render as chips in clearly labelled groups.

#### Builder Context Details

The builder mode exposes the full set of configuration controls described in §5.3. It also supplies:

- **Warlord toggle (UDD-11)**: one per army, Character-only
- **Leader attachment (UDD-12)**: `canAttachTo` list with single-leader-per-bodyguard enforcement
- **Kill counter**: hidden in builder context; visible in match context only

#### Match Context Details (Delivered in Phase 2, Used in Phase 3)

The match mode provides the match-facing view. It is delivered now so Phase 3 can consume it without a dependency gap.

- **Wound tracking (UDD-13):** Per-model HP tracking, adjustable via increment/decrement buttons, a text field, and a draggable bar. HP is clamped to the wound characteristic. In single-model units, the HP bar sits in the drawer header. In multi-model units, each model row has its own HP bar.
- **Status flags (UDD-14):** Toggle unit-level status flags (`battleShocked`, `advanced`, `fell back`, etc.) during a match. Toggles are only visible in match context.
- **Kill counter (UDD-15):** Displays `UnitProjection.kills`, incrementable and decrementable. Dispatched via match sync events. Hidden outside match context.
- In guided match mode the drawer filters visible data to content relevant to the current game phase.
- In basic match mode the drawer shows all unit data alongside live state (HP, flags).

#### Navigation Behavior

Unit items in the army list open the drawer; they do not navigate to a new page (UDD-20). The two-step add-unit flow stacks the drawer on top of the catalog (C-05 resolution). On unit tap the drawer slides in from the right on desktop and from the bottom on mobile.

---

## Story Coverage Matrix

| Story ID | Description                                  | Page    | Status           | Notes                                                                  |
| -------- | -------------------------------------------- | ------- | ---------------- | ---------------------------------------------------------------------- |
| APG-01   | View army unit roster (grouped by role)      | 5.1     | MAPPED           | Category headers now explicit                                          |
| APG-02   | View army validation status                  | 5.1     | MAPPED           |                                                                        |
| APG-03   | View detachment rules and stratagems         | 5.1     | PARTIAL          | Detachment bonuses in summary panel; stratagems deferred to References |
| APG-04   | Share army list as text or link              | 5.1     | MISSING -> ADDED | Share via Web Share API / native sheet                                 |
| APG-07   | View army version history                    | 5.1     | MISSING -> ADDED | Last 10 snapshots in settings sheet                                    |
| APG-10   | Deploy button uses secondary styling         | 5.1     | MISSING -> ADDED | Outlined, not primary filled (ARM-061)                                 |
| APG-11   | Army page faction splash imagery             | 5.1     | MISSING -> ADDED | WebP, lazy-loaded, plugin-sourced                                      |
| APG-13   | Army banner min 200px                        | 5.1     | MISSING -> ADDED | Minimum 200px all breakpoints                                          |
| APG-14   | Breadcrumb: The Forge → Army Name            | 5.1     | PARTIAL -> FIXED | Explicit breadcrumb below shell header                                 |
| APG-15   | Unit category headers                        | 5.1     | PARTIAL -> FIXED | Full WH40K 10e taxonomy listed                                         |
| APG-16   | Deploy from Army Detail                      | 5.1     | PARTIAL -> FIXED | Deploy in header and summary panel                                     |
| APG-17   | Army points total in header                  | 5.1     | MAPPED           |                                                                        |
| APG-18   | Empty army zero-state with Add CTA           | 5.1     | PARTIAL -> FIXED | Zero-state explicit for builder                                        |
| ULV-01   | Filter units by faction in catalog           | 5.2     | MAPPED           |                                                                        |
| ULV-02   | Add unit (creates ArmyUnit, default loadout) | 5.2     | MAPPED           |                                                                        |
| ULV-03   | Preview points impact before adding          | 5.2     | MISSING -> ADDED | Red projected total + inline warning                                   |
| ULV-04   | Filter units by keyword                      | 5.2     | MAPPED           |                                                                        |
| UDD-07   | Select squad size                            | 5.3     | MAPPED           |                                                                        |
| UDD-08   | Configure per-model wargear                  | 5.3     | MAPPED           |                                                                        |
| UDD-09   | Select unit-level wargear options            | 5.3     | MAPPED           |                                                                        |
| UDD-10   | Apply enhancement to Character unit          | 5.3     | MAPPED           |                                                                        |
| UDD-11   | Designate unit as Warlord                    | 5.3     | PARTIAL -> FIXED | Explicit toggle in builder UI                                          |
| UDD-12   | Attach leader to bodyguard unit              | 5.3     | PARTIAL -> FIXED | `canAttachTo` UI explicitly described                                  |
| UDD-13   | Track wounds per model during match          | 5.5     | MAPPED           | Three input methods (buttons, field, bar)                              |
| UDD-14   | Toggle unit status flags during match        | 5.5     | MAPPED           |                                                                        |
| UDD-15   | Record kills for a unit                      | 5.5     | MAPPED           | Match context only                                                     |
| UDD-16   | View phase-filtered data in guided mode      | 5.5     | MAPPED           |                                                                        |
| UDD-17   | View full unit data in match drawer          | 5.5     | MAPPED           |                                                                        |
| UDD-20   | Unit items open drawer, not page nav         | 5.1/5.5 | MAPPED           |                                                                        |
| UDD-21   | Add-unit and unit-detail use same component  | 5.2/5.5 | PARTIAL -> FIXED | Same component, `mode` prop                                            |
| UDD-22   | Visible filters in add-unit drawer           | 5.2     | PARTIAL -> FIXED | Filters at top, not behind scroll                                      |
| UDD-23   | Smaller weapon font (min 12px)               | 5.4/5.5 | MAPPED           |                                                                        |
| UDD-24   | Remove "equipped loadout" label              | 5.4/5.5 | MAPPED           |                                                                        |
| UDD-26   | Single-model drawer layout order             | 5.5     | MAPPED           | Canonical order documented                                             |
| UDD-27   | Multi-model drawer layout order              | 5.5     | MAPPED           | Canonical order documented                                             |
| UDD-28   | Keywords below Enhancements                  | 5.3/5.5 | MAPPED           |                                                                        |

---

## UX Issue Resolution Matrix

| Issue ID | Description                                                | Severity | Decision    | Page    |
| -------- | ---------------------------------------------------------- | -------- | ----------- | ------- |
| AD-01    | Banner image must be larger                                | 🟡       | INCORPORATE | 5.1     |
| AD-02    | Detachment and battle size editable from Army Details      | 🟡       | INCORPORATE | 5.1     |
| AD-03    | Remove page header; use breadcrumb; no duplicate name      | 🟡       | INCORPORATE | 5.1     |
| AD-04    | Add breadcrumb: The Forge → Army Name                      | 🟡       | INCORPORATE | 5.1     |
| AD-05    | "Infantry" incorrect; use "Auxiliary" per WH40K 10e        | 🔴       | INCORPORATE | 5.1     |
| AD-06    | All unit sections visible even when empty                  | 🟡       | INCORPORATE | 5.1     |
| AD-07    | Remove "saved" status indicator                            | 🟢       | DEFER       | 5.1     |
| AD-08    | Deploy button in army summary panel, not card only         | 🟡       | INCORPORATE | 5.1     |
| AD-09    | Full WH40K 10e unit section taxonomy                       | 🟡       | INCORPORATE | 5.1     |
| UC-01    | Keywords below Enhancements, not inside Composition        | 🟡       | INCORPORATE | 5.3/5.5 |
| UD-01    | Drawer closeable; close button closes all stack            | 🔴       | INCORPORATE | 5.5     |
| UD-02    | Drawer ~200px wider than mockups                           | 🔴       | INCORPORATE | 5.5     |
| UD-03    | Drawer twice as wide; fluid-responsive                     | 🔴       | INCORPORATE | 5.5     |
| UD-04    | All drawer contexts use same layout                        | 🔴       | INCORPORATE | 5.5     |
| UD-05    | Unit items open drawer, not navigate                       | 🔴       | INCORPORATE | 5.1     |
| UD-06    | Both army page drawers identical; full Unit Config content | 🔴       | INCORPORATE | 5.2/5.5 |
| UD-07    | Unit filters in add drawer not cut off                     | 🟡       | INCORPORATE | 5.2     |
| UD-08    | Weapon font smaller inside drawer                          | 🟡       | INCORPORATE | 5.4/5.5 |
| UD-09    | Remove "equipped loadout" label                            | 🟡       | INCORPORATE | 5.4/5.5 |
| UD-10    | Fetch real BSData unit data                                | 🔴       | INCORPORATE | 5.4/5.5 |
| UD-11    | Single-model layout order canonical                        | 🔴       | INCORPORATE | 5.5     |
| UD-12    | HP bar right of unit name in match context                 | 🟡       | INCORPORATE | 5.5     |
| UD-13    | Single-model layout (Captain in Terminator Armour)         | 🔴       | INCORPORATE | 5.5     |
| UD-14    | Multi-model canonical layout order                         | 🔴       | INCORPORATE | 5.5     |
| UD-15    | Multi-model layout (Intercessor Squad)                     | 🔴       | INCORPORATE | 5.5     |
| G-06     | No trademark violations; all imagery must be AI-generated  | 🔴       | INCORPORATE | Global  |

---

## State Management for Phase 2

Phase 2 introduces the most complex local state in the app (the army editor) and the heaviest use of React Query with optimistic updates. See [State Management Architecture](./STATE_MANAGEMENT.md) for the complete decision tree.

### Tier 1: Local UI State (`useState`)

| Entity                            | Component(s)        | Notes                                                               |
| --------------------------------- | ------------------- | ------------------------------------------------------------------- |
| Selected detachment               | `ArmyEditor`        | Which detachment tab is active                                      |
| Dirty flag (unsaved changes)      | `ArmyEditor`        | Enables/disables Save button                                        |
| Submit status (idle/saving/error) | `ArmyEditor`        | Controls save button state and error display                        |
| Unit Add drawer open/close        | `UnitAddFlow`       | Two-step add flow (category → unit selection)                       |
| Unit Detail Drawer stack          | `UnitDetailDrawer`  | Stacked drawer instances (e.g., attached leader → bodyguard detail) |
| Wargear selector expanded state   | `WargearSection`    | Accordion open/close per wargear slot                               |
| Enhancement picker open           | `EnhancementPicker` | Dropdown visibility                                                 |
| Warlord toggle                    | `WarlordControl`    | Single boolean; disabled state derived from army data               |

### Tier 2: URL State

| Entity                          | Route/Params                                 | Stories            |
| ------------------------------- | -------------------------------------------- | ------------------ |
| Army ID                         | `/[gameSystem]/armies/[armyId]` path segment | US-AD-01           |
| Selected unit ID (drawer)       | `?unitId=<id>` search param                  | US-AD-03, US-UD-01 |
| Active tab (roster/detachments) | `?tab=roster` search param                   | US-AD-02           |

### Tier 3: Remote State (React Query)

| Entity                               | Query Key Factory                          | Caching Strategy                                                              | Stories                   |
| ------------------------------------ | ------------------------------------------ | ----------------------------------------------------------------------------- | ------------------------- |
| Army detail + units                  | `armyDetailOptions(armyId)`                | `staleTime: 60_000`; optimistic updates on edit                               | US-AD-01, US-AD-02        |
| Army CRUD mutations                  | `updateArmyMutation`, `deleteArmyMutation` | Invalidates `armyDetailOptions` + `armyListOptions` on success                | US-AD-05, US-AD-06        |
| Unit reference data (BSData catalog) | `unitCatalogOptions(gameSystem, faction)`  | `staleTime: Infinity` — reference data, cached offline                        | US-UA-01, US-UA-02        |
| Unit add mutation                    | `addUnitMutation`                          | Optimistic: appends to army detail cache, rolls back on error                 | US-UA-03, US-UA-04        |
| Unit remove mutation                 | `removeUnitMutation`                       | Optimistic: removes from army detail cache, rolls back on error               | US-AD-07                  |
| Unit configuration mutations         | `updateUnitConfigMutation`                 | Optimistic updates to army detail cache for wargear, squad size, enhancements | US-UC-01 through US-UC-05 |

### Derived State Patterns

Computed values derived from Tier 3 query data. Never stored — always computed inline or via `useMemo`.

| Entity                    | Derived From                          | Notes                                                          |
| ------------------------- | ------------------------------------- | -------------------------------------------------------------- |
| Total points              | Army detail → sum of unit points      | Recomputed on every unit add/remove/config change              |
| Validation errors         | Army data + game system plugin rules  | Faction composition rules, detachment limits, wargear legality |
| Warlord eligibility       | Army units → Character keyword filter | Disabled when another unit already has Warlord                 |
| Enhancement uniqueness    | Army units → enhancement selections   | Enforces one-per-unit, three-per-army                          |
| Leader attachment options | Unit + faction `canAttachTo` rules    | Filters bodyguard list per leader type                         |

See [Derived State Patterns](../DERIVED_STATE.md) for implementation guidance.

### Cross-References

- [State Management Architecture](./STATE_MANAGEMENT.md) — Complete state hierarchy and decision tree
- [§6 React Query](../REACT_QUERY.md) — Server state caching, mutations, optimistic updates
- [§9 Derived State](../DERIVED_STATE.md) — Computed state patterns, memoization
- [§11 Testing](../STATE_TESTING.md) — Testing each state tier

> **Note:** Phase 2 introduces no Tier 4 (RxJS) or Tier 5 (Context) state beyond what Phase 1 established. All new state is Tier 1 (local), Tier 2 (URL), or Tier 3 (React Query).

---

## Acceptance Criteria

### 5.1 Army Detail (Builder) Page

- Unit list renders under WH40K 10e category headers; all eight sections visible even when empty.
- No "Infantry" label appears; "Auxiliary" is used.
- Breadcrumb `The Forge → [Army Name]` renders below the shell header; no duplicate page header.
- Banner minimum height is 200px on all breakpoints; faction image loads as WebP with color swatch fallback.
- Tapping a unit opens the Unit Detail Drawer in builder context; does not navigate.
- Deploy button uses secondary (outlined) styling; appears in both header and army summary panel.
- Deploy button opens Match Creation drawer with army pre-selected; army selection step is absent.
- Share action in settings sheet produces text export via Web Share API (web) or native share sheet (mobile).
- Version history in settings sheet lists snapshots with restore option; retains last 10.
- Empty army state shows "Add Your First Unit" CTA that opens the catalog drawer.
- Army points render as `current / limit` in the summary panel.
- No "saved" status indicator is rendered.

### 5.2 Unit Add (Two-Step Drawer)

- Step 1 catalog drawer shows units valid for the army's faction and detachment, grouped by battlefield role.
- Search and filter controls are visible at the top of the drawer without scrolling.
- Each unit entry shows projected army total after adding; total renders in red with inline warning if it exceeds the limit.
- Selecting a unit stacks the Unit Detail Drawer in builder context on top of the catalog drawer.
- The stacked Unit Detail Drawer is the same component used from the army unit list.
- Confirming the stacked drawer creates an `ArmyUnit` with the configured loadout.
- Text search is case-insensitive and clears to the full faction list on reset.

### 5.3 Unit Configuration (inside Unit Detail Drawer)

- Squad size selector updates `modelCount` and `totalPoints` in real-time.
- Per-model and unit-level wargear selectors are present; selections update `ArmyUnit.modelConfigs`.
- Enhancement picker appears only on eligible units; enforces one-per-unit and three-per-army uniqueness; Epic Hero units have no enhancement picker.
- Warlord toggle appears on Character units only; is disabled with tooltip when another unit is already Warlord.
- Leader attachment control lists valid bodyguard units via `canAttachTo`; enforces one-leader-per-bodyguard.
- Keywords section renders below Enhancements, not inside Unit Composition.

### 5.4 Unit Datasheet (Read-Only Reference)

- Route is accessible without authentication on web; shows read-only banner for unauthenticated users.
- No wargear editors, model list, HP bar, or builder controls are present.
- Weapon text uses minimum 12px font.
- "Equipped loadout" label is absent.
- Data sourced from BSData via game system plugin.

### 5.5 Unit Detail Drawer

- Drawer width is fluid-responsive: ~60-70% viewport on desktop, full-screen on mobile; no horizontal scrolling.
- Closeable via close button, Escape key, swipe down (mobile), and "dismiss all" stack action.
- Single-model content renders in canonical order: Name, Keywords, Stat line, Ranged Weapons, Melee Weapons, Wargear, Abilities.
- Multi-model content renders in canonical order: Name, Keywords, Stat line, Wargear (unit), Abilities, Model List.
- Keywords render as chips below Enhancements in both layouts.
- All three drawer modes (reference, builder, match) use the same layout component.
- HP bar, status flags, and kill counter are only visible in match context.
- Builder context exposes wargear selectors, enhancement picker, warlord toggle, and leader attachment.

## Acceptance Test Checklist

> These tests verify Phase 2 is complete. Each item maps to a specific acceptance criterion or component defined above.

### End-to-End Acceptance Tests

- [ ] Navigating to `/[gameSystem]/armies/[armyId]` renders all eight WH40K 10e category sections (including empty ones) with the `ArmyDetailView` three-column layout on desktop.
- [ ] Tapping a unit in `ArmyDetailView` opens the `UnitDetailDrawer` in builder context without triggering page navigation.
- [ ] Opening the Unit Catalog Drawer from the empty-army CTA shows units scoped to the army's faction and detachment; adding a unit calls `addUnitMutation` and the unit appears in the correct category section.
- [ ] Squad size selector in `UnitDetailDrawer` (builder mode) updates `modelCount` and the displayed `totalPoints` in real-time without a round-trip.
- [ ] Enhancement picker in `UnitDetailDrawer` disables already-selected enhancements army-wide; selecting a fourth raises an inline validation error.
- [ ] Deploy button in the army summary panel is disabled when validation errors exist and enabled when the army is valid.
- [ ] Unit Datasheet route is accessible to unauthenticated users on web and renders no wargear editors, HP bar, or builder controls.
- [ ] Settings sheet share action triggers the Web Share API on web and the native share sheet on mobile.

### Component Tests (Orchestrational)

- [ ] `ArmyDetailContainer` fetches via `armyDetailOptions`, passes `totalPoints`, `validationErrors`, and `warlordEligibility` as derived props to `ArmyDetailView`.
- [ ] `ArmyDetailContainer` opens the `UnitCatalogDrawer` when the empty-army CTA fires and passes the army context (faction, detachment) to the drawer.
- [ ] `UnitCatalogDrawer` calls `unitCatalogOptions` with the correct faction and detachment scope; stacks the `UnitDetailDrawer` on unit selection.
- [ ] `UnitDetailDrawer` in builder mode renders the wargear selectors, enhancement picker, warlord toggle, and leader attachment; in reference mode those controls are absent.
- [ ] `ArmySummaryPanel` renders points as `current / limit` with red text when the current value exceeds the limit.

### Hook / Query Tests

- [ ] `armyDetailOptions` query factory returns the full army shape including `units`, `detachment`, and `validationErrors`; cache invalidates on `addUnitMutation` success.
- [ ] `addUnitMutation` on success appends the new unit to the cached `armyDetailOptions` response and triggers no full refetch.
- [ ] `removeUnitMutation` on success removes the unit from the cache and re-evaluates `totalPoints` without a full refetch.
- [ ] `updateArmyMutation` applies an optimistic update to the army name and points limit in the cache; rolls back on server error.

### Accessibility Tests

- [ ] `UnitDetailDrawer` is closeable via Escape key from any focused element inside the drawer; focus returns to the triggering element on close.
- [ ] `UnitCatalogDrawer` search field is auto-focused on open and its clear button has a visible focus ring and an `aria-label` of "Clear search".
- [ ] `ArmySummaryPanel` validation error list is associated with the Deploy button via `aria-describedby`; errors are announced by screen readers when they appear.

---

## Code Example: Orchestrational / Render Pattern

> This example demonstrates the mandatory container/view split for Phase 2.
> The orchestrational container owns all data fetching, mutations, and state.
> The render component receives everything via props and contains zero hooks except `useCallback`/`useMemo`.

```tsx
// File: src/web/app/[gameSystem]/army/[armyId]/page.tsx

import { useSuspenseQuery, useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import type { Army } from '@wh40k10e/models/ArmyModel.js';
import type { Unit } from '@wh40k10e/types/entities.js';
import type { ValidationError } from '@shared/types/validation.js';
import { armyDetailOptions, unitCatalogOptions } from '@shared/frontend/queries/armies.js';
import { updateArmyMutation, addUnitMutation, removeUnitMutation } from '@shared/frontend/mutations/armies.js';

// ---------------------------------------------------------------------------
// Render component — pure props, zero data hooks
// ---------------------------------------------------------------------------

interface ArmyDetailViewProps {
    army: Army;
    catalogUnits: Unit[];
    totalPoints: number;
    validationErrors: ValidationError[];
    drawerUnit: Unit | null;
    onAddUnit: (unitId: string) => void;
    onRemoveUnit: (selectionId: string) => void;
    onOpenDrawer: (unit: Unit) => void;
    onCloseDrawer: () => void;
    onRenameArmy: (name: string) => void;
}

export function ArmyDetailView({
    army,
    catalogUnits,
    totalPoints,
    validationErrors,
    drawerUnit,
    onAddUnit,
    onRemoveUnit,
    onOpenDrawer,
    onCloseDrawer,
    onRenameArmy,
}: ArmyDetailViewProps) {
    return (
        <>
            <ArmyHeader name={army.name} onRename={onRenameArmy} />
            <UnitCategoryList selections={army.selections} onRemove={onRemoveUnit} onOpenDrawer={onOpenDrawer} />
            <ArmySummaryPanel
                totalPoints={totalPoints}
                pointsLimit={army.pointsLimit}
                validationErrors={validationErrors}
                onAddUnit={() => onOpenDrawer(catalogUnits[0]!)}
            />
            <UnitDetailDrawer unit={drawerUnit} onAdd={onAddUnit} onClose={onCloseDrawer} />
        </>
    );
}

// ---------------------------------------------------------------------------
// Orchestrational container — data, mutations, drawer state; no JSX
// ---------------------------------------------------------------------------

export function ArmyDetailContainer({ gameSystem, armyId }: { gameSystem: string; armyId: string }) {
    const queryClient = useQueryClient();
    const [drawerUnit, setDrawerUnit] = useState<Unit | null>(null);

    const { data: army } = useSuspenseQuery(armyDetailOptions(armyId));
    const { data: catalogUnits = [] } = useSuspenseQuery(unitCatalogOptions(army.factionId));

    const { mutate: updateArmy } = useMutation(updateArmyMutation(queryClient));
    const { mutate: addUnit } = useMutation(addUnitMutation(queryClient));
    const { mutate: removeUnit } = useMutation(removeUnitMutation(queryClient));

    const totalPoints = army.selections.reduce((sum, s) => sum + s.points, 0);
    const validationErrors: ValidationError[] = [];

    const handleOpenDrawer = useCallback((unit: Unit) => setDrawerUnit(unit), []);
    const handleCloseDrawer = useCallback(() => setDrawerUnit(null), []);

    return (
        <ArmyDetailView
            army={army}
            catalogUnits={catalogUnits}
            totalPoints={totalPoints}
            validationErrors={validationErrors}
            drawerUnit={drawerUnit}
            onAddUnit={(unitId) => addUnit({ armyId, unitId })}
            onRemoveUnit={(selectionId) => removeUnit({ armyId, selectionId })}
            onOpenDrawer={handleOpenDrawer}
            onCloseDrawer={handleCloseDrawer}
            onRenameArmy={(name) => updateArmy({ armyId, name })}
        />
    );
}

// ---------------------------------------------------------------------------
// Page — server component, extracts route params
// ---------------------------------------------------------------------------

export default function ArmyDetailPage({ params }: { params: { gameSystem: string; armyId: string } }) {
    return <ArmyDetailContainer gameSystem={params.gameSystem} armyId={params.armyId} />;
}
```

---

## Component Architecture

### A. Component Inventory

Phase 2 introduces 5 page sections. Each section breaks down into orchestrational and render components following the container/view split enforced across the codebase.

---

#### §5.1 Army Detail (Builder) Page

**Route:** `src/web/src/app/[gameSystem]/armies/[armyId]/page.tsx`

**Orchestrational**

- `ArmyDetailContainer` — owns the army query, validation state, all CRUD mutation hooks, drawer stack, and the dirty flag. Renders nothing itself. Opens the Unit Detail Drawer in builder mode. Passes derived values (total points, validation errors, warlord eligibility) directly as props to `ArmyDetailView`.

**Render components**

- `ArmyDetailView` — three-column layout on desktop (sidebar / unit list / config panel), single-column with drawer overlay on tablet and mobile. Receives all data and callbacks as props.
- `ArmyBanner` — displays the faction banner image at a minimum 200px height. Loads a WebP source with a faction color swatch as fallback when the image is unavailable or loading. Not interactive.
- `ArmyBreadcrumb` — renders the breadcrumb trail "The Forge → [Army Name]". Links the first segment to the Forge landing; current page is non-linked.
- `ArmySummaryPanel` — shows current/limit points, active detachment bonuses, the validation error list, and the Deploy button. The Deploy button is disabled when validation errors exist. Points display updates optimistically on unit or wargear change.
- `UnitCategorySection` — one per WH40K 10th Edition battlefield role category: Characters, Battleline, Transports, Dreadnoughts, Walkers, Vehicles, Auxiliary Support, Allied Units. Renders as an always-visible section even when the unit list for that category is empty (AD-06). Contains a section header and a slotted list.
- `UnitListItem` — displays a unit card inside a category section. Shows unit name, role, configured points, and a wargear summary chip. Opens the Unit Detail Drawer on tap or click (not page navigation, per UD-05). Accepts an `onOpen` callback; it does not manage the drawer itself.
- `ArmyEmptyState` — rendered when the army contains zero units across all categories. Presents an "Add Your First Unit" CTA that triggers the Unit Catalog Drawer.
- `ArmySettingsSheet` — a bottom sheet containing share link generation, version history navigation, and army metadata editing (name, points limit, detachment selection).

**Shared component dependencies**

Shell (§3.1), Skeleton Loaders (§3.6), Error Boundaries (§3.7), Unit Detail Drawer (§5.5 in builder context), Drawer system (§3.8).

---

#### §5.2 Unit Add (Two-Step Drawer)

The add-unit flow is a two-step drawer sequence initiated from `ArmyDetailContainer`. No dedicated route exists; both steps are overlays on the army detail page.

**Step 1 — Unit Catalog Drawer**

- `UnitCatalogDrawer` — the outer drawer shell for step 1. Renders the catalog search, filter bar, and grouped unit list. Manages its own open/close state via `useState`; the army detail page opens it by calling a ref or callback.
- `UnitCatalogEntry` — a single row in the catalog list. Displays unit name, battlefield role, base points cost, valid model count range, and a projected total cost based on the minimum squad size. Tapping triggers step 2.
- `UnitCatalogSearch` — client-side search input with instant filtering across unit names and faction keywords. Filter state lives in `UnitCatalogDrawer` as Tier 1 state.

**Step 2 — Unit Detail Drawer (builder context)**

Stacked on top of the catalog drawer using the drawer stacking system (§3.8, maximum 2 layers for this flow). This is the same `UnitDetailDrawer` component from §5.5, rendered in builder mode. Configuration controls (squad size, wargear, enhancement) are enabled because the mode is builder.

**Shared component dependencies**

Drawer stacking system (§3.8), Unit Detail Drawer (§5.5), Form Components (§3.10).

---

#### §5.3 Unit Configuration (inside Unit Detail Drawer)

Configuration controls are rendered inside the Unit Detail Drawer when it is operating in builder mode. They are not a separate page or route. The drawer shell renders mode-specific sections without knowing which mode is active at the component level.

**Configuration render components**

- `SquadSizeSelector` — a stepper control constrained to the valid composition range for the unit (e.g., steps of 5 between 5 and 10 for units with that restriction). Derived from the unit datasheet; invalid increments are disabled.
- `PerModelWargearSelector` — displayed once per model when the unit has per-model wargear options. Groups options by wargear slot. Selecting an option for one model does not affect others.
- `UnitWargearSelector` — displayed for unit-level (non-per-model) wargear options. Rendered above the per-model selectors.
- `EnhancementPicker` — allows selecting one enhancement for this unit from the detachment's enhancement list. Disabled when the unit is an Epic Hero. An army may have at most three enhancements; already-selected enhancements are shown as unavailable with a tooltip indicating which unit holds them. Uniqueness is enforced via derived state, not stored state.
- `WarlordControl` — a toggle available only on Character units. Disabled when another unit in the army already has the Warlord designation. Warlord eligibility is computed inline from the full unit list.
- `LeaderAttachmentControl` — displayed on Character units that have a non-empty `canAttachTo` list. Presents a dropdown of eligible bodyguard units currently in the army. Enforces the one-leader-per-bodyguard rule; bodyguard units that already have a leader attached are shown as unavailable.
- `KeywordsSection` — renders faction keywords and unit keywords as chips. Positioned below the Enhancements section in both single-model and multi-model layouts.

**Shared component dependencies**

Form Components (§3.10), Unit Detail Drawer (§5.5), Skeleton Loaders (§3.6).

---

#### §5.4 Unit Datasheet (Read-Only Reference)\*\*

**Route:** `src/web/src/app/[gameSystem]/references/units/[unitId]/page.tsx`

This page renders the Unit Detail Drawer in reference context (Constraint A). No builder or match controls are shown.

- `UnitDatasheetView` — a read-only wrapper that renders `UnitDetailDrawer` in reference mode and in full-page mode rather than as a true overlay drawer. The drawer layout and component tree are identical across all modes.

Unauthenticated access (C-03): a persistent read-only banner appears at the top of the page for users who are not signed in. The banner does not block content but explains that army-building features require an account.

**Shared component dependencies**

Unit Detail Drawer (§5.5), Skeleton Loaders (§3.6), Shell (§3.1).

---

#### §5.5 Unit Detail Drawer

The architectural centerpiece of Phase 2. A single component tree used across builder, reference, and match modes. Mode-specific sections are conditionally rendered based on a `mode` prop; the drawer shell contains no game-specific imports.

- `UnitDetailDrawer` — the core drawer shell. Manages open/close animation, width/height responsive behaviour, focus trap, scroll lock, and Escape key handling. Renders a header slot, a scrollable body, and an optional sticky footer. Imports no game-specific code.
- `UnitDetailDrawerHeader` — renders the unit name, the keyword chip list, and (in match mode only) the HP bar and kill counter.
- `UnitStatLine` — renders the standard WH40K 10e stat block: M / T / SV / W / LD / OC / INV. Values come from the unit model; INV cell is hidden when the unit has no invulnerable save.
- `WeaponProfileTable` — renders ranged weapon profiles and melee weapon profiles in separate sub-tables. Font size inside the drawer must be at least 12px (UD-08). Columns: Name, Range, A, BS/WS, S, AP, D, keywords. Keyword chips are rendered inline in the last column.
- `AbilitiesSection` — renders the full, untruncated abilities list. Each ability is a labelled block. Special abilities (Core, Faction, Detachment) are grouped with a sub-header.
- `ModelList` — rendered only in multi-model layout. One row per model entry with the model's name, stat line delta (if any), and HP bar (match context only).

**Layout orders**

Single-model: Name → Keywords → Stat Line → Ranged Weapons → Melee Weapons → Wargear (builder mode only) → Abilities.

Multi-model: Name → Keywords → Stat Line → Wargear (builder mode only) → Abilities → Model List.

**Shared component dependencies**

Drawer system (§3.8), Error Boundaries (§3.7), Skeleton Loaders (§3.6).

---

### B. State Management Tier Breakdown

Phase 2 uses Tiers 1, 2, and 3 only. There is no Tier 4 (global reactive streams) in this phase, and no new Tier 5 contexts are introduced beyond those established in Phase 1.

**Derived state policy:** total points, validation error list, warlord eligibility, enhancement uniqueness, and leader attachment options are all computed inline at render time. None of these values are stored in component state or in the query cache.

---

#### §5.1 Army Detail

| Tier                    | Contents                                                                                                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tier 1 (useState)       | Dirty flag, submit in-progress status, active drawer stack, wargear accordion expanded state                                                                                      |
| Tier 2 (URL params)     | `armyId` (path), `?unitId` (open unit drawer on load), `?tab` (active configuration tab)                                                                                          |
| Tier 3 (TanStack Query) | `armyDetailOptions(armyId)` — staleTime: 0 (mutations invalidate immediately), `unitCatalogOptions(gameSystem)` — staleTime: Infinity, all CRUD mutations with optimistic updates |

---

#### §5.2 Unit Add

| Tier                    | Contents                                                                                                         |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Tier 1 (useState)       | Catalog search text, active filter selections (role, faction keyword), step index                                |
| Tier 3 (TanStack Query) | `unitCatalogOptions(gameSystem)` — staleTime: Infinity (catalog data changes only on game system version update) |

---

#### §5.3 Unit Configuration

| Tier                    | Contents                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| Tier 1 (useState)       | Wargear section expanded state, enhancement picker open, warlord toggle local pending state |
| Tier 3 (TanStack Query) | `updateUnitConfigMutation` — optimistic update applied immediately; rolls back on error     |

---

#### §5.4 Unit Datasheet

| Tier                    | Contents                                             |
| ----------------------- | ---------------------------------------------------- |
| Tier 3 (TanStack Query) | `unitReferenceOptions(unitId)` — staleTime: Infinity |

---

#### §5.5 Unit Detail Drawer

| Tier              | Contents                                                                        |
| ----------------- | ------------------------------------------------------------------------------- |
| Tier 1 (useState) | Drawer open/close, scroll position restoration                                  |
| Tier 5 (Context)  | Drawer mode is passed as a prop; no drawer-specific context is added in Phase 2 |

---

### C. Shared Component Reuse Mapping

The table below shows which shared components from the Phase 1 component library are consumed by each Phase 2 section.

| Shared Component          | §5.1 Army Detail | §5.2 Unit Add | §5.3 Unit Config | §5.4 Datasheet | §5.5 Drawer |
| ------------------------- | :--------------: | :-----------: | :--------------: | :------------: | :---------: |
| Shell / Nav (§3.1)        |       yes        |       —       |        —         |      yes       |      —      |
| Auth Guard (§3.2)         |       yes        |       —       |        —         |       —        |      —      |
| Error Boundaries (§3.7)   |       yes        |      yes      |       yes        |      yes       |     yes     |
| Skeleton Loaders (§3.6)   |       yes        |       —       |        —         |      yes       |     yes     |
| Drawer System (§3.8)      |       yes        |      yes      |        —         |       —        |     yes     |
| Form Components (§3.10)   |        —         |       —       |       yes        |       —        |      —      |
| Unit Detail Drawer (§5.5) |       yes        |      yes      |        —         |      yes       |      —      |

Notable reuse patterns:

- The Unit Detail Drawer (§5.5) is consumed in three of the five Phase 2 sections. In §5.1 and §5.2 it operates in builder mode; in §5.4 it operates in reference mode. The component tree is identical across all three drawer modes.
- Form Components (§3.10) are consumed only by the configuration controls in §5.3. No other Phase 2 section requires form inputs.
- Skeleton Loaders (§3.6) appear in §5.1 (army detail loading state), §5.4 (datasheet loading state), and §5.5 (drawer content loading state). The same skeleton primitives are composed differently in each context.

---

### D. Drawer Mode Implementations

The Unit Detail Drawer is implemented directly for wh40k10e and supports three modes: reference, builder, and match. This section documents what each mode renders and its context of use.

---

#### Reference Mode (Constraint A)

Used in §5.4. Renders a read-only view of a unit. Wargear selectors, enhancement picker, warlord toggle, and leader attachment controls are not shown. The HP bar and kill counter are also absent.

---

#### Builder Mode (Constraint B)

Used in §5.1, §5.2, and §5.3. Renders the full set of configuration controls: model list editing, wargear selectors, enhancement picker, warlord toggle, and leader attachment. Does not show HP bar or kill counter.

---

#### Match Mode

Consumed by Phase 3 (match tracking); the mode is defined in Phase 2 so Phase 3 can depend on it without a gap. Renders HP bar, kill counter, and wound-marking controls. Wargear selectors and enhancement controls are not shown.

---

#### Constraint enforcement summary

Constraint E (same `UnitDetailDrawer` component across all modes) is enforced structurally: the drawer shell contains no conditionals on mode type beyond rendering or hiding specific sections. All mode-specific sections are gated on the active mode prop.

---

### E. Component Composition Hierarchy

#### 1. Army Detail Page

```
ArmyDetailPage (RSC, prefetches army query)
  HydrationBoundary
    ArmyDetailContainer (orchestrational)
      ArmyDetailContainer (orchestrational)
        ArmyDetailView
          ArmyBanner
          ArmyBreadcrumb
          ArmySummaryPanel
            [points display]
            [validation error list]
            [Deploy button]
          UnitCategorySection × N
            UnitListItem × M
          ArmyEmptyState  (when no units)
          ArmySettingsSheet  (overlay, triggered by settings action)
        ── drawer overlay ──
        UnitCatalogDrawer  (step 1, Tier 1 state)
          UnitCatalogSearch
          UnitCatalogEntry × N
          ── stacked drawer ──
          UnitDetailDrawer  (step 2, builder mode)
            [see drawer hierarchy below]
        UnitDetailDrawer  (unit edit, builder mode)
          [see drawer hierarchy below]
```

#### 2. Two-Step Add-Unit Flow

```
UnitCatalogDrawer  (step 1)
  UnitCatalogSearch
  [role filter bar]
  UnitCatalogEntry × N
    [tap] →
      UnitDetailDrawer  (step 2, stacked, builder mode)
        UnitDetailDrawerHeader
        UnitStatLine
        WeaponProfileTable (ranged)
        WeaponProfileTable (melee)
        [wargear controls]  (builder mode only)
          UnitWargearSelector
          PerModelWargearSelector × M
          EnhancementPicker
          WarlordControl
          LeaderAttachmentControl
        AbilitiesSection
        KeywordsSection
```

#### 3. Unit Detail Drawer Internal Composition

The hierarchy below applies in all drawer modes. Sections marked with a mode annotation are only visible in that mode.

```
UnitDetailDrawer
  UnitDetailDrawerHeader
    [unit name]
    KeywordsSection  (chips)
    [HP bar + kill counter]  (match mode only)
  ── scrollable body ──
  UnitStatLine
  WeaponProfileTable  (ranged)
  WeaponProfileTable  (melee)
  [wargear controls]  (builder mode only)
    UnitWargearSelector          (builder mode only)
    PerModelWargearSelector × M  (builder mode only)
    EnhancementPicker            (builder mode only)
    WarlordControl               (builder mode only)
    LeaderAttachmentControl      (builder mode only)
  AbilitiesSection
  ModelList  (multi-model layout only)
    [per-model HP bars]  (match mode only)
```

---

### F. Responsive and Accessibility Specs

#### Layout breakpoints

**Army Detail (§5.1)**

- Desktop (≥1024px): three-column layout. Left column: army metadata and summary. Centre column: unit list by category. Right column: configuration panel (sticky, shows selected unit config inline).
- Tablet and mobile (<1024px): single-column. Unit configuration opens in the Unit Detail Drawer as a full overlay. The right column is not rendered.

**Unit Detail Drawer (§5.5)**

- Desktop: slides in from the right edge. Width: `min(60vw, 900px)`. Does not cover the full viewport; the army list remains partially visible.
- Mobile: slides up from the bottom. Height: full viewport height minus safe-area insets. Behaves as a bottom sheet.
- No horizontal scrolling in any breakpoint.

#### Drawer closure methods

All drawer instances support four closure methods:

1. Close button (top-right, always visible)
2. Escape key
3. Swipe down (mobile, bottom sheet context)
4. "Dismiss all" action that closes the full drawer stack

Stacked drawers close in LIFO order on Escape and swipe. "Dismiss all" bypasses the stack.

#### Touch targets

All interactive elements must meet the 44×44px minimum touch target. `UnitListItem`, `UnitCatalogEntry`, all wargear selector controls, and drawer action buttons are subject to this constraint. Elements that are visually smaller must use padding or a touch target wrapper to meet the size requirement without altering visual size.

#### Unit category sections (AD-06)

Category section headers are always rendered, even when the unit count for that category is zero. This prevents layout shift when a unit is added to an empty category and makes the available categories discoverable without adding a unit first.

#### Weapon table typography (UD-08)

Font size inside `WeaponProfileTable` must be at least 12px at all viewport widths. The table does not wrap columns onto multiple lines; horizontal scroll within the table element is acceptable when the viewport is narrow.

#### Keyboard navigation

- Tab moves focus through the unit list entries in DOM order.
- Enter or Space on a `UnitListItem` opens the Unit Detail Drawer for that unit.
- Tab inside an open drawer is trapped within the drawer until it is closed.
- Escape closes the topmost open drawer.
- After a drawer closes, focus returns to the element that triggered it.

#### Screen reader annotations

- `UnitDetailDrawer` root element: `role="dialog"`, `aria-modal="true"`, `aria-label="[Unit Name] — Unit Details"`.
- `UnitCategorySection`: `role="region"`, `aria-label="[Category Name]"`.
- `ArmySummaryPanel` validation error list: `role="list"`, each error as `role="listitem"`. The list region uses `aria-live="polite"` so changes announced without interrupting current speech.
- Wargear selector controls use standard `<select>` or `role="listbox"` with explicit `aria-label` matching the wargear slot name.
- `WarlordControl` toggle: `role="switch"`, `aria-checked`, `aria-disabled` when another unit holds Warlord.
- Deploy button: `aria-disabled` (not `disabled`) when validation errors are present, so keyboard users can still focus it and hear the reason via `aria-describedby` pointing at the error list.

---

### G. Dependencies

#### Design mockups

Two design mockups are referenced across Phase 2:

- **UD-13** — single-model layout (Captain in Terminator Armour). Informs: final `UnitDetailDrawer` render order for single-model units, `UnitDetailDrawerHeader` HP bar placement, configuration slot positioning in §5.3.
- **UD-15** — multi-model layout (Intercessor Squad). Informs: `ModelList` component structure, per-model HP bar layout in match context, multi-model wargear selector arrangement in §5.3.

These mockups inform §5.1, §5.3, §5.4, and §5.5. Where a mockup has not yet been reviewed, use the layout specs documented in this file as the implementation target.

#### Upstream dependencies

- Phase 1 shell, authentication, and navigation must be stable before Phase 2 routes are integrated.

---

### H. Code Organization and Exports

#### Pages

Next.js App Router pages use default exports (framework requirement). All other exports in the same file use named exports.

| Route          | File path                                                         |
| -------------- | ----------------------------------------------------------------- |
| Army detail    | `src/web/src/app/[gameSystem]/armies/[armyId]/page.tsx`           |
| Unit datasheet | `src/web/src/app/[gameSystem]/references/units/[unitId]/page.tsx` |

#### Components

All components use named exports. Files are PascalCase matching the export name.

| Component group          | Directory                        |
| ------------------------ | -------------------------------- |
| Army-specific components | `src/web/src/components/armies/` |
| Unit-specific components | `src/web/src/components/units/`  |

Examples: `src/web/src/components/armies/ArmyDetailView.tsx`, `src/web/src/components/units/UnitDetailDrawer.tsx`, `src/web/src/components/units/WeaponProfileTable.tsx`.

#### Hooks

Web-specific hooks use named exports. Query factories are pure TypeScript with no React imports and live in shared frontend.

| Hook / factory       | File path                               |
| -------------------- | --------------------------------------- |
| Army detail hook     | `src/web/src/hooks/useArmyDetail.ts`    |
| Unit catalog hook    | `src/web/src/hooks/useUnitCatalog.ts`   |
| Army queries factory | `src/shared/frontend/queries/armies.ts` |
| Unit queries factory | `src/shared/frontend/queries/units.ts`  |

Query factories export `queryOptions` objects only. They contain no `useQuery` calls and no React imports. Hooks in the web workspace wrap the factories with `useQuery` and `useMutation` from TanStack Query.
