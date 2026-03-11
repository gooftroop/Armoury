import type { Army } from '../../src/models/ArmyModel.ts';

export function makeArmy(overrides: Partial<Army> = {}): Army {
    return {
        id: 'army-1',
        ownerId: 'auth0|user-1',
        name: 'Ultramarines Strike Force',
        factionId: 'space-marines',
        detachmentId: 'gladius-task-force',
        warlordUnitId: null,
        battleSize: 'StrikeForce',
        pointsLimit: 2000,
        units: [],
        totalPoints: 0,
        notes: '',
        versions: [],
        currentVersion: 0,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        ...overrides,
    };
}
