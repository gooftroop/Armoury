# Armoury Design Tokens — Source of Truth

**Scope:** Web (Tailwind CSS v4 + Radix UI) and Mobile (Tamagui v2).  
**Theme:** Light and dark modes per theme. Default theme provides the base app look; game-system themes (e.g. wh40k10e) override a subset of tokens. Dark mode is applied via the `.dark` class on `<html>`.  
**Authority:** If a value is defined here, it is authoritative and must match platform implementations.

This document extracts the exact token values from the UI Style Guide into a canonical, machine-parseable format.

**Related Documents:**
- `STYLE_GUIDE.md` (visual language, component catalog)
- `ART_DIRECTION.md` (faction archetype color usage in imagery)

---

## 1. Token Architecture

Armoury uses a **three-tier token system** to keep raw values stable and semantics consistent across platforms.

1. **Primitive tokens** — raw, unopinionated values (oklch colors, px sizes, ms durations).  
2. **Semantic tokens** — named by purpose (e.g. `--bg-base`, `--text-primary`, `--accent-primary`).  
3. **Component tokens** — optional component scopes (e.g. `--button-bg`, `--card-border`) derived from semantic tokens.

**Rules:**
- Only semantic tokens are used directly in UI code.  
- Component tokens are derived — they must never introduce new values.  
- Platform implementations map to semantic tokens 1:1.

---

## 2. Color Tokens (oklch)

**Notes:**
- Values below define the **default dark theme**. Light theme values and system theme overrides are defined in CSS theme files (see `src/web/app/themes/`).
- All values use **oklch** color space.
- Hex values are **approximate** for quick visual reference.

### 2.1 Backgrounds

| Token | oklch Value | Hex Approx | Usage |
| --- | --- | --- | --- |
| `--bg-base` | oklch(0.19 0.005 260) | ~#262730 | Main app background |
| `--bg-surface` | oklch(0.23 0.006 260) | ~#31323c | Cards, panels |
| `--bg-elevated` | oklch(0.27 0.007 260) | ~#3c3d48 | Modals, popovers |
| `--bg-hover` | oklch(0.26 0.007 260) | ~#393a44 | Interactive hover |
| `--bg-active` | oklch(0.29 0.008 260) | ~#41424e | Active/selected |

### 2.2 Text

| Token | oklch Value | Hex Approx | Usage |
| --- | --- | --- | --- |
| `--text-primary` | oklch(0.94 0.01 260) | ~#eceff4 | Primary content |
| `--text-secondary` | oklch(0.72 0.01 260) | ~#b0b5bf | Secondary, labels |
| `--text-tertiary` | oklch(0.55 0.01 260) | ~#808690 | Disabled, placeholder |
| `--text-inverse` | oklch(0.15 0.01 260) | ~#1d2028 | Dark text on light bg |

### 2.3 Accents

**Palette:** Cold Steel Blue primary, Warm Amber secondary, Tarnished Copper highlight, Pale Silver tertiary.

**Visual Weight Hierarchy** (heaviest → lightest on dark backgrounds):
1. Amber Gold (secondary) — warmest, highest perceived luminance, draws eye first
2. Tarnished Copper (highlight) — warm but earthier, medium-high visual weight
3. Steel Blue (primary) — cool hue suppresses perceived weight, structural/interactive
4. Pale Silver (tertiary) — near-achromatic, recedes, informational

| Token | oklch Value | Hex Approx | Usage |
| --- | --- | --- | --- |
| `--accent-primary` | oklch(0.72 0.12 235) | ~#6a8fc4 | CTAs, buttons, active states, nav highlights |
| `--accent-primary-hover` | oklch(0.78 0.13 235) | ~#7fa4d8 | Hover state |
| `--accent-primary-muted` | oklch(0.72 0.12 235 / 18%) | ~#6a8fc42e | Tinted backgrounds |
| `--accent-secondary` | oklch(0.75 0.12 70) | ~#c8a050 | Points, data emphasis, costs, friend codes |
| `--accent-secondary-hover` | oklch(0.80 0.13 70) | ~#d8b462 | Hover state |
| `--accent-secondary-muted` | oklch(0.75 0.12 70 / 18%) | ~#c8a0502e | Tinted backgrounds |
| `--accent-highlight` | oklch(0.68 0.11 40) | ~#c07252 | Ability names, enhancement titles, keyword chips, rules |
| `--accent-highlight-hover` | oklch(0.74 0.12 40) | ~#d08060 | Hover state |
| `--accent-highlight-muted` | oklch(0.68 0.11 40 / 18%) | ~#c072522e | Tinted backgrounds |
| `--accent-tertiary` | oklch(0.75 0.03 250) | ~#b0b5c0 | Section labels, breadcrumbs, metadata headers |
| `--accent-tertiary-hover` | oklch(0.80 0.04 250) | ~#c0c5d0 | Hover state |
| `--accent-tertiary-muted` | oklch(0.75 0.03 250 / 18%) | ~#b0b5c02e | Tinted backgrounds |

### 2.4 Semantic / Status

