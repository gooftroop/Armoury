/**
 * DataContextManager Sentry captureException tests.
 *
 * @requirements
 * | Requirement ID | Requirement | Test Case(s) |
 * | --- | --- | --- |
 * | REQ-WEB-SENTRY-001 | catchError in sync queue pipeline captures error to Sentry with operation='sync-queue' | T1 |
 * | REQ-WEB-SENTRY-002 | try/catch in runSyncJob captures error to Sentry with operation='run-sync-job' | T2 |
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { QueryClient } from '@tanstack/react-query';
import type { DataContext } from '@armoury/data-context';
import type { DatabaseAdapter, FileSyncStatus, GameSystem } from '@armoury/data-dao';

import { DataContextManager } from '../DataContextManager.js';

import * as Sentry from '@sentry/nextjs';

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

function createSystem(id: string, prefixes: string[] = [`${id}:`]): GameSystem {
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
        getSyncFileKeyPrefixes: () => prefixes,
    };
}

describe('DataContextManager Sentry captureException', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        adapterMock.initialize.mockResolvedValue(undefined);
        adapterMock.close.mockResolvedValue(undefined);
        adapterMock.getAllSyncStatuses.mockResolvedValue([]);
    });

    afterEach(async () => {
        vi.useRealTimers();
    });

    it('T1: catchError in sync queue pipeline captures error with operation=sync-queue', async () => {
        const syncError = new Error('sync queue failed');

        DataContextBuilderMock.builder.mockReturnValue({
            system: vi.fn().mockReturnThis(),
            adapter: vi.fn().mockReturnThis(),
            ownsAdapter: vi.fn().mockReturnThis(),
            register: vi.fn().mockReturnThis(),
            buildFromCache: vi.fn(
                async () =>
                    ({
                        close: vi.fn(async () => undefined),
                        sync: vi.fn(async () => {
                            throw syncError;
                        }),
                    }) as unknown as DataContext,
            ),
        });

        const manager = new DataContextManager();
        await manager.enableSystem(createSystem('alpha'));

        // Wait for the sync queue to process the failed job
        await vi.waitFor(() => {
            expect(Sentry.captureException).toHaveBeenCalledWith(
                syncError,
                expect.objectContaining({
                    tags: expect.objectContaining({ area: 'data-context-manager', operation: 'sync-queue' }),
                }),
            );
        });

        await manager.dispose();
    });

    it('T2: try/catch in runSyncJob captures error with operation=run-sync-job', async () => {
        const syncError = new Error('runSyncJob inner failure');

        DataContextBuilderMock.builder.mockReturnValue({
            system: vi.fn().mockReturnThis(),
            adapter: vi.fn().mockReturnThis(),
            ownsAdapter: vi.fn().mockReturnThis(),
            register: vi.fn().mockReturnThis(),
            buildFromCache: vi.fn(
                async () =>
                    ({
                        close: vi.fn(async () => undefined),
                        sync: vi.fn(async () => {
                            throw syncError;
                        }),
                    }) as unknown as DataContext,
            ),
        });

        const manager = new DataContextManager();
        await manager.enableSystem(createSystem('alpha'));

        // The runSyncJob catch block re-throws, so the catchError in the pipeline
        // also fires — but we only need to verify the run-sync-job call happened
        await vi.waitFor(() => {
            expect(Sentry.captureException).toHaveBeenCalledWith(
                syncError,
                expect.objectContaining({
                    tags: expect.objectContaining({ area: 'data-context-manager', operation: 'run-sync-job' }),
                }),
            );
        });

        await manager.dispose();
    });
});
