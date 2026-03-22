import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import createConfig from '@armoury/eslint';

export default [
    { ignores: ['build.js', 'generate-types.js', 'src/**/*.mobile.tsx', 'src/index.mobile.ts'] },
    ...createConfig('./tsconfig.json', dirname(fileURLToPath(import.meta.url))),
];
