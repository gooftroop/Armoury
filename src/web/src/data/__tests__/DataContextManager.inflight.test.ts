/**
 * @requirements
 * - REQ-WEB-MGR-C3a: inflightSystemSyncs tracks active runSyncJob executions
 *
 * Test Plan:
 * | # | Requirement      | Test case                                           |
 * |---|------------------|-----------------------------------------------------|
 * | 1 | REQ-WEB-MGR-C3a  | hasInflightSystemSync is true during sync execution |
 * | 2 | REQ-WEB-MGR-C3a  | hasInflightSystemSync is false after sync completes |
 * | 3 | REQ-WEB-MGR-C3a  | finally clears set even when sync throws            |
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { QueryClient } from '@tanstack/react-query';
import type { DataContext } from '@armoury/data-context';
import type { DatabaseAdapter, FileSyncStatus, GameSystem } from '@armoury/data-dao';

import { DataContextManager } from '../DataContextManager.js';

const {
    adapterMock,
    createContainerWithModulesMock,
    DataContextBuilderMock,
    getQueryClientMock,
    queryClientToken,
    adapterFactoryToken,
    githubFactoryToken,
    wahapediaFactoryToken,
} = vi.hoisted(() => {
    const adapter = {
        initialize: vi.fn(async () => undefined),
        close: vi.fn(async () => undefined),
        getAllSyncStatuses: vi.fn(async () => [] as FileSyncStatus[]),
        rawQuery: vi.fn(async () => ({ rows: [] as unknown[] })),
    };

    const queryClientTokenValue = Symbol.for('QueryClient');
    const adapterFactoryTokenValue = Symbol.for('AdapterFactory');
    const githubFactoryTokenValue = Symbol.for('GitHubClientFactory');
    const wahapediaFactoryTokenValue = Symbol.for('WahapediaClientFactory');

    const adapterFactory = vi.fn(async () => adapter as unknown as DatabaseAdapter);
    const githubFactory = vi.fn(async () => ({ kind: 'github' }));
    const wahapediaFactory = vi.fn(async () => ({ kind: 'wahapedia' }));

    const bindMock = vi.fn(() => ({ toConstantValue: vi.fn() }));
    const getMock = vi.fn((token: symbol) => {
        if (token === adapterFactoryTokenValue) {
            return adapterFactory;
        }

        if (token === githubFactoryTokenValue) {
            return githubFactory;
        }

        if (token === wahapediaFactoryTokenValue) {
            return wahapediaFactory;
        }

        if (token === queryClientTokenValue) {
            return { id: 'query-client' } as unknown as QueryClient;
        }

        return undefined;
    });

    return {
        adapterMock: adapter,
        createContainerWithModulesMock: vi.fn(() => ({
            bind: bindMock,
            get: getMock,
        })),
        DataContextBuilderMock: {
            builder: vi.fn(),
        },
        getQueryClientMock: vi.fn(() => ({ id: 'query-client' }) as unknown as QueryClient),
        queryClientToken: queryClientTokenValue,
        adapterFactoryToken: adapterFactoryTokenValue,
        githubFactoryToken: githubFactoryTokenValue,
        wahapediaFactoryToken: wahapediaFactoryTokenValue,
    };
});

vi.mock('@armoury/di', () => ({
    createContainerWithModules: createContainerWithModulesMock,
    coreModule: { name: 'core-module' },
    TOKENS: {
        QueryClient: queryClientToken,
        AdapterFactory: adapterFactoryToken,
        GitHubClientFactory: githubFactoryToken,
        WahapediaClientFactory: wahapediaFactoryToken,
    },
}));

vi.mock('@armoury/di/web', () => ({
    webModule: { name: 'web-module' },
}));

vi.mock('@armoury/data-context', () => ({
    DataContextBuilder: DataContextBuilderMock,
}));

vi.mock('@/lib/getQueryClient.js', () => ({
    getQueryClient: getQueryClientMock,
}));

function createSystem(id: string): GameSystem {
    return {
        id,
        name: `System ${id}`,
        version: '1.0.0',
        dataSource: {
            type: 'github',
            owner: 'owner',
            repo: 'repo',
            coreFile: 'core',
            description: 'desc',
            licenseStatus: 'ok',
        },
        entityKinds: [],
        validationRules: [],
        getHydrators: () => new Map(),
        getSchemaExtension: () => ({}),
        register: () => undefined,
        createGameContext: () => ({}),
        getSyncFileKeyPrefixes: () => [`${id}:`],
    };
}

describe('DataContextManager inflight sync tracking', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        adapterMock.initialize.mockResolvedValue(undefined);
        adapterMock.close.mockResolvedValue(undefined);
        adapterMock.getAllSyncStatuses.mockResolvedValue([]);
        adapterMock.rawQuery.mockResolvedValue({ rows: [] });
    });

    it('tracks inflight sync transitions for success and error paths', async () => {
        const manager = new DataContextManager();
        let releaseSuccessSync: () => void = () => undefined;
        const successSyncPromise = new Promise<void>((resolve) => {
            releaseSuccessSync = resolve;
        });
        const inflightDuringSuccessSync: boolean[] = [];

        const successSync = vi.fn(async () => {
            inflightDuringSuccessSync.push(manager.hasInflightSystemSync('success-system'));
            await successSyncPromise;
            inflightDuringSuccessSync.push(manager.hasInflightSystemSync('success-system'));

            return null;
        });

        const errorSync = vi.fn(async () => {
            expect(manager.hasInflightSystemSync('error-system')).toBe(true);
            throw new Error('sync failed');
        });

        DataContextBuilderMock.builder.mockImplementation(() => {
            let currentSystemId = 'unknown';

            const chain = {
                system: vi.fn((system: GameSystem) => {
                    currentSystemId = system.id;

                    return chain;
                }),
                adapter: vi.fn(() => chain),
                ownsAdapter: vi.fn(() => chain),
                register: vi.fn(() => chain),
                buildFromCache: vi.fn(async () => {
                    const sync = currentSystemId === 'success-system' ? successSync : errorSync;

                    return {
                        close: vi.fn(async () => undefined),
                        sync,
                    } as unknown as DataContext;
                }),
            };

            return chain;
        });

        await manager.enableSystem(createSystem('success-system'));

        await vi.waitFor(() => {
            expect(successSync).toHaveBeenCalledTimes(1);
            expect(manager.hasInflightSystemSync('success-system')).toBe(true);
        });

        releaseSuccessSync();

        await vi.waitFor(() => {
            expect(manager.getSnapshot().systemSyncStates['success-system']?.status).toBe('synced');
        });

        expect(inflightDuringSuccessSync).toEqual([true, true]);
        expect(manager.hasInflightSystemSync('success-system')).toBe(false);

        await manager.enableSystem(createSystem('error-system'));

        await vi.waitFor(() => {
            expect(errorSync).toHaveBeenCalledTimes(1);
            expect(manager.getSnapshot().systemSyncStates['error-system']?.status).toBe('error');
        });

        expect(manager.hasInflightSystemSync('error-system')).toBe(false);

        await manager.dispose();
    });
});
