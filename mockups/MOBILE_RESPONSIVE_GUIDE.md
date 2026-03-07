# Mobile & Responsive UI Expert Guide

> **Purpose**: Comprehensive reference for any agent implementing responsive/mobile design in the Armoury mockups. This document captures research, principles, CSS patterns, and project-specific decisions so implementations are consistent and expert-grade.

---

## Table of Contents

1. [Philosophy & Mental Model](#1-philosophy--mental-model)
2. [Breakpoint System](#2-breakpoint-system)
3. [Layout Rearrangement Patterns](#3-layout-rearrangement-patterns)
4. [Touch Ergonomics & Thumb Zones](#4-touch-ergonomics--thumb-zones)
5. [Touch Target Sizing](#5-touch-target-sizing)
6. [Navigation: Desktop vs Mobile](#6-navigation-desktop-vs-mobile)
7. [Drawers & Modals on Mobile](#7-drawers--modals-on-mobile)
8. [Responsive Typography (Fluid)](#8-responsive-typography-fluid)
9. [Responsive Spacing (Fluid)](#9-responsive-spacing-fluid)
10. [CSS Grid Patterns](#10-css-grid-patterns)
11. [Flexbox Patterns](#11-flexbox-patterns)
12. [Container Queries](#12-container-queries)
13. [Tables & Data on Mobile](#13-tables--data-on-mobile)
14. [Glassmorphism Performance on Mobile](#14-glassmorphism-performance-on-mobile)
15. [Images & Media](#15-images--media)
16. [Armoury-Specific Responsive Decisions](#16-armoury-specific-responsive-decisions)
17. [CSS Implementation Reference](#17-css-implementation-reference)
18. [Anti-Patterns](#18-anti-patterns)
19. [Checklist](#19-checklist)

---

## 1. Philosophy & Mental Model

### Mobile-First, Always

Write base CSS for mobile (smallest viewport). Layer enhancements for larger screens using `min-width` media queries. This ensures:

- Mobile gets minimal CSS (better performance on constrained devices)
- Desktop enhancements are additive, not reductive
- You never forget the mobile case

```css
/* Base: mobile */
.card { padding: 12px; }

/* Enhancement: tablet+ */
@media (min-width: 768px) {
  .card { padding: 24px; }
}
```

**Never** use `max-width` queries as your primary responsive strategy. They create a desktop-first approach that requires undoing styles for mobile — more CSS, more bugs.

### Intrinsic Design > Breakpoint Design

Modern responsive design is **intrinsic** — components adapt to their available space naturally, without explicit breakpoints, using CSS features like:

- `flex-wrap` — items wrap when they run out of space
- `grid` with `auto-fit` / `minmax()` — columns appear/disappear based on space
- `clamp()` — values scale fluidly between min and max
- `min()` / `max()` — pick the best value for the current context
- Container queries — components respond to their container, not the viewport

**Use breakpoints for macro layout changes** (navigation position, sidebar visibility, column count). Use intrinsic CSS for everything else.

### The Three Layers of Responsiveness

1. **Viewport-responsive** (media queries) — page-level layout: sidebar, navigation, column structure
2. **Container-responsive** (container queries) — component-level adaptation: card layouts, widget density
3. **Content-responsive** (intrinsic CSS) — text wrapping, image scaling, flex/grid reflow

A well-responsive page uses all three layers. Don't reach for media queries when `flex-wrap` or `auto-fit` would solve the problem without one.

---

## 2. Breakpoint System

### Armoury Breakpoints (Current in styles.css)

| Token       | Value   | Description                                    |
|-------------|---------|------------------------------------------------|
| `--bp-sm`   | 480px   | Large phones (landscape, small adjustments)    |
| `--bp-md`   | 768px   | Tablets / sidebar appears                      |
| `--bp-lg`   | 1024px  | Small laptops / multi-column layouts           |
| `--bp-xl`   | 1280px  | Desktops / comfortable multi-panel             |

### Current Responsive Rules in styles.css

```css
/* Mobile: hide sidebar, show bottom nav */
@media (max-width: 767px) {
  .sidebar { display: none; }
  .main-content { margin-left: 0; }
  .bottom-nav { display: flex; }
  .content { padding: var(--space-4); padding-bottom: 80px; }
  .fab { bottom: 80px; }
}

/* Tablet: match layout goes single-column, detail panel becomes slide-in drawer */
@media (max-width: 1024px) {
  .match-layout { grid-template-columns: 1fr !important; }
  .match-detail-panel { /* becomes fixed slide-in drawer */ }
  .match-rules-rail { display: none; }
}

/* Desktop utility classes */
.desktop-only → hidden below 768px
.mobile-only  → hidden at 768px+

/* Drawer scaling */
@media (min-width: 768px) { .drawer { width: 50%; } }
@media (min-width: 1024px) { .drawer { width: 40%; } }
```

### How to Choose Breakpoints

**DO NOT** pick breakpoints based on specific devices (iPhone 15, iPad Pro, etc.). Pick them based on where your layout breaks. Resize the browser and note where content becomes cramped or awkward — that's your breakpoint.

The four breakpoints above should cover most cases. Add a new one only if there's a clear layout break that none of the existing ones address.

---

## 3. Layout Rearrangement Patterns

### Pattern: Sidebar → Bottom Nav

**Desktop**: Sidebar pinned to left (220px wide), main content fills remaining space.
**Mobile (<768px)**: Sidebar disappears, bottom tab bar appears with 3-5 icons.

This is already implemented in styles.css. The bottom nav has `display: none` by default and `display: flex` at `max-width: 767px`.

### Pattern: Multi-Column → Stacked

**Desktop**: 2 or 3 column grid (e.g., unit list + detail panel + rules rail).
**Tablet (<1024px)**: Detail panel becomes slide-in drawer; rules rail hidden or moved to tabs.
**Mobile (<768px)**: Everything stacks into a single column. Drawers become full-screen takeovers.

```css
.match-layout {
  display: grid;
  grid-template-columns: 340px 1fr 300px; /* list | detail | rules */
}

@media (max-width: 1024px) {
  .match-layout {
    grid-template-columns: 1fr; /* stack to single column */
  }
  /* detail becomes a slide-in drawer */
  /* rules rail moves to a tab within the drawer */
}
```

### Pattern: Horizontal Scroll → Wrap or Stack

**Never** allow horizontal page scrolling. If a row of items overflows:

1. **Preferred**: `flex-wrap: wrap` — items flow to the next line
2. **Acceptable for chips/filters**: `overflow-x: auto` with `-webkit-overflow-scrolling: touch` — horizontal scroll within a container only
3. **If neither works**: Stack vertically

```css
/* Global rule — NO horizontal page scroll */
html, body { overflow-x: hidden; }
.main-content { overflow-x: hidden; }
```

### Pattern: Grid Cards Auto-Reflow

Cards in a grid should use `auto-fit` + `minmax()` to automatically adjust column count:

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
  gap: var(--space-4);
}
```

The `min(280px, 100%)` prevents overflow when the container is narrower than 280px — cards will fill 100% of the container width instead.

### Pattern: Two-Column Form → Stacked Form

Desktop forms with side-by-side fields should stack on mobile:

```css
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

@media (max-width: 767px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
```

### Pattern: Table → Card Stack

See [Section 13: Tables & Data on Mobile](#13-tables--data-on-mobile).

---

## 4. Touch Ergonomics & Thumb Zones

### The Research

Steven Hoober's research (1,300+ users observed):
- **49%** hold phones in one hand, using their thumb
- **75%** of all interactions use only the thumb
- On devices >6.5 inches, the effective natural (easy) zone shrinks to just **22%** of the screen

### The Three Zones

```
┌─────────────────────────────┐
│  HARD TO REACH (top 25%)    │  ← Avoid primary actions here
│  Status info, titles, back  │
├─────────────────────────────┤
│                             │
│  COMFORTABLE (middle 35%)   │  ← Secondary actions, content
│  Scrollable content lives   │
│  here                       │
│                             │
├─────────────────────────────┤
│  EASY / NATURAL (bottom 40%)│  ← PRIMARY ACTIONS HERE
│  Nav tabs, CTAs, FABs       │  ← Tap accuracy: 96%
│  Phase navigation, toggles  │  ← 267% faster interaction
└─────────────────────────────┘
```

### Implications for Armoury Mockups

| Element | Zone | Rationale |
|---------|------|-----------|
| Bottom tab bar (nav) | Easy | Always within thumb reach |
| Phase navigation (Next/Previous) | Easy | Sticky footer at bottom of unit list |
| CP/VP readouts | Comfortable | Visible but not primary action |
| Unit list (scrollable) | Comfortable | Thumb scrolls naturally through middle |
| Stratagem "Use" buttons | Comfortable | Within scrollable list, thumb can reach |
| Close buttons on drawers | Comfortable/Hard | Consider adding swipe-down-to-dismiss as alternative |
| Header / page title | Hard | Read-only, no interaction needed |
| Rules rail tabs | Comfortable | On right side at mid-screen height |

### One-Handed Use Design Rules

1. **Primary CTAs go at the bottom** — not the top, not floating in the middle
2. **Avoid top corners** for interactive elements on mobile (hardest to reach)
3. **Swipe gestures supplement taps** — swipe-down to dismiss drawers, swipe-left/right for phase navigation
4. **FABs (Floating Action Buttons)** should be bottom-right (right thumb) or bottom-center
5. **Bottom sheets > top modals** for quick actions on mobile

---

## 5. Touch Target Sizing

### Platform Guidelines

| Source | Minimum Size | Recommended | Spacing |
|--------|-------------|-------------|---------|
| Apple (iOS HIG) | 44×44 pt | 48×48 pt | 1px minimum |
| Google (Material) | 48×48 dp | 56×56 dp for primary | 8dp minimum |
| WCAG 2.5.5 (AAA) | 44×44 CSS px | — | — |
| WCAG 2.2 (AA) | 24×24 CSS px | — | adequate spacing |

### Armoury Rules

- **Minimum touch target**: 44px × 44px (Apple HIG baseline)
- **Primary CTAs**: 48px height minimum, full-width on mobile
- **Icon buttons**: Visual icon can be 24px, but the **tappable area** (padding included) must be at least 44px
- **Spacing between targets**: 8px minimum gap between any two tappable elements
- **List items**: Entire row is tappable, minimum 56px height

```css
/* Icon button — small visual, large tap area */
.icon-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  /* icon inside is 20-24px, padding provides the rest */
}

/* List item — entire row tappable */
.list-item {
  display: flex;
  align-items: center;
  min-height: 56px;
  padding: 12px 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
```

### Tap Feedback

Mobile users need immediate visual feedback on tap. Use:

```css
.tappable:active {
  background: var(--bg-active);
  transform: scale(0.98);
  transition: transform 0.1s ease;
}
```

Avoid `hover` effects as primary feedback on touch — `hover` is unreliable on mobile. Use `:active` instead. You can keep `:hover` for desktop but layer `:active` for touch.

---

## 6. Navigation: Desktop vs Mobile

### Desktop (≥768px): Left Sidebar

- Fixed/pinned to left, 220px wide
- Vertical list of nav items with icons + labels
- Always visible — no hamburger needed
- Shows game system selector at top, nav links below

### Mobile (<768px): Bottom Tab Bar

- Fixed to bottom of screen, full width
- 3-5 tabs maximum (more causes cramped targets)
- Icons + short labels (one word each)
- Active state: icon + label highlighted with accent color
- Height: 64-72px (includes safe area for iOS home indicator)
- z-index above content but below drawers/modals

**Current Armoury tabs**: Forge, Ledger, Campaigns, Allies, References (5 tabs — maximum for mobile)

### Hamburger vs Tab Bar

Research clearly favors **tab bars** over hamburger menus for mobile:
- Hamburger hides options, requiring extra taps — 30-40% lower feature discovery
- Tab bars show all primary destinations at once — 25-30% higher engagement
- Tab bars are always in the thumb zone

**Only use hamburger for overflow/secondary nav** (settings, account, less-used features). The Armoury profile popover in the header handles this role.

### Match Phase Navigation (Mobile-Specific)

The guided match mode has 6+ phases. On mobile, this requires special treatment:

- **Horizontal scrolling tab bar** at the top (below header) for phase tabs
- Each tab is a link to a separate page
- Active tab highlighted, tabs scroll horizontally
- **Sticky footer** with Previous Phase / Next Phase buttons (in the easy thumb zone)
- Footer buttons use `chevron-left` and `chevron-right` icons

---

## 7. Drawers & Modals on Mobile

### The Rule from ui_notes.txt

> "When modals (dialogs) or drawers are used on the desktop (medium, large, x-large screen sizes) screens, these should be take-over screens on mobile devices"

### Implementation Pattern

**Desktop (≥768px)**: Drawer slides in from right, occupies 40-50% of screen width.
**Mobile (<768px)**: Drawer becomes a **full-screen takeover** — 100% width, 100% height.

```css
.drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;         /* mobile default: full screen */
  height: 100vh;
  height: 100dvh;      /* dynamic viewport height — accounts for mobile browser chrome */
  z-index: var(--z-drawer);
  /* glass styling */
}

@media (min-width: 768px) {
  .drawer { width: 50%; }
}
@media (min-width: 1024px) {
  .drawer { width: 40%; }
}
```

### Bottom Sheet Pattern (Mobile Alternative)

For quick, contextual actions (e.g., "choose secondary mission", "select stratagem"), use a **bottom sheet** instead of a full-screen drawer:

- Anchored to bottom of screen
- Covers 40-60% of screen height initially
- Can be swiped up to expand to full screen
- Swiped down to dismiss
- Has a **grab handle** (short horizontal bar at top) to indicate swipe affordance
- Always include a visible **Close/X button** — not all users discover swipe-to-dismiss

```css
.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 60vh;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  background: var(--glass-popover-bg);
  backdrop-filter: var(--glass-popover-blur);
  z-index: var(--z-drawer);
  overflow-y: auto;
  transition: transform var(--duration-normal) var(--ease-spring);
}

.bottom-sheet .grab-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: oklch(1 0 0 / 30%);
  margin: 8px auto 16px;
}
```

### When to Use Which

| Content | Desktop | Mobile |
|---------|---------|--------|
| Unit detail datasheet | Side drawer (50%) | Full-screen takeover |
| Stratagem rules popover | Popover/tooltip | Bottom sheet (50% height) |
| End-turn secondary missions | Inline section | Bottom sheet |
| Add unit modal | Centered modal | Full-screen takeover |
| Filter/sort options | Dropdown/popover | Bottom sheet |
| Match creation form | Centered modal or drawer | Full-screen takeover |

### Close Affordances (CRITICAL)

Every drawer/modal/sheet **must** have:
1. A visible **X button** (top-right for drawers, top-right or top-left for full-screen)
2. A **backdrop tap** handler (tap scrim to close for drawers/modals)
3. Optionally **swipe-down-to-dismiss** for bottom sheets

**Never** rely solely on swipe gestures for dismissal — accessibility requires a visible button.

---

## 8. Responsive Typography (Fluid)

### The clamp() Function

`clamp(min, preferred, max)` creates values that scale fluidly between a minimum and maximum based on viewport width:

```css
font-size: clamp(1rem, 0.5rem + 1.5vw, 1.5rem);
```

- Below ~480px viewport: locks to `1rem` (16px)
- Between 480px–1280px: scales fluidly
- Above ~1280px: locks to `1.5rem` (24px)

### Formula

To calculate the preferred `vw` value:

```
preferred = (maxSize - minSize) / (maxViewport - minViewport) * 100vw + offset
```

Or use a clamp calculator: https://clampgenerator.com/

### Armoury Typography Scale (Recommended)

```css
:root {
  /* Fluid type scale */
  --text-xs:    clamp(0.6875rem, 0.625rem + 0.2vw, 0.75rem);    /* 11px → 12px */
  --text-sm:    clamp(0.75rem, 0.675rem + 0.25vw, 0.875rem);     /* 12px → 14px */
  --text-base:  clamp(0.875rem, 0.8rem + 0.25vw, 1rem);          /* 14px → 16px */
  --text-lg:    clamp(1rem, 0.9rem + 0.35vw, 1.25rem);           /* 16px → 20px */
  --text-xl:    clamp(1.125rem, 0.95rem + 0.6vw, 1.5rem);        /* 18px → 24px */
  --text-2xl:   clamp(1.25rem, 1rem + 0.8vw, 2rem);              /* 20px → 32px */
  --text-3xl:   clamp(1.5rem, 1.1rem + 1.2vw, 2.5rem);           /* 24px → 40px */
}
```

### Line Height on Mobile

Mobile text needs slightly more line-height than desktop for readability:

```css
body { line-height: 1.6; }

@media (min-width: 768px) {
  body { line-height: 1.5; }
}

/* Or use unitless values (recommended — they scale with font-size) */
h1 { line-height: 1.2; }
h2 { line-height: 1.25; }
p  { line-height: 1.6; }
```

---

## 9. Responsive Spacing (Fluid)

### Fluid Spacing with clamp()

Just like typography, spacing should scale between mobile and desktop:

```css
:root {
  --space-1:  clamp(0.25rem, 0.2rem + 0.15vw, 0.375rem);    /* 4px → 6px */
  --space-2:  clamp(0.5rem, 0.4rem + 0.3vw, 0.75rem);       /* 8px → 12px */
  --space-3:  clamp(0.625rem, 0.5rem + 0.4vw, 1rem);         /* 10px → 16px */
  --space-4:  clamp(0.75rem, 0.6rem + 0.5vw, 1.25rem);       /* 12px → 20px */
  --space-5:  clamp(1rem, 0.8rem + 0.65vw, 1.5rem);          /* 16px → 24px */
  --space-6:  clamp(1.5rem, 1.2rem + 1vw, 2.5rem);           /* 24px → 40px */
  --space-8:  clamp(2rem, 1.5rem + 1.5vw, 3.5rem);           /* 32px → 56px */
}
```

### When NOT to Scale

Some values should remain fixed:
- **Border widths**: 1px is 1px everywhere
- **Border radius**: Usually fixed (`8px`, `12px`) — scaling creates visual inconsistency
- **Icon sizes**: 16px, 20px, 24px — these are pixel-aligned by design
- **Touch target minimums**: 44px minimum is FIXED, not fluid

---

## 10. CSS Grid Patterns

### Auto-Reflow Grid (No Breakpoints Needed)

```css
.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
  gap: var(--space-4);
}
```

Use for: army cards, campaign list, match list, unit grids.

### Named Areas Grid (With Breakpoints)

```css
.page-layout {
  display: grid;
  grid-template-areas:
    "header"
    "content"
    "footer";
  grid-template-rows: auto 1fr auto;
}

@media (min-width: 768px) {
  .page-layout {
    grid-template-columns: 220px 1fr;
    grid-template-areas:
      "sidebar header"
      "sidebar content"
      "sidebar footer";
  }
}
```

### Match Page Layout (Complex 3-Column)

```css
.match-layout {
  display: grid;
  grid-template-columns: 1fr; /* mobile: single column */
}

@media (min-width: 768px) {
  .match-layout {
    grid-template-columns: 340px 1fr; /* tablet: list + detail */
  }
}

@media (min-width: 1280px) {
  .match-layout {
    grid-template-columns: 340px 1fr 300px; /* desktop: list + detail + rules */
  }
}
```

---

## 11. Flexbox Patterns

### Wrap-Based Reflow

```css
.chip-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
```

Chips/filters will automatically wrap to the next line when space runs out. No breakpoint needed.

### Sticky Footer (Match Phase Nav)

```css
.phase-footer {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border-top: var(--glass-border);
  z-index: 10;
  min-height: 56px; /* touch target */
}
```

### Split Layout (50/50 or 60/40)

```css
.split {
  display: flex;
  gap: var(--space-4);
}
.split > * { flex: 1; }

@media (max-width: 767px) {
  .split {
    flex-direction: column;
  }
}
```

---

## 12. Container Queries

### When to Use

Container queries let a **component** respond to its **container's** size, not the viewport. This is ideal for components that appear in different contexts (e.g., a unit card in a grid, in a drawer, in a modal):

```css
.unit-card-container {
  container-type: inline-size;
}

/* When container is wide, show horizontal layout */
@container (min-width: 400px) {
  .unit-card {
    display: grid;
    grid-template-columns: 80px 1fr auto;
  }
}

/* When container is narrow, stack vertically */
.unit-card {
  display: flex;
  flex-direction: column;
}
```

### Browser Support

Container queries are supported in all modern browsers (Chrome 105+, Firefox 110+, Safari 16+). Since we're building mockups, we can use them freely.

### Best Practice

Use **media queries** for page layout. Use **container queries** for reusable components.

---

## 13. Tables & Data on Mobile

### The Problem

Tables with 4+ columns become unreadable on mobile. The Armoury mockups have data-dense content: unit stats (M/T/Sv/W/Ld/OC), weapon profiles, scoreboard rows.

### Pattern 1: Card Stack (Recommended for Unit Data)

On mobile, transform each table row into a card:

```css
@media (max-width: 767px) {
  .data-table thead { display: none; }
  .data-table tr {
    display: block;
    margin-bottom: var(--space-3);
    padding: var(--space-3);
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    border: var(--glass-border);
    border-radius: var(--radius-md);
  }
  .data-table td {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    border-bottom: 1px solid var(--border-subtle);
  }
  .data-table td::before {
    content: attr(data-label);
    font-weight: 600;
    color: var(--text-secondary);
  }
}
```

HTML requires `data-label` attributes on each `<td>`:
```html
<td data-label="M">6"</td>
<td data-label="T">4</td>
```

### Pattern 2: Horizontal Scroll (Acceptable for Stat Lines)

For compact stat lines (M/T/Sv/W/Ld/OC), horizontal scroll within a container is acceptable because:
- The data is short (single numbers)
- Users expect to see it as a row
- Cards would waste space

```css
.stat-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}
```

### Pattern 3: Compact Inline Stats

For stat lines that are very short, use inline badges/pills instead of a table:

```html
<div class="stat-pills">
  <span class="stat-pill">M 6"</span>
  <span class="stat-pill">T 4</span>
  <span class="stat-pill">Sv 3+</span>
  <span class="stat-pill">W 2</span>
  <span class="stat-pill">Ld 6+</span>
  <span class="stat-pill">OC 2</span>
</div>
```

---

## 14. Glassmorphism Performance on Mobile

### The Problem

`backdrop-filter: blur()` is **expensive**. The browser must:
1. Render everything behind the element
2. Apply the blur filter to that rendered content
3. Composite the blurred result with the glass element on top

This happens on **every frame**. Multiple glass layers = compounding cost.

### Performance Rules for Armoury

1. **Blur radius ≤ 24px** — we're currently at `blur(24px)` for standard glass and `blur(32px)` for popovers. This is at the upper limit. Do not increase further for mobile.

2. **Limit glass layer count** — Apple's own guidance: "don't use glass on glass." On mobile, aim for maximum **2 glass layers** in the viewport at once (e.g., bottom nav + one drawer).

3. **Promote glass elements to their own layer**:
   ```css
   .glass-element {
     will-change: transform; /* only on elements that animate */
     transform: translateZ(0); /* force GPU compositing */
   }
   ```
   Use `will-change` sparingly — on animated elements only, not static ones.

4. **Reduce blur on mobile** if performance is poor:
   ```css
   @media (max-width: 767px) {
     :root {
       --glass-blur: blur(16px) saturate(180%) brightness(1.1);
       --glass-popover-blur: blur(20px) saturate(180%) brightness(1.05);
     }
   }
   ```

5. **Avoid animating glass elements** — transitions on glass elements (slide-in drawers, etc.) are expensive. Animate `transform` only (not `backdrop-filter`, `opacity`, or `background`).

6. **Test on real devices** — desktop browser dev tools do NOT represent mobile GPU performance. Chrome on a mid-range Android phone is the real benchmark.

### Dark Mode Advantage

Our dark theme actually helps glassmorphism performance because:
- Dark backgrounds require less visual contrast in the blur
- Lower `brightness()` multiplier needed
- Less perceptible quality difference at lower blur radii

---

## 15. Images & Media

### Responsive Images

```css
img {
  max-width: 100%;
  height: auto;
  display: block;
}
```

### Aspect Ratio for Placeholders

Use `aspect-ratio` to prevent layout shift:

```css
.army-image {
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: var(--radius-md);
}

.unit-thumb {
  aspect-ratio: 1;
  width: 48px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}
```

### Unit Thumbnails on Mobile

On mobile, unit thumbnails in lists should be:
- 40-48px square (saves horizontal space)
- `border-radius: var(--radius-sm)` (8px)
- Gradient placeholder if no image (using faction colors)

On desktop, thumbnails can be larger (56-64px).

---

## 16. Armoury-Specific Responsive Decisions

These are project-specific decisions derived from `ui_notes.txt` and the design system.

### Navigation

| Viewport | Navigation | Position |
|----------|-----------|----------|
| <768px (mobile) | Bottom tab bar (5 tabs) | Fixed bottom |
| ≥768px (tablet/desktop) | Left sidebar (220px) | Fixed left |

### Drawers → Takeovers

| Viewport | Drawer Width |
|----------|-------------|
| <768px | 100% (full-screen takeover) |
| 768px–1023px | 50% |
| ≥1024px | 40% |

### Match Page Layout

| Viewport | Layout |
|----------|--------|
| <768px | Single column. Unit list with sticky phase footer. Detail and rules accessed via full-screen drawers/takeovers. |
| 768px–1279px | Two columns: unit list (340px) + detail panel. Rules rail hidden, accessible via tab within detail panel. |
| ≥1280px | Three columns: unit list (340px) + detail panel (flex) + rules rail (300px). |

### HP Readout on Mobile

The HP readout pattern (text input + range slider + ±buttons) needs to be compact on mobile:
- Stack the readout vertically if horizontal space is tight
- The range slider should be full-width below the text/buttons row
- Minimum touch target for ± buttons: 44px

### Phase Footer on Mobile

```
┌─────────────────────────────────────┐
│ ← Previous Phase    Next Phase →    │
│   (chevron-left)    (chevron-right) │
│              56px height            │
└─────────────────────────────────────┘
```

- Sticky to bottom of scroll area (within `.content`, not fixed to viewport — so it scrolls with content but stays at bottom)
- Glass background for visual continuity
- Min-height: 56px
- Buttons are full-width within their half, with clear labels + icons

### Unit Cards on Mobile

On mobile, unit cards should be:
- Full-width, stacked vertically
- Compact: thumbnail (40px) + name + model count + points on one row
- Tappable: entire card is a touch target (min-height 56px)
- Action indicators (Performed Action flag) as small badges, not full rows

### CP/VP Display on Mobile

- CP: Yellow (`oklch(0.82 0.14 90)`), 16px on mobile / 18px on desktop
- VP: Bronze (`var(--accent-primary)`), 18px on mobile / 20px on desktop
- Both should be in the header or a sticky area, always visible

---

## 17. CSS Implementation Reference

### Viewport Units

```css
height: 100vh;        /* standard viewport height */
height: 100dvh;       /* dynamic viewport height — recommended for mobile */
height: 100svh;       /* small viewport height (browser chrome visible) */
height: 100lvh;       /* large viewport height (browser chrome hidden) */
```

**Always prefer `dvh`** for full-screen elements on mobile. `100vh` on mobile includes the URL bar space, causing content to be cut off.

### Safe Area Insets (iOS Notch/Home Indicator)

```css
.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.full-screen-drawer {
  padding-top: env(safe-area-inset-top, 0px);
}
```

### Prevent iOS Zoom on Input Focus

Inputs with font-size <16px cause iOS Safari to zoom in. Prevent this:

```css
input, select, textarea {
  font-size: 16px; /* prevents iOS auto-zoom */
}
```

### Scroll Behavior

```css
/* Smooth scrolling for anchor links */
html { scroll-behavior: smooth; }

/* Momentum scrolling on iOS for overflow containers */
.scroll-container {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Hide scrollbar but keep scrollable */
.hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
```

### Disable Text Selection on Interactive Elements

```css
.btn, .chip, .tab, .nav-item {
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
```

---

## 18. Anti-Patterns

### DO NOT

| Anti-Pattern | Why It's Bad | Do Instead |
|-------------|-------------|------------|
| `max-width` queries as primary strategy | Desktop-first, requires undoing styles | Mobile-first with `min-width` |
| Fixed pixel widths on containers | Breaks on unexpected screen sizes | Use `%`, `fr`, `min()`, `clamp()` |
| Horizontal page scrolling | Unusable on mobile, fails accessibility | `overflow-x: hidden` on body + fix the layout |
| Hover-only interactions | No hover on touch screens | Use `:active` and tap events |
| Small touch targets (<44px) | Frustrating, causes mis-taps | Min 44×44px touch area |
| Glass on glass on glass | Performance death on mobile | Max 2 glass layers visible at once |
| `position: fixed` for everything | Causes scroll jank on iOS | Use `position: sticky` when possible |
| `100vh` for full-screen mobile | Doesn't account for browser chrome | Use `100dvh` instead |
| Font-size <16px on inputs | iOS Safari auto-zooms | Set `font-size: 16px` on all inputs |
| Animating `backdrop-filter` | Extremely expensive, drops frames | Only animate `transform` and `opacity` |
| Relying only on swipe to dismiss | Not discoverable, not accessible | Always provide visible close button |
| Stacking bottom sheets | Confusing navigation, easy to lose context | One overlay at a time |

---

## 19. Checklist

Use this checklist before marking any responsive implementation complete.

### Layout
- [ ] Page renders correctly at 375px wide (iPhone SE)
- [ ] Page renders correctly at 768px wide (iPad portrait)
- [ ] Page renders correctly at 1024px wide (small laptop)
- [ ] Page renders correctly at 1440px wide (desktop)
- [ ] No horizontal scrolling at any width
- [ ] Navigation switches between sidebar (≥768px) and bottom tabs (<768px)
- [ ] Drawers become full-screen takeovers on mobile

### Touch
- [ ] All interactive elements are ≥44×44px touch targets
- [ ] ≥8px spacing between adjacent touch targets
- [ ] Primary actions are in the bottom 40% of the screen (thumb zone)
- [ ] All drawers/modals have visible close buttons
- [ ] No hover-dependent interactions (`:active` used for touch feedback)

### Typography & Spacing
- [ ] Text is readable at all viewport widths (no truncation of critical content)
- [ ] Inputs have `font-size: 16px` (prevents iOS zoom)
- [ ] Spacing scales appropriately (not cramped on mobile, not wasteful on desktop)

### Performance
- [ ] Maximum 2 glass layers visible simultaneously
- [ ] `backdrop-filter` blur ≤ 24px on mobile
- [ ] Images use `max-width: 100%` and appropriate `aspect-ratio`
- [ ] `will-change` used only on animated elements

### Accessibility
- [ ] Color contrast meets WCAG AA (4.5:1 for text, 3:1 for large text)
- [ ] Interactive elements have visible focus states
- [ ] Screen reader users can navigate all content
- [ ] `prefers-reduced-motion` respected for animations

---

## Appendix: Quick CSS Recipes

### Full-Screen Takeover (Mobile Drawer)

```css
.drawer {
  position: fixed;
  inset: 0;                          /* top:0 right:0 bottom:0 left:0 */
  width: 100%;
  height: 100dvh;
  background: var(--glass-popover-bg);
  backdrop-filter: var(--glass-popover-blur);
  z-index: var(--z-drawer);
  overflow-y: auto;
}

@media (min-width: 768px) {
  .drawer {
    inset: 0 0 0 auto;              /* anchor to right side */
    width: 50%;
  }
}

@media (min-width: 1024px) {
  .drawer { width: 40%; }
}
```

### Responsive Card Grid

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
  gap: clamp(12px, 2vw, 24px);
}
```

### Sticky Bottom Action Bar

```css
.action-bar {
  position: sticky;
  bottom: 0;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border-top: var(--glass-border);
  padding: 12px 16px;
  display: flex;
  gap: 12px;
  z-index: 10;
}

/* On mobile, account for bottom nav */
@media (max-width: 767px) {
  .action-bar { bottom: 64px; }
}
```

### Fluid Container Width

```css
.container {
  width: min(100% - 2rem, 1200px);
  margin-inline: auto;
}
```

---

*Last updated: February 2026*
*Research sources: Steven Hoober (thumb zones), Nielsen Norman Group (bottom sheets), Smashing Magazine (responsive design), Apple HIG, Google Material Design, MDN Web Docs, Josh Comeau (container queries), Ahmad Shadeed (responsive design guide)*
