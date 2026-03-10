# Phase 4 — Campaign and Social (Weeks 14-17)

> Phase: 4 | Timeline: Weeks 14-17 | Pages: 7
> Stories: 34 | UX Issues: 21 | Conflicts: C-06, C-07
> Mockup Dependencies: Campaign Management Page, Campaign Summary/Completed

## Overview

Phase 4 delivers the campaigns system and the Allies (social) page. It depends on the match creation drawer from Phase 3 and the Unit Detail Drawer from Phase 2. Campaign match creation reuses the Phase 3 drawer with a contextual prop object (C-07), so Phase 3 must be functionally complete before campaign match flows are built.

The two pending mockups (Campaign Management Page, Campaign Summary/Completed) will refine the final layout of §7.2, §7.6, and the completed-campaign view in §7.3. Work on all Phase 4 sections can proceed in parallel; mockups will inform final polish when delivered.

---

## Cross-References

- Parent: `docs/frontend/FRONTEND_PLAN.md`
- Pre-requisites: [PHASE_0_SHARED_PREREQUISITES.md](PHASE_0_SHARED_PREREQUISITES.md) (stream facade contracts §2.3, mockup gates §5), [SHARED_COMPONENTS.md](SHARED_COMPONENTS.md)
- Upstream: Phase 1 (shell, auth), Phase 2 (Unit Detail Drawer — reference mode used by campaign unit page), Phase 3 (match creation drawer — required by §7.3 and §7.5)
- Parallel: Can run alongside Phase 3 (§7.7 Allies has no match dependency). Campaign match creation (§7.5) must wait for Phase 3 drawer to be complete.

---

## Pages

### 7.1 Campaigns List

**Route:** `/[gameSystem]/campaigns`
**Complexity:** M | **Estimated Effort:** 3 days
**Stories:** CPG-10, CPG-11, CPG-13
**UX Issues:** CP-01, CP-02, CP-03, CP-04
**Mockup Dependency:** Campaign Summary/Completed (CP-04) — implementation proceeds with reference design; mockup refines final layout

**Implementation Notes:**

- Campaign cards grouped by status: Active, Upcoming, Completed. User's campaigns and joined campaigns in separate sections.
- Each card shows name, organizer, participant count, current round, and dates. State badges render per campaign status: Created, Upcoming, Active, Completed.
- Filter by status and role (organizer vs participant). Sort by date.
- Empty state: "Create Campaign" CTA for organizers, "Browse Campaigns" for participants.

**Story gaps and fixes:**

- **CPG-10 (PARTIAL — join flow):** Campaigns List includes a "Browse / Join" section for public campaigns. Tapping a joinable campaign opens a join confirmation sheet where the user selects which army to register. Army selection is required before joining.
- **CPG-11 (MISSING — remove FAB):** No floating action button on this page. Campaign creation is triggered only by a "New Campaign" button in the page header. Resolves CP-01.
- **CPG-13 (PARTIAL — read-only summary):** Completed campaigns do NOT navigate to the Campaign Dashboard. They navigate to the Campaign Summary (read-only) view. This is a separate navigation branch; the route diverges based on `campaign.status === 'completed'`. Resolves CP-04. Awaiting Campaign Summary mockup to refine final layout.

**UX issue resolutions:**

- **CP-01:** FAB removed; header button only (see CPG-11).
- **CP-02:** Color hierarchy enforced per G-11. Primary action ("New Campaign", "Join") uses the primary accent color. State badges and secondary labels use subordinate colors.
- **CP-03:** Organizer-only "Delete" action on campaign cards. Deletion requires a typed confirmation (enter campaign name). Soft-delete; participant data retained 30 days.
- **CP-04:** Completed campaigns route to Campaign Summary. Mockup refines final layout; implementation proceeds with reference design.

---

### 7.2 Campaign Creation

**Route:** `/[gameSystem]/campaigns/new`
**Complexity:** L | **Estimated Effort:** 4 days
**Stories:** CPG-08, CPG-09, CPG-23
**UX Issues:** CD-09, CD-12
**Mockup Dependency:** Campaign Management Page (CD-09 — shared layout) — implementation proceeds with reference design; mockup refines final layout

> **C-06 Resolution:** Player invitation has been removed from campaign creation. The creation form collects campaign metadata only. Participants are managed post-creation via §7.6. See C-06 in `docs/_scratch_consolidated.md`.

**Implementation Notes:**

- Multi-step form fields: name, description, format (Escalation, Narrative, League), point limits, round count, schedule, army restrictions, scoring rules.
- No friends selector. No player invitation step.
- On creation: campaign state is set to `Created`, organizer becomes the first participant.
- **CPG-09 (PARTIAL — Crusade fields not named):** When format is set to "Crusade", two additional fields appear: `CrusadeRules.startingSupplyLimit` and `CrusadeRules.startingRequisitionPoints`. Both fields are required when format is Crusade; hidden for all other formats.
- **CPG-23 (CONFLICT resolved as C-06):** No friends selector. The plan originally included "Player invitation: search by username, friend list, or invite link" in §7.2. That step is removed. Invitation lives in §7.6.
- **CPG-21 (MISSING — shared component):** Campaign Creation and Campaign Management share one form component, parameterized by `mode: 'create' | 'manage'`. In create mode all fields are empty and submission creates the record. In manage mode fields are pre-populated and changes update the existing campaign. Routes remain separate (`/new` vs `/manage`). This sharing means §7.2 and §7.6 must be implemented together or sequenced so the shared component is extracted first.

**UX issue resolutions:**

- **CD-12:** Friends selector removed from creation (C-06).
- **CD-09:** Creation page is structurally identical to Campaign Management in empty state. Share one form component.

---

### 7.3 Campaign Dashboard

**Route:** `/[gameSystem]/campaigns/[campaignId]`
**Complexity:** L | **Estimated Effort:** 5 days
**Stories:** CPG-01, CPG-02, CPG-03, CPG-07, CPG-13, CPG-14, CPG-15, CPG-16, CPG-17, CPG-18, CPG-19, CPG-20
**UX Issues:** CD-01, CD-02, CD-03, CD-04, CD-05, CD-06, CD-07, CD-08
**Mockup Dependency:** Campaign Management Page (CD-07) — implementation proceeds with reference design; mockup refines navigation target layout

**Implementation Notes:**

- Campaign hub page: leaderboard, current round, upcoming match pairings, recent results, participant list, campaign rules summary, news/announcements.
- Actions vary by role: organizer sees "Manage" button; all participants see "Play Match" button.

**Story gaps and fixes:**

- **CPG-01/02/03 (MAPPED):** Campaign detail, standings, and participant list are all present.
- **CPG-07 (MISSING — leave campaign):** A "Leave Campaign" action is available to non-organizer participants via the page overflow menu. Displays a confirmation dialog before removing the participant. Organizers cannot leave; they must transfer ownership or delete.
- **CPG-13 (PARTIAL — read-only mode):** When `campaign.status === 'completed'`, the dashboard renders in read-only summary mode. All editing actions are hidden. A summary card at top shows final standings, campaign duration, and winner. Branching: Campaigns List links completed campaigns to this read-only mode (or optionally a separate Campaign Summary route per CP-04).
- **CPG-14 (MISSING — standings at bottom):** Standings/leaderboard section renders at the bottom of the page, below current round and upcoming matches.
- **CPG-15 (MISSING — army card left):** In participant list rows, the army card is positioned to the left of the campaign info block.
- **CPG-16 (MISSING — no phase progress bar):** No phase progress bar or step indicator widget on this page.
- **CPG-17 (MISSING — no player count):** Player count is not shown as a standalone metric in the header or summary card.
- **CPG-18 (MISSING — header layout):** No separate page header component. Campaign name is displayed prominently at top. Two action buttons in the header: "Play Match" (opens match creation drawer) and "Manage" (organizer-only, navigates to §7.6).
- **CPG-19 (MISSING — manage icon):** "Manage" button includes a settings/gear icon.
- **CPG-20 (MISSING — drawer not auto-opened):** Match creation drawer does NOT open automatically on page load. It opens only when the user explicitly taps "Play Match".

