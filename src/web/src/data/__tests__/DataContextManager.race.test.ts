/**
 * @requirements
 * - REQ-WEB-MGR-C1: ensureAdapterAndContainer() must be idempotent under concurrent calls
 * - REQ-WEB-MGR-C1: init failures must clear the in-flight promise so callers can retry
 *
 * Test Plan:
 * | # | Requirement     | Test case                                             |
 * |---|-----------------|-------------------------------------------------------|
 * | 1 | REQ-WEB-MGR-C1  | concurrent calls create exactly one adapter           |
 * | 2 | REQ-WEB-MGR-C1  | init failure clears promise, next call retries        |
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { QueryClient } from '@tanstack/react-query';
import type { DatabaseAdapter } from '@armoury/data-dao';

import { DataContextManager } from '@/data/DataContextManager.js';

const {
    adapterFactoryMock,
    createContainerWithModulesMock,
    getQueryClientMock,
    queryClientToken,
    adapterFactoryToken,
    githubFactoryToken,
    wahapediaFactoryToken,
} = vi.hoisted(() => {
    const queryClientTokenValue = Symbol.for('QueryClient');
    const adapterFactoryTokenValue = Symbol.for('AdapterFactory');
    const githubFactoryTokenValue = Symbol.for('GitHubClientFactory');
    const wahapediaFactoryTokenValue = Symbol.for('WahapediaClientFactory');

    const adapterFactory = vi.fn();
    const bindMock = vi.fn(() => ({ toConstantValue: vi.fn() }));
    const getMock = vi.fn((token: symbol) => {
        if (token === adapterFactoryTokenValue) {
            return adapterFactory;
        }

        if (token === queryClientTokenValue) {
            return { id: 'query-client' } as unknown as QueryClient;
        }

        if (token === githubFactoryTokenValue || token === wahapediaFactoryTokenValue) {
            return vi.fn(async () => ({}));
        }

        return undefined;
    });

    return {
        adapterFactoryMock: adapterFactory,
        createContainerWithModulesMock: vi.fn(() => ({
            bind: bindMock,
            get: getMock,
        })),
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

vi.mock('@/lib/getQueryClient.js', () => ({
    getQueryClient: getQueryClientMock,
}));

/** Returns the private ensureAdapterAndContainer method for direct race testing. */
function getEnsureAdapterAndContainer(manager: DataContextManager): () => Promise<void> {
    return (
        manager as unknown as {
            ensureAdapterAndContainer: () => Promise<void>;
        }
    ).ensureAdapterAndContainer.bind(manager);
}

describe('DataContextManager.ensureAdapterAndContainer races', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('creates adapter exactly once under concurrent calls', async () => {
        const adapter = {
            initialize: vi.fn(async () => undefined),
            close: vi.fn(async () => undefined),
            getAllSyncStatuses: vi.fn(async () => []),
        } as unknown as DatabaseAdapter;

        adapterFactoryMock.mockImplementation(async () => adapter);

        const manager = new DataContextManager();
        const ensureAdapterAndContainer = getEnsureAdapterAndContainer(manager);

        await Promise.all(Array.from({ length: 10 }, () => ensureAdapterAndContainer()));

        expect(adapterFactoryMock).toHaveBeenCalledTimes(1);
        expect(adapter.initialize).toHaveBeenCalledTimes(1);

        await manager.dispose();
    });

    it('init failure clears in-flight promise so retry works', async () => {
        const failingAdapter = {
            initialize: vi.fn(async () => {
                throw new Error('boom');
            }),
            close: vi.fn(async () => undefined),
            getAllSyncStatuses: vi.fn(async () => []),
        } as unknown as DatabaseAdapter;
        const workingAdapter = {
            initialize: vi.fn(async () => undefined),
            close: vi.fn(async () => undefined),
            getAllSyncStatuses: vi.fn(async () => []),
        } as unknown as DatabaseAdapter;

        adapterFactoryMock
            .mockImplementationOnce(async () => failingAdapter)
            .mockImplementationOnce(async () => workingAdapter);

        const manager = new DataContextManager();
        const ensureAdapterAndContainer = getEnsureAdapterAndContainer(manager);

        await expect(Promise.all([ensureAdapterAndContainer(), ensureAdapterAndContainer()])).rejects.toThrowError(
            'boom',
        );

        await expect(ensureAdapterAndContainer()).resolves.toBeUndefined();

        expect(adapterFactoryMock).toHaveBeenCalledTimes(2);
        expect(failingAdapter.initialize).toHaveBeenCalledTimes(1);
        expect(workingAdapter.initialize).toHaveBeenCalledTimes(1);

        await manager.dispose();
    });
});
