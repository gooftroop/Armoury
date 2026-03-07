# Match Joining (MJN)

**US-MJN-01: Accept or decline a match invite** `P1`
As a player, I want to accept or decline a match invitation so that I can respond to game invites from other players.

**Acceptance Criteria:**
- [ ] Pending match invitations are visible on the Matches and Allies pages
- [ ] Accepting an invite calls `POST /matches/{id}/players` to add the player to the match
- [ ] Declining an invite removes the pending `MatchPlayer` record
- [ ] An error is shown if the match has already started or been cancelled before the player responds
- [ ] Invite state updates in real time via WebSocket match invite events
- [ ] `MatchPlayer.status` reflects the accepted or declined state
- [ ] `MatchPlayer.userId` is set to the responding player on acceptance

**Data References:** `MatchPlayer.status`, `MatchPlayer.userId`, `POST /matches/{id}/players`, `Match.outcome.status`, WebSocket match invite event

---

**US-MJN-02: Join a match by entering a code** `P1`
As a player, I want to enter a join code so that I can join a match without needing a direct friend connection.

**Acceptance Criteria:**
- [ ] A "Join Match" action on the Matches page opens a code input field
- [ ] Entering a valid `Match.joinCode` calls `POST /matches/{joinCode}/join`, creates a `MatchPlayer` entry, and redirects the player to match setup
- [ ] An invalid or expired code shows a clear error message
- [ ] After joining, the player is prompted to select an army (unless a campaign context pre-assigns one)

**Data References:** `Match.joinCode`, `POST /matches/{joinCode}/join`, `MatchPlayer`

---

**US-MJN-03: Join a match by scanning a QR code** `P1`
As a player, I want to scan a QR code to join a match so that I can join quickly without typing a code.

**Acceptance Criteria:**
- [ ] A "Scan QR" action on the Matches page opens the device camera
- [ ] A successfully scanned QR code triggers the same join flow as US-MJN-02
- [ ] On web, the browser camera API is used; on mobile, the native camera is used
- [ ] A scan that does not resolve to a valid match join URL shows a clear error message

**Data References:** `Match.joinCode`, match join URL scheme, `POST /matches/{joinCode}/join`

---