| Token | oklch Value | Hex Approx | Usage |
| --- | --- | --- | --- |
| `--status-success` | oklch(0.65 0.15 145) | ~#3daa5e | Won, valid, added |
| `--status-warning` | oklch(0.75 0.15 65) | ~#d49a3a | Approaching limits |
| `--status-danger` | oklch(0.62 0.20 25) | ~#cc5040 | Delete, critical HP, errors |
| `--status-info` | oklch(0.67 0.10 240) | ~#6590c0 | Informational |
| `--status-active` | oklch(0.78 0.18 145) | ~#55d777 | Live/active pulse |
| `--status-planned` | oklch(0.58 0.08 235) | ~#56739c | Future/planned |

### 2.5 Borders & Dividers

| Token | oklch Value | Hex Approx | Usage |
| --- | --- | --- | --- |
| `--border-subtle` | oklch(1 0 0 / 10%) | ~#ffffff1a | Faint dividers |
| `--border-default` | oklch(1 0 0 / 14%) | ~#ffffff24 | Standard borders |
| `--border-strong` | oklch(1 0 0 / 22%) | ~#ffffff38 | Emphasized borders |
| `--border-accent` | oklch(0.72 0.12 235 / 45%) | ~#6a8fc473 | Accent highlights |

### 2.6 Faction Archetype Colors (Plugin Defaults)

Plugins map their factions to these archetypes (non-copyrighted). Each archetype provides **primary**, **secondary**, and **muted**.

| Archetype | Primary (oklch) | Hex Approx | Secondary (oklch) | Hex Approx | Muted (oklch) | Hex Approx |
| --- | --- | --- | --- | --- | --- | --- |
| **Iron Legion** | oklch(0.62 0.12 250) | ~#6b86c8 | oklch(0.52 0.08 250) | ~#516aa4 | oklch(0.32 0.02 250) | ~#2b313f |
| **Sunforged** | oklch(0.78 0.16 75) | ~#e1b24f | oklch(0.68 0.12 65) | ~#c9973f | oklch(0.35 0.04 70) | ~#3a2f1e |
| **Verdant Order** | oklch(0.65 0.15 145) | ~#3daa5e | oklch(0.55 0.10 145) | ~#3f8b57 | oklch(0.30 0.03 145) | ~#28352d |
| **Voidborn** | oklch(0.58 0.08 280) | ~#7b6aa6 | oklch(0.48 0.06 280) | ~#5f5489 | oklch(0.28 0.02 280) | ~#29253a |
| **Crimson Pact** | oklch(0.60 0.20 25) | ~#c44a3a | oklch(0.50 0.16 25) | ~#9e3b2f | oklch(0.30 0.04 25) | ~#3a2522 |
| **Storm Guard** | oklch(0.64 0.12 230) | ~#5d86c3 | oklch(0.54 0.10 230) | ~#4a6fa4 | oklch(0.30 0.03 230) | ~#2b323f |
| **Ashen Dominion** | oklch(0.56 0.06 60) | ~#9a8a66 | oklch(0.46 0.05 60) | ~#7a6d54 | oklch(0.26 0.02 60) | ~#352e22 |
| **Frost Warden** | oklch(0.70 0.08 220) | ~#7da0c8 | oklch(0.58 0.06 220) | ~#5d7fa6 | oklch(0.32 0.02 220) | ~#2c3643 |
| **Ember Cult** | oklch(0.70 0.18 40) | ~#d06a3e | oklch(0.60 0.14 40) | ~#b45734 | oklch(0.32 0.03 40) | ~#3a2a23 |
| **Obsidian Coil** | oklch(0.52 0.02 260) | ~#5e6570 | oklch(0.40 0.02 260) | ~#474d58 | oklch(0.23 0.01 260) | ~#22272e |

---

## 3. Typography Tokens

### 3.1 Font Families

| Token | Value | CSS Property |
| --- | --- | --- |
| `--font-display` | "Libre Franklin", system-ui, sans-serif | font-family |
| `--font-body` | "Libre Franklin", system-ui, sans-serif | font-family |
| `--font-mono` | "JetBrains Mono", "Fira Code", monospace | font-family |

### 3.2 Type Scale (Major Third — 1.250)

| Token | Size | Weight | Line Height | Usage |
| --- | --- | --- | --- | --- |
| `--text-4xl` | 36px | 700 | 1.1 | Page titles |
| `--text-3xl` | 28px | 700 | 1.2 | Section headers |
| `--text-2xl` | 24px | 600 | 1.2 | Card titles, modal headers |
| `--text-xl` | 20px | 600 | 1.3 | Sub-section headers |
| `--text-lg` | 18px | 500 | 1.4 | Large body text |
| `--text-base` | 16px | 400 | 1.5 | Body text |
| `--text-sm` | 14px | 400 | 1.5 | Secondary text, labels |
| `--text-xs` | 12px | 500 | 1.4 | Captions, badges |
| `--text-2xs` | 10px | 500 | 1.3 | Micro text |

### 3.3 Font Weight Tokens

