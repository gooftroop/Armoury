import { describe, it, expect } from 'vitest';
import type {
    Army,
    ArmyUnit,
    ArmyVersion,
    ArmyModelConfig,
    ArmyWargearSelection,
    ArmyEnhancement,
} from '@wh40k10e/models/ArmyModel.js';

/** Builds a minimal model config for testing. */
const buildModelConfig = (modelName: string): ArmyModelConfig => ({
    modelName,
    rangedWeaponIds: ['weapon-1'],
    meleeWeaponIds: [],
});

/** Builds a minimal wargear selection for testing. */
const buildWargearSelection = (
    wargearOptionId: string,
    choiceId: string,
    choiceName: string,
): ArmyWargearSelection => ({
    wargearOptionId,
    choiceId,
    choiceName,
});

/** Builds a minimal enhancement for testing. */
const buildEnhancement = (enhancementId: string, enhancementName: string, points: number): ArmyEnhancement => ({
    enhancementId,
    enhancementName,
    points,
});

/** Builds a minimal army unit for testing. */
const buildArmyUnit = (id: string = 'army-unit-1'): ArmyUnit => ({
    id,
    unitId: 'unit-1',
    modelCount: 5,
    totalPoints: 100,
    modelConfigs: [buildModelConfig('Model 1')],
    wargearSelections: [buildWargearSelection('wargear-1', 'choice-1', 'Plasma Gun')],
    enhancement: null,
    leadingUnitId: null,
});

/** Builds a minimal army version for testing. */
const buildArmyVersion = (version: number = 1): ArmyVersion => ({
    version,
    savedAt: '2024-01-01T00:00:00Z',
    units: [buildArmyUnit()],
    totalPoints: 100,
});

/** Builds a complete army for testing. */
const buildArmy = (id: string = 'army-1'): Army => ({
    id,
    ownerId: 'auth0|user-1',
    name: 'Ultramarines Strike Force',
    factionId: 'space-marines',
    detachmentId: 'ultramarines-battle-demi-company',
    warlordUnitId: 'army-unit-1',
    battleSize: 'StrikeForce',
    pointsLimit: 2000,
    units: [buildArmyUnit()],
    totalPoints: 100,
    notes: 'My competitive list',
    versions: [buildArmyVersion(1)],
    currentVersion: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z',
});

/** Describes Army model construction and serialization. */
describe('ArmyModel', () => {
    /** Ensures construction with required fields succeeds. */
    it('constructs with required fields', () => {
        const army = buildArmy();
        expect(army.id).toBe('army-1');
        expect(army.name).toBe('Ultramarines Strike Force');
        expect(army.factionId).toBe('space-marines');
        expect(army.battleSize).toBe('StrikeForce');
        expect(army.pointsLimit).toBe(2000);
    });

    /** Ensures serialization preserves all fields. */
    it('serializes to JSON with all fields preserved', () => {
        const army = buildArmy();
        const json = JSON.parse(JSON.stringify(army)) as Record<string, unknown>;
        expect(json.id).toBe('army-1');
        expect(json.name).toBe('Ultramarines Strike Force');
        expect(json.factionId).toBe('space-marines');
        expect(json.detachmentId).toBe('ultramarines-battle-demi-company');
        expect(json.warlordUnitId).toBe('army-unit-1');
        expect(json.battleSize).toBe('StrikeForce');
        expect(json.pointsLimit).toBe(2000);
        expect(json.units).toBeDefined();
        expect(json.totalPoints).toBe(100);
        expect(json.notes).toBe('My competitive list');
        expect(json.versions).toBeDefined();
        expect(json.currentVersion).toBe(0);
        expect(json.createdAt).toBe('2024-01-01T00:00:00Z');
        expect(json.updatedAt).toBe('2024-01-01T12:00:00Z');
    });

    /** Ensures hydration reconstructs the model from JSON. */
    it('hydrates from JSON into an Army object', () => {
        const original = buildArmy();
        const json = JSON.parse(JSON.stringify(original));
        const hydrated = json as Army;
        expect(hydrated.id).toBe(original.id);
        expect(hydrated.name).toBe(original.name);
        expect(hydrated.factionId).toBe(original.factionId);
        expect(hydrated.units.length).toBe(original.units.length);
        expect(hydrated.versions.length).toBe(original.versions.length);
    });

    /** Ensures round-trip serialization preserves data integrity. */
    it('round-trip: Army → JSON → Army preserves all data', () => {
        const original = buildArmy();
        const json = JSON.parse(JSON.stringify(original));
        const hydrated = json as Army;
        expect(hydrated).toEqual(original);
    });

    /** Ensures optional fields default correctly. */
    it('supports optional fields (detachmentId, warlordUnitId, enhancement)', () => {
        const army: Army = {
            id: 'army-2',
            ownerId: 'auth0|user-2',
            name: 'Necron Dynasty',
            factionId: 'necrons',
            detachmentId: null,
            warlordUnitId: null,
            battleSize: 'Incursion',
            pointsLimit: 1000,
            units: [],
            totalPoints: 0,
            notes: '',
            versions: [],
            currentVersion: 0,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
        };
        expect(army.detachmentId).toBeNull();
        expect(army.warlordUnitId).toBeNull();
        const json = JSON.parse(JSON.stringify(army));
        expect(json.detachmentId).toBeNull();
        expect(json.warlordUnitId).toBeNull();
    });

    /** Ensures nested unit structures serialize correctly. */
    it('serializes nested units with all configurations', () => {
        const unit = buildArmyUnit('unit-with-enhancement');
        unit.enhancement = buildEnhancement('enh-1', 'Warlord Trait', 0);
        unit.leadingUnitId = 'leader-unit-1';
        const army: Army = {
            ...buildArmy(),
            units: [unit],
        };
        const json = JSON.parse(JSON.stringify(army));
        const hydrated = json as Army;
        expect(hydrated.units[0]?.enhancement).toEqual(unit.enhancement);
        expect(hydrated.units[0]?.leadingUnitId).toBe('leader-unit-1');
    });

    /** Ensures version history is preserved. */
    it('preserves version history through serialization', () => {
        const army: Army = {
            ...buildArmy(),
            versions: [buildArmyVersion(1), buildArmyVersion(2), buildArmyVersion(3)],
            currentVersion: 2,
        };
        const json = JSON.parse(JSON.stringify(army));
        const hydrated = json as Army;
        expect(hydrated.versions).toHaveLength(3);
        expect(hydrated.versions[0]?.version).toBe(1);
        expect(hydrated.versions[2]?.version).toBe(3);
        expect(hydrated.currentVersion).toBe(2);
    });

    /** Ensures all battle sizes are supported. */
    it('supports all battle sizes (Incursion, StrikeForce, Onslaught)', () => {
        const sizes = ['Incursion', 'StrikeForce', 'Onslaught'] as const;
        sizes.forEach((size) => {
            const army = buildArmy();
            army.battleSize = size;
            const json = JSON.parse(JSON.stringify(army));
            expect(json.battleSize).toBe(size);
        });
    });
});
