# Match Linking Architecture Research (Armoury)

## 1. Executive Summary

Armoury needs a low-latency, low-cost way for two or more players to link their apps during a tabletop match and keep state synchronized with anti-cheat visibility. A **serverless-first** architecture is feasible and practical for V1: **Lambda + DynamoDB + client polling (every ~3 seconds)** with **QR code pairing** and **numeric code fallback**. This approach uses existing AWS infrastructure, tolerates intermittent connectivity, and keeps per-match cost minimal while still delivering acceptable latency for turn-based play. 

If polling latency proves insufficient or UX demands push-based updates, the recommended upgrade is **AWS AppSync GraphQL subscriptions** (still serverless, AWS-native). If cross-cloud is acceptable, **Firebase Realtime Database** offers best-in-class offline sync and reconnection handling, but introduces another provider.

## 2. Requirements Analysis

### Functional Requirements
- **Pairing:** Two devices must discover and connect to each other.
- **Real-time sync:** State changes propagate within 1–2 seconds (or close enough for turn-based play).
- **Conflict resolution:** Define deterministic rules for simultaneous updates.
- **Durability:** Must survive 2–4 hours of play.
- **Reconnection:** Handle network hiccups and device sleep.
- **Multi-player:** Support 2–4 players (free-for-all or team games).
- **Cross-platform:** React Native ↔ React Native, React Native ↔ Next.js web.
- **Match conclusion:** Both sides validate final state consistency.

### Non-Functional Requirements
- **Latency:** < 2 seconds preferred; 2–5 seconds acceptable for turn-based phases.
- **Reliability:** No data loss over multi-hour sessions.
- **Cost:** Near-zero per match (users do not pay).
- **Offline resilience:** Survive brief connectivity drops.
- **Security:** Prevent unauthorized tampering and ensure each player only writes their own state.

## 3. Pairing Mechanisms

### 3.1 QR Code Pairing (Primary)
- **Flow:** Player A creates match → app displays QR code containing `matchId`, `playerId`, public key (optional), and sync endpoint/room ID. Player B scans and joins.
- **Pros:** Fast, intuitive, works on all devices.
- **Cons:** Requires camera permission; one device must display while another scans.
- **Libraries:** `expo-camera` (scanner), `react-native-qrcode-svg` (generation), `qrcode` (web).
- **Data in QR:** JSON `{ matchId, playerId, sessionToken|roomId, endpointUrl, publicKey? }`.
- **Capacity:** Max QR data ~4,296 alphanumeric chars (Version 40) — sufficient.

### 3.2 Numeric Code Pairing (Fallback)
- **Flow:** Player A creates match → app shows code (e.g., `ABK-249`). Player B enters → backend resolves to session.
- **Pros:** No camera required; can be read aloud.
- **Cons:** Requires server-side code resolution.
- **Implementation:** Code maps to a match session/room ID in the sync service.
- **Code format:** 6 chars, avoid confusables (0/O, 1/I/L).
- **TTL:** Expire after ~30 minutes or after both players join.

### 3.3 NFC Pairing (Not Primary)
- **Pros:** “Tap to connect” feel.
- **Cons:** iOS NFC is tag-read only; Android beam is deprecated; P2P NFC cross-platform is unreliable.
- **Verdict:** Not viable for primary pairing. Consider as Android-only enhancement later.

### 3.4 Bluetooth / Wi‑Fi Direct (Not Recommended)
- **Pros:** Works without internet.
- **Cons:** iOS background restrictions, pairing complexity, battery drain, slower data rate.
- **Verdict:** Complexity outweighs benefit for a turn-based app with common Wi‑Fi availability.

**Recommendation:** QR Code pairing (primary) + Numeric code fallback. NFC as optional future enhancement (Android-only).

## 4. Real-Time Sync Architecture Options

### 4.1 WebRTC Data Channels (Serverless P2P-ish)
- **How it works:** WebRTC creates a peer-to-peer data channel after signaling.
- **Signaling:** Requires a minimal signaling service (Lambda + DynamoDB or similar).
- **Pros:** Direct encrypted P2P traffic, low latency, minimal ongoing server cost.
- **Cons:** NAT traversal often requires TURN relays; TURN is server infrastructure (not serverless). React Native WebRTC (`react-native-webrtc`) adds platform complexity. Reconnection logic is non-trivial for 3+ hour sessions.
- **Verdict:** Only partially serverless. High complexity for relatively low value in a turn-based context.

