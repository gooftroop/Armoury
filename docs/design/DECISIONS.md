# Design Decisions Log

Resolved design decisions for the Armoury project. Each entry follows MADR (Markdown Any Decision Record) format.

## Quick Reference

| ID | Decision | Status | Chosen |
|----|----------|--------|--------|
| DD-001 | Army List Page Name | Decided | **The Forge** |
| DD-002 | Matches Page Name | Decided | **War Ledger** |
| DD-003 | Campaigns Page Name | Decided | **Campaigns** |
| DD-004 | Social Page Name | Decided | **Allies** |
| DD-005 | Command Bunker Equivalent | Decided | **Command Post** |
| DD-006 | Combat View Name | Decided | **Deploy** |
| DD-007 | Add Army Button Placement | Decided | FAB (mobile) + Header action (desktop) |
| DD-008 | Combat View Button Location | Decided | Sticky header action |
| DD-009 | Match Creation UX Pattern | Decided | Header action + drawer/sheet |
| DD-010 | Social Features Value Prop | Decided | Match linking auto-friend + campaign invites (army sharing V1.5) |
| DD-011 | Modal → Takeover Breakpoint | Decided | <768px (md) |
| DD-012 | Default Match Mode | Decided | Basic default, easy mode switcher |
| DD-013 | Multi-Player Match Support | Decided | Configurable (no player limit) |
| DD-014 | Match Data Validation | Decided | Mutual visibility + reconciliation |
| DD-015 | Offline Support Strategy | Decided | Full offline with sync |

---

## DD-001: Army List Page Name

**Status:** Decided | **Priority:** High | **Affects:** Navigation, INFORMATION_ARCHITECTURE.md, FLOWS.md

### Context

The main page where users view and manage their army lists. Needs a name that is memorable, thematic, game-system-agnostic (works for 40K, AOS, and Horus Heresy), and free of trademark issues.

### Options

| Option | Pros | Cons |
|--------|------|------|
| **The Forge** | Evocative (armies are "forged"), works across all game systems, unique among competitors | Could imply crafting/creation rather than viewing existing armies |
| **Arsenal** | Clear meaning (collection of weapons/armies), game-agnostic, strong | Generic — used in many apps, less memorable |
| **Armoury** | Matches app name — brand reinforcement, thematic | Confusing — same name as the app itself, ambiguous navigation |
| **Muster** | Military term (mustering troops), unique, thematic | Obscure — not all users will know the term, may hurt discoverability |
| **War Room** | Immediately understood, conveys planning/strategy | Overused in gaming apps, slightly generic |

### Decision

**"The Forge"** — Unique, evocative, works across all game systems. "Forge your army" is intuitive. No trademark conflicts. Distinctive enough to be memorable but clear enough to be understood.

### Dependencies

Affects DD-006 (combat view is accessed from this page).

---

## DD-002: Matches Page Name

**Status:** Decided | **Priority:** High | **Affects:** Navigation, INFORMATION_ARCHITECTURE.md, FLOWS.md

### Context

Page listing past, active, and planned matches. Needs to convey "record of battles" while being game-agnostic.

### Options

| Option | Pros | Cons |
|--------|------|------|
| **Battle Log** | Clear, thematic, immediately understood | "Log" implies past-only — but this page also shows active and planned |
| **War Ledger** | Unique, conveys record-keeping, thematic | "Ledger" is unusual in gaming context, may feel bureaucratic |
| **Engagements** | Military term, covers past/present/future, formal | Long word, less punchy, could feel stiff |
| **Clashes** | Short, energetic, action-oriented | Casual — may not convey the record-keeping aspect |
| **Theater** | Military "theater of war", covers the broad scope | Could be confused with movie theater, ambiguous |

### Decision

**"War Ledger"** — Unique, evocative pairing with "The Forge." Conveys the record-keeping nature of the page while maintaining the tactical military aesthetic. The slightly archaic tone fits the grimdark theme.

### Dependencies

None.

---

## DD-003: Campaigns Page Name

**Status:** Decided | **Priority:** Medium | **Affects:** Navigation, INFORMATION_ARCHITECTURE.md

### Context

Campaign tracking page. Must work for 40K Crusade campaigns, AOS narrative campaigns, and Horus Heresy campaigns.

### Options

| Option | Pros | Cons |
|--------|------|------|
| **Campaigns** | Universal, clear, works for all game systems, no trademark risk | Generic — every app uses this word |
| **Operations** | Military term, implies structured multi-battle narrative | Less clear for casual users, could mean anything |
| **Theaters of War** | Evocative, implies large-scale conflict | Long, clunky in navigation, "Theater" ambiguity |
| **War Front** | Implies ongoing conflict, dynamic | Vague — could be mistaken for a news feed |
| **Crusades** | Thematic for 40K | Too 40K-specific — "Crusade" is a specific 40K game mode, doesn't fit AOS or HH |

