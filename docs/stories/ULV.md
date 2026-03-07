# Unit List View (ULV)

## Army Creation

**US-ULV-01: Filter units by faction** `P0`
As a player, I want to filter the add-unit list to show only units belonging to the army's faction so that I only see relevant options when building my army.

**Acceptance Criteria:**
- [ ] The add-unit list filters to show only units where `Unit.factionId` matches `Army.factionId`
- [ ] Units from `FactionData.units` for the selected faction are displayed
- [ ] Units outside the army's faction are hidden from the list

**Data References:** `Army.factionId`, `Unit.factionId`, `FactionData.units`

---

**US-ULV-02: Add a unit to the army** `P0`
As a player, I want to add a unit from the filtered list to the army so that I can build out my force.

**Acceptance Criteria:**
- [ ] Selecting a unit from the filtered list creates an `ArmyUnit` record linked to the army
- [ ] The new `ArmyUnit` is appended to `Army.units`
- [ ] Default composition is derived from `Unit.composition`
- [ ] The army unit list updates immediately after adding

**Data References:** `ArmyUnit`, `Unit.composition`, `Army.units`

---

**US-ULV-03: Preview points impact before adding** `P1`
As a player, I want to see how adding a unit affects total army points before confirming so that I can make informed decisions without exceeding my points limit.

**Acceptance Criteria:**
- [ ] A points preview shows the projected new total: current `Army.totalPoints` plus the unit's `Unit.composition[].points`
- [ ] The preview indicates whether the new total would exceed `Army.pointsLimit`
- [ ] The confirmation button is disabled or shows a warning if adding the unit exceeds the limit

**Data References:** `Army.totalPoints`, `Army.pointsLimit`, `Unit.composition[].points`

---

**US-ULV-04: Filter units by keyword** `P1`
As a player, I want to filter units by keyword (e.g., "Infantry", "Character", "Battleline") so that I can quickly find specific unit types when building my army.

**Acceptance Criteria:**
- [ ] A keyword filter input is available on the add-unit list
- [ ] Filtering by a keyword shows only units where `Unit.keywords` or `Unit.factionKeywords` contains the entered keyword
- [ ] Keyword matching is case-insensitive
- [ ] Clearing the filter restores the full faction-filtered list

**Data References:** `Unit.keywords`, `Unit.factionKeywords`

---

## Basic Match Mode

**US-ULV-05: View all units in the active player's army during a basic match** `P0`
As a player, I want to see my full unit list during a basic match with top-level stats and interactive state tracking so that I can quickly manage each unit's status.

**Acceptance Criteria:**
- [ ] The unit list renders all `ArmyUnit` entries from `MatchData.playerStateById[activePlayerId].armyProjection.unitsByArmyUnitId`.
- [ ] Each unit list item displays: unit name, top-level unit stats (M, T, SV, W, LD, OC from `Unit` datasheet), model count, and total remaining HP (sum of `UnitProjection.modelWounds`).
- [ ] Each unit list item renders all applicable state tags as clickable toggles: "Not Shot / Shot" (`UnitFlags.hasShot`), "Not Fought / Fought" (`UnitFlags.hasFought`), "Battle Shocked" (`UnitFlags.battleShocked`), "Deep Strike" (`UnitFlags.inDeepStrike`), "Reserves" (`UnitFlags.inStrategicReserve`), "Advanced" (`UnitFlags.advanced`), "Moved" (`UnitFlags.moved`), "Engaged" (`UnitFlags.engaged`), "Fell Back" (`UnitFlags.fellBack`).
- [ ] Toggling a state tag sends an `updateMatch` WebSocket event that updates the corresponding `UnitProjection.flags` field.
- [ ] Wargear and wargear stats are NOT displayed in the basic mode unit list items — they are accessible only via the unit detail drawer.
- [ ] Tapping a unit row opens the Unit Detail Drawer in Match View mode (US-UDD-13).
- [ ] The list updates in real time as `updateMatch` WebSocket events arrive.
- [ ] The unit list renders without horizontal scrollbar on all viewport widths; on narrow screens, state tags wrap below the unit stats rather than extending horizontally.

