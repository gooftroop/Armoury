/**
 * Generate type declarations for both web and mobile entry points.
 *
 * Runs tsc for each tsconfig and then rewrites `@/` path aliases
 * in the emitted `.d.ts` files to relative paths.
 *
 * @requirements
 * 1. Must emit web declarations to dist/web/.
 * 2. Must emit mobile declarations to dist/mobile/.
 * 3. Must rewrite @/ path aliases in both output directories.
 */

import { execSync } from 'node:child_process';

const run = (cmd) => execSync(cmd, { stdio: 'inherit' });

// Emit web declarations
run('tsc -p tsconfig.build.json');

// Emit mobile declarations
run('tsc -p tsconfig.mobile.json');

// Fix @/ path aliases in both output directories
const fixPaths = (dir) =>
    run(`node --input-type=module -e "import { readdir, readFile, writeFile } from 'node:fs/promises'; import { dirname, join, relative, resolve } from 'node:path'; const distDir = resolve('${dir}'); const entries = await readdir(distDir, { recursive: true }); const dtsFiles = entries.filter(e => e.endsWith('.d.ts')).map(e => join(distDir, e)); let n = 0; for (const f of dtsFiles) { const c = await readFile(f, 'utf-8'); if (!c.includes(String.fromCharCode(39) + '@/') && !c.includes('\"@/')) continue; const rel = relative(distDir, dirname(f)); const pfx = rel === '' ? './' : '../'.repeat(rel.split('/').length); const u = c.replace(/(from\\s+['\"])@\\//g, String.fromCodePoint(36) + '1' + pfx).replace(/(import\\s*\\(\\s*['\"])@\\//g, String.fromCodePoint(36) + '1' + pfx); if (u !== c) { await writeFile(f, u, 'utf-8'); n++; } } if (n > 0) console.log('fix-declaration-paths: rewrote @/ aliases in ' + n + ' .d.ts files in ${dir}');"`);

fixPaths('dist/web');
fixPaths('dist/mobile');
