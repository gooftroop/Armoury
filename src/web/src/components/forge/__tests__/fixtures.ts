import type { ArmyCardProps } from '@/components/forge/ArmyCard.js';

type Army = ArmyCardProps['army'];

export function makeArmy(overrides: Partial<Army> = {}): Army {
    return {
        id: 'army-1',
        ownerId: 'user-1',
        name: 'Ultramarines First Company',
        factionId: 'space-marines',
        detachmentId: null,
        warlordUnitId: null,
        battleSize: 'StrikeForce',
        pointsLimit: 2000,
        units: [],
        totalPoints: 1500,
        notes: '',
        versions: [],
        currentVersion: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
        ...overrides,
    };
}