| Token | Value | CSS Property |
| --- | --- | --- |
| `--weight-regular` | 400 | font-weight |
| `--weight-medium` | 500 | font-weight |
| `--weight-semibold` | 600 | font-weight |
| `--weight-bold` | 700 | font-weight |

### 3.4 Line Height Tokens

| Token | Value | CSS Property |
| --- | --- | --- |
| `--leading-compact` | 1.1 | line-height |
| `--leading-tight` | 1.2 | line-height |
| `--leading-snug` | 1.3 | line-height |
| `--leading-normal` | 1.4 | line-height |
| `--leading-relaxed` | 1.5 | line-height |

### 3.5 Letter Spacing Tokens

| Token | Value | CSS Property |
| --- | --- | --- |
| `--tracking-tight` | -0.01em | letter-spacing |
| `--tracking-normal` | 0em | letter-spacing |
| `--tracking-wide` | 0.04em | letter-spacing |
| `--tracking-wider` | 0.08em | letter-spacing |

---

## 4. Spacing Tokens (4px Base)

| Token | Value |
| --- | --- |
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-7` | 28px |
| `--space-8` | 32px |
| `--space-9` | 36px |
| `--space-10` | 40px |
| `--space-11` | 44px |
| `--space-12` | 48px |
| `--space-13` | 52px |
| `--space-14` | 56px |
| `--space-15` | 60px |
| `--space-16` | 64px |

---

## 5. Border Radius Tokens

| Token | Value | Usage |
| --- | --- | --- |
| `--radius-sm` | 4px | Badges, chips |
| `--radius-md` | 6px | Buttons, inputs |
| `--radius-lg` | 8px | Cards, panels |
| `--radius-xl` | 12px | Modals, large cards |
| `--radius-full` | 9999px | Avatars, circular elements |

---

## 6. Shadow / Elevation Tokens (Dark Theme)

Elevation is achieved by **surface lightening** and **border glow**, not drop shadows.

| Token | Value | Usage |
| --- | --- | --- |
| `--shadow-none` | none | Flat surfaces |
| `--shadow-border-subtle` | 0 0 0 1px oklch(1 0 0 / 10%) | Faint separation |
| `--shadow-border-default` | 0 0 0 1px oklch(1 0 0 / 14%) | Standard separation |
| `--shadow-border-strong` | 0 0 0 1px oklch(1 0 0 / 22%) | Emphasized edges |
| `--shadow-accent-glow` | 0 0 12px oklch(0.72 0.12 235 / 15%) | Focus/active glow |

---

## 7. Motion Tokens

### 7.1 Easing Curves

| Token | Value | Usage |
| --- | --- | --- |
| `--ease-default` | cubic-bezier(0.4, 0, 0.2, 1) | Standard transitions |
| `--ease-in` | cubic-bezier(0.4, 0, 1, 1) | Entering |
| `--ease-out` | cubic-bezier(0, 0, 0.2, 1) | Exiting |
| `--ease-bounce` | cubic-bezier(0.34, 1.56, 0.64, 1) | Rare, playful moments |

### 7.2 Durations

| Token | Value | Usage |
| --- | --- | --- |
| `--duration-instant` | 100ms | Hover/opacity |
| `--duration-fast` | 150ms | Button press, input focus |
| `--duration-normal` | 250ms | Panel transitions |
| `--duration-slow` | 350ms | Modal open |
| `--duration-slower` | 500ms | Complex/loading |

---

## 8. Z-Index Scale

| Token | Value | Usage |
| --- | --- | --- |
| `--z-base` | 0 | Default content |
| `--z-dropdown` | 50 | Dropdown menus |
| `--z-sticky` | 100 | Sticky headers, nav |
| `--z-drawer` | 200 | Side drawers |
| `--z-modal` | 300 | Modals, dialogs |
| `--z-popover` | 400 | Popovers, tooltips |
| `--z-toast` | 500 | Toast notifications |
| `--z-max` | 999 | Emergency overlays |

---

## 9. Platform Mapping Tables (Semantic → Platform)

All semantic tokens map 1:1 to platform implementations. For web, Tailwind v4 registers tokens as CSS custom properties via `@theme`. Tamagui tokens are custom theme keys in `tamagui.config.ts`.

### 9.1 Color Mapping

| Semantic Token | Tailwind CSS Variable | Tamagui Token |
| --- | --- | --- |
| `--bg-base` | `--background` | `$background` |
| `--bg-surface` | `--card` | `$backgroundHover` |
| `--bg-elevated` | `--popover` | `$backgroundFocus` |
| `--bg-hover` | `--muted` | `$backgroundPress` |
| `--bg-active` | `--accent` | `$backgroundStrong` |
| `--text-primary` | `--foreground` | `$color` |
| `--text-secondary` | `--muted-foreground` | `$colorMuted` |
| `--text-tertiary` | `--border` | `$colorSubtle` |
| `--text-inverse` | `--primary-foreground` | `$colorInverse` |
| `--accent-primary` | `--primary` | `$accentColor` |
| `--accent-primary-hover` | `--primary-foreground` (hover) | `$accentColorHover` |
| `--accent-primary-muted` | `--primary` (with alpha) | `$accentColorMuted` |
| `--accent-secondary` | `--secondary` | `$accentColorSecondary` |
| `--accent-secondary-hover` | `--secondary-foreground` (hover) | `$accentColorSecondaryHover` |
| `--accent-highlight` | `--highlight` | `$accentColorHighlight` |
| `--accent-highlight-hover` | `--highlight-foreground` (hover) | `$accentColorHighlightHover` |
| `--accent-highlight-muted` | `--highlight` (with alpha) | `$accentColorHighlightMuted` |
| `--accent-tertiary` | `--tertiary` | `$accentColorTertiary` |
| `--accent-tertiary-hover` | `--tertiary-foreground` (hover) | `$accentColorTertiaryHover` |
| `--accent-tertiary-muted` | `--tertiary` (with alpha) | `$accentColorTertiaryMuted` |
| `--status-success` | `--success` | `$success` |
| `--status-warning` | `--warning` | `$warning` |
| `--status-danger` | `--destructive` | `$red10` |
| `--status-info` | `--info` | `$info` |
| `--status-active` | `--active` | `$active` |
| `--status-planned` | `--planned` | `$planned` |
| `--border-subtle` | `--border-subtle` | `$borderColorSubtle` |
| `--border-default` | `--border` | `$borderColor` |
| `--border-strong` | `--border-strong` | `$borderColorStrong` |
| `--border-accent` | `--ring` | `$borderColorFocus` |
| `--faction-iron-legion-primary` | `--faction-iron-legion-primary` | `$factionIronLegionPrimary` |
| `--faction-iron-legion-secondary` | `--faction-iron-legion-secondary` | `$factionIronLegionSecondary` |
| `--faction-iron-legion-muted` | `--faction-iron-legion-muted` | `$factionIronLegionMuted` |
| `--faction-sunforged-primary` | `--faction-sunforged-primary` | `$factionSunforgedPrimary` |
| `--faction-sunforged-secondary` | `--faction-sunforged-secondary` | `$factionSunforgedSecondary` |
| `--faction-sunforged-muted` | `--faction-sunforged-muted` | `$factionSunforgedMuted` |
| `--faction-verdant-order-primary` | `--faction-verdant-order-primary` | `$factionVerdantOrderPrimary` |
| `--faction-verdant-order-secondary` | `--faction-verdant-order-secondary` | `$factionVerdantOrderSecondary` |
| `--faction-verdant-order-muted` | `--faction-verdant-order-muted` | `$factionVerdantOrderMuted` |
| `--faction-voidborn-primary` | `--faction-voidborn-primary` | `$factionVoidbornPrimary` |
| `--faction-voidborn-secondary` | `--faction-voidborn-secondary` | `$factionVoidbornSecondary` |
| `--faction-voidborn-muted` | `--faction-voidborn-muted` | `$factionVoidbornMuted` |
| `--faction-crimson-pact-primary` | `--faction-crimson-pact-primary` | `$factionCrimsonPactPrimary` |
| `--faction-crimson-pact-secondary` | `--faction-crimson-pact-secondary` | `$factionCrimsonPactSecondary` |
| `--faction-crimson-pact-muted` | `--faction-crimson-pact-muted` | `$factionCrimsonPactMuted` |
| `--faction-storm-guard-primary` | `--faction-storm-guard-primary` | `$factionStormGuardPrimary` |
| `--faction-storm-guard-secondary` | `--faction-storm-guard-secondary` | `$factionStormGuardSecondary` |
| `--faction-storm-guard-muted` | `--faction-storm-guard-muted` | `$factionStormGuardMuted` |
| `--faction-ashen-dominion-primary` | `--faction-ashen-dominion-primary` | `$factionAshenDominionPrimary` |
| `--faction-ashen-dominion-secondary` | `--faction-ashen-dominion-secondary` | `$factionAshenDominionSecondary` |
| `--faction-ashen-dominion-muted` | `--faction-ashen-dominion-muted` | `$factionAshenDominionMuted` |
| `--faction-frost-warden-primary` | `--faction-frost-warden-primary` | `$factionFrostWardenPrimary` |
| `--faction-frost-warden-secondary` | `--faction-frost-warden-secondary` | `$factionFrostWardenSecondary` |
| `--faction-frost-warden-muted` | `--faction-frost-warden-muted` | `$factionFrostWardenMuted` |
| `--faction-ember-cult-primary` | `--faction-ember-cult-primary` | `$factionEmberCultPrimary` |
| `--faction-ember-cult-secondary` | `--faction-ember-cult-secondary` | `$factionEmberCultSecondary` |
| `--faction-ember-cult-muted` | `--faction-ember-cult-muted` | `$factionEmberCultMuted` |
| `--faction-obsidian-coil-primary` | `--faction-obsidian-coil-primary` | `$factionObsidianCoilPrimary` |
| `--faction-obsidian-coil-secondary` | `--faction-obsidian-coil-secondary` | `$factionObsidianCoilSecondary` |
| `--faction-obsidian-coil-muted` | `--faction-obsidian-coil-muted` | `$factionObsidianCoilMuted` |

### 9.2 Typography Mapping

| Semantic Token | Tailwind CSS Variable / Theme Key | Tamagui Token |
| --- | --- | --- |
| `--font-display` | `--font-display` | `$heading` |
| `--font-body` | `--font-body` | `$body` |
| `--font-mono` | `--font-mono` | `$mono` |
| `--text-4xl` | `theme(fontSize.4xl)` | `$4xl` |
| `--text-3xl` | `theme(fontSize.3xl)` | `$3xl` |
| `--text-2xl` | `theme(fontSize.2xl)` | `$2xl` |
| `--text-xl` | `theme(fontSize.xl)` | `$xl` |
| `--text-lg` | `theme(fontSize.lg)` | `$lg` |
| `--text-base` | `theme(fontSize.base)` | `$md` |
| `--text-sm` | `theme(fontSize.sm)` | `$sm` |
| `--text-xs` | `theme(fontSize.xs)` | `$xs` |
| `--text-2xs` | `theme(fontSize.2xs)` | `$2xs` |
| `--weight-regular` | `theme(fontWeight.normal)` | `$4` |
| `--weight-medium` | `theme(fontWeight.medium)` | `$5` |
| `--weight-semibold` | `theme(fontWeight.semibold)` | `$6` |
| `--weight-bold` | `theme(fontWeight.bold)` | `$7` |
| `--leading-compact` | `theme(lineHeight.tight)` | `$1` |
| `--leading-tight` | `theme(lineHeight.snug)` | `$2` |
| `--leading-snug` | `theme(lineHeight.normal)` | `$3` |
| `--leading-normal` | `theme(lineHeight.relaxed)` | `$4` |
| `--leading-relaxed` | `theme(lineHeight.relaxed)` | `$5` |
| `--tracking-tight` | `theme(letterSpacing.tight)` | `$1` |
| `--tracking-normal` | `theme(letterSpacing.normal)` | `$2` |
| `--tracking-wide` | `theme(letterSpacing.wide)` | `$3` |
| `--tracking-wider` | `theme(letterSpacing.widest)` | `$4` |

### 9.3 Spacing Mapping

| Semantic Token | Tailwind CSS Variable / Theme Key | Tamagui Token |
| --- | --- | --- |
| `--space-1` | `theme(spacing.1)` | `$1` |
| `--space-2` | `theme(spacing.2)` | `$2` |
| `--space-3` | `theme(spacing.3)` | `$3` |
| `--space-4" | `theme(spacing.4)` | `$4` |
| `--space-5` | `theme(spacing.5)` | `$5` |
| `--space-6` | `theme(spacing.6)` | `$6` |
| `--space-7` | `theme(spacing.7)` | `$7` |
| `--space-8` | `theme(spacing.8)` | `$8` |
| `--space-9` | `theme(spacing.9)` | `$9` |
| `--space-10` | `theme(spacing.10)` | `$10` |
| `--space-11` | `theme(spacing.11)` | `$11` |
| `--space-12` | `theme(spacing.12)` | `$12` |
| `--space-13` | `theme(spacing.13)` | `$13` |
| `--space-14` | `theme(spacing.14)` | `$14` |
| `--space-15` | `theme(spacing.15)` | `$15` |
| `--space-16` | `theme(spacing.16)` | `$16` |

