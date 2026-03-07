# Unit Detail Drawer (UDD)

## Readonly

**US-UDD-01: View unit stat line** `P0`
As a player, I want to see a unit's full stat line (M, T, SV, W, LD, OC, optional INV) in the drawer so that I can reference all core stats without opening the rulebook.

**Acceptance Criteria:**
- [ ] The drawer displays `Unit.movement`, `Unit.toughness`, `Unit.save`, `Unit.wounds`, `Unit.leadership`, and `Unit.objectiveControl`
- [ ] If `Unit.invulnerableSave` is present, it is displayed alongside the standard save
- [ ] Stats are presented in the canonical order: M, T, SV, W, LD, OC (INV shown separately if present)
- [ ] All stat values are read-only in this context

**Data References:** `Unit.movement`, `Unit.toughness`, `Unit.save`, `Unit.wounds`, `Unit.leadership`, `Unit.objectiveControl`, `Unit.invulnerableSave`

---

**US-UDD-02: View unit abilities** `P0`
As a player, I want to see all abilities for a unit so that I can reference each ability's name and description during play.

**Acceptance Criteria:**
- [ ] All entries in `Unit.abilities` are displayed, each showing the ability name and description
- [ ] Abilities are read-only in this context
- [ ] The list does not truncate or collapse abilities behind a "show more" control

**Data References:** `Unit.abilities: UnitAbility[]`

---

**US-UDD-03: View unit weapons** `P0`
As a player, I want to see ranged and melee weapon profiles so that I can plan attacks without referencing a separate datasheet.

**Acceptance Criteria:**
- [ ] All entries in `Unit.rangedWeapons` are displayed with: name, range, attacks, skill, strength, AP, damage, and weapon keywords
- [ ] All entries in `Unit.meleeWeapons` are displayed with the same fields (range shown as "Melee")
- [ ] Ranged and melee weapons are presented in clearly labelled separate sections
- [ ] Weapon tables reflow on narrow viewports: on mobile, each weapon renders as a stacked card (name, then stat rows) rather than a wide table with horizontal scroll.

**Data References:** `Unit.rangedWeapons: Weapon[]`, `Unit.meleeWeapons: Weapon[]`

---

**US-UDD-04: View unit composition options** `P0`
As a player, I want to see valid squad sizes and point costs so that I can make informed decisions when building my army.

**Acceptance Criteria:**
- [ ] All entries in `Unit.composition` are displayed, each showing the model count and associated points cost
- [ ] Composition options are presented as a list or table
- [ ] The currently selected composition (if in Army Builder context) is visually indicated

**Data References:** `Unit.composition: UnitComposition[]` (models, points)

---

**US-UDD-05: View leader attachment rules** `P1`
As a player, I want to see which units a Character can lead (or which Characters can lead a Bodyguard unit) so that I can plan valid detachments.

**Acceptance Criteria:**
- [ ] If `Unit.leader` is present, the drawer displays the `leaderAbility` description
- [ ] The `canAttachTo` list is shown, identifying eligible bodyguard units by name
- [ ] For bodyguard units, which Characters can lead them is derivable from the same data
- [ ] This section is hidden if the unit has no leader data

**Data References:** `Unit.leader: LeaderInfo` (canAttachTo, leaderAbility)

---

**US-UDD-06: View unit keywords** `P1`
As a player, I want to see faction and unit keywords so that I can verify eligibility for detachment abilities, stratagems, and enhancements.

**Acceptance Criteria:**
- [ ] `Unit.keywords` are displayed as chips or tags in a "Unit Keywords" group
- [ ] `Unit.factionKeywords` are displayed as chips or tags in a "Faction Keywords" group
- [ ] Both groups are clearly labelled and visually distinct from each other

**Data References:** `Unit.keywords: string[]`, `Unit.factionKeywords: string[]`

---

## Unit Configuration

**US-UDD-07: Select squad size** `P0`
As a player, I want to choose model count from valid composition options so that my army reflects the correct squad size and points.

**Acceptance Criteria:**
- [ ] The composition selector shows all valid options from `Unit.composition`
- [ ] Selecting a composition option updates `ArmyUnit.modelCount` to the corresponding model count
- [ ] `ArmyUnit.totalPoints` updates automatically to reflect the selected composition's points cost
- [ ] Only valid composition options from the unit datasheet are selectable

