# Armoury UI Flows

**Purpose:** Provide a comprehensive, screen-by-screen flow document for Armoury across web and mobile. This document defines user journeys, states, edge cases, and responsive behavior, aligned to the IA routes and component patterns.

**Scope:** Web (Next.js 15 App Router + Radix UI) and Mobile (Expo Router + Tamagui). Game-agnostic shell with plugin-provided content.

**Related Documents:**
- `docs/design/REQUIREMENTS.md`
- `docs/design/INFORMATION_ARCHITECTURE.md`
- `docs/design/STYLE_GUIDE.md`
- `docs/design/MATCH_EXPERIENCE.md`
- `docs/design/research/MATCH_LINKING.md`
- `docs/design/ART_DIRECTION.md`

**Naming Policy:** Page labels finalized per `DECISIONS.md`. See DD-001 through DD-006 for rationale.

---

## 1. Flow Notation

- `[Screen Name]` — a distinct screen/page
- `→` — navigation
- `⇒` — conditional navigation (includes condition)
- `(Modal)` — overlay, not a new page
- `{Action}` — user action
- `[!Error]` — error state
- `[~Loading]` — loading state
- `[∅ Empty]` — empty state

**Component mapping (STYLE_GUIDE.md):**
- `(Modal)` → `Dialog` (web), `Dialog`/Takeover Screen (mobile)
- `(Drawer)` → `Drawer` (web), `Sheet` (mobile)
- `(Bottom Sheet)` → `Sheet` (mobile), `Drawer` (web <768px)
- Cards → `Card` (web) / `Card` (mobile)
- Primary CTA → `Button` (primary) / `Button`
- FAB → `FAB` (mobile + web <768px)

---

## 2. Core User Journeys

### Journey 1: New User Onboarding
```
[Landing / Game System Selector] → {Select game system} → [~Loading: Data Sync] → [Login] → [Army List page (∅ Empty)]
```
**Routes:** `/` → `/[gameSystem]/armies` (after sync) → `/login` (if unauthenticated) → `/[gameSystem]/armies`

**Details:**
- **[Landing / Game System Selector]**
  - Grid of game system cards (plugin-provided metadata). Uses **Card** with image + name.
  - `{Select game system}` triggers first-time data sync.
- **[~Loading: Data Sync]**
  - Full-page loader with progress bar + stage labels (GSS-003).
  - Show elapsed time; average ~30s on first sync.
- **[Login]**
  - Auth0 Universal Login (AUTH-001). Returns to last attempted route.
- **[Army List page (∅ Empty)]**
  - Empty state with CTA: “Create your first army” (ARM-006).

**Edge cases:**
- `{Dismiss login}` ⇒ **Web** can browse `References` (read-only) with banner; **Mobile** redirects to `/login` (AUTH-003).
- `{Sync fails}` ⇒ `[!Error: Data Sync]` with retry + offline message.

**Responsive:**
- Game system cards grid becomes 2 columns under `md`; 1 column on small phones.
- Data sync loader uses full takeover under `md`.

---

### Journey 2: Army Creation
```
The Forge → {Tap "Add Army"} → (Faction Picker Modal) → {Select faction} → [Army Creation page] → {Fill name, detachment, points} → {Tap "Create"} → [Army page]
```
**Routes:** `/[gameSystem]/armies` → `/[gameSystem]/armies/new` → `/[gameSystem]/armies/[armyId]`

**Details:**
- **The Forge**
  - Primary action: **Header button** (desktop) or **FAB** (mobile/web <768px).
- **(Faction Picker Modal)**
  - Grid of faction tiles (from `FactionData`) using **Card** + image + name.
  - Responsive behavior: modal on desktop, takeover screen on mobile (<768px).
- **[Army Creation page]**
  - Form fields: Name (required), Detachment (optional), Battle size (radio), Points limit (number or preset).
  - Background uses faction image with dark overlay.
  - Validation: inline errors; “Create” disabled until valid (ARM-025/026).
  - Components: `Input`, `Select`, `RadioGroup`, `Button`.

