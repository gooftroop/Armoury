# Campaigns Page (CPG)

## Campaign Detail

**US-CPG-01: View campaign detail** `P0`
As a player, I want to see a campaign overview so that I can quickly understand the campaign name, description, status, participants, and standings.

**Acceptance Criteria:**
- [ ] Calls `GET /campaigns/{id}` and renders the response
- [ ] Displays `Campaign.name`, `Campaign.description`, `Campaign.status`, `Campaign.participants`, and `Campaign.rankings`

**Data References:** `GET /campaigns/{id}`, `Campaign.name`, `Campaign.description`, `Campaign.status`, `Campaign.participants`, `Campaign.rankings`

---

**US-CPG-02: View campaign standings/rankings** `P1`
As a player, I want to see current standings with wins, losses, and ranking points so that I know where each participant stands.

**Acceptance Criteria:**
- [ ] Renders a standings table from `Campaign.rankings`
- [ ] Each row shows the participant's wins, losses, and ranking points from `CampaignRanking`

**Data References:** `Campaign.rankings: CampaignRanking[]`

---

**US-CPG-03: View campaign participants** `P1`
As a player, I want to see all participants, their armies, and online status so that I know who is in the campaign and whether they're active.

**Acceptance Criteria:**
- [ ] Lists all entries in `Campaign.participants`
- [ ] Each entry displays `CampaignParticipant.displayName`, `CampaignParticipant.armyName`, and `UserPresence.status`

**Data References:** `Campaign.participants: CampaignParticipant[]`, `CampaignParticipant.displayName`, `CampaignParticipant.armyName`, `UserPresence.status`

---

**US-CPG-04: View Crusade unit progression** `P1`
As an organizer or player, I want to see unit progression for Crusade campaigns so that I can track XP, rank, battle honours, and battle scars.

**Acceptance Criteria:**
- [ ] Displays `CrusadeParticipantData.unitProgressions` for the current user's Crusade data
- [ ] Each unit shows its `CrusadeUnitRank`, accumulated XP, `CrusadeBattleHonour` entries, and `CrusadeBattleScar` entries

**Data References:** `CrusadeParticipantData.unitProgressions: CrusadeUnitProgression[]`, `CrusadeUnitRank`, `CrusadeBattleHonour`, `CrusadeBattleScar`

---

**US-CPG-05: Manage campaign as organizer** `P0`
As an organizer, I want to edit campaign settings, manage participants, and advance campaign phases so that I can run the campaign effectively.

**Acceptance Criteria:**
- [ ] Management controls are visible only when `CampaignParticipant.isOrganizer === true`
- [ ] Calls `PUT /campaigns/{id}` to save settings changes
- [ ] Allows advancing or modifying `Campaign.phases`

**Data References:** `PUT /campaigns/{id}`, `CampaignParticipant.isOrganizer`, `Campaign.phases`

---

**US-CPG-06: Invite players to campaign** `P1`
As an organizer, I want to invite friends to join the campaign so that I can grow the participant list.

**Acceptance Criteria:**
- [ ] Invite action is available only to the organizer (`CampaignParticipant.isOrganizer === true`)
- [ ] Only friends with `Friend.status === 'accepted'` appear in the invite list
- [ ] Sending an invite calls `POST /campaigns/{id}/participants`

**Data References:** `POST /campaigns/{id}/participants`, `Friend.status === 'accepted'`

---

**US-CPG-07: Leave a campaign** `P1`
As a player, I want to leave a campaign I've joined so that I can withdraw when I no longer want to participate.

**Acceptance Criteria:**
- [ ] A "Leave Campaign" action is available to non-organizer participants
- [ ] Confirming the action calls `DELETE /campaigns/{id}/participants/{pid}` using `CampaignParticipant.id`
- [ ] A confirmation dialog is shown before the request is sent

**Data References:** `DELETE /campaigns/{id}/participants/{pid}`, `CampaignParticipant.id`

---

## Create Campaign

**US-CPG-08: Create a new campaign** `P0`
As an organizer, I want to create a campaign with a name, description, type (matched play or Crusade), max participants, and visibility so that I can set up a new campaign for my group.

