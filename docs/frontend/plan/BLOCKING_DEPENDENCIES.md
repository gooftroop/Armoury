# Dependencies Matrix

## Overview

This document formalizes the dependencies identified in the cross-phase audit. It maps what informs what, when dependencies should be resolved for smooth delivery, and priority levels to enable parallel workstreams.

## Critical Path Timeline

| Week  | Blocker Resolution Required                                          | Impact                                                   |
| ----- | -------------------------------------------------------------------- | -------------------------------------------------------- |
| 1-2   | UD-13, UD-15 mockup design references available                      | Unit Detail Drawer visual layout can be refined          |
| 3     | PHASE_0 components merged                                            | PHASE 1-5 can begin parallel development                 |
| 8-10  | Match Setup/Deployment mockups (MB-20, MB-21, MB-26, MPG-30, MPG-31) | Phase 3 match creation and basic setup visual refinement |
| 8-13  | Right Rail mockups (MB-22, MB-23, MG-09, MPG-32)                     | Phase 3 guided mode and mission rules visual refinement  |
| 11-13 | Guided Mode mockups (MG-02, MG-06, MPG-40)                           | Phase 3 guided mode visual completion                    |
| 12-13 | Match Summary mockup (MB-27, MPG-36, MPG-02)                         | Phase 3 match completion flow visual refinement          |
| 13-14 | Campaign mockups (CD-07, CD-09, CP-04)                               | Phase 4 campaign management visual refinement            |

## Mockup Dependencies

| Mockup                          | Issues                | Phase | Week  | Priority | Informs                                | Design Reference For                                             |
| ------------------------------- | --------------------- | ----- | ----- | -------- | -------------------------------------- | ---------------------------------------------------------------- |
| UD-13: Single-model drawer      | UD-11, UD-12, UD-13   | 2     | 1-2   | P0       | §3.5 Unit Detail Drawer visual layout  | Single-model layout, HP bar positioning, drawer width validation |
| UD-15: Multi-model drawer       | UD-14, UD-15          | 2     | 1-2   | P0       | §3.5 Unit Detail Drawer visual layout  | Multi-model layout, model list placement, per-model HP bars      |
| Match Setup Phase               | MB-20, MB-26, MPG-30  | 3     | 8-10  | P1       | §6.3 Match creation and setup phase    | Match initialization UI, player setup flow                       |
| Match Deployment Phase          | MB-21, MB-26, MPG-31  | 3     | 8-10  | P1       | §6.3 Match deployment phase            | Unit placement, deployment zone selection                        |
| Right Rail - Secondary Missions | MB-22, MG-09, MPG-32  | 3     | 8-13  | P1       | §6.4, §6.5 Mission tracking            | Secondary objective display, mission progress                    |
| Right Rail - Mission Rules      | MB-23, MPG-32         | 3     | 8-13  | P1       | §6.4, §6.5 Mission rules reference     | Mission rule details, scoring explanations                       |
| Guided Mode - All 5 Phases      | MG-02, MG-06, MPG-40  | 3     | 11-13 | P1       | §6.5 Guided mode visual implementation | Phase-specific UI states, guided interactions                    |
| Match Summary (Past/Read-Only)  | MB-27, MPG-36, MPG-02 | 3     | 12-13 | P2       | §6.5a Match completion                 | Post-match summary, statistics display                           |
| Campaign Management Page        | CD-07, CD-09          | 4     | 13-14 | P1       | §7.2, §7.6 Campaign CRUD               | Campaign creation, editing, management interface                 |
| Campaign Summary (Completed)    | CP-04                 | 4     | 13-14 | P1       | §7.1, §7.3 Completed campaign view     | Campaign history, completed match listings                       |

**Priority Levels:**

- **P0**: Informs all visual work in affected phases (highest design value)
- **P1**: Informs major features; partial work can proceed with placeholder UI
- **P2**: Informs nice-to-have visual details; core functionality proceeds independently

## Phase Dependency Chain

