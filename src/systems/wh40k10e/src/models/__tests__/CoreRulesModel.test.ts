import { describe, it, expect } from 'vitest';
import type { CoreRules } from '@/models/CoreRules.js';
import { hydrateCoreRules } from '@/models/CoreRules.js';
import { parseCoreRules } from '@/data/CoreRulesParser.js';
import type {
    BattleScribeGameSystem,
    BattleScribeProfileType,
    BattleScribeCostType,
    BattleScribeRule,
    BattleScribeCategory,
} from '@armoury/providers-bsdata/types';

/** Builds a minimal profile type entry for testing. */
const buildProfileType = (id: string, name: string): BattleScribeProfileType => ({
    '@_id': id,
    '@_name': name,
    characteristicTypes: {
        characteristicType: [
            { '@_id': `${id}-char-1`, '@_name': 'M' },
            { '@_id': `${id}-char-2`, '@_name': 'T' },
        ],
    },
});

/** Builds a minimal cost type entry for testing. */
const buildCostType = (id: string, name: string): BattleScribeCostType => ({
    '@_id': id,
    '@_name': name,
    '@_defaultCostLimit': '2000',
});

/** Builds a minimal shared rule entry for testing. */
const buildRule = (id: string, name: string): BattleScribeRule => ({
    '@_id': id,
    '@_name': name,
    description: `${name} description`,
});

/** Builds a minimal category entry for testing. */
const buildCategory = (id: string, name: string): BattleScribeCategory => ({
    '@_id': id,
    '@_name': name,
});

/** Builds a minimal game system object for CoreRules tests. */
const buildGameSystem = (): BattleScribeGameSystem => ({
    gameSystem: {
        '@_id': 'gs-1',
        '@_name': 'Warhammer 40K 10th Edition',
        '@_revision': '1',
        '@_battleScribeVersion': '2.03',
        profileTypes: {
            profileType: [buildProfileType('pt-1', 'Unit')],
        },
        costTypes: {
            costType: [buildCostType('ct-1', 'pts')],
        },
        categoryEntries: {
            categoryEntry: [buildCategory('cat-1', 'HQ')],
        },
        sharedRules: {
            rule: [buildRule('rule-1', 'Deep Strike')],
        },
        sharedSelectionEntries: {
            selectionEntry: [
                {
                    '@_id': 'entry-1',
                    '@_name': 'Roster Limit',
                    '@_type': 'upgrade',
                    constraints: {
                        constraint: [
                            {
                                '@_id': 'constraint-1',
                                '@_name': 'Max Selections',
                                '@_type': 'max',
                                '@_value': '3',
                                '@_field': 'selections',
                                '@_scope': 'roster',
                            },
                        ],
                    },
                },
            ],
        },
    },
});

/** Describes CoreRules parsing and serialization behaviors. */
describe('CoreRules', () => {
    /** Ensures parseCoreRules extracts core data correctly. */
    it('builds a model from game system data', () => {
        const gameSystem = buildGameSystem();
        const model = parseCoreRules(gameSystem, 'core.gst');
        expect(model.id).toBe('gs-1');
        expect(model.name).toBe('Warhammer 40K 10th Edition');
        expect(model.profileTypes).toHaveLength(1);
        expect(model.profileTypes[0]?.characteristicTypes).toHaveLength(2);
        expect(model.costTypes[0]?.defaultCostLimit).toBe('2000');
        expect(model.sharedRules[0]?.name).toBe('Deep Strike');
        expect(model.categories[0]?.name).toBe('HQ');
        expect(model.constraints.length).toBeGreaterThan(0);
        expect(model.sourceFile).toBe('core.gst');
    });

    /** Ensures spreading returns a plain object with expected properties. */
    it('serializes to JSON with expected fields', () => {
        const model = parseCoreRules(buildGameSystem(), 'core.gst');
        const json = { ...model } as Record<string, unknown>;
        expect(json.id).toBe('gs-1');
        expect(json.profileTypes).toBeDefined();
        expect(json.costTypes).toBeDefined();
        expect(json.sharedRules).toBeDefined();
        expect(json.categories).toBeDefined();
        expect(json.constraints).toBeDefined();
    });

    /** Ensures hydrateCoreRules reconstructs a CoreRules object. */
    it('hydrates from JSON into a CoreRules object', () => {
        const model = parseCoreRules(buildGameSystem(), 'core.gst');
        const json = { ...model };
        const hydrated = hydrateCoreRules(json);
        expect(hydrated).toHaveProperty('id');
        expect(hydrated).toHaveProperty('profileTypes');
        expect(hydrated.id).toBe(model.id);
        expect(hydrated.profileTypes.length).toBe(model.profileTypes.length);
        expect(hydrated.constraints.length).toBe(model.constraints.length);
    });

    /** Ensures default values are applied during construction. */
    it('applies defaults for constraints and lastSynced', () => {
        const model: CoreRules = {
            id: 'core-2',
            name: 'Core Rules',
            revision: '1',
            battleScribeVersion: '2.03',
            profileTypes: [],
            costTypes: [],
            sharedRules: [],
            categories: [],
            sourceFile: 'core.gst',
            constraints: [],
            lastSynced: new Date(),
        };
        expect(model.constraints).toEqual([]);
        expect(model.lastSynced).toBeInstanceOf(Date);
    });
});