### Decision

**"Campaigns"** — Sometimes the obvious choice is the right one. Universally understood, game-agnostic, and short. Differentiation comes from the feature experience, not the label.

### Dependencies

None.

---

## DD-004: Social Page Name

**Status:** Decided | **Priority:** Low | **Affects:** Navigation, INFORMATION_ARCHITECTURE.md

### Context

Friends list and social features page. Should feel thematic without being cringy.

### Options

| Option | Pros | Cons |
|--------|------|------|
| **Allies** | Military/gaming term, short, thematic, game-agnostic | Could imply in-game alliance mechanics that don't exist |
| **Comrades** | Warm, conveys camaraderie | Potentially dated, political connotations in some regions |
| **War Band** | Thematic, implies a group | More AOS-flavored, less fitting for 40K's tone |
| **Contacts** | Clear, functional | Completely generic, no thematic flavor |
| **Brothers in Arms** | Strong thematic resonance | Too long for nav label, gender-exclusive |

### Decision

**"Allies"** — Short, thematic, game-agnostic, fits the military/tactical theme. Clear enough that users know it's the social section. Works as a nav label (single word).

### Dependencies

Affects DD-010 (social features value proposition).

---

## DD-005: Command Bunker Equivalent

**Status:** Decided | **Priority:** High | **Affects:** MATCH_EXPERIENCE.md, FLOWS.md

### Context

In-match army reference view — shows equipped units, stratagems, rules. The official WH app calls this "Command Bunker" which we cannot use. Needs a name that conveys "your army reference during battle."

### Options

| Option | Pros | Cons |
|--------|------|------|
| **Command Post** | Clear military term, implies operational HQ, short | Somewhat generic |
| **Tactical Display** | Conveys information/data presentation, sci-fi feel | Long for a nav label, sounds like a screen not a place |
| **Field Manual** | Implies reference material, military | Sounds like documentation, not interactive |
| **War Console** | Sci-fi feel, implies control/interface | "Console" is overloaded (gaming console) |
| **Battle Station** | Energetic, implies readiness | Star Wars association, slightly campy |

### Decision

**"Command Post"** — Clear, professional military term. Short enough for a button/tab label. Conveys exactly what it is: the place you go to command your forces. No trademark issues.

### Dependencies

Related to DD-006 (combat view accesses the command post).

---

## DD-006: Combat View Name

**Status:** Decided | **Priority:** Medium | **Affects:** Army page, FLOWS.md

### Context

Button/action that takes the user from army building into the combat-ready view. Needs to feel like a call to action.

### Options

| Option | Pros | Cons |
|--------|------|------|
| **Deploy** | Action-oriented, short, military, implies transition from planning to battle | Could imply deployment phase specifically (40K game term) |
| **March to War** | Dramatic, thematic, conveys transition | Long for a button label |
| **Battle Ready** | Clear state description, energetic | Sounds like a status, not an action |
| **Field View** | Descriptive, clear | Bland, no energy |
| **Combat Footing** | Military term, implies readiness | Obscure, not immediately clear |

### Decision

**"Deploy"** — Single word, action-oriented, fits perfectly on a button. "Deploy your army" is intuitive. Any ambiguity with the 40K deployment phase is minimal in context (button clearly takes you to combat view, not a game phase).

### Dependencies

Accessed from The Forge and the army detail page.

---

## DD-007: Add Army Button Placement

**Status:** Decided | **Priority:** Medium | **Affects:** STYLE_GUIDE.md, FLOWS.md

### Context

Where should the "create new army" action live on the army list page? Must work on both desktop and mobile.

### Options

| Option | Pros | Cons |
|--------|------|------|
| **FAB (mobile) + Header action (desktop)** | Platform-native patterns, FAB is discoverable on mobile, header action is expected on desktop | Two different implementations to maintain |
| **FAB everywhere** | Consistent, always visible, one implementation | FAB on desktop feels mobile-ish, takes screen space |
| **Empty state CTA only** | Clean when armies exist, guides new users | Invisible once user has armies — need another entry point |
| **Inline "Add" card at end of list** | Discoverable, part of the content flow | Lost below the fold with many armies, scrolling required |

### Decision

**FAB (mobile) + Header action (desktop)** — Follow platform conventions. Mobile users expect FAB for primary creation actions. Desktop users expect header/toolbar actions. Empty state CTA exists as well (complementary, not exclusive).

### Dependencies

None.

---

## DD-008: Combat View Button Location on Army Page

**Status:** Decided | **Priority:** Medium | **Affects:** Army page layout, FLOWS.md

### Context

Where to place the button that transitions from army building to the combat-ready "Deploy" view.

