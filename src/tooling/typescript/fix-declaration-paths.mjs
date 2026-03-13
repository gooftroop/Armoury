#!/usr/bin/env node

/**
 * Rewrites `@/` path aliases in emitted `.d.ts` files to relative paths.
 *
 * TypeScript preserves path aliases verbatim in declaration output. When a
 * consuming package reads these `.d.ts` files, `@/` resolves to the consumer's
 * own source root — not the producer's — breaking the type chain. This script
 * runs after `tsc` to fix the paths in-place.
 *
 * Usage: node fix-declaration-paths.mjs [distDir]
 *   distDir defaults to `./dist` relative to cwd.
 *
 * @module fix-declaration-paths
 *
 * @requirements
 * 1. Must rewrite `@/` path aliases in emitted `.d.ts` files to relative paths.
 * 2. Must compute correct relative prefix based on file depth within dist/.
 * 3. Must handle files at dist root (prefix becomes `./`) and nested dirs (prefix becomes `../` chains).
 * 4. Must only modify files that contain `@/` imports.
 * 5. Must preserve all other content unchanged.
 * 6. Must work with both `from '@/...'` and `import('@/...')` patterns.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';

const distDir = resolve(process.cwd(), process.argv[2] || 'dist');

/**
 * Computes the relative prefix to replace `@/` for a given .d.ts file.
 * Files at dist root get `./`, files in subdirs get appropriate `../` chains.
 */
function computeRelativePrefix(filePath) {
    const relFromDist = relative(distDir, dirname(filePath));

    if (relFromDist === '') {
        return './';
    }

    const depth = relFromDist.split('/').length;
    return '../'.repeat(depth);
}

async function main() {
    const entries = await readdir(distDir, { recursive: true });
    const dtsFiles = entries
        .filter((entry) => entry.endsWith('.d.ts'))
        .map((entry) => join(distDir, entry));

    let modifiedCount = 0;

    for (const filePath of dtsFiles) {
        const content = await readFile(filePath, 'utf-8');

        if (!content.includes("'@/") && !content.includes('"@/')) {
            continue;
        }

        const prefix = computeRelativePrefix(filePath);

        // Replace @/ in import specifiers (from '...', import('...'))
        const updated = content
            .replace(/(from\s+['"])@\//g, `$1${prefix}`)
            .replace(/(import\s*\(\s*['"])@\//g, `$1${prefix}`);

        if (updated !== content) {
            await writeFile(filePath, updated, 'utf-8');
            modifiedCount++;
        }
    }

    if (modifiedCount > 0) {
        console.log(`fix-declaration-paths: rewrote @/ aliases in ${modifiedCount} .d.ts files`);
    }
}

main().catch((err) => {
    console.error('fix-declaration-paths failed:', err);
    process.exit(1);
});