**Data References:** `ArmyProjection.unitsByArmyUnitId`, `UnitProjection`, `UnitFlags`, `Unit.movement`, `Unit.toughness`, `Unit.save`, `Unit.wounds`, `Unit.leadership`, `Unit.objectiveControl`, WebSocket `updateMatch`

---

**US-ULV-06: Separate destroyed units in the list** `P1`
As a player, I want destroyed units (all models at 0 wounds) visually separated from active units so that the list stays clean during a match.

**Acceptance Criteria:**
- [ ] A unit is considered destroyed when all model wounds in `UnitProjection.modelWounds` are 0
- [ ] Destroyed units are moved to a "Destroyed" section at the bottom of the unit list
- [ ] Active units remain in the primary list above the "Destroyed" section
- [ ] The separation updates in real time as wound totals change

**Data References:** `UnitProjection.modelWounds`

---

## Guided Match Mode

**US-ULV-07: Filter unit list by phase relevance in guided mode** `P0`
As a player, I want guided mode to filter the unit list to foreground phase-relevant units and collapse non-relevant ones so that I can focus on what matters each phase.

**Acceptance Criteria:**
- [ ] During Shooting: units with ranged weapons are foregrounded; units with no ranged weapons collapse to a summary line
- [ ] During Fight: units in engagement range are foregrounded
- [ ] During Movement: all units are shown with movement-relevant info
- [ ] During Command: units Below Half-strength are foregrounded for Battle-Shock tests
- [ ] Non-relevant units are accessible via a "Show All" toggle
- [ ] Units with no relevant actions for the current phase show as a single summary line: name + "No actions this phase"

**Data References:** `MatchData.gameState.phase`, `GamePhase`, `Unit.rangedWeapons`, `Unit.meleeWeapons`, `UnitFlags`

---

**US-ULV-08: Display CP tracking in guided mode** `P1`
As a player, I want a CP counter visible during a guided match so that I can track stratagem spending.

**Acceptance Criteria:**
- [ ] A CP counter is visible in the guided match UI
- [ ] The counter displays the current value of `PlayerState.commandPoints`
- [ ] The counter updates in real time as `updateMatch` WebSocket events arrive
- [ ] The counter is always visible and does not scroll off screen

**Data References:** `PlayerState.commandPoints`, WebSocket `updateMatch`

---

**US-ULV-09: Switch between guided and basic match modes** `P1`
As a player, I want to toggle between guided and basic modes at any time during a match so that I can choose the level of assistance that suits my current game.

**Acceptance Criteria:**
- [ ] A toggle is visible in the match header (segmented control: "Basic" / "Guided")
- [ ] Switching preserves all match state: `MatchData.gameState`, all `UnitProjection` data, and `PlayerState`
- [ ] Switching from Guided to Basic removes phase prompts and filters
- [ ] Switching from Basic to Guided activates phase prompts and filters
- [ ] Mode preference is stored per-match, not globally

**Data References:** `MatchData.gameState`, `UnitProjection`, `PlayerState`

---

**US-ULV-10: View live opponent status during a match** `P0`
As a player, I want to see my opponent's name, online status, VP, CP, and whose turn it is at a glance so that I always have key match context without hunting for it.

**Acceptance Criteria:**
- [ ] A persistent opponent status bar is displayed that does not scroll away
- [ ] The bar shows: `MatchPlayer.displayName`, `UserPresence.status`, VP from `Match.score.totalsByPlayerId`, and CP from `PlayerState.commandPoints`
- [ ] The active player is indicated visually
- [ ] The current round and phase are shown
- [ ] All values update in real time via WebSocket events

**Data References:** `MatchPlayer.displayName`, `UserPresence.status`, `Match.score.totalsByPlayerId`, `PlayerState.commandPoints`, `MatchData.gameState.activePlayerId`, `MatchData.gameState.round`, `MatchData.gameState.phase`, WebSocket events

---
