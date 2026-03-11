# Phase 3 - Match Experience (Weeks 8-13)

> Phase: 3 | Timeline: Weeks 8-13 | Pages: 8
> Stories: 61 | UX Issues: 42 | Conflicts: C-01, C-02, C-07

---

## Overview

Phase 3 is the most complex phase in the frontend plan. It covers the entire match lifecycle: creation, linking, setup, deployment, active play in two distinct modes, and conclusion. The unit list is central to every match screen. All match pages share the same underlying unit list component but vary in what each item displays.

The match flow follows a strict state machine (see §Match State Machine). Players create a match via a contextual drawer (not a page), link up with opponents, configure setup and deployment, then play through five game phases per round in either Basic or Guided mode. When both players confirm final VP, the match transitions to a read-only summary.

Key architectural decisions locked in for this phase:

- **C-01**: Match Creation is a drawer, not a standalone route.
- **C-02**: All real-time sync goes through `MatchStream`. WebSocket transport via `MatchesRealtimeClient`; UI components subscribe to observables only.
- **C-07**: The creation drawer renders conditionally based on a context object passed at open time.

---

## Cross-References

| Item                                     | Reference                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Unit Detail Drawer (all modes)           | [SHARED_COMPONENTS.md](SHARED_COMPONENTS.md) §3.5                                                |
| MatchStream interface (contract)         | [PHASE_0_SHARED_PREREQUISITES.md §2.2](PHASE_0_SHARED_PREREQUISITES.md#22-matchstream)           |
| MatchStream architecture (detailed)      | This document §Match Sync Architecture                                                           |
| Mockup dependencies                      | [PHASE_0_SHARED_PREREQUISITES.md §5](PHASE_0_SHARED_PREREQUISITES.md#5-mockup-delivery-registry) |
| Hard Constraints C, D, E                 | This document §Hard Constraints                                                                  |
| Campaign match creation (MCD-06, MCD-07) | [PHASE_4_CAMPAIGNS.md](PHASE_4_CAMPAIGNS.md) §7.3                                                |
| Shell layout / navigation hiding         | [PHASE_1_FOUNDATION.md](PHASE_1_FOUNDATION.md) §4.1                                              |

---

## Hard Constraints

**Constraint C - Match context unit drawer**: The unit detail drawer in match context shows the model list with adjustable HP bar and equipped wargear stats. Players cannot change model count or loadout during a match. The drawer is read-only except for HP adjustments and state tag toggles.

**Constraint D - Basic vs. Guided unit list items**: Both modes show the same unit list. In Basic mode, list items display all interactive state tags, total HP, and wargear summary. In Guided mode, list items show only the state tags and wargear relevant to the current game phase. The unit detail drawer content is identical in both modes.

**Constraint E - Drawer layout consistency**: The unit detail drawer uses the same layout component across all match contexts. The match mode controls which data props are populated (HP bars, kill counters, status tags) but the structural shell does not change between Basic and Guided modes.

---

## Match State Machine

The authoritative state sequence for all match lifecycle transitions:

```
CREATED → LINKING → LINKED → SETUP → DEPLOYMENT → IN_PROGRESS → CONCLUDING → COMPLETED
```

| State         | Trigger                 | UI Surface                                   |
| ------------- | ----------------------- | -------------------------------------------- |
| `CREATED`     | Match created by host   | War Ledger - pending card                    |
| `LINKING`     | Invite sent to opponent | Match Page 6.3 - linking/join flow (6.2a)    |
| `LINKED`      | Opponent accepts invite | Match Page 6.3 - both players confirm armies |
| `SETUP`       | Both armies confirmed   | Match Page 6.3 - Setup phase UI              |
| `DEPLOYMENT`  | Setup confirmed         | Match Page 6.3 - Deployment phase UI         |
| `IN_PROGRESS` | Deployment confirmed    | Active Match 6.4 (Basic) or 6.5 (Guided)     |
| `CONCLUDING`  | "End Match" tapped      | Match Conclusion 6.5a - VP reconciliation    |
| `COMPLETED`   | Both players confirm VP | Match Summary - read-only (6.5a)             |

All state transitions are dispatched through `MatchStream` (see §Match Sync Architecture). UI components never call `setTimeout` or `setInterval` directly. The match state badge shown on War Ledger cards and the Match Page header reflects this sequence.

---

## Pages

### 6.1 War Ledger (Match List)

**Route:** `/[gameSystem]/matches`
**Complexity:** M | **Effort:** 3 days

**Stories:** MPG-01, MPG-03, MPG-16

**Implementation Notes:**

- Match list grouped by status: Active pinned to top, then Upcoming (Created/Linking/Linked), then Past (Completed).
- Each card shows opponent name, armies involved, date, score if completed, and a status badge reflecting the state machine above.
- Filter by status, opponent, date range. Default sort: most recent.
- Empty state with "Create Match" CTA opening the creation drawer (no `armyId` in context - army selector shown).
- Tapping an in-progress match re-enters Active Match at the current state.

**Gap Fixes:**

- **MPG-03 (MISSING - match deletion):** Match cards include a delete action. On mobile: swipe left to reveal. On web: three-dot context menu. Deletion requires a confirmation dialog. Matches in `LINKING`, `LINKED`, `SETUP`, `DEPLOYMENT`, or `IN_PROGRESS` state cannot be deleted without first being abandoned. Abandoned matches transition to a terminal `ABANDONED` state before deletion is permitted.
- **MPG-16 (MAPPED):** "Resume Match" entry point on in-progress cards navigates directly to Active Match at the correct mode (`?mode=basic` or `?mode=guided` per last-known `Match.mode`).

---

### 6.2 Match Creation Drawer

> **Rewritten per C-01 and C-07.** There is no standalone route `/[gameSystem]/matches/new`. Match creation is always a drawer.

**Route:** N/A (drawer, three entry points)
**Complexity:** L | **Effort:** 5 days

**Stories:** MCD-01, MCD-02, MCD-03, MCD-04, MCD-05, MCD-08, MCD-09, MCD-10, MCD-11, MCD-12

**UX Issues:** MC-01, MC-02, MC-03, MC-04

**Entry Points and Context Objects:**

| Entry Point                         | Context Object                                                   | Army Selector | Opponent Scope             |
| ----------------------------------- | ---------------------------------------------------------------- | ------------- | -------------------------- |
| Army Detail "Deploy" button         | `{ armyId: string, opponentScope: 'friends' }`                   | Skipped       | Friends list               |
| War Ledger "Create Match" CTA       | `{ opponentScope: 'friends' }`                                   | Shown         | Friends list               |
| Campaign Detail "Play Match" button | `{ campaignId: string, opponentScope: 'campaign-participants' }` | Skipped\*     | Campaign participants only |

\*Campaign context also pre-assigns the army registered to that campaign. See Phase 4 for campaign-specific story MCD-06.

**Drawer Steps (full flow, no context):**

1. **Army selection** - army picker from user's armies, filtered to compatible point limit.
2. **Match settings** - point limit, battle size.
3. **Mission and deployment** - Chapter Approved mission deck (plugin-provided), deployment zone selection.
4. **Secondary missions** - configure Fixed or Tactical secondaries per player (MCD-04).
5. **Gambit cards** - challenger/underdog designation, up to 12VP (MCD-05).
6. **Opponents** - multi-select from friends list (MCD-11); online friends sorted to top (MCD-08).
7. **Schedule (optional)** - `scheduledAt` date/time picker, nullable field (MCD-10, MC-02).

**Gap Fixes:**

- **MCD-01 (PARTIAL - pre-selected context flow):** When `armyId` is in the context object, step 1 (army selection) is removed entirely. The drawer opens directly at step 2. A summary line at the top shows the pre-selected army name and faction. No back button to an army selector exists.
- **MCD-05 (MISSING - gambit cards):** Step 5 is a toggle group: "No gambits / I'm the Challenger / I'm the Underdog." Selecting Challenger or Underdog reveals a VP cap field (1-12, default 10). Configuration stored to `MissionConfig.gambitByPlayerId`. Only shown when the selected mission supports gambits (plugin flag `mission.supportsGambits`).
- **MCD-10 (MISSING - match time/date):** An optional date-time field labeled "Schedule for later?" appears at the bottom of the match settings step. Uses Radix Calendar + time input on web, Expo DateTimePicker on mobile. `Match.scheduledAt` is nullable; leaving this blank is valid.
- **MCD-11 (PARTIAL - multi-select):** Opponent selection renders the friends list as a multi-select list. Selected opponents appear as removable chips above the list. Invite button sends push notifications to all selected opponents simultaneously.
- **MCD-12 (MISSING):** See linking screen layout in §6.2a below.
- **MC-01** enforced via context object above. **MC-02** `scheduledAt` is optional, no validation error if blank. **MC-03** multi-select opponents described above. **MC-04** side-by-side layout is on the linking screen in 6.2a.

---

### 6.2a Match Linking (Join Flow)

**Route:** Part of `/[gameSystem]/matches/[matchId]` (state: `LINKING`)
**Complexity:** L | **Effort:** 4 days

**Stories:** MJN-01, MJN-02, MJN-03, MCD-09, MCD-12

**Implementation Notes:**

- Shown when match is in `LINKING` state. Host sees the join code/QR panel. Invitee sees the accept/decline prompt.
- **MCD-09:** QR code and numeric join code generated on match creation. QR displayed via `qrcode` library. Numeric code is 6 digits; rate-limited to 10 attempts before a new code must be generated.
- **MCD-12 (MISSING - side-by-side layout):** Desktop: join code/QR on the left half, friends list (with pending invite status) on the right half. Friends who have already been invited show a "Pending" chip. Uninvited friends show an "Invite" action. Mobile: code block on top, friends list scrollable below.
- **MJN-01:** Invitee notification includes "Accept" and "Decline" inline actions. Accepting transitions match to `LINKED` and navigates to Match Page (6.3). Declining notifies the host and returns the match to `CREATED`.
- **MJN-02:** Web users without camera enter the 6-digit numeric code on a dedicated join screen at `/[gameSystem]/matches/join`.
- **MJN-03:** Mobile users can scan the QR code via camera. Platform-gated: camera permission requested at scan time; graceful fallback to numeric code entry if denied.
- "Connected" confirmation screen shows both players' names and armies after successful link before proceeding to Setup.
- Friend request offered during linking if players are not yet connected.

---

### 6.3 Match Page (Setup + Deployment)

**Route:** `/[gameSystem]/matches/[matchId]`
**Complexity:** L | **Effort:** 4 days

**Stories:** MPG-04, MPG-05, MPG-11, MPG-12, MPG-14, MPG-30, MPG-31, MPG-35

**Three display modes** (determined by match state):

- **Past** (`COMPLETED`): Read-only summary with final scores. Navigates here when MPG-36 fires.
- **Future** (`CREATED`/`LINKING`/`LINKED`): Shows pending actions (see 6.2a for Linking state).
- **Active** (`SETUP`/`DEPLOYMENT`/`IN_PROGRESS`/`CONCLUDING`): Routes into active match or setup.

**Gap Fixes:**

- **MPG-30 (PARTIAL - setup phase zero-state):** When match state is `SETUP`, the page renders a Setup phase UI with four sections: (1) Strategic Reserves - toggle per unit, subject to 50% model cap; (2) Deep Strike - toggle per unit, separate from reserves; (3) Mission Card - summary of selected primary mission and scoring conditions; (4) Secondary Missions - confirm per-player secondary selection (Fixed or Tactical). Each section shows a zero-state illustration until at least one unit or selection is assigned. A "Confirm Setup" button transitions the match to `DEPLOYMENT`. Both players must confirm before the state advances.
- **MPG-31 (PARTIAL - distinct deployment phase):** When match state is `DEPLOYMENT`, the page renders a Deployment phase UI. Units assigned to reserves or deep strike are shown in a separate "Not Yet Deployed" section. Remaining units are listed as deploying. Player marks each unit as "Deployed." "Confirm Deployment" transitions the match to `IN_PROGRESS`. The final UI layout will be refined when the Deployment Phase mockup is available.
- **MPG-12 (PARTIAL - 50% reserve cap):** The Strategic Reserves toggle shows a running count (e.g., "3 of 6 units in reserve - 50% cap"). Toggling a unit into reserves when at the cap shows an inline error and prevents selection.
- **MPG-14 (PARTIAL - deployment marking):** Each unit row in Deployment phase has a "Deployed" toggle. Tapping marks the unit as placed on the table. Visual distinction: deployed units appear dimmed; not-yet-deployed units are highlighted.
- **MPG-11:** Match settings (mission, deployment zone, secondaries) are configurable in Setup state. Once the match moves past `SETUP`, settings are locked to read-only.

---

### 6.4 Active Match - Basic Mode

**Route:** `/[gameSystem]/matches/[matchId]?mode=basic`
**Complexity:** XL | **Effort:** 10 days

**Stories:** MPG-06, MPG-07, MPG-08, MPG-09, MPG-13, MPG-15, MPG-17, MPG-18, MPG-19, MPG-20, MPG-21, MPG-22, MPG-23, MPG-24, MPG-25, MPG-26, MPG-27, MPG-28, MPG-29, MPG-32, MPG-33, MPG-34, ULV-05, ULV-06

**UX Issues:** MB-01 through MB-27

**Layout - Desktop:**

- Sticky header: match name + back nav, round indicator, both players' VP and CP, Basic/Guided toggle.
- Left column: active player's unit list.
- Right column: opponent's unit list (scores, CP, whose turn indicator).
- Right rail (48px collapsed): two tabs - Secondary Missions and Mission Rules.
- Sticky footer: round-advance action, CP shortcut, score entry shortcut.

**Layout - Mobile:**

- Same sticky header.
- Tabbed unit lists: "My Army" / "Opponent."
- Right rail becomes a bottom sheet (48px collapsed, drag to expand).
- Sticky footer same as desktop.

**Unit List Items (Constraint D - Basic Mode):**
Each item shows: unit name, detachment label, wargear count summary (e.g., "3 ranged / 2 melee"), total HP across all models, and all interactive state tags (Battle-shocked, Stealth, Lone Operative, Advanced, Fell Back, etc.). State tags are toggleable - tap to activate/deactivate. Tapping the unit row (not a tag) opens the Unit Detail Drawer in match context (Constraint C).

**Gap Fixes - Layout and Navigation:**

- **MPG-17 (MISSING - hide nav during match):** Primary navigation (side nav or bottom tab bar) is hidden when match state is `IN_PROGRESS` or `CONCLUDING`. A persistent in-match header with back navigation replaces the shell header. Navigation returns when the match concludes.
- **MPG-18 (MISSING - detachment label):** Each player's army section shows the detachment name below the army name (e.g., "Anvil Siege Force" under "Space Marines").
- **MPG-19 (MISSING - white icons):** All icons in match view use white fill on dark card backgrounds, aligned with the `3.4` theme tokens.
- **MPG-20 (MISSING - min 14px rules text):** Rules text and ability text have a minimum font size of 14px throughout the match view.
- **MPG-21 (MISSING - taller header):** Match header height is governed by the `--match-header-height` design token with sufficient space for match name, round indicator, and both player scores. No content crowding at any breakpoint.
- **MPG-22 (PARTIAL - header back nav + match name):** Header displays match name (left-aligned) and a back button navigating to War Ledger with the breadcrumb label "War Ledger."
- **MPG-24 (MISSING - sticky footer):** Sticky footer action bar at the bottom of the match view contains: (1) "End Turn / Advance Round" primary action; (2) CP increment/decrement shortcut; (3) "Score Secondary" shortcut opening the end-of-turn scoring prompt.
- **MPG-27 (MISSING - remove green dot):** Online presence dot indicator is not rendered on unit list items in match view.
- **MPG-33 (MISSING - scroll isolation):** The main unit list area uses `overflow-y: auto` and scrolls independently from the sticky header and the right rail. The header and rail use `overflow: hidden`. Prevents accidental window scroll on desktop.

**Gap Fixes - HP and Scoring:**

- **MPG-23 (PARTIAL - three HP input methods):** HP tracking on model cards supports three simultaneous input methods: (1) increment/decrement buttons (+/-); (2) a tappable text field that opens a numeric keyboard for direct entry; (3) a draggable bar slider clamped to the wound characteristic. All three are always visible. Dispatched via `MatchStream.sendMatchUpdate()`.
- **MPG-25 (MISSING - "Available Stratagems" label):** The stratagem reference section is labeled "Available Stratagems," not "Available Actions."
- **MPG-26 (PARTIAL - CP readout):** CP counter has adequate horizontal spacing - minimum 64px wide - with the current value prominently displayed between the +/- buttons.
- **MPG-28 (MISSING - stratagem closes drawers):** Tapping any stratagem in the match view closes any currently open unit detail drawer before displaying the stratagem detail. Implemented via the drawer stacking system (GLB-11).
- **MPG-29 (MISSING - weapon count in list item):** Each unit list item shows a count of equipped weapons alongside HP (e.g., "3 ranged / 2 melee"). Sourced from `UnitProjection.weapons`.
- **MPG-34 (MISSING - end-of-turn secondary prompt):** Before advancing the round counter, a prompt is shown asking the player to score their secondary mission. Includes VP entry fields for both players. Can be dismissed and entered retroactively. Prompt fires when the "Advance Round" action is tapped.
- **ULV-06 (MAPPED - destroyed units section):** Units where all `UnitProjection.modelWounds` are 0 are moved to a "Destroyed" section at the bottom of the unit list. Updates in real time.

**Gap Fixes - Scoring and UX:**

- **MPG-07:** Primary mission VP tracked per round up to 50VP total. Displayed in the header.
- **MPG-08:** Secondary mission VP tracked per player (Fixed and Tactical), up to 40VP total.
- **MPG-09:** Gambit/challenger VP entry field, capped at 12VP. Stored in `MissionConfig.gambitByPlayerId`.
- **MPG-32 (MAPPED - right rail dimensions):** Right rail/bottom sheet has two tabs: "Secondary Missions" and "Mission Rules." Collapsed width on desktop: 48px. Collapsed height on mobile: 48px. When expanded, mission cards render two side-by-side in a playing-card layout. Same component used in Guided mode.
- **MB-22:** Secondary missions right-rail tab - 48px collapsed, card deck layout. Two cards side-by-side. The final card layout for the Right Rail - Secondary Missions tab will be refined as the mockup becomes available.
- **MB-23:** Mission rules tab - same card layout as MB-22. The final card layout for the Right Rail - Mission Rules tab will be refined as the mockup becomes available.

---

### 6.5 Active Match - Guided Mode

**Route:** `/[gameSystem]/matches/[matchId]?mode=guided`
**Complexity:** XL | **Effort:** 10 days

**Stories:** MPG-37, MPG-38, MPG-39, MPG-40, MPG-41, MPG-42, ULV-07, ULV-08, ULV-09, ULV-10

**UX Issues:** MG-01 through MG-11

**Phase Sequence (WH40K 10e, plugin-provided):**

```
Command → Movement → Shooting → Charge → Fight → [End of Round]
```

Each phase transition is confirmed explicitly: "End Command Phase" advances to Movement, and so on.

**Constraint D in Guided Mode:**
Unit list items show only the state tags and wargear columns relevant to the current phase:

- Command: Battle-shock, CP spending, stratagems.
- Movement: movement value, Advance/Fall Back toggles.
- Shooting: ranged weapons, target eligibility.
- Charge: charge distance, eligible units.
- Fight: melee weapons, pile-in, consolidate.

All other tags and wargear are collapsed (not hidden - accessible via unit detail drawer).

**Header Sharing (MPG-38):** Basic and Guided modes share one header component. The header receives `mode` and `currentPhase` as props. Only the phase indicator changes between modes; match name, round, scores, back nav, and Basic/Guided toggle are identical in both.

**Gap Fixes:**

- **MPG-37 (MISSING - CP directly editable):** CP readout in guided mode is an inline editable text field. Tap opens a numeric keyboard for direct entry. Still shows +/- buttons. Dispatched via `MatchStream.sendMatchUpdate()`.
- **MPG-39 (PARTIAL - HP bars always visible):** Model HP bars are rendered on model cards regardless of the current phase. Three input methods: +/- buttons, inline text field, draggable bar (same as Basic mode).
- **MPG-41 (PARTIAL - auto-issue Tactical secondaries):** At the start of the Command phase, if the player's secondary mode is Tactical, the system issues a Tactical secondary mission card from the remaining deck with a toast notification. Auto-issue fires once per round only.
- **MPG-42 (MISSING - weapon font and count in guided mode):** Weapon profile text has a minimum font size of 14px. Weapon count shown alongside weapon name in list items and the unit detail drawer.
- **MG-01:** Guided unit detail drawer is identical to Basic mode. Constraint E enforced: same match mode configuration.
- **MG-02:** Mockups are available as design reference for all five guided phase layouts. Implementation proceeds using the layout constraints defined in Constraint D.
- **MG-08:** Responsive breakpoint ≤1024px must work. Same requirements as MB-11.
- **MG-09:** Secondary missions right rail is the same shared component as in Basic mode (MPG-32). Not duplicated.
- **ULV-10 (PARTIAL - opponent status bar):** A persistent opponent status bar appears at the top of the opponent column (desktop) or on the Opponent tab header (mobile). Shows: opponent display name, VP, CP, whose turn, current round and phase. Updates via `MatchStream` observables.

---

### 6.5a Match Conclusion + Summary

**Route:** Part of `/[gameSystem]/matches/[matchId]` (states: `CONCLUDING`, `COMPLETED`)
**Complexity:** L | **Effort:** 4 days

**Stories:** MPG-10, MPG-36, MPG-02

**Implementation Notes:**

- "End Match" action with a confirmation dialog before transitioning to `CONCLUDING`.
- Final VP comparison shown side-by-side. Both players must confirm totals; discrepancies block finalization. If opponent is offline, reconciliation is deferred until both sides confirm.
- Result (win/loss/draw) stored on the match record. Optional share action for Discord/external apps.
- On both-players-confirmed: match transitions to `COMPLETED`, navigates to read-only summary.

**Gap Fixes:**

- **MPG-02 (PARTIAL):** Match summary shows per-round scoring in a vertically stacked table: primary VP per round (rows) per player (columns). Secondary VP in a separate collapsible section. No horizontal scroll; column count is always 2, rows expand per round. Max rounds: Incursion = 4, Strike Force = 5, Onslaught = 5.
- **MPG-36 (MAPPED):** On `COMPLETED`, Match Page renders in Past mode, read-only.
- **MPG-10 (MAPPED):** "End Match" in the sticky footer initiates the conclusion flow.
- **MB-27:** Match summary read-only view. Placeholder conclusion screen ships at Week 12; the final UI layout will be refined when the Match Summary mockup is available.

---

### 6.6 Command Post (Stratagems)

**Route:** `/[gameSystem]/matches/[matchId]/command-post`
**Complexity:** L | **Effort:** 5 days

**Stories:** MPG-25, MPG-28

**Implementation Notes:**

- Accessed from within an active match: full-screen on mobile, side panel on desktop.
- Mission briefing: full mission rules, primary/secondary objectives, deployment map.
- Stratagem reference: searchable, filterable by current game phase. Labels use "Available Stratagems" per MPG-25.
- Game log: chronological record of state changes, score updates, phase transitions.
- Tapping a stratagem closes any open unit drawers before displaying the detail (MPG-28).
- Army overview at-a-glance with key stats for both players. Shareable spectator link.

---

## Story Coverage Matrix

| Story ID | Description                                     | Page    | Status  | Notes                                                                        |
| -------- | ----------------------------------------------- | ------- | ------- | ---------------------------------------------------------------------------- |
| MCD-01   | Create match from Army page, pre-selected army  | 6.2     | PARTIAL | Gap fixed: army selector step skipped when `armyId` in context               |
| MCD-02   | Select opponents, configure settings            | 6.2     | MAPPED  |                                                                              |
| MCD-03   | Select mission and deployment zone              | 6.2     | MAPPED  |                                                                              |
| MCD-04   | Configure secondary missions                    | 6.2     | PARTIAL | Described in step 4 of drawer flow                                           |
| MCD-05   | Set gambit cards                                | 6.2     | MISSING | Gap fixed: step 5, toggle group with VP cap                                  |
| MCD-08   | Invite friends, online friends prioritized      | 6.2     | PARTIAL | Gap fixed: sort online friends to top, push notification sent                |
| MCD-09   | Generate join code and QR code                  | 6.2a    | MAPPED  |                                                                              |
| MCD-10   | Optional match time/date field                  | 6.2     | MISSING | Gap fixed: optional `scheduledAt` date-time picker                           |
| MCD-11   | Multi-select opponents, removable chips         | 6.2     | PARTIAL | Gap fixed: multi-select with chip list above friends list                    |
| MCD-12   | Friends list + code side-by-side                | 6.2a    | MISSING | Gap fixed: linking screen layout, desktop split / mobile stacked             |
| MJN-01   | Accept or decline a match invite                | 6.2a    | MAPPED  |                                                                              |
| MJN-02   | Join a match by entering a code                 | 6.2a    | MAPPED  |                                                                              |
| MJN-03   | Join a match by scanning a QR code              | 6.2a    | MAPPED  | Mobile-only, camera permission gated                                         |
| MPG-01   | View match list                                 | 6.1     | MAPPED  |                                                                              |
| MPG-02   | View match score breakdown, no horiz scroll     | 6.5a    | PARTIAL | Gap fixed: vertically stacked per-round table                                |
| MPG-03   | Delete a match                                  | 6.1     | MISSING | Gap fixed: swipe/context menu with confirmation, state guard                 |
| MPG-04   | View match setup summary                        | 6.3     | MAPPED  |                                                                              |
| MPG-05   | Start a match (→ `IN_PROGRESS`)                 | 6.3     | MAPPED  |                                                                              |
| MPG-06   | Advance game phase                              | 6.4/6.5 | MAPPED  |                                                                              |
| MPG-07   | Track primary mission scoring                   | 6.4     | MAPPED  |                                                                              |
| MPG-08   | Track secondary mission scoring                 | 6.4     | MAPPED  |                                                                              |
| MPG-09   | Record gambit VP                                | 6.4     | MAPPED  |                                                                              |
| MPG-10   | End a match                                     | 6.5a    | MAPPED  |                                                                              |
| MPG-11   | Configure match settings before play            | 6.3     | MAPPED  |                                                                              |
| MPG-12   | Designate deep strike / reserves (50% cap)      | 6.3     | PARTIAL | Gap fixed: running count, toggle blocked at cap                              |
| MPG-13   | Subscribe to real-time match updates            | 6.4     | MAPPED  | Via `MatchStream`                                                            |
| MPG-14   | Mark unit deployment positions                  | 6.3     | PARTIAL | Gap fixed: Deployed toggle per unit in Deployment phase                      |
| MPG-15   | Persistent phase and turn progress indicator    | 6.4/6.5 | MAPPED  |                                                                              |
| MPG-16   | Re-enter in-progress match from War Ledger      | 6.1     | MAPPED  |                                                                              |
| MPG-17   | Hide primary nav during active match            | 6.4     | MISSING | Gap fixed: nav hidden in `IN_PROGRESS`/`CONCLUDING` states                   |
| MPG-18   | Detachment label in basic match view            | 6.4     | MISSING | Gap fixed: shown below army name                                             |
| MPG-19   | White icons on dark backgrounds                 | 6.4     | MISSING | Gap fixed: per theme tokens §3.4                                             |
| MPG-20   | Larger rules text (min 14px)                    | 6.4     | MISSING | Gap fixed: min 14px font size requirement                                    |
| MPG-21   | Taller match view header                        | 6.4     | MISSING | Gap fixed: `--match-header-height` token                                     |
| MPG-22   | Match name and back button in header            | 6.4     | PARTIAL | Gap fixed: "War Ledger" breadcrumb in back nav                               |
| MPG-23   | HP tracking - three input methods               | 6.4     | PARTIAL | Gap fixed: buttons + text field + draggable bar                              |
| MPG-24   | Sticky footer action bar                        | 6.4     | MISSING | Gap fixed: three actions in sticky footer                                    |
| MPG-25   | "Available Stratagems" label                    | 6.6     | MISSING | Gap fixed: correct label in 6.4 and 6.6                                      |
| MPG-26   | CP readout with adequate spacing                | 6.4     | PARTIAL | Gap fixed: min 64px width, value prominent                                   |
| MPG-27   | Remove green dot indicator                      | 6.4     | MISSING | Gap fixed: dot not rendered in match view                                    |
| MPG-28   | Stratagem click closes unit drawers             | 6.4/6.6 | MISSING | Gap fixed: via drawer stacking system                                        |
| MPG-29   | Weapon count in unit list item                  | 6.4     | MISSING | Gap fixed: "3 ranged / 2 melee" in list item                                 |
| MPG-30   | Match setup phase zero-state UI                 | 6.3     | PARTIAL | Gap fixed: four sections with zero-state illustrations                       |
| MPG-31   | Distinct deployment phase before Turn 1         | 6.3     | PARTIAL | Gap fixed: Deployed toggle per unit, layout refined when mockup is available |
| MPG-32   | Secondary missions right-rail drawer            | 6.4/6.5 | MAPPED  | 48px collapsed, two cards side-by-side                                       |
| MPG-33   | Main content scroll isolation                   | 6.4     | MISSING | Gap fixed: `overflow-y: auto` scoped to unit list                            |
| MPG-34   | End-of-turn secondary prompt before advancing   | 6.4     | MISSING | Gap fixed: prompt on "Advance Round" tap                                     |
| MPG-35   | Full match flow sequence                        | 6.3-6.5 | MAPPED  | State machine defined in this document                                       |
| MPG-36   | Completed match → summary view                  | 6.5a    | MAPPED  |                                                                              |
| MPG-37   | Guided mode CP directly editable                | 6.5     | MISSING | Gap fixed: inline text field + numeric keyboard                              |
| MPG-38   | Shared header between modes                     | 6.4/6.5 | MISSING | Gap fixed: one component, `mode` + `currentPhase` props                      |
| MPG-39   | HP bars on model cards in guided mode           | 6.5     | PARTIAL | Gap fixed: always visible, three input methods                               |
| MPG-40   | Guided mode unit list - phase-relevant only     | 6.5     | MAPPED  |                                                                              |
| MPG-41   | Guided mode auto-issue Tactical secondaries     | 6.5     | PARTIAL | Gap fixed: auto-issue once per round in Command phase                        |
| MPG-42   | Larger weapon font and count in guided mode     | 6.5     | MISSING | Gap fixed: min 14px, weapon count shown                                      |
| ULV-05   | View active player's units in basic match       | 6.4     | MAPPED  |                                                                              |
| ULV-06   | Destroyed units in separate section             | 6.4     | MAPPED  |                                                                              |
| ULV-07   | Filter unit list by phase in guided mode        | 6.5     | MAPPED  |                                                                              |
| ULV-08   | CP tracking in guided mode                      | 6.5     | MAPPED  |                                                                              |
| ULV-09   | Switch between guided and basic modes           | 6.4/6.5 | MAPPED  | Preserves all state                                                          |
| ULV-10   | Opponent status bar (name, VP, CP, turn, phase) | 6.4/6.5 | PARTIAL | Gap fixed: persistent status bar in opponent column                          |

---

## UX Issue Resolution Matrix

| Issue ID | Description                                                 | Severity | Decision    | Page                   |
| -------- | ----------------------------------------------------------- | -------- | ----------- | ---------------------- |
| MB-01    | "Detachment" label in Basic Match view                      | 🟡       | INCORPORATE | 6.4                    |
| MB-02    | White icons on dark backgrounds                             | 🟡       | INCORPORATE | 6.4                    |
| MB-03    | Rules text min 14px                                         | 🟡       | INCORPORATE | 6.4                    |
| MB-04    | Unit detail drawer closeable from match                     | 🔴       | INCORPORATE | 6.4, SHARED_COMPONENTS |
| MB-05    | Drawer ~200px wider in match context                        | 🔴       | INCORPORATE | 6.4, SHARED_COMPONENTS |
| MB-06    | Match view header taller                                    | 🟡       | INCORPORATE | 6.4                    |
| MB-07    | Match header: match name + back button                      | 🟡       | INCORPORATE | 6.4                    |
| MB-08    | Breadcrumb: War Ledger → Match Name                         | 🟡       | INCORPORATE | 6.4                    |
| MB-09    | Basic/Guided toggle in header; state preserved              | 🔴       | INCORPORATE | 6.4, 6.5               |
| MB-10    | HP tracking: three input methods                            | 🔴       | INCORPORATE | 6.4, SHARED_COMPONENTS |
| MB-11    | Responsive breakpoint ≤1024px failure                       | 🔴       | INCORPORATE | 6.4                    |
| MB-12    | Sticky footer action bar                                    | 🟡       | INCORPORATE | 6.4                    |
| MB-13    | Label: "Available Stratagems" not "Available Actions"       | 🟡       | INCORPORATE | 6.4, 6.6               |
| MB-14    | CP readout needs more space                                 | 🟡       | INCORPORATE | 6.4                    |
| MB-15    | Remove green dot indicator                                  | 🟡       | INCORPORATE | 6.4                    |
| MB-16    | Stratagem click closes unit drawers                         | 🟡       | INCORPORATE | 6.4, 6.6               |
| MB-17    | Unit list: model/wargear summary, HP, all state tags        | 🔴       | INCORPORATE | 6.4                    |
| MB-18    | Unit action states trackable per unit                       | 🔴       | INCORPORATE | 6.4                    |
| MB-19    | Weapon count in unit list item                              | 🟡       | INCORPORATE | 6.4                    |
| MB-20    | Setup phase UI: deep strike, reserves, mission, secondaries | 🔴       | INCORPORATE | 6.3                    |
| MB-21    | Deployment phase: distinct UI before Turn 1                 | 🔴       | INCORPORATE | 6.3                    |
| MB-22    | Secondary missions right-rail tab (48px, card deck)         | 🔴       | INCORPORATE | 6.4                    |
| MB-23    | Mission rules second right-rail tab                         | 🔴       | INCORPORATE | 6.4                    |
| MB-24    | Main content scrolls independently from header/rail         | 🟡       | INCORPORATE | 6.4                    |
| MB-25    | End-of-turn: prompt before next turn                        | 🟡       | INCORPORATE | 6.4                    |
| MB-26    | Full match flow state machine                               | 🔴       | INCORPORATE | 6.2–6.5                |
| MB-27    | Completed match → Match Summary read-only                   | 🔴       | INCORPORATE | 6.5a                   |
| MG-01    | Guided unit detail identical to Basic (Constraint E)        | 🔴       | INCORPORATE | 6.5                    |
| MG-02    | Mockups required for all 5 guided phases                    | 🔴       | INCORPORATE | 6.5                    |
| MG-03    | CP directly editable in guided mode                         | 🟡       | INCORPORATE | 6.5                    |
| MG-04    | Guided header same as Basic; no separate component          | 🟡       | INCORPORATE | 6.4, 6.5               |
| MG-05    | Model cards in guided mode show HP bars                     | 🔴       | INCORPORATE | 6.5                    |
| MG-06    | Guided unit list: phase-relevant only (Constraint D)        | 🔴       | INCORPORATE | 6.5                    |
| MG-07    | Weapon font larger than mocked; weapon count shown          | 🟡       | INCORPORATE | 6.5                    |
| MG-08    | Responsive breakpoint ≤1024px in guided mode                | 🔴       | INCORPORATE | 6.5                    |
| MG-09    | Secondary missions rail shared with Basic mode              | 🔴       | INCORPORATE | 6.5                    |
| MG-10    | Auto-issue secondaries in Command phase                     | 🟡       | INCORPORATE | 6.5                    |
| MG-11    | End-of-turn secondary prompt same as MB-25                  | 🟡       | INCORPORATE | 6.5                    |
| MC-01    | Army selector omitted when opened from "Deploy"             | 🔴       | INCORPORATE | 6.2                    |
| MC-02    | Match time/date field optional                              | 🟡       | INCORPORATE | 6.2                    |
| MC-03    | Opponents field: multi-select from friends list             | 🟡       | INCORPORATE | 6.2                    |
| MC-04    | Friends list + barcode/match ID side-by-side                | 🟡       | INCORPORATE | 6.2a                   |
| G-06     | No trademark violations; all imagery must be AI-generated   | 🔴       | INCORPORATE | Global                 |

---

## Mockup Dependencies

> **Consolidated registry**: The full cross-phase mockup dependency registry is maintained in [PHASE_0_SHARED_PREREQUISITES.md §5](PHASE_0_SHARED_PREREQUISITES.md#5-mockup-delivery-registry). The table below covers Phase 3-specific impact and timeline details.

| Mockup                           | Affected Stories      | Affected Section | Refines                                                                                   | Timeline                                                                                      |
| -------------------------------- | --------------------- | ---------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Match Setup Phase                | MB-20, MB-26, MPG-30  | §6.3 Match Page  | Setup phase UI with deep strike, reserves, mission cards, and secondary selection         | Phase 3 Weeks 8-10; ship placeholder, refine with mockup before Week 10                       |
| Match Deployment Phase           | MB-21, MB-26, MPG-31  | §6.3 Match Page  | Deployment phase UI before Turn 1; per-unit Deployed toggle                               | Phase 3 Weeks 8-10; design alongside Setup Phase in same session                              |
| Right Rail - Secondary Missions  | MB-22, MG-09, MPG-32  | §6.4, §6.5       | 48px collapsed right rail with two-card playing-card layout; shared Basic/Guided          | Phase 3 Weeks 8-13; final tab content refined in both Basic and Guided mode                   |
| Right Rail - Mission Rules       | MB-23, MPG-32         | §6.4, §6.5       | Second right-rail tab with same card layout; design in same session as Secondary Missions | Phase 3 Weeks 8-13; tab 2 content refined when mockup is available                            |
| Guided Mode - All 5 Phases       | MG-02, MG-06, MPG-40  | §6.5             | Phase-specific unit list layouts (Constraint D); five distinct phase layouts              | Phase 3 Weeks 11-13; Basic mode ships independently in Weeks 8-10                             |
| Match Summary (Past / Read-Only) | MB-27, MPG-36, MPG-02 | §6.5a            | Match finalization and read-only summary view                                             | Phase 3 Weeks 12-13; ship placeholder conclusion screen; final view refined when mockup lands |

---

## Match Sync Architecture

> **Canonical contract**: The `MatchStream` reactive facade is defined in `src/shared/streams/src/matches/MatchStream.ts`. It wraps the `MatchesRealtimeClient` WebSocket transport from `@armoury/clients-matches`. This section describes the architecture and how Phase 3 UI consumes it.

**Conflict C-02 resolution**: All match state sync flows through `MatchStream`. The WebSocket transport is handled by `MatchesRealtimeClient`; the `MatchStream` facade maintains a reactive cache of match state as a `BehaviorSubject<ReadonlyMap<string, Match>>`. UI components subscribe to observables and never manage transport concerns directly.

```typescript
// @armoury/clients-matches — WebSocket transport
export class MatchesRealtimeClient implements IMatchesRealtimeClient {
    readonly messages$: Observable<MatchesServerMessage>;
    readonly connectionState$: Observable<ConnectionState>;
    connect(): void;
    disconnect(): void;
    subscribeMatch(matchId: string): void;
    unsubscribeMatch(matchId: string): void;
    sendMatchUpdate(matchId: string, data: UpdateMatchFields): void;
    dispose(): void;
}

// @armoury/streams — Reactive cache facade
export class MatchStream implements IMatchStream {
    readonly matches$: Observable<ReadonlyMap<string, Match>>;
    readonly connectionState$: Observable<ConnectionState>;
    match$(matchId: string): Observable<Match | undefined>;
    subscribeMatch(matchId: string): void;
    unsubscribeMatch(matchId: string): void;
    sendMatchUpdate(matchId: string, data: UpdateMatchFields): void;
    dispose(): void;
}
```

## The active `MatchStream` instance is provided via React context on the match page root. All child components (unit list, scoring panel, right rail) consume via `useMatchSync()` hook.

## State Management for Phase 3

Phase 3 is the most state-intensive phase — it introduces real-time reactive state (Tier 4) alongside extensive React Query usage and complex local UI state. The `MatchStream` pattern is the architectural centerpiece. See [State Management Architecture](./STATE_MANAGEMENT.md) for the complete decision tree.

### Tier 1: Local UI State (`useState`)

| Entity                                | Component(s)                            | Notes                                                             |
| ------------------------------------- | --------------------------------------- | ----------------------------------------------------------------- |
| Match creation drawer open/close      | `MatchCreationDrawer`                   | Opened from War Ledger, Forge, or Campaign Dashboard (C-07)       |
| Match creation step (multi-step form) | `MatchCreationDrawer`                   | Tracks current step in creation flow                              |
| Army selector selection               | `ArmySelector` (within creation drawer) | Conditionally omitted when `armyId` is pre-set (campaign context) |
| Gambit card selections                | `GambitCardPicker`                      | Local until match is created                                      |
| Basic/Guided mode toggle              | `MatchModeSwitch`                       | Preserved on toggle — no state loss                               |
| Unit detail drawer open/close         | `UnitDetailDrawer` (match mode)         | Shows HP bar, status flags, kill counter in match context         |
| Right rail / bottom sheet collapsed   | `MatchRightRail`                        | Collapses to 48px; toggles open/closed                            |
| HP input method (buttons/text/drag)   | `HPControl`                             | Three input methods; local preference                             |
| Command Post stratagem drawer         | `CommandPost`                           | Taps close open unit drawers                                      |

### Tier 2: URL State

| Entity                     | Route/Params                                   | Stories            |
| -------------------------- | ---------------------------------------------- | ------------------ |
| Match ID                   | `/[gameSystem]/matches/[matchId]` path segment | US-MP-01           |
| Match mode (basic/guided)  | `?mode=basic` or `?mode=guided`                | US-BM-01, US-GM-01 |
| Selected unit in match     | `?unitId=<id>`                                 | US-BM-03           |
| Active phase (guided mode) | `?phase=movement`                              | US-GM-02           |

### Tier 3: Remote State (React Query)

| Entity                                       | Query Key Factory              | Caching Strategy                                           | Stories                     |
| -------------------------------------------- | ------------------------------ | ---------------------------------------------------------- | --------------------------- |
| Match list (War Ledger)                      | `matchListOptions(userId)`     | `staleTime: 60_000`; active matches pinned to top          | US-WL-01, US-WL-02          |
| Match metadata (armies, mission, deployment) | `matchDetailOptions(matchId)`  | Initial load; bridged from RxJS after connect (see Tier 4) | US-MP-01                    |
| Match creation mutation                      | `createMatchMutation`          | Invalidates `matchListOptions` on success                  | US-MCD-01 through US-MCD-05 |
| Match deletion mutation                      | `deleteMatchMutation`          | State guard: only deletable in certain states              | US-WL-03                    |
| Mission / deployment data                    | `missionOptions(gameSystem)`   | `staleTime: Infinity` — reference data                     | US-MCD-03                   |
| Match conclusion / VP summary                | `matchSummaryOptions(matchId)` | `staleTime: Infinity` — immutable after conclusion         | US-MC-01                    |

### Tier 4: Reactive Global State (RxJS)

This is the primary phase for introducing RxJS state. All real-time match data flows through `MatchStream` observables.

| Entity                                   | Observable Source                       | Transport                           | Stories            |
| ---------------------------------------- | --------------------------------------- | ----------------------------------- | ------------------ |
| `Match` state (HP, CP, VP, phase, round) | `MatchStream.matches$`                  | WebSocket via MatchesRealtimeClient | US-BM-01, US-GM-01 |
| `Match` per-unit detail                  | `MatchStream.match$(matchId)`           | WebSocket via MatchesRealtimeClient | US-BM-03, US-BM-04 |
| Player presence (online/offline)         | `PresenceStream` via `@armoury/streams` | WebSocket/polling                   | US-MP-02           |
| Match phase transitions                  | Derived from `matchState$`              | `distinctUntilKeyChanged('phase')`  | US-GM-02           |

**Architecture pattern:** The `MatchStream` provides observables that are bridged into the React Query cache via `useMatchSync()` and `usePresenceSync()` hooks mounted at the match layout level. Components in the match subtree read from React Query cache via `useQuery` as normal — they are unaware of the RxJS layer. See [RXJS_STATE.md](../RXJS_STATE.md) for the full pattern.

```
┌─────────────────────────────────┐
│  MatchStream (RxJS cache facade)│
│  matches$    ──┐                │
│  match$(id)  ──┤                │
│  presence$  ───┤                │
└────────────────┤────────────────┘
                 │ useSyncExternalStore / setQueryData bridge
                 ▼
┌─────────────────────────────────┐
│  React Query Cache              │
│  ['matches', matchId, 'state']  │
│  ['matches', matchId, 'units']  │
│  ['matches', matchId, 'presence']│
└─────────────────────────────────┘
                 │ useQuery (standard)
                 ▼
┌─────────────────────────────────┐
│  UI Components                  │
│  UnitList, ScoringPanel,        │
│  RightRail, HPControl           │
└─────────────────────────────────┘
```

### Derived State Patterns

| Entity                                 | Derived From                                | Notes                                       |
| -------------------------------------- | ------------------------------------------- | ------------------------------------------- |
| Phase-filtered unit list (guided mode) | `unitStates$` + current phase               | Only units eligible for current phase shown |
| Total army HP remaining                | `unitStates$` → sum of remaining wounds     | Header display                              |
| CP available this phase                | `matchState$` → CP tracking per round/phase | Auto-incremented in Command phase           |
| VP delta (scoring panel)               | `matchState$` → primary + secondary VP      | Computed per round                          |
| Match state machine validity           | Current state + available transitions       | Determines which actions are enabled        |

See [Derived State Patterns](../DERIVED_STATE.md) for implementation guidance.

### Cross-References

- [State Management Architecture](./STATE_MANAGEMENT.md) — Complete state hierarchy and decision tree
- [§6 React Query](../REACT_QUERY.md) — Server state caching, mutations, optimistic updates
- [§7 RxJS](../RXJS_STATE.md) — Reactive global state, observables, subscriptions, `MatchStream` pattern
- [§9 Derived State](../DERIVED_STATE.md) — Computed state patterns, memoization
- [§11 Testing](../STATE_TESTING.md) — Testing each state tier (especially RxJS stream testing)

---

## Acceptance Criteria

- [ ] War Ledger: active matches pinned to top; match deletion with state guard.
- [ ] Match Creation Drawer opens from all three entry points; army selector conditionally omitted; gambit cards, optional date, multi-select opponents all functional.
- [ ] Linking screen: join code/QR and friends list side-by-side (desktop) / stacked (mobile).
- [ ] Match state machine transitions correctly through all eight states.
- [ ] Setup phase: four sections with 50% reserve cap. Deployment phase: per-unit toggle, both players confirm.
- [ ] Basic mode: all 27 UX issues resolved; unit list shows all state tags, detachment label, weapon count, total HP; sticky header/footer, scroll isolation, hidden nav all functional at <=1024px.
- [ ] All three HP input methods (+/- buttons, text field, draggable bar) work on mobile and desktop.
- [ ] Right rail/bottom sheet collapses to 48px. Secondary Missions and Mission Rules tabs functional; layout refined as mockups become available.
- [ ] Guided mode: phase-specific unit list (Constraint D), HP bars always visible, CP directly editable, auto-issue Tactical secondaries in Command phase;
      Basic/Guided share one header, mode switch preserves all state.
- [ ] `MatchStream` wired to all match state consumers; no direct `setTimeout`/`setInterval` in UI components.
- [ ] Completed match transitions to read-only summary; per-round VP breakdown with no horizontal scroll on mobile. Command Post: "Available Stratagems" label; stratagem taps close open unit drawers.
- [ ] All 6 mockup dependencies tracked; placeholder UIs ship at the correct weeks with final layouts refined as mockups become available.

## Acceptance Test Checklist

> These tests verify Phase 3 is complete. Each item maps to a specific acceptance criterion or component defined above.

### End-to-End Acceptance Tests

- [ ] War Ledger at `/[gameSystem]/matches` pins IN_PROGRESS matches to the top of the list; CREATED matches show Delete; IN_PROGRESS matches show Resume.
- [ ] Deleting a CREATED match removes it from `WarLedgerView`; attempting to delete an IN_PROGRESS match is blocked by the state guard.
- [ ] Match Creation Drawer opens from the War Ledger empty-state CTA, the army detail Deploy button, and the Campaign Matches page; army selector step is absent when opened from army detail.
- [ ] Match Linking screen renders join code, QR code, and friends list side-by-side on desktop (>=1024px) and stacked on mobile.
- [ ] Match Setup phase enforces the 50% reserve cap; submitting both players' confirmations in the Deployment phase advances the state machine to IN_PROGRESS.
- [ ] Basic mode displays all 27 UX issue fixes: sticky header/footer, hidden nav at <=1024px, scroll isolation, and all unit state tags visible.
- [ ] All three HP input methods (+/- buttons, text field, draggable bar) update the unit's HP value consistently on both mobile and desktop.
- [ ] Guided mode displays HP bars always, supports direct CP editing, and auto-issues Tactical secondaries in the Command phase.

### Component Tests (Orchestrational)

- [ ] `WarLedgerContainer` fetches via `matchListOptions`, passes sorted match data with pinned IN_PROGRESS entries to `WarLedgerView`, and owns delete mutation dispatch.
- [ ] `MatchCreationDrawer` conditionally omits the army selector step when `context.armyId` is pre-supplied; renders gambit card selection and optional date picker in all contexts.
- [ ] `MatchPageContainer` enforces state machine transition rules: Resume is only rendered for SETUP, DEPLOYMENT, and IN_PROGRESS states; it does not render for CREATED or COMPLETED.
- [ ] `BasicMatchContainer` renders the right rail collapsed to 48px on mobile and expands on tap; Secondary Missions and Mission Rules tabs are independently functional.
- [ ] `GuidedMatchContainer` subscribes to `MatchStream` for live state updates and does not use `setTimeout` or `setInterval` for any state transition.

### Hook / Query Tests

- [ ] `matchListOptions` query returns matches sorted with IN_PROGRESS first; re-fetches after `createMatchMutation` success.
- [ ] `matchDetailOptions` returns the full match shape including per-round VP breakdown and all unit statuses.
- [ ] `createMatchMutation` on success transitions the match to CREATED state, navigates to the linking screen, and invalidates `matchListOptions`.
- [ ] `MatchStream` (RxJS observable) emits state updates to all `MatchPageContainer` subscribers; unsubscribes cleanly on component unmount.

### Accessibility Tests

- [ ] HP draggable bar is operable via keyboard (arrow keys increment/decrement by 1); `aria-valuenow`, `aria-valuemin`, and `aria-valuemax` are always in sync with displayed value.
- [ ] Match Creation Drawer traps focus while open; Tab cycles through all interactive controls; closing via Escape returns focus to the triggering element.
- [ ] Guided mode phase navigation controls have `aria-label` text that identifies the phase name; active phase is indicated with `aria-current="step"`.

---

## Code Example: Orchestrational / Render Pattern

> This example demonstrates the mandatory container/view split for Phase 3.
> The orchestrational container owns all data fetching, mutations, and state.
> The render component receives everything via props and contains zero hooks except `useCallback`/`useMemo`.

```tsx
// File: src/web/app/[gameSystem]/matches/[matchId]/basic/page.tsx

import { useSuspenseQuery } from '@tanstack/react-query';
import { useCallback, useState, useMemo } from 'react';
import type { Match } from '@shared/models/MatchModel.js';
import type { Unit } from '@wh40k10e/types/entities.js';
import { matchDetailOptions } from '@shared/frontend/queries/matches.js';
import { useMatchSync } from '@web/hooks/useMatchSync.ts';

// ---------------------------------------------------------------------------
// RxJS → React Query bridge: useMatchSync() subscribes to the MatchStream
// observable and writes incoming state diffs into the React Query cache for
// matchDetailOptions(matchId). Components read cache as usual.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Render component — pure props, zero data hooks
// ---------------------------------------------------------------------------

interface BasicMatchViewProps {
    match: Match;
    units: (Unit & { currentHP: number; maxHP: number })[];
    selectedUnitId: string | null;
    rightRailExpanded: boolean;
    onUpdateHP: (unitId: string, hp: number) => void;
    onSelectUnit: (unitId: string) => void;
    onToggleRail: () => void;
}

export function BasicMatchView({
    match,
    units,
    selectedUnitId,
    rightRailExpanded,
    onUpdateHP,
    onSelectUnit,
    onToggleRail,
}: BasicMatchViewProps) {
    return (
        <div className="flex h-full">
            <section aria-label="Unit List" className="flex-1 overflow-y-auto">
                <ul>
                    {units.map((unit) => (
                        <UnitRow
                            key={unit.id}
                            unit={unit}
                            isSelected={unit.id === selectedUnitId}
                            onSelect={() => onSelectUnit(unit.id)}
                            onUpdateHP={(hp) => onUpdateHP(unit.id, hp)}
                        />
                    ))}
                </ul>
            </section>
            <RightRail expanded={rightRailExpanded} onToggle={onToggleRail} />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Orchestrational container — data, live sync, derived state; no JSX
// ---------------------------------------------------------------------------

export function BasicMatchContainer({ matchId }: { matchId: string }) {
    const { data: match } = useSuspenseQuery(matchDetailOptions(matchId));
    useMatchSync(matchId); // RxJS → React Query cache bridge

    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
    const [rightRailExpanded, setRightRailExpanded] = useState(false);

    const units = useMemo(
        () =>
            match.players.flatMap((p) =>
                p.units.map((u) => ({
                    ...u,
                    currentHP: u.currentHP ?? u.maxHP,
                })),
            ),
        [match.players],
    );

    const handleUpdateHP = useCallback((unitId: string, hp: number) => {
        // Dispatches HP update via MatchStream (optimistic + server sync)
    }, []);

    return (
        <BasicMatchView
            match={match}
            units={units}
            selectedUnitId={selectedUnitId}
            rightRailExpanded={rightRailExpanded}
            onUpdateHP={handleUpdateHP}
            onSelectUnit={setSelectedUnitId}
            onToggleRail={() => setRightRailExpanded((prev) => !prev)}
        />
    );
}
```

---

## Component Architecture

### A. Component Inventory

Phase 3 spans eight distinct sections. Each section below lists its orchestrational container, its render components, and the responsibilities of each.

#### §6.1 War Ledger (Match List)

**Route:** `src/web/src/app/[gameSystem]/matches/page.tsx`

| Component             | Type            | Responsibility                                                                                                                                                               |
| --------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WarLedgerContainer`  | Orchestrational | Fetches match list via `matchListOptions`, owns filter/sort URL state, hands data to view.                                                                                   |
| `WarLedgerView`       | Render          | Receives `matches`, `isLoading`, `onDelete`, `onResume`. Renders card grid and empty state.                                                                                  |
| `MatchCard`           | Render          | Displays opponent display name, army names for both sides, formatted date, cumulative VP score, and a coloured `StatusBadge` reflecting match state.                         |
| `MatchCardActions`    | Render          | Conditionally shows Resume (for IN_PROGRESS or SETUP/DEPLOYMENT) and Delete (for CREATED/LINKED only). Guards both actions with state checks to prevent invalid transitions. |
| `WarLedgerEmptyState` | Render          | Shown when the list is empty. Contains a "Create Match" CTA that opens the Match Creation Drawer.                                                                            |

The page is server-prefetched: `matchListOptions({})` is called in the Server Component, dehydrated into `HydrationBoundary`, and the client reads from cache on first render with no loading flicker.

#### §6.2 Match Creation Drawer

No standalone route. The drawer is conditionally rendered at the War Ledger and Army Detail levels based on a creation context object passed via React context.

| Component                | Type            | Responsibility                                                                                                                                                |
| ------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MatchCreationDrawer`    | Orchestrational | Owns the 7-step linear flow. Reads the creation context object to determine whether to skip `ArmySelector` (C-07). Calls `createMatchMutation` on final step. |
| `ArmySelector`           | Render          | Army picker from the user's roster. Omitted entirely when `armyId` is already present in the context object.                                                  |
| `MatchSettingsForm`      | Render          | Point limit input and battle size selector (Incursion / Strike Force / Onslaught). Derived from army constraints.                                             |
| `MissionSelector`        | Render          | Chapter Approved missions sourced from the plugin. Paginated list; tapping a mission advances the step.                                                       |
| `SecondaryMissionConfig` | Render          | Per-player toggle: Fixed or Tactical. When Tactical is selected, exposes a 3-card pick interface for the scoring player.                                      |
| `GambitCardPicker`       | Render          | Challenger / Underdog role toggle. VP cap slider clamped to 1-12. Disabled when gambit is not in use.                                                         |
| `OpponentSelector`       | Render          | Multi-select list from the user's friends. Online friends float to the top of the list. Supports zero opponents (solo practice mode).                         |
| `SchedulePicker`         | Render          | Optional date/time selector. Submits `null` for `scheduledAt` when skipped.                                                                                   |

The drawer is reused in Phase 4 (§7.3 and §7.5) with a campaign context object injected instead of a plain match context. No structural changes needed at reuse time.

#### §6.2a Match Linking

**Route:** `/[gameSystem]/matches/[matchId]` when match state is `LINKING`

Rendered by `MatchPageContainer` (see §6.3) when it detects the LINKING state. Not a separate page.

| Component          | Type   | Responsibility                                                                                                                  |
| ------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `MatchLinkingView` | Render | Root layout for the linking step. Desktop: side-by-side join code panel and friends list. Mobile: stacked, join code on top.    |
| `JoinCodePanel`    | Render | Displays the 6-digit join code in large, copyable text. Renders a QR code via the shared QR utility. Includes a "Share" action. |
| `InviteStatusList` | Render | Renders each invited friend with a pending / accepted / declined chip. Accepted friends are promoted to the top.                |

#### §6.3 Match Page (Setup and Deployment)

**Route:** `src/web/src/app/[gameSystem]/matches/[matchId]/page.tsx`

| Component             | Type            | Responsibility                                                                                                                                                                                                                                    |
| --------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MatchPageContainer`  | Orchestrational | Reads match state from `matchDetailOptions`. Acts as a state-machine router: renders `MatchLinkingView`, `SetupPhaseView`, `DeploymentPhaseView`, `BasicMatchContainer`, `GuidedMatchContainer`, or `MatchConclusionView` based on current state. |
| `SetupPhaseView`      | Render          | Four collapsible sections: Strategic Reserves config, Deep Strike eligibility toggles, Mission Card display, Secondary Mission assignment. Enforces the 50% reserve cap in-UI.                                                                    |
| `DeploymentPhaseView` | Render          | "Not Yet Deployed" section lists all units. Each unit has a "Mark Deployed" toggle. Both players must confirm before the state advances to IN_PROGRESS.                                                                                           |
| `MatchSettingsLocked` | Render          | Read-only summary of game settings (points, battle size, mission, secondaries) shown at the top of Setup and Deployment views after those fields are finalized.                                                                                   |

#### §6.4 Active Match — Basic Mode

**Route:** `/[gameSystem]/matches/[matchId]?mode=basic`

| Component                  | Type            | Responsibility                                                                                                                                                                                                                                                                                 |
| -------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BasicMatchContainer`      | Orchestrational | Subscribes to `MatchStream` observables via `useMatchSync()`. Writes received values into React Query cache. Provides match mode configuration to the subtree via context.                                                                                                                     |
| `MatchHeader`              | Render          | Shared with Guided mode. Renders match name, current round, VP totals for both players, CP for the active player, a mode toggle (Basic / Guided), and back navigation. Sticky; height controlled by `--match-header-height` CSS custom property.                                               |
| `UnitListPanel`            | Render          | Left column on desktop; the primary tab on mobile. Renders the active player's unit list using `MatchUnitListItem`. Scrolls independently from header and footer (MPG-33).                                                                                                                     |
| `OpponentPanel`            | Render          | Right column on desktop; the "Opponent" tab on mobile. Same structure as `UnitListPanel` but reads from the opponent's unit states.                                                                                                                                                            |
| `MatchUnitListItem`        | Render          | Unit name, detachment label, weapon count summary ("3 ranged / 2 melee"), total HP bar, and ALL interactive state tags in Basic mode (Constraint D: no phase filtering). Tags include Battle-shocked, Engaged, Stunned, Objective, and any game-system-specific states provided by the plugin. |
| `HPControl`                | Render          | Shared with Guided mode. Three parallel input methods for wound tracking: +/- stepper buttons, direct numeric text field, and a draggable HP bar. All three stay in sync. Keyboard and touch accessible.                                                                                       |
| `MatchStickyFooter`        | Render          | Always visible at viewport bottom. Primary action: "End Turn" / "Advance Round" depending on whose turn it is. Shortcut buttons for CP adjustment and Secondary Mission scoring. Minimum 44px touch targets on all actions.                                                                    |
| `MatchRightRail`           | Render          | Shared with Guided mode. Collapses to 48px on both desktop and mobile. Two tabs: Secondary Missions (VP entry per secondary) and Mission Rules (static plugin-provided text). Renders as a side panel on desktop and a bottom sheet on mobile.                                                 |
| `DestroyedUnitsSection`    | Render          | Collapsible section below the active unit list. Contains all units whose total wounds have reached zero. Tapping a destroyed unit still opens its Unit Detail Drawer (Constraint C: read-only in match context).                                                                               |
| `EndOfTurnSecondaryPrompt` | Render          | Modal overlay triggered before round advancement. Prompts both players to enter secondary VP scored this turn before the round counter increments.                                                                                                                                             |

#### §6.5 Active Match — Guided Mode

**Route:** `/[gameSystem]/matches/[matchId]?mode=guided`

Guided mode shares `MatchHeader`, `HPControl`, `MatchStickyFooter`, and `MatchRightRail` with Basic mode unchanged. The following components are Guided-specific or behave differently:

| Component              | Type            | Responsibility                                                                                                                                                                                                                                                        |
| ---------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GuidedMatchContainer` | Orchestrational | Same sync architecture as `BasicMatchContainer`. Additionally owns `currentPhase` state (Command, Movement, Shooting, Charge, Fight) and filters the unit list accordingly (Constraint D). Writes `?phase=` to the URL for shareability.                              |
| `PhaseIndicator`       | Render          | Horizontal step indicator above the unit list. Five segments: Command, Movement, Shooting, Charge, Fight. Tapping a phase advances `currentPhase`. Active phase is visually highlighted.                                                                              |
| `GuidedUnitListItem`   | Render          | Renders the same unit fields as `MatchUnitListItem` but shows ONLY the state tags relevant to the current phase (Constraint D). Wargear columns are filtered to the weapons that fire or fight in the current phase.                                                  |
| `OpponentStatusBar`    | Render          | Persistent horizontal bar below `MatchHeader` (does not collapse). Shows opponent display name, opponent VP, opponent CP, whose turn it is, current round, and current phase. Always visible so the active player never loses context during their phase progression. |

#### §6.5a Match Conclusion and Summary

**Route:** `/[gameSystem]/matches/[matchId]` when match state is `CONCLUDING` or `COMPLETED`

Rendered by `MatchPageContainer` based on state. Not a separate route.

| Component             | Type   | Responsibility                                                                                                                                                                                                                                                          |
| --------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MatchConclusionView` | Render | Final VP comparison table. Both players must confirm the result before the match transitions to COMPLETED. Shows the delta clearly.                                                                                                                                     |
| `MatchSummaryView`    | Render | Read-only. Per-round VP breakdown rendered as a vertical table (no horizontal scroll on mobile). Secondary VP is collapsible per secondary objective to reduce height. Sourced from `matchSummaryOptions` with `staleTime: Infinity` — completed matches do not change. |
| `ShareMatchResult`    | Render | Optional share panel. Generates a Discord-friendly text summary and an image card. Sharing is never required to complete the flow.                                                                                                                                      |

#### §6.6 Command Post

**Route:** `src/web/src/app/[gameSystem]/matches/[matchId]/command-post`

| Component         | Type            | Responsibility                                                                                                                                                                                                                                                                                                   |
| ----------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CommandPostView` | Orchestrational | Renders three sections: mission briefing (from match detail), stratagem reference, and game log. Subscribes to `matchState$` for the live game log.                                                                                                                                                              |
| `StratagemList`   | Render          | Searchable list of all stratagems available to the active army. Phase filter chips narrow results to the current phase. The "Available Stratagems" label persists as a section heading regardless of filter state. Tapping a stratagem opens an inline detail sheet; any open unit drawers close first (MPG-36). |
| `GameLog`         | Render          | Chronological feed of state changes: HP updates, CP spends, secondary scores, phase transitions, and match state transitions. Sourced from `matchState$` via `useMatchSync()`. New entries appear at the top.                                                                                                    |

---

### B. State Management Tier Breakdown

Phase 3 is the first phase to use all four state tiers simultaneously. The table below documents each section's usage.

| Section                    | Tier 1 (useState)                                                                                | Tier 2 (URL params)                                 | Tier 3 (React Query)                                                | Tier 4 (RxJS)                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------- |
| §6.1 War Ledger            | Match card action loading states                                                                 | —                                                   | `matchListOptions({})`                                              | —                                                           |
| §6.2 Creation Drawer       | Creation step index, gambit selections, army picker open state                                   | —                                                   | `createMatchMutation`, `missionOptions`, `friendListOptions`        | —                                                           |
| §6.2a Match Linking        | Invite share panel open                                                                          | —                                                   | `matchDetailOptions(matchId)`                                       | —                                                           |
| §6.3 Setup / Deployment    | Reserve toggle states, deep strike eligibility flags, per-unit deployment toggle                 | —                                                   | `matchDetailOptions(matchId)`, setup mutations, deployment mutation | —                                                           |
| §6.4 Basic Mode            | Right rail collapsed, HP input method preference (stepper / text / bar), end-of-turn prompt open | `matchId` (path), `?mode=basic`, `?unitId` (drawer) | `matchDetailOptions(matchId)` — initial hydration only              | `MatchStream`: `matches$`, `match$(id)`, `connectionState$` |
| §6.5 Guided Mode           | Same as §6.4                                                                                     | Same as §6.4 plus `?phase=movement`                 | Same as §6.4                                                        | Same as §6.4                                                |
| §6.5a Conclusion / Summary | Share panel open                                                                                 | —                                                   | `matchSummaryOptions(matchId)` with `staleTime: Infinity`           | —                                                           |
| §6.6 Command Post          | Stratagem detail sheet open, stratagem phase filter                                              | —                                                   | `matchDetailOptions(matchId)` (mission data)                        | `matchState$` (game log stream)                             |

#### Tier 4 Architecture

The RxJS layer is confined to `MatchStream` and the `useMatchSync()` hook. No UI component interacts with observables directly.

The data flow is:

1. `MatchStream` emits on `matches$` when the `MatchesRealtimeClient` receives `matchState` or `matchUpdated` WebSocket messages. There is no polling; all updates arrive via WebSocket push.
2. `useMatchSync()` bridges each observable to React Query cache using `useSyncExternalStore`. On each emission, it calls `queryClient.setQueryData(matchDetailOptions(matchId).queryKey, nextValue)` to push the update into the cache.
3. UI components read from the cache via `useQuery(matchDetailOptions(matchId))` as they would for any server state. They are entirely unaware that the data arrived via an observable rather than a fetch.

This architecture means UI components are completely decoupled from the transport layer. They read from React Query cache and are unaware that data arrives via WebSocket.

The `MatchStream` is provided via React context at the `MatchPageContainer` level. Components below it access it through `useMatchSync()`, which reads the context and returns typed query results.

---

### C. Shared Component Reuse Mapping

Several components defined in Phase 3 are consumed across multiple sections or across multiple phases.

| Component                    | Consumed By                                 | Notes                                                                                                                                                                                  |
| ---------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MatchHeader`                | §6.4 Basic Mode, §6.5 Guided Mode           | Single component. Accepts `mode` ('basic' \| 'guided') and `currentPhase` props. Mode toggle is rendered inside the header and calls back to the container.                            |
| `HPControl`                  | §6.4 Basic Mode, §6.5 Guided Mode           | Shared without modification. Input method preference (stepper, text field, bar) stored in Tier 1 state at the container level and passed down.                                         |
| `MatchRightRail`             | §6.4 Basic Mode, §6.5 Guided Mode           | Same layout; same two tabs. No mode-specific logic inside the component.                                                                                                               |
| `MatchStickyFooter`          | §6.4 Basic Mode, §6.5 Guided Mode           | Actions are identical; label text changes based on turn context.                                                                                                                       |
| `UnitDetailDrawer` (Phase 2) | §6.4, §6.5 via match mode                   | Opened from `MatchUnitListItem` and `GuidedUnitListItem`. Constraint C applies: composition is locked, wargear is read-only. The drawer detects match context through the active mode. |
| `MatchCreationDrawer`        | §6.1 War Ledger, Phase 4 §7.3, Phase 4 §7.5 | Reused in Phase 4 with a campaign context object. The 7-step structure does not change; the context object controls which fields are pre-populated or hidden.                          |
| `OpponentPanel`              | §6.4, §6.5                                  | Identical layout. Guided mode does not filter the opponent's units by phase — the opponent's full list is always visible.                                                              |

---

### D. Drawer Mode and Sync Implementations

#### Match Mode (Constraint C resolution)

Defined in `src/shared/frontend/` and consumed by the match pages in §6.4 and §6.5. The match mode wraps the shared Unit Detail Drawer and applies match-context overrides:

- Model list is read-only. The unit roster was locked when the match entered SETUP state.
- HP bar is the primary display field (replaces wound profile in roster context).
- Composition controls (add model, remove model) are hidden.
- Wargear selection is read-only — weapons display but cannot be changed.
- The match mode differentiates between 'basic' and 'guided'. The Unit Detail Drawer reads this to determine whether to show all abilities or only phase-filtered ones.

#### MatchStream (C-02 resolution)

The `MatchStream` is a class defined in `src/shared/streams/src/matches/MatchStream.ts`. It wraps `MatchesRealtimeClient` and exposes `matches$`, `match$(id)`, and `connectionState$`. It is not imported directly by any React component.

**Providing the stream:** `MatchPageContainer` creates or receives a `MatchStream` instance and provides it via a typed React context. The `useMatchSync()` hook reads this context, subscribes to the observables using `useSyncExternalStore`, and writes into the React Query cache as described in section B.

#### Constraint D enforcement

`GuidedMatchContainer` reads `currentPhase` from URL state (`?phase=`) and passes it to `GuidedUnitListItem`. The item component receives a `visibleTags` prop computed from `getTagsForPhase(unit, currentPhase)` — a pure function. The filtering logic does not live in the component.

In Basic mode, `MatchUnitListItem` always receives the full tag set. The distinction between Basic and Guided is in which container renders which list item component, not in conditional logic inside the items.

#### Constraint E enforcement

Both `BasicMatchContainer` and `GuidedMatchContainer` render the same `MatchRightRail` and `MatchStickyFooter` without mode-specific props. The right rail layout is identical in both modes; only its content tabs (Secondary Missions, Mission Rules) differ, and those tabs are driven by data, not by mode.

---

### E. Component Composition Hierarchy

#### Active Match — Basic Mode

```
MatchPageContainer
  MatchStream (context provider)
  MatchHeader (sticky, --match-header-height)
  OpponentStatusBar (Guided only — absent in Basic)
  [scrollable body, independent scroll from header/footer]
    UnitListPanel (left column / "My Army" tab)
      MatchUnitListItem (x N, all state tags visible)
        HPControl (stepper | text | bar)
        UnitDetailDrawer (Phase 2, match mode)
      DestroyedUnitsSection (collapsible)
    OpponentPanel (right column / "Opponent" tab)
      MatchUnitListItem (x N, opponent units)
  MatchRightRail (48px collapsed side panel / bottom sheet)
    [tab: Secondary Missions]
    [tab: Mission Rules]
  MatchStickyFooter (sticky bottom)
    EndOfTurnSecondaryPrompt (modal, on round advance)
```

#### Active Match — Guided Mode

```
MatchPageContainer
  MatchStream (context provider)
  MatchHeader (sticky, mode='guided')
  OpponentStatusBar (persistent, below header)
  PhaseIndicator (Command → Movement → Shooting → Charge → Fight)
  [scrollable body]
    UnitListPanel (phase-filtered)
      GuidedUnitListItem (x N, phase-relevant tags only)
        HPControl (shared)
        UnitDetailDrawer (Phase 2, match mode)
      DestroyedUnitsSection (collapsible)
    OpponentPanel (full unit list, no phase filter on opponent)
  MatchRightRail (shared, 48px collapsed)
  MatchStickyFooter (shared)
    EndOfTurnSecondaryPrompt (modal)
```

#### Match Page State-Machine Routing

```
MatchPageContainer
  [reads matchDetailOptions(matchId).state]
  ├── CREATED       → MatchLinkingView
  ├── LINKING       → MatchLinkingView
  ├── LINKED        → MatchLinkingView (both players linked, waiting for host)
  ├── SETUP         → SetupPhaseView
  │                    MatchSettingsLocked (read-only header strip)
  ├── DEPLOYMENT    → DeploymentPhaseView
  │                    MatchSettingsLocked
  ├── IN_PROGRESS   → BasicMatchContainer  (when ?mode=basic or no mode param)
  │               → GuidedMatchContainer (when ?mode=guided)
  ├── CONCLUDING    → MatchConclusionView
  └── COMPLETED     → MatchSummaryView
```

#### Match Creation Drawer — Step Flow

```
MatchCreationDrawer
  [reads creationContext from React context]
  Step 1: ArmySelector        (skipped when context.armyId is set — C-07)
  Step 2: MatchSettingsForm   (points, battle size)
  Step 3: MissionSelector     (plugin-provided Chapter Approved missions)
  Step 4: SecondaryMissionConfig (Fixed or Tactical per player)
  Step 5: GambitCardPicker    (Challenger / Underdog, VP cap 1-12)
  Step 6: OpponentSelector    (multi-select, online friends sorted first)
  Step 7: SchedulePicker      (optional scheduledAt, nullable)
  [final step calls createMatchMutation → navigates to /matches/[matchId]]
```

---

### F. Responsive and Accessibility Specs

#### Layout Breakpoints

| Feature             | Desktop (>1024px)                             | Mobile (<=1024px)                    |
| ------------------- | --------------------------------------------- | ------------------------------------ |
| Unit lists          | Dual column: My Army (left), Opponent (right) | Tabbed: "My Army" / "Opponent"       |
| Right rail          | Side panel, collapses to 48px wide            | Bottom sheet, collapses to 48px tall |
| Linking view        | Join code and friend list side by side        | Stacked, join code above friend list |
| Match creation      | Drawer slides from right, modal-width         | Full-screen overlay                  |
| Match summary table | Vertical per-round rows                       | Same; no horizontal scroll required  |

#### Navigation

The primary application navigation is hidden during IN_PROGRESS and CONCLUDING match states (MPG-17). `MatchPageContainer` applies a CSS class to the root layout that collapses the nav. Navigation returns when the match reaches COMPLETED or if the user explicitly exits via the header back button.

#### CSS Custom Properties

- `--match-header-height`: height of `MatchHeader`. Applied as `padding-top` on the scrollable body to prevent content sliding behind the sticky header. Must accommodate match name (truncated at 1 line), round indicator, and dual VP/CP scores.
- `--right-rail-width`: width of the right rail when expanded. Used to offset the unit list panel on desktop.

#### Typography

All rules and mission text within `MatchRightRail` and `CommandPostView` must render at a minimum of 14px (MPG-20). This applies to plugin-provided content passed as strings. Implement via a scoped CSS rule on the container, not inline styles.

#### HP Control Accessibility

All three input methods (stepper buttons, text field, draggable bar) must be independently operable via keyboard and touch. The draggable bar must expose an ARIA slider role with `aria-valuenow`, `aria-valuemin`, and `aria-valuemax`. The stepper buttons are `<button>` elements with `aria-label` including the unit name (e.g., "Decrease wounds for Intercessor Squad").

#### Scroll Isolation

The unit list panels scroll independently from `MatchHeader` and `MatchStickyFooter` (MPG-33). Implement using `overflow-y: auto` on the panel container with an explicit height calculated as `calc(100dvh - var(--match-header-height) - var(--footer-height))`. On mobile, account for the bottom sheet height when expanded.

#### Touch Targets

`MatchStickyFooter` action buttons: 44px minimum height. State tag chips in `MatchUnitListItem`: 44px minimum touch target using padding compensation if the visual size is smaller. HP stepper buttons: 44px by 44px.

#### Screen Reader

- VP and CP updates: ARIA live region with `aria-live="polite"` and `aria-atomic="true"` on the score display in `MatchHeader`. Updates announce after the current utterance finishes.
- Match state transitions (e.g., advancing from DEPLOYMENT to IN_PROGRESS): `aria-live="assertive"` on a visually hidden status element.
- Phase changes in Guided mode: announced via `aria-live="polite"` on `PhaseIndicator`.
- `GameLog` entries in Command Post: `aria-live="polite"` with `aria-relevant="additions"` so only new log entries are announced.

#### Reduced Motion

The HP bar drag animation (`transform` on the fill) is disabled under `prefers-reduced-motion: reduce`. The bar fill updates instantly instead. Entering/exiting animations on the Match Creation Drawer, right rail collapse, and end-of-turn prompt are also suppressed.

---

### G. Dependencies and Blockers

#### Mockup Dependencies

Six mockups are referenced as design input for implementation. Placeholder UIs ship immediately; final layouts are refined as each mockup becomes available.

| Mockup                              | Refines                                                            |
| ----------------------------------- | ------------------------------------------------------------------ |
| Match Setup Phase                   | `SetupPhaseView` — all four sections                               |
| Match Deployment Phase              | `DeploymentPhaseView` — per-unit toggle layout                     |
| Right Rail — Secondary Missions tab | `MatchRightRail` secondary scoring UI                              |
| Right Rail — Mission Rules tab      | `MatchRightRail` rules text layout                                 |
| Guided Mode (all 5 phases)          | `GuidedUnitListItem` phase-filtered tags, `PhaseIndicator` styling |
| Match Summary                       | `MatchSummaryView` per-round table and secondary collapsibles      |

#### Implementation Notes

- War Ledger (`WarLedgerContainer`, `MatchCard`, `MatchCardActions`): no mockup dependency. All required data shapes are defined.
- Match Creation Drawer (all 7 steps): no mockup dependency. Data contracts with `missionOptions` and `friendListOptions` are established.
- Basic Mode unit list (`MatchUnitListItem`, `HPControl`, `BasicMatchContainer`): the unit list layout and HP controls do not depend on Setup or Deployment mockups.
- `MatchHeader` and `MatchStickyFooter`: no mockup dependency.

#### Phased Delivery

Basic mode is independently shippable and is targeted for Weeks 8-10. Guided mode implementation will be refined as the Guided Mode mockup becomes available; it should not hold up Basic mode deployment.

The `MatchRightRail` can ship with placeholder content in both tabs. The collapse/expand mechanic and layout are not dependent on mockups; only the content inside the tabs will be refined when the mockups land.

#### Upstream Dependencies

- **Phase 2 Unit Detail Drawer**: The match mode extends the Phase 2 drawer functionality. Match-specific features (HP bar, kill counter) cannot be finalized until the Phase 2 drawer is stable. This is a hard upstream dependency for §6.4 and §6.5.
- **`MatchStream` interface**: Must be agreed upon before `useMatchSync()` and `BasicMatchContainer` / `GuidedMatchContainer` can be written. The interface definition does not depend on the transport implementation being complete.

#### Cross-Phase Dependency

The `MatchCreationDrawer` is consumed in Phase 4 at §7.3 (Campaign Match Scheduling) and §7.5 (Campaign Round Completion). The drawer's creation context object API is therefore a cross-phase contract. Changes to the drawer's step structure or context object shape after Phase 4 planning begins require coordination.

---

### H. Code Organization and Exports

#### File Locations

| Artifact                          | Path                                                                   |
| --------------------------------- | ---------------------------------------------------------------------- |
| War Ledger page                   | `src/web/src/app/[gameSystem]/matches/page.tsx`                        |
| Match detail page                 | `src/web/src/app/[gameSystem]/matches/[matchId]/page.tsx`              |
| Command Post page                 | `src/web/src/app/[gameSystem]/matches/[matchId]/command-post/page.tsx` |
| Match components                  | `src/web/src/components/matches/[Component].tsx`                       |
| Match hooks                       | `src/web/src/hooks/useMatchSync.ts`                                    |
| Match state hook                  | `src/web/src/hooks/useMatchState.ts`                                   |
| MatchStream (reactive cache)      | `src/shared/streams/src/matches/MatchStream.ts`                        |
| MatchesRealtimeClient (WebSocket) | `src/shared/clients/matches/src/realtime.ts`                           |
| Query factories (matches)         | `src/shared/frontend/queries/matches.ts`                               |
| Query factories (missions)        | `src/shared/frontend/queries/missions.ts`                              |
| Match mode config                 | `src/shared/frontend/hooks/useMatchMode.ts`                            |

#### Query Factory Exports

`src/shared/frontend/queries/matches.ts` exports:

- `matchListOptions(filters)` — paginated match list, used in §6.1
- `matchDetailOptions(matchId)` — single match with full unit states, used in §6.3, §6.4, §6.5
- `matchSummaryOptions(matchId)` — completed match summary with per-round breakdown, `staleTime: Infinity`, used in §6.5a

`src/shared/frontend/queries/missions.ts` exports:

- `missionOptions(gameSystem)` — Chapter Approved missions from plugin, used in §6.2
- `missionDetailOptions(missionId)` — single mission rules text, used in §6.6 Command Post

#### Component Export Conventions

All match components use named exports. The barrel at `src/web/src/components/matches/index.ts` exports only the top-level orchestrational containers and the shared render components that are consumed outside the `matches/` directory. Internal render components (e.g., `GambitCardPicker`, `InviteStatusList`) are not re-exported from the barrel.

The `MatchStream` class and `createMatchStream` factory are exported from `src/shared/streams/src/matches/index.ts`. The `MatchesRealtimeClient` is exported from `src/shared/clients/matches/src/index.ts`. UI consumers should import the `MatchStream` type, not the transport client, unless they are the provider component managing the connection lifecycle.