**Data References:** `Unit.composition`, `ArmyUnit.modelCount`, `ArmyUnit.totalPoints`

---

**US-UDD-08: Configure per-model wargear** `P0`
As a player, I want to assign weapons to individual models so that each model in my squad can have a different loadout.

**Acceptance Criteria:**
- [ ] Each model in the unit is listed individually, allowing wargear to be assigned per model
- [ ] Available weapon options per model are derived from the unit's valid wargear options
- [ ] Changes to a model's loadout update the corresponding entry in `ArmyUnit.modelConfigs`
- [ ] Models with identical loadouts can be grouped for efficient editing

**Data References:** `ArmyUnit.modelConfigs: ArmyModelConfig[]`, weapon options per model

---

**US-UDD-09: Select unit-level wargear options** `P0`
As a player, I want to select wargear options for the entire unit so that I can make bulk upgrades within the game rules.

**Acceptance Criteria:**
- [ ] Unit-level wargear options from `Unit.wargearOptions` are displayed as selectable options
- [ ] `minSelections` and `maxSelections` constraints are enforced; the UI prevents invalid selections
- [ ] Selections are persisted to `ArmyUnit.wargearSelections`
- [ ] The UI clearly shows how many selections remain or are required

**Data References:** `Unit.wargearOptions: WargearOption[]`, `ArmyUnit.wargearSelections: ArmyWargearSelection[]`

---

**US-UDD-10: Apply enhancement to Character** `P1`
As a player, I want to apply an enhancement to a Character unit so that I can give my leaders special abilities within the rules.

**Acceptance Criteria:**
- [ ] The enhancement selector is only visible for Character units that are not Epic Heroes
- [ ] Available enhancements are drawn from `FactionData.enhancements` and filtered by keyword eligibility
- [ ] The same enhancement cannot be selected for more than one unit in the army
- [ ] A maximum of 3 enhancements can be applied across the entire army
- [ ] The selected enhancement is persisted to `ArmyUnit.enhancement`

**Data References:** `FactionData.enhancements: Enhancement[]`, `ArmyUnit.enhancement: ArmyEnhancement`

---

**US-UDD-11: Designate unit as Warlord** `P0`
As a player, I want to set a Character unit as Warlord so that I can designate my army's leader.

**Acceptance Criteria:**
- [ ] The Warlord toggle is only available for Character units
- [ ] Only one unit in the army can be designated Warlord at a time; selecting a new Warlord removes the designation from the previous one
- [ ] The unit must already exist in the army before it can be designated Warlord
- [ ] The designation is persisted to `Army.warlordUnitId`

**Data References:** `Army.warlordUnitId`, validation: must be Character

---

**US-UDD-12: Attach leader to bodyguard unit** `P1`
As a player, I want to attach a Character with Leader ability to a bodyguard unit so that my leaders can protect themselves within the rules.

**Acceptance Criteria:**
- [ ] The leader attachment control is only visible for units with `Unit.leader` defined
- [ ] The target bodyguard unit must appear in `Unit.leader.canAttachTo`; invalid targets are not selectable
- [ ] A unit cannot be attached to itself
- [ ] Each bodyguard unit can have at most one leader attached at a time
- [ ] The attachment is persisted to `ArmyUnit.leadingUnitId`

**Data References:** `ArmyUnit.leadingUnitId`, `Unit.leader.canAttachTo`

---

## Match View

**US-UDD-13: Track wounds per model during match** `P0`
As a player, I want to adjust wound state for each model during gameplay so that I can accurately track casualties as they occur.

**Acceptance Criteria:**
- [ ] Each model in the unit is listed individually with its current wound count from `UnitProjection.modelWounds`
- [ ] Wound counts can be incremented and decremented per model
- [ ] Changes dispatch `updateMatch` WebSocket events immediately
- [ ] The match unit detail drawer includes all readonly data from US-UDD-01 through US-UDD-06 (stats, abilities, weapons, composition, leaders, keywords) alongside the live wound state.
- [ ] A model at zero wounds is visually indicated as destroyed

**Data References:** `UnitProjection.modelWounds: Record<string, number>`, WebSocket `updateMatch`

---

**US-UDD-14: Toggle unit status flags during match** `P0`
As a player, I want to mark unit states during a match so that I can track which actions a unit has already taken this turn.

