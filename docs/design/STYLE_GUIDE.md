# Armoury UI Style Guide

**Purpose:** Define the complete visual language and component patterns for Armoury across web and mobile. This is the single source of truth for UI look-and-feel. Tokens are defined separately in `DESIGN_TOKENS.md` (no JSON here).

**Scope:** Web (Next.js 15 + Radix UI + Tailwind v4) and Mobile (Expo 53 + React Native 0.79 + Tamagui v2).

**Theme:** Dark, tactical, information-dense. Not a generic dark mode.

**Related Documents:**
- `DESIGN_TOKENS.md` (canonical token values)
- `ART_DIRECTION.md` (AI imagery, faction archetypes, asset catalog)
- `REQUIREMENTS.md` (functional requirements)
- `INFORMATION_ARCHITECTURE.md` (page inventory)
- `FLOWS.md` (user journeys)
- `DECISIONS.md` (open design decisions)

---

## 1. Design Philosophy

**Tactical Clarity**
- Information-dense layouts that remain scannable. Every pixel serves a purpose.
- Hierarchy is explicit: headings, subheads, labels, data.

**Dark Dominance**
- True dark UI; base surfaces sit at 19–29% lightness in oklch.
- Elevation is created via surface lightening and border glow, not shadows.

**Three-Color Accent System**
- **Primary (Cold Steel Blue)** for CTAs, buttons, active states, and navigation highlights.
- **Secondary (Warm Amber)** for data emphasis: points, costs, friend codes, VP scores.
- **Highlight (Signal Cyan)** for informational accents: links, abilities, rules, reminders.
- Faction archetype colors remain plugin-provided.

**Typography Hierarchy**
- Military-inspired type system with clear rank between headings, body, and data.
- Labels are uppercase, tracked wider to enhance the tactical tone.

**Motion Restraint**
- Subtle, purposeful motion. No distractions during matches.
- Feedback is informative: state change, focus, or system status.

**Platform Parity**
- Same visual language on web and mobile, adapted to platform conventions.
- Hover on web, press + haptics on mobile.

---

## 2. Color System (oklch)

### 2.1 Core Palette

**Backgrounds**
- `--bg-base`: oklch(0.19 0.005 260) — main app background
- `--bg-surface`: oklch(0.23 0.006 260) — cards, panels
- `--bg-elevated`: oklch(0.27 0.007 260) — modals, popovers
- `--bg-hover`: oklch(0.26 0.007 260) — hover surface
- `--bg-active`: oklch(0.29 0.008 260) — active/selected surface

**Text**
- `--text-primary`: oklch(0.94 0.01 260) — primary content
- `--text-secondary`: oklch(0.72 0.01 260) — secondary content
- `--text-tertiary`: oklch(0.55 0.01 260) — disabled, placeholder
- `--text-inverse`: oklch(0.15 0.01 260) — dark text on light surfaces

**Accent — Primary (Cold Steel Blue)**
- `--accent-primary`: oklch(0.72 0.12 235)
- `--accent-primary-hover`: oklch(0.78 0.13 235)
- `--accent-primary-muted`: oklch(0.72 0.12 235 / 18%)

**Accent — Secondary (Warm Amber)**
- `--accent-secondary`: oklch(0.75 0.12 70)
- `--accent-secondary-hover`: oklch(0.80 0.13 70)
- `--accent-secondary-muted`: oklch(0.75 0.12 70 / 18%)

**Accent — Highlight (Tarnished Copper)**
- `--accent-highlight`: oklch(0.68 0.11 40)
- `--accent-highlight-hover`: oklch(0.74 0.12 40)
- `--accent-highlight-muted`: oklch(0.68 0.11 40 / 18%)

**Accent — Tertiary (Pale Silver)**
- `--accent-tertiary`: oklch(0.75 0.03 250)
- `--accent-tertiary-hover`: oklch(0.80 0.04 250)
- `--accent-tertiary-muted`: oklch(0.75 0.03 250 / 18%)

**Semantic Colors**
- `--status-success`: oklch(0.65 0.15 145)
- `--status-warning`: oklch(0.75 0.15 65)
- `--status-danger`: oklch(0.62 0.20 25)
- `--status-info`: oklch(0.67 0.10 240)
- `--status-active`: oklch(0.78 0.18 145)
- `--status-planned`: oklch(0.58 0.08 235)

