# Armoury UI Requirements Specification

**Purpose:** Define the functional and non-functional requirements for Armoury’s UI across web and mobile. This is the source of truth for what gets built. Visual specifications live in `STYLE_GUIDE.md`.

**Scope:** Web (Next.js 15 + Radix UI + Tailwind v4 + Lucide) and Mobile (Expo 53 + React Native 0.79 + Tamagui v2). Game-agnostic shell with Warhammer 40K as first plugin.

**Audience:** Product designers, frontend engineers, AI agents implementing UI.

**Related Documents:**
- `DECISIONS.md` (architecture choices; see referenced DD-xxx)
- `STYLE_GUIDE.md` (visual specs)
- `DESIGN_TOKENS.md`
- `ART_DIRECTION.md` (AI imagery and asset catalog)
- `INFORMATION_ARCHITECTURE.md`
- `MATCH_EXPERIENCE.md`
- `FLOWS.md`
- `USER_STORIES.md` (user stories with acceptance criteria)

---

## 1. Overview

Armoury is a tabletop army management app. UI requirements must support a game-agnostic shell with plugin-provided content. V1 focuses on Warhammer 40K and expands to Age of Sigmar and Horus Heresy via plugins.

Primary objectives:
- Enable fast army building, validation, and reference access
- Support match tracking (Basic + Guided) with cross-device sync
- Provide campaign and social features for long-term play
- Maintain parity across web and mobile while respecting platform conventions

---

## 2. Global Requirements

### 2.1 Platform Requirements
| Requirement ID | Description | Web | Mobile | Priority |
|---|---|---|---|---|
| GLB-001 | Responsive layout: desktop, tablet, mobile browser | Yes | N/A | Critical |
| GLB-002 | Bottom navigation for small screens | Yes (<768px) | Yes (always) | Critical |
| GLB-003 | Side navigation for tablet/desktop | Yes (≥768px) | No | Critical |
| GLB-004 | Modals convert to takeover screens on small screens | Yes (<768px) | Yes | Critical |
| GLB-005 | Skeleton loaders for all loading states | Yes | Yes | Critical |
| GLB-006 | Incremental loading (render-as-you-fetch) | Yes | Yes | High |
| GLB-007 | Consistent layout: header + nav + content area | Yes | Yes | Critical |
| GLB-008 | Dark tactical theme (no light theme in V1) | Yes | Yes | Critical |
| GLB-009 | Auth0 integration for login/registration | Yes | Yes | Critical |
| GLB-010 | Native browser back/forward navigation | Yes | N/A | Critical |
| GLB-011 | Header back button for navigation | N/A | Yes | Critical |
| GLB-012 | Header: page name + profile icon (web) | Yes | Partial (no profile icon, Account in nav) | Critical |
| GLB-013 | Profile popover: profile, account, logout (or login if logged out) | Yes | N/A | High |
| GLB-014 | No trademark violations — all imagery AI-generated | Yes | Yes | Critical |
| GLB-015 | Game-specific content only through plugins | Yes | Yes | Critical |
| GLB-016 | Shared design token system (Tailwind + Tamagui) | Yes | Yes | High |

### 2.2 Performance Requirements
- PRF-001: First Contentful Paint < 1.5s (web) — **Critical**
- PRF-002: Time to Interactive < 3s (web) — **Critical**
- PRF-003: Largest Contentful Paint < 2.5s (web) — **High**
- PRF-004: Cumulative Layout Shift < 0.1 (web) — **High**
- PRF-005: Initial JS bundle < 200KB (web) — **High**
- PRF-006: Lazy load below-the-fold images; eager load hero images — **High**
- PRF-007: Virtualize lists > 20 items — **Critical**

### 2.3 Accessibility Requirements
- A11Y-001: WCAG 2.1 AA compliance — **Critical**
- A11Y-002: Contrast ≥ 4.5:1 (text), 3:1 (large text) — **Critical**
- A11Y-003: Touch targets ≥ 44×44px (mobile) — **Critical**
- A11Y-004: Focus indicators visible on all interactive elements — **Critical**
- A11Y-005: Screen reader labels for all interactive elements — **Critical**
- A11Y-006: Respect `prefers-reduced-motion` — **High**
- A11Y-007: Color-independent status indicators (icon + color) — **Critical**

