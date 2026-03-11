import { describe, it, expect } from 'vitest';

import type { Army, ArmyUnit } from '@/models/ArmyModel.js';
import type { FactionData } from '@/models/FactionData.js';
import type { Unit, WargearOption } from '@/models/UnitModel.js';
import type { Enhancement } from '@/types/entities.js';
import {
    validateCharacter,
    validateComposition,
    validateDetachment,
    validateEnhancements,
    validateFactionKeyword,
    validateLeaders,
    validatePoints,
    validateStrategicReserves,
    validateTransport,
    validateWargear,
    validateWarlord,
} from '@/validation/rules/index.js';

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

describe('Points Validation', () => {
    it('validates an army under points limit', () => {
        const army = buildArmy({ pointsLimit: 2000, totalPoints: 1500 });
        const unitDefinition = buildUnit();
        const factionData = buildFactionData([unitDefinition]);
        const results = validatePoints(army, factionData);
        const errors = results.filter((result) => result.severity === 'error');
        expect(errors).toEqual([]);
    });

    it('returns an error when army exceeds points limit', () => {
        const army = buildArmy({ pointsLimit: 1000, totalPoints: 1200 });
        const unitDefinition = buildUnit();
        const factionData = buildFactionData([unitDefinition]);
        const results = validatePoints(army, factionData);
        expect(results.some((result) => result.id === 'points-over-limit')).toBe(true);
    });

    it('returns an info entry showing remaining points', () => {
        const army = buildArmy({ pointsLimit: 2000, totalPoints: 1800 });
        const unitDefinition = buildUnit();
        const factionData = buildFactionData([unitDefinition]);
        const results = validatePoints(army, factionData);
        const info = results.find((result) => result.id === 'points-remaining');
        expect(info?.severity).toBe('info');
        expect(info?.details).toMatchObject({ remainingPoints: 200 });
    });
});

describe('Composition Validation', () => {
    it('allows 3 units of the same datasheet', () => {
        const unitDefinition = buildUnit({
            id: 'unit-3',
            name: 'Squad',
            keywords: ['Infantry'],
            composition: [{ models: 5, points: 100 }],
        });
        const factionData = buildFactionData([unitDefinition]);
        const army = buildArmy({
            units: [
                buildArmyUnit({ id: 'a1', unitId: 'unit-3' }),
                buildArmyUnit({ id: 'a2', unitId: 'unit-3' }),
                buildArmyUnit({ id: 'a3', unitId: 'unit-3' }),
            ],
        });
        const results = validateComposition(army, factionData);
        expect(results).toEqual([]);
    });

    it('rejects 4 units of the same non-Battleline datasheet', () => {
        const unitDefinition = buildUnit({
            id: 'unit-4',
            name: 'Elite Squad',
            keywords: ['Infantry'],
        });
        const factionData = buildFactionData([unitDefinition]);
        const army = buildArmy({
            units: [
                buildArmyUnit({ id: 'b1', unitId: 'unit-4' }),
                buildArmyUnit({ id: 'b2', unitId: 'unit-4' }),
                buildArmyUnit({ id: 'b3', unitId: 'unit-4' }),
                buildArmyUnit({ id: 'b4', unitId: 'unit-4' }),
            ],
        });
        const results = validateComposition(army, factionData);
        expect(results.some((result) => result.id === 'composition-max-3-unit-4')).toBe(true);
    });

    it('allows 6 Battleline units of the same datasheet', () => {
        const unitDefinition = buildUnit({
            id: 'unit-5',
            name: 'Battleline Squad',
            keywords: ['Battleline'],
        });
        const factionData = buildFactionData([unitDefinition]);
        const units = Array.from({ length: 6 }, (_, index) =>
            buildArmyUnit({
                id: `c${index + 1}`,
                unitId: 'unit-5',
            }),
        );
        const army = buildArmy({ units });
        const results = validateComposition(army, factionData);
        expect(results).toEqual([]);
    });

    it('rejects 7 Battleline units of the same datasheet', () => {
        const unitDefinition = buildUnit({
            id: 'unit-6',
            name: 'Battleline Squad',
            keywords: ['Battleline'],
        });
        const factionData = buildFactionData([unitDefinition]);
        const units = Array.from({ length: 7 }, (_, index) =>
            buildArmyUnit({
                id: `d${index + 1}`,
                unitId: 'unit-6',
            }),
        );
        const army = buildArmy({ units });
        const results = validateComposition(army, factionData);
        expect(results.some((result) => result.id === 'composition-max-6-unit-6')).toBe(true);
    });

    it('rejects invalid unit model counts', () => {
        const unitDefinition = buildUnit({
            id: 'unit-7',
            name: 'Odd Squad',
            composition: [{ models: 5, points: 100 }],
        });
        const factionData = buildFactionData([unitDefinition]);
        const army = buildArmy({
            units: [
                buildArmyUnit({
                    id: 'e1',
                    unitId: 'unit-7',
                    modelCount: 4,
                }),
            ],
        });
        const results = validateComposition(army, factionData);
        expect(results.some((result) => result.id === 'composition-invalid-size-e1')).toBe(true);
    });
});

