/**
 * Server-side game system manifest discovery.
 *
 * Reads the `public/systems/` directory at request time to discover available game systems.
 * Each system must have a `manifest.json` file conforming to the GameSystemManifest schema.
 * This module is server-only — it uses Node.js `fs` APIs and must not be imported by client components.
 *
 * @requirements
 * 1. Must discover all game system manifests in public/systems/[id]/manifest.json.
 * 2. Must validate that each manifest has at minimum an `id` and `splashText` field.
 * 3. Must skip directories that lack a valid manifest.json (no throw).
 * 4. Must return manifests sorted alphabetically by ID for stable ordering.
 * 5. Must cache results for the lifetime of a single server request (no disk caching across requests).
 *
 * @module discoverSystems
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { GameSystemManifest } from '@armoury/data';

/**
 * Absolute path to the `public/systems/` directory.
 * Resolved from `process.cwd()` which in Next.js is the workspace root (src/web).
 */
const SYSTEMS_DIR = join(process.cwd(), 'public', 'systems');

/**
 * Validates that a parsed JSON object has the minimum required fields for a GameSystemManifest.
 *
 * @param value - The parsed JSON value to validate.
 * @returns True if the value satisfies the minimum manifest shape.
 */
function isValidManifest(value: unknown): value is GameSystemManifest {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const record = value as Record<string, unknown>;

    return typeof record['id'] === 'string' && typeof record['splashText'] === 'string';
}

/**
 * Discovers all game system manifests available in `public/systems/`.
 *
 * Scans the directory for subdirectories containing a `manifest.json` file,
 * parses and validates each manifest, and returns them sorted by ID.
 * Silently skips directories without a valid manifest.
 *
 * @returns An array of validated GameSystemManifest objects, sorted by ID.
 */
export async function discoverSystemManifests(): Promise<GameSystemManifest[]> {
    let entries: string[];

    try {
        const dirEntries = await readdir(SYSTEMS_DIR, { withFileTypes: true });
        entries = dirEntries.filter((e) => e.isDirectory()).map((e) => e.name);
    } catch {
        /** If the systems directory doesn't exist, return empty — no systems available. */
        return [];
    }

    const manifests: GameSystemManifest[] = [];

    const results = await Promise.allSettled(
        entries.map(async (dirName) => {
            const manifestPath = join(SYSTEMS_DIR, dirName, 'manifest.json');
            const raw = await readFile(manifestPath, 'utf-8');
            const parsed: unknown = JSON.parse(raw);

            if (isValidManifest(parsed)) {
                return parsed;
            }

            return null;
        }),
    );

    for (const result of results) {
        if (result.status === 'fulfilled' && result.value !== null) {
            manifests.push(result.value);
        }
    }

    return manifests.sort((a, b) => a.id.localeCompare(b.id));
}