### 2.4 Internationalization Requirements
- I18N-001: All user-facing strings must be externalizable — **Critical**
- I18N-002: Support RTL layout structure (future) — **Medium**
- I18N-003: Date/time formatting respects user locale — **High**
- I18N-004: Number formatting respects locale (comma/period) — **High**
- I18N-005: V1 language: English only (i18n-ready) — **Critical**

### 2.5 Offline Requirements
- OFF-001: Faction data and units cached locally after first sync — **Critical**
- OFF-002: Army building works fully offline — **Critical**
- OFF-003: Match tracking requires connectivity — **High**
- OFF-004: Offline indicator shown when disconnected — **High**
- OFF-005: Auto-sync when connectivity returns — **High**

---

## 3. Feature Requirements

**Format:**
| ID | Requirement | Priority | Platform | Notes |

### 3.1 Game System Selection
| ID | Requirement | Priority | Platform | Notes |
|---|---|---|---|---|
| GSS-001 | Landing page lists available game systems from plugins | Critical | Both | Plugin-provided metadata only |
| GSS-002 | Selecting a system triggers first-time data sync | Critical | Both | See DD-xxx for sync strategy |
| GSS-003 | Sync progress indicator with status messages | High | Both | Show elapsed + stages |
| GSS-004 | After sync, navigate to game system home (Army List) | Critical | Both | Remember last path |
| GSS-005 | Remember last-used game system for next launch | High | Both | Store in Account preferences |
| GSS-006 | Ability to switch systems from navigation | High | Both | Confirm if unsaved edits |

### 3.2 Authentication
| ID | Requirement | Priority | Platform | Notes |
|---|---|---|---|---|
| AUTH-001 | Auth0 Universal Login for sign-in/up | Critical | Both | Web SPA SDK, RN SDK |
| AUTH-002 | Social login providers: Google, Apple, Discord | High | Both | Auth0 config |
| AUTH-003 | Mobile: redirect to login if unauthenticated | Critical | Mobile | Hard gate for protected routes |
| AUTH-004 | Web: allow browsing, restrict create/edit | High | Web | Show read-only banners |
| AUTH-005 | Account page for profile management | High | Both | Uses Account model |
| AUTH-006 | Logout functionality | Critical | Both | Clear local caches |
| AUTH-007 | Token refresh handled transparently | Critical | Both | Silent renewal |
| AUTH-008 | Account data cached locally | High | Both | Account model cache |

### 3.3 Army Management

**Domain Models:** `Army`, `ArmyUnit`, `Unit`, `FactionData`.

#### 3.3.1 The Forge (Army List)
| ID | Requirement | Priority | Platform | Notes |
|---|---|---|---|---|
| ARM-001 | List all armies owned by user | Critical | Both | From `Army.ownerId` |
| ARM-002 | Display army card data: name, faction, points, battle size, updated timestamp | Critical | Both | `Army` fields |
| ARM-003 | Create new army CTA | Critical | Both | FAB on mobile |
| ARM-004 | Delete army with confirmation | High | Both | Destructive confirm |
| ARM-005 | Filter by faction and sort by updated/date | Medium | Both | Local sorting |
| ARM-006 | Empty state when no armies | High | Both | CTA to create |
| ARM-007 | Loading skeletons for list | Critical | Both | Skeletons match card |
| ARM-008 | Read-only banner if unauthenticated (web) | High | Web | Disable create/edit |

#### 3.3.2 Army Creation Page
| ID | Requirement | Priority | Platform | Notes |
|---|---|---|---|---|
| ARM-020 | Input: army name | Critical | Both | Required, min 3 chars |
| ARM-021 | Faction picker (from plugin data) | Critical | Both | `FactionData` list |
| ARM-022 | Detachment selection | High | Both | Depends on faction |
| ARM-023 | Points limit selector with presets | High | Both | Incursion/StrikeForce/Onslaught + custom |
| ARM-024 | Optional image upload or default faction image | Medium | Both | AI-generated only |
| ARM-025 | Create action disabled until required fields valid | Critical | Both | Validation messaging |
| ARM-026 | Validation errors inline for invalid fields | Critical | Both | e.g., missing name |
| ARM-027 | Loading state while saving | High | Both | Disable inputs |

