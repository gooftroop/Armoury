/**
 * Tests for army construction helpers.
 *
 * @requirements
 * 1. Must verify getPointsLimitForBattleSize for all supported battle sizes.
 * 2. Must verify buildNewArmy derives points and applies canonical Army defaults.
 * 3. Must verify identifiers and timestamps are generated at build time.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildNewArmy, getPointsLimitForBattleSize, type CreateArmyDraft } from '../createArmyHelpers.js';

describe('createArmyHelpers', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-05-15T12:34:56.000Z'));
        vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('army-uuid-1');
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it.each([
        ['Incursion', 1000],
        ['StrikeForce', 2000],
        ['Onslaught', 3000],
    ] as const)('returns %s points for %i battle size', (battleSize, expectedPoints) => {
        expect(getPointsLimitForBattleSize(battleSize)).toBe(expectedPoints);
    });

    it('builds a minimal valid army with canonical defaults', () => {
        const draft: CreateArmyDraft = {
            name: '  Ultramarines Strike Force  ',
            factionId: 'space-marines',
            detachmentId: 'ultramarines-battle-demi-company',
            battleSize: 'StrikeForce',
            ownerId: 'user-1',
        };

        expect(buildNewArmy(draft)).toEqual({
            id: 'army-uuid-1',
            ownerId: 'user-1',
            name: 'Ultramarines Strike Force',
            factionId: 'space-marines',
            detachmentId: 'ultramarines-battle-demi-company',
            warlordUnitId: null,
            battleSize: 'StrikeForce',
            pointsLimit: 2000,
            units: [],
            totalPoints: 0,
            notes: '',
            versions: [],
            currentVersion: 0,
            createdAt: '2026-05-15T12:34:56.000Z',
            updatedAt: '2026-05-15T12:34:56.000Z',
        });
    });
});
