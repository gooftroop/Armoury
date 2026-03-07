/**
 * Warhammer 40,000 10th Edition — Design Token Source
 *
 * Single source of truth for wh40k10e system theme tokens.
 * The theme generator reads this file to produce both CSS custom properties
 * (for web) and Tamagui theme partials (for mobile).
 *
 * All color values use the oklch color space.
 *
 * @requirements
 * - REQ-THEME-001: Define all system color tokens in oklch format.
 * - REQ-THEME-002: Support light and dark mode variants.
 * - REQ-THEME-003: Provide typed token definitions consumable by the theme generator.
 *
 * @module wh40k10e/tokens
 */

import type { SystemTokens } from '@armoury/theme-generator';

/**
 * Warhammer 40K 10th Edition system theme tokens.
 *
 * Shifts the default accent palette to an Imperial parchment gold / crimson feel.
 * Only overrides tokens that differ from the default theme (sparse overlay).
 */
export const wh40k10eTokens: SystemTokens = {
    id: 'wh40k10e',
    light: {
        primary: 'oklch(0.48 0.1 55)',
        primaryHover: 'oklch(0.42 0.11 55)',
        primaryMuted: 'oklch(0.48 0.1 55 / 12%)',
        primaryForeground: 'oklch(0.98 0.005 55)',

        highlight: 'oklch(0.46 0.18 25)',
        highlightHover: 'oklch(0.4 0.19 25)',
        highlightMuted: 'oklch(0.46 0.18 25 / 12%)',
        highlightForeground: 'oklch(0.98 0.005 25)',

        background: 'oklch(0.96 0.006 60)',

        ring: 'oklch(0.48 0.1 55 / 40%)',
        shadowGlow: '0 0 0 3px oklch(0.48 0.1 55 / 20%)',
    },
    dark: {
        primary: 'oklch(0.72 0.1 55)',
        primaryHover: 'oklch(0.78 0.11 55)',
        primaryMuted: 'oklch(0.72 0.1 55 / 18%)',
        primaryForeground: 'oklch(0.15 0.01 55)',

        highlight: 'oklch(0.62 0.2 25)',
        highlightHover: 'oklch(0.68 0.21 25)',
        highlightMuted: 'oklch(0.62 0.2 25 / 18%)',
        highlightForeground: 'oklch(0.15 0.01 25)',

        background: 'oklch(0.18 0.008 50)',

        ring: 'oklch(0.72 0.1 55 / 40%)',
        shadowGlow: '0 0 12px oklch(0.72 0.1 55 / 15%)',
    },
};