#### 3.3.3 Army Detail Page (Army Builder)
| ID | Requirement | Priority | Platform | Notes |
|---|---|---|---|---|
| ARM-040 | Header displays army name, points total, points limit | Critical | Both | `Army.totalPoints`, `pointsLimit` |
| ARM-041 | Detachment selector inline | High | Both | Updates available enhancements |
| ARM-042 | Unit sections by category | Critical | Both | Characters, Battleline, Transports, Dreadnoughts, Walkers, Vehicles, Auxiliary, Allied |
| ARM-043 | Add unit action per section | Critical | Both | Opens add-unit modal |
| ARM-044 | Remove unit action per unit | High | Both | Confirmation required |
| ARM-045 | Section-level summary (count, points) | High | Both | `ArmyUnit.totalPoints` sum |
| ARM-046 | Validation summary panel for army rules | Critical | Both | Uses validation engine |
| ARM-047 | Display army notes with edit | Medium | Both | `Army.notes` |
| ARM-048 | Save state indicator (synced/dirty) | High | Both | Optimistic updates |
| ARM-049 | Loading skeletons for section lists | Critical | Both | Per section |

#### 3.3.4 Add Unit Modal / Drawer
| ID | Requirement | Priority | Platform | Notes |
|---|---|---|---|---|
| ARM-060 | Filter units by section/category | Critical | Both | Uses unit keywords |
| ARM-061 | Tile shows image, name, model count, enhancements, points | Critical | Both | `Unit` + `ArmyUnit` |
| ARM-062 | Add button per tile | Critical | Both | Adds default config |
| ARM-063 | Disabled state with reason text if invalid | Critical | Both | e.g., limit exceeded |
| ARM-064 | Search/filter by name and keyword | High | Both | Includes faction keywords |
| ARM-065 | URL-addressable for deep links | High | Web | See DD-xxx for routing |
| ARM-066 | Loading skeletons on open | High | Both | Quick open perception |

#### 3.3.5 Unit Configuration + Datasheet Page (Interactive)
| ID | Requirement | Priority | Platform | Notes |
|---|---|---|---|---|
| ARM-080 | Display unit stats, weapons, abilities, keywords | Critical | Both | `Unit` data |
| ARM-081 | Configure model count and per-model weapons | Critical | Both | `ArmyUnit.modelConfigs` |
| ARM-082 | Wargear selection with validation | Critical | Both | `ArmyUnit.wargearSelections` |
| ARM-083 | Enhancement selection (nullable) | High | Both | `ArmyUnit.enhancement` |
| ARM-084 | Points total displayed in header | Critical | Both | Monospace display |
| ARM-085 | Validation errors inline for illegal configs | Critical | Both | Use rule messages |
| ARM-086 | Save disabled if validation fails | High | Both | Show reason |
| ARM-087 | Loading skeletons for unit data | High | Both | Per section |

#### 3.3.6 Unit Datasheet Page (Read-Only)
| ID | Requirement | Priority | Platform | Notes |
|---|---|---|---|---|
| ARM-100 | Read-only view of full datasheet | Critical | Both | `Unit` stats |
| ARM-101 | Show composition and per-model points | High | Both | `Unit.composition` |
| ARM-102 | Show all weapons with profiles | Critical | Both | Ranged + melee |
| ARM-103 | Show abilities and keywords | Critical | Both | `Unit.abilities`, `keywords` |
| ARM-104 | Loading skeletons for datasheet | High | Both | Table skeletons |

### 3.4 Match Management

**Domain Models:** `MatchRecord`, `GamePhase`, `Army`.

#### 3.4.1 Matches List Page
| ID | Requirement | Priority | Platform | Notes |
|---|---|---|---|---|
| MTH-001 | List matches grouped by past/present/planned | Critical | Both | From match dates |
| MTH-002 | Filter and sort by date, status, opponent | High | Both | Client-side sort |
| MTH-003 | Create match CTA | Critical | Both | FAB on mobile |
| MTH-004 | Match card shows score, status, date, armies | High | Both | `MatchRecord` |
| MTH-005 | Loading skeletons for list | Critical | Both | Skeleton cards |

