/**
 * DataContextManager download regression test.
 *
 * @requirements
 * | Requirement ID | Requirement | Test Case(s) |
 * | --- | --- | --- |
 * | REQ-WEB-MGR-DR-001 | Download flow should report SyncStatus.Synced when DAO sync succeeds after PR #45 fix. | T1 |
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { QueryClient } from '@tanstack/react-query';
import type { DataContext } from '@armoury/data-context';
import type { DatabaseAdapter, FileSyncStatus, GameSystem, SyncResult } from '@armoury/data-dao';

import { DataContextManager } from '../DataContextManager.js';
import { SyncStatus } from '../managerState.js';

const adapterMock = {
    initialize: vi.fn(async () => undefined),
    close: vi.fn(async () => undefined),
    getAllSyncStatuses: vi.fn(async () => [] as FileSyncStatus[]),
    rawQuery: vi.fn(async () => ({ rows: [] as unknown[] })),
};

const queryClientToken = Symbol.for('QueryClient');
const adapterFactoryToken = Symbol.for('AdapterFactory');
const githubFactoryToken = Symbol.for('GitHubClientFactory');
const wahapediaFactoryToken = Symbol.for('WahapediaClientFactory');

const adapterFactory = vi.fn(async () => adapterMock as unknown as DatabaseAdapter);
const githubFactory = vi.fn(async () => ({ kind: 'github' }));
const wahapediaFactory = vi.fn(async () => ({ kind: 'wahapedia' }));

const bindMock = vi.fn(() => ({ toConstantValue: vi.fn() }));
const getMock = vi.fn((token: symbol) => {
    if (token === adapterFactoryToken) {
        return adapterFactory;
    }

    if (token === githubFactoryToken) {
        return githubFactory;
    }

    if (token === wahapediaFactoryToken) {
        return wahapediaFactory;
    }

    if (token === queryClientToken) {
        return { id: 'query-client' } as unknown as QueryClient;
    }

    return undefined;
});

const createContainerWithModulesMock = vi.fn(() => ({
    bind: bindMock,
    get: getMock,
}));

const DataContextBuilderMock = {
    builder: vi.fn(() => ({
        system: vi.fn().mockReturnThis(),
        adapter: vi.fn().mockReturnThis(),
        ownsAdapter: vi.fn().mockReturnThis(),
        register: vi.fn().mockReturnThis(),
        buildFromCache: vi.fn(async () => ({ close: vi.fn(), sync: vi.fn() }) as unknown as DataContext),
    })),
};

const getQueryClientMock = vi.fn(() => ({ id: 'query-client' }) as unknown as QueryClient);

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

describe('DataContextManager download regression', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        adapterMock.initialize.mockResolvedValue(undefined);
        adapterMock.close.mockResolvedValue(undefined);
        adapterMock.getAllSyncStatuses.mockResolvedValue([]);
        adapterMock.rawQuery.mockResolvedValue({ rows: [] });
    });

    it('download flow: successful DAO sync + 200 account update results in SyncStatus.Synced (PR #45 regression)', async () => {
        const failingSyncResult: SyncResult = {
            success: false,
            total: 40,
            succeeded: [],
            failures: [
                {
                    dao: 'ChapterApproved',
                    error: 'Unknown entity store: chapterApproved. Is the plugin schema registered?',
                },
                { dao: 'CoreRules', error: 'Unknown entity store: faction. Is the plugin schema registered?' },
                { dao: 'CrusadeRules', error: 'Unknown entity store: crusadeRules. Is the plugin schema registered?' },
                { dao: 'Aeldari', error: 'Unknown entity store: factionModel. Is the plugin schema registered?' },
                { dao: 'Drukhari', error: 'Unknown entity store: factionModel. Is the plugin schema registered?' },
                {
                    dao: 'ChaosSpaceMarines',
                    error: 'Unknown entity store: factionModel. Is the plugin schema registered?',
                },
                { dao: 'ChaosDaemons', error: 'Unknown entity store: factionModel. Is the plugin schema registered?' },
                { dao: 'ChaosKnights', error: 'Unknown entity store: factionModel. Is the plugin schema registered?' },
                { dao: 'DeathGuard', error: 'Unknown entity store: factionModel. Is the plugin schema registered?' },
                {
                    dao: 'EmperorsChildren',
                    error: 'Unknown entity store: factionModel. Is the plugin schema registered?',
                },
                { dao: 'ThousandSons', error: 'Unknown entity store: factionModel. Is the plugin schema registered?' },
                { dao: 'WorldEaters', error: 'Unknown entity store: factionModel. Is the plugin schema registered?' },
                {
                    dao: 'AdeptaSororitas',
                    error: 'Unknown entity store: factionModel. Is the plugin schema registered?',
                },
                {
                    dao: 'AdeptusCustodes',
                    error: 'Unknown entity store: factionModel. Is the plugin schema registered?',
                },
                {
                    dao: 'AdeptusMechanicus',
                    error: 'Unknown entity store: factionModel. Is the plugin schema registered?',
                },
                {
                    dao: 'AgentsOfTheImperium',
                    error: 'Unknown entity store: factionModel. Is the plugin schema registered?',
                },
                {
                    dao: 'AstraMilitarum',
                    error: 'Unknown entity store: factionModel. Is the plugin schema registered?',
                },
                {
                    dao: 'ImperialKnights',
                    error: 'Unknown entity store: factionModel. Is the plugin schema registered?',
                },
                { dao: 'GreyKnights', error: 'Unknown entity store: factionModel. Is the plugin schema registered?' },
                { dao: 'SpaceMarines', error: 'Unknown entity store: factionModel. Is the plugin schema registered?' },
                { dao: 'BlackTemplars', error: 'Unknown entity store: factionModel. Is the plugin schema registered?' },
                { dao: 'BloodAngels', error: 'Unknown entity store: factionModel. Is the plugin schema registered?' },
                { dao: 'DarkAngels', error: 'Unknown entity store: factionModel. Is the plugin schema registered?' },
                { dao: 'Deathwatch', error: 'Unknown entity store: factionModel. Is the plugin schema registered?' },
                { dao: 'SpaceWolves', error: 'Unknown entity store: factionModel. Is the plugin schema registered?' },
                { dao: 'Ultramarines', error: 'Unknown entity store: factionModel. Is the plugin schema registered?' },
                { dao: 'ImperialFists', error: 'Unknown entity store: factionModel. Is the plugin schema registered?' },
                { dao: 'IronHands', error: 'Unknown entity store: factionModel. Is the plugin schema registered?' },
                { dao: 'RavenGuard', error: 'Unknown entity store: factionModel. Is the plugin schema registered?' },
                { dao: 'Salamanders', error: 'Unknown entity store: factionModel. Is the plugin schema registered?' },
                { dao: 'WhiteScars', error: 'Unknown entity store: factionModel. Is the plugin schema registered?' },
                {
                    dao: 'GenestealerCults',
                    error: 'Unknown entity store: factionModel. Is the plugin schema registered?',
                },
                {
                    dao: 'LeaguesOfVotann',
                    error: 'Unknown entity store: factionModel. Is the plugin schema registered?',
                },
                { dao: 'Necrons', error: 'Unknown entity store: factionModel. Is the plugin schema registered?' },
                { dao: 'Orks', error: 'Unknown entity store: factionModel. Is the plugin schema registered?' },
                { dao: 'TauEmpire', error: 'Unknown entity store: factionModel. Is the plugin schema registered?' },
                { dao: 'Tyranids', error: 'Unknown entity store: factionModel. Is the plugin schema registered?' },
                {
                    dao: 'AdeptusTitanicus',
                    error: 'Unknown entity store: factionModel. Is the plugin schema registered?',
                },
                { dao: 'HorusHeresy', error: 'Unknown entity store: factionModel. Is the plugin schema registered?' },
                { dao: 'Necromunda', error: 'Unknown entity store: factionModel. Is the plugin schema registered?' },
            ],
            timestamp: '2026-04-30T00:00:00.000Z',
        };

        DataContextBuilderMock.builder.mockReturnValue({
            system: vi.fn().mockReturnThis(),
            adapter: vi.fn().mockReturnThis(),
            ownsAdapter: vi.fn().mockReturnThis(),
            register: vi.fn().mockReturnThis(),
            buildFromCache: vi.fn(
                async () =>
                    ({
                        close: vi.fn(async () => undefined),
                        sync: vi.fn(async () => failingSyncResult),
                    }) as unknown as DataContext,
            ),
        });

        const manager = new DataContextManager();
        await manager.enableSystem(createSystem('wh40k10e'));

        expect(manager.getSnapshot().systemSyncStates.wh40k10e?.status).toBe(SyncStatus.Synced);

        await manager.dispose();
    });
});