```
PHASE_0 (Weeks 1-3)
├── Provides: Shell, Navigation, Theme, Unit Detail Drawer (with mocks), UI Primitives, Data Patterns
└── Unblocks: PHASE 1-5 parallel development

PHASE_1 (Weeks 4-7) — The Forge (Army Builder)
├── Depends on: PHASE_0 (Shell, Theme, Navigation, Form Components)
├── Mockup dependencies: 2 mockups (non-blocking) UD-13, UD-15 (Unit Detail Drawer visual refinement)
├── Provides: Army list, faction selection, unit catalog
└── Unblocks: PHASE_2 (Unit Detail Drawer), PHASE_4 (campaign army selection)

PHASE_2 (Weeks 4-7) — War Ledger (Army List)
├── Depends on: PHASE_0, PHASE_1 (army data, unit catalog)
├── Mockup dependencies: 2 mockups (non-blocking) UD-13, UD-15 (Unit Detail Drawer in reference context)
├── Provides: Army detail view, Unit Detail Drawer (reference mode)
└── Unblocks: PHASE_3 (match mode), PHASE_4 (reference mode), PHASE_5 (reference mode)

PHASE_3 (Weeks 8-13) — Campaigns (Match Play)
├── Depends on: PHASE_0, PHASE_2 (Unit Detail Drawer for match creation)
├── Mockup dependencies: 6 mockups (non-blocking) (Setup, Deployment, Right Rail x2, Guided, Summary)
├── Provides: match mode drawer, MatchStream, match creation flow
└── Unblocks: PHASE_4 (campaign matches), PHASE_5 (read-only matches)

PHASE_4 (Weeks 14-17) — Campaigns (Social)
├── Depends on: PHASE_0, PHASE_2 (Unit Detail Drawer), PHASE_3 (match mode, MatchStream)
├── Mockup dependencies: 2 mockups (non-blocking) (Management, Summary)
├── Provides: FriendPresenceStream, CampaignNotificationStream, social features
└── Unblocks: PHASE_5 (allies integration)

PHASE_5 (Weeks 18-20) — References (Read-Only)
├── Depends on: PHASE_0, PHASE_2 (Unit Detail Drawer)
├── No blocking mockups
├── Provides: Reference browser, account settings, profile
└── Unblocks: Complete product
```

## Partial Unblocking Strategies

### UD-13 & UD-15 (Unit Detail Drawer Layout)

**CAN proceed without mockups:**

- Adapter interface definitions and context setup (pure TypeScript)
- Drawer sizing and close behavior (specs fully defined in UD-02, UD-03, US-UDD-18)
- Content section stubs with placeholder layout
- Skeleton variants for drawer components
- Container/shell integration

**Implement with placeholder UI; refine when mockups arrive:**

- Final visual layout order of sections
- HP bar positioning (inline vs. per-model)
- Exact spacing and typography hierarchy

**Mitigation:** Implement with mock components that can be swapped when mockups arrive.

### Match Mockups (MB-20, MB-21, MB-26, MPG-30, MPG-31)

**CAN proceed without mockups:**

- Match data structures and API contracts
- MatchStream reactive facade (WebSocket-based, via MatchesRealtimeClient)
- Basic match creation flow (placeholder UI)
- Unit state management logic

**Implement with placeholder UI; refine when mockups arrive:**

- Match setup phase UI (player selection, army validation)
- Deployment phase UI (unit placement, zone selection)

**Mitigation:** Ship with placeholder screens that navigate to functional match play.

### Right Rail Mockups (MB-22, MB-23, MG-09, MPG-32)

**CAN proceed without mockups:**

- Mission data structures and scoring logic
- Basic/guided mode toggle infrastructure
- Right rail layout container

**Implement with placeholder UI; refine when mockups arrive:**

- Secondary mission display and tracking
- Mission rule details and formatting

**Mitigation:** Right rail can render empty or with "Coming soon" placeholders.

### Guided Mode Mockups (MG-02, MG-06, MPG-40)

**CAN proceed without mockups:**

- Phase transition logic and state management
- Basic mode implementation (all state tags visible)
- Guided mode infrastructure (phase filtering)

**Implement with placeholder UI; refine when mockups arrive:**

- Phase-specific UI adaptations
- Guided interaction patterns

**Mitigation:** Start with basic mode only; guided mode can be feature-flagged off.

### Campaign Mockups (CD-07, CD-09, CP-04)

**CAN proceed without mockups:**