#### 3.4.2 Match Creation Drawer/Screen
| ID | Requirement | Priority | Platform | Notes |
|---|---|---|---|---|
| MTH-020 | Default match name generated | High | Both | “vs <Opponent> — <Date>” |
| MTH-021 | Army picker (user’s armies) | Critical | Both | `Army.id` |
| MTH-022 | Date/time picker | High | Both | Local timezone |
| MTH-023 | Match linking via QR or numeric code | Critical | Both | See DD-xxx for linking |
| MTH-024 | Validation on required fields | Critical | Both | Inline errors |
| MTH-025 | Loading state while creating | High | Both | Disable inputs |

#### 3.4.3 Match Page Modes (Past/Future/Active)
| ID | Requirement | Priority | Platform | Notes |
|---|---|---|---|---|
| MTH-040 | Past matches are read-only | Critical | Both | No edits |
| MTH-041 | Future matches allow edits | High | Both | Name/date/army |
| MTH-042 | Active match enters immersive mode | Critical | Both | Full-screen focus |
| MTH-043 | Mode switch visible and explicit | High | Both | Prevent accidental edits |

#### 3.4.4 Active Match: Basic + Guided (V1)
| ID | Requirement | Priority | Platform | Notes |
|---|---|---|---|---|
| MTH-060 | Basic mode: manual VP/CP tracking | Critical | Both | No prompts |
| MTH-061 | Guided mode: phase-based prompts | Critical | Both | Uses `GamePhase` |
| MTH-062 | VP/CP counters with +/− and history | Critical | Both | Sync with opponent |
| MTH-063 | Model HP tracking per unit | High | Both | Uses `armyHPState` |
| MTH-064 | Phase progression UI | Critical | Both | Command → Movement → Shooting → Charge → Fight |
| MTH-065 | Sync state indicator | Critical | Both | Polling v1 (DD-xxx) |
| MTH-066 | Command Post reference panel | High | Both | Army snapshot |
| MTH-067 | Context-aware ability/stratagem surfacing | High | Both | From `FactionData` |
| MTH-068 | Pause/resume match | Medium | Both | Saves state |
| MTH-069 | Undo last scoring change | Medium | Both | Time-limited |

#### 3.4.5 Match Conclusion and Validation
| ID | Requirement | Priority | Platform | Notes |
|---|---|---|---|---|
| MTH-080 | End match action with confirmation | Critical | Both | Prevent accidental end |
| MTH-081 | Reconcile scores with opponent | Critical | Both | Anti-cheat DD-xxx |
| MTH-082 | Validate total VP and final state | High | Both | Flag discrepancies |
| MTH-083 | Store match result and summary | Critical | Both | `MatchRecord` |
| MTH-084 | Post-match summary view | High | Both | MVPs, VP breakdown |

### 3.5 Campaign Management

**Domain Models:** `MasterCampaign`, `ParticipantCampaign`, `CrusadeRules`, `CrusadeUnitProgression`.

#### 3.5.1 Campaigns List Page
| ID | Requirement | Priority | Platform | Notes |
|---|---|---|---|---|
| CMP-001 | List campaigns user participates in | Critical | Both | `MasterCampaign` |
| CMP-002 | Campaign card shows name, type, status, dates | High | Both | Crusade/generic |
| CMP-003 | Create campaign CTA | High | Both | Organizer-only |
| CMP-004 | Loading skeletons | High | Both | Card skeletons |

#### 3.5.2 Campaign Creation Page
| ID | Requirement | Priority | Platform | Notes |
|---|---|---|---|---|
| CMP-020 | Input: name and type (crusade/generic) | Critical | Both | Required |
| CMP-021 | Select ruleset (crusade rules) | High | Both | `CrusadeRules` |
| CMP-022 | Define phases/stages | Medium | Both | Optional |
| CMP-023 | Define narrative/description | Medium | Both | Rich text optional |
| CMP-024 | Validation for required fields | Critical | Both | Inline errors |

#### 3.5.3 Campaign Page (Dashboard)
| ID | Requirement | Priority | Platform | Notes |
|---|---|---|---|---|
| CMP-040 | Dashboard shows standings, phases, participants | Critical | Both | `MasterCampaign` |
| CMP-041 | Upcoming matches list | High | Both | Linked matches |
| CMP-042 | Army section for participant armies | High | Both | `ParticipantCampaign` |
| CMP-043 | Organizer actions visible to organizers | High | Both | Role-based UI |

