/**
 * DataContextManager download regression test.
 *
 * @requirements
 * | Requirement ID | Requirement | Test Case(s) |
 * | --- | --- | --- |
 * | REQ-WEB-MGR-DR-001 | Download flow should report SyncStatus.Synced when DAO sync succeeds after PR #45 fix. | T1 |
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataContext } from '@armoury/data-context';
import type { GameSystem, SyncResult } from '@armoury/data-dao';

import { DataContextManager } from '../DataContextManager.js';
import { SyncStatus } from '../managerState.js';

const { DataContextBuilderMock, createContainerWithModulesMock, getQueryClientMock, adapterMock } = vi.hoisted(() => {
    const queryClientToken = Symbol.for('QueryClient');
    const adapterFactoryToken = Symbol.for('AdapterFactory');
    const githubFactoryToken = Symbol.for('GitHubClientFactory');
    const wahapediaFactoryToken = Symbol.for('WahapediaClientFactory');

    const adapterMockInner = {
        initialize: vi.fn(async () => undefined),
        close: vi.fn(async () => undefined),
        getAllSyncStatuses: vi.fn(async () => []),
        rawQuery: vi.fn(async () => ({ rows: [] })),
    };

    const adapterFactory = vi.fn(async () => adapterMockInner);
    const githubFactory = vi.fn(async () => ({ kind: 'github' }));
    const wahapediaFactory = vi.fn(async () => ({ kind: 'wahapedia' }));

    const bindMock = vi.fn(() => ({ toConstantValue: vi.fn() }));
    const getMock = vi.fn((token: symbol) => {
        if (token === adapterFactoryToken) {return adapterFactory;}

        if (token === githubFactoryToken) {return githubFactory;}

        if (token === wahapediaFactoryToken) {return wahapediaFactory;}

        if (token === queryClientToken) {return { id: 'query-client' };}

        return undefined;
    });

    return {
        adapterMock: adapterMockInner,
        createContainerWithModulesMock: vi.fn(() => ({ bind: bindMock, get: getMock })),
        getQueryClientMock: vi.fn(() => ({ id: 'query-client' })),
        DataContextBuilderMock: {
            builder: vi.fn(() => ({
                system: vi.fn().mockReturnThis(),
                adapter: vi.fn().mockReturnThis(),
                ownsAdapter: vi.fn().mockReturnThis(),
                register: vi.fn().mockReturnThis(),
                buildFromCache: vi.fn(async () => ({ close: vi.fn(), sync: vi.fn() })),
            })),
        },
    };
});

vi.mock('@armoury/di', () => ({
    createContainerWithModules: createContainerWithModulesMock,
    coreModule: { name: 'core-module' },
    TOKENS: {
        QueryClient: Symbol.for('QueryClient'),
        AdapterFactory: Symbol.for('AdapterFactory'),
        GitHubClientFactory: Symbol.for('GitHubClientFactory'),
        WahapediaClientFactory: Symbol.for('WahapediaClientFactory'),
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
            succeeded: [
                'ChapterApproved',
                'CoreRules',
                'CrusadeRules',
                'Aeldari',
                'Drukhari',
                'ChaosSpaceMarines',
                'ChaosDaemons',
                'ChaosKnights',
                'DeathGuard',
                'EmperorsChildren',
                'ThousandSons',
                'WorldEaters',
                'AdeptaSororitas',
                'AdeptusCustodes',
                'AdeptusMechanicus',
                'AgentsOfTheImperium',
                'AstraMilitarum',
                'ImperialKnights',
                'GreyKnights',
                'SpaceMarines',
                'BlackTemplars',
                'BloodAngels',
                'DarkAngels',
                'Deathwatch',
                'SpaceWolves',
                'Ultramarines',
                'ImperialFists',
                'IronHands',
                'RavenGuard',
                'Salamanders',
                'WhiteScars',
                'GenestealerCults',
                'LeaguesOfVotann',
                'Necrons',
                'Orks',
                'TauEmpire',
                'Tyranids',
                'AdeptusTitanicus',
            ],
            failures: [
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
            buildFromCache: vi.fn().mockResolvedValue({
                close: vi.fn(),
                sync: vi.fn().mockResolvedValue(failingSyncResult),
            } as unknown as DataContext),
        });

        const manager = new DataContextManager();
        await manager.enableSystem(createSystem('wh40k10e'));

        expect(manager.getSnapshot().systemSyncStates.wh40k10e?.status).toBe(SyncStatus.Synced);

        await manager.dispose();
    });
});