**Acceptance Criteria:**
- [ ] The following flags are displayed as toggleable controls: `battleShocked`, `advanced`, `fellBack`, `moved`, `inDeepStrike`, `inStrategicReserve`, `performingAction`, `hasShot`, `hasCharged`, `hasFought`, `engaged`
- [ ] Each toggle reflects the current value in `UnitProjection.flags`
- [ ] Toggling a flag dispatches an `updateMatch` WebSocket event
- [ ] Flags reset at the appropriate game phase transition

**Data References:** `UnitProjection.flags: UnitFlags`, WebSocket `updateMatch`

---

**US-UDD-15: Record kills for a unit** `P1`
As a player, I want to track kills for a unit during a match so that post-game and Crusade records are accurate.

**Acceptance Criteria:**
- [ ] A kill counter is displayed per unit in the match drawer
- [ ] The counter can be incremented and decremented
- [ ] Changes are persisted to `UnitProjection.kills` and dispatched via `updateMatch` WebSocket events
- [ ] The counter is visible only in match context, not in read-only or Army Builder contexts

**Data References:** `UnitProjection.kills`, WebSocket `updateMatch`

---

**US-UDD-16: View phase-filtered unit data in guided match mode** `P1`
As a player, I want the drawer to show only data relevant to the current game phase in guided mode so that I can focus on what matters right now.

**Acceptance Criteria:**
- [ ] Movement phase: Movement stat, Fly/Infiltrators keywords, and transport capacity are foregrounded; weapons are collapsed
- [ ] Shooting phase: ranged weapons are foregrounded; melee weapons are hidden
- [ ] Fight phase: melee weapons are foregrounded; ranged weapons are hidden
- [ ] Command phase: Leadership, OC, and Battle-Shock status are foregrounded
- [ ] Full data is always accessible via an "All Stats" toggle regardless of phase
- [ ] Phase filtering applies only in guided match mode; basic mode shows all data

**Data References:** `MatchData.gameState.phase`, `GamePhase`, all unit stat fields

---

**US-UDD-17: View full unit data in match drawer** `P0`
As a player, I want the match drawer to include all readonly info plus live match state so that I have a complete picture without switching views.

**Acceptance Criteria:**
- [ ] The match drawer renders all content from US-UDD-01 through US-UDD-06: stat line, abilities, weapons, composition, leader rules, and keywords
- [ ] Live wound state (US-UDD-13), status flags (US-UDD-14), and kill count (US-UDD-15) are displayed alongside the readonly data
- [ ] Phase filtering from US-UDD-16 applies when in guided match mode
- [ ] No horizontal overflow occurs at any supported viewport width

**Data References:** All from US-UDD-01 through US-UDD-06, plus `UnitProjection.modelWounds`, `UnitFlags`, `UnitProjection.kills`

---

**US-UDD-18: Closeable drawer with full stack dismissal** `P0`
As a player, I want the unit detail drawer to be closeable and dismiss all stacked modals so that I can return to my main view quickly.

**Acceptance Criteria:**
- [ ] A visible close button is present on the drawer
- [ ] Closing the drawer dismisses all open modals/drawers in the stack, not just the top one
- [ ] The drawer can be closed via the Escape key on web
- [ ] The drawer can be dismissed via swipe-down gesture on mobile

**Data References:** ARM-080

---

**US-UDD-19: Wider and fluid-responsive drawer** `P0`
As a player, I want the unit detail drawer to be wider and responsive so that weapon tables and model lists fit without horizontal scrolling.

**Acceptance Criteria:**
- [ ] The drawer is at minimum 200px wider than the initial mockup width
- [ ] The drawer occupies approximately 60-70% of viewport width on desktop
- [ ] The drawer is full-screen on viewports below the tablet breakpoint
- [ ] No horizontal scrolling occurs inside the drawer at any breakpoint

**Data References:** ARM-080, GLB-001

---

**US-UDD-20: Unit items open drawer, not page navigation** `P0`
As a player, I want tapping a unit in the army page list to open the unit detail drawer so that I stay in context while configuring units.

**Acceptance Criteria:**
- [ ] Tapping a unit item in the Army Details unit list opens the unit detail drawer overlay
- [ ] Tapping a unit does not trigger a route change or page navigation
- [ ] The drawer opens in configuration mode when accessed from Army Builder context
- [ ] The drawer opens in read-only mode when accessed from Reference context

