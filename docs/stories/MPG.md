# Matches Page — The War Ledger (MPG)

## Match Detail

**US-MPG-01: View match list** `P0`
As a player, I want to see all matches with status, opponent, date, and outcome so that I can track my game history.

**Acceptance Criteria:**
- [ ] In-progress matches are shown at the top, separated from completed/pending
- [ ] Each card shows: opponent name, match status, battle size, date

**Data References:** `GET /matches`, `Match.outcome.status`, `MatchPlayer.displayName`, `MissionConfig.battleSize`

---

**US-MPG-02: View match score breakdown** `P1`
As a player, I want detailed scoring covering primary, secondary, challenger, and per-round breakdown so that I can analyse my performance.

**Acceptance Criteria:**
- [ ] Per-round score breakdown renders as a vertically stacked list on mobile (no horizontal scrollbar)

**Data References:** `Match.score.totalsByPlayerId`, `Match.score.events: MatchScoreEvent[]`

---

**US-MPG-03: Delete a match** `P1`
As a player, I want to delete a match so that I can remove records I no longer need.

**Acceptance Criteria:**
- [ ] A confirmation dialog is shown before deletion
- [ ] Only the match creator can delete the match

**Data References:** `DELETE /matches/{id}`

---

**US-MPG-04: View match setup summary** `P1`
As a player, I want to see mission, deployment zone, and battle size before the match starts so that I know what I've configured.

**Acceptance Criteria:**
- [ ] The match setup summary displays mission, deployment zone, and battle size

**Data References:** `MissionConfig.missionId`, `MissionConfig.deploymentTypeId`, `MissionConfig.battleSize`

---

## Play Match

**US-MPG-05: Start a match** `P0`
As a player, I want to transition a match from setup to active play so that the game can begin.

**Acceptance Criteria:**
- [ ] A "Start Match" action transitions `Match.outcome.status` to `in_progress`

**Data References:** `PUT /matches/{id}`, `Match.outcome.status`, `MatchData.gameState`

---

**US-MPG-06: Advance game phase** `P0`
As a player, I want to advance to the next phase in the game flow so that both players stay in sync.

**Acceptance Criteria:**
- [ ] Phases advance in sequence: Command → Movement → Shooting → Charge → Fight → End

**Data References:** `MatchData.gameState.phase`, `GamePhase`, WebSocket `updateMatch`

---

**US-MPG-07: Track primary mission scoring** `P0`
As a player, I want to record VP from the primary mission at the end of each round so that scores are accurately tracked.

**Acceptance Criteria:**
- [ ] Primary VP can be recorded at end of each round
- [ ] Maximum 50VP from primaries is enforced

**Data References:** `Match.score.events`, `MatchScoreEvent`, maximum 50VP from primaries

---

**US-MPG-08: Track secondary mission scoring** `P0`
As a player, I want to record VP from secondary missions so that my full score is captured.

**Acceptance Criteria:**
- [ ] Fixed and Tactical secondary VPs can be recorded
- [ ] Maximum 40VP from secondaries is enforced

**Data References:** `MissionConfig.secondariesByPlayerId`, `Match.score.events`, maximum 40VP from secondaries

---

**US-MPG-09: Record challenger/underdog VP** `P2`
As a player, I want to track bonus VP from challenger/gambit cards so that the full scoring picture is recorded.

**Acceptance Criteria:**
- [ ] Challenger/gambit VP can be recorded
- [ ] Maximum 12VP from gambit cards is enforced

**Data References:** `MissionConfig.gambitByPlayerId`, `ChallengerCard`, max 12VP

---

**US-MPG-10: End a match** `P0`
As a player, I want to conclude the match so that final scores are calculated and the result is recorded.

**Acceptance Criteria:**
- [ ] An "End Match" action sets `Match.outcome.status` to `completed`
- [ ] Final scores are calculated and stored in `Match.outcome.resultsByPlayerId`

**Data References:** `PUT /matches/{id}`, `Match.outcome.status`, `Match.outcome.resultsByPlayerId`

