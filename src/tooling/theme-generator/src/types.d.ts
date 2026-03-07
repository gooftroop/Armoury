/**
 * Theme generator type definitions.
 *
 * Shared contract between system token source files and the theme generator.
 * Systems define their tokens as a `SystemTokens` object; the generator reads
 * those definitions and produces CSS custom properties and Tamagui theme partials.
 *
 * @requirements
 * - REQ-TYPES-001: Define the shape of color mode token sets (light / dark).
 * - REQ-TYPES-002: Define the top-level SystemTokens contract used by all systems.
 *
 * @module theme-generator/types
 */

/**
 * A single color-mode token set.
 *
 * Each key maps a semantic token name to an oklch color value string.
 * The `shadowGlow` token is a full CSS shadow value (not just a color).
 */
export interface ColorModeTokens {
    /** Allow string indexing for generator iteration. */
    readonly [key: string]: string;
    /** Primary accent color. */
    readonly primary: string;
    /** Primary accent hover state. */
    readonly primaryHover: string;
    /** Primary accent at reduced opacity for muted backgrounds. */
    readonly primaryMuted: string;
    /** Foreground color on primary backgrounds. */
    readonly primaryForeground: string;

    /** Secondary highlight color. */
    readonly highlight: string;
    /** Highlight hover state. */
    readonly highlightHover: string;
    /** Highlight at reduced opacity for muted backgrounds. */
    readonly highlightMuted: string;
    /** Foreground color on highlight backgrounds. */
    readonly highlightForeground: string;

    /** Page or surface background color. */
    readonly background: string;

    /** Focus ring color. */
    readonly ring: string;
    /** Box-shadow glow value (full CSS shadow, not just a color). */
    readonly shadowGlow: string;
}

/**
 * Complete system token definition.
 *
 * Each game system provides one of these objects as its single source of
 * truth for theming. The generator consumes it to produce platform outputs.
 */
export interface SystemTokens {
    /** Unique system identifier (e.g. "wh40k10e"). */
    readonly id: string;
    /** Light mode color tokens. */
    readonly light: ColorModeTokens;
    /** Dark mode color tokens. */
    readonly dark: ColorModeTokens;
}
