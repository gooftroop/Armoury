/**
 * Game system manifest discovery for the mobile app.
 *
 * Since Expo/React Native cannot read the filesystem at runtime (unlike Node.js
 * on the server), manifests are statically imported from the bundled assets.
 * The `copy:systems` script copies manifest files into `public/systems/` at build
 * time, and this module registers them as static imports for the metro bundler.
 *
 * To add a new game system, add its manifest import to the `manifests` array below
 * and run `npm run copy:systems` to ensure the manifest file is available.
 *
 * @requirements
 * 1. Must export all available game system manifests as a typed array.
 * 2. Must return manifests sorted alphabetically by ID for stable ordering.
 * 3. Must use static imports (not filesystem reads) for Expo compatibility.
 *
 * @module discover-systems
 */

import type { GameSystemManifest } from '@armoury/data-dao/types';

/**
 * Statically imported manifest for wh40k10e.
 *
 * Metro bundles JSON files as modules, so this resolves at build time.
 * The path is relative to the mobile workspace root (`src/mobile/`).
 */
import wh40k10eManifest from '../../public/systems/wh40k10e/manifest.json';

/**
 * All discovered game system manifests, sorted alphabetically by ID.
 *
 * Add new system manifest imports above and include them in this array
 * when new game system plugins are added to the monorepo.
 */
export const systemManifests: GameSystemManifest[] = [wh40k10eManifest as GameSystemManifest].sort((a, b) =>
    a.id.localeCompare(b.id),
);