---

## Match Setup

**US-MPG-11: Configure match settings before play** `P0`
As a player, I want to select mission, deployment, and set secondary missions during setup so that the match is fully configured before play begins.

**Acceptance Criteria:**
- [ ] Mission, deployment zone, and secondary missions can be configured during setup

**Data References:** `MissionConfig`, `PrimaryMission`, `DeploymentZone`, `SecondaryMission`

---

**US-MPG-12: Designate units for deep strike or strategic reserves** `P1`
As a player, I want to assign units to Deep Strike or Strategic Reserves during setup so that my deployment plan is captured.

**Acceptance Criteria:**
- [ ] Units can be assigned to Deep Strike or Strategic Reserves
- [ ] Maximum 50% of units and 50% of points can be placed in reserves

**Data References:** `UnitFlags.inDeepStrike`, `UnitFlags.inStrategicReserve`, reserve rules (50% cap)

---

**US-MPG-13: Subscribe to real-time match updates** `P0`
As a player, I want match state to sync in real time between both players so that both views stay consistent.

**Acceptance Criteria:**
- [ ] Match state is synced via WebSocket between both players

**Data References:** WebSocket `subscribeMatch`, `unsubscribeMatch`, `updateMatch`

---

**US-MPG-30: Match setup phase with zero-state UI** `P0`
As a player, I want a setup phase at the start of a match so that deep strike, reserves, mission cards, and secondaries are configured before play begins.

**Acceptance Criteria:**
- [ ] The match flow includes a setup phase before deployment
- [ ] The setup phase UI includes: deep strike unit designation, strategic reserves designation, mission card display (reference format from gdmissions.app), and fixed/tactical secondary mission selection
- [ ] All setup data is persisted via `PUT /matches/{id}`

**Data References:** MTH-064, UnitFlags.inDeepStrike, UnitFlags.inStrategicReserve, MissionConfig.secondariesByPlayerId

---

**US-MPG-31: Distinct deployment phase** `P0`
As a player, I want a distinct deployment phase before the first game turn so that the match flow matches the actual game sequence.

**Acceptance Criteria:**
- [ ] The match flow includes a deployment phase that is distinct from setup and from Turn 1
- [ ] The deployment phase allows marking unit positions and reserve status
- [ ] A "Finish Deployment" action advances the phase to the Command phase of Turn 1
- [ ] `MatchData.gameState.phase` reflects the deployment phase as a distinct value

**Data References:** MTH-064, MatchData.gameState.phase

---

## Match Deployment

**US-MPG-14: Mark unit deployment positions** `P1`
As a player, I want to mark units as deployed during the deployment phase so that both players know what has been placed.

**Acceptance Criteria:**
- [ ] Units can be marked as deployed during the deployment phase

**Data References:** `MatchData.gameState.phase === 'Deployment'`, `DeploymentState`

---

## Basic Match Mode

**US-MPG-15: View a persistent phase and turn progress indicator** `P1`
As a player, I want a persistent indicator showing the current round and phase so that I always know where I am in the game.

**Acceptance Criteria:**
- [ ] A fixed/sticky indicator shows: round number (1-5), current phase name, remaining phases as a visual sequence
- [ ] Tapping the indicator shows a brief phase rules summary
- [ ] The indicator updates via WebSocket

**Data References:** `MatchData.gameState.round`, `MatchData.gameState.phase`, `GamePhase`, WebSocket `updateMatch`

---

**US-MPG-16: Re-enter an in-progress match** `P1`
As a player, I want to return to an in-progress match from the Matches Page so that I can resume without losing my place.

**Acceptance Criteria:**
- [ ] In-progress matches are prominent on the Matches Page
- [ ] Tapping an in-progress match navigates to match play at the current phase with all state loaded
- [ ] The mobile app shows a banner to resume an in-progress match

**Data References:** `Match.outcome.status`, `GET /matches/{id}`, `MatchData.gameState`

