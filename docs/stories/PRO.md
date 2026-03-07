# Profile Page (PRO)

## Profile

**US-PRO-01: View my profile** `P0`
As a player, I want to see my profile information so that I can review my display name, avatar, email, and account creation date.

**Acceptance Criteria:**
- [ ] The profile page displays `User.displayName`, `User.avatarUrl`, `User.email`, and `User.createdAt`
- [ ] All fields are read-only on the profile view

**Data References:** `User.displayName`, `User.avatarUrl`, `User.email`, `User.createdAt`

---

**US-PRO-02: View match history on profile** `P1`
As a player, I want to see my match history on my profile so that I can review my completed matches and outcomes.

**Acceptance Criteria:**
- [ ] The profile page shows a list of completed matches retrieved via `GET /matches` filtered by userId
- [ ] Each match entry shows the outcome from `Match.outcome.resultsByPlayerId`

**Data References:** `GET /matches` (filtered by userId), `Match.outcome.resultsByPlayerId`

---

**US-PRO-03: View army showcase on profile** `P1`
As a player, I want to see my armies listed on my profile so that other players can view my forces.

**Acceptance Criteria:**
- [ ] The profile page lists the player's armies
- [ ] Each army entry shows `Army.name`, `Army.factionId`, `Army.totalPoints`, and `Army.battleSize`

**Data References:** `Army.name`, `Army.factionId`, `Army.totalPoints`, `Army.battleSize`

---

**US-PRO-04: View profile summary via popover** `P1`
As a player, I want to see a quick profile popover when I click my profile button so that I can access basic information and navigation without leaving my current page.

**Acceptance Criteria:**
- [ ] Clicking the profile button in the navigation header opens a popover overlay (not a page navigation).
- [ ] The popover displays: `User.displayName`, `User.avatarUrl`, and the player's friend code.
- [ ] The popover includes a "View Profile" link that navigates to the full Profile Page (`/[locale]/profile`).
- [ ] The popover includes a "Logout" action that ends the Auth0 session and redirects to the landing page.
- [ ] The popover is not labeled "Commander" or any game-specific term.
- [ ] The popover closes when clicking outside of it.

**Data References:** `User.displayName`, `User.avatarUrl`, `User.friendCode`, Auth0 logout flow

---

## Account Settings

**US-PRO-05: Update theme and language preferences** `P2`
As a player, I want to update theme (dark/light) and language settings so that the app suits my personal preferences.

**Acceptance Criteria:**
- [ ] The account settings page provides controls for `Account.preferences.theme` (dark/light)
- [ ] The account settings page provides controls for `Account.preferences.language`
- [ ] Changes are saved via `PUT /users/{id}/account`

**Data References:** `Account.preferences.theme`, `Account.preferences.language`, `PUT /users/{id}/account`

---

**US-PRO-06: Manage notification preferences** `P2`
As a player, I want to control notification settings so that I only receive the notifications I care about.

**Acceptance Criteria:**
- [ ] The account settings page provides controls for `Account.preferences.notifications`
- [ ] Changes are saved via `PUT /users/{id}/account`

**Data References:** `Account.preferences.notifications`, `PUT /users/{id}/account`

---

**US-PRO-07: Sync faction data for a game system** `P1`
As a player, I want to sync/refresh faction data for a specific game system so that I have the latest community data.

**Acceptance Criteria:**
- [ ] A sync action is available per game system in account settings
- [ ] Triggering the sync updates `Account.systems[].lastSynced` and `FactionData.lastSynced`
- [ ] The sync operates on factions listed in `Account.systems[].factionIds`

**Data References:** `Account.systems[].lastSynced`, `FactionData.lastSynced`, `Account.systems[].factionIds`

---

**US-PRO-08: Add a game system to the account** `P1`
As a player, I want to add a new game system and select factions of interest so that I can manage armies for that system.

**Acceptance Criteria:**
- [ ] The account settings page allows adding a new entry to `Account.systems: SystemPreferences[]`
- [ ] The player can select factions of interest during setup
- [ ] The new system is saved via `POST /users/{id}/account`

**Data References:** `Account.systems: SystemPreferences[]`, `POST /users/{id}/account`

---

**US-PRO-09: Delete the account** `P1`
As a player, I want to permanently delete my account and all associated data so that I can remove my presence from the app.

**Acceptance Criteria:**
- [ ] A delete account action is available in account settings
- [ ] A confirmation dialog is required before deletion proceeds
- [ ] Deletion calls `DELETE /users/{id}/account` and `DELETE /users/{id}`
- [ ] All associated data is removed

**Data References:** `DELETE /users/{id}/account`, `DELETE /users/{id}`, confirmation dialog required

---
