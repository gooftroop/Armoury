import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import createConfig from '@armoury/eslint';

export default createConfig('./tsconfig.json', dirname(fileURLToPath(import.meta.url)));