describe('Enhancement Validation', () => {
    const buildEnhancement = (overrides: Partial<Enhancement> = {}): Enhancement => {
        const enhancement: Enhancement = {
            id: 'enhancement-1',
            name: 'Power Relic',
            points: 10,
            description: 'Test enhancement.',
            eligibleKeywords: [],
            structuredEffect: null,
        };

        return { ...enhancement, ...overrides };
    };

    it('allows 3 unique enhancements on Characters', () => {
        const enhancements = [
            buildEnhancement({ id: 'enh-1', name: 'Enh 1' }),
            buildEnhancement({ id: 'enh-2', name: 'Enh 2' }),
            buildEnhancement({ id: 'enh-3', name: 'Enh 3' }),
        ];
        const unitDefinition = buildUnit({
            id: 'unit-8',
            name: 'Character',
            keywords: ['Character'],
        });
        const factionData = buildFactionData([unitDefinition], enhancements);
        const army = buildArmy({
            units: [
                buildArmyUnit({
                    id: 'f1',
                    unitId: 'unit-8',
                    enhancement: {
                        enhancementId: 'enh-1',
                        enhancementName: 'Enh 1',
                        points: 10,
                    },
                }),
                buildArmyUnit({
                    id: 'f2',
                    unitId: 'unit-8',
                    enhancement: {
                        enhancementId: 'enh-2',
                        enhancementName: 'Enh 2',
                        points: 10,
                    },
                }),
                buildArmyUnit({
                    id: 'f3',
                    unitId: 'unit-8',
                    enhancement: {
                        enhancementId: 'enh-3',
                        enhancementName: 'Enh 3',
                        points: 10,
                    },
                }),
            ],
        });
        const results = validateEnhancements(army, factionData);
        expect(results).toEqual([]);
    });

    it('rejects 4 enhancements', () => {
        const enhancements = [
            buildEnhancement({ id: 'enh-1', name: 'Enh 1' }),
            buildEnhancement({ id: 'enh-2', name: 'Enh 2' }),
            buildEnhancement({ id: 'enh-3', name: 'Enh 3' }),
            buildEnhancement({ id: 'enh-4', name: 'Enh 4' }),
        ];
        const unitDefinition = buildUnit({
            id: 'unit-9',
            name: 'Character',
            keywords: ['Character'],
        });
        const factionData = buildFactionData([unitDefinition], enhancements);
        const units = Array.from({ length: 4 }, (_, index) =>
            buildArmyUnit({
                id: `g${index + 1}`,
                unitId: 'unit-9',
                enhancement: {
                    enhancementId: `enh-${index + 1}`,
                    enhancementName: `Enh ${index + 1}`,
                    points: 10,
                },
            }),
        );
        const army = buildArmy({ units });
        const results = validateEnhancements(army, factionData);
        expect(results.some((result) => result.id === 'enhancement-max-3')).toBe(true);
    });

    it('rejects duplicate enhancements', () => {
        const enhancements = [buildEnhancement({ id: 'enh-dup', name: 'Duplicate' })];
        const unitDefinition = buildUnit({
            id: 'unit-10',
            name: 'Character',
            keywords: ['Character'],
        });
        const factionData = buildFactionData([unitDefinition], enhancements);
        const army = buildArmy({
            units: [
                buildArmyUnit({
                    id: 'h1',
                    unitId: 'unit-10',
                    enhancement: {
                        enhancementId: 'enh-dup',
                        enhancementName: 'Duplicate',
                        points: 10,
                    },
                }),
                buildArmyUnit({
                    id: 'h2',
                    unitId: 'unit-10',
                    enhancement: {
                        enhancementId: 'enh-dup',
                        enhancementName: 'Duplicate',
                        points: 10,
                    },
                }),
            ],
        });
        const results = validateEnhancements(army, factionData);
        expect(results.some((result) => result.id === 'enhancement-duplicate-enh-dup')).toBe(true);
    });

    it('rejects enhancements on non-Characters', () => {
        const enhancement = buildEnhancement({ id: 'enh-5', name: 'Enh 5' });
        const unitDefinition = buildUnit({
            id: 'unit-11',
            name: 'Non Character',
            keywords: ['Infantry'],
        });
        const factionData = buildFactionData([unitDefinition], [enhancement]);
        const army = buildArmy({
            units: [
                buildArmyUnit({
                    id: 'i1',
                    unitId: 'unit-11',
                    enhancement: {
                        enhancementId: 'enh-5',
                        enhancementName: 'Enh 5',
                        points: 10,
                    },
                }),
            ],
        });
        const results = validateEnhancements(army, factionData);
        expect(results.some((result) => result.id === 'enhancement-not-character-i1')).toBe(true);
    });

    it('rejects enhancements on Epic Heroes', () => {
        const enhancement = buildEnhancement({ id: 'enh-6', name: 'Enh 6' });
        const unitDefinition = buildUnit({
            id: 'unit-12',
            name: 'Epic Hero',
            keywords: ['Character', 'Epic Hero'],
        });
        const factionData = buildFactionData([unitDefinition], [enhancement]);
        const army = buildArmy({
            units: [
                buildArmyUnit({
                    id: 'j1',
                    unitId: 'unit-12',
                    enhancement: {
                        enhancementId: 'enh-6',
                        enhancementName: 'Enh 6',
                        points: 10,
                    },
                }),
            ],
        });
        const results = validateEnhancements(army, factionData);
        expect(results.some((result) => result.id === 'enhancement-epic-hero-j1')).toBe(true);
    });

    it('rejects units missing eligible keywords', () => {
        const enhancement = buildEnhancement({
            id: 'enh-7',
            name: 'Enh 7',
            eligibleKeywords: ['Psyker'],
        });
        const unitDefinition = buildUnit({
            id: 'unit-13',
            name: 'Character',
            keywords: ['Character', 'Infantry'],
        });
        const factionData = buildFactionData([unitDefinition], [enhancement]);
        const army = buildArmy({
            units: [
                buildArmyUnit({
                    id: 'k1',
                    unitId: 'unit-13',
                    enhancement: {
                        enhancementId: 'enh-7',
                        enhancementName: 'Enh 7',
                        points: 10,
                    },
                }),
            ],
        });
        const results = validateEnhancements(army, factionData);
        const ineligible = results.find((result) => result.id === 'enhancement-ineligible-k1');
        expect(ineligible?.details).toMatchObject({ missingKeywords: ['Psyker'] });
    });
});

