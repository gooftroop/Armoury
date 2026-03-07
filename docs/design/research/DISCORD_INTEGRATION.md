# Discord Integration Feasibility Study (Armoury)

## 1. Executive Summary

Discord integration is feasible and can add meaningful value to Armoury with low to moderate effort. The best near-term ROI is **webhook-based outbound notifications** (match results, army shares, campaign updates). A **lightweight HTTP interactions bot** unlocks higher value features like **scheduled events** without requiring a persistent gateway connection. A full WebSocket bot or Rich Presence should be deferred until there is clear user demand.

**Top-line recommendation:**
- **V1:** Webhook-only notifications (2–3 days, immediate value, minimal risk)
- **V1.5:** Add Discord account linking + HTTP interactions bot for slash commands and event creation (1–2 weeks)
- **V2:** Full gateway bot only if the community explicitly asks for realtime features

## 2. Discord API Capabilities

### 2.1 Bot API

**Scheduled Events**
- Discord supports **Guild Scheduled Events** via REST endpoints (create/modify/delete/list). Events support name, description, start/end times, and RSVPs.
- Entity types: `EXTERNAL` (location field required) or `VOICE`/`STAGE` (requires a channel).
- Limit: guilds can have up to **100 scheduled/active events** at a time.
- Permissions: `CREATE_EVENTS` (and `MANAGE_EVENTS` for edits not created by the bot). External events only need `CREATE_EVENTS` at the guild level.

**Rich Embeds**
- Bots (and webhooks) can post rich embed messages with fields, images, and colors.
- Embeds are ideal for army list summaries, match results, and campaign leaderboards.

**Slash Commands (Application Commands)**
- Slash commands are registered via HTTP and delivered as **Interactions**.
- Interactions can be received **either** via the WebSocket Gateway **or** via HTTP webhook (mutually exclusive).
- If using HTTP interactions, requests must verify `X-Signature-Ed25519` and `X-Signature-Timestamp` and respond to `PING` with `PONG`.

**Permissions/Scopes**
- For bot install, use OAuth2 with `bot` scope and a permissions bitfield.
- Required permissions for Armoury features:
  - `CREATE_EVENTS` (scheduled events)
  - `MANAGE_EVENTS` (editing events created by others)
  - `SEND_MESSAGES` + `EMBED_LINKS` (posting updates)
  - `USE_APPLICATION_COMMANDS` (slash commands)

**Rate Limits**
- Discord enforces per-route limits and a **global limit of 50 requests/second per bot**.
- Interactions endpoints are **not bound** to the global rate limit.
- Rate limits must be handled via response headers (`X-RateLimit-*`).

**Hosting Considerations**
- Full bots require a **persistent process** for the Gateway WebSocket.
- A lightweight bot can avoid Gateway entirely by using **HTTP interactions** + REST calls (Lambda/APIGW friendly).
- Suitable hosting options for full bot: ECS/Fargate, EC2, Railway, Fly.io.

### 2.2 Webhooks (Simpler Alternative)

- Incoming webhooks can post messages to a channel with **no bot user**.
- Payload supports content + embeds + attachments; a single HTTP POST is enough.
- Best for one-way push: match results, campaign updates, army list shares.
- **Limitations:** no slash commands, no scheduled event creation, no read access.
- Users can configure a webhook URL in Armoury settings (manual) or use the `webhook.incoming` OAuth flow to create one.

### 2.3 Rich Presence / Activity SDK

- Discord’s **Game SDK** (Rich Presence) exists but is **archived** and desktop-focused.
- Requires local Discord client and native SDK integration; not well suited to Expo/React Native or Next.js.
- Value is mostly cosmetic and does not deliver core scheduling/notification features.
- **Recommendation:** Skip for V1.

### 2.4 OAuth2

- Discord OAuth2 supports `identify`, `guilds`, and `guilds.members.read` scopes.
- Useful for account linking and server discovery (e.g., find Armoury users in the same guilds).
- Armoury already uses Auth0; Discord can be added as a social connection.
- User consent is required and discovery should be opt-in.

## 3. Use Cases for Armoury (ranked by value)

| Priority | Use Case | Discord Feature | Effort | Value |
|----------|----------|-----------------|--------|-------|
| 1 | Match result notifications | Webhook | Low | Medium |
| 2 | Army list sharing (formatted embed) | Webhook | Low | Medium |
| 3 | Match scheduling → Discord event | Bot (events API) | Medium | High |
| 4 | Campaign progress updates | Webhook | Low | Medium |
| 5 | LFG (looking for game) posts | Bot (slash commands) | Medium | Medium |
| 6 | Find Armoury friends in Discord | OAuth2 (guilds) | Medium | Low |
| 7 | `/armoury` slash commands | Bot (interactions) | High | Low |
| 8 | Rich Presence (playing status) | Game SDK | High | Very Low |

### 3.1 Match Result Notifications
- **UX:** When a match is completed in Armoury, a Discord channel receives a summary.
- **Embed format:** Title `Match Result`, fields for players, factions, score, date, link back to Armoury.
- **Implementation:** POST to configured webhook URL.
- **Dependencies:** Webhook URL per user or per campaign.

### 3.2 Army List Sharing
- **UX:** User taps “Share to Discord” in Armoury.
- **Embed format:** Title `Army List`, fields for faction, points, detachment, key units, optional image.
- **Implementation:** POST embed to webhook URL (or bot message if installed).
- **Dependencies:** Webhook URL, optional image hosting.

