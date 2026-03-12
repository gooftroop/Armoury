import { describe, it, expect } from 'vitest';

import type { Army, ArmyUnit } from '@/models/ArmyModel.js';
import type { Unit, WargearOption } from '@/models/UnitModel.js';
import type { Enhancement } from '@/types/entities.js';
import type { ValidationResult } from '@armoury/validation/types';
import { validateArmy } from '@/validation/engine.js';
import { makeArmy } from '../../../e2e/__fixtures__/makeArmy.js';
import { makeFactionData } from '../../../e2e/__fixtures__/makeFactionData.js';
import { makeCoreRules } from '../../../e2e/__fixtures__/makeCoreRules.js';
import { makeIntercessorSquad } from '../../../e2e/__fixtures__/makeIntercessorSquad.js';
import { makeCaptainInTerminatorArmour } from '../../../e2e/__fixtures__/makeCaptainInTerminatorArmour.js';

const buildArmyUnit = (unit: Unit, overrides: Partial<ArmyUnit> = {}): ArmyUnit => {
    const composition = unit.composition[0];
    const base: ArmyUnit = {
        id: `${unit.id}-1`,
        unitId: unit.id,
        modelCount: composition?.models ?? 1,
        totalPoints: composition?.points ?? 0,
        modelConfigs: [],
        wargearSelections: [],
        enhancement: null,
        leadingUnitId: null,
    };

    return { ...base, ...overrides };
};

const buildArmy = (units: ArmyUnit[], overrides: Partial<Army> = {}): Army => {
    const totalPoints = overrides.totalPoints ?? units.reduce((sum, unit) => sum + unit.totalPoints, 0);

    return makeArmy({
        units,
        totalPoints,
        factionId: 'adeptus-astartes',
        ...overrides,
    });
};

const getErrorIds = (army: Army, factionData = makeFactionData()): string[] => {
    const summary = validateArmy(army, factionData, makeCoreRules());

    return summary.results
        .filter((result: ValidationResult) => result.severity === 'error' && !result.passed)
        .map((result: ValidationResult) => result.id);
};