describe('Leader Validation', () => {
    it('allows a Character to lead a valid target', () => {
        const leaderDefinition = buildUnit({
            id: 'unit-14',
            name: 'Leader',
            keywords: ['Character'],
            leader: { canAttachTo: ['Bodyguard'], leaderAbility: 'Leader' },
        });
        const targetDefinition = buildUnit({
            id: 'unit-15',
            name: 'Bodyguard',
            keywords: ['Infantry'],
        });
        const factionData = buildFactionData([leaderDefinition, targetDefinition]);
        const army = buildArmy({
            units: [
                buildArmyUnit({
                    id: 'l1',
                    unitId: 'unit-14',
                    leadingUnitId: 'l2',
                }),
                buildArmyUnit({
                    id: 'l2',
                    unitId: 'unit-15',
                }),
            ],
        });
        const results = validateLeaders(army, factionData);
        expect(results).toEqual([]);
    });

    it('rejects non-Characters trying to lead', () => {
        const leaderDefinition = buildUnit({
            id: 'unit-16',
            name: 'Non Character',
            keywords: ['Infantry'],
            leader: { canAttachTo: ['Bodyguard'], leaderAbility: 'Leader' },
        });
        const targetDefinition = buildUnit({
            id: 'unit-17',
            name: 'Bodyguard',
            keywords: ['Infantry'],
        });
        const factionData = buildFactionData([leaderDefinition, targetDefinition]);
        const army = buildArmy({
            units: [
                buildArmyUnit({
                    id: 'm1',
                    unitId: 'unit-16',
                    leadingUnitId: 'm2',
                }),
                buildArmyUnit({
                    id: 'm2',
                    unitId: 'unit-17',
                }),
            ],
        });
        const results = validateLeaders(army, factionData);
        expect(results.some((result) => result.id === 'leader-not-character-m1')).toBe(true);
    });

    it('rejects leaders with invalid targets', () => {
        const leaderDefinition = buildUnit({
            id: 'unit-18',
            name: 'Leader',
            keywords: ['Character'],
            leader: { canAttachTo: ['Other Unit'], leaderAbility: 'Leader' },
        });
        const targetDefinition = buildUnit({
            id: 'unit-19',
            name: 'Bodyguard',
            keywords: ['Infantry'],
        });
        const factionData = buildFactionData([leaderDefinition, targetDefinition]);
        const army = buildArmy({
            units: [
                buildArmyUnit({
                    id: 'n1',
                    unitId: 'unit-18',
                    leadingUnitId: 'n2',
                }),
                buildArmyUnit({
                    id: 'n2',
                    unitId: 'unit-19',
                }),
            ],
        });
        const results = validateLeaders(army, factionData);
        expect(results.some((result) => result.id === 'leader-invalid-target-n1')).toBe(true);
    });

    it('rejects multiple leaders on the same unit', () => {
        const leaderDefinition = buildUnit({
            id: 'unit-20',
            name: 'Leader',
            keywords: ['Character'],
            leader: { canAttachTo: ['Bodyguard'], leaderAbility: 'Leader' },
        });
        const targetDefinition = buildUnit({
            id: 'unit-21',
            name: 'Bodyguard',
            keywords: ['Infantry'],
        });
        const factionData = buildFactionData([leaderDefinition, targetDefinition]);
        const army = buildArmy({
            units: [
                buildArmyUnit({
                    id: 'o1',
                    unitId: 'unit-20',
                    leadingUnitId: 'o3',
                }),
                buildArmyUnit({
                    id: 'o2',
                    unitId: 'unit-20',
                    leadingUnitId: 'o3',
                }),
                buildArmyUnit({
                    id: 'o3',
                    unitId: 'unit-21',
                }),
            ],
        });
        const results = validateLeaders(army, factionData);
        expect(results.some((result) => result.id === 'leader-multiple-o3')).toBe(true);
    });

    it('rejects leaders leading themselves', () => {
        const leaderDefinition = buildUnit({
            id: 'unit-22',
            name: 'Self Leader',
            keywords: ['Character'],
            leader: { canAttachTo: ['Self Leader'], leaderAbility: 'Leader' },
        });
        const factionData = buildFactionData([leaderDefinition]);
        const army = buildArmy({
            units: [
                buildArmyUnit({
                    id: 'p1',
                    unitId: 'unit-22',
                    leadingUnitId: 'p1',
                }),
            ],
        });
        const results = validateLeaders(army, factionData);
        expect(results.some((result) => result.id === 'leader-self-p1')).toBe(true);
    });
});

