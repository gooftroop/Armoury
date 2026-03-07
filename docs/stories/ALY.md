# Allies Page (ALY)

**US-ALY-01: Send a friend request** `P1`
As a player, I want to send a friend request via multiple methods so that I can connect with other players conveniently regardless of platform.

**Acceptance Criteria:**
- [ ] The Allies Page (`/[locale]/[gameSystem]/social`) presents an "Add Friend" flow with tabs: **By Name**, **By Code**, **By QR**, **By NFC**.
- [ ] **By Name**: Searching for players by `User.displayName` and sending a request.
- [ ] **By Code**: Entering a friend code (from `User.friendCode`) to send a request directly.
- [ ] **By QR**: Scanning a QR code encoding the friend's code or profile URL to send a request.
- [ ] **By NFC**: Tapping devices together to exchange friend codes and send a request. NFC is available on both Android and iOS.
- [ ] Sending a request by any method creates a `Friend` record with `status: 'pending'`, `requesterId` set to the current user, and `recipientId` set to the target user.
- [ ] The requesting player sees the request in a "Pending" state.
- [ ] The recipient sees the request in their incoming requests list.

**Data References:** `Friend.requesterId`, `Friend.recipientId`, `Friend.status`, `User.displayName`, `User.friendCode`, NFC APIs (Android + iOS)

---

**US-ALY-02: Accept or decline a friend request** `P0`
As a player, I want to accept or decline incoming friend requests so that I can control who is on my friends list.

**Acceptance Criteria:**
- [ ] Incoming requests are listed with the requester's `User.displayName` and `User.avatarUrl`
- [ ] Accepting a request updates `Friend.status` to `'accepted'`
- [ ] Declining a request deletes the `Friend` record

**Data References:** `Friend.requesterId`, `Friend.recipientId`, `Friend.status`, `User.displayName`

---

**US-ALY-03: View friends list with presence** `P0`
As a player, I want to see all accepted friends with their online/offline status so that I know who is available to play.

**Acceptance Criteria:**
- [ ] Lists friends where `Friend.status === 'accepted'`
- [ ] Shows `UserPresence.status` (online, offline, in_match, in_army_builder)
- [ ] Real-time updates via `friendOnline`/`friendOffline` WebSocket events

**Data References:** `Friend.status`, `UserPresence.status`, WebSocket `friendOnline`, `friendOffline`

---

**US-ALY-04: Remove a friend** `P1`
As a player, I want to remove an accepted friend from my list so that I can manage who I'm connected with.

**Acceptance Criteria:**
- [ ] A remove action deletes the `Friend` record
- [ ] A confirmation dialog is required before the deletion is sent

**Data References:** `Friend.id`, `DELETE /friends/{id}` (or equivalent)

---

**US-ALY-05: Block a user** `P1`
As a player, I want to block another user so that they cannot send me friend requests or match invites.

**Acceptance Criteria:**
- [ ] Blocking sets `Friend.status` to `'blocked'`
- [ ] Blocked users cannot send friend requests or match invites

**Data References:** `Friend.status: 'blocked'`

---

**US-ALY-06: Invite a friend to a match** `P1`
As a player, I want to quickly invite a friend to a match from the Allies page so that I can start a game without navigating away.

**Acceptance Criteria:**
- [ ] An "Invite to Match" action is available on each friend row
- [ ] Triggering the action opens the match creation drawer with the friend pre-selected as opponent

**Data References:** `Friend.recipientId`, `MatchPlayer`, match creation flow

---

**US-ALY-07: Visible three-dot action menu on friend rows** `P1`
As a player, I want the action menu on friend rows to be always visible so that I can access actions without hover.

**Acceptance Criteria:**
- [ ] Each friend row in the allies list has a visible three-dot (⋮) action menu
- [ ] The menu is NOT hidden behind a hover-only state
- [ ] The menu contains actions: View Profile, Invite to Match, Remove Friend, Block

**Data References:** SOC-005, SOC-008

---

**US-ALY-08: Clear tap affordance on friend rows** `P1`
As a player, I want friend rows to clearly indicate they are tappable so that I know interaction is possible.

**Acceptance Criteria:**
- [ ] Tapping a friend row triggers a visible navigation or action (e.g., opens friend profile or detail view)
- [ ] The row has a clear tap/click affordance (e.g., hover highlight, press state, chevron icon)
- [ ] The behavior is consistent across all friend rows

**Data References:** SOC-001

---

**US-ALY-09: Filters below incoming friend requests** `P2`
As a player, I want filters positioned below the incoming requests section so that new requests are always visible first.

**Acceptance Criteria:**
- [ ] The Allies Page renders incoming friend requests (pending, where `Friend.recipientId === currentUser.id`) at the top of the page
- [ ] Filter controls appear below the incoming requests section
- [ ] Filters include: online status, alphabetical, recently active

**Data References:** SOC-001, Friend.status, Friend.recipientId

---

**US-ALY-10: Friend code in profile popover** `P1`
As a player, I want my friend code accessible in the profile popover so that I can share it quickly from anywhere.

**Acceptance Criteria:**
- [ ] The profile popover (US-PRO-04) displays the player's friend code (`User.friendCode`)
- [ ] The friend code is copy-able (tap to copy)
- [ ] The friend code is also accessible from the Allies Page for redundancy

**Data References:** SOC-006, User.friendCode

---