**UX issue resolutions:**

- **CD-01:** Standings at bottom of page (CPG-14).
- **CD-02:** Army card left of campaign info in participant rows (CPG-15).
- **CD-03:** Phase progress bar removed (CPG-16).
- **CD-04:** Player count metric removed (CPG-17).
- **CD-05:** No separate page header; campaign name at top; action buttons upper-right (CPG-18). Aligns with G-10.
- **CD-06:** Manage button includes gear icon (CPG-19).
- **CD-07:** Awaiting Campaign Management Page mockup to refine navigation target; implementation proceeds with reference design.
- **CD-08:** Match creation drawer not auto-opened (CPG-20).

---

### 7.4a Campaign Units (Crusade Mechanics)

**Route:** `/[gameSystem]/campaigns/[campaignId]/units/[unitId]` (crusade overlay)
**Complexity:** L | **Estimated Effort:** 5 days
**Stories:** CPG-04
**UX Issues:** None assigned to this section
**Mockup Dependency:** Unit Detail Drawer Single Model, Unit Detail Drawer Multi Model (from Phase 2) — implementation proceeds with Phase 2 reference design; mockups refine final layout

**Implementation Notes:**

- Uses the Unit Detail Drawer in read-only reference context (Constraint A from Phase 2). No editing of unit stats here; campaign data is overlaid.
- **CPG-04 (MAPPED):** Crusade unit view shows XP, rank, battle honours, battle scars, kill tally, and matches played. Rank-up logic is threshold-based. Battle honours and battle scars are selectable from the ruleset list with undo before save. "Dealer of Death" and "Marked for Greatness" designations tracked per post-match prompts.
- Additional overlay fields per campaign match: matches played, kills, deaths, link back to source match.
- Narrative campaigns may expose unit progression (experience, upgrades, injuries) via game system plugin data structure.
- Offline: queue progression changes locally, mark unsynced, sync on reconnect.
- Awaiting Phase 2 Unit Detail Drawer mockups (single-model and multi-model layouts) to refine final layout; implementation proceeds with existing Phase 2 reference design.

---

### 7.5 Campaign Matches

**Route:** `/[gameSystem]/campaigns/[campaignId]/matches`
**Complexity:** M | **Estimated Effort:** 3 days
**Stories:** MCD-06, MCD-07, CPG-22
**UX Issues:** CD-10, CD-11
**Mockup Dependency:** None

> **C-07 Resolution:** Match creation from campaign context uses the Phase 3 match creation drawer with a context object. The drawer receives `{ armyId: string; campaignId: string; opponentScope: 'campaign-participants' }`. Army selector is omitted (armyId known). Opponent list is scoped to `CampaignParticipant` records for this campaign only. See C-07 in `docs/_scratch_consolidated.md`.

**Implementation Notes:**

- Match history and scheduling per campaign. Reuses match card components from War Ledger (§6.1).
- Grouped by round. Shows pairings, results, scores.
- "Report Match" action: link an existing match to the campaign round. Organizer can override reported results.
- Match creation shortcut: tapping "Play Match" on §7.3 opens the drawer pre-populated with campaign context.

**Story gaps and fixes:**

- **MCD-06 (PARTIAL — army pre-assignment):** When the drawer is opened from Campaign Detail ("Play Match"), `armyId` is supplied in context. The army selector step is skipped entirely. The participant's registered army for this campaign is pre-assigned. A read-only "Playing as: [Army Name]" confirmation row is shown instead of the selector.
- **MCD-07 (MAPPED):** Crusade agenda selection is available as an additional step in campaign match creation. Shown only when the campaign format is "Crusade".
- **CPG-22 (PARTIAL — opponent scoping):** Opponent selector is populated exclusively from `CampaignParticipant` records for this campaign. No friend-list search. No free-text opponent entry. Resolves CD-11.

**UX issue resolutions:**

- **CD-10:** Army selector omitted when drawer opened from campaign context. Same rule as MC-01 from Phase 3.
- **CD-11:** Opponents restricted to campaign participants only (CPG-22).

---

### 7.6 Campaign Management

**Route:** `/[gameSystem]/campaigns/[campaignId]/manage`
**Complexity:** L | **Estimated Effort:** 5 days
**Stories:** CPG-05, CPG-06, CPG-07, CPG-12, CPG-21
**UX Issues:** CD-07, CD-09
**Mockup Dependency:** Campaign Management Page (CD-07) — implementation proceeds with reference design; mockup refines final layout

**Implementation Notes:**

- Organizer-only page (role-gated).
- Shares the same form component as §7.2 (`mode: 'manage'`). Fields are pre-populated; changes update the existing campaign.
- Per CD-09: structurally identical to Campaign Creation in empty state. Implement as one component.
- **CPG-05 (MAPPED):** Organizer can edit campaign settings (rules, point limits, schedule), manage participants, and advance campaign phases (Created → Upcoming → Active → Completed).
- **CPG-06 (MAPPED):** Participant invitation lives here, not in creation. Organizer can search by username, use friend list, or generate an invite link. Handles accept/reject of join requests.
- **CPG-07 (MISSING — leave campaign — note):** Leave campaign action is on the Dashboard (§7.3), not here. Management page handles organizer-level administration only.
- **CPG-12 (MISSING — delete campaign):** "Delete Campaign" action on this page. Requires typed confirmation (enter campaign name). Soft-delete; participant data retained 30 days per data retention policy.
- **CPG-21 (MISSING — shared component):** See §7.2. The form component is shared. Routes remain separate.

**UX issue resolutions:**

- **CD-07:** Awaiting Campaign Management Page mockup; implementation proceeds with reference design.
- **CD-09:** Shared component with §7.2 (creation in empty state = management before any data is saved).

---

### 7.7 Allies (Social)

**Route:** `/[gameSystem]/social`
**Complexity:** M | **Estimated Effort:** 4 days
**Stories:** ALY-01, ALY-02, ALY-03, ALY-04, ALY-05, ALY-06, ALY-07, ALY-08, ALY-09
**UX Issues:** SA-01, SA-02, SA-03, SA-04, SA-05
**Mockup Dependency:** None

**Implementation Notes:**

- Friend list management: accepted friends, pending requests (sent and received), blocked users.
- Friend cards show display name, avatar, last active timestamp, and game systems in common.
- Quick actions per friend: challenge to match, invite to campaign.
- Real-time friend request notifications via `@armoury/streams` (WebSocket or polling).
- Privacy controls: block user, hide online status.
- Offline: queue accept/reject responses locally; sync on reconnect.

**Story gaps and fixes:**

- **ALY-01 (PARTIAL — four send methods not enumerated):** "Add Friend" flow uses a tabbed sheet with four methods: (1) Search by username, (2) Enter friend code, (3) Scan QR code (mobile only, camera-gated), (4) NFC tap (mobile/Android only, hidden on unsupported devices with fallback to code entry). All four tabs must be present. Non-supported platform tabs are hidden, not disabled. Resolves SA-05.
- **ALY-02 (MAPPED):** Accept or decline incoming requests. Incoming requests render at the top of the page, above filters.
- **ALY-03 (MAPPED):** Friends list with presence indicators (online, offline, last active).
- **ALY-04 (MAPPED):** Remove a friend via the three-dot action menu.
- **ALY-05 (MAPPED):** Block a user via the three-dot action menu.
- **ALY-06 (MAPPED):** "Invite to Match" action per friend row.
- **ALY-07 (PARTIAL — always-visible menu):** The three-dot action menu on friend rows is always visible, not hover-only. On mobile, tapping the row anywhere opens the action sheet; the three-dot icon is a persistent affordance, not conditional on hover state. Resolves SA-01.
- **ALY-08 (PARTIAL — tap affordance):** Friend rows have a visible interactive state (background highlight or border on press). The tap target must be at least 44px tall. Affordance must be unambiguous on touch devices. Resolves SA-02.
- **ALY-09 (MAPPED):** Filter controls (online status, alphabetical, recently active) render below the incoming requests section.