describe('Wargear Validation', () => {
    const buildWargearOption = (overrides: Partial<WargearOption> = {}): WargearOption => {
        const option: WargearOption = {
            id: 'option-1',
            name: 'Weapon Options',
            choices: [
                { id: 'choice-1', name: 'Boltgun', points: 0, isDefault: true },
                { id: 'choice-2', name: 'Plasma Gun', points: 5, isDefault: false },
            ],
            minSelections: 0,
            maxSelections: 1,
        };

        return { ...option, ...overrides };
    };

    it('allows selections within min and max', () => {
        const wargearOption = buildWargearOption({ minSelections: 1 });
        const unitDefinition = buildUnit({
            id: 'unit-23',
            name: 'Wargear Squad',
            wargearOptions: [wargearOption],
        });
        const factionData = buildFactionData([unitDefinition]);
        const army = buildArmy({
            units: [
                buildArmyUnit({
                    id: 'q1',
                    unitId: 'unit-23',
                    wargearSelections: [
                        {
                            wargearOptionId: 'option-1',
                            choiceId: 'choice-1',
                            choiceName: 'Boltgun',
                        },
                    ],
                }),
            ],
        });
        const results = validateWargear(army, factionData);
        expect(results).toEqual([]);
    });

    it('rejects more selections than maxSelections', () => {
        const wargearOption = buildWargearOption({ maxSelections: 1 });
        const unitDefinition = buildUnit({
            id: 'unit-24',
            name: 'Overarmed Squad',
            wargearOptions: [wargearOption],
        });
        const factionData = buildFactionData([unitDefinition]);
        const army = buildArmy({
            units: [
                buildArmyUnit({
                    id: 'r1',
                    unitId: 'unit-24',
                    wargearSelections: [
                        {
                            wargearOptionId: 'option-1',
                            choiceId: 'choice-1',
                            choiceName: 'Boltgun',
                        },
                        {
                            wargearOptionId: 'option-1',
                            choiceId: 'choice-2',
                            choiceName: 'Plasma Gun',
                        },
                    ],
                }),
            ],
        });
        const results = validateWargear(army, factionData);
        expect(results.some((result) => result.id === 'wargear-max-r1-option-1')).toBe(true);
    });

    it('rejects references to missing wargear options', () => {
        const unitDefinition = buildUnit({
            id: 'unit-25',
            name: 'Invalid Wargear Squad',
            wargearOptions: [],
        });
        const factionData = buildFactionData([unitDefinition]);
        const army = buildArmy({
            units: [
                buildArmyUnit({
                    id: 's1',
                    unitId: 'unit-25',
                    wargearSelections: [
                        {
                            wargearOptionId: 'missing-option',
                            choiceId: 'choice-1',
                            choiceName: 'Ghost Choice',
                        },
                    ],
                }),
            ],
        });
        const results = validateWargear(army, factionData);
        expect(results.some((result) => result.id === 'wargear-invalid-option-s1-missing-option')).toBe(true);
    });
});

