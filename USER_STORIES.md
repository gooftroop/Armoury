# User Stories

## Purpose

This document captures user stories for the Armoury application — a fan-made, unofficial tool for managing Warhammer 40K 10th Edition army lists, tracking matches, and running Crusade campaigns. Stories are written from the perspective of players who build lists, play games, and track their progress over time.

## Story Format

Every story follows this structure:

```
**US-[SECTION]-[NUMBER]: [Title]**
As a [role], I want to [action] so that [benefit].

**Acceptance Criteria:**
- [ ] [Specific, testable criterion referencing actual data fields/API endpoints]
- [ ] [Another criterion]

**Data References:** [List actual model fields, API endpoints, or validation rules involved]
```

## Roles

- **player** — any authenticated user interacting with the app
- **organizer** — a player who created and administers a campaign
- **opponent** — a second player in a match context

## Priority Levels

Stories are tagged with one of:

- **P0 — Critical**: Core loop; app is broken without it.
- **P1 — High**: Important to the primary use case but not blocking.
- **P2 — Medium**: Meaningful quality-of-life improvement.
- **P3 — Low**: Nice to have; deferred to later iterations.

## Naming Conventions

Section codes map to the headings below:

| Code | Section |
|------|---------|
| GLB | Global |
| UDD | Unit Detail Drawer |
| MCD | Match Creation Drawer |
| MJN | Match Joining |
| ULV | Unit List View |
| LP | Landing Page |
| PRO | Profile Page |
| APG | Army Page (The Forge) |
| MPG | Matches Page (The War Ledger) |
| CPG | Campaigns Page |
| ALY | Allies Page |
| REF | Reference Page |

## UX Constraints

These rules apply globally to all views across web and mobile.

1. **Navigation model**: The app uses a bottom tab bar on mobile and a sidebar on desktop. All primary pages are accessible from the navigation. Drawers and overlays appear on top of the current page and do not replace it in the navigation stack.

2. **Drawer behavior**: Drawers (Match Creation, Unit Detail, etc.) slide in from the bottom on mobile and from the right on desktop. They can be dismissed by swiping down (mobile) or clicking outside (desktop). Drawers do not navigate — they are contextual overlays.

3. **Empty states**: Every list or collection view must have a defined empty state. Empty states include a brief explanation and, where appropriate, a primary action to resolve the empty state (e.g., "Create your first army").

4. **Loading states**: Every async operation must have a loading indicator. Skeleton screens are preferred over spinners for content that has a known layout. Buttons that trigger async actions must show a loading state and be disabled while the operation is in progress.

5. **Error states**: Every async operation must have a defined error state. Errors must be surfaced to the user with a message and, where appropriate, a retry action. Silent failures are not acceptable.

6. **Unit Detail Drawer Behavioral Rules**: The unit detail drawer appears in multiple contexts (Reference, Army Creation browsing, Army Builder configuration, Match tracking). The same layout and visual structure is used across all contexts — only the data displayed changes based on context:
   - **Reference and Army Creation (read-only):** All unit data is displayed. No model list or HP bar. Used when browsing unit information before adding to army.
   - **Army Builder (configuration):** Model list is visible with the ability to add models and configure wargear per model. No HP bar.
   - **Match (tracking):** Model list with adjustable HP bar and equipped wargear stats plus enhancements (if applicable). Model count and loadout are read-only — cannot be changed during a match.
   - **Basic vs. Guided unit list items:** Both modes show the same unit list. In basic mode, each unit item shows a summary of models and wargear, total HP, and all interactive state tags. In guided mode, each unit item shows unit information but only the toggleable states relevant to the current phase, only the wargear relevant to the current phase, and total HP.
   - All unit detail drawers must use the same layout and visual structure. Only the data shown changes.

---

## Section Index

> **Agent instruction:** Do NOT read section files unless you are actively implementing stories for that page. Load lazily — only the section you are working on.

| Section | Stories | File |
|---------|---------|------|
| Global (GLB) | US-GLB-01 – US-GLB-12 | [docs/stories/GLB.md](docs/stories/GLB.md) |
| Unit Detail Drawer (UDD) | US-UDD-01 – US-UDD-28 | [docs/stories/UDD.md](docs/stories/UDD.md) |
| Match Creation Drawer (MCD) | US-MCD-01 – US-MCD-12 | [docs/stories/MCD.md](docs/stories/MCD.md) |
| Match Joining (MJN) | US-MJN-01 – US-MJN-03 | [docs/stories/MJN.md](docs/stories/MJN.md) |
| Unit List View (ULV) | US-ULV-01 – US-ULV-10 | [docs/stories/ULV.md](docs/stories/ULV.md) |
| Landing Page (LP) | US-LP-01 – US-LP-06 | [docs/stories/LP.md](docs/stories/LP.md) |
| Profile Page (PRO) | US-PRO-01 – US-PRO-09 | [docs/stories/PRO.md](docs/stories/PRO.md) |
| Army Page (APG) | US-APG-01 – US-APG-19 | [docs/stories/APG.md](docs/stories/APG.md) |
| Matches Page (MPG) | US-MPG-01 – US-MPG-42 | [docs/stories/MPG.md](docs/stories/MPG.md) |
| Campaigns Page (CPG) | US-CPG-01 – US-CPG-23 | [docs/stories/CPG.md](docs/stories/CPG.md) |
| Allies Page (ALY) | US-ALY-01 – US-ALY-10 | [docs/stories/ALY.md](docs/stories/ALY.md) |
| Reference Page (REF) | US-REF-01 – US-REF-09 | [docs/stories/REF.md](docs/stories/REF.md) |