**Borders and Dividers**
- `--border-subtle`: oklch(1 0 0 / 10%)
- `--border-default`: oklch(1 0 0 / 14%)
- `--border-strong`: oklch(1 0 0 / 22%)
- `--border-accent`: oklch(0.72 0.12 235 / 45%)

**Faction Archetype Colors (plugin-provided defaults)**
Plugins map their factions to these archetypes (not copyrighted). Each archetype provides `primary`, `secondary`, and `muted`.

| Archetype | Primary (oklch) | Secondary (oklch) | Muted (oklch) |
| --- | --- | --- | --- |
| Iron Legion | oklch(0.62 0.12 250) | oklch(0.52 0.08 250) | oklch(0.32 0.02 250) |
| Sunforged | oklch(0.78 0.16 75) | oklch(0.68 0.12 65) | oklch(0.35 0.04 70) |
| Verdant Order | oklch(0.65 0.15 145) | oklch(0.55 0.10 145) | oklch(0.30 0.03 145) |
| Voidborn | oklch(0.58 0.08 280) | oklch(0.48 0.06 280) | oklch(0.28 0.02 280) |
| Crimson Pact | oklch(0.60 0.20 25) | oklch(0.50 0.16 25) | oklch(0.30 0.04 25) |
| Storm Guard | oklch(0.64 0.12 230) | oklch(0.54 0.10 230) | oklch(0.30 0.03 230) |
| Ashen Dominion | oklch(0.56 0.06 60) | oklch(0.42 0.05 60) | oklch(0.26 0.02 60) |
| Frost Warden | oklch(0.70 0.08 220) | oklch(0.58 0.06 220) | oklch(0.32 0.02 220) |
| Ember Cult | oklch(0.70 0.18 40) | oklch(0.60 0.14 40) | oklch(0.32 0.03 40) |
| Obsidian Coil | oklch(0.52 0.02 260) | oklch(0.35 0.02 260) | oklch(0.23 0.01 260) |

### 2.2 Three-Color Accent System
- **Primary (Cold Steel Blue)** for: CTAs, buttons, navigation active state, section headers, selected states, filter chips, progress bars.
- **Secondary (Warm Amber)** for: points/costs, VP scores, friend codes, enhancement costs, data emphasis, key numbers.
- **Highlight (Signal Cyan)** for: links, ability names, rule titles, enhancement cards, reminder banners, informational emphasis.
- Danger (red) for: delete, destructive actions, critical HP.
- Success (green) for: validation passed, unit added, match won.
- Warning (amber) for: validation warnings, approaching limits. (Note: `--status-warning` is a separate semantic token from `--accent-secondary`.)
- Never use color as the sole indicator. Pair with icon/text.

---

## 3. Typography

### 3.1 Font Stack
- **Display/Headings**: Libre Franklin (700/600)
- **Body**: Libre Franklin (400/500)
- **Monospace/Data**: JetBrains Mono or Fira Code (500/700)
- **Fallback**: system-ui, -apple-system, sans-serif

### 3.2 Type Scale (Major Third — 1.250)

| Token | Size | Weight | Line Height | Usage |
| --- | --- | --- | --- | --- |
| `--text-4xl` | 36px | 700 | 1.1 | Page titles (army name in header) |
| `--text-3xl` | 28px | 700 | 1.2 | Section headers |
| `--text-2xl` | 24px | 600 | 1.2 | Card titles, modal headers |
| `--text-xl` | 20px | 600 | 1.3 | Sub-section headers |
| `--text-lg` | 18px | 500 | 1.4 | Large body text, list item titles |
| `--text-base` | 16px | 400 | 1.5 | Body text |
| `--text-sm` | 14px | 400 | 1.5 | Secondary text, labels |
| `--text-xs` | 12px | 500 | 1.4 | Captions, badges, timestamps |
| `--text-2xs` | 10px | 500 | 1.3 | Micro text (use sparingly) |

