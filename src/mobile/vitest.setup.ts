/**
 * @requirements
 * - PD2: Mobile vitest infrastructure for test isolation (PR #45)
 *
 * Module-level side effects (global mocks, polyfills) that run before every test file.
 * Expo/RN mocks are handled via vitest.config.ts resolve.alias (see __mocks__/).
 * Expand this file only when a new module needs Node-level patching.
 */

// Expo/RN mocks are already wired via vitest.config.ts resolve.alias.

declare module '#/public/systems/wh40k10e/theme.tamagui.js' {
    export const wh40k10eLight: Record<string, string>;
    export const wh40k10eDark: Record<string, string>;
}