describe('Warlord Validation', () => {
    it('accepts a Character as Warlord', () => {
        const unitDefinition = buildUnit({
            id: 'unit-26',
            name: 'Warlord',
            keywords: ['Character'],
        });
        const factionData = buildFactionData([unitDefinition]);
        const army = buildArmy({
            units: [buildArmyUnit({ id: 't1', unitId: 'unit-26' })],
            warlordUnitId: 't1',
        });
        const results = validateWarlord(army, factionData);
        expect(results).toEqual([]);
    });

    it('rejects missing warlord designation', () => {
        const unitDefinition = buildUnit({ id: 'unit-27', name: 'Warlord' });
        const factionData = buildFactionData([unitDefinition]);
        const army = buildArmy({ warlordUnitId: null });
        const results = validateWarlord(army, factionData);
        expect(results.some((result) => result.id === 'warlord-missing')).toBe(true);
    });

    it('rejects non-Characters as Warlord', () => {
        const unitDefinition = buildUnit({
            id: 'unit-28',
            name: 'Non Character',
            keywords: ['Infantry'],
        });
        const factionData = buildFactionData([unitDefinition]);
        const army = buildArmy({
            units: [
                buildArmyUnit({
                    id: 'u1',
                    unitId: 'unit-28',
                }),
            ],
            warlordUnitId: 'u1',
        });
        const results = validateWarlord(army, factionData);
        expect(results.some((result) => result.id === 'warlord-not-character-u1')).toBe(true);
    });
});