#### 3.5.4 Campaign Unit Page
| ID | Requirement | Priority | Platform | Notes |
|---|---|---|---|---|
| CMP-060 | Show crusade progression per unit | Critical | Both | `CrusadeUnitProgression` |
| CMP-061 | Editable XP, rank, tallies | High | Both | Organizer/owner |
| CMP-062 | Battle honours and scars list | High | Both | Add/remove |
| CMP-063 | Validation for progression limits | High | Both | Rules from `CrusadeRules` |

#### 3.5.5 Campaign Matches
| ID | Requirement | Priority | Platform | Notes |
|---|---|---|---|---|
| CMP-080 | Campaign match inherits match flow | Critical | Both | Extends `MatchRecord` |
| CMP-081 | Crusade-specific scoring and rewards | High | Both | XP, requisitions |
| CMP-082 | Link match results to campaign standings | High | Both | Auto update |

#### 3.5.6 Campaign Management (Organizer)
| ID | Requirement | Priority | Platform | Notes |
|---|---|---|---|---|
| CMP-100 | Manage participants (invite/remove) | High | Both | Organizer-only |
| CMP-101 | Edit phases, rules, narrative | Medium | Both | With validation |
| CMP-102 | Approve or review match submissions | Medium | Both | Optional workflow |
| CMP-103 | Export campaign summary | Low | Web | CSV/PDF later |

#### 3.5.7 Crusade Mechanics
| ID | Requirement | Priority | Platform | Notes |
|---|---|---|---|---|
| CMP-120 | Track XP and rank thresholds | Critical | Both | `CrusadeRules` |
| CMP-121 | Track requisition points and supply limit | High | Both | `ParticipantCampaign` |
| CMP-122 | Track battle honours and scars | High | Both | `CrusadeUnitProgression` |
| CMP-123 | Dealers of death + mark for greatness | Medium | Both | Campaign scoring rules |

### 3.6 Social

**Domain Model:** `Friend`.

| ID | Requirement | Priority | Platform | Notes |
|---|---|---|---|---|
| SOC-001 | Friends list with status (pending/accepted/blocked) | Critical | Both | `Friend.status` |
| SOC-002 | Add friend by code | Critical | Both | User code |
| SOC-003 | Add friend by QR code | High | Both | Scanner integration |
| SOC-004 | Add friend by NFC (Android only) | Medium | Mobile | Android only |
| SOC-005 | Remove friend / block friend | High | Both | Confirmation required |
| SOC-006 | Display own friend code | High | Both | Copy/share actions |
| SOC-007 | Friend request flow (pending → accepted) | Critical | Both | Notifications optional |
| SOC-008 | Sharing permissions per friend | High | Both | Army lists, match history |
| SOC-009 | Auto-friend on match linking | Medium | Both | Opt-in toggle |
| SOC-010 | Campaign invites to friends | Medium | Both | Organizer flow |
| SOC-011 | Army comparison view | Low | Both | Side-by-side summary |

### 3.7 References

**Domain Model:** `FactionData`.

| ID | Requirement | Priority | Platform | Notes |
|---|---|---|---|---|
| REF-001 | Reference page shows core rules | Critical | Both | Plugin provided |
| REF-002 | Show detachment rules and stratagems | High | Both | `FactionData` |
| REF-003 | Search/filter across rules | High | Both | Index local data |
| REF-004 | Faction-agnostic shell | Critical | Both | No hardcoded terms |
| REF-005 | Loading skeletons | High | Both | Section skeletons |

### 3.8 Account

**Domain Model:** `Account`.

| ID | Requirement | Priority | Platform | Notes |
|---|---|---|---|---|
| ACC-001 | Profile page with display name, avatar, linked providers | High | Both | `Account` fields |
| ACC-002 | Preferences: theme, language, notifications | High | Both | `Account.preferences` |
| ACC-003 | Mobile: account page in bottom nav | Critical | Mobile | Dedicated tab |
| ACC-004 | Web: account page accessible from profile popover | High | Web | Header menu |
| ACC-005 | Persist preferences locally and remotely | High | Both | Optimistic updates |

### 3.9 Tournaments
| ID | Requirement | Priority | Platform | Notes |
|---|---|---|---|---|
| TRN-001 | Placeholder page “Coming Soon” | Medium | Both | Thematic illustration |

---

## 4. Cross-Platform Matrix