**Acceptance Criteria:**
- [ ] Form collects `Campaign.name`, `Campaign.description`, campaign type, `Campaign.maxParticipants`, and `Campaign.isPublic`
- [ ] Submitting calls `POST /campaigns` and sets `Campaign.status` to the initial state
- [ ] Validation errors are shown inline for required fields

**Data References:** `POST /campaigns`, `Campaign.name`, `Campaign.description`, `Campaign.maxParticipants`, `Campaign.isPublic`, `Campaign.status`

---

**US-CPG-09: Configure Crusade-specific settings** `P1`
As an organizer, I want to set Crusade parameters so that the campaign starts with the correct supply limit and requisition point rules.

**Acceptance Criteria:**
- [ ] Crusade configuration fields appear when the campaign type is set to Crusade
- [ ] Fields include `CrusadeRules.startingSupplyLimit` and `CrusadeRules.startingRequisitionPoints`
- [ ] Values are saved as part of the `CrusadeRules` object on campaign creation

**Data References:** `CrusadeRules`, `CrusadeRules.startingSupplyLimit`, `CrusadeRules.startingRequisitionPoints`

---

**US-CPG-10: Join a campaign** `P0`
As a player, I want to join a campaign by selecting an army to use so that I can participate with a specific force.

**Acceptance Criteria:**
- [ ] Player can select an army before joining, populating `CampaignParticipant.armyId` and `CampaignParticipant.armyName`
- [ ] Submitting calls `POST /campaigns/{id}/participants`
- [ ] The player appears in `Campaign.participants` after joining

**Data References:** `POST /campaigns/{id}/participants`, `CampaignParticipant.armyId`, `CampaignParticipant.armyName`

---

**US-CPG-11: Remove FAB from campaigns list** `P1`
As a player, I want campaign creation to be accessed from the header, not a floating button, so that the UI is consistent with other pages.

**Acceptance Criteria:**
- [ ] No Floating Action Button (FAB) appears on the Campaigns list page
- [ ] The "Create Campaign" action is a header button only, consistent with other list pages
- [ ] The header button uses secondary styling (not primary)

**Data References:** CMP-003

---

**US-CPG-12: Delete a campaign** `P1`
As an organizer, I want to delete a campaign so that I can remove campaigns that are no longer needed.

**Acceptance Criteria:**
- [ ] A "Delete Campaign" action is available to the organizer (`CampaignParticipant.isOrganizer === true`) on the Campaign Detail page
- [ ] Confirming deletion calls `DELETE /campaigns/{id}`
- [ ] A confirmation dialog requiring explicit acknowledgement is shown before deletion
- [ ] Deleting removes all `CampaignParticipant` records and `CampaignRanking` data

**Data References:** CMP-001, DELETE /campaigns/{id}, CampaignParticipant.isOrganizer

---

**US-CPG-13: Completed campaigns navigate to summary view** `P0`
As a player, I want completed campaigns to display as a read-only summary so that I can review the campaign without accidentally modifying it.

**Acceptance Criteria:**
- [ ] When a campaign's `Campaign.status` is `completed`, navigating to it shows a Campaign Summary view
- [ ] The summary is read-only: no edit controls, no management actions
- [ ] The summary displays final rankings, all participants with their armies and records, campaign description and dates
- [ ] The summary view is distinct from the active Campaign Detail page

**Data References:** CMP-001, Campaign.status, Campaign.rankings, Campaign.participants

---

**US-CPG-14: Standings at bottom of Campaign Detail** `P1`
As a player, I want standings at the bottom of the Campaign Detail page so that the primary content (army, matches, management) is prioritized.

**Acceptance Criteria:**
- [ ] The `Campaign.rankings` standings section is rendered at the bottom of the Campaign Detail page, not near the top
- [ ] Primary content (campaign info, army card, action buttons) appears above standings

**Data References:** CMP-040, Campaign.rankings

---

**US-CPG-15: Army card positioned left of campaign info** `P1`
As a player, I want the army card to be visually prominent alongside campaign info so that I can see my army at a glance.

