import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import createConfig from '@armoury/eslint';

const base = createConfig('./tsconfig.json', dirname(fileURLToPath(import.meta.url)));

export default base;
