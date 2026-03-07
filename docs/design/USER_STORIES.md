# Armoury User Stories

Formal user stories organized by epic and feature area. Each story includes acceptance criteria, priority, platform, and traceability to requirements.

**Related Documents:**
- `REQUIREMENTS.md` (requirement IDs referenced in each story's "Relates to" field)
- `FLOWS.md` (user journeys these stories map to)
- `INFORMATION_ARCHITECTURE.md` (page/screen inventory)
- `MATCH_EXPERIENCE.md` (match-specific UX detail)
- `STYLE_GUIDE.md` (component patterns)
- `DECISIONS.md` (open naming and architecture decisions)

## Epic 1: Game System Selection

#### US-GSS-001: View available game systems
**As a** player, **I want to** see a list of supported game systems, **so that** I can choose the ruleset I play.

**Acceptance Criteria:**
- [ ] Given the app loads, when system metadata is available, then all available systems are listed from plugin-provided data.
- [ ] Given the list is loading, then skeleton placeholders appear until data resolves.
- [ ] Given no systems are available, then an empty state explains availability and offers a retry.

**Priority:** Critical
**Platform:** Both
**Relates to:** GSS-001, GLB-005, PLG-002
**Notes:** If offline before first sync, show offline indicator and disable selection until data exists.

#### US-GSS-002: Select and load a game system
**As a** player, **I want to** select a game system, **so that** the app loads the correct rules and content.

**Acceptance Criteria:**
- [ ] Given a system is selected, when selection is confirmed, then first-time data sync starts if required.
- [ ] Given sync completes successfully, then the app navigates to the system home view.
- [ ] Given sync fails, then the app shows a recoverable error with retry.
- [ ] Given selection succeeds, then the system is stored as the last-used system for next launch.

**Priority:** Critical
**Platform:** Both
**Relates to:** GSS-002, GSS-004, GSS-005, DLP-003
**Notes:** If the user is mid-edit in another system, require confirmation before switching.

#### US-GSS-003: Switch between game systems
**As a** player, **I want to** switch systems from navigation, **so that** I can manage armies across multiple games.

**Acceptance Criteria:**
- [ ] Given multiple systems are available, when the user opens navigation, then a switch option is visible.
- [ ] Given there are unsaved edits, when switching is requested, then a confirmation step appears.
- [ ] Given switching completes, then the shell loads with the selected system’s content.

**Priority:** High
**Platform:** Both
**Relates to:** GSS-006, GLB-007, PLG-006
**Notes:** If sync is in progress, prevent switching until it completes or is canceled.

#### US-GSS-004: First-time data sync with progress indicator
**As a** new player, **I want to** see sync progress, **so that** I understand what the app is doing.

**Acceptance Criteria:**
- [ ] Given first-time sync starts, then a progress indicator shows stages and elapsed time.
- [ ] Given a stage completes, then the indicator advances without layout shifts.
- [ ] Given connectivity drops mid-sync, then a clear offline message and retry option appear.

**Priority:** High
**Platform:** Both
**Relates to:** GSS-003, OFF-004, DLP-002
**Notes:** Use cached partial data only if integrity checks pass.

## Epic 2: Authentication

#### US-AUTH-001: Sign up / Log in with social provider
**As a** player, **I want to** authenticate with a social provider, **so that** I can securely access my data.

**Acceptance Criteria:**
- [ ] Given the user chooses a provider, when authentication succeeds, then they are returned to the app authenticated.
- [ ] Given authentication fails, then an error is shown with a retry option.
- [ ] Given a first-time login, then account data is created and cached locally.

**Priority:** Critical
**Platform:** Both
**Relates to:** AUTH-001, AUTH-002, AUTH-008, GLB-009
**Notes:** Respect provider availability by platform (e.g., device-specific options).

#### US-AUTH-002: Log out
**As a** player, **I want to** log out, **so that** my account is secure on shared devices.

**Acceptance Criteria:**
- [ ] Given the user chooses log out, then tokens are cleared and local caches are reset.
- [ ] Given log out completes, then the app returns to an unauthenticated state.
- [ ] Given log out fails, then an error message and retry are shown.

**Priority:** Critical
**Platform:** Both
**Relates to:** AUTH-006, SEC-001
**Notes:** Clear any offline data that is user-specific.

#### US-AUTH-003: View profile
**As a** player, **I want to** view my profile, **so that** I can confirm my account details.

**Acceptance Criteria:**
- [ ] Given the user is authenticated, when they open profile, then display name, avatar, and linked providers are shown.
- [ ] Given profile data is loading, then skeleton placeholders appear.
- [ ] Given profile data fails to load, then an error state provides retry.

**Priority:** High
**Platform:** Both
**Relates to:** AUTH-005, ACC-001, GLB-013
**Notes:** Profile view is read-only; edits are handled in Account.

#### US-AUTH-004: Transparent token refresh
**As a** player, **I want to** stay signed in without interruptions, **so that** I can focus on gameplay.

**Acceptance Criteria:**
- [ ] Given a token is near expiry, when the app requests data, then a silent refresh occurs automatically.
- [ ] Given refresh succeeds, then the original request completes without user action.
- [ ] Given refresh fails, then the user is redirected to authenticate again with a clear message.

**Priority:** Critical
**Platform:** Both
**Relates to:** AUTH-007, SEC-001
**Notes:** Avoid blocking UI on refresh unless necessary.

#### US-AUTH-005: Unauthenticated browsing (web only — references, datasheets)
**As a** new player, **I want to** browse reference content without signing in, **so that** I can learn the game quickly.

**Acceptance Criteria:**
- [ ] Given the user is unauthenticated on web, then reference content is accessible read-only.
- [ ] Given the user attempts a create/edit action, then the app prompts for authentication and blocks the action.
- [ ] Given the user is unauthenticated, then a read-only banner explains limitations.

**Priority:** High
**Platform:** Web
**Relates to:** AUTH-004, REF-001, REF-003
**Notes:** Ensure no personal data endpoints are called while unauthenticated.

## Epic 3: Army Management

### Sub-epic 3a: Army List

#### US-ARM-001: View all my armies
**As a** player, **I want to** see all my armies, **so that** I can access and manage them.

**Acceptance Criteria:**
- [ ] Given the user is authenticated, when the list loads, then all owned armies are displayed.
- [ ] Given the list is loading, then skeleton cards appear.
- [ ] Given there are no armies, then an empty state offers a create action.

**Priority:** Critical
**Platform:** Both
**Relates to:** ARM-001, ARM-006, ARM-007
**Notes:** If offline and cached data exists, show cached list with offline indicator.

#### US-ARM-002: Create a new army (faction picker → name → detachment → points)
**As a** player, **I want to** create a new army, **so that** I can start building a list.

**Acceptance Criteria:**
- [ ] Given the create flow, required fields include name, faction, and points limit.
- [ ] Given required fields are invalid, then the create action is disabled and inline errors are shown.
- [ ] Given creation succeeds, then the new army appears in the list and opens in builder.

**Priority:** Critical
**Platform:** Both
**Relates to:** ARM-003, ARM-020, ARM-021, ARM-023, ARM-025, ARM-026
**Notes:** Prevent creation if no faction data is available offline.

#### US-ARM-003: Delete an army
**As a** player, **I want to** delete an army, **so that** I can remove obsolete lists.

**Acceptance Criteria:**
- [ ] Given a delete action, then a destructive confirmation is required.
- [ ] Given deletion succeeds, then the army is removed from the list.
- [ ] Given deletion fails, then an error state allows retry.

**Priority:** High
**Platform:** Both
**Relates to:** ARM-004, DLP-003
**Notes:** If offline, queue deletion and sync when online; show pending state.

#### US-ARM-004: See army summary (faction, points, battle size, last updated)
**As a** player, **I want to** see summary details in the army list, **so that** I can choose the right army quickly.

**Acceptance Criteria:**
- [ ] Given the list renders, then each card shows faction, total points, battle size, and last updated time.
- [ ] Given summary data changes, then the list reflects updates without full reload.
- [ ] Given missing data, then placeholders are shown with consistent layout.

**Priority:** High
**Platform:** Both
**Relates to:** ARM-002, ARM-045, DLP-002
**Notes:** Use locale-aware date and number formatting.

### Sub-epic 3b: Army Building

#### US-ARM-010: View army detail page with unit sections
**As a** player, **I want to** view my army with organized sections, **so that** I can manage composition.

**Acceptance Criteria:**
- [ ] Given an army is opened, then unit sections are grouped by category.
- [ ] Given sections load, then each shows unit count and points total.
- [ ] Given section data is loading, then section-level skeletons appear.

**Priority:** Critical
**Platform:** Both
**Relates to:** ARM-040, ARM-042, ARM-045, ARM-049
**Notes:** Preserve scroll position across data refreshes.

#### US-ARM-011: Select/change detachment
**As a** player, **I want to** change my detachment, **so that** I can build around different rules.

**Acceptance Criteria:**
- [ ] Given detachment options are available, then a selector lists valid options for the faction.
- [ ] Given a detachment change, then enhancements and validation rules update immediately.
- [ ] Given the change invalidates the army, then warnings appear with actionable guidance.

**Priority:** High
**Platform:** Both
**Relates to:** ARM-041, VAL-004, PLG-003
**Notes:** If offline and rule data is stale, warn before applying the change.

#### US-ARM-012: Add a unit to a section (modal with filtered list, disabled states for rule violations)
**As a** player, **I want to** add units to a section, **so that** I can build a legal army.

**Acceptance Criteria:**
- [ ] Given the add-unit flow opens, then only units valid for the section are shown.
- [ ] Given a unit would violate rules, then its add action is disabled with a reason.
- [ ] Given a unit is added, then it appears in the section with default configuration.
- [ ] Given the list is loading, then placeholders match final tiles.

**Priority:** Critical
**Platform:** Both
**Relates to:** ARM-043, ARM-060, ARM-062, ARM-063, VAL-001
**Notes:** If validation rules change due to detachment switch, refresh disabled states.

#### US-ARM-013: Remove a unit from army
**As a** player, **I want to** remove units, **so that** I can edit my list.

**Acceptance Criteria:**
- [ ] Given a remove action, then confirmation is required before deletion.
- [ ] Given removal succeeds, then points totals update immediately.
- [ ] Given removal fails, then the unit remains and an error is shown.

**Priority:** High
**Platform:** Both
**Relates to:** ARM-044, DLP-007
**Notes:** If offline, queue removal and show a pending sync state.

#### US-ARM-014: View points total (current vs limit) in header
**As a** player, **I want to** see current points versus limit, **so that** I can stay within bounds.

**Acceptance Criteria:**
- [ ] Given the army view, then header shows current points and points limit.
- [ ] Given points exceed the limit, then a warning state is shown without blocking edits.
- [ ] Given points change, then the header updates in real time.

**Priority:** Critical
**Platform:** Both
**Relates to:** ARM-040, VAL-005
**Notes:** Use locale-aware number formatting.

#### US-ARM-015: See validation warnings/errors for army composition
**As a** player, **I want to** see composition errors, **so that** I can fix invalid lists.

**Acceptance Criteria:**
- [ ] Given validation runs, then errors and warnings are summarized in a dedicated panel.
- [ ] Given a rule is violated, then the message specifies the rule and affected section.
- [ ] Given validation passes, then the panel indicates the army is valid.

**Priority:** High
**Platform:** Both
**Relates to:** ARM-046, VAL-002, VAL-004
**Notes:** If validation data cannot load, show a non-blocking warning and disable save.

#### US-ARM-016: Reorder units within sections (optional)
**As a** player, **I want to** reorder units in a section, **so that** I can keep my list organized.

**Acceptance Criteria:**
- [ ] Given a section has multiple units, then reordering controls are available.
- [ ] Given a unit is reordered, then the new order persists after refresh.
- [ ] Given reordering fails to save, then the list reverts and an error is shown.

**Priority:** Medium
**Platform:** Both
**Relates to:** DLP-007
**Notes:** Avoid reordering while another client is editing; show conflict resolution.

### Sub-epic 3c: Unit Configuration

#### US-ARM-020: Configure model weapons (per-model loadout selection)
**As a** player, **I want to** select weapons per model, **so that** my unit loadout is accurate.

**Acceptance Criteria:**
- [ ] Given a unit with model configs, then each model shows available weapon choices.
- [ ] Given a selection is invalid, then the choice is disabled with reason text.
- [ ] Given weapon choices change, then points update immediately.

**Priority:** Critical
**Platform:** Both
**Relates to:** ARM-081, ARM-084, ARM-085, VAL-001
**Notes:** Handle partial configs by highlighting incomplete models.

#### US-ARM-021: Select wargear options
**As a** player, **I want to** choose wargear, **so that** my unit matches my collection.

**Acceptance Criteria:**
- [ ] Given wargear options exist, then selectable options are listed with requirements.
- [ ] Given a selection violates constraints, then it is blocked with an error message.
- [ ] Given selections change, then the unit summary and points update.

**Priority:** High
**Platform:** Both
**Relates to:** ARM-082, VAL-003, VAL-004
**Notes:** If rules allow multiple selections, show remaining slots.

#### US-ARM-022: Apply enhancement to a character unit
**As a** player, **I want to** apply an enhancement, **so that** my character matches detachment rules.

**Acceptance Criteria:**
- [ ] Given a character unit, then available enhancements are filtered by detachment rules.
- [ ] Given an enhancement is already used elsewhere, then it is disabled with reason text.
- [ ] Given an enhancement is applied, then it appears in the unit summary and affects points.

**Priority:** High
**Platform:** Both
**Relates to:** ARM-083, ARM-085, VAL-001
**Notes:** If detachment changes, remove invalid enhancements and show a warning.

#### US-ARM-023: View interactive datasheet (stats, weapons, abilities while editing)
**As a** player, **I want to** see the unit’s stats and rules while editing, **so that** I can make informed choices.

**Acceptance Criteria:**
- [ ] Given the configuration view, then stats, weapons, abilities, and keywords are visible.
- [ ] Given content is loading, then skeletons appear without layout shift.
- [ ] Given data fails to load, then an error state allows retry.

**Priority:** High
**Platform:** Both
**Relates to:** ARM-080, ARM-087, DLP-003
**Notes:** Keep the editing form available even if reference data reloads.

#### US-ARM-024: View points update in real-time as loadout changes
**As a** player, **I want to** see points update instantly, **so that** I can stay within my limit.

**Acceptance Criteria:**
- [ ] Given a loadout change, then unit points update immediately.
- [ ] Given unit points change, then the army total updates in the header.
- [ ] Given a points calculation fails, then the previous valid value remains with a warning.

**Priority:** Critical
**Platform:** Both
**Relates to:** ARM-084, DLP-007
**Notes:** Ensure calculations are local and do not require network.

#### US-ARM-025: Set unit as warlord
**As a** player, **I want to** mark a unit as the leader, **so that** my list is compliant.

**Acceptance Criteria:**
- [ ] Given the unit can be designated, then a toggle is available.
- [ ] Given a new leader is set, then any previous leader is cleared automatically.
- [ ] Given the designation violates rules, then it is blocked with a clear error message.

**Priority:** High
**Platform:** Both
**Relates to:** VAL-004
**Notes:** If leader is removed, prompt to select a new one before saving.

### Sub-epic 3d: Unit Datasheet (Read-Only)

#### US-ARM-030: View unit datasheet (stats, weapons, abilities, keywords, composition)
**As a** player, **I want to** read a unit’s datasheet, **so that** I can understand its rules.

**Acceptance Criteria:**
- [ ] Given a unit is selected, then stats, weapons, abilities, keywords, and composition are shown.
- [ ] Given data is loading, then a full-page skeleton appears.
- [ ] Given data fails to load, then a retry option is shown.

**Priority:** Critical
**Platform:** Both
**Relates to:** ARM-100, ARM-104
**Notes:** Read-only view must be accessible without edit permissions.

#### US-ARM-031: View weapon profiles with keywords
**As a** player, **I want to** view weapon profiles, **so that** I can evaluate loadouts.

**Acceptance Criteria:**
- [ ] Given a datasheet, then weapons list shows profile stats and keyword tags.
- [ ] Given a weapon has multiple profiles, then each profile is clearly separated.
- [ ] Given keywords are present, then each keyword is readable and not color-only.

**Priority:** High
**Platform:** Both
**Relates to:** ARM-102, A11Y-007
**Notes:** Use consistent ordering for melee and ranged sections.

#### US-ARM-032: View unit abilities and leader info
**As a** player, **I want to** see unit abilities and leader information, **so that** I understand special rules.

**Acceptance Criteria:**
- [ ] Given a datasheet, then abilities are listed with clear names and descriptions.
- [ ] Given leader info exists, then leader options and constraints are shown.
- [ ] Given the data is long, then it is navigable without losing context.

**Priority:** High
**Platform:** Both
**Relates to:** ARM-103
**Notes:** Support anchor links for long ability lists.

### Sub-epic 3e: Combat View

#### US-ARM-040: Open army in combat-ready view ("Command Post")
**As a** player, **I want to** open a combat-ready view of my army, **so that** I can reference it during play.

**Acceptance Criteria:**
- [ ] Given an army, when combat view is opened, then a read-optimized layout is displayed.
- [ ] Given the view loads, then unit summaries appear with current configuration.
- [ ] Given data is stale, then a refresh option is available.

**Priority:** High
**Platform:** Both
**Relates to:** MTH-066
**Notes:** Avoid referencing any protected data if unauthenticated web access is allowed.

#### US-ARM-041: View equipped loadout per model (not just selected weapons — actual model-by-model breakdown)
**As a** player, **I want to** see the exact model-by-model loadout, **so that** I can play accurately.

**Acceptance Criteria:**
- [ ] Given a unit, then each model’s equipped weapons are shown distinctly.
- [ ] Given a model has default gear, then defaults are clearly indicated.
- [ ] Given a model is missing a required selection, then it is flagged.

**Priority:** High
**Platform:** Both
**Relates to:** ARM-081, VAL-002
**Notes:** Use compact layout that stays readable on small screens.

#### US-ARM-042: View compact army summary with HP status
**As a** player, **I want to** see a compact summary with health status, **so that** I can track gameplay state.

**Acceptance Criteria:**
- [ ] Given the combat view, then each unit shows current and max health.
- [ ] Given health changes, then the display updates without full reload.
- [ ] Given health is unknown, then show a neutral placeholder state.

**Priority:** Medium
**Platform:** Both
**Relates to:** MTH-063
**Notes:** Health status requires active match context; otherwise display read-only.

## Epic 4: Match Management

### Sub-epic 4a: Match List

#### US-MTH-001: View all my matches (past, active, planned)
**As a** player, **I want to** see all matches grouped by status, **so that** I can find what I need quickly.

**Acceptance Criteria:**
- [ ] Given the match list loads, then matches are grouped into past, active, and planned.
- [ ] Given no matches exist, then an empty state offers create action.
- [ ] Given the list is loading, then skeleton cards appear.

**Priority:** Critical
**Platform:** Both
**Relates to:** MTH-001, MTH-005
**Notes:** If offline, show cached matches with clear offline status.

#### US-MTH-002: Filter matches by status (active+planned default)
**As a** player, **I want to** filter matches, **so that** I can focus on upcoming games.

**Acceptance Criteria:**
- [ ] Given the list loads, then active+planned are shown by default.
- [ ] Given a filter is selected, then the list updates immediately.
- [ ] Given the filter yields no results, then an empty state is displayed.

**Priority:** High
**Platform:** Both
**Relates to:** MTH-002
**Notes:** Preserve filter selection across sessions.

#### US-MTH-003: Sort matches (date, name, army)
**As a** player, **I want to** sort matches, **so that** I can find them by preference.

**Acceptance Criteria:**
- [ ] Given sorting options, then date, name, and army are available.
- [ ] Given a sort is selected, then the list reorders without re-fetch.
- [ ] Given the list is long, then sorting remains performant.

**Priority:** Medium
**Platform:** Both
**Relates to:** MTH-002, PRF-007
**Notes:** Use stable sort to prevent UI jitter.

#### US-MTH-004: Delete a match
**As a** player, **I want to** delete a match, **so that** I can remove incorrect records.

**Acceptance Criteria:**
- [ ] Given delete is selected, then confirmation is required.
- [ ] Given deletion succeeds, then the match is removed from the list.
- [ ] Given deletion fails, then an error state allows retry.

**Priority:** High
**Platform:** Both
**Relates to:** DLP-003
**Notes:** If the match is linked to a campaign, warn before deletion.

#### US-MTH-005: Create a new match (name, army, date, opponent linking)
**As a** player, **I want to** create a match, **so that** I can track an upcoming game.

**Acceptance Criteria:**
- [ ] Given the create flow, then required fields include army and date/time.
- [ ] Given creation succeeds, then the match appears as planned.
- [ ] Given validation fails, then inline errors are shown and create is disabled.

**Priority:** Critical
**Platform:** Both
**Relates to:** MTH-003, MTH-021, MTH-022, MTH-024
**Notes:** If opponent linking is deferred, show it as optional.

### Sub-epic 4b: Match Linking

#### US-MTH-010: Generate QR code for match pairing
**As a** player, **I want to** generate a pairing code, **so that** my opponent can join the match.

**Acceptance Criteria:**
- [ ] Given a planned match, then a pairing code can be generated.
- [ ] Given the code is generated, then it is displayed in scannable form.
- [ ] Given the code expires, then the app indicates expiration and allows regeneration.

**Priority:** High
**Platform:** Both
**Relates to:** MTH-023
**Notes:** Do not expose personal account identifiers in the code.

#### US-MTH-011: Scan opponent's QR code to join
**As a** player, **I want to** scan my opponent’s code, **so that** we can link matches quickly.

**Acceptance Criteria:**
- [ ] Given the scanner is opened, then camera permissions are requested if needed.
- [ ] Given a valid code is scanned, then the match is linked to the opponent.
- [ ] Given the code is invalid, then an error message is shown with retry.

**Priority:** High
**Platform:** Mobile
**Relates to:** MTH-023
**Notes:** Provide a manual entry fallback for devices without camera access.

#### US-MTH-012: Enter numeric code as fallback
**As a** player, **I want to** enter a numeric code, **so that** I can link without a camera.

**Acceptance Criteria:**
- [ ] Given a numeric code field, then it validates length and format.
- [ ] Given a valid code, then the match links successfully.
- [ ] Given an invalid code, then an error is shown without clearing input.

**Priority:** Medium
**Platform:** Both
**Relates to:** MTH-023
**Notes:** Rate-limit retries to prevent abuse.

#### US-MTH-013: See "Connected" confirmation with opponent info
**As a** player, **I want to** confirm linking, **so that** I know I’m connected to the right opponent.

**Acceptance Criteria:**
- [ ] Given linking succeeds, then a confirmation state shows opponent name and army.
- [ ] Given the opponent data is missing, then a placeholder is shown with a retry.
- [ ] Given the user rejects the match, then the link is canceled.

**Priority:** High
**Platform:** Both
**Relates to:** MTH-023
**Notes:** If opponent data changes, show last updated timestamp.

#### US-MTH-014: Send friend request during linking (if not already friends)
**As a** player, **I want to** send a friend request during linking, **so that** I can stay connected after the match.

**Acceptance Criteria:**
- [ ] Given a successful link, then an option to add as friend is shown if not already connected.
- [ ] Given the request is sent, then the UI shows pending status.
- [ ] Given the request fails, then a retry is available.

**Priority:** Medium
**Platform:** Both
**Relates to:** SOC-007, SOC-009
**Notes:** Respect the user’s sharing permissions when sending the request.

### Sub-epic 4c: Active Match — Basic Mode

#### US-MTH-020: View all turn-relevant info on one screen
**As a** player, **I want to** see key match info at once, **so that** I can minimize navigation during play.

**Acceptance Criteria:**
- [ ] Given an active match in basic mode, then VP, CP, round, and unit health are visible on one screen.
- [ ] Given content is loading, then placeholders appear without layout shift.
- [ ] Given the screen size is small, then the layout remains usable without hiding required info.

**Priority:** Critical
**Platform:** Both
**Relates to:** MTH-060, GLB-001, GLB-002
**Notes:** Respect reduced-motion settings for any updates.

#### US-MTH-021: Track VP (primary + secondary, per round)
**As a** player, **I want to** track scoring per round, **so that** I can verify totals accurately.

**Acceptance Criteria:**
- [ ] Given a round, then primary and secondary scores can be entered separately.
- [ ] Given scores change, then round and total tallies update immediately.
- [ ] Given a score is undone, then history reflects the change.

**Priority:** Critical
**Platform:** Both
**Relates to:** MTH-062, MTH-069
**Notes:** Prevent negative totals; allow zero values.

#### US-MTH-022: Track CP (spend/gain with history)
**As a** player, **I want to** track command points with history, **so that** I can audit usage.

**Acceptance Criteria:**
- [ ] Given CP changes, then a log entry is recorded with timestamp and delta.
- [ ] Given the user adjusts CP, then the total updates immediately.
- [ ] Given the log is long, then it remains readable and scrollable.

**Priority:** High
**Platform:** Both
**Relates to:** MTH-062
**Notes:** If syncing fails, mark entries as pending until confirmed.

#### US-MTH-023: Track model HP per unit
**As a** player, **I want to** track unit health, **so that** I can keep accurate state.

**Acceptance Criteria:**
- [ ] Given a unit, then current and max health are displayed.
- [ ] Given health is adjusted, then totals update immediately.
- [ ] Given health reaches zero, then the unit is visually marked as defeated.

**Priority:** High
**Platform:** Both
**Relates to:** MTH-063
**Notes:** Avoid removing units automatically; allow manual override.

#### US-MTH-024: Progress through rounds (1-5)
**As a** player, **I want to** advance rounds, **so that** the match state stays synchronized.

**Acceptance Criteria:**
- [ ] Given the current round, then controls allow moving to the next round.
- [ ] Given round changes, then both players see the updated round.
- [ ] Given round is final, then advancement is disabled and end-match is offered.

**Priority:** Critical
**Platform:** Both
**Relates to:** MTH-064, MTH-065
**Notes:** Confirm before skipping a round.

#### US-MTH-025: End turn / end round
**As a** player, **I want to** end my turn and round, **so that** progression is explicit.

**Acceptance Criteria:**
- [ ] Given a turn, then an explicit end-turn action is available.
- [ ] Given end-turn is used, then opponent view updates to indicate their turn.
- [ ] Given end-round is used, then round totals are locked and recorded.

**Priority:** High
**Platform:** Both
**Relates to:** MTH-064, MTH-065
**Notes:** Prevent double-ending with idempotent actions.

#### US-MTH-026: See opponent's VP and CP (anti-cheat)
**As a** player, **I want to** see my opponent’s totals, **so that** scoring stays honest.

**Acceptance Criteria:**
- [ ] Given a linked match, then opponent VP and CP totals are visible.
- [ ] Given opponent updates, then the display syncs within the polling interval.
- [ ] Given sync fails, then a stale indicator is shown.

**Priority:** Medium
**Platform:** Both
**Relates to:** MTH-065, DLP-006
**Notes:** Do not allow editing opponent values.

#### US-MTH-027: View defensive options during opponent's turn
**As a** player, **I want to** see defensive options, **so that** I can respond during my opponent’s turn.

**Acceptance Criteria:**
- [ ] Given it is the opponent’s turn, then relevant defensive rules are visible.
- [ ] Given phase changes, then the defensive list updates.
- [ ] Given the list is long, then it can be filtered by unit or phase.

**Priority:** Medium
**Platform:** Both
**Relates to:** MTH-067
**Notes:** This view is read-only and should not alter match state.

### Sub-epic 4d: Active Match — Guided Mode

#### US-MTH-030: See phase-specific content (Command → Movement → Shooting → Charge → Fight)
**As a** player, **I want to** see phase-specific guidance, **so that** I do the right steps each turn.

**Acceptance Criteria:**
- [ ] Given guided mode, then the current phase is shown with relevant content.
- [ ] Given a phase change, then the content updates without manual refresh.
- [ ] Given the user navigates back, then previous phase content is accessible.

**Priority:** Critical
**Platform:** Both
**Relates to:** MTH-061, MTH-064, PLG-003
**Notes:** Phase definitions come from plugin data only.

#### US-MTH-031: See "Don't Forget" reminders per phase (abilities, stratagems, rules)
**As a** player, **I want to** see reminders, **so that** I don’t miss key actions.

**Acceptance Criteria:**
- [ ] Given a phase, then reminders are surfaced based on faction rules and unit abilities.
- [ ] Given no reminders apply, then the section is hidden or shows an empty state.
- [ ] Given reminders are shown, then each is readable and actionable.

**Priority:** High
**Platform:** Both
**Relates to:** MTH-067, REF-002
**Notes:** Reminders must be non-blocking and dismissible.

#### US-MTH-032: Mark abilities as used/triggered per phase
**As a** player, **I want to** mark abilities as used, **so that** I avoid repeating them.

**Acceptance Criteria:**
- [ ] Given an ability, then it can be marked used for the current phase.
- [ ] Given a phase ends, then used markers reset if rules allow.
- [ ] Given state syncs, then both players see usage status.

**Priority:** High
**Platform:** Both
**Relates to:** MTH-067, MTH-065
**Notes:** If offline, cache locally and sync on reconnect.

#### US-MTH-033: Progress through phases with "Next Phase" button
**As a** player, **I want to** advance phases, **so that** the guided flow is clear.

**Acceptance Criteria:**
- [ ] Given guided mode, then a phase progression control is available.
- [ ] Given advancement, then the phase indicator and content update immediately.
- [ ] Given the last phase completes, then the flow returns to round progression.

**Priority:** Critical
**Platform:** Both
**Relates to:** MTH-064
**Notes:** Avoid hard-coded labels; use generic progression control text.

#### US-MTH-034: Switch between Basic and Guided mode mid-match
**As a** player, **I want to** switch modes, **so that** I can choose my preferred tracking style.

**Acceptance Criteria:**
- [ ] Given an active match, then both modes are accessible without losing data.
- [ ] Given a mode switch, then current round, phase, and totals persist.
- [ ] Given switching fails, then the user is kept in the current mode with a warning.

**Priority:** High
**Platform:** Both
**Relates to:** MTH-043, MTH-060, MTH-061
**Notes:** Mode preference should be saved per match.

#### US-MTH-035: See opponent's current phase and actions (synced state)
**As a** player, **I want to** see my opponent’s phase, **so that** I can stay aligned.

**Acceptance Criteria:**
- [ ] Given a linked match, then opponent phase is visible in guided mode.
- [ ] Given opponent advances phase, then the display updates within the polling interval.
- [ ] Given sync fails, then a stale indicator is shown.

**Priority:** Medium
**Platform:** Both
**Relates to:** MTH-065, DLP-006
**Notes:** Do not allow editing opponent phase.

### Sub-epic 4e: Command Post (In-Match Reference)

#### US-MTH-040: View all army units with equipped loadouts
**As a** player, **I want to** view my army loadouts during a match, **so that** I can reference them quickly.

**Acceptance Criteria:**
- [ ] Given an active match, then a reference panel lists all units with loadouts.
- [ ] Given loadouts change in the army, then the view reflects updates.
- [ ] Given data is loading, then a compact skeleton list appears.

**Priority:** High
**Platform:** Both
**Relates to:** MTH-066, ARM-081
**Notes:** Use the latest synced army snapshot to avoid live edits during a match.

#### US-MTH-041: Tap unit → see full equipped datasheet with model-by-model weapons
**As a** player, **I want to** open a unit’s full reference, **so that** I can verify exact weapon profiles.

**Acceptance Criteria:**
- [ ] Given a unit is selected, then the equipped datasheet opens with model-by-model weapons.
- [ ] Given the datasheet opens, then it is read-only during the match.
- [ ] Given data fails to load, then a retry is available.

**Priority:** High
**Platform:** Both
**Relates to:** ARM-080, ARM-081, MTH-066
**Notes:** Ensure navigation back returns to the same match context.

#### US-MTH-042: View stratagems filtered by phase
**As a** player, **I want to** filter stratagems by phase, **so that** I can find them quickly.

**Acceptance Criteria:**
- [ ] Given the reference view, then stratagems can be filtered by current phase.
- [ ] Given a phase changes, then the default filter updates accordingly.
- [ ] Given no stratagems match, then an empty state is shown.

**Priority:** Medium
**Platform:** Both
**Relates to:** REF-002, MTH-067
**Notes:** Use phase data from the active match state.

#### US-MTH-043: View faction rules and detachment rules
**As a** player, **I want to** view faction and detachment rules mid-match, **so that** I can reference them quickly.

**Acceptance Criteria:**
- [ ] Given the reference panel, then faction and detachment rules are accessible.
- [ ] Given rules are long, then they are readable and searchable.
- [ ] Given data fails to load, then a retry action is shown.

**Priority:** High
**Platform:** Both
**Relates to:** REF-002, ARM-041
**Notes:** Keep rule text read-only with no edit affordances.

#### US-MTH-044: View enhancements applied to characters
**As a** player, **I want to** see applied enhancements, **so that** I can remember their effects.

**Acceptance Criteria:**
- [ ] Given the reference panel, then each enhanced unit lists its enhancement.
- [ ] Given enhancements change before match start, then the list updates.
- [ ] Given a unit has no enhancement, then no enhancement is shown.

**Priority:** Medium
**Platform:** Both
**Relates to:** ARM-083, MTH-066
**Notes:** Use read-only snapshot during active match.

#### US-MTH-045: Track modifiers on units (add/remove)
**As a** player, **I want to** track temporary modifiers, **so that** I can remember effects on units.

**Acceptance Criteria:**
- [ ] Given a unit, then modifiers can be added with name and duration.
- [ ] Given a modifier expires, then it can be marked as ended.
- [ ] Given modifiers change, then the state syncs to opponent view if linked.

**Priority:** Medium
**Platform:** Both
**Relates to:** MTH-066, DLP-006
**Notes:** If offline, keep local state and mark as unsynced.

#### US-MTH-046: Toggle one-time wargear abilities (used/unused)
**As a** player, **I want to** mark one-time items as used, **so that** I don’t reuse them.

**Acceptance Criteria:**
- [ ] Given a unit with one-time items, then each item can be toggled used/unused.
- [ ] Given the match restarts, then the toggles reset.
- [ ] Given the view is in read-only mode, then toggles are disabled.

**Priority:** Medium
**Platform:** Both
**Relates to:** MTH-066
**Notes:** Avoid suggesting these toggles are mandatory to finish a phase.

### Sub-epic 4f: Match Conclusion

#### US-MTH-050: Initiate "End Match"
**As a** player, **I want to** end the match explicitly, **so that** results are finalized.

**Acceptance Criteria:**
- [ ] Given an active match, then an end action is available with confirmation.
- [ ] Given end is confirmed, then the match transitions to reconciliation.
- [ ] Given end is canceled, then the match remains active.

**Priority:** Critical
**Platform:** Both
**Relates to:** MTH-080
**Notes:** Avoid using fixed UI labels; use generic confirmation language.

#### US-MTH-051: See final VP comparison
**As a** player, **I want to** see final scores, **so that** I can verify the outcome.

**Acceptance Criteria:**
- [ ] Given match end, then both players’ totals are shown side by side.
- [ ] Given totals are incomplete, then the UI flags missing data.
- [ ] Given a discrepancy is detected, then reconciliation is required before finalizing.

**Priority:** High
**Platform:** Both
**Relates to:** MTH-081, MTH-082
**Notes:** Use read-only totals in this step.

#### US-MTH-052: Validate match data with opponent (reconciliation)
**As a** player, **I want to** reconcile results, **so that** we agree on the final score.

**Acceptance Criteria:**
- [ ] Given both players are connected, then each must confirm the final totals.
- [ ] Given totals differ, then the app highlights differences and prevents finalization.
- [ ] Given reconciliation completes, then the match can be finalized.

**Priority:** Critical
**Platform:** Both
**Relates to:** MTH-081, MTH-082
**Notes:** If the opponent is offline, allow a pending state with later confirmation.

#### US-MTH-053: Confirm match result (win/loss/draw)
**As a** player, **I want to** confirm the result, **so that** it is stored with the match record.

**Acceptance Criteria:**
- [ ] Given reconciliation is complete, then a result selection is available.
- [ ] Given a result is selected, then it is stored with the match record.
- [ ] Given no result is selected, then finalization is blocked.

**Priority:** High
**Platform:** Both
**Relates to:** MTH-083
**Notes:** If the match is linked to a campaign, update campaign standings after confirmation.

#### US-MTH-054: Share match result (optional — Discord, etc.)
**As a** player, **I want to** share my result, **so that** I can post it to my community.

**Acceptance Criteria:**
- [ ] Given a finalized match, then a share option is available.
- [ ] Given sharing is used, then a formatted summary is produced for external apps.
- [ ] Given sharing fails, then an error is shown without losing match data.

**Priority:** Medium
**Platform:** Both
**Relates to:** MTH-084
**Notes:** Do not include opponent private data in shared summaries.

### Sub-epic 4g: Past/Future Matches

#### US-MTH-060: View past match summary (read-only dashboard)
**As a** player, **I want to** view past match summaries, **so that** I can review outcomes.

**Acceptance Criteria:**
- [ ] Given a past match, then a read-only summary dashboard is shown.
- [ ] Given the summary loads, then VP breakdown and key stats are visible.
- [ ] Given data fails to load, then a retry option is provided.

**Priority:** High
**Platform:** Both
**Relates to:** MTH-040, MTH-084
**Notes:** Past matches must not allow edits.

#### US-MTH-061: View planned match details (editable)
**As a** player, **I want to** edit planned match details, **so that** I can keep them accurate.

**Acceptance Criteria:**
- [ ] Given a planned match, then name, date, and army are editable.
- [ ] Given edits are saved, then the updated data is visible to linked players.
- [ ] Given validation fails, then inline errors are shown.

**Priority:** High
**Platform:** Both
**Relates to:** MTH-041, MTH-024
**Notes:** If the match is linked, notify the opponent of changes.

#### US-MTH-062: Start a planned match ("Start Now")
**As a** player, **I want to** start a planned match, **so that** I can begin tracking immediately.

**Acceptance Criteria:**
- [ ] Given a planned match, then a start action is available.
- [ ] Given start is confirmed, then the match enters active mode.
- [ ] Given the opponent is linked, then their match state updates to active.

**Priority:** Critical
**Platform:** Both
**Relates to:** MTH-042, MTH-065
**Notes:** Do not use fixed UI labels; use generic call-to-action text.

#### US-MTH-063: Change army for a planned match (notifies linked players)
**As a** player, **I want to** change my selected army, **so that** the match reflects my current list.

**Acceptance Criteria:**
- [ ] Given a planned match, then the army can be changed from the user’s army list.
- [ ] Given the army changes, then linked players are notified of the update.
- [ ] Given the new army is invalid, then the change is blocked with an error.

**Priority:** Medium
**Platform:** Both
**Relates to:** MTH-041, ARM-046
**Notes:** If the match has already started, disallow army changes.

## Epic 5: Campaign Management

### Sub-epic 5a: Campaign List

#### US-CMP-001: View all campaigns (past, active, upcoming)
**As a** player, **I want to** see my campaigns, **so that** I can track ongoing play.

**Acceptance Criteria:**
- [ ] Given the list loads, then campaigns are shown with status grouping.
- [ ] Given the list is loading, then skeleton cards appear.
- [ ] Given no campaigns exist, then an empty state offers a create action if eligible.

**Priority:** Critical
**Platform:** Both
**Relates to:** CMP-001, CMP-004
**Notes:** If offline, show cached campaigns with offline status.

#### US-CMP-002: Filter/search campaigns
**As a** player, **I want to** search and filter campaigns, **so that** I can find them quickly.

**Acceptance Criteria:**
- [ ] Given filter controls, then status and name filters are available.
- [ ] Given a search term, then results update as the user types.
- [ ] Given no results, then an empty state is shown.

**Priority:** High
**Platform:** Both
**Relates to:** CMP-001
**Notes:** Preserve filters across sessions.

#### US-CMP-003: Delete a campaign (organizer only)
**As a** organizer, **I want to** delete a campaign, **so that** I can remove incorrect setups.

**Acceptance Criteria:**
- [ ] Given the user is an organizer, then delete actions are visible.
- [ ] Given delete is selected, then confirmation is required.
- [ ] Given deletion succeeds, then the campaign is removed from all participants’ lists.

**Priority:** Medium
**Platform:** Both
**Relates to:** CMP-100
**Notes:** If the campaign has active matches, warn before deletion.

#### US-CMP-004: See campaign summary (name, dates, participants, status, winner)
**As a** player, **I want to** see campaign summaries, **so that** I can choose where to participate.

**Acceptance Criteria:**
- [ ] Given a campaign card, then it shows name, dates, participant count, and status.
- [ ] Given a completed campaign, then the winner is shown.
- [ ] Given data changes, then the summary updates without full reload.

**Priority:** High
**Platform:** Both
**Relates to:** CMP-002
**Notes:** Use locale-aware date formatting.

### Sub-epic 5b: Campaign Creation

#### US-CMP-010: Create campaign (name, type, dates, stages, rules, narrative)
**As a** organizer, **I want to** create a campaign, **so that** I can run events.

**Acceptance Criteria:**
- [ ] Given the create flow, required fields include name, type, and dates.
- [ ] Given validation fails, then inline errors are shown and create is disabled.
- [ ] Given creation succeeds, then the campaign dashboard opens.

**Priority:** High
**Platform:** Both
**Relates to:** CMP-020, CMP-024
**Notes:** Save drafts locally if offline.

#### US-CMP-011: Select crusade ruleset (from loaded rules)
**As a** organizer, **I want to** select a ruleset, **so that** crusade progression is consistent.

**Acceptance Criteria:**
- [ ] Given the campaign type is crusade, then a ruleset selector is shown.
- [ ] Given rulesets are loading, then placeholders appear.
- [ ] Given a ruleset is selected, then progression rules are tied to the campaign.

**Priority:** High
**Platform:** Both
**Relates to:** CMP-021, CMP-120
**Notes:** If ruleset data is unavailable offline, block creation with a clear message.

#### US-CMP-012: Define custom campaign stages
**As a** organizer, **I want to** define custom stages, **so that** the campaign fits my format.

**Acceptance Criteria:**
- [ ] Given stage editing, then stages can be added, reordered, and removed.
- [ ] Given stage data is invalid, then errors are shown inline.
- [ ] Given stages are saved, then they appear in the campaign dashboard.

**Priority:** Medium
**Platform:** Both
**Relates to:** CMP-022, CMP-101
**Notes:** Prevent editing stages that already completed.

#### US-CMP-013: Set custom global rules
**As a** organizer, **I want to** set global rules, **so that** participants follow consistent constraints.

**Acceptance Criteria:**
- [ ] Given a rules field, then rich-text or structured input is supported.
- [ ] Given rules are saved, then they are visible to all participants.
- [ ] Given rules are updated, then a change log is recorded.

**Priority:** Medium
**Platform:** Both
**Relates to:** CMP-023, CMP-101
**Notes:** Include last-updated timestamp for transparency.

#### US-CMP-014: Auto-populate narrative for crusade campaigns
**As a** organizer, **I want to** auto-populate narrative, **so that** I can start quickly.

**Acceptance Criteria:**
- [ ] Given a crusade campaign, then a narrative template can be inserted.
- [ ] Given the template is inserted, then it is editable before saving.
- [ ] Given the user declines, then the narrative field remains empty.

**Priority:** Medium
**Platform:** Both
**Relates to:** CMP-023
**Notes:** Use non-trademarked, generic narrative copy.

### Sub-epic 5c: Campaign Dashboard

#### US-CMP-020: View campaign dashboard (summary, standings, upcoming matches)
**As a** player, **I want to** view the campaign dashboard, **so that** I can track progress.

**Acceptance Criteria:**
- [ ] Given a campaign, then summary, standings, and upcoming matches are visible.
- [ ] Given data is loading, then skeletons appear for each section.
- [ ] Given the campaign is completed, then the final standings are locked.

**Priority:** Critical
**Platform:** Both
**Relates to:** CMP-040, CMP-041
**Notes:** If standings fail to load, show partial dashboard with retry.

#### US-CMP-021: View participant list with armies
**As a** player, **I want to** see participants and their armies, **so that** I know who is involved.

**Acceptance Criteria:**
- [ ] Given a campaign, then participant list includes names and selected armies.
- [ ] Given a participant has multiple armies, then the active one is indicated.
- [ ] Given access is restricted, then only public info is shown.

**Priority:** High
**Platform:** Both
**Relates to:** CMP-040, CMP-042
**Notes:** Respect sharing permissions from Social settings.

#### US-CMP-022: View scoreboard (player, army, stage, W/L)
**As a** player, **I want to** view a scoreboard, **so that** I can compare standings.

**Acceptance Criteria:**
- [ ] Given standings, then the scoreboard shows player, army, stage, and W/L.
- [ ] Given sorting is available, then users can sort by stage or record.
- [ ] Given data changes, then the scoreboard updates without full reload.

**Priority:** High
**Platform:** Both
**Relates to:** CMP-040
**Notes:** Use stable sorting to avoid jumpy updates.

#### US-CMP-023: View current stage narrative
**As a** player, **I want to** read the current stage narrative, **so that** I can follow the story.

**Acceptance Criteria:**
- [ ] Given the campaign is active, then the current stage narrative is visible.
- [ ] Given the stage changes, then the narrative updates accordingly.
- [ ] Given narrative is missing, then an empty state is shown.

**Priority:** Medium
**Platform:** Both
**Relates to:** CMP-040
**Notes:** If offline, show cached narrative with last-updated timestamp.

#### US-CMP-024: View campaign army section (units with crusade progression)
**As a** player, **I want to** see my campaign units and progression, **so that** I can plan upgrades.

**Acceptance Criteria:**
- [ ] Given a participant view, then units list shows current progression status.
- [ ] Given a unit is selected, then its progression details open.
- [ ] Given data is loading, then skeleton placeholders appear.

**Priority:** High
**Platform:** Both
**Relates to:** CMP-042, CMP-060
**Notes:** Read-only for non-owners.

### Sub-epic 5d: Crusade Mechanics

#### US-CMP-030: Track unit XP and rank progression
**As a** player, **I want to** track XP and rank, **so that** unit progression is accurate.

**Acceptance Criteria:**
- [ ] Given a unit progression view, then XP and rank are editable for owners/organizers.
- [ ] Given XP updates, then rank updates when thresholds are crossed.
- [ ] Given values exceed limits, then validation errors are shown.

**Priority:** Critical
**Platform:** Both
**Relates to:** CMP-060, CMP-120, CMP-063
**Notes:** If offline, queue changes and mark unsynced.

#### US-CMP-031: Spend requisition points to add units or heal
**As a** player, **I want to** spend requisition points, **so that** I can manage my roster.

**Acceptance Criteria:**
- [ ] Given a requisition action, then costs and remaining points are shown.
- [ ] Given spending exceeds available points, then the action is blocked.
- [ ] Given spending succeeds, then points and roster update.

**Priority:** High
**Platform:** Both
**Relates to:** CMP-121, CMP-081
**Notes:** Track an audit log of requisition spend.

#### US-CMP-032: Assign battle honours to units
**As a** player, **I want to** assign honours, **so that** progression reflects achievements.

**Acceptance Criteria:**
- [ ] Given a unit, then available honours are listed per ruleset.
- [ ] Given an honour is selected, then it appears on the unit record.
- [ ] Given honour limits are exceeded, then selection is blocked with reason.

**Priority:** High
**Platform:** Both
**Relates to:** CMP-062, CMP-122
**Notes:** If honours affect stats, show a summary of changes.

#### US-CMP-033: Apply battle scars to units
**As a** player, **I want to** apply scars, **so that** penalties are tracked.

**Acceptance Criteria:**
- [ ] Given a unit, then applicable scars can be selected.
- [ ] Given a scar is applied, then it appears on the unit record.
- [ ] Given scar limits are exceeded, then the action is blocked.

**Priority:** High
**Platform:** Both
**Relates to:** CMP-062, CMP-122
**Notes:** Provide an undo option before saving.

#### US-CMP-034: Mark "dealer of death" after a match
**As a** player, **I want to** mark the top performer, **so that** extra progression is awarded.

**Acceptance Criteria:**
- [ ] Given a match is completed, then a prompt allows selecting the top-performing unit.
- [ ] Given a unit is selected, then the record reflects the designation.
- [ ] Given no selection is made, then the match can still be finalized with a warning.

**Priority:** Medium
**Platform:** Both
**Relates to:** CMP-123, MTH-084
**Notes:** Avoid using fixed UI labels; use generic designation text.

#### US-CMP-035: Mark unit "for greatness" before match conclusion
**As a** player, **I want to** preselect a notable unit, **so that** it receives a reward.

**Acceptance Criteria:**
- [ ] Given a match is near completion, then the user can mark a notable unit.
- [ ] Given the selection is made, then it is stored with the match record.
- [ ] Given selection is missing, then the user can continue without blocking.

**Priority:** Medium
**Platform:** Both
**Relates to:** CMP-123, MTH-084
**Notes:** If the unit is removed, clear the designation automatically.

#### US-CMP-036: Auto-apply XP from match HP tracking
**As a** player, **I want to** auto-apply XP from match data, **so that** progression is faster.

**Acceptance Criteria:**
- [ ] Given a match ends, then XP bonuses derived from tracked data are calculated.
- [ ] Given calculations complete, then users can accept or adjust before saving.
- [ ] Given match data is incomplete, then auto-apply is skipped with an explanation.

**Priority:** Medium
**Platform:** Both
**Relates to:** CMP-081, MTH-063
**Notes:** Keep a manual override for disputed results.

#### US-CMP-037: View unit's crusade card (rank, XP, honours, scars, kill tally)
**As a** player, **I want to** view a unit’s progression card, **so that** I can see its history at a glance.

**Acceptance Criteria:**
- [ ] Given a unit card, then rank, XP, honours, scars, and kill tally are visible.
- [ ] Given data changes, then the card updates without full reload.
- [ ] Given the card is shared, then only permitted fields are shown.

**Priority:** High
**Platform:** Both
**Relates to:** CMP-060, CMP-062
**Notes:** Respect sharing permissions for social features.

### Sub-epic 5e: Campaign Management (Organizer)

#### US-CMP-040: View all participant data as organizer
**As a** organizer, **I want to** view participant details, **so that** I can manage the campaign.

**Acceptance Criteria:**
- [ ] Given organizer access, then participant summaries include requisition points and army lists.
- [ ] Given data is loading, then skeletons appear.
- [ ] Given access is restricted, then organizer-only controls are hidden for non-organizers.

**Priority:** High
**Platform:** Both
**Relates to:** CMP-043, CMP-100
**Notes:** Respect privacy settings where applicable.

#### US-CMP-041: Edit campaign stages (unreached only after start)
**As a** organizer, **I want to** edit future stages, **so that** I can adjust the schedule.

**Acceptance Criteria:**
- [ ] Given the campaign has started, then only unreached stages are editable.
- [ ] Given edits are saved, then all participants see the updates.
- [ ] Given edits fail validation, then errors are shown inline.

**Priority:** Medium
**Platform:** Both
**Relates to:** CMP-101
**Notes:** Keep an audit trail of stage changes.

#### US-CMP-042: Add/remove participants
**As a** organizer, **I want to** manage participants, **so that** the roster is accurate.

**Acceptance Criteria:**
- [ ] Given organizer access, then participants can be added or removed.
- [ ] Given a participant is removed, then their active matches are handled per campaign rules.
- [ ] Given changes are saved, then participants receive notifications.

**Priority:** High
**Platform:** Both
**Relates to:** CMP-100
**Notes:** Prevent removal if it would invalidate standings without confirmation.

#### US-CMP-043: View detailed participant info (req points, unit details, progression)
**As a** organizer, **I want to** view detailed participant info, **so that** I can verify progression.

**Acceptance Criteria:**
- [ ] Given organizer access, then a detailed view shows requisition points and unit progression.
- [ ] Given data is edited, then validation rules are enforced.
- [ ] Given edits are saved, then the participant view updates.

**Priority:** Medium
**Platform:** Both
**Relates to:** CMP-060, CMP-121, CMP-063
**Notes:** Flag any edits made by organizers to participants.

## Epic 6: Social

#### US-SOC-001: View friends list
**As a** player, **I want to** see my friends list, **so that** I can manage social connections.

**Acceptance Criteria:**
- [ ] Given the list loads, then friends are grouped by status.
- [ ] Given the list is loading, then skeleton rows appear.
- [ ] Given a friend is blocked, then they are clearly labeled.

**Priority:** Critical
**Platform:** Both
**Relates to:** SOC-001
**Notes:** Respect privacy settings for friend details.

#### US-SOC-002: Add friend by code
**As a** player, **I want to** add a friend by code, **so that** I can connect quickly.

**Acceptance Criteria:**
- [ ] Given a code input, then format validation is enforced.
- [ ] Given a valid code, then a friend request is sent.
- [ ] Given an invalid code, then an error is shown without clearing input.

**Priority:** High
**Platform:** Both
**Relates to:** SOC-002
**Notes:** Rate-limit requests to prevent abuse.

#### US-SOC-003: Add friend by QR code
**As a** player, **I want to** add a friend by QR code, **so that** I can connect in person.

**Acceptance Criteria:**
- [ ] Given the scanner opens, then camera permission is requested if needed.
- [ ] Given a valid code is scanned, then a request is sent.
- [ ] Given scanning fails, then the user can retry or switch to manual entry.

**Priority:** High
**Platform:** Mobile
**Relates to:** SOC-003
**Notes:** Provide a web fallback via manual code entry.

#### US-SOC-004: Add friend by NFC (Android only)
**As a** player, **I want to** add friends by NFC, **so that** I can connect with a tap.

**Acceptance Criteria:**
- [ ] Given NFC is supported and enabled, then a tap initiates friend request.
- [ ] Given NFC is disabled, then the app provides instructions to enable it.
- [ ] Given NFC is not supported, then the feature is hidden.

**Priority:** Medium
**Platform:** Mobile
**Relates to:** SOC-004
**Notes:** Android only; include graceful fallback to code.

#### US-SOC-005: Accept/reject friend request
**As a** player, **I want to** accept or reject requests, **so that** I control my connections.

**Acceptance Criteria:**
- [ ] Given a pending request, then accept and reject actions are available.
- [ ] Given a request is accepted, then it appears in the friends list.
- [ ] Given a request is rejected, then it is removed from the pending list.

**Priority:** High
**Platform:** Both
**Relates to:** SOC-007
**Notes:** If offline, queue the response until reconnected.

#### US-SOC-006: Remove friend
**As a** player, **I want to** remove a friend, **so that** I can manage my list.

**Acceptance Criteria:**
- [ ] Given a friend entry, then a remove action is available.
- [ ] Given remove is confirmed, then the friend is removed from the list.
- [ ] Given remove fails, then the entry remains with an error message.

**Priority:** High
**Platform:** Both
**Relates to:** SOC-005
**Notes:** Removing a friend revokes shared access immediately.

#### US-SOC-007: View own friend code
**As a** player, **I want to** see my friend code, **so that** I can share it.

**Acceptance Criteria:**
- [ ] Given the social view, then the user’s code is displayed.
- [ ] Given a copy action, then the code is copied to clipboard.
- [ ] Given share is invoked, then the OS share sheet opens.

**Priority:** High
**Platform:** Both
**Relates to:** SOC-006
**Notes:** Regenerate code only via explicit user action.

#### US-SOC-008: Set sharing permissions (army lists, match history)
**As a** player, **I want to** set sharing permissions, **so that** I control what friends can see.

**Acceptance Criteria:**
- [ ] Given a friend entry, then permissions toggles are available.
- [ ] Given permissions are updated, then changes save immediately.
- [ ] Given saving fails, then the UI reverts and shows an error.

**Priority:** Medium
**Platform:** Both
**Relates to:** SOC-008
**Notes:** Default to private for new friends.

#### US-SOC-009: View friend's shared armies (if permitted)
**As a** player, **I want to** view a friend’s shared armies, **so that** I can see their lists.

**Acceptance Criteria:**
- [ ] Given permission is granted, then the friend’s shared armies are listed.
- [ ] Given permission is revoked, then access is removed immediately.
- [ ] Given data is loading, then skeletons are shown.

**Priority:** Medium
**Platform:** Both
**Relates to:** SOC-008, ARM-001
**Notes:** Show an access denied state when permission is not granted.

#### US-SOC-010: Invite friend to campaign
**As a** organizer, **I want to** invite friends to campaigns, **so that** I can build a roster quickly.

**Acceptance Criteria:**
- [ ] Given organizer access, then friends can be selected to invite.
- [ ] Given an invite is sent, then it appears as pending for the friend.
- [ ] Given an invite is declined, then the organizer is notified.

**Priority:** Medium
**Platform:** Both
**Relates to:** SOC-010, CMP-100
**Notes:** Prevent inviting users who are already participants.

## Epic 7: References

#### US-REF-001: Browse reference data (core rules, stratagems, abilities)
**As a** player, **I want to** browse reference data, **so that** I can look up rules quickly.

**Acceptance Criteria:**
- [ ] Given the reference view, then core rules, stratagems, and abilities are accessible.
- [ ] Given data is loading, then section skeletons appear.
- [ ] Given data fails to load, then a retry option is shown.

**Priority:** Critical
**Platform:** Both
**Relates to:** REF-001, REF-005
**Notes:** Ensure all content comes from plugin data.

#### US-REF-002: Search/filter references
**As a** player, **I want to** search references, **so that** I can find rules quickly.

**Acceptance Criteria:**
- [ ] Given a search input, then results update as the user types.
- [ ] Given filters are applied, then only matching items are shown.
- [ ] Given no results, then a clear empty state appears.

**Priority:** High
**Platform:** Both
**Relates to:** REF-003
**Notes:** Search should be local and work offline after initial sync.

#### US-REF-003: View unit datasheets (public, no auth required)
**As a** new player, **I want to** read datasheets without signing in, **so that** I can learn before committing.

**Acceptance Criteria:**
- [ ] Given unauthenticated web access, then datasheets are viewable read-only.
- [ ] Given a datasheet is opened, then stats, weapons, and abilities are visible.
- [ ] Given data is loading, then skeletons appear.

**Priority:** High
**Platform:** Web
**Relates to:** REF-001, ARM-100, AUTH-004
**Notes:** Block any edit controls in unauthenticated mode.

#### US-REF-004: View detachment rules and enhancements
**As a** player, **I want to** view detachment rules and enhancements, **so that** I can plan my build.

**Acceptance Criteria:**
- [ ] Given a faction selection, then detachment rules and enhancements are listed.
- [ ] Given the list is long, then filters or search are available.
- [ ] Given data fails to load, then a retry option is shown.

**Priority:** Medium
**Platform:** Both
**Relates to:** REF-002, ARM-083
**Notes:** Avoid referencing any trademarked names as fixed UI labels.

## Epic 8: Account

#### US-ACC-001: View/edit display name and avatar
**As a** player, **I want to** update my profile details, **so that** my account reflects me.

**Acceptance Criteria:**
- [ ] Given the account page, then display name and avatar are editable.
- [ ] Given edits are saved, then changes persist locally and remotely.
- [ ] Given validation fails, then inline errors are shown.

**Priority:** High
**Platform:** Both
**Relates to:** ACC-001, ACC-005
**Notes:** Avatar uploads must comply with non-trademark imagery rules.

#### US-ACC-002: Set theme preference (dark — V1 dark only)
**As a** player, **I want to** set a theme preference, **so that** my visual experience is consistent.

**Acceptance Criteria:**
- [ ] Given preferences, then theme can be set to dark only in V1.
- [ ] Given the preference changes, then the app applies it immediately.
- [ ] Given the preference is saved, then it persists across sessions.

**Priority:** Medium
**Platform:** Both
**Relates to:** ACC-002, GLB-008
**Notes:** Future themes should be guarded behind feature flags.

#### US-ACC-003: Set language preference
**As a** player, **I want to** set language preference, **so that** the app matches my locale.

**Acceptance Criteria:**
- [ ] Given preferences, then language selection is available.
- [ ] Given the language changes, then UI strings update after reload.
- [ ] Given the preference is saved, then it persists across devices.

**Priority:** Medium
**Platform:** Both
**Relates to:** ACC-002, I18N-001, I18N-005
**Notes:** V1 supports English only but must be i18n-ready.

#### US-ACC-004: Toggle push notifications
**As a** player, **I want to** manage notifications, **so that** I control alerts.

**Acceptance Criteria:**
- [ ] Given notification settings, then toggles are available for match and campaign updates.
- [ ] Given a toggle is enabled, then OS permission is requested if needed.
- [ ] Given a toggle is disabled, then notifications stop.

**Priority:** High
**Platform:** Both
**Relates to:** ACC-002
**Notes:** Web and mobile permissions must be handled separately.

#### US-ACC-005: View linked social providers
**As a** player, **I want to** view linked providers, **so that** I can manage my login methods.

**Acceptance Criteria:**
- [ ] Given the account page, then linked providers are listed.
- [ ] Given providers change, then the list updates after refresh.
- [ ] Given no providers are linked, then the UI explains how to add one.

**Priority:** High
**Platform:** Both
**Relates to:** ACC-001, AUTH-002
**Notes:** Linking/unlinking flows are handled by Auth provider UI.

#### US-ACC-006: Set default match mode (Basic/Guided)
**As a** player, **I want to** set a default match mode, **so that** new matches open in my preferred style.

**Acceptance Criteria:**
- [ ] Given preferences, then a default match mode selector is available.
- [ ] Given the default is set, then new matches open in that mode.
- [ ] Given the preference changes, then it is saved across sessions.

**Priority:** High
**Platform:** Both
**Relates to:** ACC-002, MTH-060, MTH-061
**Notes:** Existing matches keep their current mode.

## Epic 9: Tournaments (Placeholder)

#### US-TRN-001: See "Coming Soon" placeholder page
**As a** player, **I want to** see a placeholder, **so that** I know tournament features are planned.

**Acceptance Criteria:**
- [ ] Given the tournaments section is opened, then a placeholder page is displayed.
- [ ] Given the placeholder loads, then it includes a short explanation and illustration.
- [ ] Given the user navigates away, then no data is persisted.

**Priority:** Low
**Platform:** Both
**Relates to:** TRN-001
**Notes:** Avoid trademarked labels; keep text generic.

---

## Story Map (Overview Table)

| Epic | Story Count | Critical | High | Medium | Low |
|------|------------|----------|------|--------|-----|
| Game System Selection | 4 | 2 | 2 | 0 | 0 |
| Authentication | 5 | 3 | 2 | 0 | 0 |
| Army Management | ~25 | 10 | 10 | 5 | 0 |
| Match Management | ~30 | 15 | 10 | 5 | 0 |
| Campaign Management | ~20 | 5 | 10 | 5 | 0 |
| Social | 10 | 2 | 5 | 3 | 0 |
| References | 4 | 1 | 2 | 1 | 0 |
| Account | 6 | 1 | 3 | 2 | 0 |
| Tournaments | 1 | 0 | 0 | 0 | 1 |
