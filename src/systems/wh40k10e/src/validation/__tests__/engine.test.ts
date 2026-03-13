import { describe, it, expect } from 'vitest';

import type { Army, ArmyUnit } from '@/models/ArmyModel.js';
import type { CoreRules } from '@/models/CoreRules.js';
import type { FactionData } from '@/models/FactionData.js';
import type { Unit } from '@/models/UnitModel.js';
import type { Detachment, Enhancement } from '@/types/entities.js';
import { validateArmy } from '@/validation/engine.js';

const DEFAULT_TIMESTAMP = '2024-01-01T00:00:00Z';

/** Build a minimal ArmyUnit with reasonable defaults. */
const buildArmyUnit = (overrides: Partial<ArmyUnit> = {}): ArmyUnit => {
    const unit: ArmyUnit = {
        id: 'army-unit-1',
        unitId: 'unit-1',
        modelCount: 5,
        totalPoints: 100,
        modelConfigs: [],
        wargearSelections: [],
        enhancement: null,
        leadingUnitId: null,
    };

    return { ...unit, ...overrides };
};

/** Build a minimal Unit definition with defaults. */
const buildUnit = (overrides: Partial<Unit> = {}): Unit => {
    const unit: Unit = {
        id: 'unit-1',
        name: 'Test Unit',
        sourceFile: 'test.cat',
        sourceSha: 'sha',
        factionId: 'faction-1',
        movement: '6"',
        toughness: 4,
        save: '3+',
        wounds: 2,
        leadership: 6,
        objectiveControl: 1,
        composition: [{ models: 5, points: 100 }],
        rangedWeapons: [],
        meleeWeapons: [],
        wargearOptions: [],
        wargearAbilities: [],
        abilities: [],
        structuredAbilities: [],
        constraints: [],
        leader: undefined,
        keywords: ['Character'],
        factionKeywords: ['Test Faction'],
        imageUrl: '',
    };

    return { ...unit, ...overrides };
};

/** Build a minimal Army with defaults and computed totals. */
const buildArmy = (overrides: Partial<Army> = {}): Army => {
    const units = overrides.units ?? [buildArmyUnit()];
    const totalPoints = overrides.totalPoints ?? units.reduce((sum, unit) => sum + unit.totalPoints, 0);
    const army: Army = {
        id: 'army-1',
        ownerId: 'owner-1',
        name: 'Test Army',
        factionId: 'faction-1',
        detachmentId: null,
        warlordUnitId: units[0]?.id ?? null,
        battleSize: 'StrikeForce',
        pointsLimit: 2000,
        units,
        totalPoints,
        notes: '',
        versions: [],
        currentVersion: 0,
        createdAt: DEFAULT_TIMESTAMP,
        updatedAt: DEFAULT_TIMESTAMP,
    };

    return { ...army, ...overrides, units, totalPoints };
};

/** Build a minimal FactionData for testing with the given units and enhancements. */
const buildFactionData = (units: Unit[], enhancements: Enhancement[] = []): FactionData => ({
    id: 'faction-1',
    name: 'Test Faction',
    sourceFiles: ['test.cat'],
    armyImageUrl: '',
    lastSynced: new Date(),
    factionRules: [],
    structuredFactionRules: [],
    stratagems: [],
    detachments: [],
    units,
    enhancements,
    weapons: [],
    abilities: [],
});
/** Build a minimal CoreRules for test runs. */
const buildCoreRules = (): CoreRules => ({
    id: 'core-1',
    name: 'Core Rules',
    revision: '1',
    battleScribeVersion: '2',
    profileTypes: [],
    costTypes: [],
    sharedRules: [],
    categories: [],
    constraints: [],
    lastSynced: new Date(),
    sourceFile: 'core.gst',
});

describe('Full Engine', () => {
    it('returns isValid true for a legal army', () => {
        const unitDefinition = buildUnit({
            id: 'unit-29',
            name: 'Warlord',
            keywords: ['Character'],
        });
        const detachment: Detachment = {
            id: 'det-legal',
            name: 'Gladius Task Force',
            sourceFile: 'test.cat',
            sourceSha: 'sha',
            factionId: 'faction-1',
            rules: [],
            structuredRules: [],
            enhancements: [],
        };
        const factionData: FactionData = {
            id: 'faction-1',
            name: 'Test Faction',
            sourceFiles: ['test.cat'],
            armyImageUrl: '',
            lastSynced: new Date(),
            factionRules: [],
            structuredFactionRules: [],
            stratagems: [],
            units: [unitDefinition],
            enhancements: [],
            weapons: [],
            abilities: [],
            detachments: [detachment],
        };
        const army = buildArmy({
            units: [buildArmyUnit({ id: 'v1', unitId: 'unit-29' })],
            warlordUnitId: 'v1',
            detachmentId: 'det-legal',
            pointsLimit: 2000,
            totalPoints: 100,
        });
        const summary = validateArmy(army, factionData, buildCoreRules());
        expect(summary.isValid).toBe(true);
        expect(summary.errorCount).toBe(0);
    });

    it('returns all errors for an army with multiple violations', () => {
        const enhancement: Enhancement = {
            id: 'enh-8',
            name: 'Bad Enhancement',
            points: 10,
            description: 'Bad enhancement.',
            eligibleKeywords: [],
            structuredEffect: null,
        };
        const unitDefinition = buildUnit({
            id: 'unit-30',
            name: 'Invalid Unit',
            keywords: ['Infantry'],
            composition: [{ models: 5, points: 100 }],
        });
        const factionData = buildFactionData([unitDefinition], [enhancement]);
        const army = buildArmy({
            pointsLimit: 1000,
            totalPoints: 1200,
            warlordUnitId: null,
            units: [
                buildArmyUnit({
                    id: 'w1',
                    unitId: 'unit-30',
                    modelCount: 4,
                    enhancement: {
                        enhancementId: 'enh-8',
                        enhancementName: 'Bad Enhancement',
                        points: 10,
                    },
                }),
            ],
        });
        const summary = validateArmy(army, factionData, buildCoreRules());
        expect(summary.isValid).toBe(false);
        expect(summary.errorCount).toBeGreaterThan(1);
        const errorIds = summary.results.filter((result) => result.severity === 'error').map((result) => result.id);
        expect(errorIds).toEqual(
            expect.arrayContaining([
                'points-over-limit',
                'composition-invalid-size-w1',
                'enhancement-not-character-w1',
                'warlord-missing',
            ]),
        );
    });
});
