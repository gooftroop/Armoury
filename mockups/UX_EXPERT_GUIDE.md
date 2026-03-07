# UX Expert Guide — Principles, Laws, and Best Practices

> **Purpose**: Comprehensive UX reference for any agent implementing or auditing the Armoury mockups. Covers foundational psychology, design principles, interaction patterns, visual design, dark-mode-specific guidance, and Armoury-specific application of each principle.

---

## Table of Contents

1. [Foundational Psychology](#1-foundational-psychology)
2. [Nielsen's 10 Usability Heuristics](#2-nielsens-10-usability-heuristics)
3. [Don Norman's Interaction Design Principles](#3-don-normans-interaction-design-principles)
4. [Laws of UX (Psychology-Based)](#4-laws-of-ux-psychology-based)
5. [Gestalt Principles of Perception](#5-gestalt-principles-of-perception)
6. [Visual Hierarchy](#6-visual-hierarchy)
7. [Typography & Readability](#7-typography--readability)
8. [Color & Contrast (Dark Mode Focus)](#8-color--contrast-dark-mode-focus)
9. [Information Architecture](#9-information-architecture)
10. [Navigation Patterns](#10-navigation-patterns)
11. [Interaction Design Patterns](#11-interaction-design-patterns)
12. [Form & Input Design](#12-form--input-design)
13. [Loading & Feedback States](#13-loading--feedback-states)
14. [Error Handling](#14-error-handling)
15. [Accessibility (a11y)](#15-accessibility-a11y)
16. [Mobile-Specific UX](#16-mobile-specific-ux)
17. [Armoury-Specific UX Application](#17-armoury-specific-ux-application)
18. [UX Audit Checklist](#18-ux-audit-checklist)

---

## 1. Foundational Psychology

### Cognitive Load Theory

The brain has limited working memory (~7±2 items, per Miller's Law). Every element in a UI competes for cognitive resources.

**Three types of cognitive load:**

| Type | Description | Design Response |
|------|-------------|-----------------|
| **Intrinsic** | The inherent difficulty of the task itself | Can't eliminate; simplify where possible |
| **Extraneous** | Load caused by poor design | ELIMINATE — this is the designer's job |
| **Germane** | Mental effort that aids learning | SUPPORT — help users build mental models |

**Practical implications:**
- Reduce the number of choices at any decision point (Hick's Law)
- Chunk information into digestible groups (Miller's Law)
- Use progressive disclosure — show only what's needed now
- Offload memory to the interface (show, don't make users remember)
- Use smart defaults to reduce decisions

### Mental Models

Users arrive with expectations formed by using other apps. They expect your app to work similarly to ones they already know (Jakob's Law). Don't fight mental models — leverage them.

**For Armoury**: Tabletop players are used to apps like the official WH40K app, BattleScribe, and Wahapedia. Our UX should feel familiar in its information structure (army → unit → datasheet) while being dramatically better in usability.

### The Paradox of the Active User

Users don't read instructions. They start using things immediately and learn by doing. Design must be self-evident.

---

## 2. Nielsen's 10 Usability Heuristics

Jakob Nielsen's heuristics (1994, updated 2020) are the gold standard for UI evaluation. Apply these to every screen.

### H1: Visibility of System Status

> The design should always keep users informed about what is going on, through appropriate feedback within a reasonable amount of time.

**Application to Armoury:**
- Show loading/syncing state when BSData syncs ("Syncing faction data...")
- Show current army points vs limit: `750 / 2000 pts`
- Show current phase in guided match mode (highlighted tab)
- Show CP and VP prominently and update immediately on change
- Show unit health state visually (HP bar color change)
- Indicate save/sync status for armies

### H2: Match Between System and Real World

> Use words, phrases, and concepts familiar to the user, rather than internal jargon.

**Application to Armoury:**
- Use 40K terminology users already know: "Command Phase", "Stratagem", "Detachment", "Battleline"
- Organize units by official categories: Characters, Battleline, Dedicated Transports, etc.
- Phase order must match official rules: Command → Movement → Shooting → Charge → Fight → End
- Points, CP, VP should display exactly as players expect from tabletop

### H3: User Control and Freedom

> Users often choose system functions by mistake. Provide a clearly marked "emergency exit."

**Application to Armoury:**
- Every drawer/modal/bottom-sheet needs a visible close button (X)
- Undo support for destructive actions (delete army, remove unit) — at minimum, a confirmation dialog
- Back navigation must always work (browser back, app back)
- Users can switch between Basic and Guided match modes at any time
- "Cancel" is always available alongside "Confirm"

### H4: Consistency and Standards

> Users should not have to wonder whether different words, situations, or actions mean the same thing.

**Application to Armoury:**
- Same component patterns everywhere: cards look the same, buttons behave the same, drawers slide from the same direction
- Color meanings are consistent: bronze = accent/brand, yellow = CP, green = positive/health, red = destructive/low health
- Tab bars behave identically across match pages (08, 09, 23-28)
- Icon meanings are fixed: `lucide-trash-2` = delete, `lucide-x` = close, `lucide-plus` = add, `lucide-chevron-right` = navigate forward

### H5: Error Prevention

> Good error messages are important, but preventing errors in the first place is better.

**Application to Armoury:**
- Disable "Add Unit" button when army rules prevent it (show reason why)
- Prevent adding more than allowed number of units per category
- Validate army composition before match starts
- Prevent accidental match end with a confirmation step
- Auto-save army edits to prevent data loss

### H6: Recognition Rather Than Recall

> Minimize the user's memory load by making elements, actions, and options visible.

**Application to Armoury:**
- Show unit images/thumbnails alongside names (visual recognition)
- Show weapon/wargear stats inline, not behind a click
- Display detachment abilities and stratagems contextually during the relevant phase
- Show faction keywords on unit cards
- In match mode, show everything relevant to the current phase — don't make users hunt for it

### H7: Flexibility and Efficiency of Use

> Shortcuts for expert users that don't encumber novice users.

**Application to Armoury:**
- Basic Mode (turn-by-turn) for new players; Guided Mode (phase-by-phase) for experienced players
- Quick-add units from the army detail page
- Tap unit in match list to immediately see datasheet (one tap)
- Swipe gestures for phase navigation (supplement buttons)

### H8: Aesthetic and Minimalist Design

> Every extra unit of information competes with the relevant units and diminishes their relative visibility.

**Application to Armoury:**
- Show only what's needed for the current context (phase-specific information in guided mode)
- Don't overwhelm the unit list with all stats — show name, image, model count, points. Details on tap.
- Use progressive disclosure: summary → detail drawer → full datasheet
- Remove decorative elements that don't serve function
- The glass/dark aesthetic should enhance focus, not distract

### H9: Help Users Recognize, Diagnose, and Recover from Errors

> Error messages should be plain language, precisely indicate the problem, and suggest a solution.

**Application to Armoury:**
- "Cannot add Terminators: maximum 3 per army" not "Error: unit limit exceeded"
- "Army validation failed: missing HQ choice" with a link/action to fix it
- Show which unit/rule is causing the problem, not just that there IS a problem

### H10: Help and Documentation

> It's best if the system needs no explanation, but documentation should be available.

**Application to Armoury:**
- Tooltips on complex UI elements (what does OC mean? what is Devastating Wounds?)
- Mission Rules tab in match mode (always accessible)
- Core Rules reference page (page 14 in mockups)
- Inline help icons (?) for non-obvious features

---

## 3. Don Norman's Interaction Design Principles

From *The Design of Everyday Things* — six fundamental principles:

### Affordances

An affordance is what an object allows you to do. A button affords pressing. A slider affords sliding.

**In UI:**
- Buttons should look pressable (slight elevation, clear boundaries)
- Sliders should look slidable (track + thumb)
- Cards should look tappable (hover/press states, subtle shadow)
- Links should look clickable (color differentiation, underline on hover)

### Signifiers

Signifiers indicate WHERE the action should take place. They're the visible indicators of affordances.

**In UI:**
- A "+" icon on an add button
- A drag handle (═══) on a bottom sheet
- Chevrons (›) indicating "there's more" or "this navigates"
- Active tab highlighting showing "you are here"
- Underlines or color changes on clickable text

### Mapping

The relationship between controls and their effects. Good mapping is natural/intuitive.

**In UI:**
- Left arrow = go back/previous; Right arrow = go forward/next
- Up/down on HP slider = increase/decrease HP
- Slider position maps directly to HP value
- Phase tabs from left to right match the chronological order of gameplay
- Plus/minus buttons near the model count increase/decrease that count

### Constraints

Constraints limit possible actions to prevent errors.

**In UI:**
- Disable the "Add Unit" button when at max
- Don't allow HP below 0 or above max
- Require at least one opponent to create a match
- Grey out unavailable stratagems (not enough CP)
- Constrain slider range to valid HP values

### Feedback

Every action needs a visible, immediate response.

**In UI:**
- Button press: visual state change (active/pressed state)
- Toggle on/off: immediate visual change in state
- Adding a unit: it appears in the list immediately
- Changing HP: bar updates in real-time as slider moves
- Error: red highlight, shake animation, error message
- Success: brief green flash or check mark

### Conceptual Models

A conceptual model is the user's understanding of how the system works. Good design creates an accurate, simple mental model.

**For Armoury:**
- The mental model is: "I build an army → I start a match → I play through phases → I track state → match ends"
- The app's structure should mirror this flow exactly
- The Forge (army list) is the starting point. Matches reference armies. Campaigns contain matches.
- Each unit is a container of models with loadouts — the UI should reflect this hierarchy

---

## 4. Laws of UX (Psychology-Based)

### Fitts's Law

> The time to reach a target is a function of distance to it and its size.

**Bigger + closer = faster to hit.**

| Implication | Application |
|------------|-------------|
| Make primary CTAs large | "Next Phase" button: full-width, 48px+ height |
| Put frequent actions close to likely cursor/thumb position | Phase nav at bottom (thumb zone) |
| Avoid tiny targets | All interactive elements ≥ 44px touch target |
| Edge/corner targets are fast on desktop (infinite edge) | — |

### Hick's Law (Hick-Hyman Law)

> The time to make a decision increases logarithmically with the number of choices.

**Fewer choices = faster decisions.**

| Implication | Application |
|------------|-------------|
| Limit nav items to 5 | Bottom tab bar: Forge, Ledger, Campaigns, Allies, References |
| Progressive disclosure | Don't show all unit options at once — filter by category first |
| Smart defaults | Pre-fill match name with date + army name |
| Group related options | Stratagems grouped by phase; units grouped by role |

### Miller's Law

> People can hold approximately 7 (±2) items in working memory.

| Implication | Application |
|------------|-------------|
| Chunk information | Group stats into logical clusters (unit profile, weapons, abilities) |
| Limit visible items | Show 5 tabs max, truncate long lists with "Show more" |
| Use visual grouping | Separate sections with headers and spacing |

### Jakob's Law

> Users spend most of their time on OTHER sites. They prefer your site to work the same way.

Follow established patterns. Don't reinvent navigation. Use standard icons. Match expectations set by iOS, Material Design, and competitor apps.

### Aesthetic-Usability Effect

> Users perceive aesthetically pleasing designs as MORE usable, even if they aren't.

This is why our dark glass aesthetic matters. A beautiful UI creates trust and forgiveness for minor usability issues. But don't sacrifice usability for beauty.

### Von Restorff Effect (Isolation Effect)

> An item that visually stands out from its peers is more likely to be remembered.

Use this for:
- Primary CTAs (accent color against neutral background)
- Active phase tab (highlighted vs muted)
- Warnings and errors (red against dark glass)
- VP/CP readouts (yellow CP, bronze VP — distinct from surrounding elements)

### Serial Position Effect

> People best remember the first and last items in a series.

Put the most important navigation items at the start and end of the tab bar. Put the primary CTA at the bottom (last seen) or top (first seen) of a form.

### Doherty Threshold

> Productivity soars when system response time is <400ms.

All interactions should feel instant. No perceptible delay on:
- Tab switches
- Drawer open/close animations
- HP slider updates
- Unit list filtering

Use CSS transitions (200-350ms) with the spring easing for perceived speed.

### Peak-End Rule

> People judge an experience based on how they felt at the peak and end.

The match experience peaks during intense gameplay phases and ends when the match concludes. Make the end-of-match summary satisfying — show results clearly, highlight achievements, make saving/sharing easy.

### Tesler's Law (Conservation of Complexity)

> Every system has inherent complexity that cannot be removed — only moved between user and system.

The system should absorb complexity. Auto-calculate points. Auto-apply detachment rules. Auto-validate army composition. Don't make users do math.

### Postel's Law (Robustness Principle)

> Be liberal in what you accept, conservative in what you output.

Accept varied user input (dates in different formats, partial searches). Output clean, consistent formatted data.

---

## 5. Gestalt Principles of Perception

The Gestalt principles explain how humans perceive visual elements as organized wholes rather than individual parts.

### Proximity

> Elements close together are perceived as belonging to the same group.

- Group related form fields together (army name + faction + points = one section)
- Separate unrelated sections with clear spacing
- In the match page: unit list is one group, detail panel is another, rules rail is another
- Within a unit card: image, name, and model count are grouped tightly; action buttons have their own group

### Similarity

> Elements that look similar are perceived as related.

- All navigation tabs should look the same (same height, font, icon style)
- All unit cards should use the same layout
- All "delete" actions use the same icon and color
- All accent-colored elements indicate the same type of thing (interactive/important)

### Continuity

> The eye follows lines, curves, and sequences of elements.

- Tab bars create a horizontal line the eye follows
- Unit lists create a vertical flow the eye scrolls through
- Phase tabs (Command → Movement → Shooting → Charge → Fight → End Turn) form a natural left-to-right sequence

### Closure

> The mind fills in missing parts to perceive a complete shape.

- Cards with rounded corners feel complete even without explicit borders on all sides
- Glass elements with subtle borders suggest containment even when semi-transparent
- Progress bars suggest a full bar even when partially filled

### Figure-Ground

> People instinctively perceive objects as being in the foreground or background.

- Drawers/modals are the "figure" — they're brighter and sharper
- The scrim (dark overlay) behind a drawer is the "ground"
- Active/selected elements appear to "float" above inactive ones
- In our dark glass system: elevated glass panels (lighter) sit above the base surface (darker)

### Common Region

> Elements enclosed in the same bounded area are perceived as a group.

- Cards with borders create common regions
- Sections with backgrounds create grouping
- The glass panel of a drawer defines what's "inside" it
- Tab content areas are bounded by the tab bar and page edges

---

## 6. Visual Hierarchy

Visual hierarchy controls the order in which the eye processes information. Every screen should have a clear hierarchy.

### Tools for Creating Hierarchy

| Tool | Stronger Effect → | Example |
|------|------------------|---------|
| **Size** | Larger = more important | Page title (24px) > section header (18px) > body (14px) |
| **Color/Contrast** | Higher contrast = more prominent | White text > `text-secondary` > `text-tertiary` |
| **Weight** | Bolder = more important | `font-weight: 700` title > `400` body |
| **Spacing** | More space around = more important | Hero sections have generous padding |
| **Position** | Top/left = seen first (F-pattern) | Page title at top; primary CTA at bottom |
| **Saturation** | Saturated color = attention | Accent-colored CTA vs muted background |

### Reading Patterns

**F-Pattern** (text-heavy pages): Users scan the top horizontal line, then down the left side, occasionally scanning right. Use for: unit datasheets, army detail, reference pages.

**Z-Pattern** (sparse/hero pages): Eyes go top-left → top-right → bottom-left → bottom-right. Use for: landing page, army creation, match creation.

### The Squint Test

Blur your eyes (or zoom out to 25%) and look at the page. Can you still tell what's most important? If everything looks the same, hierarchy has failed.

### Armoury Hierarchy Per Page Type

**Match page (primary gameplay screen):**
1. Unit list / active unit (primary focus)
2. CP / VP readouts (always visible)
3. Phase tabs (orientation)
4. Action buttons (stratagems, toggles)
5. Rules rail (reference, secondary)

**Army detail page:**
1. Army name + points counter
2. Unit list (scannable cards)
3. Add unit buttons (per section)
4. Detachment info

---

## 7. Typography & Readability

### Armoury Type System

| Role | Font | Weight | Use |
|------|------|--------|-----|
| Display/Headings | Oxanium (`--font-display`) | 600-700 | Page titles, section headers, stats |
| Body/UI | IBM Plex Sans (`--font-body`) | 400-500 | Body text, labels, descriptions |

### Hierarchy Levels

| Level | Size (Desktop) | Size (Mobile) | Weight | Element |
|-------|---------------|---------------|--------|---------|
| H1 | 28-32px | 22-26px | 700 | Page title |
| H2 | 22-24px | 18-20px | 600 | Section header |
| H3 | 18-20px | 16-18px | 600 | Card title, drawer title |
| Body | 15-16px | 14-15px | 400 | Paragraph text, descriptions |
| Caption | 12-13px | 11-12px | 500 | Labels, metadata, badges |
| Micro | 10-11px | 10-11px | 500 | Timestamps, tertiary info |

### Readability Rules

- **Line length**: 45-75 characters per line (ideal: 65). Too wide = hard to track lines.
- **Line height**: 1.5-1.6 for body text; 1.2-1.3 for headings.
- **Letter spacing**: Slightly increased for uppercase text (`0.05-0.08em`). Normal for body.
- **Paragraph spacing**: At least 1.5× the line height between paragraphs.
- **Never** fully justify text (ragged right is more readable on screens).
- **Minimum** 16px for body text on mobile (prevents iOS zoom).

### Dark Mode Typography Notes

- Use slightly lower contrast than pure white on pure black. Our `--text-primary` should be ~`oklch(0.93 0 0)` (off-white), not `#FFFFFF`.
- Avoid thin/light font weights (300 and below) — they're harder to read on dark backgrounds due to halation.
- Minimum font weight for body text in dark mode: 400.
- Oxanium's geometric shapes work well in dark mode at larger sizes but may need slightly increased letter-spacing at small sizes.

---

## 8. Color & Contrast (Dark Mode Focus)

### Armoury Color System

| Role | Token | Value | Purpose |
|------|-------|-------|---------|
| Base background | `--bg-base` | `oklch(0.13 0.01 260)` | Page background (dark, not pure black) |
| Glass surface | `--glass-bg` | `oklch(1 0 0 / 8%)` | Glass panel background |
| Primary accent | `--accent-primary` | Per game system (e.g., `oklch(0.65 0.14 235)` for WH40K blue) | CTAs, active states, highlights |
| Text primary | `--text-primary` | `oklch(0.93 0 0)` | Main readable text |
| Text secondary | `--text-secondary` | `oklch(0.72 0 0)` | Supporting text |
| Text tertiary | `--text-tertiary` | `oklch(0.52 0 0)` | Metadata, labels |
| Semantic: CP | — | `oklch(0.82 0.14 90)` (yellow) | Command Points always yellow |
| Semantic: Success | — | Green variant | Health positive, success states |
| Semantic: Danger | — | Red variant | Low health, destructive actions, errors |
| Semantic: VP | — | `var(--accent-primary)` (bronze) | Victory Points always bronze |

### Dark Mode Best Practices

1. **Never use pure black (#000000)**. Use dark grey/blue (`oklch(0.13 0.01 260)` ≈ `#1a1b2e`). Pure black causes halation (blurry halo effect on light text) and eye strain.

2. **Never use pure white (#FFFFFF) for text**. Use off-white (`oklch(0.93 0 0)` ≈ `#ededed`). Reduces harsh contrast while maintaining readability.

3. **Desaturate accent colors**. Highly saturated colors vibrate/bleed on dark backgrounds. Our oklch system already handles this — keep chroma values moderate (0.08-0.16 range).

4. **Create depth with lightness, not shadows**. In dark mode, shadows are invisible. Use progressively lighter surfaces for elevated elements:
   - Base: `oklch(0.13 ...)` 
   - Surface: `oklch(1 0 0 / 6%)`
   - Elevated: `oklch(1 0 0 / 10%)`
   - Popover: `oklch(0.22 0.006 260 / 55%)`

5. **Minimum contrast ratios** (WCAG 2.2 AA):
   - Normal text (<18px or <14px bold): **4.5:1** minimum
   - Large text (≥18px or ≥14px bold): **3:1** minimum
   - UI components (icons, borders): **3:1** minimum
   - Maximum recommended: **15.8:1** (higher causes halation for astigmatic users)

6. **Avoid saturated blue text on dark backgrounds** — the human eye struggles to focus on blue at low luminance.

7. **Test across displays**: OLED (blacks are true black), LCD (blacks are backlit grey), and various brightness settings.

### Color Meanings (Consistent Across All Pages)

| Color | Meaning | Never Use For |
|-------|---------|---------------|
| Accent primary (blue/bronze/gold/green) | Interactive, important, brand | Errors or warnings |
| Yellow | Command Points, caution | Success states |
| Green | Health, success, positive | Destructive actions |
| Red | Danger, low health, destructive | Positive confirmations |
| Accent secondary (ice/sand/amber/sage) | Highlights, emphasis | Primary CTAs |
| Grey/muted | Disabled, tertiary, inactive | Primary content |

---

## 9. Information Architecture

### IA Principles for Armoury

1. **Principle of Objects**: Treat each entity (Army, Unit, Match, Campaign) as an object with attributes and behaviors. The UI should reflect the object's lifecycle.

2. **Principle of Choices**: Don't overwhelm. At each decision point, limit options:
   - Nav: 5 tabs maximum
   - Unit sections: one add button per category
   - Match modes: 2 (Basic, Guided)

3. **Principle of Disclosure**: Reveal information progressively:
   - Army list → Army detail → Unit detail → Datasheet
   - Match creation → Match setup → Match deployment → Match gameplay

4. **Principle of Front Doors**: Any page could be the user's entry point (deep link, bookmark). Each page must provide enough context to orient the user.

5. **Principle of Focused Navigation**: Don't mix navigation types. Sidebar/bottom tabs = app sections. Phase tabs = match flow. Drawers = detail views. Each navigation system serves one purpose.

### Armoury Site Map

```
Landing (01)
├── Forge / Army List (02, 03)
│   ├── Army Creation (04)
│   ├── Army Detail (05)
│   │   ├── Unit Add Modal (06)
│   │   └── Unit Config (07)
│   └── Match Creation (16)
│       ├── Match Setup (20)
│       ├── Match Deployment (21)
│       ├── Match Basic (08)
│       │   └── Match Basic Opponent (22)
│       └── Match Guided (09)
│           ├── Command Phase (23)
│           ├── Movement Phase (24)
│           ├── Shooting Phase (25)
│           ├── Charge Phase (26)
│           ├── Fight Phase (27)
│           └── End Turn (28)
├── War Ledger / Matches (11)
├── Campaigns (12)
│   ├── Campaign Detail (17)
│   ├── Campaign Creation (18)
│   └── Campaign Management (19)
├── Allies / Social (13)
├── References (14)
└── Account (15)
```

### Navigation Depth

Ideal: **3 clicks max** to reach any content from the landing page.

| Target | Path | Clicks |
|--------|------|--------|
| View a unit datasheet | Forge → Army Detail → Tap Unit | 3 |
| Start a match | Forge → Army Detail → Match Button → Creation | 3 |
| View active match | Ledger → Tap Match | 2 |
| Check stratagem in match | (Already in match) → Stratagems tab | 1 |
| View campaign details | Campaigns → Tap Campaign | 2 |

---

## 10. Navigation Patterns

### Primary Navigation

| Platform | Pattern | Items |
|----------|---------|-------|
| Desktop (≥768px) | Left sidebar, fixed | Forge, Ledger, Campaigns, Allies, References |
| Mobile (<768px) | Bottom tab bar, fixed | Same 5 items with icons |

### Secondary Navigation

| Context | Pattern |
|---------|---------|
| Match phases | Horizontal tab bar (scrollable) at top of match area |
| Content tabs (Army Rules, Detachment, Stratagems) | Vertical or horizontal tab bar in right rail |
| Sub-pages | Browser back / app back button in header |

### Navigation Rules

1. **Show current location** — active tab highlighted, page title in header
2. **Breadcrumb trail** — on desktop, show path (Forge > Blood Angels > Intercessors)
3. **Consistent placement** — nav never moves, never changes position
4. **No dead ends** — every page has a way out (back, home, close)
5. **Predictable behavior** — same gesture/click always does the same thing

---

## 11. Interaction Design Patterns

### Cards

Cards are the primary content container in Armoury. Each card should:
- Be a single, tappable unit (Fitts's Law — large target)
- Show a summary (image, title, key metric)
- Lead to a detail view on tap
- Have consistent dimensions within a list
- Include visual feedback on hover/press

### Drawers / Bottom Sheets

See MOBILE_RESPONSIVE_GUIDE.md Section 7 for size/position rules.

**UX rules for drawers:**
- One drawer at a time (never stack)
- Clear title showing what you're looking at
- Close button always visible (top-right for side drawers, top-right or top-center for bottom sheets)
- If the drawer has a primary action, put it at the bottom (sticky footer within drawer)

### Modals / Dialogs

Use sparingly. Modals interrupt flow — only use for:
- Confirmations of destructive actions ("Delete this army?")
- Required decisions that block progress
- Critical information that must be acknowledged

**Never** use modals for content browsing or complex forms. Use drawers/pages instead.

### Toggles / Switches

- ON/OFF states must be visually distinct
- Label the toggle with what it controls ("Guided Mode", "Performing Action")
- Immediate feedback — state changes as soon as toggled (no save button)
- Minimum touch target: 44px

### Popovers / Tooltips

- Appear on hover (desktop) or long-press (mobile)
- Position intelligently (don't go off-screen)
- Dismiss on click outside or pressing Escape
- Use for supplementary info that doesn't warrant a drawer

---

## 12. Form & Input Design

### General Rules

1. **Labels above inputs** (not placeholder-only labels — they disappear when typing)
2. **One column on mobile** — side-by-side fields only on desktop if they're related (e.g., first/last name)
3. **Logical tab order** — fields flow top-to-bottom, left-to-right
4. **Smart defaults** — pre-fill everything possible (today's date, user's last army, etc.)
5. **Inline validation** — show errors as users complete each field, not only on submit
6. **Clear error states** — red border + error message below the field
7. **16px minimum font-size on inputs** — prevents iOS Safari zoom

### Specific to Armoury

- **Army name**: Text input with placeholder showing example name
- **Points limit**: Select dropdown with common values (500, 1000, 1500, 2000) + custom option
- **Date picker**: Standard date input; default to today for matches
- **HP input**: Number input with ±buttons and range slider (see mockup spec)
- **Model count**: ±buttons flanking the count number
- **Opponent linking**: Code/QR input with clear instructions

---

## 13. Loading & Feedback States

### Skeleton Loaders (Required)

Per ui_notes.txt: "All loading states should leverage skeleton loaders."

Skeleton loaders show a ghosted version of the content layout, pulsing with a subtle animation, so users understand what's coming. This reduces perceived wait time.

```css
.skeleton {
  background: linear-gradient(
    90deg,
    oklch(1 0 0 / 4%) 0%,
    oklch(1 0 0 / 8%) 50%,
    oklch(1 0 0 / 4%) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Feedback Types

| User Action | Feedback | Timing |
|-------------|----------|--------|
| Tap button | `:active` state (pressed visual) | Immediate (<100ms) |
| Submit form | Loading spinner/skeleton | Immediate indicator |
| Save army | "Saved" toast notification | After save completes |
| Delete item | Item animates out of list | Immediate (200-300ms) |
| Error | Red highlight + message | Immediate on validation |
| Sync data | Progress indicator | During sync |
| Phase change | Tab highlight transitions | 200-350ms animation |

### The 3 Response Time Thresholds (Jakob Nielsen)

| Threshold | Perception | Design Response |
|-----------|-----------|-----------------|
| **100ms** | Instant — user feels in direct control | Button states, toggles |
| **1 second** | Noticeable delay but flow isn't broken | Page transitions, drawer open |
| **10 seconds** | User's attention is lost | Show progress bar + allow cancel |

---

## 14. Error Handling

### Error Prevention > Error Messages

1. **Constrain inputs** — don't allow invalid values (e.g., HP slider can't go below 0)
2. **Confirm destructive actions** — "Delete this army? This cannot be undone."
3. **Disable invalid actions** — grey out buttons when preconditions aren't met
4. **Auto-save** — prevent data loss from accidental navigation

### Error Message Guidelines

| ✅ Good | ❌ Bad |
|---------|--------|
| "Cannot add Terminators — maximum 3 per army (you have 3)" | "Error: unit limit exceeded" |
| "Please select a faction before continuing" | "Required field missing" |
| "Match name is required" | "Validation error" |
| "Connection lost. Your changes are saved locally and will sync when reconnected." | "Network error" |

### Error Message Structure

```
[Icon] [What happened] [Why] [How to fix]
```

Example: ⚠️ "Army over points limit (2150 / 2000 pts). Remove 150pts of units to continue."

---

## 15. Accessibility (a11y)

### WCAG 2.2 AA Requirements (Minimum)

| Criterion | Requirement | How to Meet |
|-----------|-------------|-------------|
| 1.4.3 Contrast | 4.5:1 normal text, 3:1 large text | Use oklch with tested values |
| 1.4.11 Non-text Contrast | 3:1 for UI components | Borders, icons, focus rings |
| 2.4.7 Focus Visible | Focus indicators on interactive elements | `outline: 2px solid var(--accent-primary)` |
| 2.5.5 Target Size | 44×44 CSS px minimum | Padding on all interactive elements |
| 1.3.1 Info and Relationships | Structure conveyed programmatically | Semantic HTML (headings, lists, landmarks) |
| 2.1.1 Keyboard | All functionality available via keyboard | Tab navigation, Enter/Space to activate |

### Dark Mode Accessibility Specifics

- Avoid contrast ratios above 15.8:1 (causes halation for astigmatic users)
- Avoid thin fonts on dark backgrounds (halation worsens)
- Ensure focus rings are visible against dark glass surfaces
- Don't rely on color alone — use icons, text, or patterns in addition to color
- Respect `prefers-reduced-motion` — disable or reduce animations
- Respect `prefers-contrast` — increase borders and text contrast when user requests it

### Semantic HTML Checklist

- `<nav>` for navigation regions
- `<main>` for primary content
- `<header>` and `<footer>` for page structure
- `<h1>` through `<h6>` in logical order (one `<h1>` per page)
- `<button>` for actions, `<a>` for navigation
- `aria-label` on icon-only buttons
- `role="dialog"` and `aria-modal="true"` on modals/drawers
- `aria-expanded` on toggle-controlled regions

---

## 16. Mobile-Specific UX

See `MOBILE_RESPONSIVE_GUIDE.md` for comprehensive CSS implementation details. This section covers UX-specific mobile considerations.

### One-Handed Use

- 75% of interactions are thumb-only
- Primary actions in bottom 40% of screen
- Avoid top corners for interactive elements
- Use bottom sheets instead of top modals

### Mobile Context

Mobile users are:
- **Distracted** — playing a tabletop game while using the app
- **Time-pressured** — their opponent is waiting
- **One-handed** — other hand may be moving models
- **In variable lighting** — game shops, basements, outdoors

Design for the worst case: one-handed, distracted, in dim lighting.

### Mobile-Specific Patterns

| Pattern | Use For |
|---------|---------|
| Bottom tab bar | Primary app navigation |
| Full-screen takeover | Drawers/modals (replace desktop drawer) |
| Bottom sheet | Quick contextual actions (stratagem pick, filter) |
| Swipe gestures | Phase navigation, dismiss bottom sheets |
| Pull-to-refresh | Sync data |
| Sticky footer | Phase nav buttons (Previous/Next) |

### Touch vs. Mouse Psychology

| Mouse/Desktop | Touch/Mobile |
|--------------|-------------|
| Precise (1px cursor) | Imprecise (44px+ finger) |
| Hover for preview | No hover — must tap to reveal |
| Right-click for context menu | Long-press for context menu |
| Scroll wheel | Swipe/flick (momentum scrolling) |
| Multiple windows | Single-focus (one app at a time) |
| Keyboard shortcuts | No keyboard (unless external) |

---

## 17. Armoury-Specific UX Application

### The Core UX Challenge

Armoury's biggest UX challenge is the **match experience**. During gameplay:
- Users need quick access to unit stats, stratagems, abilities, and rules
- They're tracking CP, VP, HP, and unit status across multiple units
- They need to progress through phases without losing context
- They may need to reference rules mid-action

**The official WH40K app fails here** because:
- Too much scrolling to find units and stratagems
- No phase-by-phase guidance
- Unit datasheets don't show equipped loadouts
- No way to see "what can I do right now?"

### Armoury's UX Advantage: Contextual Information

The guided match mode should show **only what's relevant to the current phase**:

| Phase | Show | Hide |
|-------|------|------|
| Command | CP income, abilities that trigger, strategic planner stratagems | Movement/shooting actions |
| Movement | Unit positions, movement values, advance/fall back options | Shooting stats |
| Shooting | Ranged weapons, targets, wound allocation, battle shock | Melee weapons |
| Charge | Charge distances, overwatch, charge-relevant stratagems | Ranged weapons |
| Fight | Melee weapons, fight-first/fight-last, pile-in | Movement values |
| End Turn | Secondary missions, VP scoring, morale, clean-up actions | Phase-specific stratagems |

### Key UX Flows

**Army Building Flow:**
1. Forge (list) → New Army → Pick Faction → Name + Points → Army Detail
2. Army Detail → Add Unit → Filter → Pick Unit → Config (optional) → Back to Army
3. Army Detail → Tap Unit → Unit Config (full datasheet with edit controls)

**Match Flow:**
1. Army Detail → Start Match → Match Creation (name, opponent, date)
2. Match Creation → Match Setup → Deployment
3. Deployment → Basic Mode OR Guided Mode
4. Guided Mode: Command → Movement → Shooting → Charge → Fight → End Turn (loop)
5. End Turn → Complete Turn → Opponent's Turn → ... → End Match

**The crucial UX insight**: Each phase transition should feel like turning a page, not starting over. Context persists — which units have acted, current CP/VP, health states — all carry forward visually.

### Emotional Design

The app should make users feel:
- **Empowered** — "I have everything at my fingertips"
- **Oriented** — "I know exactly where I am and what I can do"
- **Confident** — "I won't forget abilities or rules"
- **Immersed** — "The dark glass aesthetic feels like a tactical HUD"

The dark glass design system serves this emotional goal. The UI is a command console, not a spreadsheet.

---

## 18. UX Audit Checklist

Use this checklist when reviewing any mockup page.

### Heuristic Compliance

- [ ] **System Status**: Can the user always tell what state they're in? (Current page, loading, saving)
- [ ] **Real World Match**: Does terminology match what players expect?
- [ ] **User Control**: Is there always a way out? (Close, back, cancel, undo)
- [ ] **Consistency**: Do similar elements behave the same across all pages?
- [ ] **Error Prevention**: Are destructive actions gated? Are invalid inputs constrained?
- [ ] **Recognition > Recall**: Can users see their options, or must they remember?
- [ ] **Flexibility**: Does the page serve both novice and expert users?
- [ ] **Minimal Design**: Is every element earning its place? Can anything be removed?
- [ ] **Error Recovery**: Are error messages helpful and actionable?
- [ ] **Help Available**: Can users find help/documentation when needed?

### Visual Design

- [ ] **Clear hierarchy**: Is there one primary focal point per viewport?
- [ ] **Consistent typography**: Does the page use the type scale correctly?
- [ ] **Adequate contrast**: Does all text meet WCAG AA (4.5:1 / 3:1)?
- [ ] **Purposeful color**: Is color used consistently for its assigned meaning?
- [ ] **Breathing room**: Is there sufficient whitespace between sections?
- [ ] **Gestalt applied**: Are related elements grouped? Unrelated elements separated?

### Interaction Design

- [ ] **All interactive elements ≥ 44px touch target**
- [ ] **All buttons have visible hover + active states**
- [ ] **All drawers/modals have close buttons**
- [ ] **No hover-dependent functionality** (must work on touch)
- [ ] **Feedback on every action** (button press, toggle, navigation)
- [ ] **Animations ≤ 350ms** with spring easing

### Navigation

- [ ] **User can tell which page they're on** (active nav state, page title)
- [ ] **User can get back** (back button, breadcrumbs, close)
- [ ] **Primary nav is always accessible** (sidebar or bottom tabs)
- [ ] **Any content reachable in ≤ 3 clicks from home**

### Mobile Specific

- [ ] **No horizontal scrolling**
- [ ] **Primary actions in thumb zone** (bottom 40% of screen)
- [ ] **Drawers become full-screen takeovers** on mobile
- [ ] **Bottom tab bar visible and functional**
- [ ] **Inputs ≥ 16px font-size** (prevents iOS zoom)

### Accessibility

- [ ] **Semantic HTML** (proper headings, landmarks, button vs link)
- [ ] **Focus visible** on all interactive elements
- [ ] **Color not used as sole indicator** (icons/text supplement)
- [ ] **Screen-reader-friendly** (aria labels, logical tab order)

---

## Appendix A: UX Vocabulary Quick Reference

| Term | Definition |
|------|-----------|
| **Affordance** | What an object allows you to do (a button affords pressing) |
| **Signifier** | Visual indicator of where/how to interact |
| **Cognitive load** | Mental effort required to use an interface |
| **Progressive disclosure** | Revealing information gradually, as needed |
| **Mental model** | User's internal understanding of how a system works |
| **Information scent** | Cues that help users predict what they'll find if they click |
| **Heuristic** | A broad rule of thumb for evaluating usability |
| **Gestalt** | Psychological theory of how humans perceive visual wholes |
| **Halation** | Blurry halo effect around bright text on very dark backgrounds |
| **F-pattern** | Eye-tracking reading pattern for text-heavy pages |
| **Z-pattern** | Eye-tracking reading pattern for sparse/hero pages |
| **Fitts's Law** | Time to target = f(distance, size) — bigger, closer targets are faster |
| **Hick's Law** | Decision time increases logarithmically with number of choices |
| **Miller's Law** | Working memory holds ~7 (±2) items |
| **Jakob's Law** | Users expect your site to work like other sites they use |

## Appendix B: Recommended Reading

1. **The Design of Everyday Things** — Don Norman (foundational)
2. **Don't Make Me Think** — Steve Krug (practical web usability)
3. **Laws of UX** — Jon Yablonski (lawsofux.com — visual reference)
4. **10 Usability Heuristics** — Jakob Nielsen (nngroup.com)
5. **Refactoring UI** — Adam Wathan & Steve Schoger (visual design for developers)
6. **Inclusive Components** — Heydon Pickering (accessibility patterns)

---

*Last updated: February 2026*
*Sources: Nielsen Norman Group, Don Norman, Jon Yablonski (Laws of UX), Smashing Magazine, Google Material Design, Apple Human Interface Guidelines, WCAG 2.2, Baymard Institute, Steven Hoober (thumb zones), various UX research publications*