### Options

| Option | Pros | Cons |
|--------|------|------|
| **Sticky header action** | Always visible as user scrolls, next to army name and points | Header space is premium, especially on mobile |
| **FAB** | Always visible, prominent | Conflicts with "Add Unit" FAB if both exist |
| **Top of page near army name** | Natural placement, seen first | Scrolls away on long army lists |
| **Contextual in detachment section** | Logical — deploy is tied to your detachment choice | Not discoverable, buried in content |

### Decision

**Sticky header action** — The army page header already shows army name and points counter. Adding a "Deploy" button/icon in the header keeps it always accessible. On mobile, this is an icon button; on desktop, a full button with label.

### Dependencies

Uses DD-006 button label ("Deploy").

---

## DD-009: Match Creation UX Pattern

**Status:** Decided | **Priority:** Medium | **Affects:** War Ledger page, FLOWS.md, STYLE_GUIDE.md

### Context

How should users create a new match? The creation form includes: name, army selection, date, and optionally initiating match linking.

### Options

| Option | Pros | Cons |
|--------|------|------|
| **Header action + drawer (desktop) / bottom sheet (mobile)** | Platform-appropriate, quick access, doesn't leave the page | Limited space for complex forms |
| **FAB + bottom sheet** | Prominent trigger, mobile-native | FAB competes with other actions on the page |
| **Dedicated full page** | Unlimited space, can include all options | Heavy for a simple form, breaks flow |
| **Inline expandable** | No overlay, stays in context | Pushes content down, janky with list reflow |

### Decision

**Header action + drawer/sheet** — Match creation is a short form (name, army, date). A drawer on desktop and bottom sheet on mobile keeps users in context. The header action button (+ icon) is a standard pattern users expect.

### Dependencies

None.

---

## DD-010: Social Features Value Proposition

**Status:** Decided | **Priority:** Medium | **Affects:** Allies page, REQUIREMENTS.md

### Context

What makes the friends list valuable beyond just a list of names? Without clear value, users won't bother adding friends.

### Options

| Option | Pros | Cons |
|--------|------|------|
| **Match linking auto-friend** | Natural discovery — play together, become friends | Only works if match linking is used |
| **Campaign invites** | Direct value — invite friends to campaigns | Only useful for campaign players |
| **Army sharing** | View friend's armies for inspiration/comparison | Privacy concerns, opt-in needed |
| **Shared army templates** | Copy a friend's army as a starting point | Complex feature, niche use case |
| **Spectating matches** | Watch friend's live match | Extremely complex to implement, V2+ at earliest |

### Decision

**V1: Match linking auto-friend + Campaign invites.** When players link for a match, offer to add as friends. When organizing a campaign, invite from friends list. These create natural, high-value touchpoints.

**V1.5: Army sharing.** Let friends view each other's army lists (opt-in).

### Dependencies

Depends on match linking architecture (MATCH_LINKING.md).

---

## DD-011: Modal → Takeover Breakpoint

**Status:** Decided | **Priority:** Low | **Affects:** STYLE_GUIDE.md, all modal components

### Context

At what viewport width do modals (centered overlays) become full-screen takeover pages?

### Options

| Option | Pros | Cons |
|--------|------|------|
| **< 768px (md breakpoint)** | Aligns with tablet/mobile split, standard in responsive design | Some tablets in portrait might get takeovers unnecessarily |
| **< 640px (sm breakpoint)** | Only truly small screens get takeovers | Modals on phone-sized screens are cramped |
| **Follow Radix defaults** | Consistency with component library | Radix doesn't have a strong opinion on this |
| **Device detection** | Precise targeting | Unreliable, user-agent sniffing is fragile, SSR complications |

### Decision

**< 768px (md breakpoint)** — This is the standard responsive breakpoint where side navigation also switches to bottom navigation. Keeping the modal behavior consistent with the nav breakpoint creates a predictable experience.

### Dependencies

Aligns with breakpoints defined in STYLE_GUIDE.md.

---

## DD-012: Default Match Mode

**Status:** Decided | **Priority:** High | **Affects:** MATCH_EXPERIENCE.md, Account preferences

### Context

When a user starts their first match, which mode should be the default — Basic (turn-by-turn) or Guided (phase-by-phase)?

### Options

| Option | Pros | Cons |
|--------|------|------|
| **Basic as default** | Lower barrier to entry, less overwhelming for new users | Misses the app's key differentiator (phase-by-phase guidance) |
| **Guided as default** | Showcases the app's best feature immediately | Could overwhelm new users with too much structure |
| **User chooses on first match, then remembers** | Respects user agency, educates about both modes upfront | Extra step before first match, decision fatigue |
| **Onboarding tutorial** | Best of both — guided introduction then user picks | Requires building tutorial infrastructure |