**Acceptance Criteria:**
- [ ] The player's army card is positioned to the left of the campaign info section on desktop/tablet viewports
- [ ] On mobile, the army card stacks above the campaign info
- [ ] The army card shows `CampaignParticipant.armyName` and faction imagery

**Data References:** CMP-042, CampaignParticipant.armyName

---

**US-CPG-16: Remove phase progress bar from Campaign Detail** `P1`
As a player, I want the Campaign Detail page to be clean and focused so that unnecessary UI elements don't distract me.

**Acceptance Criteria:**
- [ ] No phase progress bar is rendered on the Campaign Detail page
- [ ] Campaign status is conveyed via the `Campaign.status` field displayed as a badge or label

**Data References:** CMP-040, Campaign.status

---

**US-CPG-17: Remove player count from Campaign Detail** `P1`
As a player, I want the Campaign Detail page to show only useful information so that the layout is not cluttered.

**Acceptance Criteria:**
- [ ] The player count is not displayed as a standalone element on the Campaign Detail page
- [ ] Participant information is available via the participants list section

**Data References:** CMP-040, Campaign.participants

---

**US-CPG-18: Campaign Detail header layout** `P1`
As a player, I want a clean header on the Campaign Detail page so that the campaign name and key actions are immediately visible.

**Acceptance Criteria:**
- [ ] The Campaign Detail page does not render a separate page header
- [ ] The campaign name is displayed prominently where the breadcrumb was
- [ ] "Play Match" and "Manage" buttons are positioned in the upper-right area
- [ ] The "Manage" button includes an icon alongside the text

**Data References:** CMP-040, CMP-043, Campaign.name

---

**US-CPG-19: Manage icon on campaign button** `P2`
As an organizer, I want the Manage button to include an icon so that it's more visually discoverable.

**Acceptance Criteria:**
- [ ] The "Manage" button on the Campaign Detail page includes an icon (e.g., gear/settings icon) alongside the text label
- [ ] The button is not text-only

**Data References:** CMP-043

---

**US-CPG-20: Match creation drawer not auto-opened on Campaign Detail** `P0`
As a player, I want the Campaign Detail page to load without the match creation drawer open so that I can see the campaign overview first.

**Acceptance Criteria:**
- [ ] The match creation drawer is NOT open by default when navigating to the Campaign Detail page
- [ ] The drawer opens only when the player explicitly clicks "Play Match"
- [ ] Navigating to Campaign Detail from any source shows the campaign overview first

**Data References:** CMP-080

---

**US-CPG-21: Unified Campaign Creation and Management page** `P1`
As an organizer, I want the Create Campaign and Campaign Management pages to share the same layout so that the UI is consistent.

**Acceptance Criteria:**
- [ ] The Create Campaign page is structurally identical to the Campaign Management page
- [ ] The Create Campaign page renders all fields in an empty/default state
- [ ] Both pages are implemented as a single component with a mode flag (create vs. manage)
- [ ] In manage mode, existing data is pre-populated

**Data References:** CMP-020 through CMP-024, Campaign fields

---

**US-CPG-22: Opponent selection limited to campaign participants** `P0`
As a player, I want opponent selection in campaign matches to only show campaign participants so that I can only play against fellow campaigners.

**Acceptance Criteria:**
- [ ] When creating a match from the Campaign Detail page, the opponent selector lists only `Campaign.participants` (not the full friends list)
- [ ] Each participant entry shows `CampaignParticipant.displayName` and their `UserPresence.status`
- [ ] Only participants with `CampaignParticipant.status === 'active'` are listed

**Data References:** CMP-080, Campaign.participants, CampaignParticipant.status, UserPresence.status

---

**US-CPG-23: Campaign creation without friends selector** `P1`
As an organizer, I want the campaign creation flow to not include a friends selector so that participant management is handled separately.

**Acceptance Criteria:**
- [ ] The Create Campaign drawer/page does NOT include a friends selector or participant invitation field
- [ ] Friends are added to campaigns separately via the Campaign Management page "Invite" flow
- [ ] The creation flow focuses only on campaign configuration (name, description, type, settings)

**Data References:** CMP-020

---
