/**
 * Custom esbuild configuration for @armoury/feature-game-system.
 *
 * Builds three platform-specific bundles from two entry points:
 *   - dist/browser/ — Web (browser-targeted ESM from src/index.ts)
 *   - dist/node/    — Web (node-targeted ESM from src/index.ts)
 *   - dist/mobile/  — React Native (neutral ESM from src/index.mobile.ts)
 *
 * The mobile bundle uses platform 'neutral' since React Native has its own
 * module resolution and doesn't align with esbuild's 'browser' or 'node' platforms.
 *
 * @module @armoury/feature-game-system/build
 *
 * @requirements
 * 1. Must build browser and node bundles from the web entry point (src/index.ts).
 * 2. Must build a mobile bundle from the mobile entry point (src/index.mobile.ts).
 * 3. Must externalize all dependencies (no bundling of node_modules).
 * 4. Must generate source maps for all builds.
 */

import * as esbuild from 'esbuild';
import { resolve } from 'node:path';
import { baseOptions, getBrowserTargets } from '@armoury/esbuild/base';

const cwd = process.cwd();

const webBase = baseOptions(['src/index.ts'], cwd);
const mobileBase = baseOptions(['src/index.mobile.ts'], cwd);
const browserTargets = getBrowserTargets();

await Promise.all([
    esbuild.build({
        ...webBase,
        outdir: resolve(cwd, 'dist/browser'),
        platform: 'browser',
        target: browserTargets,
    }),
    esbuild.build({
        ...webBase,
        outdir: resolve(cwd, 'dist/node'),
        platform: 'node',
        target: ['node22'],
    }),
    esbuild.build({
        ...mobileBase,
        outdir: resolve(cwd, 'dist/mobile'),
        platform: 'neutral',
        target: ['es2022'],
    }),
]);
