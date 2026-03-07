# Active Match Experience Specification

**Purpose:** Define the full Active Match experience — the primary draw of Armoury. This document details Basic and Guided modes, phase-by-phase UX, real-time sync, the Command Post reference view, and anti-cheat validation. It is a deep-dive reference for design and implementation.

**Scope:** Web (Next.js) and Mobile (Expo). Game-agnostic shell with plugin-provided rules content. The first supported ruleset is a sci‑fi tabletop system (10th edition).

**Related Documents:**
- `REQUIREMENTS.md`
- `INFORMATION_ARCHITECTURE.md`
- `STYLE_GUIDE.md`
- `FLOWS.md` (user journeys including match flows)
- `USER_STORIES.md` (match user stories)
- `DECISIONS.md` (DD-005, DD-006, DD-012, DD-013, DD-014)
- `docs/design/research/MATCH_LINKING.md`

**Naming Policy:** This spec avoids proprietary labels. Use generic language for UI labels and phase names. Phase names remain standardized and are provided by plugins.

---

## 1. Overview

The Active Match experience is Armoury’s primary differentiator. It replaces paper scorekeeping and clunky reference tools with a structured, fast, and anti-cheat workflow that surfaces only what matters in the moment. Users choose Armoury because it:

- Minimizes scrolling and rule hunting during play.
- Keeps both players synchronized with mutual visibility.
- Prevents missed abilities and phase-specific actions.
- Provides a fast, in-match Command Post for rules and loadouts.

Two modes are supported in V1:
- **Basic Mode (turn-by-turn):** One scrollable screen per turn.
- **Guided Mode (phase-by-phase):** Contextual prompts per phase with explicit progression.

Both modes share:
- The same MatchRecord data model.
- Real-time sync of score, resources, HP (optional), and phase state.
- The Command Post for quick reference.

**Primary Goal:** Maximize contextual relevance, minimize cognitive load.

---

## 2. Match Lifecycle

```
Match Created → Linking (QR/Code) → Setup → Pre-Combat → Combat (Rounds 1–5) → Conclusion
```

### 2.1 Match Creation
- User selects an army, names the match, and sets a date/time.
- If date = today, the match enters **Active** after linking.
- If date = future, the match is **Planned** and stays in the Matches list.

### 2.2 Match Linking (from MATCH_LINKING.md)
**V1 architecture:** Lambda + DynamoDB, polling every ~3 seconds.

**Pairing:**
- Player A generates a QR code with pairing payload.
- Numeric code fallback is always available (read aloud or manual entry).

**Anti-cheat baseline:**
- Mutual visibility of VP, CP, and phase state.
- End-of-match reconciliation required.

**UX requirements:**
- Both players see “Connected” state with opponent name and army summary.
- If already friends: auto-populate name and show friend indicator.
- If not friends: offer “Send Friend Request.”

### 2.3 Pre-Combat Setup
- Confirm both armies (faction, points, detachment summary).
- Select mission from available set.
- Determine first turn (randomize or manual input).
- Select match mode: Basic or Guided (switchable mid-match).

### 2.4 Combat Rounds (Core Loop)
- Max 5 rounds.
- Each round: Player 1 turn → Player 2 turn (or configured order for 3–4 players).
- Each turn has five phases: Command → Movement → Shooting → Charge → Fight.

---

## 3. Basic Mode (Turn-by-Turn)

**Intent:** Provide a compact, all-in-one view for fast play without forced step progression.

### 3.1 Layout (Three-Column with Status Strip)