### 4.2 Firebase Realtime Database / Firestore
- **How it works:** Both clients read/write a shared document/path with realtime updates.
- **Pros:** Excellent offline persistence and automatic reconnection; strong RN support via `@react-native-firebase/database` (offline persistence supported); sub-second updates; generous free tier.
- **Cons:** Adds Google Cloud dependency; pricing can scale with reads/writes; vendor lock-in.
- **Pricing notes:** Spark (free) includes **1GB storage** and **10GB/month download** for Realtime Database (per Firebase billing docs).
- **Verdict:** Strong UX and reliability; cross-cloud decision required.

### 4.3 AWS AppSync (GraphQL Subscriptions)
- **How it works:** GraphQL API + subscriptions over WebSocket. Clients subscribe to match updates.
- **Pros:** AWS-native; scalable; integrates with Lambda authorizers or Cognito; offline sync via Amplify DataStore.
- **Cons:** More setup/maintenance than polling; Amplify is heavier for RN; subscription pricing adds cost.
- **Pricing notes (AWS AppSync):** $2.00 per million real-time updates, $0.08 per million connection-minutes (plus data transfer).
- **Verdict:** Best AWS-native realtime option when polling feels too slow.

### 4.4 Ably
- **Pros:** Clean pub/sub API, presence, RN SDK.
- **Cons:** Paid for production; another vendor; no durable offline store built-in.
- **Free tier:** 6,000,000 messages/month and 200 concurrent connections.
- **Verdict:** Feasible but adds cost/vendor dependency.

### 4.5 Pusher Channels
- **Pros:** Simple to use; RN-compatible (native WebSocket support).
- **Cons:** Small free tier; paid plans add cost quickly; no offline persistence.
- **Free tier:** 200k messages/day and 100 concurrent connections (sandbox).
- **Verdict:** Likely too constrained for scale.

### 4.6 PartyKit (Cloudflare Durable Objects)
- **Pros:** Stateful edge workers, great for multiplayer sessions.
- **Cons:** Newer ecosystem, unclear long-term pricing at scale, extra provider.
- **Verdict:** Interesting future option, not ideal for V1 stability.

### 4.7 Supabase Realtime
- **Pros:** Postgres-backed, open-source, presence, realtime channels.
- **Cons:** Adds a new DB alongside Aurora DSQL; paid overages for connections/messages.
- **Pricing notes:** $2.50 per 1M messages; $10 per 1,000 peak connections (over free quotas).
- **Verdict:** Good if already on Supabase; otherwise redundant.

### 4.8 Lambda + DynamoDB + Polling (Minimal Serverless)
- **How it works:** Match state stored in DynamoDB. Clients poll every 2–5 seconds.
- **Pros:** Very simple, fully serverless, cheap; TTL for cleanup; easy to reason about.
- **Cons:** 2–5s latency; more network traffic than push.
- **Cost model:** On-demand DynamoDB is inexpensive for low throughput. A 3s poll cadence is acceptable for turn-based gameplay.
- **Verdict:** **Best V1**. Meets latency targets in practice for tabletop play and is the lowest risk path.

## 5. Anti-Cheat Without a Trusted Server

### 5.1 Cryptographic State Validation (Optional)
- Each player signs state updates with a private key generated at match start.
- Public keys exchanged during pairing (QR payload).
- Updates include timestamps + hash of previous snapshot (hash chain).
- End-of-match exchange verifies chain integrity.
- **Limitation:** Detects retroactive tampering but doesn’t prevent real-time lying.

### 5.2 Mutual Visibility (Primary Anti-Cheat)
- Core anti-cheat is transparency: both players see VP/CP/phase/optional HP.
- This mirrors physical scorekeeping where both players can challenge errors.

### 5.3 End-of-Match Reconciliation (Required)
- Both clients compute final totals independently.
- Exchange final state via sync channel (or QR if offline).
- If discrepancies: prompt both players to confirm or resolve.