### Decision

**Basic as default with an easy, user-friendly mode switcher.** New users start in Basic mode (lower barrier to entry). The mode switcher must be prominent, accessible, and frictionless — always visible during active matches so users can discover and try Guided mode naturally. Preference is saved in Account.preferences.

### Dependencies

Stored in Account.preferences (UserPreferences model).

---

## DD-013: Multi-Player Match Support

**Status:** Decided | **Priority:** Medium | **Affects:** MATCH_EXPERIENCE.md, MATCH_LINKING.md, data models

### Context

Warhammer 40K supports multiplayer games (3-4 players). Should V1 support this?

### Options

| Option | Pros | Cons |
|--------|------|------|
| **1v1 only for V1** | Simpler implementation, covers 95%+ of matches | Excludes multiplayer games, limits appeal |
| **Up to 4 players** | Full coverage of game formats, future-proof | More complex sync, UI needs to show 3-4 players, more testing |
| **Configurable** | Maximum flexibility | Over-engineering if nobody uses >2 players initially |

### Decision

**Configurable (no player limit).** Design data models and sync architecture with a participants array rather than hardcoded player1/player2. Build the V1 UI primarily for 1v1 but ensure the underlying architecture supports any number of players without refactoring. This prevents costly data model migrations later.

### Dependencies

Affects match linking architecture (MATCH_LINKING.md) — participants array instead of opponent field.

---

## DD-014: Match Data Validation Architecture

**Status:** Decided | **Priority:** High | **Affects:** MATCH_EXPERIENCE.md, MATCH_LINKING.md

### Context

How to ensure match data integrity between linked players. Prevents cheating (inflating VP, hiding CP usage).

### Options

| Option | Pros | Cons |
|--------|------|------|
| **Server-validated (all writes go through server)** | Most reliable, tamper-proof | Requires server infrastructure, higher latency, single point of failure |
| **P2P hash comparison** | Serverless, cryptographic proof of integrity | Complex implementation, doesn't prevent real-time lying (only detects after) |
| **Honor system + audit log** | Simplest, trust players, log everything | No actual anti-cheat, relies on social pressure |
| **Mutual visibility + end reconciliation** | Transparent — both see each other's data, dispute at end | Doesn't prevent errors, just makes them visible |

### Decision

**Mutual visibility + end-of-match reconciliation.** This mirrors how physical tabletop works: both players watch each other's scorecard. VP, CP, and optionally HP are visible to both players in real-time. At match end, both apps compare final states and flag discrepancies for manual resolution. Hash chain verification can be added in V2 for tournament play.

### Dependencies

Implemented via match linking sync (MATCH_LINKING.md).

---

## DD-015: Offline Support Strategy

**Status:** Decided | **Priority:** High | **Affects:** All features, data architecture

### Context

What level of offline functionality should the app support? Users often play at game stores with poor WiFi.

### Options

| Option | Pros | Cons |
|--------|------|------|
| **Online-only** | Simplest, no sync complexity | Unusable at game stores with poor WiFi, bad UX |
| **Offline army building + online matches** | Covers the most common offline use case (list building at home) | Matches fail without connectivity, frustrating mid-game |
| **Full offline with sync** | Best UX, works anywhere | Extremely complex sync/conflict resolution, data consistency nightmares |
| **Progressive** | Pragmatic middle ground — faction data cached, armies editable offline, matches need connectivity for linking but tolerate brief drops | Still complex, need clear offline/online UX indicators |

### Decision

**Full offline with sync.** Everything works offline — army building, match tracking (local state), campaign progression, reference browsing. Conflict resolution on reconnect uses last-write-wins for player-owned fields and server timestamp for shared fields. Match linking requires initial connectivity but the match itself tolerates full disconnection with sync on reconnect. Leverages existing adapter pattern (Platform.IndexedDB on web, Platform.SQLite on mobile).

### Dependencies

Leverages existing adapter pattern (Platform.IndexedDB, Platform.SQLite).

---

## Dependency Map

```
DD-001 (The Forge)      ←── DD-006 (Deploy) — accessed from The Forge
DD-005 (Command Post)   ←── DD-006 (Deploy) — combat view leads to Command Post
DD-004 (Allies)         ←── DD-010 (Social Value) — name reflects value
DD-011 (< 768px)        ←── DD-007, DD-008, DD-009 — all modal/overlay patterns follow this breakpoint
DD-012 (Basic default)  ←── DD-014 (Validation) — guided mode surfaces more anti-cheat data
DD-013 (Configurable)   ←── DD-014 (Validation) — more players = more complex validation
DD-015 (Full offline)   ←── DD-014 (Validation) — offline affects what validation is possible
```

## Revision History

All 15 decisions resolved on 2026-02-09.