| Feature | Shared (business logic in @armoury/shared) | Web-specific | Mobile-specific |
|---------|---------------------------------------------|-------------|-----------------|
| Army CRUD | ✓ | SSR/RSC for initial load | SQLite adapter |
| Validation engine | ✓ |  |  |
| Data sync (GitHub) | ✓ | IndexedDB adapter | SQLite adapter |
| Match state sync | ✓ (polling logic) | WebSocket fallback | Background fetch |
| Auth | ✓ (token management) | Auth0 SPA SDK | Auth0 React Native SDK |
| Navigation |  | Next.js App Router | Expo Router |
| UI components | Shared tokens/theme | Radix UI | Tamagui |

---

## 5. Plugin Architecture UI Requirements

| ID | Requirement | Priority | Platform | Notes |
|---|---|---|---|---|
| PLG-001 | Game-agnostic shell for navigation, layout, auth, social | Critical | Both | No game terms in shell |
| PLG-002 | Plugin provides faction list, units, stratagems, detachments | Critical | Both | `FactionData` |
| PLG-003 | Plugin provides game phases and validation rules | Critical | Both | `GamePhase` + validation engine |
| PLG-004 | Plugin provides faction imagery mappings | High | Both | AI-generated only |
| PLG-005 | Plugin UI extension points defined | High | Both | See DD-xxx |
| PLG-006 | Shell must render without plugin-specific imports | Critical | Both | Dependency boundary |

---

## 6. Data Loading Patterns

| ID | Requirement | Priority | Platform | Notes |
|---|---|---|---|---|
| DLP-001 | Render-as-you-fetch (initiate fetch before render) | High | Both | Streaming where available |
| DLP-002 | Skeletons match final layout | Critical | Both | No layout shift |
| DLP-003 | Error boundaries with graceful messaging | Critical | Both | Retry + contact info |
| DLP-004 | Auto-retry failed fetches (3 attempts, exponential backoff) | High | Both | Backoff 0.5s/1s/2s |
| DLP-005 | Cache strategy: stale-while-revalidate for faction data | High | Both | `FactionData` |
| DLP-006 | Real-time/near-real-time for match data | Critical | Both | Polling v1 |
| DLP-007 | Optimistic updates for army editing | High | Both | Rollback on failure |

---

## 7. Security Requirements

| ID | Requirement | Priority | Platform | Notes |
|---|---|---|---|---|
| SEC-001 | No sensitive data stored client-side in plaintext | Critical | Both | Use secure storage |
| SEC-002 | CSRF protection (SameSite + tokens) | High | Web | Auth0 integration |
| SEC-003 | Input sanitization on all user inputs | Critical | Both | Server + client |
| SEC-004 | Rate limiting on API calls | High | Both | API Gateway |
| SEC-005 | No direct DB access from client | Critical | Both | All via API |

---

## 8. Validation Behaviors (Global)

| ID | Requirement | Priority | Platform | Notes |
|---|---|---|---|---|
| VAL-001 | Disabled states must include reason text | Critical | Both | Tooltip or inline |
| VAL-002 | Errors are inline near field, plus summary where relevant | Critical | Both | Army summary panel |
| VAL-003 | All form submissions prevented on validation failure | Critical | Both | Highlight first error |
| VAL-004 | Validation rules sourced from shared engine | Critical | Both | No UI-only rules |
| VAL-005 | Over-limit points show warning, not auto-block | High | Both | Ruleset dependent |

---

## 9. Page/Feature Inventory Checklist (V1)

All items below must be implemented and covered by requirements above:

1. Game System Selection
2. Authentication (login/logout/account)
3. The Forge (Army List)
4. Army Creation Page
5. Army Detail (Builder) Page
6. Add Unit Modal/Drawer
7. Unit Configuration + Interactive Datasheet
8. Unit Datasheet (Read-Only)
9. Matches List Page
10. Match Creation Drawer/Screen
11. Match Page (Past/Future/Active)
12. Active Match — Basic Mode
13. Active Match — Guided Mode
14. Campaigns List Page
15. Campaign Creation Page
16. Campaign Dashboard Page
17. Campaign Unit Page
18. Campaign Matches Flow
19. Campaign Management (Organizer)
20. Social / Friends
21. References
22. Account
23. Tournaments (Coming Soon)

---

**End of Requirements**