**Edge cases:**
- `{Name missing}` ⇒ inline validation message, focus first error.
- `{Points invalid for battle size}` ⇒ warning + block create if invalid.

**Responsive:**
- Form fields stack full width on mobile.
- Secondary actions collapse into bottom action bar on mobile.

---

### Journey 3: Army Building (Add Units)
```
[Army page] → {Tap "+" on section} → (Unit Add modal) → {Browse/search units} → {Tap "Add"} → [Army page (unit added)] → {Tap unit} → [Unit Configuration & Datasheet page] → {Configure loadout} → {Back} → [Army page (updated)]
```
**Routes:** `/[gameSystem]/armies/[armyId]` → `/[gameSystem]/armies/[armyId]/units/add` → `/[gameSystem]/armies/[armyId]/units/[unitId]`

**Details:**
- **[Army page]**
  - Sections: Characters, Battleline, Transports, Walkers, Vehicles, Auxiliary, Allied (ARM-042).
  - Section headers use `Section Header` pattern with add icon button.
  - Points total displayed in header (`Points Display`).
- **(Unit Add modal)**
  - URL-addressable (ARM-065). Opens as drawer on desktop, bottom sheet or takeover on mobile.
  - Unit tiles show image, name, count in army, min/max points, add button.
  - Disabled tiles show reason text (VAL-001).
  - Search + filter bar.
- **[Unit Configuration & Datasheet page]**
  - Editable weapon/wargear, model count, enhancements.
  - Inline validation and disabled save if invalid (ARM-086).
  - Uses `Stat Block`, `Weapon Profile Table`, `Points Display`.

**Edge cases:**
- `{Unit at max count}` ⇒ tile disabled + reason.
- `{Rule conflict}` ⇒ validation summary on Army page + inline errors.
- `{Offline}` ⇒ allow edits, show sync indicator (OFF-002/004).

**Responsive:**
- Unit add drawer becomes full takeover under `md` (GLB-004).
- Unit detail: split view on desktop, full page on mobile (IA section 10.1/10.3).

---

### Journey 4: Match Creation and Linking
```
War Ledger → {Tap "Create Match"} → (Match Creation Drawer) → {Select army, set name/date} → {Create} → [Match page (planning)] → {Tap "Link Opponent"} → (QR Code Modal) → {Opponent scans} → [Match page (linked)] → {Tap "Start"} → [Active Match]
```
**Routes:** `/[gameSystem]/matches` → `/[gameSystem]/matches/new` → `/[gameSystem]/matches/[matchId]`

**Details:**
- **(Match Creation Drawer)**
  - Drawer on desktop, bottom sheet on mobile.
  - Default name uses date (“Match — Feb 8”).
  - Army picker (list of owned armies).
  - Date picker (local timezone).
- **[Match page (planning)]**
  - Planned status with editable fields for organizer.
  - “Link Opponent” CTA opens QR modal.
- **(QR Code Modal)**
  - Large QR + numeric code (fallback).
  - Status: “Waiting for opponent…” (MATCH_LINKING.md).
  - If already friends: show friend badge; else show “Send Friend Request” CTA (SOC-009).
- **[Match page (linked)]**
  - Connected state shows opponent name, army summary, and sync indicator.
- **[Active Match]**
  - Mode selection (Basic/Guided) or resume last mode.

**Edge cases:**
- `{QR scan fails}` ⇒ numeric code fallback.
- `{Link timeout}` ⇒ show retry + regenerate code.
- `{Connection lost}` ⇒ “Reconnecting…” banner; last known state shown.

**Responsive:**
- QR modal becomes takeover on small screens.
- Match creation drawer becomes full screen under `md`.

---

