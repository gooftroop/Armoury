#!/usr/bin/env node

/**
 * Theme generation CLI.
 *
 * Discovers all system token files under `src/systems/` and generates
 * CSS, Tamagui, and React Native StyleSheet theme outputs in each
 * system's `src/public/` directory.
 *
 * Usage:
 *   node src/tooling/theme-generator/src/generate.js
 *
 * Or via package.json script:
 *   npm run generate:theme
 *
 * @requirements
 * - REQ-CLI-001: Discover system token files automatically.
 * - REQ-CLI-002: Generate css/theme.css from tokens.
 * - REQ-CLI-003: Generate theme.tamagui.ts from tokens.
 * - REQ-CLI-004: Report what was generated to stdout.
 * - REQ-CLI-005: Generate theme.stylesheet.ts from tokens.
 *
 * @module theme-generator/generate
 */

import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateCSS } from './css.js';
import { generateStyleSheet } from './stylesheet.js';
import { generateTamagui } from './tamagui.js';
/**
 * Root of the monorepo, resolved relative to this script's location.
 * Works regardless of process.cwd() (Turbo sets cwd to the workspace).
 */
const scriptDir = dirname(fileURLToPath(import.meta.url));
const monorepoRoot = resolve(scriptDir, '..', '..', '..', '..');
const systemsRoot = resolve(monorepoRoot, 'src/systems');
/**
 * Discovers and processes all system token files, generating theme outputs.
 */
async function main() {
    if (!existsSync(systemsRoot)) {
        console.warn(`[theme-generator] Systems directory not found: ${systemsRoot}`);
        process.exit(1);
    }

    const systemDirs = readdirSync(systemsRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules')
        .map((entry) => entry.name);

    let generated = 0;

    for (const systemId of systemDirs) {
        const tokensPath = resolve(systemsRoot, systemId, 'src/public/tokens.ts');

        if (!existsSync(tokensPath)) {
            console.log(`[theme-generator] Skipping ${systemId} — no tokens.ts in src/public/`);
            continue;
        }

        console.log(`[theme-generator] Processing ${systemId}...`);

        const tokensModule = await import(tokensPath);

        /** Find the exported SystemTokens object (first export ending with 'Tokens'). */
        const tokensKey = Object.keys(tokensModule).find((key) => key.endsWith('Tokens'));

        if (!tokensKey) {
            console.warn(`[theme-generator] No *Tokens export found in ${tokensPath}`);
            continue;
        }

        const tokens = tokensModule[tokensKey];

        /** Generate CSS */
        const cssDir = resolve(systemsRoot, systemId, 'src/public/css');
        mkdirSync(cssDir, { recursive: true });

        const cssOutput = generateCSS(tokens);
        const cssPath = resolve(cssDir, 'theme.css');
        writeFileSync(cssPath, cssOutput, 'utf-8');
        console.log(`[theme-generator]   → ${cssPath}`);

        /** Generate Tamagui */
        const publicDir = resolve(systemsRoot, systemId, 'src/public');
        const tamaguiOutput = generateTamagui(tokens);
        const tamaguiPath = resolve(publicDir, 'theme.tamagui.ts');
        writeFileSync(tamaguiPath, tamaguiOutput, 'utf-8');
        console.log(`[theme-generator]   → ${tamaguiPath}`);

        /** Generate React Native StyleSheet */
        const stylesheetOutput = generateStyleSheet(tokens);
        const stylesheetPath = resolve(publicDir, 'theme.stylesheet.ts');
        writeFileSync(stylesheetPath, stylesheetOutput, 'utf-8');
        console.log(`[theme-generator]   → ${stylesheetPath}`);

        generated++;
    }

    console.log(`[theme-generator] Done. ${generated} system(s) processed.`);
}

main().catch((error) => {
    console.error('[theme-generator] Fatal error:', error);
    process.exit(1);
});