---

**US-MPG-17: Hide primary navigation during active match play** `P1`
As a player, I want the primary navigation hidden during an active match so that I can focus on gameplay without distractions.

**Acceptance Criteria:**
- [ ] The bottom tab bar/side nav is hidden during active match play
- [ ] An explicit "Exit Match" action is available but not prominent
- [ ] Exiting the match restores full navigation

**Data References:** `Match.outcome.status`, navigation state

---

**US-MPG-18: Detachment label in basic match view** `P1`
As a player, I want to see my detachment name in the basic match view so that I can reference my detachment rules during play.

**Acceptance Criteria:**
- [ ] The detachment name is displayed on the relevant section or card in the basic match view
- [ ] The name is resolved from `ArmyProjection.detachmentId` against `FactionData.detachments`

**Data References:** MTH-060, MTH-066, ArmyProjection.detachmentId, FactionData.detachments

---

**US-MPG-19: White icons on dark backgrounds in match view** `P1`
As a player, I want all icons in the match view to be white on dark backgrounds so that the visual style is consistent with the tactical theme.

**Acceptance Criteria:**
- [ ] All icons in the basic match view render in white when on dark backgrounds
- [ ] No colored icons are used anywhere in the match view
- [ ] Icon color is defined in the design token system rather than hardcoded per-component

**Data References:** GLB-008

---

**US-MPG-20: Larger rules text in match view** `P1`
As a player, I want rules text to be readable during gameplay so that I can quickly reference abilities and effects.

**Acceptance Criteria:**
- [ ] Rules text in the match view uses a minimum font size of 14px or equivalent
- [ ] Rules text is larger than current mockup renders without zooming

**Data References:** MTH-060

---

**US-MPG-21: Taller match view header** `P1`
As a player, I want the match header to have sufficient height so that all header content is displayed without cramming.

**Acceptance Criteria:**
- [ ] The match view header has enough vertical space to display: match name, round/phase indicator, player names with scores, CP counters, and mode toggle
- [ ] Header content is not vertically compressed or clipped at any supported viewport size

**Data References:** MTH-064

---

**US-MPG-22: Match name and back button in header** `P1`
As a player, I want the match header to show the match name and a way to navigate back so that I know what match I'm in and can exit.

**Acceptance Criteria:**
- [ ] The match header displays the match name
- [ ] A back button or breadcrumb in the format "War Ledger → Match Name" is present in the header
- [ ] Activating back navigation returns the user to the Matches Page

**Data References:** MTH-040

---

**US-MPG-23: HP tracking with three input methods** `P0`
As a player, I want multiple ways to adjust HP so that I can track wounds quickly during fast-paced gameplay.

**Acceptance Criteria:**
- [ ] Each model's HP supports increment/decrement buttons (+1 and -1)
- [ ] Each model's HP supports a directly editable text field
- [ ] Each model's HP supports a draggable HP bar
- [ ] All three input methods are present simultaneously for each model
- [ ] All methods update `UnitProjection.modelWounds` and dispatch `updateMatch` WebSocket events

**Data References:** MTH-063, UnitProjection.modelWounds, WebSocket updateMatch

---

**US-MPG-24: Sticky footer action bar in match view** `P1`
As a player, I want the action bar to remain visible at the bottom of the screen so that match controls are always accessible.

**Acceptance Criteria:**
- [ ] The match view renders a sticky footer (action bar) that does not scroll out of view
- [ ] The footer remains fixed at the bottom while the unit list scrolls
- [ ] The footer contains match actions such as next phase, scoring, and end turn

**Data References:** MTH-064

---

**US-MPG-25: Available Stratagems label** `P1`
As a player, I want the actions section to be correctly labeled so that I know I'm looking at stratagems.

**Acceptance Criteria:**
- [ ] The actions section in the match view is labeled "Available Stratagems"
- [ ] The label "Available Actions" does not appear anywhere in the match view

**Data References:** MTH-067

---