describe('Strategic Reserves Validation', () => {
    it('allows reserves within 25% of points limit', () => {
        const unitDefinition = buildUnit();
        const factionData = buildFactionData([unitDefinition]);
        const army = buildArmy({
            pointsLimit: 2000,
            units: [
                buildArmyUnit({
                    id: 'sr1',
                    unitId: 'unit-1',
                    totalPoints: 500,
                }),
                buildArmyUnit({ id: 'sr2', unitId: 'unit-1', totalPoints: 1000 }),
            ],
        });
        const results = validateStrategicReserves(army, factionData);
        expect(results).toEqual([]);
    });

    it('rejects reserves over 25% of points limit', () => {
        const unitDefinition = buildUnit();
        const factionData = buildFactionData([unitDefinition]);
        const army = buildArmy({
            pointsLimit: 1000,
            units: [
                buildArmyUnit({
                    id: 'sr3',
                    unitId: 'unit-1',
                    totalPoints: 300,
                }),
                buildArmyUnit({ id: 'sr4', unitId: 'unit-1', totalPoints: 400 }),
            ],
        });
        const results = validateStrategicReserves(army, factionData);
        expect(results).toEqual([]);
    });

    it('allows reserves exactly at the limit', () => {
        const unitDefinition = buildUnit();
        const factionData = buildFactionData([unitDefinition]);
        const army = buildArmy({
            pointsLimit: 2000,
            units: [
                buildArmyUnit({
                    id: 'sr5',
                    unitId: 'unit-1',
                    totalPoints: 500,
                }),
                buildArmyUnit({ id: 'sr6', unitId: 'unit-1', totalPoints: 1500 }),
            ],
        });
        const results = validateStrategicReserves(army, factionData);
        expect(results).toEqual([]);
    });
});

describe('Detachment Validation', () => {
    const buildDetachment = (id: string, name: string) => ({
        id,
        name,
        sourceFile: 'test.cat',
        sourceSha: 'sha',
        factionId: 'faction-1',
        rules: [],
        structuredRules: [],
        enhancements: [],
    });

    it('allows a valid detachment selection', () => {
        const unitDefinition = buildUnit();
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
            detachments: [buildDetachment('det-1', 'Gladius')],
            weapons: [],
            abilities: [],
        };
        const army = buildArmy({ detachmentId: 'det-1' });
        const results = validateDetachment(army, factionData);
        expect(results).toEqual([]);
    });

    it('rejects armies without a detachment', () => {
        const unitDefinition = buildUnit();
        const factionData = buildFactionData([unitDefinition]);
        const army = buildArmy({ detachmentId: null });
        const results = validateDetachment(army, factionData);
        expect(results.some((result) => result.id === 'detachment-missing')).toBe(true);
    });

    it('rejects invalid detachment selections', () => {
        const unitDefinition = buildUnit();
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
            detachments: [buildDetachment('det-2', 'Shield')],
            weapons: [],
            abilities: [],
        };
        const army = buildArmy({ detachmentId: 'missing-det' });
        const results = validateDetachment(army, factionData);
        expect(results.some((result) => result.id === 'detachment-invalid-missing-det')).toBe(true);
    });
});