### Journey 5: Playing an Active Match (Basic Mode)
```
[Active Match] → {Choose Basic mode} → [Basic Turn View] → {Track VP/CP, view units, use actions} → {End Turn} → [Opponent's Turn View] → ... → {End Round} → [Next Round] → ... → [Match Conclusion]
```
**Routes:** `/[gameSystem]/matches/[matchId]?mode=basic`

**Summary (see MATCH_EXPERIENCE.md for full detail):**
- **[Basic Turn View]**
  - Single scroll view: round/turn header, VP/CP counters, unit list, action list.
  - “End Turn” CTA at bottom; becomes “End Round” for last player.
  - Command Post accessible via button (route: `/[gameSystem]/matches/[matchId]/command-post`).
- **[Opponent’s Turn View]**
  - Show defensive options + reactive abilities, keep VP/CP visible.

**Edge cases:**
- `{Sync lag}` ⇒ show “Syncing…” badge; keep local changes queued.
- `{Opponent disconnects}` ⇒ banner + allow solo continue.

**Responsive:**
- Desktop: split panel (units list + detail). Mobile: tabbed sections + bottom sheet detail.

---

### Journey 6: Playing an Active Match (Guided Mode)
```
[Active Match] → {Choose Guided mode} → [Command Phase] → {Process abilities, gain CP} → {Next Phase} → [Movement Phase] → [Shooting Phase] → [Charge Phase] → [Fight Phase] → {End Turn} → [Opponent's Turn (phase-aware)] → ... → [Match Conclusion]
```
**Routes:** `/[gameSystem]/matches/[matchId]?mode=guided`

**Summary (see MATCH_EXPERIENCE.md for full detail):**
- **Phase header** shows stepper + round/turn + VP/CP counters.
- Each phase surfaces only relevant abilities, stratagems, and reminders.
- “Next Phase →” anchors bottom; “End Turn” after last phase.

**Edge cases:**
- `{Switch to Basic mid-match}` ⇒ preserves round/turn/phase.
- `{Phase advancement while offline}` ⇒ block with warning; requires sync.

**Responsive:**
- Mobile supports swipe between phases (Guided only).
- Desktop displays phase stepper horizontally with persistent VP/CP.

---

### Journey 7: Match Conclusion
```
[Active Match] → {Tap "End Match"} → (Confirmation Dialog) → [Reconciliation Screen] → {Both players confirm} → [Match Summary (past)]
```
**Routes:** `/[gameSystem]/matches/[matchId]`

**Details:**
- **(Confirmation Dialog)** uses `Dialog`/`Sheet` depending on screen size.
- **[Reconciliation Screen]** compares VP/CP totals and highlights discrepancies.
- **[Match Summary (past)]** becomes read-only view with round-by-round breakdown.

**Edge cases:**
- `{Mismatch}` ⇒ prompt both players to resolve; allow retry sync.

---

### Journey 8: Campaign Creation
```
Campaigns → {Tap "Create"} → [Campaign Creation page] → {Set type, name, dates, stages, rules} → {Create} → [Campaign page]
```
**Routes:** `/[gameSystem]/campaigns` → `/[gameSystem]/campaigns/new` → `/[gameSystem]/campaigns/[campaignId]`

**Details:**
- Type picker: Custom vs Crusade (generic labels in UI).
- If Crusade: select ruleset from loaded rules (`CrusadeRules`), auto-populate narrative.
- Stage definition: name, points limit, match requirements.
- Components: `Input`, `Select`, `Textarea`, `RadioGroup`, `Button`.

**Edge cases:**
- `{Missing required fields}` ⇒ inline errors, Create disabled.

---

### Journey 9: Campaign Participation
```
[Campaign page] → {View standings} → {Tap army section} → {Tap unit} → [Campaign Unit page] → {Spend points, assign honours/scars} → {Back} → [Campaign page]
```
**Routes:** `/[gameSystem]/campaigns/[campaignId]` → `/[gameSystem]/campaigns/[campaignId]/units/[unitId]`

**Details:**
- Dashboard shows standings, phases, and participant armies.
- Unit page edits progression (XP, honours, scars) with validation.