**UX issue resolutions:**

- **SA-01:** Three-dot menu always visible, not hover-only (ALY-07).
- **SA-02:** Clear tap affordance on friend rows (ALY-08). 44px minimum touch target.
- **SA-03 (DEFER):** Filter placement below requests section (ALY-09 MAPPED, SA-03 deferred as polish).
- **SA-04:** Friend code (own) accessible from the profile popover per G-08. Verified from Allies page by opening profile popover.
- **SA-05:** Add friend tabbed flow enumerates all four methods (ALY-01).

---

## Story Coverage Matrix

| Story  | Page           | Status              | Notes                                                 |
| ------ | -------------- | ------------------- | ----------------------------------------------------- |
| ALY-01 | 7.7 Allies     | PARTIAL → Fixed     | Four send methods enumerated: username, code, QR, NFC |
| ALY-02 | 7.7 Allies     | MAPPED              | Accept/decline requests                               |
| ALY-03 | 7.7 Allies     | MAPPED              | Friends list with presence                            |
| ALY-04 | 7.7 Allies     | MAPPED              | Remove friend                                         |
| ALY-05 | 7.7 Allies     | MAPPED              | Block user                                            |
| ALY-06 | 7.7 Allies     | MAPPED              | Invite to match                                       |
| ALY-07 | 7.7 Allies     | PARTIAL → Fixed     | Always-visible three-dot menu                         |
| ALY-08 | 7.7 Allies     | PARTIAL → Fixed     | Explicit tap affordance, 44px target                  |
| ALY-09 | 7.7 Allies     | MAPPED              | Filters below incoming requests                       |
| CPG-01 | 7.3 Dashboard  | MAPPED              | Campaign detail view                                  |
| CPG-02 | 7.3 Dashboard  | MAPPED              | Standings/rankings                                    |
| CPG-03 | 7.3 Dashboard  | MAPPED              | Participants with armies + presence                   |
| CPG-04 | 7.4a Crusade   | MAPPED              | Crusade unit XP/rank/honours/scars                    |
| CPG-05 | 7.6 Management | MAPPED              | Organizer edit settings, manage, advance              |
| CPG-06 | 7.6 Management | MAPPED              | Invite players (lives in management)                  |
| CPG-07 | 7.3 Dashboard  | MISSING → Fixed     | Leave campaign in overflow menu                       |
| CPG-08 | 7.2 Creation   | MAPPED              | Create campaign form                                  |
| CPG-09 | 7.2 Creation   | PARTIAL → Fixed     | CrusadeRules fields named explicitly                  |
| CPG-10 | 7.1 List       | PARTIAL → Fixed     | Join flow with army selection explicit                |
| CPG-11 | 7.1 List       | MISSING → Fixed     | FAB removed; header button only                       |
| CPG-12 | 7.6 Management | MISSING → Fixed     | Delete campaign with typed confirmation               |
| CPG-13 | 7.1 / 7.3      | PARTIAL → Fixed     | Read-only summary mode for completed                  |
| CPG-14 | 7.3 Dashboard  | MISSING → Fixed     | Standings at bottom                                   |
| CPG-15 | 7.3 Dashboard  | MISSING → Fixed     | Army card left of campaign info                       |
| CPG-16 | 7.3 Dashboard  | MISSING → Fixed     | Phase progress bar removed                            |
| CPG-17 | 7.3 Dashboard  | MISSING → Fixed     | Player count removed                                  |
| CPG-18 | 7.3 Dashboard  | MISSING → Fixed     | Header layout: name + Play Match + Manage             |
| CPG-19 | 7.3 Dashboard  | MISSING → Fixed     | Manage button includes gear icon                      |
| CPG-20 | 7.3 Dashboard  | MISSING → Fixed     | Drawer not auto-opened on load                        |
| CPG-21 | 7.2 / 7.6      | MISSING → Fixed     | Shared form component with mode prop                  |
| CPG-22 | 7.5 Matches    | PARTIAL → Fixed     | Opponent scoped to campaign participants              |
| CPG-23 | 7.2 Creation   | CONFLICT → Resolved | C-06: friends selector removed from creation          |
| MCD-06 | 7.5 Matches    | PARTIAL → Fixed     | Army pre-assigned, selector omitted                   |
| MCD-07 | 7.5 Matches    | MAPPED              | Crusade agenda selection for campaign match           |

---

## UX Issue Resolution Matrix

| Issue | Section        | Severity | Resolution                                                                                                        |
| ----- | -------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| CP-01 | 7.1 List       | 🟡       | INCORPORATE — FAB removed; header-only "New Campaign" button                                                      |
| CP-02 | 7.1 List       | 🟡       | INCORPORATE — G-11 color hierarchy enforced on list page                                                          |
| CP-03 | 7.1 List       | 🟡       | INCORPORATE — Organizer delete with typed confirmation                                                            |
| CP-04 | 7.1 / 7.3      | 🔴       | INCORPORATE — requires Campaign Summary mockup for final layout; implementation proceeds with reference design    |
| CD-01 | 7.3 Dashboard  | 🟡       | INCORPORATE — Standings at bottom (CPG-14)                                                                        |
| CD-02 | 7.3 Dashboard  | 🟡       | INCORPORATE — Army card left of campaign info (CPG-15)                                                            |
| CD-03 | 7.3 Dashboard  | 🟡       | INCORPORATE — Phase progress bar removed (CPG-16)                                                                 |
| CD-04 | 7.3 Dashboard  | 🟡       | INCORPORATE — Player count removed (CPG-17)                                                                       |
| CD-05 | 7.3 Dashboard  | 🟡       | INCORPORATE — No page header; campaign name at top; buttons upper-right                                           |
| CD-06 | 7.3 Dashboard  | 🟢       | INCORPORATE — Manage button gets gear icon (CPG-19)                                                               |
| CD-07 | 7.6 Management | 🔴       | INCORPORATE — Campaign Management Page mockup refines final layout; implementation proceeds with reference design |
| CD-08 | 7.3 Dashboard  | 🔴       | INCORPORATE — Drawer not auto-opened on Campaign Detail load                                                      |
| CD-09 | 7.2 / 7.6      | 🟡       | INCORPORATE — Shared form component (CPG-21)                                                                      |
| CD-10 | 7.5 Matches    | 🔴       | INCORPORATE — Army selector omitted when context provides armyId (C-07)                                           |
| CD-11 | 7.5 Matches    | 🔴       | INCORPORATE — Opponents scoped to campaign participants only (CPG-22)                                             |
| CD-12 | 7.2 Creation   | 🟡       | INCORPORATE — Friends selector removed (C-06)                                                                     |
| SA-01 | 7.7 Allies     | 🟡       | Three-dot menu always visible (ALY-07)                                                                            |
| SA-02 | 7.7 Allies     | 🟡       | Tap affordance explicit, 44px target (ALY-08)                                                                     |
| SA-03 | 7.7 Allies     | 🟢       | DEFER — filter placement is a polish item                                                                         |
| SA-04 | 7.7 Allies     | 🟡       | Friend code in profile popover (G-08 cross-ref)                                                                   |
| SA-05 | 7.7 Allies     | 🟡       | Four add-friend methods in tabbed sheet (ALY-01)                                                                  |
| G-06  | Global         | 🔴       | INCORPORATE — No trademark violations; all imagery must be AI-generated                                           |