### 3.3 Typography Rules
- All numeric data (points, stats, HP) use monospace.
- Stat blocks use monospace bold for values.
- Labels use uppercase + letter-spacing: `text-xs uppercase tracking-wider`.
- Never use pure white (#fff). Use near-white for comfort on dark backgrounds.

---

## 4. Spacing and Layout

### 4.1 Spacing Scale (4px base)

| Token | Value | Usage |
| --- | --- | --- |
| `--space-1` | 4px | Tight padding, icon gaps |
| `--space-2` | 8px | Default inner padding, related item gap |
| `--space-3` | 12px | Standard padding |
| `--space-4` | 16px | Card padding, section gaps |
| `--space-5` | 20px | Between components |
| `--space-6` | 24px | Section separation |
| `--space-8` | 32px | Major section gaps |
| `--space-10` | 40px | Page-level spacing |
| `--space-12` | 48px | Hero padding |
| `--space-16` | 64px | Desktop sidebar padding |

### 4.2 Layout Grid
- Mobile: 16px horizontal padding, 4-column grid.
- Tablet: 24px horizontal padding, 8-column grid.
- Desktop: 32px horizontal padding, 12-column grid, max width 1440px.
- Content max width: 1200px, centered.

### 4.3 Breakpoints

| Name | Min Width | Usage |
| --- | --- | --- |
| `sm` | 640px | Large phones landscape |
| `md` | 768px | Tablets portrait |
| `lg` | 1024px | Tablets landscape, small desktops |
| `xl` | 1280px | Standard desktops |
| `2xl` | 1536px | Large desktops |

Rules:
- Modals become takeover screens below `md`.
- Side nav becomes bottom nav below `md`.

---

## 5. Borders, Radii, and Elevation

### 5.1 Border Radius

| Token | Value | Usage |
| --- | --- | --- |
| `--radius-sm` | 4px | Badges, small chips |
| `--radius-md` | 6px | Buttons, inputs |
| `--radius-lg` | 8px | Cards, panels |
| `--radius-xl` | 12px | Modals, large cards |
| `--radius-full` | 9999px | Avatars, circular elements |

Tactical theme favors slightly angular corners.

### 5.2 Elevation / Shadows
- Use **surface lightening** for elevation.
- Use **border glow** for separation (oklch 1 0 0 / 5–10%).
- **Accent glow** for focus/active: `0 0 12px oklch(0.72 0.12 235 / 15%)`.
- Avoid drop shadows on dark backgrounds.

### 5.3 Dividers
- Horizontal rules: `border-top: 1px solid var(--border-subtle)`.
- Prefer spacing over lines for list separation.
- Use stronger border or spacing for section separation.

---

## 6. Iconography

- **Primary icon set**: Lucide React.
- **Sizes**: 16px (inline), 20px (standard), 24px (prominent), 32px (feature).
- **Color**: inherit text color by default; use `--accent-primary` when active.
- **Custom icons**: plugin-provided SVGs for faction symbols/unit types.
- **Spacing**: 8px gap between icon and text.

---

## 7. Motion and Animation

### 7.1 Easing Curves

| Token | Value | Usage |
| --- | --- | --- |
| `--ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard transitions |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Entering from natural position |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Exiting |
| `--ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Rarely, playful moments |

### 7.2 Duration Scale

| Token | Value | Usage |
| --- | --- | --- |
| `--duration-instant` | 100ms | Hover states, opacity changes |
| `--duration-fast` | 150ms | Button press, input focus |
| `--duration-normal` | 250ms | Panel transitions, drawer open |
| `--duration-slow` | 350ms | Modal open, page transitions |
| `--duration-slower` | 500ms | Complex/loading transitions |

### 7.3 Tactical Motion Patterns
- **Slide in**: Drawers/panels from edge (right for detail, bottom for mobile sheets).
- **Fade + scale**: Modals from 0.95 → 1.0.
- **Skeleton shimmer**: left-to-right with blue tint.
- **Pulse**: live/active indicators.
- **State transitions**: smooth color changes.
- **Avoid**: rotation, excessive bounce, parallax, page flips.

---

## 8. Accessibility

- WCAG AA minimum: ≥ 4.5:1 text contrast; large text ≥ 3:1.
- Focus: 2px solid accent outline with 2px offset.
- Touch targets: minimum 44×44px on mobile.
- Color independence: pair color with icons/text.
- `prefers-reduced-motion`: disable non-essential animations.
- Screen readers: all interactive elements must have accessible names.
- Dark theme benefit: reduced eye strain in low-light play environments.

---

## 9. Component Catalog

**For every component:** define visual description, states, variants, responsive behavior, web implementation (Radix/Tailwind), mobile adaptation (Tamagui). Sizes are explicit. All components support: default, hover/press, active, focused, disabled, loading, error, empty (where applicable).

### 9.1 Navigation

#### Side Navigation (Web — Desktop/Tablet)
- **Visual:** fixed left sidebar, full height. Width 240px expanded, 64px collapsed.
- **Background:** `--bg-surface`. **Border-right:** `--border-subtle`.
- **Items:** icon + label, vertical list, 44px height.
- **Active:** 3px left accent border + `--accent-primary-muted` background + accent icon/text.
- **Hover:** `--bg-hover`.
- **Collapsed:** icons only, tooltips on hover.
- **Top:** game system logo/icon. **Bottom:** user avatar with status dot.
- **Responsive:** hidden below `md`, replaced by bottom nav.
- **Web:** Radix `NavigationMenu` + `Tooltip`, Tailwind `data-[state=active]` for accent.
- **Mobile:** not used.

#### Bottom Navigation (Web Mobile & Mobile App)
- **Visual:** fixed bottom bar, 56px height + safe area inset.
- **Items:** 5 web items; mobile app adds Account as 6th.
- **Active:** accent icon + 4px dot indicator below label.
- **Background:** `--bg-surface` + top border `--border-subtle`.
- **Labels:** `--text-2xs` uppercase, hidden on very small screens.
- **Responsive:** shown below `md`.
- **Web:** sticky footer with `aria-current=page` styles.
- **Mobile:** Tamagui `Tabs` or custom bottom bar, haptic on press.

#### Header Bar
- **Height:** 56px mobile, 64px desktop.
- **Background:** `--bg-base` (solid) or transparent on scroll with blur.
- **Left:** back button (mobile only).
- **Center:** page title (bold, truncated).
- **Right:** profile icon, points counter, action buttons.
- **Army page:** shows “Army Name” + “500 / 2000 pts” in monospace.
- **States:** sticky on scroll; focus outlines on buttons.
- **Web:** Radix `Button` + `DropdownMenu`.
- **Mobile:** `Header` with safe-area padding.

#### Breadcrumb (Web Desktop Only)
- **Placement:** below header, above content.
- **Style:** `--text-sm` with separators `>` or `/`.
- **Current:** accent-colored, not clickable.
- **Web:** Radix `Breadcrumb` with custom separators.
- **Mobile:** hidden.

### 9.2 Buttons

#### Primary Button
- **Background:** `--accent-primary`.
- **Text:** `--text-inverse`.
- **Radius:** `--radius-md`.
- **Padding:** 12px 24px.
- **Font:** `--text-sm`, 600, uppercase, tracking-wider.
- **Hover:** `--accent-primary-hover`.
- **Active:** slight darken + inset border.
- **Focus:** 2px accent outline.
- **Disabled:** 50% opacity, no pointer events.
- **Loading:** spinner replaces text; width stays fixed.
- **Web:** Radix `Button` variant custom.
- **Mobile:** Tamagui `Button` with `pressStyle`.

#### Secondary Button
- **Background:** transparent.
- **Border:** 1px `--border-default`.
- **Text:** `--text-primary`.
- **Hover:** `--bg-hover`.
- **Active:** `--bg-active`.

#### Ghost Button
- **Background:** transparent, no border.
- **Text:** `--text-secondary`.
- **Hover:** `--text-primary` + `--bg-hover`.

#### Danger Button
- **Background:** `--status-danger`.
- **Text:** near-white.
- **Used for:** delete/destructive actions.

#### Icon Button
- **Size:** 40×40px (32×32 compact).
- **Content:** centered icon 20px.
- **Hover:** `--bg-hover`.
- **Tooltip:** on desktop only.

#### FAB (Floating Action Button)
- **Size:** 56×56px circle.
- **Background:** `--accent-primary`.
- **Icon:** 24px, `--text-inverse`.
- **Position:** bottom-right, 16px from edges.
- **Glow:** accent glow.
- **Mobile:** primary action per screen.

#### Button Sizes

| Size | Height | Padding | Font |
| --- | --- | --- | --- |
| `sm` | 32px | 8px 16px | `--text-xs` |
| `md` | 40px | 12px 24px | `--text-sm` |
| `lg` | 48px | 16px 32px | `--text-base` |

**Responsive:** on mobile, buttons expand to full width in forms; inline on desktop.

### 9.3 Cards

#### Standard Card
- **Background:** `--bg-surface`.
- **Border:** 1px `--border-subtle`.
- **Radius:** `--radius-lg`.
- **Padding:** `--space-4`.
- **Hover (clickable):** border to `--border-default`, translateY(-1px).
- **States:** loading shows skeleton overlay; error shows inline message.

#### Army Card (List Item)
- **Desktop:** horizontal, image left (40% width), content right.
- **Mobile:** image top, content below.
- **Content:** army name (`--text-lg` bold), faction (`--text-sm` muted), points in monospace accent, battle size badge.
- **Actions:** primary small button + delete icon.
- **Footer:** last updated timestamp (`--text-xs`).
- **Empty:** placeholder image + CTA.
- **Web:** Radix `Card` + `AspectRatio`.
- **Mobile:** Tamagui `Card` with `Stack` layouts.

#### Unit Card (List Item)
- **Layout:** thumbnail 48×48, name + keywords, model count, points (monospace).
- **Click:** navigates to detail.
- **Delete:** icon button (hover reveal on desktop).
- **Disabled:** 50% opacity, red border tint, reason text below.

#### Unit Tile (Add Unit Modal)
- **Left:** image 64×64.
- **Center:** name, “×2 in army” badge, enhancements, min/max points.
- **Right:** Add icon button (accent).
- **Disabled:** grayed out, reason text shown.

#### Match Card (List Item)
- **Badge:** top-right status (won/lost/draw/active/planned).
- **Content:** match name, date, participants (avatar stack).
- **Score:** “85 — 60” in large monospace.
- **Armies:** faction icons + names.

#### Campaign Card (List Item)
- **Background:** splash image with dim overlay.
- **Content:** name, date range, status badge.
- **Meta:** participant count, organizer tag.
- **Completed:** winner display.

**Responsive:** cards stack on mobile; grid on desktop (2–3 columns).

### 9.4 Forms and Inputs

#### Text Input
- **Background:** `--bg-base`.
- **Border:** 1px `--border-default`.
- **Height:** 40px.
- **Padding:** 0 12px.
- **Focus:** accent border + glow.
- **Error:** danger border + message below.
- **Label:** above input, uppercase, tracking-wider.

#### Select / Dropdown
- **Style:** same as text input.
- **Menu:** `--bg-elevated` with `--border-default`.
- **Option hover:** `--bg-hover`.
- **Selected:** check icon + accent text.

#### Number Input
- **Font:** monospace.
- **Stepper:** +/− buttons on right (32px wide).
- **Use:** points, model count, VP, CP.

#### Search Input
- **Icons:** left search icon, right clear button.
- **Placeholder:** `--text-tertiary`.

#### Toggle / Switch
- **Off:** `--bg-surface`, border `--border-default`.
- **On:** `--accent-primary` track.
- **Thumb:** `--text-inverse`.

#### Checkbox
- **Box:** 16×16, radius `--radius-sm`.
- **Check:** `--accent-primary`.
- **Label:** `--text-sm`.

#### Radio Group
- **Dot:** `--accent-primary` when selected.
- **Spacing:** 12px between options.

**Responsive:** inputs full width on mobile; label above always.

### 9.5 Data Display

#### Stat Block (Unit Stats)
- **Layout:** horizontal strip: M | T | SV | W | LD | OC.
- **Each stat:** label above (2xs, uppercase, muted), value below (lg, monospace bold).
- **Background:** `--bg-surface` with inner vertical dividers (`--border-subtle`).
- **Invulnerable Save:** small badge adjacent to SV.
- **Compact:** single row, smaller type (`--text-sm` values) for list views.
- **Mobile:** allow horizontal scroll if constrained.

#### Weapon Profile Table
- **Columns:** Name | Range | A | BS/WS | S | AP | D | Keywords.
- **Header:** uppercase, `--text-xs`, muted.
- **Values:** monospace, `--text-sm`.
- **Keywords:** inline chips, radius `--radius-sm`.
- **Sections:** Ranged then Melee, separated by divider.
- **Mobile:** stacked card per weapon or horizontal scroll.

#### Points Display
- **Format:** `500 / 2,000 pts`.
- **Current:** accent primary, monospace.
- **Total:** `--text-secondary`.
- **Over limit:** current turns danger.

#### HP Bar
- **Base:** 100% width, height 8px, radius `--radius-full`.
- **Colors:** green >66%, amber 33–66%, red <33%, black (destroyed).
- **Per-model:** row of squares 10×10, gap 4px.
- **Compact:** 4px height.

#### Phase Indicator
- **Layout:** stepper with icons + labels.
- **Current:** accent primary with glow.
- **Past:** muted.
- **Future:** dimmed.
- **Mobile:** icons only, current label below.

#### VP/CP Counter
- **VP:** large monospace number (32px).
- **CP:** smaller (20px).
- **Controls:** +/− buttons, 32×32.
- **History:** `--text-xs` line (“+2 VP from Primary”).
- **Sync:** small status icon.

#### Round/Turn Tracker
- **Text:** “Round 3 of 5 — Your Turn”.
- **Progress:** 5 segments or dots, current highlighted.
- **Turn:** color-coded text (accent for user, secondary for opponent).

### 9.6 Overlays and Surfaces

#### Modal / Dialog (Desktop)
- **Width:** 540px (sm), 640px (md), 720px (lg).
- **Background:** `--bg-elevated`.
- **Border:** `--border-default`.
- **Radius:** `--radius-xl`.
- **Backdrop:** oklch(0 0 0 / 60%).
- **Header:** title + close icon.
- **Footer:** actions right-aligned.
- **Animation:** fade + scale.

#### Takeover Screen (Mobile)
- **Full screen**, no backdrop.
- **Header:** back + title + action.
- **Content:** scrollable.
- **Animation:** slide from right (or bottom for sheets).

#### Bottom Sheet (Mobile)
- **Max height:** 90vh.
- **Background:** `--bg-elevated`.
- **Handle:** 32×4 pill.
- **Snap points:** 40%, 70%, 90%.

#### Drawer (Responsive, Mobile-First)
- **Slides from:** right.
- **Width:** 100% (mobile) → 50% at ≥768px → 40% at ≥1024px.
- **Max-width:** 560px (prevents excess width on ultrawide screens).
- **Background:** `--bg-elevated`.
- **Border-left:** `--border-default`.
- **Close:** X button + click outside (backdrop overlay).
- **Breakpoints:** Tailwind-standard (sm: 640px, md: 768px, lg: 1024px, xl: 1280px).

#### Rules Side-Rail (Match Pages)
- **Width:** 48px collapsed, 300px expanded (overlay).
- **Position:** fixed right edge of match layout, always visible on desktop.
- **Tab buttons:** 40×110px, vertical icon + rotated label, highlight dot for discoverability.
- **Overlay panel:** slides from right, overlays detail panel, does not displace content.
- **Tablet/Mobile:** collapses; rules accessible via Command Post or bottom sheet.

#### Popover
- **Max width:** 320px.
- **Background:** `--bg-elevated`.
- **Border:** `--border-default`.
- **Radius:** `--radius-lg`.

#### Toast / Notification
- **Placement:** bottom-right (desktop), top-center (mobile).
- **Border-left:** 3px semantic color.
- **Auto-dismiss:** 4s.
- **Stack:** max 3.

### 9.7 Lists and Collections

#### Virtual Scroll List
- **Use:** long lists (units, matches).
- **Skeletons:** 3–5 placeholders on initial load.
- **Pagination:** infinite scroll or “Load More”.
- **Empty:** illustration + CTA.

#### Section Header (Army Page)
- **Label:** uppercase, accent primary, tracking wider.
- **Count:** badge “(3 units)”.
- **Add button:** icon button right-aligned.
- **Mobile:** sticky header, collapsible list.

#### Filter Bar
- **Layout:** horizontal scroll of chips.
- **Active:** filled accent background.
- **Inactive:** outline/ghost.
- **Clear:** ghost button at end.
- **Sort:** dropdown right-aligned.

#### Empty State
- **Centered:** illustration + headline + subtext + CTA.
- **Headline:** `--text-lg` bold.
- **Subtext:** `--text-sm` muted.

### 9.8 Skeleton Loaders

- **Match layout:** skeleton mirrors target component.
- **Background:** `--bg-surface`.
- **Shimmer:** blue-tinted gradient, 1.5s sweep.
- **Types:** card, list item, stat block, full page.

### 9.9 Status Indicators

#### Badge
- **Shape:** pill, radius full.
- **Variants:** success, danger, warning, info, neutral, active (pulse).
- **Compact:** dot-only 8px.

#### Sync Indicator
- **States:** synced (green dot), syncing (amber pulse), disconnected (red), offline (gray).
- **Tooltip:** last sync time.

#### Validation Message
- **Placement:** inline below field.
- **Icon:** warning triangle/error circle.
- **Colors:** danger or warning.
- **Summary:** top of army page, collapsible list.

### 9.10 Navigation Patterns

#### Tab Bar (Within Page)
- **Active:** accent underline (2px) + accent text.
- **Inactive:** muted.
- **Use:** match modes, campaign sections.

#### Segmented Control
- **Container:** `--bg-base` recessed.
- **Active segment:** `--bg-surface` raised.
- **Radius:** full pill.
- **Use:** mode toggles.

#### Stepper / Wizard
- **Steps:** numbered circles + connecting lines.
- **Current:** filled accent.
- **Completed:** accent + check icon.
- **Future:** muted outline.

---

## 10. Responsive Behavior Rules

| Pattern | Mobile (<768px) | Desktop (≥768px) |
| --- | --- | --- |
| Navigation | Bottom tab bar | Left sidebar |
| Modal | Full takeover screen | Centered modal |
| Drawer | Bottom sheet | Right-side drawer |
| Army list | Vertical tiles | Grid with splash images |
| Unit list | Compact horizontal cards | Table/wide cards |
| Stat block | Horizontal scroll if needed | Full display |
| Weapon table | Stacked cards | Full table |
| Filters | Bottom sheet | Inline horizontal bar |
| Add unit modal | Takeover screen | Side drawer/modal |

---

## 11. Platform Adaptation Notes

- **Web (Radix/Tailwind):** all components map to Radix primitives with CSS variables.
- **Mobile (Tamagui):** Tamagui tokens map 1:1 to design tokens.
- **Shared:** spacing, type scale, radii, and color tokens are consistent across platforms.
- **Platform-specific:** web uses hover + cursor; mobile uses press + haptics where available.

---

## 12. Component State Matrix (Global)

Every component supports the following states (as applicable):

- **Default:** base styling per component.
- **Hover (web) / Press (mobile):** `--bg-hover` or accent tint.
- **Active/Selected:** `--bg-active` + `--border-accent` where relevant.
- **Focused:** 2px accent outline with 2px offset.
- **Disabled:** 50% opacity + `--text-tertiary` + no interaction.
- **Loading:** spinner or skeleton; layout width fixed.
- **Error:** `--status-danger` border + inline message.
- **Empty:** placeholder content + CTA.

---

## 13. Tactical Aesthetic Notes

- Favor grids, dividers, and clear data grouping over decorative elements.
- Use accent glow only for active/critical elements.
- Avoid soft, overly rounded silhouettes.
- Use images sparingly, always with a dark overlay for text readability.

---

## 14. Component Implementation Mapping (Quick Reference)

**Web (Radix)**
- Buttons → `Button`
- Inputs → `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `Switch`
- Navigation → `NavigationMenu`, `Tabs`, `Breadcrumb`
- Overlays → `Dialog`, `Drawer`, `Popover`, `Tooltip`, `Toast`
- Data Display → `Table`, `Badge`, `Progress`

**Mobile (Tamagui)**
- Buttons → `Button`, `ButtonIcon`
- Inputs → `Input`, `Select`, `Checkbox`, `RadioGroup`, `Switch`
- Navigation → `Tabs`, custom stacks
- Overlays → `Sheet`, `Dialog`, `Popover`
- Data Display → `Progress`, `Card`, `Badge`

---

## 15. Critical Domain Layouts

### Stat Block Layout (Detailed)
- **Container:** width 100%, height 64px, `--bg-surface`, radius `--radius-lg`.
- **Grid:** 6 equal columns, 1px inner dividers.
- **Label:** `--text-2xs` uppercase, `--text-tertiary`, top padding 8px.
- **Value:** `--text-lg` monospace bold, center aligned.
- **Spacing:** 8px vertical between label/value.

### Weapon Table Layout (Detailed)
- **Header row height:** 32px.
- **Row height:** 40px.
- **Cell padding:** 8px 12px.
- **Keywords:** chips 20px height, radius `--radius-sm`, 6px horizontal padding.
- **Mobile fallback:** card per weapon with two-column grid.

---

**End of Style Guide**
