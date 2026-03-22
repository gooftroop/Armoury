/**
 * Test Plan for CoreRulesParser.ts
 *
 * Source: src/systems/wh40k10e/src/data/CoreRulesParser.ts
 *
 * @requirements
 * 1. Must parse a BattleScribeGameSystem into a CoreRules plain object.
 *    - Test: parses metadata and returns arrays/source file in the result.
 * 2. Must extract profile types with their characteristic types.
 *    - Test: extracts profile types and nested characteristic type id/name pairs.
 * 3. Must extract cost types with optional default cost limits.
 *    - Test: preserves defaultCostLimit when present and undefined when omitted.
 * 4. Must extract categories from category entries.
 *    - Test: maps category entries to id/name pairs.
 * 5. Must extract shared rules, injecting a synthetic "Save" rule when missing.
 *    - Test: injects synthetic Save when Unit has SV and no save-related shared rule.
 *    - Test: does not inject synthetic Save when save-related shared rule already exists.
 * 6. Must extract roster-level constraints from shared selection entries.
 *    - Test: parses constraints from shared selection entries with source entry metadata.
 * 7. Must set lastSynced to current time and armyImageUrl to empty string.
 *    - Test: uses fake timers to assert deterministic lastSynced.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BattleScribeConstraint, BattleScribeGameSystem } from '@armoury/providers-bsdata';

import { parseCoreRules } from '@/data/CoreRulesParser.js';

type GameSystemOverrides = Partial<BattleScribeGameSystem['gameSystem']>;

const makeGameSystem = (overrides: GameSystemOverrides = {}): BattleScribeGameSystem => {
    return {
        gameSystem: {
            '@_id': 'gs-wh40k-10e',
            '@_name': 'Warhammer 40,000 10th Edition',
            '@_revision': '57',
            '@_battleScribeVersion': '2.03',
            ...overrides,
        },
    };
};

const makeConstraint = (overrides: Partial<BattleScribeConstraint> = {}): BattleScribeConstraint => {
    return {
        '@_id': 'constraint-max-3',
        '@_name': 'Max Three',
        '@_type': 'max',
        '@_value': '3',
        '@_field': 'selections',
        '@_scope': 'roster',
        ...overrides,
    };
};

describe('parseCoreRules', () => {
    beforeEach(() => {
        vi.useRealTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('REQ-1: parses BattleScribeGameSystem into CoreRules metadata and plain arrays', () => {
        const parsed = parseCoreRules(makeGameSystem(), '/data/wh40k10e.gst');

        expect(parsed.id).toBe('gs-wh40k-10e');
        expect(parsed.name).toBe('Warhammer 40,000 10th Edition');
        expect(parsed.revision).toBe('57');
        expect(parsed.battleScribeVersion).toBe('2.03');
        expect(parsed.sourceFile).toBe('/data/wh40k10e.gst');
        expect(parsed.profileTypes).toEqual([]);
        expect(parsed.costTypes).toEqual([]);
        expect(parsed.categories).toEqual([]);
        expect(parsed.sharedRules).toEqual([]);
        expect(parsed.constraints).toEqual([]);
    });

    it('REQ-2: extracts profile types and characteristic types', () => {
        const gameSystem = makeGameSystem({
            profileTypes: {
                profileType: [
                    {
                        '@_id': 'pt-unit',
                        '@_name': 'Unit',
                        characteristicTypes: {
                            characteristicType: [
                                { '@_id': 'ct-m', '@_name': 'M' },
                                { '@_id': 'ct-sv', '@_name': 'SV' },
                            ],
                        },
                    },
                    {
                        '@_id': 'pt-abilities',
                        '@_name': 'Abilities',
                        characteristicTypes: {
                            characteristicType: { '@_id': 'ct-desc', '@_name': 'Description' },
                        },
                    },
                ],
            },
        });

        const parsed = parseCoreRules(gameSystem, '/data/wh40k10e.gst');

        expect(parsed.profileTypes).toEqual([
            {
                id: 'pt-unit',
                name: 'Unit',
                characteristicTypes: [
                    { id: 'ct-m', name: 'M' },
                    { id: 'ct-sv', name: 'SV' },
                ],
            },
            {
                id: 'pt-abilities',
                name: 'Abilities',
                characteristicTypes: [{ id: 'ct-desc', name: 'Description' }],
            },
        ]);
    });

    it('REQ-3: extracts cost types and optional defaultCostLimit', () => {
        const gameSystem = makeGameSystem({
            costTypes: {
                costType: [
                    { '@_id': 'cost-pts', '@_name': 'pts', '@_defaultCostLimit': '2000' },
                    { '@_id': 'cost-pl', '@_name': 'PL' },
                ],
            },
        });

        const parsed = parseCoreRules(gameSystem, '/data/wh40k10e.gst');

        expect(parsed.costTypes).toEqual([
            { id: 'cost-pts', name: 'pts', defaultCostLimit: '2000' },
            { id: 'cost-pl', name: 'PL', defaultCostLimit: undefined },
        ]);
    });

    it('REQ-4: extracts categories from category entries', () => {
        const gameSystem = makeGameSystem({
            categoryEntries: {
                categoryEntry: [
                    { '@_id': 'cat-hq', '@_name': 'HQ' },
                    { '@_id': 'cat-troops', '@_name': 'Troops' },
                ],
            },
        });

        const parsed = parseCoreRules(gameSystem, '/data/wh40k10e.gst');

        expect(parsed.categories).toEqual([
            { id: 'cat-hq', name: 'HQ' },
            { id: 'cat-troops', name: 'Troops' },
        ]);
    });

    it('REQ-5: injects synthetic Save when missing and Unit has save characteristic', () => {
        const gameSystem = makeGameSystem({
            profileTypes: {
                profileType: {
                    '@_id': 'pt-unit',
                    '@_name': 'Unit',
                    characteristicTypes: {
                        characteristicType: [
                            { '@_id': 'ct-m', '@_name': 'M' },
                            { '@_id': 'ct-sv', '@_name': 'SV' },
                        ],
                    },
                },
            },
            sharedRules: {
                rule: {
                    '@_id': 'rule-fnp',
                    '@_name': 'Feel No Pain',
                    description: 'Roll to ignore wounds.',
                },
            },
        });

        const parsed = parseCoreRules(gameSystem, '/data/wh40k10e.gst');

        expect(parsed.sharedRules).toEqual(
            expect.arrayContaining([
                { id: 'rule-fnp', name: 'Feel No Pain', description: 'Roll to ignore wounds.' },
                { id: 'core:save', name: 'Save', description: 'Save characteristic (SV).' },
            ]),
        );
    });

    it('REQ-5: does not inject synthetic Save when a save-related shared rule already exists', () => {
        const gameSystem = makeGameSystem({
            profileTypes: {
                profileType: {
                    '@_id': 'pt-unit',
                    '@_name': 'Unit',
                    characteristicTypes: {
                        characteristicType: { '@_id': 'ct-save', '@_name': 'Save' },
                    },
                },
            },
            sharedRules: {
                rule: {
                    '@_id': 'rule-invuln-save',
                    '@_name': 'Invulnerable Save',
                    description: 'This model has a 4+ invulnerable save.',
                },
            },
        });

        const parsed = parseCoreRules(gameSystem, '/data/wh40k10e.gst');
        const saveRules = parsed.sharedRules.filter((rule) => rule.name.toLowerCase().includes('save'));

        expect(saveRules).toHaveLength(1);
        expect(saveRules[0]).toEqual({
            id: 'rule-invuln-save',
            name: 'Invulnerable Save',
            description: 'This model has a 4+ invulnerable save.',
        });
    });

    it('REQ-6: extracts roster-level constraints from shared selection entries', () => {
        const gameSystem = makeGameSystem({
            sharedSelectionEntries: {
                selectionEntry: [
                    {
                        '@_id': 'entry-battleline',
                        '@_name': 'Battleline',
                        '@_type': 'unit',
                        constraints: {
                            constraint: makeConstraint({
                                '@_id': 'constraint-min-battleline',
                                '@_type': 'min',
                                '@_value': '1',
                            }),
                        },
                    },
                    {
                        '@_id': 'entry-epic-hero',
                        '@_name': 'Epic Hero',
                        '@_type': 'unit',
                        constraints: {
                            constraint: makeConstraint({
                                '@_id': 'constraint-max-epic-hero',
                                '@_type': 'max',
                                '@_value': '1',
                            }),
                        },
                    },
                ],
            },
        });

        const parsed = parseCoreRules(gameSystem, '/data/wh40k10e.gst');

        expect(parsed.constraints).toEqual(
            expect.arrayContaining([
                {
                    id: 'constraint-min-battleline',
                    constraintType: 'min',
                    value: 1,
                    field: 'selections',
                    scope: 'roster',
                    sourceEntryId: 'entry-battleline',
                    sourceEntryName: 'Battleline',
                },
                {
                    id: 'constraint-max-epic-hero',
                    constraintType: 'max',
                    value: 1,
                    field: 'selections',
                    scope: 'roster',
                    sourceEntryId: 'entry-epic-hero',
                    sourceEntryName: 'Epic Hero',
                },
            ]),
        );
    });

    it('REQ-7: sets lastSynced to current time', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-02-01T12:00:00.000Z'));

        const parsed = parseCoreRules(makeGameSystem(), '/data/wh40k10e.gst');

        expect(parsed.lastSynced).toEqual(new Date('2026-02-01T12:00:00.000Z'));
    });
});
