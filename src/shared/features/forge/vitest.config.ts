import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from '@armoury/vitest';

const FORGE_ROOT = path.dirname(fileURLToPath(import.meta.url));

function platformExtensionPlugin() {
    return {
        name: 'platform-extension-resolver',
        resolveId(id: string, importer?: string) {
            if (!importer) return null;
            const match = id.match(/^(.*)\.(web|mobile)\.js$/);
            if (!match) return null;
            const testDir = path.dirname(importer);
            const componentDir = testDir.includes(`${path.sep}__tests__${path.sep}`)
                ? path.dirname(path.dirname(testDir))
                : testDir;
            const tsxPath = path.resolve(componentDir, `${path.basename(match[1])}.${match[2]}.tsx`);
            return tsxPath;
        },
    };
}

function tamaguiNativePlugin() {
    const virtualId = 'virtual:tamagui-native';

    return {
        name: 'tamagui-native-resolver',
        resolveId(id: string) {
            if (id === '@tamagui/native') return virtualId;
            return null;
        },
        load(id: string) {
            if (id !== virtualId) return null;

            return `export function getPortal() {
                return { state: { type: 'none' } };
            }`;
        },
    };
}

export default mergeConfig(
    baseConfig,
    defineConfig({
        resolve: {
            alias: {
                'react-native': path.resolve(FORGE_ROOT, '../../../mobile/__mocks__/react-native.ts'),
                tamagui: path.resolve(FORGE_ROOT, '../../../mobile/__mocks__/tamagui.ts'),
            },
        },
        plugins: [platformExtensionPlugin(), tamaguiNativePlugin()],
        test: {
            environment: 'happy-dom',
            include: ['**/__tests__/**/*.test.{ts,tsx}'],
            passWithNoTests: true,
            setupFiles: ['@testing-library/jest-dom/vitest'],
        },
    }),
);