**Edge cases:**
- `{Progression exceeds rules}` ⇒ inline validation + block save.

---

### Journey 10: Campaign Match Flow
```
[Campaign page] → {Tap "Play Match"} → [Match Creation (campaign-scoped)] → {Link opponent} → [Active Match (campaign banner)] → {Play match} → [Match Conclusion (campaign)] → {Mark dealers/awards} → {Confirm} → [Campaign page (updated)]
```
**Routes:** `/[gameSystem]/campaigns/[campaignId]` → `/[gameSystem]/matches/new` → `/[gameSystem]/matches/[matchId]`

**Details:**
- Campaign banner on match header indicates campaign context.
- Post-match awards panel for campaign-specific rewards (dealers/marks).

**Edge cases:**
- `{Campaign full}` ⇒ “Campaign is full” message; CTA to contact organizer.

---

### Journey 11: Social — Adding Friends
```
Allies → {Tap "Add Friend"} → (Add Friend Modal: tabs for Code/QR/NFC) → {Enter code OR scan QR} → [Friend request sent] → [Social page (pending request shown)]
```
Receiving side:
```
Allies → {See pending request} → {Accept/Reject} → [Social page (friend added)]
```
**Routes:** `/[gameSystem]/social`

**Details:**
- Modal tabs for Code/QR/NFC (NFC Android-only).
- Show own friend code with copy/share actions.
- Pending requests show status chips.

**Edge cases:**
- `{Invalid code}` ⇒ inline error.
- `{Blocked user}` ⇒ show blocked status.

---

### Journey 12: Account Management
```
[Account page] → {Edit display name} → {Save} → [Account page (updated)]
[Account page] → {Change theme preference} → [App re-renders with new theme]
[Account page] → {Toggle notifications} → [Account page (updated)]
```
**Routes:** `/account` (web & mobile), `/profile` (web optional)

**Details:**
- Display name and avatar editing.
- Preferences: theme, language, notifications.
- Use `Input`, `Switch`, `Select`.

---

## 3. State Diagrams (Complex Flows)

### Match State Machine
```
Created → Linking → Linked → Setup → Active → Concluding → Completed
                                ↘ Abandoned (timeout or manual cancel)
```
**Valid transitions:**
- Created → Linking (pairing initiated)
- Linking → Linked (opponent joins)
- Linked → Setup (pre-combat setup)
- Setup → Active (mode selected, match started)
- Active → Concluding (End Match initiated)
- Concluding → Completed (both confirm)
- Any of: Created/Linking/Linked/Setup/Active → Abandoned (timeout/manual cancel)

### Campaign State Machine
```
Created → Upcoming → Active → Completed
                       ↘ Cancelled (organizer only)
```

### Friend Request State Machine
```
Sent → Pending → Accepted
              ↘ Rejected
              ↘ Blocked
```

### Army Validation State
```
Valid (green) ↔ Warnings (amber) ↔ Errors (red)
```
**Triggers:**
- **Valid:** all rules satisfied; points at or under limit.
- **Warnings:** over points limit allowed by rules (VAL-005) or soft constraints.
- **Errors:** rule violations (invalid wargear, mandatory units missing, max units exceeded).

---

## 4. Error States and Edge Cases

| Flow | Error/Edge Case | Handling |
|------|----------------|----------|
| Data sync | Network failure during sync | Retry with exponential backoff, show error banner, allow retry |
| Army building | Points exceeded | Warning in header (amber → red), can still save but show validation |
| Unit add | Unit at max count | Tile disabled with “Maximum reached” text |
| Match linking | QR scan fails | Show numeric code fallback, manual entry option |
| Match linking | Connection lost during match | “Reconnecting…” banner, auto-reconnect, local state preserved |
| Match linking | Opponent disconnects | “Opponent disconnected” banner, allow solo continue |
| Campaign join | Campaign full | “Campaign is full” message, CTA to contact organizer |
| Login | Auth0 error | Error page with retry button |
| Offline | Network lost during army building | Continue editing locally, sync indicator shows “offline”, auto-sync on reconnect |