**US-MPG-26: CP readout with adequate spacing** `P1`
As a player, I want the CP counter to be easily readable so that I can track command points at a glance.

**Acceptance Criteria:**
- [ ] The CP readout has more horizontal space than current mockups
- [ ] The CP value is prominently displayed with clear increment and decrement controls
- [ ] The layout does not visually compress the CP counter at any supported viewport

**Data References:** MTH-062, PlayerState.commandPoints

---

**US-MPG-27: Remove green dot indicator from match view** `P1`
As a player, I want the match view to be free of unnecessary visual noise so that I can focus on gameplay.

**Acceptance Criteria:**
- [ ] The green dot indicator is not rendered anywhere in the match view
- [ ] Online/offline status is conveyed through an alternative mechanism such as an opponent status bar

**Data References:** MTH-065

---

**US-MPG-28: Stratagem click closes unit drawers** `P1`
As a player, I want clicking a stratagem to close any open unit drawers so that the stratagem details are fully visible.

**Acceptance Criteria:**
- [ ] Clicking or tapping a stratagem card automatically closes any open unit detail drawer
- [ ] The stratagem information is displayed in its own panel or overlay after the drawer closes

**Data References:** MTH-067

---

**US-MPG-29: Weapon count in unit list item readout** `P1`
As a player, I want to see weapon counts on unit list items so that I know the firepower at a glance without opening the drawer.

**Acceptance Criteria:**
- [ ] Each unit list item in the match view displays a count of ranged weapons and melee weapons
- [ ] Counts are displayed as compact badges or inline text on the unit list item

**Data References:** MTH-063, Unit.rangedWeapons, Unit.meleeWeapons

---

**US-MPG-32: Secondary missions right-rail drawer** `P0`
As a player, I want secondary missions and mission rules in a persistent side rail so that I can reference them without losing my unit list context.

**Acceptance Criteria:**
- [ ] A right-rail drawer with two tabs (Secondary Missions and Mission Rules) is displayed alongside match content
- [ ] The rail is 48px wide when collapsed on desktop and 48px tall when collapsed on mobile
- [ ] The expanded rail shows mission cards in a playing card layout, two side-by-side
- [ ] The main content area scrolls independently; the right rail remains fixed
- [ ] The same rail component is used in both Basic and Guided match modes

**Data References:** MTH-067, MissionConfig.secondariesByPlayerId

---

**US-MPG-33: Main content area scroll isolation** `P1`
As a player, I want the main content area to scroll independently so that the right rail and header remain fixed.

**Acceptance Criteria:**
- [ ] The main content area scrolls independently of the right rail and header
- [ ] The window or body does not scroll; only the content panel scrolls
- [ ] The right rail remains fixed in position during content panel scrolling

**Data References:** MTH-042

---

**US-MPG-34: End-of-turn secondary mission prompt** `P1`
As a player, I want a prompt at end-of-turn to mark secondary mission completion so that I don't forget to score before advancing.

**Acceptance Criteria:**
- [ ] Before advancing to the next turn, a prompt appears asking both players to mark secondary mission completions
- [ ] The prompt lists each active secondary with a "Completed this turn?" toggle
- [ ] Scoring events are created in `Match.score.events` for completed secondaries
- [ ] The prompt appears in both Basic and Guided match modes

**Data References:** MTH-067, Match.score.events, MissionConfig.secondariesByPlayerId

---

**US-MPG-35: Full match flow sequence** `P0`
As a player, I want the match to follow the correct phase sequence so that the digital experience matches the tabletop game.

**Acceptance Criteria:**
- [ ] The full match flow is: Match Creation → Match Setup → Deployment → Game Turns (Command → Movement → Shooting → Charge → Fight → End, repeated for up to 5 rounds) → Match Summary
- [ ] This sequence is reflected in `MatchData.gameState.phase` values
- [ ] The state machine prevents skipping phases

**Data References:** MTH-040 through MTH-043, MatchData.gameState.phase, GamePhase

---