### 9.4 Radius Mapping

| Semantic Token | Tailwind CSS Variable / Theme Key | Tamagui Token |
| --- | --- | --- |
| `--radius-sm` | `theme(borderRadius.sm)` | `$2` |
| `--radius-md` | `theme(borderRadius.md)` | `$3` |
| `--radius-lg` | `theme(borderRadius.lg)` | `$4` |
| `--radius-xl` | `theme(borderRadius.xl)` | `$5` |
| `--radius-full` | `theme(borderRadius.full)` | `$10` |

### 9.5 Elevation / Shadow Mapping

| Semantic Token | Tailwind CSS Variable / Theme Key | Tamagui Token |
| --- | --- | --- |
| `--shadow-none` | `theme(boxShadow.none)` | `$0` |
| `--shadow-border-subtle` | `theme(boxShadow.subtle)` | `$1` |
| `--shadow-border-default` | `theme(boxShadow.default)` | `$2` |
| `--shadow-border-strong` | `theme(boxShadow.strong)` | `$3` |
| `--shadow-accent-glow` | `theme(boxShadow.glow)` | `$4` |

### 9.6 Motion Mapping

| Semantic Token | Tailwind CSS Variable / Theme Key | Tamagui Token |
| --- | --- | --- |
| `--ease-default` | `theme(transitionTimingFunction.DEFAULT)` | `$ease` |
| `--ease-in` | `theme(transitionTimingFunction.in)` | `$easeIn` |
| `--ease-out` | `theme(transitionTimingFunction.out)` | `$easeOut` |
| `--ease-bounce` | `theme(transitionTimingFunction.bounce)` | `$easeBounce` |
| `--duration-instant` | `theme(transitionDuration.100)` | `$1` |
| `--duration-fast` | `theme(transitionDuration.150)` | `$2` |
| `--duration-normal` | `theme(transitionDuration.250)` | `$3` |
| `--duration-slow` | `theme(transitionDuration.350)` | `$4` |
| `--duration-slower` | `theme(transitionDuration.500)` | `$5` |

