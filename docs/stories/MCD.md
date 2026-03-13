# Match Creation Drawer (MCD)

## Army Page

**US-MCD-01: Create a match from the Army page with pre-selected army** `P0`
As a player, I want to create a match directly from an army's detail page so that the army is automatically assigned without redundant selection.

**Acceptance Criteria:**
- [ ] When the match creation drawer is opened from the "Deploy" button on an army card or the Army Detail Page, the army selector field is omitted entirely.
- [ ] The pre-selected army's `Army.name`, `Army.factionId`, `Army.battleSize`, and `Army.totalPoints` are displayed in a read-only summary.
- [ ] `MatchPlayer.armyId` and `MatchPlayer.armyName` are set automatically from the contextual army.
- [ ] The player can proceed directly to opponent and mission configuration without selecting an army.

**Data References:** `Army.name`, `Army.factionId`, `Army.battleSize`, `Army.totalPoints`, `MatchPlayer.armyId`, `MatchPlayer.armyName`

---

**US-MCD-02: Select opponents and configure match settings** `P0`
As a player, I want to choose opponents from my friends list, set battle size, and pick a mission so that I can configure a complete match before starting.

**Acceptance Criteria:**
- [ ] The drawer presents a friends list filtered to `Friend.status === 'accepted'` for opponent selection
- [ ] Battle size is selectable and stored in `MissionConfig.battleSize`
- [ ] Points limit is configurable and stored in `MissionConfig.pointsLimit`
- [ ] Mission is selectable and stored in `MissionConfig.missionId`
- [ ] At least one opponent must be selected before the match can be created

**Data References:** `MatchPlayer`, `Friend.status`, `MissionConfig.battleSize`, `MissionConfig.pointsLimit`, `MissionConfig.missionId`

---

## Match Page

**US-MCD-03: Select mission and deployment zone** `P1`
As a player, I want to pick a mission and deployment type from Chapter Approved options so that my match uses an officially sanctioned configuration.

**Acceptance Criteria:**
- [ ] Available missions are drawn from the `PrimaryMission` data and displayed for selection
- [ ] Deployment zone type is selectable from `DeploymentZone` options
- [ ] Selections are stored in `MissionConfig.missionId` and `MissionConfig.deploymentTypeId`
- [ ] The selected mission and deployment zone are shown in a summary before confirming

**Data References:** `MissionConfig.missionId`, `MissionConfig.deploymentTypeId`, `PrimaryMission`, `DeploymentZone`

---

**US-MCD-04: Configure secondary missions** `P1`
As a player, I want to choose Fixed or Tactical secondary missions so that my match scoring is fully configured before play begins.

**Acceptance Criteria:**
- [ ] Each player can independently select Fixed or Tactical secondaries
- [ ] Secondary mission selections are stored in `MissionConfig.secondariesByPlayerId` keyed by player ID
- [ ] Available secondary missions are drawn from `SecondaryMission` data
- [ ] The UI clearly indicates which secondaries are Fixed vs. Tactical

**Data References:** `MissionConfig.secondariesByPlayerId`, `SecondaryMission`

---

**US-MCD-05: Set gambit cards** `P2`
As a player, I want to choose gambit cards so that the underdog player has a strategic advantage option.

**Acceptance Criteria:**
- [ ] The gambit card selector is shown when a points differential qualifies a player as underdog
- [ ] Challenger and underdog card selections are stored in `MissionConfig.gambitByPlayerId` keyed by player ID
- [ ] Available gambit cards are drawn from `ChallengerCard` data
- [ ] The UI makes clear which player is challenger and which is underdog

**Data References:** `MissionConfig.gambitByPlayerId`, `ChallengerCard`

---

**US-MCD-08: Invite friends as opponents** `P1`
As a player, I want to invite friends as opponents via notification so that they can join my match without needing a code.

**Acceptance Criteria:**
- [ ] Friends with `Friend.status === 'accepted'` can be invited directly from the drawer
- [ ] Online friends (as indicated by `UserPresence.status`) are visually prioritised in the list
- [ ] Sending an invite creates a pending `MatchPlayer` entry with `MatchPlayer.userId` set to the invited friend
- [ ] The invited friend receives a real-time notification via the WebSocket match invite event
- [ ] The match creator can see which invites are pending