**Data References:** ARM-080

---

**US-UDD-21: Add-unit drawer matches unit detail drawer layout** `P0`
As a player, I want the add-unit drawer and the existing-unit drawer on the Army page to be identical in layout so that the experience is consistent.

**Acceptance Criteria:**
- [ ] The add-unit drawer contains the full unit configuration content: stats, abilities, weapons, composition, wargear options, and enhancements
- [ ] The add-unit drawer layout is identical to the drawer opened for an existing army unit
- [ ] Both drawers are rendered by the same component, differentiated by a data mode prop (new vs. existing)

**Data References:** ARM-080, ARM-060

---

**US-UDD-22: Visible unit filters in add-unit drawer** `P1`
As a player, I want unit filters in the add-unit drawer to be fully visible so that I can filter without scrolling.

**Acceptance Criteria:**
- [ ] The filter UI in the add-unit drawer is fully visible without requiring the user to scroll past it
- [ ] The filter container has sufficient height to display all filter options
- [ ] On narrow viewports, filters collapse to a compact bar with a "Filters" toggle button

**Data References:** ARM-061

---

**US-UDD-23: Smaller weapon font in drawer** `P1`
As a player, I want weapon text in the drawer to be appropriately sized so that more content fits without excessive scrolling.

**Acceptance Criteria:**
- [ ] Weapon names and stat text inside the drawer use a smaller font size than body text
- [ ] The weapon font size remains readable at a minimum of 12px or equivalent
- [ ] More weapon rows are visible without scrolling compared to current mockups

**Data References:** ARM-080

---

**US-UDD-24: Wargear section layout cleanup** `P1`
As a player, I want wargear displayed cleanly under the appropriate weapon section so that the drawer is not cluttered with redundant labels.

**Acceptance Criteria:**
- [ ] The "equipped loadout" section label is removed from the drawer
- [ ] Wargear is shown directly under the Melee Weapons section or as part of the weapon grouping
- [ ] No redundant section headers appear for equipped gear

**Data References:** ARM-082

---

**US-UDD-25: Use real BSData for reference units** `P0`
As a player, I want unit data to come from real BSData sources so that stats are accurate and complete.

**Acceptance Criteria:**
- [ ] Unit data is fetched from BSData community data files via `@armoury/providers-bsdata`
- [ ] The Intercessor Squad is used as the reference multi-model unit for testing
- [ ] The Captain in Terminator Armour is used as the reference single-model unit for testing

**Data References:** ARM-080, PLG-002, @armoury/providers-bsdata

---

**US-UDD-26: Single-model drawer layout** `P0`
As a player, I want a clear layout for single-model unit drawers so that character units display their information logically.

**Acceptance Criteria:**
- [ ] Single-model drawer renders content in this order: Unit Name, Keywords, M/T/SV/W/LD/OC stat line, Ranged Weapons, Melee Weapons, Wargear, Abilities
- [ ] In match context, the HP bar appears inline in the header area to the right of the unit name
- [ ] The HP bar does not appear below the stat line in match context

**Data References:** ARM-080, MTH-063

---

**US-UDD-27: Multi-model drawer layout** `P0`
As a player, I want a clear layout for multi-model unit drawers so that squads display their per-model information logically.

**Acceptance Criteria:**
- [ ] Multi-model drawer renders content in this order: Unit Name, Keywords, M/T/SV/W/LD/OC stat line, Wargear (unit-level), Unit-specific Abilities, Model List
- [ ] Each model in the Model List shows: model name, ranged weapons for that model, melee weapons for that model, and model-specific wargear
- [ ] In match context, each model entry in the Model List additionally shows an HP bar

**Data References:** ARM-080, ARM-081

---

**US-UDD-28: Keywords section placement** `P1`
As a player, I want the keywords section to appear in the correct location so that it doesn't clutter the unit composition area.

**Acceptance Criteria:**
- [ ] The Keywords section appears below Enhancements, not inside the Unit Composition section
- [ ] Keywords are rendered as chips or tags
- [ ] Faction keywords and unit keywords are displayed in clearly labelled groups

**Data References:** ARM-080, ARM-083

---