- Campaign data structures and CRUD operations
- Friend presence streams and notifications
- Campaign match integration (reuse Phase 3 drawer)

**Implement with placeholder UI; refine when mockups arrive:**

- Campaign management interface
- Campaign summary layouts

**Mitigation:** Campaign pages can use generic list/detail patterns until mockups arrive.

## Parallelization Opportunities

### Phase 5 During Phase 3-4

Phase 5 (References, Account, Profile) can run partially concurrent with Phase 3 and 4 because:

- **Dependencies:** Only requires PHASE_0 + Unit Detail Drawer (delivered by Phase 2 Week 7)
- **No mockup dependencies:** All Phase 5 work is implementation-only
- **Independent scope:** Read-only features don't conflict with match/campaign development

**Parallel windows:**

- Weeks 8-13: References browser development alongside Phase 3 match work
- Weeks 14-17: Account settings and profile alongside Phase 4 campaigns
- Week 18-20: Final integration and testing

### Allies Section (§7.7) During Phase 3

Phase 4 §7.7 (Allies page) can begin during Phase 3 because:

- **Dependencies:** Only requires PHASE_0 + FriendPresenceStream interface
- **No Phase 3 coupling:** Doesn't depend on match creation or campaign management
- **Independent data:** Friend list is separate from campaign/match data

**Parallel window:** Weeks 8-13, alongside Phase 3 match development.

## Validation Checklist

### PHASE_0 Readiness

- [ ] Shell Layout, Navigation, Theme System implemented and merged
- [ ] Unit Detail Drawer with mock implementations for UD-13/UD-15
- [ ] All shared frontend interfaces defined in `@armoury/shared/frontend`
- [ ] Query factory templates created
- [ ] UI Primitives, Data Patterns, Form Components available
- [ ] Mockup design references (UD-13, UD-15) tracked with design team for Week 2

### Phase Independence Validation

- [ ] PHASE_1 can start immediately after PHASE_0 (no external dependencies)
- [ ] PHASE_2 can start after PHASE_0 + PHASE_1 (Unit Detail Drawer available)
- [ ] PHASE_3 can start after PHASE_0 + PHASE_2 (match mode ready)
- [ ] PHASE_4 can start after PHASE_0 + PHASE_2 + PHASE_3 (all drawer modes + sync interfaces)
- [ ] PHASE_5 can start after PHASE_0 + PHASE_2 (Unit Detail Drawer only)

### Mockup Tracking

- [ ] Week 2: UD-13, UD-15 available → refine Unit Detail Drawer visual layout
- [ ] Week 10: Match setup/deployment mockups available → refine Phase 3 core flow visuals
- [ ] Week 13: All Phase 3 mockups available → refine Guided mode and completion visuals
- [ ] Week 14: Campaign mockups available → refine Phase 4 management interface visuals

## Risk Mitigation

### High-Risk Items

1. **Unit Detail Drawer (PHASE_0)**: Highest complexity, informs multiple phases
    - **Mitigation:** Parallel implementation of shared interfaces, placeholder components for unfinished visual layouts
    - **Fallback:** Feature flag drawer off and iterate when mockups arrive

2. **MatchStream (Phase 3)**: Real-time sync is novel pattern
    - **Mitigation:** WebSocket transport already implemented via MatchesRealtimeClient
    - **Fallback:** Synchronous match play without real-time updates

3. **Component Mode Complexity**: Game-agnostic shell + mode-driven components
    - **Mitigation:** Define all mode interfaces upfront in PHASE_0
    - **Fallback:** Monolithic components if mode abstraction proves too complex

### Contingency Plans

- **Mockup Delay:** Implement with placeholder UI that can be replaced
- **Interface Changes:** Version shared interfaces to allow breaking changes
- **Parallel Blockage:** Reassign teams to unblocked workstreams
- **Scope Reduction:** Defer visual polish on P2 features until mockups arrive

## Success Criteria

✅ **PHASE_0 merged by Week 3** with all shared components available
✅ **PHASE 1-5 start independently** after their prerequisite phases complete
✅ **No phase stalls** waiting for mockup delivery
✅ **Parallel workstreams active** throughout Weeks 4-20
✅ **All blocking dependencies resolved** by Week 14
✅ **Product shippable** by Week 20 with all core features functional