**US-MPG-36: Completed match navigates to summary view** `P0`
As a player, I want completed matches to show a read-only summary so that I can review the game without accidentally modifying it.

**Acceptance Criteria:**
- [ ] When `Match.outcome.status` transitions to `completed`, the view navigates to a Match Summary view
- [ ] The summary view is read-only: no unit flag toggles, no HP adjustment, no scoring inputs
- [ ] The summary displays: final scores, per-round breakdown, both players' armies, and match outcome
- [ ] The summary view is accessible from the Matches Page for any completed match

**Data References:** MTH-084, Match.outcome.status, Match.score

---

## Guided Match Mode

**US-MPG-37: Guided mode CP directly editable** `P1`
As a player, I want to directly edit my CP value in guided mode so that I can quickly correct the count without increment/decrement.

**Acceptance Criteria:**
- [ ] The CP value in the guided mode header is a directly editable text field
- [ ] Tapping the value activates an inline input for typing a new number
- [ ] The input validates to a non-negative integer
- [ ] Changes dispatch `updateMatch` WebSocket events

**Data References:** MTH-062, PlayerState.commandPoints, WebSocket updateMatch

---

**US-MPG-38: Shared header between Basic and Guided modes** `P1`
As a player, I want Basic and Guided modes to use the same header so that switching modes doesn't disorient me.

**Acceptance Criteria:**
- [ ] The match header component is shared between Basic and Guided modes — one implementation, not two
- [ ] Header content (match name, round, phase, player info, CP, mode toggle) is identical in both modes

**Data References:** MTH-061

---

**US-MPG-39: HP bars on model cards in guided mode** `P0`
As a player, I want to see and adjust HP bars on model cards in guided mode so that I can track wounds during any phase.

**Acceptance Criteria:**
- [ ] Model cards in the guided mode unit detail drawer display an HP bar for each model
- [ ] HP bars are adjustable using the same three input methods defined in US-MPG-23
- [ ] HP bar visibility is not suppressed or hidden based on the current phase

**Data References:** MTH-063, UnitProjection.modelWounds

---

**US-MPG-40: Guided mode unit list items with phase-relevant states** `P0`
As a player, I want unit list items in guided mode to show only phase-relevant information so that I focus on what matters now.

**Acceptance Criteria:**
- [ ] Each unit list item shows: unit name, total HP, and only the toggleable state tags relevant to the current phase
- [ ] During Shooting phase, a "Not Shot / Shot" toggle is shown on each unit list item
- [ ] During Fight phase, a "Not Fought / Fought" toggle is shown on each unit list item
- [ ] During Movement phase, movement-related toggles are shown
- [ ] Only wargear relevant to the current phase is displayed on the list item
- [ ] All state tags are interactive clickable toggles

**Data References:** MTH-061, MTH-063, MatchData.gameState.phase, UnitFlags

---

**US-MPG-41: Guided mode auto-issue secondary missions** `P1`
As a player, I want secondary missions to be automatically presented during the Command phase in guided mode so that I don't forget to consider them.

**Acceptance Criteria:**
- [ ] During the Command phase in guided mode, the secondary missions panel automatically opens or a prompt displays the player's active secondaries
- [ ] The auto-issue occurs once per Command phase entry, not on re-entry
- [ ] Players can dismiss the prompt and re-access secondaries via the right rail

**Data References:** MTH-067, MissionConfig.secondariesByPlayerId, MatchData.gameState.phase

---

**US-MPG-42: Larger weapon font and weapon count in guided mode** `P1`
As a player, I want weapon text to be readable and weapon counts visible in guided mode so that I can quickly assess unit firepower.

**Acceptance Criteria:**
- [ ] Weapon font size in guided mode is a minimum of 14px or equivalent
- [ ] Weapon count is displayed alongside weapon names in guided mode
- [ ] Weapon display sizing follows the same rules in both Basic and Guided modes

**Data References:** MTH-061, Unit.rangedWeapons, Unit.meleeWeapons

---