**Data References:** `Friend.status`, `UserPresence.status`, `MatchPlayer.userId`, WebSocket match invite

---

**US-MCD-09: Generate a join code and QR code** `P1`
As a player, I want a shareable join code and QR code for my match so that I can invite players who are not in my friends list.

**Acceptance Criteria:**
- [ ] Creating a match via `POST /matches` generates a `Match.joinCode`
- [ ] The join code is displayed prominently in the drawer after creation
- [ ] A QR code encoding the join code is rendered alongside the text code
- [ ] Both code formats allow any player to join the match without a prior friend connection

**Data References:** `Match.joinCode`, `POST /matches`

---

## Campaign Page

**US-MCD-06: Create a match from Campaign Detail with pre-assigned army** `P1`
As a player, I want to create a campaign match from the Campaign Detail page so that my campaign army is automatically assigned without redundant selection.

**Acceptance Criteria:**
- [ ] When the match creation drawer is opened from the Campaign Detail page, the army selector is omitted entirely.
- [ ] The Campaign section lists campaigns where the player's `CampaignParticipant.status` is active, retrieved via `GET /campaigns`.
- [ ] If the player has exactly one army for that campaign (`CampaignParticipant.armyId`), the army is auto-assigned and displayed in a read-only summary.
- [ ] If the campaign is a Crusade campaign, the drawer confirms which Crusade army will be used.
- [ ] Opponent selection is limited to campaign participants, not the full friends list.
- [ ] When no active campaigns exist, the section shows an empty state with a link to `/[locale]/wh40k10e/campaigns`.

**Data References:** `Match.campaignId`, `CampaignParticipant`, `GET /campaigns`, `CampaignParticipant.armyId`, `Campaign.participants`

---

**US-MCD-07: Select Crusade agendas for campaign match** `P1`
As a player, I want to pick agendas for XP earning in Crusade campaign matches so that my units advance according to the Crusade rules.

**Acceptance Criteria:**
- [ ] The agenda selector is displayed only for matches within a Crusade campaign
- [ ] Available agendas are drawn from `CrusadeRules.agendas`
- [ ] Selected agendas are stored in `CrusadeParticipantData`
- [ ] Each player selects their own agendas independently

**Data References:** `CrusadeRules.agendas`, `CrusadeParticipantData`

---

**US-MCD-10: Optional match time/date field** `P1`
As a player, I want the match time/date to be optional so that I'm not forced to schedule when I just want to play.

**Acceptance Criteria:**
- [ ] The time/date field in match creation is not a required field
- [ ] The field defaults to empty/unset on drawer open
- [ ] Submitting the match creation form without a date is valid
- [ ] `Match.scheduledAt` remains null when no date is provided

**Data References:** MTH-022, Match.scheduledAt

---

**US-MCD-11: Multi-select opponents from friends list** `P1`
As a player, I want to select multiple opponents from my friends list so that I can set up multiplayer matches.

**Acceptance Criteria:**
- [ ] The opponents field supports multi-select from the user's friends list, filtered to `Friend.status === 'accepted'`
- [ ] Selected friends are displayed as removable chips or tags
- [ ] The maximum number of selectable opponents is limited by the match's player limit
- [ ] Removing a chip deselects that friend from the opponents list

**Data References:** MTH-021, Friend.status, MatchPlayer

---

**US-MCD-12: Friends list alongside match code display** `P1`
As a player, I want to see the friends list and match code side-by-side so that I can invite friends or share a code without switching views.

**Acceptance Criteria:**
- [ ] On desktop viewports, the friends list and the join code (barcode/QR code) are displayed side-by-side within the match creation drawer
- [ ] On mobile viewports, the friends list and join code stack vertically
- [ ] Both invitation methods are accessible from the same view without navigating away

**Data References:** MTH-023, Match.joinCode, Friend.status

---
