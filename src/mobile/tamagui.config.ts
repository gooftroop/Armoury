import { defaultConfig } from '@tamagui/config/v4';
import { createTamagui } from 'tamagui';

/**
 * System theme partials imported from generated Tamagui theme files.
 * These are produced by @armoury/theme-generator and copied to public/ by copy-systems.
 */
import { wh40k10eLight, wh40k10eDark } from '@mobile/public/systems/wh40k10e/theme.tamagui.js';
const light = {
    background: '#f4f5f7',
    backgroundHover: '#e6e8eb',
    backgroundPress: '#edeef1',
    backgroundFocus: '#e6e8eb',

    color: '#17181b',
    colorHover: '#17181b',
    colorPress: '#17181b',
    colorFocus: '#17181b',

    borderColor: '#0000001f',
    borderColorHover: '#00000033',
    borderColorPress: '#00000033',
    borderColorFocus: '#0073b266',

    shadowColor: '#0000001f',
    shadowColorHover: '#00000033',
    shadowColorPress: '#00000033',
    shadowColorFocus: '#0073b266',

    placeholderColor: '#52555b',

    card: '#ffffff',
    cardForeground: '#17181b',
    popover: '#ffffff',
    popoverForeground: '#17181b',
    muted: '#edeef1',
    mutedForeground: '#52555b',
    accent: '#e6e8eb',
    accentForeground: '#17181b',

    primary: '#0073b2',
    primaryHover: '#0061a3',
    primaryMuted: '#0073b21f',
    primaryForeground: '#f6f9fc',

    secondary: '#9a5600',
    secondaryHover: '#8a4200',
    secondaryMuted: '#9a56001f',
    secondaryForeground: '#f6f9fc',

    highlight: '#a63c0c',
    highlightHover: '#962200',
    highlightMuted: '#a63c0c1f',
    highlightForeground: '#f6f9fc',

    tertiary: '#4d6074',
    tertiaryHover: '#384f68',
    tertiaryMuted: '#4d60741f',
    tertiaryForeground: '#f6f9fc',

    success: '#097f23',
    warning: '#b86000',
    destructive: '#c90019',
    destructiveForeground: '#fcf7f8',
    info: '#0070a6',
    statusActive: '#008b1d',
    planned: '#005d84',

    borderSubtle: '#00000014',
    borderStrong: '#00000033',
    input: '#00000024',
    ring: '#0073b266',
} as const;

const dark = {
    background: '#121416',
    backgroundHover: '#292b2f',
    backgroundPress: '#222427',
    backgroundFocus: '#292b2f',

    color: '#e7ebf2',
    colorHover: '#e7ebf2',
    colorPress: '#e7ebf2',
    colorFocus: '#e7ebf2',

    borderColor: '#ffffff24',
    borderColorHover: '#ffffff38',
    borderColorPress: '#ffffff38',
    borderColorFocus: '#4cb0e573',

    shadowColor: '#ffffff24',
    shadowColorHover: '#ffffff38',
    shadowColorPress: '#ffffff38',
    shadowColorFocus: '#4cb0e573',

    placeholderColor: '#a1a5ab',

    card: '#1b1d20',
    cardForeground: '#e7ebf2',
    popover: '#24272a',
    popoverForeground: '#e7ebf2',
    muted: '#222427',
    mutedForeground: '#a1a5ab',
    accent: '#292b2f',
    accentForeground: '#e7ebf2',

    primary: '#4cb0e5',
    primaryHover: '#55c4fe',
    primaryMuted: '#4cb0e52e',
    primaryForeground: '#090b0f',

    secondary: '#dea052',
    secondaryHover: '#f3ae58',
    secondaryMuted: '#dea0522e',
    secondaryForeground: '#090b0f',

    highlight: '#d28063',
    highlightHover: '#eb9070',
    highlightMuted: '#d280632e',
    highlightForeground: '#090b0f',

    tertiary: '#a0b0c1',
    tertiaryHover: '#abc0d7',
    tertiaryMuted: '#a0b0c12e',
    tertiaryForeground: '#090b0f',

    success: '#4aa651',
    warning: '#ee9733',
    destructive: '#e64343',
    destructiveForeground: '#e7ebf2',
    info: '#579dcd',
    statusActive: '#61d46a',
    planned: '#4782a3',

    borderSubtle: '#ffffff1a',
    borderStrong: '#ffffff38',
    input: '#ffffff26',
    ring: '#4cb0e573',
} as const;

/**
 * Wh40k10e light sub-theme — overlays system-specific tokens onto the base light theme.
 * Used when the active game system is wh40k10e and the device is in light mode.
 */
const light_wh40k10e = {
    ...light,
    ...wh40k10eLight,
} as const;

/**
 * Wh40k10e dark sub-theme — overlays system-specific tokens onto the base dark theme.
 * Used when the active game system is wh40k10e and the device is in dark mode.
 */
const dark_wh40k10e = {
    ...dark,
    ...wh40k10eDark,
} as const;

const config = createTamagui({
    ...defaultConfig,
    themes: {
        ...defaultConfig.themes,
        light,
        dark,
        light_wh40k10e,
        dark_wh40k10e,
    },
});

export default config;

export type AppConfig = typeof config;

declare module 'tamagui' {
    interface TamaguiCustomConfig extends AppConfig {}
}
