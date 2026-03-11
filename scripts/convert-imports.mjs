#!/usr/bin/env node

/**
 * Convert relative imports to @/ aliased imports across all workspaces.
 *
 * Rules:
 * - Relative imports (./foo.ts, ../bar.ts) that resolve to a path inside
 *   the workspace's src/ directory are converted to @/... with .js extension.
 * - Files inside e2e/, __fixtures__/, __testing__/ are skipped entirely.
 * - Imports that resolve to paths OUTSIDE the workspace's src/ directory
 *   (e.g., mobile/app/_layout.tsx importing ../tamagui.config.ts) stay relative.
 * - .ts/.tsx extensions become .js on aliased imports.
 * - .json imports stay as-is (relative).
 *
 * Usage: node scripts/convert-imports.mjs [--dry-run]
 */

import fs from 'fs';
import path from 'path';

const DRY_RUN = process.argv.includes('--dry-run');
const ROOT = process.cwd();

// All workspace roots (relative to repo root) that have tsconfig.json with @/* alias
const WORKSPACES = [
    'src/mobile',
    'src/services/authorizer',
    'src/services/campaigns',
    'src/services/friends',
    'src/services/matches',
    'src/services/users',
    'src/shared/adapters/dsql',
    'src/shared/adapters/pglite',
    'src/shared/adapters/sqlite',
    'src/shared/clients/campaigns',
    'src/shared/clients/friends',
    'src/shared/clients/github',
    'src/shared/clients/matches',
    'src/shared/clients/users',
    'src/shared/clients/wahapedia',
    'src/shared/data/context',
    'src/shared/data/dao',
    'src/shared/models',
    'src/shared/providers/bsdata',
    'src/shared/streams',
    'src/shared/validation',
    'src/systems/wh40k10e',
    'src/tooling/theme-generator',
    'src/ui',
    'src/web',
];

// Directories whose FILES are excluded from conversion (their imports stay relative)
const EXCLUDED_DIRS = ['e2e', '__fixtures__', '__testing__'];

// Import regex: matches `from './...'` or `from "../..."` style imports
// Captures: (1) everything before the path, (2) the quote char, (3) the relative path
const IMPORT_RE = /^(\s*(?:import|export)\s+(?:type\s+)?(?:\{[^}]*\}|[^;'"]*)\s+from\s+)(['"])(\.\.?\/[^'"]+)\2/gm;

// Also handle re-exports: export { ... } from './...'
// and side-effect imports: import './...'
const SIDE_EFFECT_RE = /^(\s*import\s+)(['"])(\.\.?\/[^'"]+)\2/gm;

let totalConverted = 0;
let totalSkipped = 0;
let totalFiles = 0;
let errors = [];

/**
 * Find all .ts/.tsx files in a directory, recursively.
 */
function findTsFiles(dir) {
    const results = [];
    if (!fs.existsSync(dir)) return results;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === 'dist') continue;
            // Skip excluded directories
            if (EXCLUDED_DIRS.includes(entry.name)) continue;
            results.push(...findTsFiles(fullPath));
        } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
            results.push(fullPath);
        }
    }
    return results;
}

/**
 * Convert a single relative import path to @/ alias if it resolves inside src/.
 *
 * @param {string} filePath - Absolute path to the source file
 * @param {string} relativePath - The relative import path (e.g., '../models/Foo.ts')
 * @param {string} workspaceRoot - Absolute path to the workspace root
 * @returns {string|null} The aliased path, or null if conversion is not possible
 */
function convertImport(filePath, relativePath, workspaceRoot) {
    const fileDir = path.dirname(filePath);
    const srcDir = path.join(workspaceRoot, 'src');

    // Resolve the full path of the import target
    const resolved = path.resolve(fileDir, relativePath);

    // Check if resolved path is inside workspace's src/ directory
    const relativeToSrc = path.relative(srcDir, resolved);

    if (relativeToSrc.startsWith('..') || path.isAbsolute(relativeToSrc)) {
        // Import target is outside src/ — keep relative
        return null;
    }

    // Convert extension: .ts/.tsx -> .js, .json stays (but we won't alias .json)
    let aliasedPath = relativeToSrc;

    if (aliasedPath.endsWith('.ts') || aliasedPath.endsWith('.tsx')) {
        aliasedPath = aliasedPath.replace(/\.tsx?$/, '.js');
    } else if (aliasedPath.endsWith('.json')) {
        // JSON imports can't use .js extension — keep relative
        return null;
    }

    // Normalize path separators for Windows
    aliasedPath = aliasedPath.split(path.sep).join('/');

    return `@/${aliasedPath}`;
}

/**
 * Process a single file: find and convert all eligible relative imports.
 * Handles both single-line and multi-line import/export statements.
 */
function processFile(filePath, workspaceRoot) {
    const content = fs.readFileSync(filePath, 'utf-8');
    let fileConversions = 0;
    let fileSkips = 0;

    // Full-content regex to match `from './...'` or `from '../...'`
    // This works for both single-line and multi-line imports because
    // the `from` clause is always on the line with the path string.
    // We just replace the path portion, preserving everything else.
    const FROM_RE = /(\bfrom\s+)(['"])(\.\.?\/[^'"]+)\2/g;

    const modified = content.replace(FROM_RE, (match, prefix, quote, relPath) => {
        const aliased = convertImport(filePath, relPath, workspaceRoot);

        if (aliased) {
            fileConversions++;
            return `${prefix}${quote}${aliased}${quote}`;
        } else {
            fileSkips++;
            return match;
        }
    });

    if (fileConversions > 0) {
        if (!DRY_RUN) {
            fs.writeFileSync(filePath, modified, 'utf-8');
        }
        const rel = path.relative(ROOT, filePath);
        console.log(`  ✓ ${rel} (${fileConversions} converted, ${fileSkips} kept relative)`);
    }

    totalConverted += fileConversions;
    totalSkipped += fileSkips;
    if (fileConversions > 0) totalFiles++;
}

// Main
console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Converting relative imports to @/ aliases...\n`);

for (const ws of WORKSPACES) {
    const workspaceRoot = path.join(ROOT, ws);

    if (!fs.existsSync(workspaceRoot)) {
        console.log(`⚠ Workspace not found: ${ws}`);
        continue;
    }

    console.log(`\n📦 ${ws}`);

    // Find all .ts/.tsx files in the workspace (including outside src/ like app/, middleware.ts)
    const files = findTsFiles(workspaceRoot);

    for (const file of files) {
        try {
            processFile(file, workspaceRoot);
        } catch (err) {
            errors.push({ file: path.relative(ROOT, file), error: err.message });
            console.error(`  ✗ ${path.relative(ROOT, file)}: ${err.message}`);
        }
    }
}

console.log(`\n${'─'.repeat(60)}`);
console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Done.`);
console.log(`  Files modified: ${totalFiles}`);
console.log(`  Imports converted: ${totalConverted}`);
console.log(`  Imports kept relative: ${totalSkipped} (outside src/ or .json)`);

if (errors.length > 0) {
    console.log(`  Errors: ${errors.length}`);
    for (const e of errors) {
        console.log(`    ${e.file}: ${e.error}`);
    }
}