describe('validation integration', () => {
    it('accepts a legal Space Marines army', () => {
        const intercessors = makeIntercessorSquad();
        const captain = makeCaptainInTerminatorArmour();
        const army = buildArmy(
            [buildArmyUnit(intercessors, { id: 'unit-intercessors' }), buildArmyUnit(captain, { id: 'unit-captain' })],
            {
                warlordUnitId: 'unit-captain',
                detachmentId: 'gladius-task-force',
                pointsLimit: 2000,
            },
        );

        const summary = validateArmy(army, makeFactionData(), makeCoreRules());

        expect(summary.isValid).toBe(true);
        expect(summary.errorCount).toBe(0);
    });

    it('flags armies that exceed points limits', () => {
        const intercessors = makeIntercessorSquad();
        const captain = makeCaptainInTerminatorArmour();
        const army = buildArmy(
            [buildArmyUnit(intercessors, { id: 'unit-intercessors' }), buildArmyUnit(captain, { id: 'unit-captain' })],
            {
                pointsLimit: 150,
            },
        );

        const errorIds = getErrorIds(army);

        expect(errorIds).toContain('points-over-limit');
    });

    it('flags invalid unit compositions', () => {
        const intercessors = makeIntercessorSquad();
        const captain = makeCaptainInTerminatorArmour();
        const army = buildArmy(
            [
                buildArmyUnit(intercessors, { id: 'unit-intercessors', modelCount: 7 }),
                buildArmyUnit(captain, { id: 'unit-captain' }),
            ],
            {
                warlordUnitId: 'unit-captain',
            },
        );

        const errorIds = getErrorIds(army);

        expect(errorIds).toContain('composition-invalid-size-unit-intercessors');
    });

    it('flags duplicate enhancements', () => {
        const captain = makeCaptainInTerminatorArmour();
        const enhancement: Enhancement = {
            id: 'heroic-shield',
            name: 'Heroic Shield',
            points: 15,
            description: 'Adds to the bearer’s resilience.',
            eligibleKeywords: ['Character'],
            structuredEffect: null,
        };
        const factionData = makeFactionData({ enhancements: [enhancement] });
        const army = buildArmy(
            [
                buildArmyUnit(captain, {
                    id: 'captain-1',
                    enhancement: {
                        enhancementId: enhancement.id,
                        enhancementName: enhancement.name,
                        points: enhancement.points,
                    },
                }),
                buildArmyUnit(captain, {
                    id: 'captain-2',
                    enhancement: {
                        enhancementId: enhancement.id,
                        enhancementName: enhancement.name,
                        points: enhancement.points,
                    },
                }),
            ],
            {
                warlordUnitId: 'captain-1',
            },
        );

        const errorIds = getErrorIds(army, factionData);

        expect(errorIds).toContain(`enhancement-duplicate-${enhancement.id}`);
    });

    it('flags enhancements on non-Characters', () => {
        const intercessors = makeIntercessorSquad();
        const captain = makeCaptainInTerminatorArmour();
        const enhancement: Enhancement = {
            id: 'field-relic',
            name: 'Field Relic',
            points: 5,
            description: 'A relic carried into battle.',
            eligibleKeywords: [],
            structuredEffect: null,
        };
        const factionData = makeFactionData({ enhancements: [enhancement] });
        const army = buildArmy(
            [
                buildArmyUnit(intercessors, {
                    id: 'unit-intercessors',
                    enhancement: {
                        enhancementId: enhancement.id,
                        enhancementName: enhancement.name,
                        points: enhancement.points,
                    },
                }),
                buildArmyUnit(captain, { id: 'unit-captain' }),
            ],
            {
                warlordUnitId: 'unit-captain',
            },
        );

        const errorIds = getErrorIds(army, factionData);

        expect(errorIds).toContain('enhancement-not-character-unit-intercessors');
    });

    it('flags non-Characters designated as warlord', () => {
        const intercessors = makeIntercessorSquad();
        const captain = makeCaptainInTerminatorArmour();
        const army = buildArmy(
            [buildArmyUnit(intercessors, { id: 'unit-intercessors' }), buildArmyUnit(captain, { id: 'unit-captain' })],
            {
                warlordUnitId: 'unit-intercessors',
            },
        );

        const errorIds = getErrorIds(army);

        expect(errorIds).toContain('warlord-not-character-unit-intercessors');
    });

    it('flags invalid leader attachments', () => {
        const intercessors = makeIntercessorSquad();
        const captain = makeCaptainInTerminatorArmour();
        const army = buildArmy(
            [
                buildArmyUnit(intercessors, { id: 'unit-intercessors' }),
                buildArmyUnit(captain, { id: 'unit-captain', leadingUnitId: 'unit-intercessors' }),
            ],
            {
                warlordUnitId: 'unit-captain',
            },
        );

        const errorIds = getErrorIds(army);

        expect(errorIds).toContain('leader-invalid-target-unit-captain');
    });

    it('flags missing faction keywords', () => {
        const intercessors = makeIntercessorSquad();
        const captain = makeCaptainInTerminatorArmour();
        const outcastIntercessors: Unit = {
            ...intercessors,
            factionKeywords: ['Heretic Astartes'],
        };
        const factionData = makeFactionData({ units: [outcastIntercessors, captain] });
        const army = buildArmy(
            [
                buildArmyUnit(outcastIntercessors, { id: 'unit-outcasts' }),
                buildArmyUnit(captain, { id: 'unit-captain' }),
            ],
            {
                warlordUnitId: 'unit-captain',
            },
        );

        const errorIds = getErrorIds(army, factionData);

        expect(errorIds).toContain('faction-missing-keyword-unit-outcasts');
    });

    it('flags invalid wargear selections', () => {
        const intercessors = makeIntercessorSquad();
        const captain = makeCaptainInTerminatorArmour();
        const wargearOptions: WargearOption[] = [
            {
                id: 'option-1',
                name: 'Weapon Options',
                choices: [{ id: 'choice-1', name: 'Boltgun', points: 0, isDefault: true }],
                minSelections: 0,
                maxSelections: 1,
            },
        ];
        const armedIntercessors: Unit = {
            ...intercessors,
            wargearOptions,
        };
        const factionData = makeFactionData({ units: [armedIntercessors, captain] });
        const army = buildArmy(
            [
                buildArmyUnit(armedIntercessors, {
                    id: 'unit-intercessors',
                    wargearSelections: [
                        {
                            wargearOptionId: 'missing-option',
                            choiceId: 'choice-9',
                            choiceName: 'Ghost Rifle',
                        },
                    ],
                }),
                buildArmyUnit(captain, { id: 'unit-captain' }),
            ],
            {
                warlordUnitId: 'unit-captain',
            },
        );

        const errorIds = getErrorIds(army, factionData);

        expect(errorIds).toContain('wargear-invalid-option-unit-intercessors-missing-option');
    });

    it('flags strategic reserves over the limit', () => {
        const intercessors = makeIntercessorSquad();
        const captain = makeCaptainInTerminatorArmour();
        const army = buildArmy(
            [
                buildArmyUnit(intercessors, {
                    id: 'unit-intercessors',
                    modelCount: 10,
                    totalPoints: 180,
                }),
                buildArmyUnit(captain, { id: 'unit-captain' }),
            ],
            {
                warlordUnitId: 'unit-captain',
                pointsLimit: 600,
            },
        );

        const errorIds = getErrorIds(army);

        expect(errorIds).not.toContain('composition-strategic-reserves-over-limit');
    });

    it('flags invalid detachment selections', () => {
        const intercessors = makeIntercessorSquad();
        const captain = makeCaptainInTerminatorArmour();
        const army = buildArmy(
            [buildArmyUnit(intercessors, { id: 'unit-intercessors' }), buildArmyUnit(captain, { id: 'unit-captain' })],
            {
                warlordUnitId: 'unit-captain',
                detachmentId: 'missing-detachment',
            },
        );

        const errorIds = getErrorIds(army);

        expect(errorIds).toContain('detachment-invalid-missing-detachment');
    });

    it('returns multiple validation errors for a broken army', () => {
        const intercessors = makeIntercessorSquad();
        const captain = makeCaptainInTerminatorArmour();
        const enhancement: Enhancement = {
            id: 'unstable-relic',
            name: 'Unstable Relic',
            points: 10,
            description: 'A dangerous relic.',
            eligibleKeywords: [],
            structuredEffect: null,
        };
        const factionData = makeFactionData({ enhancements: [enhancement] });
        const army = buildArmy(
            [
                buildArmyUnit(intercessors, {
                    id: 'unit-intercessors',
                    modelCount: 7,
                    enhancement: {
                        enhancementId: enhancement.id,
                        enhancementName: enhancement.name,
                        points: enhancement.points,
                    },
                }),
                buildArmyUnit(captain, {
                    id: 'unit-captain',
                    leadingUnitId: 'unit-intercessors',
                }),
            ],
            {
                pointsLimit: 100,
                warlordUnitId: 'unit-intercessors',
                detachmentId: 'missing-detachment',
            },
        );

        const errorIds = getErrorIds(army, factionData);

        expect(errorIds).toEqual(
            expect.arrayContaining([
                'points-over-limit',
                'composition-invalid-size-unit-intercessors',
                'enhancement-not-character-unit-intercessors',
                'leader-invalid-target-unit-captain',
                'warlord-not-character-unit-intercessors',
                'detachment-invalid-missing-detachment',
            ]),
        );
    });
});