- **Status Strip** (40px sticky bar, replaces bulky header)
  - Left: Round badge (R3), Turn pill (Your Turn / Opponent's Turn), Sync indicator.
  - Center: Compact score (mono font, VP in accent-secondary).
  - Right: CP pill with +/- controls, Command Post button, Mode badge (Basic/Guided).

- **Three-Column Grid** (below status strip)
  - **Main Content** (flexible width): reminder banner, units list, available actions, VP scoring footer (sticky bottom).
  - **Detail Panel** (360px): selected unit stats, weapons, abilities, enhancement, HP.
  - **Rules Side-Rail** (48px): vertical tab buttons for Army Rules and Detachment Rules with expand-on-click overlay panel.

- **Army/Detachment Rules Side-Rail**
  - Always visible as 48px vertical tab buttons pinned to the right edge.
  - Each tab shows: icon, rotated vertical label, and a small highlight dot to draw attention.
  - Clicking a tab opens a 300px overlay panel (over the detail panel) with collapsible rule blocks.
  - Players can glance at the tabs without losing main content context.

- **Cognitive Load Reduction**
  - Quiet chrome: unit rows use transparent background with left-border accent for selection, no card-style borders.
  - Reduced text sizes (13px unit names, 11px meta text) and tighter spacing (2px row gaps).
  - Action items show colored icons only (no colored background boxes).
  - Consistent use of opacity for hierarchy (used actions at 40% opacity).

- **Bottom Footer** (sticky)
  - VP scoring controls (Primary +/-, Secondary +/-).
  - Primary CTA: End Turn (or End Round if last player).

### 3.2 Turn-Aware Content Ordering

**Your Turn:**
1. Reminder banner (phase-relevant ability reminders).
2. Units list (compact rows with HP bars).
3. Available actions: stratagems and abilities organized by relevance.
4. VP scoring footer.

**Opponent's Turn:**
1. Defensive reactions and counter-stratagems (filtered to opponent's current phase).
2. Units list (same compact format).
3. Army/detachment rules side-rail becomes more prominent.

In both states: CP visible and editable, opponent VP/CP shown, sync indicator active.

### 3.3 Behavior
- VP/CP always editable.
- Abilities/stratagems can be marked as used (history preserved).
- HP edits (if enabled) sync to opponent with opt-in sharing.

---

## 4. Guided Mode (Phase-by-Phase)

**Intent:** Provide a structured, contextual experience that reduces forgotten actions and missed rules. Each phase shows only what matters in that phase.

### 4.1 Layout (Status Strip + Phase Bar + Three-Column)
- **Status Strip** (same compact 40px bar as Basic mode — shared component).
- **Phase Bar** (below status strip): horizontal phase stepper with completed/active/upcoming states.
- **Three-Column Grid**: main content (phase-specific) + detail panel (360px) + rules side-rail (48px).
- **Phase-Specific Callout**: icon + title + description at top of main content area for current phase context.
- “Next Phase →” button anchored to bottom.

### 4.2 Command Phase
**Surface:**
- Units with Command-phase abilities.
- Command-phase stratagems.
- Detachment rules that trigger here.
- Resource changes (auto +1 CP at phase start + bonus sources).

**Actions:**
- Mark abilities as triggered/used.
- Spend/gain CP with audit trail.
- “Next Phase →”

### 4.3 Movement Phase
**Surface:**
- Units with Movement values (M) shown inline.
- Movement-phase abilities.
- Movement-phase stratagems.
- Advance and fall back options.
- Transport embark/disembark reminders (if relevant).

**Actions:**
- Mark units as moved/advanced/fell back/stationary.
- “Next Phase →”

### 4.4 Shooting Phase
**Surface:**
- Units with ranged weapons (show equipped profiles inline).
- Shooting-phase stratagems.
- Abilities that trigger during shooting.
- Target context (opponent’s visible units if HP sharing enabled).

**Actions:**
- Mark units as having shot.
- Update opponent HP (if shared).
- Spend CP on stratagems.
- “Next Phase →”

### 4.5 Charge Phase
**Surface:**
- Units eligible to charge (based on movement state and abilities).
- Charge-phase stratagems.
- Charge-related abilities and reminders.
- Defensive reminder for opponent (e.g., reactive fire or overwatch-style responses).

**Actions:**
- Mark charge attempts (success/fail).
- “Next Phase →”

### 4.6 Fight Phase
**Surface:**
- Units in engagement range.
- Equipped melee weapon profiles.
- Fight-phase stratagems.
- “Fight first / fight last” style ability reminders.
- Pile-in / consolidate reminders.

**Actions:**
- Mark units as having fought.
- Update HP (if tracking enabled).
- “Next Phase →” or “End Turn.”

### 4.7 Opponent Turn (Guided Mode)
When not active player:
- Phase banner with opponent’s current phase.
- Defensive stratagems filtered to that phase.
- Your reactive abilities surfaced in a compact list.
- Your CP available for immediate spending.
- Opponent VP/CP visible (anti-cheat).
- Your HP state visible and editable (if HP tracking enabled).

---

## 5. Command Post (In-Match Army Reference)

The Command Post is a permanent, always-accessible reference view inside active matches. It replaces traditional “bunker” style views with faster access and dramatically reduced scrolling.

### 5.1 Key Improvements (Differentiators)
- **Equipped loadout per model** (not just selections):
  - “Model 1: Rifle + Grenade Launcher”
  - “Model 2: Rifle + Sidearm”
- **Minimal scrolling:** tabbed/segmented layout with compact lists.
- **Live HP state:** per unit and per model.
- **Active modifiers:** surfaced clearly and editable.

### 5.2 Command Post Layout

**Tab 1 — Units**
- Compact list showing:
  - Unit name
  - Model count (alive/total)
  - Points
  - HP bar
  - Equipped keyword summary
- Tap unit → **Unit Drawer**:
  - Stat block (M/T/SV/W/LD/OC)
  - Model-by-model loadout (explicitly equipped weapons)
  - Weapon profiles (equipped only)
  - Abilities
  - Active modifiers (add/remove)
  - One-time wargear toggles (used/not used)
  - Per-model HP editors

**Tab 2 — Stratagems**
- Grouped by phase (or “Any Phase”).
- Shows CP cost, name, and short description.
- Tap to expand full description.
- Search/filter bar at top.
- Used stratagems are dimmed, not hidden.

**Tab 3 — Rules**
- Faction rules, detachment rules, and army rules.
- Collapsible sections for quick scanning.
- Always accessible regardless of phase.

**Tab 4 — Enhancements**
- List of applied enhancements on characters.
- Shows which unit has which enhancement and effect text.

---

## 6. VP/CP Tracking UX

### 6.1 Victory Points (VP)
- **Large monospace display:** “VP: 45”
- Opponent visible next to yours: “You: 45 | Opp: 38”
- +/- controls for adjustments.
- Tap VP to open **round-by-round breakdown**:
  - Primary vs secondary tracked separately.
  - History log per round: “Round 3: +5 Primary, +3 Secondary.”
- Always synced to opponent.

### 6.2 Command Points (CP)
- Display: “CP: 3” (monospace).
- Auto-increment at start of each Command phase (+1).
- +/- buttons for spend/gain.
- History: “Spent 1 CP on [Stratagem] (Round 2, Fight Phase).”
- Always synced to opponent.

---

## 7. HP Tracking UX

### 7.1 Visual System
- Per-unit grid of model indicators (dots or squares).
  - Full: accent filled.
  - Wounded: amber (partial fill or segmented).
  - Destroyed: empty + strike.
- Multi-wound models show per-model wound counters.

### 7.2 Editing
- Tap unit → HP editor view:
  - Slider or +/- per model.
  - Quick “destroy” button.
  - “Restore” for resurrection effects.

### 7.3 Sharing
- Per-match toggle: “Share HP with opponent?”
- If enabled: opponent sees HP in near-real time.
- If disabled: only your local view updates.

---

## 8. “Don’t Forget” System (Contextual Reminders)

This is a core innovation of the Guided experience and a lightweight banner in Basic mode.

### 8.1 Trigger Points
- Start of each phase (Guided mode).
- Start of each turn (Basic mode).

### 8.2 Sources
- Unit abilities relevant to the phase.
- Phase-specific stratagems.
- Detachment rules active in the phase.
- Enhancement effects that trigger in the phase.
- Faction rules that apply in the phase.

### 8.3 Behavior
- Brief banner with the top 1–3 reminders.
- Dismissible but not hidden (accessible in a reminders tray).
- “Show all reminders” vs “Only unused” preference.

---

## 9. Match Conclusion Flow

1. Either player initiates “End Match.”
2. App calculates final totals.
3. If linked: both clients exchange final state.
4. Comparison screen:
   - Your VP vs Opponent VP.
   - Agreement check (does your record match their actual VP/CP?).
   - If mismatch: highlight discrepancies for resolution.
5. Both players confirm results.
6. Match saved with outcome (win/loss/draw).
7. If part of a campaign: update campaign progression.
8. Optional share: export or share to external channel.

---

## 10. Responsive Layout Behavior

### 10.1 Desktop (≥1024px)
- Three-column grid: main content + detail panel (360px) + rules side-rail (48px).
- Status strip (40px) sticky at top with VP/CP always visible.
- Horizontal phase stepper (Guided mode).
- Rules side-rail always visible; overlay panel expands on click.

### 10.2 Tablet (768–1023px)
- Two-column: main content + detail panel.
- Rules side-rail collapses; army/detachment rules accessible via Command Post or bottom sheet.
- Detail panel narrower or collapses into drawer.

### 10.3 Mobile (<768px)
- Single column with tabbed navigation.
- Phase stepper compact (icons only, current label below).
- Unit details in bottom sheet.
- Status strip condenses (score + CP only; round/turn in sheet header).
- Army/detachment rules accessible via dedicated tab or bottom sheet.
- Swipe between phases in Guided mode.

---

## 11. Mode Switching

- Users can switch between Basic and Guided mid-match.
- Switching preserves current round/turn/phase.
- The UI adapts:
  - **Basic → Guided:** opens at current phase.
  - **Guided → Basic:** expands to full-turn view.
- Default mode stored in `Account.preferences`.

---

## 12. Match Page — Non-Active States

### 12.1 Past Match (Read-Only)
- Summary: winner, final VP, round-by-round scores.
- Armies used (both players).
- Timeline of rounds and scoring notes.
- No edits; Command Post view read-only.

### 12.2 Future Match (Planning)
- Organizer can edit date, name, and participants.
- Participants can change army selection.
- Changes notify linked players.
- “Start Now” button for organizer.
- Countdown to match date.

---

## 13. Multi-Player (2–4 Players)

- Support 2–4 players in V1.
- Turn order configured during setup.
- VP/CP visible for all players.
- HP sharing is opt-in per player.
- Match conclusion requires confirmation from all participants.

---

## 14. Data & Sync Requirements

### 14.1 Core Data Models
- `MatchRecord`: per-player record with `roundScores[]`, `armyHPState[]`, `gameTracker`.
- `GameTracker`: `currentRound (1–5)`, `currentTurn`, `currentPhase`, `gameEnded`.
- `RoundScore`: `round`, `primaryVP`, `secondaryVP`, `cpSpent`, `cpGained`, `notes`.
- `ModelHPState`: `armyUnitId`, `unitName`, `modelHP[]` (currentWounds, maxWounds, destroyed).
- `ArmyUnit`: `unitId`, `unitName`, `modelCount`, `totalPoints`, `modelConfigs[]`, `wargearSelections[]`, `enhancement`.
- `Unit`: stats + weapons + abilities + keywords + wargear options.
- `FactionData`: stratagems, detachments, faction rules.

### 14.2 Sync Strategy (V1)
- **Polling:** ~3s cadence (Lambda + DynamoDB).
- **Sync data:** VP/CP/HP, phase/round/turn, gameEnded.
- **Conflict resolution:** last-write wins per player-owned fields; shared fields use server timestamp.
- **Indicator:** synced / syncing / disconnected status indicator.

### 14.3 Anti-Cheat Requirements
- Mutual visibility of VP/CP/phase for all players.
- End-of-match reconciliation required before final save.
- Optional future enhancement: hash chain validation for competitive play.

---

## 15. UX Guardrails

- **Always visible scoring:** VP/CP never hidden by nested navigation.
- **No infinite scroll during active phases:** use tabs or segmented controls.
- **Context-first:** show only phase-relevant actions in Guided mode.
- **Avoiding label conflicts:** use generic labels for abilities, resources, and rules.
- **Accessibility:** touch targets ≥ 44×44, contrast ≥ 4.5:1, motion respects preferences.

---

**End of Match Experience Specification**
