/**
 * @armoury/theme-generator
 *
 * Generates platform-specific theme outputs from system token definitions.
 * Produces CSS custom properties (web), Tamagui theme partials (mobile),
 * and React Native color token objects from a single TypeScript token source.
 *
 * @requirements
 * - REQ-PKG-001: Export generator functions for CSS, Tamagui, and React Native StyleSheet.
 * - REQ-PKG-002: Re-export types for consumer token files.
 *
 * @module theme-generator
 */

export { generateCSS } from './css.js';
export { generateStyleSheet } from './stylesheet.js';
export { generateTamagui } from './tamagui.js';