---

## Mockup Dependencies

> **Consolidated registry**: The full cross-phase mockup dependency registry is maintained in [PHASE_0_SHARED_PREREQUISITES.md §5](PHASE_0_SHARED_PREREQUISITES.md#5-mockup-delivery-registry). The table below covers Phase 4-specific impact details.

Two mockups from `docs/_scratch_consolidated.md` Section C are pending for this phase:

| Mockup                       | Related Issues | Blocks                                                     | Notes                                                                                                                                                                                                  |
| ---------------------------- | -------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Campaign Management Page     | CD-07, CD-09   | §7.6 Campaign Management, §7.2 Campaign Creation           | Both §7.2 and §7.6 share one form component. Mockup refines the shared layout; both sections proceed with reference design. Schedule in Weeks 13-14.                                                   |
| Campaign Summary (Completed) | CP-04          | §7.1 Campaigns List navigation branch, §7.3 read-only mode | Completed campaigns navigate here instead of Campaign Detail. Mockup refines the navigation branch and read-only summary card; implementation proceeds with reference design. Schedule in Weeks 13-14. |

All Phase 4 sections can begin in Week 14. Mockups will refine the final layout of the sections listed above when delivered.

---

## State Management for Phase 4

Phase 4 introduces campaign lifecycle state and social/presence features. Campaign data follows the React Query pattern established in earlier phases. The social layer introduces new RxJS streams for real-time friend presence and campaign notifications. See [State Management Architecture](./STATE_MANAGEMENT.md) for the complete decision tree.

### Tier 1: Local UI State (`useState`)

| Entity                                      | Component(s)           | Notes                                                     |
| ------------------------------------------- | ---------------------- | --------------------------------------------------------- |
| Campaign creation form state                | `CampaignCreationForm` | Multi-step form; Crusade format reveals additional fields |
| Join confirmation sheet open                | `CampaignJoinSheet`    | Includes army selection                                   |
| Campaign management dialogs                 | `CampaignManagement`   | Delete confirmation (typed input), invite flow            |
| Add Friend sheet tab (username/code/QR/NFC) | `AddFriendSheet`       | Platform-gated tabs (NFC: mobile only)                    |
| Friend request action state                 | `FriendRow`            | Accept/reject loading indicators                          |
| Crusade unit post-match prompts             | `PostMatchPrompts`     | Dealer of Death, Marked for Greatness selections          |

### Tier 2: URL State

| Entity                                             | Route/Params                                        | Stories |
| -------------------------------------------------- | --------------------------------------------------- | ------- |
| Campaign ID                                        | `/[gameSystem]/campaigns/[campaignId]` path segment | CPG-01  |
| Campaign sub-page (dashboard/units/matches/manage) | `?view=dashboard`                                   | CPG-02  |
| Allies filters                                     | `?filter=online` or `?filter=pending`               | SA-01   |

### Tier 3: Remote State (React Query)

| Entity                                              | Query Key Factory                                          | Caching Strategy                                                 | Stories                |
| --------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------- |
| Campaign list                                       | `campaignListOptions(userId)`                              | `staleTime: 60_000`; grouped by status                           | CPG-10, CPG-11, CPG-13 |
| Campaign detail                                     | `campaignDetailOptions(campaignId)`                        | `staleTime: 30_000`; invalidate on state transition              | CPG-01, CPG-02         |
| Campaign participants + standings                   | `campaignParticipantsOptions(campaignId)`                  | `staleTime: 60_000`; refetch on focus                            | CPG-03, CPG-04         |
| Campaign creation mutation                          | `createCampaignMutation`                                   | Invalidates `campaignListOptions` on success                     | CPG-14, CPG-15         |
| Campaign state transition mutations                 | `transitionCampaignMutation`                               | Invalidates `campaignDetailOptions`; organizer-only              | CPG-20, CPG-21         |
| Crusade unit progression (XP, rank, honours, scars) | `crusadeUnitOptions(campaignId, unitId)`                   | `staleTime: 120_000`; linked to campaign match results           | CPG-05, CPG-06         |
| Friend list                                         | `friendListOptions(userId)`                                | `staleTime: 30_000`; invalidate on add/remove/accept             | SA-01, SA-02           |
| Friend request mutations                            | `sendFriendRequestMutation`, `acceptFriendRequestMutation` | Invalidates `friendListOptions` on success                       | SA-04, SA-05           |
| Campaign match creation                             | Reuses Phase 3 `createMatchMutation` with campaign context | Same pattern; `armyId` + `campaignId` + `opponentScope` injected | CPG-07, CPG-08         |

### Tier 4: Reactive Global State (RxJS)

Phase 4 adds social presence and campaign notification streams.

| Entity                                          | Observable Source                                   | Transport         | Stories      |
| ----------------------------------------------- | --------------------------------------------------- | ----------------- | ------------ |
| Friend online/offline presence                  | `FriendPresenceStream` via `@armoury/streams`       | WebSocket/polling | SA-02, SA-03 |
| Campaign invite notifications                   | `CampaignNotificationStream` via `@armoury/streams` | WebSocket/polling | CPG-12       |
| Campaign match state (in active campaign match) | Reuses Phase 3 `MatchStream`                        | Same transport    | CPG-07       |

**Architecture pattern:** Social streams follow the same `BehaviorSubject` + `useSyncExternalStore` pattern as Phase 3 match streams. The `FriendPresenceStream` is mounted at the app shell level (always active when authenticated). Campaign notification streams are mounted at the campaign layout level. See [RXJS_STATE.md](../RXJS_STATE.md) for the full pattern.

### Derived State Patterns

| Entity                       | Derived From                                       | Notes                                       |
| ---------------------------- | -------------------------------------------------- | ------------------------------------------- |
| Campaign status grouping     | Campaign list + status field                       | Groups: active, pending, completed          |
| Participant standings        | Campaign participants + match results              | Computed ranking per campaign rules         |
| Crusade unit eligibility     | Unit data + campaign XP/rank                       | Determines available honours/scars          |
| Friend list with presence    | Friend list (React Query) + presence stream (RxJS) | Merged at the component level via `useMemo` |
| Available campaign opponents | Campaign participants - self                       | Filtered for match creation drawer          |

See [Derived State Patterns](../DERIVED_STATE.md) for implementation guidance.

### Cross-References

- [State Management Architecture](./STATE_MANAGEMENT.md) — Complete state hierarchy and decision tree
- [§6 React Query](../REACT_QUERY.md) — Server state caching, mutations, optimistic updates
- [§7 RxJS](../RXJS_STATE.md) — Reactive global state, observables, social presence streams
- [§9 Derived State](../DERIVED_STATE.md) — Computed state patterns, memoization
- [§11 Testing](../STATE_TESTING.md) — Testing each state tier

---

## Acceptance Criteria

Phase 4 is complete when all of the following are true:

1. **Campaigns List (7.1):** Campaigns grouped by status with state badges. Join confirmation sheet includes army selection. No FAB present. Completed campaigns route to Campaign Summary (not Dashboard). Color hierarchy enforces G-11.

2. **Campaign Creation (7.2):** Multi-step form with no friends selector. Crusade format reveals `startingSupplyLimit` and `startingRequisitionPoints` fields. Shares one component with §7.6 via `mode` prop.

3. **Campaign Dashboard (7.3):** Header shows campaign name, "Play Match", and "Manage" buttons. No page header component. No phase progress bar. No standalone player count. Army cards left-aligned in participant rows. Standings at bottom. Match creation drawer opens only on explicit user action. Completed state renders read-only summary. Leave Campaign available in overflow menu.

4. **Campaign Units/Crusade (7.4a):** Unit progression (XP, rank, honours, scars) visible in read-only Unit Detail Drawer overlay. Post-match prompts for Dealer of Death and Marked for Greatness work correctly.

5. **Campaign Matches (7.5):** Match creation drawer opens with campaign context (`armyId` + `campaignId` + `opponentScope: 'campaign-participants'`). Army selector step is absent. Crusade agenda step present for Crusade-format campaigns. Opponent list contains only campaign participants.

6. **Campaign Management (7.6):** Organizer-only, role-gated. Delete campaign with typed confirmation. Participant invitation flow (username search, friend list, invite link) present here and not in creation. Campaign state transitions work. Mockup refines final layout; implementation proceeds with reference design.

7. **Allies (7.7):** Add Friend sheet has four tabs (username, code, QR, NFC) with platform gating. Three-dot action menu always visible on friend rows. Tap affordance meets 44px touch target. Incoming requests render above filters. Own friend code accessible from profile popover.

8. **All 34 stories** pass acceptance on web and mobile. PARTIAL and MISSING stories are verified against the fixes documented in this file.

9. **All 21 UX issues** addressed or explicitly deferred (SA-03 is the only defer).

10. Both pending mockups (Campaign Management Page, Campaign Summary/Completed) are incorporated into the final layout of §7.2, §7.6, and completed-campaign view when delivered.

## Acceptance Test Checklist

> These tests verify Phase 4 is complete. Each item maps to a specific acceptance criterion or component defined above.

### End-to-End Acceptance Tests

- [ ] Campaigns List at `/[gameSystem]/campaigns` groups campaigns by status with correct `CampaignStatus` badges; COMPLETED campaigns route to Campaign Summary, not the Dashboard.
- [ ] `CampaignJoinSheet` presents the user's eligible armies before confirming; joining without selecting an army is blocked.
- [ ] Campaign Creation multi-step form at `/[gameSystem]/campaigns/new` reveals `startingSupplyLimit` and `startingRequisitionPoints` fields only when Crusade format is selected in step 2.
- [ ] Campaign Dashboard header shows campaign name, "Play Match" button, and "Manage" button with no standalone page header component and no phase progress bar.
- [ ] Match Creation Drawer opened from Campaign Matches omits the army selector step and includes the Crusade agenda step for Crusade-format campaigns; opponent list contains only campaign participants.
- [ ] Campaign Management page (organizer-only) renders participant invitation controls (username search, friend list, invite link) and a delete campaign flow requiring typed confirmation.
- [ ] Allies page Add Friend sheet renders all four tabs (username, code, QR, NFC); NFC tab is hidden on platforms without NFC support.
- [ ] Incoming friend requests render above the filter bar on the Allies page; each friend row has a visible three-dot action menu.

### Component Tests (Orchestrational)

- [ ] `CampaignListContainer` fetches via `campaignListOptions`, groups results by `CampaignStatus`, and passes grouped data and the join-sheet open callback to `CampaignListView`.
- [ ] `CampaignFormContainer` in `mode='create'` calls `createCampaignMutation` on submit; in `mode='manage'` calls `updateCampaignMutation`; both modes share the same `CampaignCreationForm` child.
- [ ] `CampaignDashboardContainer` subscribes to `CampaignNotificationStream` and re-renders match cards when a new match notification arrives without a full page refetch.
- [ ] `AlliesContainer` fetches via `friendListOptions`, subscribes to `FriendPresenceStream`, and reflects online/offline status changes reactively.
- [ ] `CampaignDashboardContainer` renders a read-only summary view when campaign status is COMPLETED, with no "Play Match" or "Manage" buttons present.

### Hook / Query Tests

- [ ] `campaignListOptions` query factory returns campaigns partitioned into UPCOMING, ACTIVE, and COMPLETED arrays; cache is invalidated after `createCampaignMutation` success.
- [ ] `campaignDetailOptions` returns the full campaign shape including participants, standings, and match history; re-fetches after any match within the campaign completes.
- [ ] `friendListOptions` returns friends annotated with presence status from `FriendPresenceStream`; offline friends appear but are visually de-emphasised.
- [ ] `CampaignNotificationStream` emits typed notification events; `CampaignDashboardContainer` filters events by `campaignId` and discards events for other campaigns.

### Accessibility Tests

- [ ] `CampaignJoinSheet` traps focus while open; army radio buttons are navigable via arrow keys; closing via Escape returns focus to the triggering campaign card.
- [ ] Allies page Add Friend sheet tab bar has `role="tablist"` with `aria-selected` on the active tab; tab panels are linked via `aria-labelledby`.
- [ ] Campaign Management delete confirmation dialog announces the required confirmation phrase via `aria-describedby` on the text input.

---

## Code Example: Orchestrational / Render Pattern

> This example demonstrates the mandatory container/view split for Phase 4.
> The orchestrational container owns all data fetching, mutations, and state.
> The render component receives everything via props and contains zero hooks except `useCallback`/`useMemo`.

```tsx
// File: src/web/app/[gameSystem]/campaigns/page.tsx

import { useSuspenseQuery, useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState, useMemo } from 'react';
import type { Campaign } from '@shared/models/CampaignModel.js';
import type { Army } from '@wh40k10e/models/ArmyModel.js';
import type { CampaignStatus } from '@shared/types/enums.js';
import { campaignListOptions } from '@shared/frontend/queries/campaigns.js';
import { joinCampaignMutation } from '@shared/frontend/mutations/campaigns.js';
import { armyListOptions } from '@shared/frontend/queries/armies.js';

// ---------------------------------------------------------------------------
// Render component — pure props, zero data hooks
// ---------------------------------------------------------------------------

interface CampaignListViewProps {
    grouped: Record<CampaignStatus, Campaign[]>;
    joinSheetOpen: boolean;
    eligibleArmies: Army[];
    selectedArmyId: string | null;
    onOpenJoinSheet: (campaignId: string) => void;
    onCloseJoinSheet: () => void;
    onSelectArmy: (armyId: string) => void;
    onConfirmJoin: () => void;
}

export function CampaignListView({
    grouped,
    joinSheetOpen,
    eligibleArmies,
    selectedArmyId,
    onOpenJoinSheet,
    onCloseJoinSheet,
    onSelectArmy,
    onConfirmJoin,
}: CampaignListViewProps) {
    return (
        <>
            {(['UPCOMING', 'ACTIVE', 'COMPLETED'] as CampaignStatus[]).map((status) => (
                <section key={status} aria-label={`${status} campaigns`}>
                    <h2>{status}</h2>
                    <ul className="grid grid-cols-2 gap-4">
                        {grouped[status].map((c) => (
                            <CampaignCard key={c.id} campaign={c} onJoin={() => onOpenJoinSheet(c.id)} />
                        ))}
                    </ul>
                </section>
            ))}
            <JoinSheet
                open={joinSheetOpen}
                armies={eligibleArmies}
                selectedArmyId={selectedArmyId}
                onSelectArmy={onSelectArmy}
                onConfirm={onConfirmJoin}
                onClose={onCloseJoinSheet}
            />
        </>
    );
}

// ---------------------------------------------------------------------------
// Orchestrational container — data, mutations, join flow state; no JSX
// ---------------------------------------------------------------------------

export function CampaignListContainer({ gameSystem }: { gameSystem: string }) {
    const queryClient = useQueryClient();
    const { data: campaigns = [] } = useSuspenseQuery(campaignListOptions(gameSystem));
    const { data: armies = [] } = useSuspenseQuery(armyListOptions(gameSystem));

    const { mutate: joinCampaign } = useMutation(joinCampaignMutation(queryClient));

    const [joinTarget, setJoinTarget] = useState<string | null>(null);
    const [selectedArmyId, setSelectedArmyId] = useState<string | null>(null);

    const grouped = useMemo(() => {
        const g: Record<CampaignStatus, Campaign[]> = { UPCOMING: [], ACTIVE: [], COMPLETED: [] };
        campaigns.forEach((c) => g[c.status].push(c));
        return g;
    }, [campaigns]);

    const handleConfirmJoin = useCallback(() => {
        if (joinTarget && selectedArmyId) {
            joinCampaign({ campaignId: joinTarget, armyId: selectedArmyId });
            setJoinTarget(null);
            setSelectedArmyId(null);
        }
    }, [joinTarget, selectedArmyId, joinCampaign]);

    return (
        <CampaignListView
            grouped={grouped}
            joinSheetOpen={joinTarget !== null}
            eligibleArmies={armies}
            selectedArmyId={selectedArmyId}
            onOpenJoinSheet={setJoinTarget}
            onCloseJoinSheet={() => setJoinTarget(null)}
            onSelectArmy={setSelectedArmyId}
            onConfirmJoin={handleConfirmJoin}
        />
    );
}
```

---

## Component Architecture

### A. Component Inventory

#### §7.1 Campaigns List

**Route:** `src/web/src/app/[gameSystem]/campaigns/page.tsx`

- `CampaignListContainer` — orchestrational. Owns the query, join sheet open state, and army selection logic. No visual markup.
- `CampaignListView` — render component. Receives items, loading state, and callbacks as props. No hooks.
- `CampaignCard` — displays campaign name, organizer display name, participant count, current round, start/end dates, and a status badge. Status badge values match the `CampaignStatus` enum (UPCOMING, ACTIVE, COMPLETED).
- `CampaignJoinSheet` — join confirmation sheet. Presents the user's eligible armies for selection before confirming. Triggered from `CampaignCard`, not auto-opened.
- Empty state (organizer): "Create Campaign" call-to-action linking to §7.2.
- Empty state (participant): "Browse Campaigns" prompt with no further action until campaigns exist.
- No FAB. The "New Campaign" entry point lives in the page header only (CPG-11). No floating button anywhere on this page.

#### §7.2 Campaign Creation

**Route:** `src/web/src/app/[gameSystem]/campaigns/new/page.tsx`

- `CampaignFormContainer` — orchestrational. Shared with §7.6 via a `mode: 'create' | 'manage'` prop (CPG-21). In `'create'` mode, submitting calls `createCampaignMutation`. In `'manage'` mode, it calls `updateCampaignMutation`.
- `CampaignCreationForm` — multi-step form rendered inside `CampaignFormContainer`. Steps: (1) name and description, (2) format selection, (3) point limits and round count, (4) schedule, (5) army restrictions, (6) scoring rules.
- `CrusadeFieldsSection` — conditionally rendered inside step 2 when the user selects Crusade format. Exposes `startingSupplyLimit` and `startingRequisitionPoints` fields. Hidden entirely for non-Crusade formats.
- Friends selector is absent from this page. Invitation happens in §7.6 (C-06 resolution). Do not add a friends picker here.

#### §7.3 Campaign Dashboard

**Route:** `src/web/src/app/[gameSystem]/campaigns/[campaignId]/page.tsx`

- `CampaignDashboardContainer` — orchestrational. Mounts `CampaignNotificationStream`. Owns drawer-open state (drawer is NOT auto-opened on mount, CPG-20).
- `CampaignDashboardView` — render component. Accepts campaign data, participant list, standings, and callbacks.
- `CampaignHeader` — campaign name at top. Upper-right: "Play Match" button and "Manage" gear-icon button. The gear only appears for the campaign organizer.
- `CampaignRoundPairings` — renders the current round's scheduled matches. Links into §7.5 match history.
- `CampaignParticipantRow` — army card positioned to the LEFT of campaign metadata (CPG-15). Shows army name, faction, owner, and current record.
- `CampaignStandings` — leaderboard table placed at the BOTTOM of the page (CPG-14). Not pinned, not above the fold.
- No page header component wrapping this page. No phase progress bar. No player count display (CPG-16, CPG-17).
- When `campaign.status === 'COMPLETED'`, the entire dashboard renders in read-only summary mode (CPG-13). "Play Match" and "Manage" buttons are absent.
- "Leave Campaign" appears in an overflow menu accessible to non-organizer participants (CPG-07). It does not appear in the main action area.
- The Match Creation Drawer opens only when the user explicitly taps "Play Match" (CPG-20).

#### §7.4a Campaign Units (Crusade)

**Route:** `/[gameSystem]/campaigns/[campaignId]/units/[unitId]`

- Renders the Phase 2 Unit Detail Drawer in reference context (Constraint A from Phase 2 architecture). No new drawer implementation.
- `CrusadeUnitOverlay` — layered on top of the base unit card. Displays: XP total, current rank, earned battle honours, active battle scars, kill tally, and total matches played.
- `PostMatchPrompts` — shown after a match is logged. Surfaces Dealer of Death and Marked for Greatness selections for the owning player. Only visible when a match result is pending acknowledgement.

#### §7.5 Campaign Matches

**Route:** `/[gameSystem]/campaigns/[campaignId]/matches`

- Reuses Phase 3 match card components from War Ledger without modification.
- Reuses the Phase 3 Match Creation Drawer with a campaign context object injected: `{ armyId, campaignId, opponentScope: 'campaign-participants' }`. The drawer uses this context to scope opponent selection to campaign participants (C-07).
- `CampaignMatchHistory` — wraps Phase 3 match cards and groups them by round number.
- `CrusadeAgendaStep` — an additional wizard step injected into the match creation flow for Crusade-format campaigns only. Absent for other formats.

#### §7.6 Campaign Management

**Route:** `/[gameSystem]/campaigns/[campaignId]/manage`

- Role-gated to campaign organizer. Non-organizers receive a redirect or forbidden state.
- Shares `CampaignFormContainer` with §7.2 using `mode: 'manage'` (CPG-21). The form component itself is identical; only the mutation and pre-population differ.
- `CampaignParticipantManager` — supports four invitation methods: username search, friend list, shareable invite link, and accept/reject incoming join requests.
- `CampaignStateTransition` — UI for advancing the campaign through its lifecycle: Created → Upcoming → Active → Completed. Each transition requires explicit confirmation.
- `CampaignDeleteConfirmation` — typed confirmation dialog. The user must type the exact campaign name before deletion is enabled. Uses soft delete (status set to DELETED, not a destructive DB operation).

#### §7.7 Allies (Social)

**Route:** `/[gameSystem]/social`

- `AlliesContainer` — orchestrational. Mounts `FriendPresenceStream`. Owns add-friend sheet visibility and active tab state.
- `AlliesView` — render component. Receives friend list, request list, filter state, and callbacks.
- `FriendList` — renders the accepted friends collection with real-time presence indicators fed by `FriendPresenceStream`.
- `FriendRow` — displays: avatar, display name, last active timestamp, and game systems the friend has in common with the current user. The three-dot action menu is always visible (not hover-only, SA-01). Minimum tap target 44px (SA-02).
- `FriendRowActions` — menu items: Challenge to Match, Invite to Campaign, Remove Friend, Block User.
- `IncomingRequestsSection` — rendered above filter controls at all times (ALY-02). Disappears when there are no pending requests.
- `AddFriendSheet` — four tabs: (1) username search, (2) friend code, (3) QR scan, (4) NFC tap. Tabs 3 and 4 are hidden on platforms that do not support the underlying capability. They are not shown as disabled; they simply do not render.
- `FilterControls` — three filters: online status, alphabetical sort, recently active sort.

---

### B. State Management Tier Breakdown

State tiers follow the same convention as Phase 3: Tier 1 is local `useState`/`useReducer`, Tier 2 is URL params, Tier 3 is TanStack Query server state, Tier 4 is RxJS reactive streams.

**§7.1 Campaigns List**

- Tier 1: join sheet open/closed, selected army ID within the sheet.
- Tier 3: `campaignListOptions` — paginated campaign list, invalidated on join mutation.

**§7.2 Campaign Creation**

- Tier 1: multi-step form state, Crusade fields visibility (derived from format selection).
- Tier 3: `createCampaignMutation` — POST to campaigns service, navigates to §7.3 on success.

**§7.3 Campaign Dashboard**

- Tier 1: Match Creation Drawer open state (not derived from URL, not auto-opened on mount).
- Tier 2: `campaignId` comes from the route path. `?view` param may scope the visible panel.
- Tier 3: `campaignDetailOptions(campaignId)`, `campaignParticipantsOptions(campaignId)`.
- Tier 4: `CampaignNotificationStream` — mounted at campaign layout level, active while the user is viewing any campaign route.

**§7.4a Campaign Units (Crusade)**

- Tier 3: `crusadeUnitOptions(unitId, campaignId)` — fetches the unit's crusade record.

**§7.5 Campaign Matches**

- Tier 3: reuses `createMatchMutation` from Phase 3 with the campaign context object injected. No new mutation.

**§7.6 Campaign Management**

- Tier 1: delete confirmation dialog open state, invite flow step.
- Tier 3: `transitionCampaignMutation`, `updateCampaignMutation`, `inviteParticipantMutation`.

**§7.7 Allies**

- Tier 1: add-friend sheet open state, active tab index, per-row request action loading flags.
- Tier 2: `?filter=online` — persisted in URL so filter state survives navigation.
- Tier 3: `friendListOptions`, `friendRequestMutations` (send, accept, reject, remove, block).
- Tier 4: `FriendPresenceStream` — mounted at app shell level, active for any authenticated user, not scoped to the social page.

**Critical Tier 4 additions in Phase 4:**

Both streams follow the same `BehaviorSubject` + `useSyncExternalStore` pattern established by the Phase 3 match streams in `@armoury/streams`.

- `FriendPresenceStream` — mounted at app shell level. Always active when the user is authenticated, regardless of which page they're on. Provides presence data to `FriendList` and `FriendRow` via context.
- `CampaignNotificationStream` — mounted at campaign layout level (`src/web/src/app/[gameSystem]/campaigns/[campaignId]/layout.tsx`). Active only while the user has a campaign open. Drives round-change and match-result notifications.

---

### C. Shared Component Reuse Mapping

| Component             | Origin Phase         | Used In    | Reuse Notes                                                                                                             |
| --------------------- | -------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Match Creation Drawer | Phase 3              | §7.3, §7.5 | Injected with campaign context object `{ armyId, campaignId, opponentScope: 'campaign-participants' }` (C-07). No fork. |
| Match Card            | Phase 3 (War Ledger) | §7.5       | Consumed as-is inside `CampaignMatchHistory`. Grouped by round number by the wrapper.                                   |
| Unit Detail Drawer    | Phase 2              | §7.4a      | Rendered in reference mode. `CrusadeUnitOverlay` layered on top via composition, not by modifying the drawer.           |
| Campaign Form         | Phase 4              | §7.2, §7.6 | Single `CampaignFormContainer` component parameterized by `mode: 'create'                                               | 'manage'` (CPG-21). |
| Profile Popover       | Phase 1              | §7.7       | Friend code surface point (SA-04). No changes to the popover itself.                                                    |

---

### D. Unit Detail Drawer (Campaign Context)

**Unit Detail Drawer (reference mode)**

Phase 4 does not modify the Unit Detail Drawer. §7.4a composes the existing Phase 2 reference mode drawer with a `CrusadeUnitOverlay` that renders campaign-specific data alongside the reference view.

**Match Creation Drawer (campaign context injection)**

The Phase 3 Match Creation Drawer accepts an optional context object. When `campaignId` is present in that object, the drawer's opponent selection step uses `opponentScope: 'campaign-participants'` to filter the opponent list to current campaign members (C-07). No fork of the drawer component. The conditional rendering logic lives inside the drawer, gated on whether the context object includes a `campaignId`.

> **Canonical contracts**: The `FriendPresenceStream` and `CampaignNotificationStream` interface contracts are defined in [PHASE_0_SHARED_PREREQUISITES.md §2.3](PHASE_0_SHARED_PREREQUISITES.md#23-stream-facade-interfaces). The descriptions below cover Phase 4-specific implementation details.

**`FriendPresenceStream`**

New stream facade in `@armoury/streams` at `src/shared/streams/src/social/FriendPresenceStream.ts`. Wraps a WebSocket subscription to presence events. Exposes a `BehaviorSubject<PresenceMap>` where `PresenceMap` is a `Record<userId, PresenceStatus>`. Consumed via `useSyncExternalStore` in a `useFriendPresence` hook in `@armoury/web`.

**`CampaignNotificationStream`**

New stream facade in `@armoury/streams` at `src/shared/streams/src/campaigns/CampaignNotificationStream.ts`. Wraps a WebSocket subscription scoped to a single `campaignId`. Exposes a `BehaviorSubject<CampaignEvent[]>`. Consumed in `CampaignDashboardContainer` via a `useCampaignNotifications` hook.

---

### E. Component Composition Hierarchy

**Campaign Dashboard**

```
CampaignDashboardContainer
  CampaignNotificationStream (mounted here)
  CampaignDashboardView
    CampaignHeader
      [campaign name]
      [Play Match button]  (hidden when COMPLETED)
      [Manage gear button] (organizer only, hidden when COMPLETED)
      [Overflow menu]      (Leave Campaign for non-organizers)
    CampaignRoundPairings
      [match pair rows for current round]
    [participant section]
      CampaignParticipantRow  (army card LEFT of campaign info)
      CampaignParticipantRow
      ...
    CampaignStandings         (at page BOTTOM)
      [leaderboard rows]
  MatchCreationDrawer         (Phase 3, rendered when open state is true)
```

**Campaign Form (shared between creation and management)**

```
CampaignFormContainer  [mode='create' | mode='manage']
  CampaignCreationForm
    [Step 1: name, description]
    [Step 2: format selection]
      CrusadeFieldsSection  (rendered only when format === 'Crusade')
    [Step 3: point limits, round count]
    [Step 4: schedule]
    [Step 5: army restrictions]
    [Step 6: scoring rules]
```

**Allies page**

```
AlliesContainer
  FriendPresenceStream (mounted at app shell; referenced here via context)
  AlliesView
    IncomingRequestsSection   (always above filters)
    FilterControls            (online, alphabetical, recently active)
    FriendList
      FriendRow
        [avatar, name, last active, shared systems]
        [three-dot menu — always visible]
          FriendRowActions
      FriendRow
      ...
    AddFriendSheet
      [Tab: username search]
      [Tab: friend code]
      [Tab: QR scan]      (hidden on unsupported platforms)
      [Tab: NFC tap]      (hidden on unsupported platforms)
```

**Campaign match creation flow**

```
CampaignDashboardContainer
  [user taps 'Play Match']
  MatchCreationDrawer  (Phase 3 component)
    context: { armyId, campaignId, opponentScope: 'campaign-participants' }
    [Step 1: select army]      (pre-selected if context.armyId is set)
    [Step 2: select opponent]  (scoped to campaign participants via context)
    [Step 3: match details]
    [Step 4: CrusadeAgendaStep] (injected when campaign.format === 'Crusade')
    [Step 5: confirm]
```

---

### F. Responsive and Accessibility Specs

**Campaign List and Cards**

Campaign cards reflow using the same three-column grid pattern established in Forge: 3 columns at `lg`, 2 at `sm`, 1 on mobile. Card height is consistent within each row. Status badges use both color and text label — never color alone.

**Campaign Dashboard**

Single-column layout at all breakpoints. There is no sidebar or split-pane view. The standings section at the bottom is independently scrollable when the table overflows horizontally on narrow viewports. Army cards in `CampaignParticipantRow` maintain their left-of-metadata position at all widths; on mobile, the army card stacks above the metadata instead of collapsing it.

**Allies Page**

- `FriendRow` minimum height: 44px. Meets WCAG touch target requirements (SA-02).
- The three-dot action menu is always visible. It does not appear on hover or focus only. Screenreader users and keyboard users can reach it without triggering a hover state (SA-01).
- The `AddFriendSheet` tab list has `role="tablist"`. Each tab has `role="tab"` and `aria-selected`. Hidden platform tabs are removed from the DOM, not just visually hidden, so they are not focusable.

**Keyboard Navigation**

- Tab key moves through campaign cards in list order. Enter opens the card detail or triggers the primary action.
- Escape closes any open sheet, drawer, or dialog and returns focus to the element that triggered it.
- The `CampaignJoinSheet`, `AddFriendSheet`, `MatchCreationDrawer`, and `CampaignDeleteConfirmation` all implement focus trapping while open using Radix primitives.

**Screen Reader Support**

- Campaign status badges: `aria-label` includes the status text ("Status: Active"), not just the badge color.
- Friend presence indicators: `aria-label` describes the state ("Online", "Away", "Offline") rather than relying on the indicator dot alone.
- `FriendRowActions` menu: `aria-label` on the trigger button includes the friend's name ("Actions for [display name]") to disambiguate in a list.
- `CampaignStandings` table: `<th scope="col">` on all column headers, `<th scope="row">` on rank cells.

**Focus Management**

When any sheet, drawer, or dialog closes, focus returns to the element that originally opened it. This applies to: `CampaignJoinSheet`, `AddFriendSheet`, `MatchCreationDrawer`, `CampaignDeleteConfirmation`, and the overflow menu in `CampaignHeader`. Radix Dialog and Sheet primitives handle this automatically; custom components must call `ref.current?.focus()` in the close handler if not using Radix.

---

### G. Dependencies and Blockers

**Mockup dependencies (implementation proceeds; mockups refine final layout):**

- Campaign Management Page (CD-07) — blocks §7.6 implementation.
- Campaign Summary / Completed state (CP-04) — blocks the read-only completed mode in §7.3.

**Upstream phase dependencies:**

- Phase 3 Match Creation Drawer must be complete and stable before §7.3 or §7.5 development begins. Both sections mount the drawer directly. There is no wrapper or shim that can stand in for it.
- Phase 2 Unit Detail Drawer must be complete before §7.4a begins. The crusade overlay is additive, but the base drawer must exist.

**Internal sequencing:**

- §7.2 and §7.6 must be built in sequence because they share `CampaignFormContainer`. Build the container during §7.2, then parameterize for §7.6. Do not build §7.6 independently and merge later.
- §7.7 Allies has no dependency on Phase 3 match work. It can be developed in parallel with any Phase 3 work that is not yet complete. Stream facades (`FriendPresenceStream`) can be scaffolded before §7.3 requires `CampaignNotificationStream`.
- §7.4a is the lowest-priority section. It requires both the Phase 2 Unit Detail Drawer and at least one active campaign with Crusade format data. Defer until Phase 2 work is confirmed stable.

**Summary:**

| Section                  | Can Start            | Blocked By                                                                   |
| ------------------------ | -------------------- | ---------------------------------------------------------------------------- |
| §7.1 Campaigns List      | Immediately          | Nothing                                                                      |
| §7.2 Campaign Creation   | Immediately          | Nothing                                                                      |
| §7.3 Campaign Dashboard  | After Phase 3 drawer | Phase 3 Match Creation Drawer; CP-04 mockup refines read-only completed mode |
| §7.4a Campaign Units     | After Phase 2 drawer | Phase 2 Unit Detail Drawer                                                   |
| §7.5 Campaign Matches    | After Phase 3 drawer | Phase 3 Match Creation Drawer                                                |
| §7.6 Campaign Management | After §7.2           | §7.2 form component; CD-07 mockup refines final layout                       |
| §7.7 Allies              | Immediately          | Nothing                                                                      |

---

### H. Code Organization and Exports

**Campaign pages (Next.js App Router)**

```
src/web/src/app/[gameSystem]/campaigns/
  page.tsx                                  — §7.1 Campaigns List
  new/page.tsx                              — §7.2 Campaign Creation
  [campaignId]/
    layout.tsx                              — mounts CampaignNotificationStream
    page.tsx                                — §7.3 Campaign Dashboard
    matches/page.tsx                        — §7.5 Campaign Matches
    manage/page.tsx                         — §7.6 Campaign Management
    units/[unitId]/page.tsx                 — §7.4a Campaign Units (Crusade)
src/web/src/app/[gameSystem]/social/
  page.tsx                                  — §7.7 Allies
```

**Campaign components**

```
src/web/src/components/campaigns/
  CampaignListContainer.tsx
  CampaignListView.tsx
  CampaignCard.tsx
  CampaignJoinSheet.tsx
  CampaignFormContainer.tsx
  CampaignCreationForm.tsx
  CrusadeFieldsSection.tsx
  CampaignDashboardContainer.tsx
  CampaignDashboardView.tsx
  CampaignHeader.tsx
  CampaignRoundPairings.tsx
  CampaignParticipantRow.tsx
  CampaignStandings.tsx
  CampaignParticipantManager.tsx
  CampaignStateTransition.tsx
  CampaignDeleteConfirmation.tsx
  CampaignMatchHistory.tsx
  CrusadeAgendaStep.tsx
  CrusadeUnitOverlay.tsx
  PostMatchPrompts.tsx
```

**Social components**

```
src/web/src/components/social/
  AlliesContainer.tsx
  AlliesView.tsx
  FriendList.tsx
  FriendRow.tsx
  FriendRowActions.tsx
  IncomingRequestsSection.tsx
  AddFriendSheet.tsx
  FilterControls.tsx
```

**Stream facades (`@armoury/streams`)**

```
src/shared/streams/src/social/FriendPresenceStream.ts
src/shared/streams/src/campaigns/CampaignNotificationStream.ts
```

Both follow the module structure of existing Phase 3 streams. Each exports a class that wraps a WebSocket client, exposes a `BehaviorSubject`, and implements a `destroy()` method for cleanup.

**Web hooks**

```
src/web/src/hooks/useCampaignDetail.ts      — wraps campaignDetailOptions and campaignParticipantsOptions
src/web/src/hooks/useFriendPresence.ts      — useSyncExternalStore over FriendPresenceStream
src/web/src/hooks/useCampaignNotifications.ts — useSyncExternalStore over CampaignNotificationStream
```

**Query factories (shared, pure TypeScript, no React)**

```
src/shared/frontend/queries/campaigns.ts    — campaignListOptions, campaignDetailOptions,
                                              campaignParticipantsOptions, crusadeUnitOptions,
                                              createCampaignMutation, updateCampaignMutation,
                                              transitionCampaignMutation, inviteParticipantMutation
src/shared/frontend/queries/friends.ts      — friendListOptions, friendRequestMutations
```

Query factories follow the same `queryOptions` / `mutationOptions` pattern from Phase 3. No hooks inside the shared package. Hooks that consume these factories live in `src/web/src/hooks/` and `src/mobile/src/hooks/` respectively.