---

## 5. Platform-Specific Variations

| Flow Element | Web (Desktop) | Web (Mobile) | Mobile App |
|-------------|---------------|--------------|------------|
| “Add Army” action | Button in header area | FAB (bottom-right) | FAB (bottom-right) |
| Unit Add | Side modal/drawer (right) | Full takeover screen | Full takeover screen |
| Match Creation | Right-side drawer | Bottom sheet | Bottom sheet |
| Unit detail | Split view (list + detail) | Navigate to detail page | Navigate to detail page |
| Filters | Inline horizontal bar | Bottom sheet on tap | Bottom sheet on tap |
| Faction picker | Grid modal (3–4 columns) | Full screen (2 columns) | Full screen (2 columns) |
| Command Post | Split panel (always visible) | Tab-based, bottom sheet for unit detail | Tab-based, bottom sheet for unit detail |

---

## 6. Loading States Per Flow

- **The Forge**: 3–5 army card skeletons.
- **[Army page]**: header skeleton + 3 section skeletons with 2 unit card skeletons each.
- **War Ledger**: 3–5 match card skeletons.
- **[Match page]**: header + VP counter + phase indicator skeletons.
- **[Campaign page]**: summary skeleton + scoreboard skeleton + matches skeleton.
- **References**: search bar + list skeleton.
- **Allies**: friends list skeleton.

---

## 7. Navigation Shortcuts / Quick Actions

- **Army card** → “Deploy” button (opens `Command Post` for that army when in a match).
- **Match card** → tap opens match page directly in correct mode (past/future/active).
- **Campaign notification** → deep links to `[Campaign page]` dashboard.
- **Share army** → generates shareable URL/deeplink to `/[gameSystem]/armies/[armyId]`.

---

## 8. Responsive Behavior Notes (Global)

- **Modal → Takeover:** Below `md`, modals convert to full takeover screens (GLB-004).
- **Drawer → Bottom Sheet:** Web drawers convert to bottom sheets below `md`.
- **Navigation:** Side nav (desktop) becomes bottom nav below `md`.
- **Split view:** List + detail (desktop) becomes stacked navigation on mobile.
- **Tables:** Weapon tables become stacked cards on mobile.
- **Filters:** Inline filter bars collapse into bottom sheets on mobile.

---

## 9. Route Reference (IA Alignment)

- `/` → [Landing / Game System Selector]
- `/login` → [Login]
- `/[gameSystem]/armies` → The Forge
- `/[gameSystem]/armies/new` → [Army Creation page]
- `/[gameSystem]/armies/[armyId]` → [Army page]
- `/[gameSystem]/armies/[armyId]/units/add` → [Unit Add modal]
- `/[gameSystem]/armies/[armyId]/units/[unitId]` → [Unit Configuration & Datasheet page]
- `/[gameSystem]/references/units/[unitId]` → [Unit Datasheet page]
- `/[gameSystem]/matches` → War Ledger
- `/[gameSystem]/matches/new` → [Match Creation]
- `/[gameSystem]/matches/[matchId]` → [Match page]
- `/[gameSystem]/matches/[matchId]/command-post` → Command Post
- `/[gameSystem]/campaigns` → Campaigns
- `/[gameSystem]/campaigns/new` → [Campaign Creation page]
- `/[gameSystem]/campaigns/[campaignId]` → [Campaign page]
- `/[gameSystem]/campaigns/[campaignId]/units/[unitId]` → [Campaign Unit page]
- `/[gameSystem]/campaigns/[campaignId]/matches` → [Campaign Matches page]
- `/[gameSystem]/campaigns/[campaignId]/manage` → [Campaign Management page]
- `/[gameSystem]/social` → Allies
- `/[gameSystem]/references` → References
- `/account` → [Account page]
- `/profile` → [Profile page]

---

**End of UI Flows**