### 3.3 Match Scheduling → Discord Event
- **UX:** User schedules a match in Armoury, bot creates a Discord Scheduled Event in the selected server/channel.
- **Event format:** Name `Armoury Match: Alice vs Bob`, description includes factions, points, map, link.
- **Implementation:** REST `POST /guilds/{guild.id}/scheduled-events` with `entity_type: EXTERNAL` and location.
- **Dependencies:** Bot installed with `CREATE_EVENTS`; guild selection UI; OAuth2 linking or server config.

### 3.4 Campaign Progress Updates
- **UX:** Campaign milestones trigger Discord updates (e.g., round complete, standings).
- **Embed format:** Title `Campaign Update`, fields for standings, MVP, next round.
- **Implementation:** POST to webhook.
- **Dependencies:** Webhook URL, campaign events pipeline.

### 3.5 LFG Posts
- **UX:** User runs `/armoury lfg` in Discord; bot posts an LFG embed with match requirements.
- **Embed format:** Title `Looking for Game`, fields for format, points, time window, contact.
- **Implementation:** Interactions endpoint processes slash command and posts message.
- **Dependencies:** Bot app, interactions endpoint, command registration.

### 3.6 Find Armoury Friends in Discord
- **UX:** User links Discord account; Armoury suggests friends who share guilds.
- **Implementation:** OAuth2 `guilds` scope to fetch guild list and match against other users.
- **Dependencies:** Auth0 Discord connection, privacy controls, consent UX.

### 3.7 `/armoury` Slash Commands
- **UX:** Commands like `/armoury match create` or `/armoury army share`.
- **Implementation:** Interactions webhook + command registry, possibly requires deep link back to Armoury.
- **Dependencies:** Command registration, interactions endpoint, secure verification.

### 3.8 Rich Presence
- **UX:** “Playing Armoury” status in Discord.
- **Implementation:** Game SDK integration in native desktop app.
- **Dependencies:** Desktop app + SDK support, not available on mobile.

## 4. Architecture Options

### Option A: Webhook-Only (Minimal)
- User adds webhook URL in Armoury settings
- Armoury posts match results, army shares, campaign updates
- **Effort:** ~2–3 days
- **Limitations:** one-way, no event creation, per-channel configuration

### Option B: Lightweight Bot (HTTP Interactions)
- Discord app with Interactions Endpoint URL (HTTP)
- Slash commands handled via AWS API Gateway/Lambda
- REST API calls for scheduled events, embeds, etc.
- **Effort:** ~1–2 weeks
- **Limitations:** no real-time Gateway events (e.g., message reactions)

### Option C: Full Bot (WebSocket Gateway)
- Persistent bot connected to Discord Gateway
- Real-time events, reaction handling, DMs
- **Effort:** ~3–4 weeks + ongoing hosting cost
- **Limitations:** persistent infrastructure required

## 5. Platform Considerations

### Mobile App Store Policies
- OAuth2 and deep links to Discord are allowed.
- Discord integration must be optional (no core dependency).
- Deep link format: `discord://` can open servers/channels if installed.

### Auth0 Integration
- Auth0 supports Discord as a social login provider.
- Accounts can be linked: Discord user ID ↔ Auth0 user ID ↔ Armoury account.
- Server discovery should be opt-in with clear privacy messaging.

## 6. Effort Estimates

| Component | Estimated Effort | Dependencies |
|-----------|------------------|--------------|
| Webhook integration (push notifications) | 2–3 days | AWS Lambda endpoint |
| Discord OAuth2 (account linking) | 3–5 days | Auth0 configuration |
| Bot registration + slash commands (HTTP) | 1–2 weeks | AWS API Gateway |
| Event creation (scheduled matches) | 2–3 days (if bot exists) | Bot registered |
| Full bot with Gateway connection | 3–4 weeks | Dedicated hosting |

## 7. Recommendations

**V1 (Launch): Webhook-only integration**
- Users paste a webhook URL → Armoury pushes match results + army list shares.
- Minimal effort, immediate value, no account linking required.

**V1.5 (Post-launch): OAuth2 + HTTP interactions bot**
- Add Discord linking via Auth0.
- Enable `/armoury` commands and Discord scheduled events.
- Works well with AWS Lambda/API Gateway.

**V2 (If demand exists): Full bot capabilities**
- Only if users request real-time/DM features.
- Higher ops cost and hosting complexity.

**Not Recommended (for V1):**
- Rich Presence (archived Game SDK, desktop-only, low value)
- Full Gateway bot (overkill without proven demand)

## 8. Open Questions

1. Should Discord integration be an official Armoury feature or a community plugin?
2. Should the bot be centralized (Armoury-hosted) or per-server (community-run)?
3. How should Armoury handle users who do not use Discord?

## References

- Discord Guild Scheduled Events API
  - https://raw.githubusercontent.com/discord/discord-api-docs/main/docs/resources/guild-scheduled-event.mdx
- Discord Webhooks API
  - https://raw.githubusercontent.com/discord/discord-api-docs/main/docs/resources/webhook.mdx
- Discord Interactions (Receiving & Responding)
  - https://raw.githubusercontent.com/discord/discord-api-docs/main/docs/interactions/receiving-and-responding.mdx
  - https://raw.githubusercontent.com/discord/discord-api-docs/main/docs/interactions/overview.mdx
- Discord Application Commands
  - https://raw.githubusercontent.com/discord/discord-api-docs/main/docs/interactions/application-commands.mdx
- Discord OAuth2
  - https://raw.githubusercontent.com/discord/discord-api-docs/main/docs/topics/oauth2.mdx
- Discord Rate Limits
  - https://raw.githubusercontent.com/discord/discord-api-docs/main/docs/topics/rate-limits.md
- Discord Game SDK (Archived)
  - https://raw.githubusercontent.com/discord/discord-api-docs/main/docs/developer-tools/game-sdk.mdx