### 5.4 Recommendation
- Make mutual visibility mandatory for VP/CP and round/phase.
- Add reconciliation at match end.
- Hash chain as optional “competitive mode” feature.

## 6. Recommended Architecture

### Tier 1 (V1 — Recommended): Lambda + DynamoDB Polling
```
Pairing: QR Code (primary) + Numeric Code (fallback)
Sync: DynamoDB match state, polled every ~3 seconds
Anti-cheat: Mutual visibility + end-of-match reconciliation
Cost: Near-zero for typical usage
```

**Why:** Uses existing AWS stack, lowest complexity, good enough latency for turn-based play, easy to iterate.

### Tier 2 (V1.5 — If Real-Time Push Needed): AppSync Subscriptions
```
Pairing: QR Code + Numeric Code
Sync: AppSync GraphQL subscriptions (WebSocket)
Anti-cheat: Mutual visibility + hash chain + reconciliation
Cost: ~$0.08 per million connection-minutes + $2 per million updates (plus data transfer)
```

### Tier 3 (Alternative — If Cross-Cloud OK): Firebase Realtime Database
```
Pairing: QR Code + Numeric Code
Sync: Firebase Realtime Database (WebSocket)
Anti-cheat: Mutual visibility + reconciliation
Cost: Free tier includes 1GB storage + 10GB download/month; scales with usage
```

**Not Recommended for V1:** WebRTC (TURN relay complexity), Ably/Pusher (cost/vendor), PartyKit (immature for production V1), Bluetooth/NFC (cross-platform gaps).

## 7. Data Flow Diagram (Narrative)

1. **Match creation**
   - Player A creates a MatchRecord and receives a `matchId`.
   - App generates QR code (or numeric code) with pairing payload.

2. **Opponent joins**
   - Player B scans/enters code.
   - Backend creates Player B’s MatchRecord with `opponentMatchId` (or multi-player session list).
   - Both clients receive a shared session ID and endpoint.

3. **During match**
   - State update (VP/CP/HP/phase) → client writes to sync store.
   - Opponent polls/receives update within 1–3 seconds.
   - UI surfaces latest VP/CP + phase/turn to both players.

4. **Phase/turn progression**
   - Active player advances `GameTracker` (round/turn/phase).
   - Update propagates; both clients render identical phase state.

5. **VP/CP changes**
   - Player scores VP or spends CP → update `RoundScore` entry.
   - Opponent sees change shortly after update.

6. **Match conclusion**
   - Both clients compute final totals.
   - Exchange final snapshot; confirm or resolve discrepancies.
   - Persist final MatchRecords.

## 8. Implementation Roadmap

| Phase | What | Effort | Dependencies |
|------|------|--------|--------------|
| V1 | QR code pairing + numeric fallback | 3–4 days | expo-camera, QR libs |
| V1 | DynamoDB match state store + Lambda API | 3–4 days | AWS infra |
| V1 | Client polling (3s interval) | 2–3 days | Match state API |
| V1 | Mutual visibility UI (VP/CP display) | 2–3 days | Polling working |
| V1 | End-of-match reconciliation | 2–3 days | Match state synced |
| V1.5 | AppSync subscriptions | 1–2 weeks | AppSync schema |
| V2 | NFC pairing (Android-only) | 2–3 days | react-native-nfc-manager |
| V2 | Hash chain anti-cheat | ~1 week | crypto libs |

## 9. Open Questions
- Is 3-second polling acceptable for guided phase progression, or is push required?
- Should HP tracking be opt-in per match? (Some players may not want opponent visibility.)
- For tournament play, should an organizer act as a trusted third party?
- DynamoDB vs Aurora DSQL for match state: should match session data be stored in DynamoDB (TTL cleanup) while match records persist in Aurora?

## References (Pricing/Capability Sources)
- AWS AppSync pricing: https://aws.amazon.com/appsync/pricing/
- Firebase Realtime Database billing (Spark free tier limits): https://firebase.google.com/docs/database/usage/billing
- React Native Firebase Realtime Database offline support: https://rnfirebase.io/database/offline-support
- Ably free tier limits: https://ably.com/docs/platform/pricing/free
- Pusher Channels pricing: https://pusher.com/channels/pricing/
- Supabase Realtime pricing: https://supabase.com/docs/guides/realtime/pricing
