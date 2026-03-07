/**
 * Copy system public assets into the consumer workspace.
 *
 * Discovers all game system manifests under `src/systems/` and copies each
 * system's `src/public/` folder into `<workspace>/public/systems/<systemId>/`.
 *
 * Usage (from a workspace like web or mobile):
 *   node --input-type=module -e "import '../../tooling/scripts/copy-systems.js'"
 *
 * Or via package.json script:
 *   "copy:systems": "node ../../tooling/scripts/copy-systems.js"
 *
 * The script auto-detects the calling workspace directory from `process.cwd()`.
 *
 * @module copy-systems
 */

import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Root of the monorepo, two levels above tooling/scripts/.
 * When invoked from a workspace via npm script, cwd is the workspace root.
 */
const workspaceDir = process.cwd();
const monorepoRoot = resolve(workspaceDir, '../..');
const systemsRoot = resolve(monorepoRoot, 'src/systems');
const destRoot = resolve(workspaceDir, 'public/systems');

/**
 * Discovers system directories that contain a `src/public/manifest.json` and
 * copies each system's public folder to `public/systems/<systemId>/`.
 */
function copySystemAssets() {
    if (!existsSync(systemsRoot)) {
        console.warn(`[copy-systems] Systems directory not found: ${systemsRoot}`);
        return;
    }

    const systemDirs = readdirSync(systemsRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules')
        .map((entry) => entry.name);

    let copied = 0;

    for (const systemId of systemDirs) {
        const publicDir = resolve(systemsRoot, systemId, 'src/public');
        const manifestPath = resolve(publicDir, 'manifest.json');

        if (!existsSync(manifestPath)) {
            console.log(`[copy-systems] Skipping ${systemId} — no manifest.json in ${publicDir}`);
            continue;
        }

        const dest = resolve(destRoot, systemId);
        mkdirSync(dest, { recursive: true });
        cpSync(publicDir, dest, { recursive: true, force: true });
        copied++;
        console.log(`[copy-systems] Copied ${systemId} → ${dest}`);
    }

    console.log(`[copy-systems] Done. ${copied} system(s) copied to ${destRoot}`);
}

copySystemAssets();
