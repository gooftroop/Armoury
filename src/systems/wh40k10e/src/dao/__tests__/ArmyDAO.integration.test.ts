import { describe, it, expect, beforeEach } from 'vitest';
import { ArmyDAO } from '../ArmyDAO.ts';
import { MockDatabaseAdapter } from '../../__mocks__/MockDatabaseAdapter.ts';
import { makeArmy } from '../../../e2e/__fixtures__/makeArmy.ts';
import type { Army, ArmyUnit, ArmyVersion } from '../../models/ArmyModel.ts';

function makeArmyUnit(overrides: Partial<ArmyUnit> = {}): ArmyUnit {
    return {
        id: 'unit-1',
        unitId: 'datasheet-1',
        modelCount: 5,
        totalPoints: 90,
        modelConfigs: [
            {
                modelName: 'Sergeant',
                rangedWeaponIds: ['weapon-1'],
                meleeWeaponIds: [],
            },
        ],
        wargearSelections: [
            {
                wargearOptionId: 'wargear-1',
                choiceId: 'choice-1',
                choiceName: 'Power Sword',
            },
        ],
        enhancement: {
            enhancementId: 'enhancement-1',
            enhancementName: 'Relic of the Chapter',
            points: 10,
        },
        leadingUnitId: null,
        ...overrides,
    };
}

function makeArmyVersion(overrides: Partial<ArmyVersion> = {}): ArmyVersion {
    return {
        version: 1,
        savedAt: '2025-01-02T00:00:00Z',
        units: [makeArmyUnit()],
        totalPoints: 100,
        ...overrides,
    };
}

function makeArmyWithNested(overrides: Partial<Army> = {}): Army {
    const unit = makeArmyUnit();
    const version = makeArmyVersion({ units: [unit] });

    return makeArmy({
        units: [unit],
        versions: [version],
        currentVersion: 1,
        totalPoints: 100,
        ...overrides,
    });
}

describe('ArmyDAO integration tests', () => {
    let adapter: MockDatabaseAdapter;
    let dao: ArmyDAO;

    beforeEach(async () => {
        adapter = new MockDatabaseAdapter();
        await adapter.initialize();
        dao = new ArmyDAO(adapter);
    });

    it('should save and get an army', async () => {
        const army = makeArmy({ name: 'Ultramarines Alpha' });
        await dao.save(army);

        const result = await dao.get(army.id);
        expect(result).not.toBeNull();
        expect(result!.id).toBe(army.id);
        expect(result!.name).toBe('Ultramarines Alpha');
    });

    it('should list all armies', async () => {
        await dao.save(makeArmy({ id: 'army-1' }));
        await dao.save(makeArmy({ id: 'army-2' }));

        const results = await dao.list();
        expect(results).toHaveLength(2);
    });

    it('should count armies', async () => {
        await dao.save(makeArmy({ id: 'army-1' }));
        await dao.save(makeArmy({ id: 'army-2' }));

        const count = await dao.count();
        expect(count).toBe(2);
    });

    it('should save many armies', async () => {
        await dao.saveMany([makeArmy({ id: 'army-1' }), makeArmy({ id: 'army-2' }), makeArmy({ id: 'army-3' })]);

        const results = await dao.list();
        expect(results).toHaveLength(3);
    });

    it('should delete an army', async () => {
        await dao.save(makeArmy({ id: 'army-delete' }));
        await dao.delete('army-delete');

        const result = await dao.get('army-delete');
        expect(result).toBeNull();
    });

    it('should delete all armies', async () => {
        await dao.save(makeArmy({ id: 'army-1' }));
        await dao.save(makeArmy({ id: 'army-2' }));
        await dao.deleteAll();

        const count = await dao.count();
        expect(count).toBe(0);
    });

    it('should list armies by owner', async () => {
        await dao.save(makeArmy({ id: 'army-1', ownerId: 'auth0|owner-1' }));
        await dao.save(makeArmy({ id: 'army-2', ownerId: 'auth0|owner-2' }));
        await dao.save(makeArmy({ id: 'army-3', ownerId: 'auth0|owner-1' }));

        const results = await dao.listByOwner('auth0|owner-1');
        expect(results).toHaveLength(2);
    });

    it('should list armies by faction', async () => {
        await dao.save(makeArmy({ id: 'army-1', factionId: 'space-marines' }));
        await dao.save(makeArmy({ id: 'army-2', factionId: 'necrons' }));
        await dao.save(makeArmy({ id: 'army-3', factionId: 'space-marines' }));

        const results = await dao.listByFaction('space-marines');
        expect(results).toHaveLength(2);
    });

    it('should preserve JSONB fields through round-trip', async () => {
        const army = makeArmyWithNested({
            versions: [
                makeArmyVersion({
                    version: 3,
                    units: [
                        makeArmyUnit({
                            id: 'unit-2',
                            modelConfigs: [
                                {
                                    modelName: 'Heavy Gunner',
                                    rangedWeaponIds: ['weapon-2'],
                                    meleeWeaponIds: [],
                                },
                            ],
                            wargearSelections: [
                                {
                                    wargearOptionId: 'wargear-2',
                                    choiceId: 'choice-2',
                                    choiceName: 'Aux Grenade Launcher',
                                },
                            ],
                        }),
                    ],
                }),
            ],
        });
        await dao.save(army);

        const result = await dao.get(army.id);
        expect(result!.versions).toEqual(army.versions);
        expect(result!.units).toEqual(army.units);
        expect(result!.versions[0]!.units[0]!.modelConfigs).toEqual(army.versions[0]!.units[0]!.modelConfigs);
        expect(result!.versions[0]!.units[0]!.wargearSelections).toEqual(army.versions[0]!.units[0]!.wargearSelections);
    });

    it('should overwrite an army on re-save', async () => {
        const army = makeArmyWithNested({ name: 'Original Name' });
        await dao.save(army);

        const updated = {
            ...army,
            name: 'Updated Name',
            notes: 'Updated notes',
            updatedAt: '2025-02-01T00:00:00Z',
        };
        await dao.save(updated);

        const result = await dao.get(army.id);
        expect(result!.name).toBe('Updated Name');
        expect(result!.notes).toBe('Updated notes');
        expect(result!.updatedAt).toBe('2025-02-01T00:00:00Z');
    });
});
