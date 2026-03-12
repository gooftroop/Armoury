#!/usr/bin/env node

/**
 * Converts all relative imports with .ts/.tsx extensions to .js/.jsx extensions.
 * Usage: node scripts/fix-import-extensions.mjs [--dry-run]
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const SRC_DIR = new URL('../src/', import.meta.url).pathname;
const DRY_RUN = process.argv.includes('--dry-run');

// Matches: import/export ... from './path.ts' or './path.tsx'
// Also handles: export { ... } from './path.ts'
// Also handles: import type { ... } from './path.ts'
const IMPORT_RE = /((?:import|export)\s+(?:type\s+)?(?:\{[^}]*\}|[^;'"]*)\s+from\s+['"])(\.[^'"]+)(\.ts)(x?['"])/g;

async function* walkTs(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules, dist, .turbo, etc.
      if (['node_modules', 'dist', '.turbo', '.next', '.expo'].includes(entry.name)) continue;
      yield* walkTs(full);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      yield full;
    }
  }
}

let totalFiles = 0;
let totalImports = 0;
const changedFiles = [];

for await (const filePath of walkTs(SRC_DIR)) {
  const content = await readFile(filePath, 'utf-8');
  let changed = false;
  let fileImportCount = 0;

  const newContent = content.replace(IMPORT_RE, (match, prefix, path, ext, suffix) => {
    // suffix is either x' or x" or ' or "
    // ext is always .ts
    // If suffix starts with 'x', the original extension was .tsx → replace with .jsx
    const newExt = suffix.startsWith('x') ? '.jsx' : '.js';
    const newSuffix = suffix.startsWith('x') ? suffix.slice(1) : suffix;
    changed = true;
    fileImportCount++;
    return `${prefix}${path}${newExt}${newSuffix}`;
  });

  if (changed) {
    totalFiles++;
    totalImports += fileImportCount;
    const relPath = filePath.replace(SRC_DIR, 'src/');
    changedFiles.push({ path: relPath, count: fileImportCount });

    if (!DRY_RUN) {
      await writeFile(filePath, newContent, 'utf-8');
    }
  }
}

console.log(`\n${DRY_RUN ? '[DRY RUN] ' : ''}Import extension conversion complete.`);
console.log(`Files changed: ${totalFiles}`);
console.log(`Imports converted: ${totalImports}`);
console.log('\nChanged files:');
for (const { path, count } of changedFiles) {
  console.log(`  ${path} (${count} imports)`);
}