### 9.7 Z-Index Mapping

| Semantic Token | Tailwind CSS Variable / Theme Key | Tamagui Token |
| --- | --- | --- |
| `--z-base` | `theme(zIndex.base)` | `$0` |
| `--z-dropdown` | `theme(zIndex.dropdown)` | `$1` |
| `--z-sticky` | `theme(zIndex.sticky)` | `$2` |
| `--z-drawer` | `theme(zIndex.drawer)` | `$3` |
| `--z-modal" | `theme(zIndex.modal)` | `$4` |
| `--z-popover` | `theme(zIndex.popover)` | `$5` |
| `--z-toast` | `theme(zIndex.toast)` | `$6` |
| `--z-max` | `theme(zIndex.max)` | `$7` |

---

## 10. Generation Strategy

**V1 (Manual):**
- Maintain theme CSS files for web (`src/web/app/themes/`) and `tamagui.config.ts` for mobile by hand.
- Default theme defines all tokens. System themes override only the tokens they need.
- All values must match this document exactly.
- Dark mode uses `@custom-variant dark (&:where(.dark, .dark *))` in Tailwind v4.
- System themes use `[data-system="<id>"]` attribute on `<html>`.

**V2 (Build-Step):**
- Create a single `tokens.json` file from this doc.
- Add a generator script in `src/tooling/` that:
  1. Reads `tokens.json`.
  2. Emits theme CSS files with `@theme` declarations and `@layer theme` overrides.
  3. Emits `tamagui.config.ts` with matching theme tokens.
  4. Optionally emits a `tokens.d.ts` for type-safe access.
- CI validates that generated outputs are up to date (no drift).

---

## 11. Appendix A — Tokens JSON (Canonical)

```json
{
  "color": {
    "background": {
      "base": { "value": "oklch(0.19 0.005 260)", "type": "color" },
      "surface": { "value": "oklch(0.23 0.006 260)", "type": "color" },
      "elevated": { "value": "oklch(0.27 0.007 260)", "type": "color" },
      "hover": { "value": "oklch(0.26 0.007 260)", "type": "color" },
      "active": { "value": "oklch(0.29 0.008 260)", "type": "color" }
    },
    "text": {
      "primary": { "value": "oklch(0.94 0.01 260)", "type": "color" },
      "secondary": { "value": "oklch(0.72 0.01 260)", "type": "color" },
      "tertiary": { "value": "oklch(0.55 0.01 260)", "type": "color" },
      "inverse": { "value": "oklch(0.15 0.01 260)", "type": "color" }
    },
    "accent": {
      "primary": { "value": "oklch(0.72 0.12 235)", "type": "color" },
      "primaryHover": { "value": "oklch(0.78 0.13 235)", "type": "color" },
      "primaryMuted": { "value": "oklch(0.72 0.12 235 / 18%)", "type": "color" },
      "secondary": { "value": "oklch(0.75 0.12 70)", "type": "color" },
      "secondaryHover": { "value": "oklch(0.80 0.13 70)", "type": "color" },
      "secondaryMuted": { "value": "oklch(0.75 0.12 70 / 18%)", "type": "color" },
      "highlight": { "value": "oklch(0.68 0.11 40)", "type": "color" },
      "highlightHover": { "value": "oklch(0.74 0.12 40)", "type": "color" },
      "highlightMuted": { "value": "oklch(0.68 0.11 40 / 18%)", "type": "color" },
      "tertiary": { "value": "oklch(0.75 0.03 250)", "type": "color" },
      "tertiaryHover": { "value": "oklch(0.80 0.04 250)", "type": "color" },
      "tertiaryMuted": { "value": "oklch(0.75 0.03 250 / 18%)", "type": "color" }
    },
    "status": {
      "success": { "value": "oklch(0.65 0.15 145)", "type": "color" },
      "warning": { "value": "oklch(0.75 0.15 65)", "type": "color" },
      "danger": { "value": "oklch(0.62 0.20 25)", "type": "color" },
      "info": { "value": "oklch(0.67 0.10 240)", "type": "color" },
      "active": { "value": "oklch(0.78 0.18 145)", "type": "color" },
      "planned": { "value": "oklch(0.58 0.08 235)", "type": "color" }
    },
    "border": {
      "subtle": { "value": "oklch(1 0 0 / 10%)", "type": "color" },
      "default": { "value": "oklch(1 0 0 / 14%)", "type": "color" },
      "strong": { "value": "oklch(1 0 0 / 22%)", "type": "color" },
      "accent": { "value": "oklch(0.72 0.12 235 / 45%)", "type": "color" }
    },
    "faction": {
      "ironLegion": {
        "primary": { "value": "oklch(0.62 0.12 250)", "type": "color" },
        "secondary": { "value": "oklch(0.52 0.08 250)", "type": "color" },
        "muted": { "value": "oklch(0.32 0.02 250)", "type": "color" }
      },
      "sunforged": {
        "primary": { "value": "oklch(0.78 0.16 75)", "type": "color" },
        "secondary": { "value": "oklch(0.68 0.12 65)", "type": "color" },
        "muted": { "value": "oklch(0.35 0.04 70)", "type": "color" }
      },
      "verdantOrder": {
        "primary": { "value": "oklch(0.65 0.15 145)", "type": "color" },
        "secondary": { "value": "oklch(0.55 0.10 145)", "type": "color" },
        "muted": { "value": "oklch(0.30 0.03 145)", "type": "color" }
      },
      "voidborn": {
        "primary": { "value": "oklch(0.58 0.08 280)", "type": "color" },
        "secondary": { "value": "oklch(0.48 0.06 280)", "type": "color" },
        "muted": { "value": "oklch(0.28 0.02 280)", "type": "color" }
      },
      "crimsonPact": {
        "primary": { "value": "oklch(0.60 0.20 25)", "type": "color" },
        "secondary": { "value": "oklch(0.50 0.16 25)", "type": "color" },
        "muted": { "value": "oklch(0.30 0.04 25)", "type": "color" }
      },
      "stormGuard": {
        "primary": { "value": "oklch(0.64 0.12 230)", "type": "color" },
        "secondary": { "value": "oklch(0.54 0.10 230)", "type": "color" },
        "muted": { "value": "oklch(0.30 0.03 230)", "type": "color" }
      },
      "ashenDominion": {
        "primary": { "value": "oklch(0.50 0.06 60)", "type": "color" },
        "secondary": { "value": "oklch(0.42 0.05 60)", "type": "color" },
        "muted": { "value": "oklch(0.28 0.02 60)", "type": "color" }
      },
      "frostWarden": {
        "primary": { "value": "oklch(0.70 0.08 220)", "type": "color" },
        "secondary": { "value": "oklch(0.58 0.06 220)", "type": "color" },
        "muted": { "value": "oklch(0.32 0.02 220)", "type": "color" }
      },
      "emberCult": {
        "primary": { "value": "oklch(0.70 0.18 40)", "type": "color" },
        "secondary": { "value": "oklch(0.60 0.14 40)", "type": "color" },
        "muted": { "value": "oklch(0.32 0.03 40)", "type": "color" }
      },
      "obsidianCoil": {
        "primary": { "value": "oklch(0.45 0.02 260)", "type": "color" },
        "secondary": { "value": "oklch(0.35 0.02 260)", "type": "color" },
        "muted": { "value": "oklch(0.25 0.01 260)", "type": "color" }
      }
    }
  },
  "typography": {
    "fontFamily": {
      "display": { "value": "\"Libre Franklin\", system-ui, sans-serif", "type": "fontFamily" },
      "body": { "value": "\"Libre Franklin\", system-ui, sans-serif", "type": "fontFamily" },
      "mono": { "value": "\"JetBrains Mono\", \"Fira Code\", monospace", "type": "fontFamily" }
    },
    "fontSize": {
      "4xl": { "value": "36px", "type": "fontSize" },
      "3xl": { "value": "28px", "type": "fontSize" },
      "2xl": { "value": "24px", "type": "fontSize" },
      "xl": { "value": "20px", "type": "fontSize" },
      "lg": { "value": "18px", "type": "fontSize" },
      "base": { "value": "16px", "type": "fontSize" },
      "sm": { "value": "14px", "type": "fontSize" },
      "xs": { "value": "12px", "type": "fontSize" },
      "2xs": { "value": "10px", "type": "fontSize" }
    },
    "fontWeight": {
      "regular": { "value": 400, "type": "fontWeight" },
      "medium": { "value": 500, "type": "fontWeight" },
      "semibold": { "value": 600, "type": "fontWeight" },
      "bold": { "value": 700, "type": "fontWeight" }
    },
    "lineHeight": {
      "compact": { "value": 1.1, "type": "lineHeight" },
      "tight": { "value": 1.2, "type": "lineHeight" },
      "snug": { "value": 1.3, "type": "lineHeight" },
      "normal": { "value": 1.4, "type": "lineHeight" },
      "relaxed": { "value": 1.5, "type": "lineHeight" }
    },
    "letterSpacing": {
      "tight": { "value": "-0.01em", "type": "letterSpacing" },
      "normal": { "value": "0em", "type": "letterSpacing" },
      "wide": { "value": "0.04em", "type": "letterSpacing" },
      "wider": { "value": "0.08em", "type": "letterSpacing" }
    }
  },
  "spacing": {
    "1": { "value": "4px", "type": "spacing" },
    "2": { "value": "8px", "type": "spacing" },
    "3": { "value": "12px", "type": "spacing" },
    "4": { "value": "16px", "type": "spacing" },
    "5": { "value": "20px", "type": "spacing" },
    "6": { "value": "24px", "type": "spacing" },
    "7": { "value": "28px", "type": "spacing" },
    "8": { "value": "32px", "type": "spacing" },
    "9": { "value": "36px", "type": "spacing" },
    "10": { "value": "40px", "type": "spacing" },
    "11": { "value": "44px", "type": "spacing" },
    "12": { "value": "48px", "type": "spacing" },
    "13": { "value": "52px", "type": "spacing" },
    "14": { "value": "56px", "type": "spacing" },
    "15": { "value": "60px", "type": "spacing" },
    "16": { "value": "64px", "type": "spacing" }
  },
  "borderRadius": {
    "sm": { "value": "4px", "type": "borderRadius" },
    "md": { "value": "6px", "type": "borderRadius" },
    "lg": { "value": "8px", "type": "borderRadius" },
    "xl": { "value": "12px", "type": "borderRadius" },
    "full": { "value": "9999px", "type": "borderRadius" }
  },
  "elevation": {
    "none": { "value": "none", "type": "shadow" },
    "borderSubtle": { "value": "0 0 0 1px oklch(1 0 0 / 8%)", "type": "shadow" },
    "borderDefault": { "value": "0 0 0 1px oklch(1 0 0 / 12%)", "type": "shadow" },
    "borderStrong": { "value": "0 0 0 1px oklch(1 0 0 / 20%)", "type": "shadow" },
    "accentGlow": { "value": "0 0 12px oklch(0.72 0.12 235 / 15%)", "type": "shadow" }
  },
  "motion": {
    "easing": {
      "default": { "value": "cubic-bezier(0.4, 0, 0.2, 1)", "type": "easing" },
      "in": { "value": "cubic-bezier(0.4, 0, 1, 1)", "type": "easing" },
      "out": { "value": "cubic-bezier(0, 0, 0.2, 1)", "type": "easing" },
      "bounce": { "value": "cubic-bezier(0.34, 1.56, 0.64, 1)", "type": "easing" }
    },
    "duration": {
      "instant": { "value": "100ms", "type": "duration" },
      "fast": { "value": "150ms", "type": "duration" },
      "normal": { "value": "250ms", "type": "duration" },
      "slow": { "value": "350ms", "type": "duration" },
      "slower": { "value": "500ms", "type": "duration" }
    }
  },
  "zIndex": {
    "base": { "value": 0, "type": "zIndex" },
    "dropdown": { "value": 50, "type": "zIndex" },
    "sticky": { "value": 100, "type": "zIndex" },
    "drawer": { "value": 200, "type": "zIndex" },
    "modal": { "value": 300, "type": "zIndex" },
    "popover": { "value": 400, "type": "zIndex" },
    "toast": { "value": 500, "type": "zIndex" },
    "max": { "value": 999, "type": "zIndex" }
  }
}
```

---

## 12. Appendix B — JSON Schema (Tokens)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://armoury.app/schema/design-tokens.json",
  "title": "Armoury Design Tokens",
  "type": "object",
  "required": [
    "color",
    "typography",
    "spacing",
    "borderRadius",
    "elevation",
    "motion",
    "zIndex"
  ],
  "properties": {
    "color": {
      "type": "object",
      "required": ["background", "text", "accent", "status", "border", "faction"],
      "properties": {
        "background": { "$ref": "#/$defs/tokenGroup" },
        "text": { "$ref": "#/$defs/tokenGroup" },
        "accent": { "$ref": "#/$defs/tokenGroup" },
        "status": { "$ref": "#/$defs/tokenGroup" },
        "border": { "$ref": "#/$defs/tokenGroup" },
        "faction": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "required": ["primary", "secondary", "muted"],
            "properties": {
              "primary": { "$ref": "#/$defs/token" },
              "secondary": { "$ref": "#/$defs/token" },
              "muted": { "$ref": "#/$defs/token" }
            }
          }
        }
      }
    },
    "typography": {
      "type": "object",
      "required": ["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing"],
      "properties": {
        "fontFamily": { "$ref": "#/$defs/tokenGroup" },
        "fontSize": { "$ref": "#/$defs/tokenGroup" },
        "fontWeight": { "$ref": "#/$defs/tokenGroup" },
        "lineHeight": { "$ref": "#/$defs/tokenGroup" },
        "letterSpacing": { "$ref": "#/$defs/tokenGroup" }
      }
    },
    "spacing": { "$ref": "#/$defs/tokenGroup" },
    "borderRadius": { "$ref": "#/$defs/tokenGroup" },
    "elevation": { "$ref": "#/$defs/tokenGroup" },
    "motion": {
      "type": "object",
      "required": ["easing", "duration"],
      "properties": {
        "easing": { "$ref": "#/$defs/tokenGroup" },
        "duration": { "$ref": "#/$defs/tokenGroup" }
      }
    },
    "zIndex": { "$ref": "#/$defs/tokenGroup" }
  },
  "$defs": {
    "token": {
      "type": "object",
      "required": ["value", "type"],
      "properties": {
        "value": {},
        "type": { "type": "string" }
      },
      "additionalProperties": false
    },
    "tokenGroup": {
      "type": "object",
      "additionalProperties": { "$ref": "#/$defs/token" }
    }
  }
}
```

---

**End of Design Tokens**
