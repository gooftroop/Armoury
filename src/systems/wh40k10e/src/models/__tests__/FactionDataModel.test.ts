import { describe, it, expect } from 'vitest';
import type { FactionData } from '@/models/FactionData.js';
import { hydrateFactionData } from '@/models/FactionData.js';
import { parseFactionData } from '@/data/FactionDataParser.js';
import type {
    BattleScribeCatalogue,
    BattleScribeProfile,
    BattleScribeSelectionEntry,
    BattleScribeRule,
} from '@armoury/providers-bsdata';

/** Builds a minimal BattleScribe profile with characteristics. */
const buildProfile = (id: string, name: string, typeName: string, characteristics: Record<string, string>) => {
    const profile: BattleScribeProfile = {
        '@_id': id,
        '@_name': name,
        '@_typeId': `${id}-type`,
        '@_typeName': typeName,
        characteristics: {
            characteristic: Object.entries(characteristics).map(([key, value]) => ({
                '@_name': key,
                '@_typeId': `${id}-${key}`,
                '#text': value,
            })),
        },
    };

    return profile;
};

/** Builds a minimal unit selection entry for catalogue parsing. */
const buildUnitEntry = (id: string, name: string): BattleScribeSelectionEntry => ({
    '@_id': id,
    '@_name': name,
    '@_type': 'unit',
    profiles: {
        profile: [
            buildProfile(id, name, 'Unit', {
                M: '6"',
                T: '4',
                SV: '3+',
                W: '2',
                LD: '6',
                OC: '1',
            }),
        ],
    },
    categoryLinks: {
        categoryLink: [
            { '@_id': 'cat-1', '@_name': 'Infantry', '@_targetId': 'cat-1' },
            { '@_id': 'cat-2', '@_name': 'Faction: Test Faction', '@_targetId': 'cat-2' },
        ],
    },
});

/** Builds a minimal shared rule entry for faction rules. */
const buildRule = (id: string, name: string): BattleScribeRule => ({
    '@_id': id,
    '@_name': name,
    description: `${name} description`,
});

/** Builds a minimal BattleScribe catalogue for unit parsing tests. */
const buildCatalogue = (): BattleScribeCatalogue => ({
    catalogue: {
        '@_id': 'faction-1',
        '@_name': 'Test Faction',
        '@_revision': '1',
        '@_battleScribeVersion': '2.03',
        '@_gameSystemId': 'gs-1',
        '@_gameSystemRevision': '1',
        selectionEntries: {
            selectionEntry: [buildUnitEntry('unit-1', 'Test Unit')],
        },
        sharedProfiles: {
            profile: [
                buildProfile('weapon-1', 'Boltgun', 'Ranged Weapons', {
                    Range: '24"',
                    A: '2',
                    BS: '3+',
                    S: '4',
                    AP: '0',
                    D: '1',
                    Keywords: 'Assault',
                }),
                buildProfile('ability-1', 'Shielded', 'Abilities', {
                    Description: 'Grants an invulnerable save.',
                }),
                buildProfile('faction-rule-1', 'Faction Rule', 'Faction Rule', {
                    Description: 'Faction rule description.',
                }),
            ],
        },
        sharedRules: {
            rule: [buildRule('rule-1', 'Shared Rule')],
        },
    },
});

/** Describes FactionData construction and serialization. */
describe('FactionData', () => {
    it('creates a plain object with defaults for optional fields', () => {
        const model: FactionData = {
            id: 'faction-1',
            name: 'Test Faction',
            sourceFiles: ['Test.cat'],
            armyImageUrl: '',
            lastSynced: new Date(),
            factionRules: [],
            structuredFactionRules: [],
            stratagems: [],
            detachments: [],
            enhancements: [],
            units: [],
            weapons: [],
            abilities: [],
        };
        expect(model.armyImageUrl).toBe('');
        expect(model.units).toEqual([]);
        expect(model.weapons).toEqual([]);
        expect(model.abilities).toEqual([]);
        expect(model.factionRules).toEqual([]);
    });

    /** Ensures parseFactionData extracts units, weapons, and abilities. */
    it('builds a model from a catalogue', () => {
        const catalogue = buildCatalogue();
        const model = parseFactionData(catalogue, ['Test.cat']);
        expect(model.id).toBe('faction-1');
        expect(model.name).toBe('Test Faction');
        expect(model.sourceFiles).toEqual(['Test.cat']);
        expect(model.units).toHaveLength(1);
        expect(model.weapons.length).toBeGreaterThan(0);
        expect(model.abilities.length).toBeGreaterThan(0);
        expect(model.factionRules.length).toBeGreaterThan(0);
        expect(model.structuredFactionRules.length).toBeGreaterThan(0);
    });

    /** Ensures spreading returns a serializable plain object. */
    it('serializes to JSON with ISO date strings', () => {
        const model: FactionData = {
            id: 'faction-1',
            name: 'Test Faction',
            sourceFiles: ['Test.cat'],
            armyImageUrl: '',
            lastSynced: new Date(),
            factionRules: [],
            structuredFactionRules: [],
            stratagems: [],
            detachments: [],
            enhancements: [],
            units: [],
            weapons: [],
            abilities: [],
        };
        const json = { ...model, lastSynced: model.lastSynced.toISOString() } as Record<string, unknown>;
        expect(json.id).toBe('faction-1');
        expect(typeof json.lastSynced).toBe('string');
    });

    /** Ensures hydrateFactionData hydrates dates and defaults nested arrays. */
    it('hydrates from JSON with defaults for nested arrays', () => {
        const model: FactionData = {
            id: 'faction-1',
            name: 'Test Faction',
            sourceFiles: ['Test.cat'],
            armyImageUrl: '',
            lastSynced: new Date(),
            factionRules: [],
            structuredFactionRules: [],
            stratagems: [],
            detachments: [],
            enhancements: [],
            units: [
                {
                    id: 'unit-1',
                    name: 'Test Unit',
                    sourceFile: 'Test.cat',
                    sourceSha: 'sha',
                    factionId: 'faction-1',
                    movement: '6"',
                    toughness: 4,
                    save: '3+',
                    wounds: 2,
                    leadership: 6,
                    objectiveControl: 1,
                    composition: [],
                    rangedWeapons: [],
                    meleeWeapons: [],
                    wargearOptions: [],
                    wargearAbilities: [],
                    abilities: [],
                    structuredAbilities: [],
                    constraints: [],
                    keywords: [],
                    factionKeywords: [],
                    imageUrl: '',
                },
            ],
            weapons: [],
            abilities: [],
        };
        const json = { ...model, lastSynced: model.lastSynced.toISOString() };
        const hydrated = hydrateFactionData(json);
        expect(hydrated.lastSynced).toBeInstanceOf(Date);
        expect(hydrated.units[0]?.composition).toEqual([]);
        expect(hydrated.units[0]?.wargearOptions).toEqual([]);
        expect(hydrated.units[0]?.imageUrl).toBe('');
    });

    /** Ensures hydrateFactionData supports string timestamps. */
    it('hydrates lastSynced from a string timestamp', () => {
        const json = {
            id: 'faction-1',
            name: 'Test Faction',
            sourceFiles: ['Test.cat'],
            lastSynced: '2024-01-01T00:00:00.000Z',
        };
        const hydrated = hydrateFactionData(json);
        expect(hydrated.lastSynced).toBeInstanceOf(Date);
        expect(hydrated.lastSynced.toISOString()).toBe('2024-01-01T00:00:00.000Z');
    });
});
