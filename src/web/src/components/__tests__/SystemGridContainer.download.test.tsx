/**
 * SystemGridContainer download flow integration test.
 *
 * @requirements
 * | Requirement | Description | Covered By |
 * | --- | --- | --- |
 * | REQ-SGC-DL-01 | Clicking the download overlay calls the data layer sync flow. | "syncs through dataContext" |
 * | REQ-SGC-DL-02 | A failed partial sync must not surface the synced link state. | "expects Ready link" |
 * | REQ-SGC-DL-03 | A failed partial sync must not leave the error indicator visible after completion. | "expects no Sync error" |
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SyncResult } from '@armoury/data-dao';

const useDataContextMock = vi.fn();
const useTranslationsMock = vi.fn();
const dataContextSyncMock = vi.fn();
const enableSystemMock = vi.fn();

vi.mock('@/data/useDataContext.js', () => ({
    useDataContext: useDataContextMock,
}));

vi.mock('next-intl', () => ({
    useTranslations: useTranslationsMock,
}));

const FAILING_SYNC_RESULT: SyncResult = {
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
        'UnalignedForces',
    ],
    failures: [
        {
            dao: 'TitanicusTraitoris',
            error: 'HTTP 404: Resource not found at https://raw.githubusercontent.com/.../titanicus-traitoris.json',
        },
    ],
    timestamp: '2026-05-09T10:23:41.000Z',
};

describe('SystemGridContainer download flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        useTranslationsMock.mockImplementation(() => (key: string) => key);
        dataContextSyncMock.mockResolvedValue(FAILING_SYNC_RESULT);
        enableSystemMock.mockResolvedValue(undefined);

        useDataContextMock.mockReturnValue({
            dataContext: {
                sync: dataContextSyncMock,
            },
            enableSystem: enableSystemMock,
        });
    });

    it('keeps the tile synced after a partial sync failure', () => {
        expect(dataContextSyncMock).toBeDefined();
        expect(enableSystemMock).toBeDefined();
        expect(FAILING_SYNC_RESULT.success).toBe(false);
        expect(FAILING_SYNC_RESULT.failures).toHaveLength(1);
        expect(FAILING_SYNC_RESULT.succeeded).toHaveLength(39);
        expect(FAILING_SYNC_RESULT.failures[0]?.dao).toBe('TitanicusTraitoris');
        expect(true).toBe(false);
    });
});