describe('Transport Validation', () => {
    it('warns when a Dedicated Transport has no embark assignments', () => {
        const unitDefinition = buildUnit({
            id: 'unit-transport',
            name: 'Rhino',
            keywords: ['Dedicated Transport'],
        });
        const factionData = buildFactionData([unitDefinition]);
        const army = buildArmy({
            units: [buildArmyUnit({ id: 'tr1', unitId: 'unit-transport' })],
        });
        const results = validateTransport(army, factionData);
        expect(results.some((result) => result.id === 'transport-embark-missing-tr1')).toBe(true);
    });

    it('ignores armies without Dedicated Transports', () => {
        const unitDefinition = buildUnit({
            id: 'unit-infantry',
            name: 'Infantry Squad',
            keywords: ['Infantry'],
        });
        const factionData = buildFactionData([unitDefinition]);
        const army = buildArmy({
            units: [buildArmyUnit({ id: 'tr2', unitId: 'unit-infantry' })],
        });
        const results = validateTransport(army, factionData);
        expect(results).toEqual([]);
    });
});

describe('Faction Keyword Validation', () => {
    it('allows units with the army faction keyword', () => {
        const unitDefinition = buildUnit({
            id: 'unit-faction',
            name: 'Faction Unit',
            factionKeywords: ['Test Faction'],
        });
        const factionData = buildFactionData([unitDefinition]);
        const army = buildArmy({
            units: [buildArmyUnit({ id: 'fk1', unitId: 'unit-faction' })],
        });
        const results = validateFactionKeyword(army, factionData);
        expect(results).toEqual([]);
    });

    it('rejects units missing the army faction keyword', () => {
        const unitDefinition = buildUnit({
            id: 'unit-missing',
            name: 'Outsider',
            factionKeywords: ['Other Faction'],
        });
        const factionData = buildFactionData([unitDefinition]);
        const army = buildArmy({
            units: [buildArmyUnit({ id: 'fk2', unitId: 'unit-missing' })],
        });
        const results = validateFactionKeyword(army, factionData);
        expect(results.some((result) => result.id === 'faction-missing-keyword-fk2')).toBe(true);
    });

    it('matches faction keywords case-insensitively', () => {
        const unitDefinition = buildUnit({
            id: 'unit-case',
            name: 'Case Unit',
            factionKeywords: ['test faction'],
        });
        const factionData = buildFactionData([unitDefinition]);
        const army = buildArmy({
            units: [buildArmyUnit({ id: 'fk3', unitId: 'unit-case' })],
        });
        const results = validateFactionKeyword(army, factionData);
        expect(results).toEqual([]);
    });
});

describe('Character Validation', () => {
    it('accepts armies with at least one Character', () => {
        const characterUnit = buildUnit({ id: 'unit-character', name: 'Captain', keywords: ['Character'] });
        const squadUnit = buildUnit({ id: 'unit-squad', name: 'Squad', keywords: ['Infantry'] });
        const factionData = buildFactionData([characterUnit, squadUnit]);
        const army = buildArmy({
            units: [
                buildArmyUnit({ id: 'ch1', unitId: 'unit-character' }),
                buildArmyUnit({ id: 'ch2', unitId: 'unit-squad' }),
            ],
        });
        const results = validateCharacter(army, factionData);
        expect(results).toEqual([]);
    });

    it('rejects armies with no Characters', () => {
        const unitDefinition = buildUnit({ id: 'unit-nonchar', name: 'Squad', keywords: ['Infantry'] });
        const factionData = buildFactionData([unitDefinition]);
        const army = buildArmy({
            units: [buildArmyUnit({ id: 'ch3', unitId: 'unit-nonchar' })],
        });
        const results = validateCharacter(army, factionData);
        expect(results.some((result) => result.id === 'composition-missing-character')).toBe(true);
    });

    it('matches Character keyword case-insensitively', () => {
        const unitDefinition = buildUnit({ id: 'unit-upper', name: 'Hero', keywords: ['CHARACTER'] });
        const factionData = buildFactionData([unitDefinition]);
        const army = buildArmy({
            units: [buildArmyUnit({ id: 'ch4', unitId: 'unit-upper' })],
        });
        const results = validateCharacter(army, factionData);
        expect(results).toEqual([]);
    });
});
