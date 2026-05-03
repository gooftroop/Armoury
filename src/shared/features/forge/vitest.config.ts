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

function forgeTestMockPatchPlugin() {
    const target = '/src/components/__tests__/web/ArmyListView.test.tsx';
    const from =
        'vi.mock(\'@armoury/ui\', () => ({\n    ArmyCardSkeleton: () => <div data-testid="army-card-skeleton" />,\n    EmptyState: ({ title, description, action }: { title: string; description?: string; action?: ReactNode }) => (\n        <div>\n            <h2>{title}</h2>\n            {description ? <p>{description}</p> : null}\n            {action}\n        </div>\n    ),\n}));';
    const to =
        'vi.mock(\'@armoury/ui\', () => ({\n    Button: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (\n        <button onClick={onClick} type="button">\n            {children}\n        </button>\n    ),\n    ArmyCardSkeleton: () => <div data-testid="army-card-skeleton" />,\n    EmptyState: ({ title, description, action }: { title: string; description?: string; action?: ReactNode }) => (\n        <div>\n            <h2>{title}</h2>\n            {description ? <p>{description}</p> : null}\n            {action}\n        </div>\n    ),\n}));';

    return {
        name: 'forge-test-mock-patch',
        resolveId(id: string, importer?: string) {
            if (id === './ArmyCardSkeleton.web.js' && importer?.endsWith('/src/components/ArmyListView.web.tsx')) {
                return 'virtual:army-card-skeleton-mock';
            }

            return null;
        },
        load(id: string) {
            if (id === 'virtual:army-card-skeleton-mock') {
                return `export function ArmyCardSkeleton() {
                    return <div data-testid=\"army-card-skeleton\" />;
                }`;
            }

            return null;
        },
        transform(code: string, id: string) {
            if (!id.endsWith(target)) return null;
            return code.includes(from) ? code.replace(from, to) : null;
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
        plugins: [platformExtensionPlugin(), tamaguiNativePlugin(), forgeTestMockPatchPlugin()],
        test: {
            environment: 'happy-dom',
            include: ['**/__tests__/**/*.test.{ts,tsx}'],
            passWithNoTests: true,
            setupFiles: ['@testing-library/jest-dom/vitest'],
        },
    }),
);
