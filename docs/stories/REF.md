# Reference Page (REF)

**US-REF-01: View faction datasheets** `P0`
As a player, I want to browse all unit datasheets for a faction so that I can reference unit stats and rules during list building or play.

**Acceptance Criteria:**
- [ ] Lists all units from `FactionData.units` for the selected faction
- [ ] Each unit shows name, role, and key stats
- [ ] Tapping a unit opens the Unit Detail Drawer in readonly mode (US-UDD-01..06)

**Data References:** `FactionData.units: Unit[]`, `Unit.name`, `UnitData.role`

---

**US-REF-02: View faction stratagems** `P0`
As a player, I want to see all stratagems available for a faction's detachments so that I can plan my game strategy.

**Acceptance Criteria:**
- [ ] Lists stratagems grouped by detachment
- [ ] Each stratagem shows: name, CP cost, timing, effect description

**Data References:** `FactionData.stratagems: Stratagem[]`, `FactionData.detachments: Detachment[]`

---

**US-REF-03: Search across reference data** `P0`
As a player, I want to search by keyword across datasheets, stratagems, abilities, and rules so that I can find rules quickly without manual browsing.

**Acceptance Criteria:**
- [ ] Search input with real-time filtering
- [ ] Results grouped by type (units, stratagems, abilities)
- [ ] Highlights matching terms

**Data References:** `FactionData.units`, `FactionData.stratagems`, `FactionData.abilities`

---

**US-REF-04: View core rules reference** `P1`
As a player, I want to reference core game rules (phases, reserves, battle-shock, etc.) so that I can quickly resolve rules questions mid-game.

**Acceptance Criteria:**
- [ ] Core rules organized by game phase
- [ ] Each phase shows its rules summary

**Data References:** Core rules reference data

---

**US-REF-05: View mission and deployment references** `P1`
As a player, I want to browse available missions and deployment zones from Chapter Approved so that I can prepare for matched play games.

**Acceptance Criteria:**
- [ ] Lists primary missions, deployment zones, and secondary missions
- [ ] Each entry shows name, description, and scoring rules

**Data References:** `PrimaryMission`, `SecondaryMission`, `DeploymentZone`, `ChapterApproved` types

---

**US-REF-06: Prominent search bar on References page** `P1`
As a player, I want the search bar to be the primary element on the References page so that I can find rules and datasheets quickly.

**Acceptance Criteria:**
- [ ] The search bar is prominently positioned and visually centered at the top of the References page
- [ ] The search bar is the primary interaction element, not a secondary utility
- [ ] Search input triggers real-time filtering of content within the active tab

**Data References:** REF-003

---

**US-REF-07: Tab-based reference organization** `P1`
As a player, I want references organized into tabs so that I can browse core rules and faction-specific data separately.

**Acceptance Criteria:**
- [ ] The References page is organized into tabs: one tab for core rules and one tab per faction in the loaded `FactionData`
- [ ] Each tab contains its own content area with relevant rules, units, and stratagems
- [ ] Tab state is preserved during navigation within the page

**Data References:** REF-001, REF-002, FactionData

---

**US-REF-08: Search and filter controls inside tab panels** `P1`
As a player, I want search and filter controls scoped to each tab so that filtering applies to the current context only.

**Acceptance Criteria:**
- [ ] Search and filter controls are rendered inside each tab panel, not globally above the tabs
- [ ] Searching in one tab does not affect the content of other tabs
- [ ] Filters reset when switching tabs

**Data References:** REF-003

---

**US-REF-09: Full-width rule tiles** `P2`
As a player, I want rule tiles to use the full available width so that rule text is maximally readable.

**Acceptance Criteria:**
- [ ] Rule tiles span the full width of their container
- [ ] No constrained or centered tile widths with unused space on the sides
- [ ] Tiles reflow to maintain full width at all viewport sizes

**Data References:** REF-001

---
