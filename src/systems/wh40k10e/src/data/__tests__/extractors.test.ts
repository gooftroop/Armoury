import { describe, it, expect } from 'vitest';
import { extractUnits, extractWeapons, extractAbilities } from '@/data/extractors.js';
import type {
    BattleScribeCatalogue,
    BattleScribeProfile,
    BattleScribeSelectionEntry,
} from '@armoury/providers-bsdata/types';

/**
 * Builds a minimal BattleScribe profile with characteristics.
 * Helper function to create test fixtures for profile-based data.
 */
const buildProfile = (
    id: string,
    name: string,
    typeName: string,
    characteristics: Record<string, string>,
): BattleScribeProfile => ({
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
});

/**
 * Builds a minimal unit selection entry with unit profile and category links.
 * Used as test fixture for unit extraction tests.
 */
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
                LD: '6+',
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

/**
 * Builds a minimal BattleScribe catalogue for testing extractors.
 * Contains minimal required fields to test extraction logic.
 */
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
                buildProfile('weapon-2', 'Chainsword', 'Melee Weapons', {
                    A: '3',
                    WS: '3+',
                    S: '4',
                    AP: '0',
                    D: '1',
                    Keywords: '-',
                }),
                buildProfile('ability-1', 'Shielded', 'Abilities', {
                    Description: 'Grants a 4+ invulnerable save.',
                }),
            ],
        },
    },
});

/**
 * Builds an empty catalogue with no selection entries or profiles.
 * Used to test empty input handling.
 */
const buildEmptyCatalogue = (): BattleScribeCatalogue => ({
    catalogue: {
        '@_id': 'empty-1',
        '@_name': 'Empty Catalogue',
        '@_revision': '1',
        '@_battleScribeVersion': '2.03',
        '@_gameSystemId': 'gs-1',
        '@_gameSystemRevision': '1',
    },
});

/** Describes extractor function behaviors. */
describe('extractors', () => {
    /** Tests extractUnits() with valid catalogue data. */
    describe('extractUnits', () => {
        /** Ensures extractUnits returns units from catalogue selection entries. */
        it('extracts units from selection entries', () => {
            const catalogue = buildCatalogue();
            const units = extractUnits(catalogue, 'test.cat', 'sha-123');

            expect(units).toHaveLength(1);
            expect(units[0]?.id).toBe('unit-1');
            expect(units[0]?.name).toBe('Test Unit');
            expect(units[0]?.sourceFile).toBe('test.cat');
            expect(units[0]?.sourceSha).toBe('sha-123');
            expect(units[0]?.factionId).toBe('faction-1');
            expect(units[0]?.movement).toBe('6"');
            expect(units[0]?.toughness).toBe(4);
            expect(units[0]?.save).toBe('3+');
            expect(units[0]?.wounds).toBe(2);
            expect(units[0]?.leadership).toBe(6);
            expect(units[0]?.objectiveControl).toBe(1);
        });

        /** Ensures extractUnits handles empty input by returning empty array. */
        it('returns empty array for empty catalogue', () => {
            const catalogue = buildEmptyCatalogue();
            const units = extractUnits(catalogue, 'empty.cat', 'sha-456');

            expect(units).toEqual([]);
        });

        /** Ensures extractUnits extracts unit keywords correctly. */
        it('extracts unit keywords from category links', () => {
            const catalogue = buildCatalogue();
            const units = extractUnits(catalogue, 'test.cat', 'sha-123');

            expect(units[0]?.keywords).toContain('Infantry');
            expect(units[0]?.keywords).not.toContain('Faction: Test Faction');
        });

        /** Ensures extractUnits extracts faction keywords correctly. */
        it('extracts faction keywords from category links', () => {
            const catalogue = buildCatalogue();
            const units = extractUnits(catalogue, 'test.cat', 'sha-123');

            expect(units[0]?.factionKeywords).toContain('Test Faction');
        });
    });

    /** Tests extractWeapons() with valid catalogue data. */
    describe('extractWeapons', () => {
        /** Ensures extractWeapons returns weapons from shared profiles. */
        it('extracts weapons from shared profiles', () => {
            const catalogue = buildCatalogue();
            const weapons = extractWeapons(catalogue, 'test.cat', 'sha-123');

            expect(weapons.length).toBeGreaterThanOrEqual(2);
            const boltgun = weapons.find((w) => w.name === 'Boltgun');
            const chainsword = weapons.find((w) => w.name === 'Chainsword');

            expect(boltgun).toBeDefined();
            expect(boltgun?.type).toBe('ranged');
            expect(chainsword).toBeDefined();
            expect(chainsword?.type).toBe('melee');
        });

        /** Ensures extractWeapons correctly identifies ranged weapon characteristics. */
        it('extracts ranged weapon characteristics', () => {
            const catalogue = buildCatalogue();
            const weapons = extractWeapons(catalogue, 'test.cat', 'sha-123');
            const boltgun = weapons.find((w) => w.name === 'Boltgun');

            expect(boltgun?.type).toBe('ranged');

            if (boltgun?.type === 'ranged') {
                expect(boltgun.range).toBe('24"');
                expect(boltgun.attacks).toBe('2');
                expect(boltgun.skill).toBe('3+');
                expect(boltgun.strength).toBe(4);
                expect(boltgun.ap).toBe(0);
                expect(boltgun.damage).toBe('1');
                expect(boltgun.keywords).toContain('Assault');
            }
        });

        /** Ensures extractWeapons correctly identifies melee weapon characteristics. */
        it('extracts melee weapon characteristics', () => {
            const catalogue = buildCatalogue();
            const weapons = extractWeapons(catalogue, 'test.cat', 'sha-123');
            const chainsword = weapons.find((w) => w.name === 'Chainsword');

            expect(chainsword?.type).toBe('melee');

            if (chainsword?.type === 'melee') {
                expect(chainsword.attacks).toBe('3');
                expect(chainsword.skill).toBe('3+');
                expect(chainsword.strength).toBe(4);
                expect(chainsword.ap).toBe(0);
                expect(chainsword.damage).toBe('1');
                expect(chainsword.keywords).toEqual([]);
            }
        });

        /** Ensures extractWeapons handles empty input by returning empty array. */
        it('returns empty array for empty catalogue', () => {
            const catalogue = buildEmptyCatalogue();
            const weapons = extractWeapons(catalogue, 'empty.cat', 'sha-456');

            expect(weapons).toEqual([]);
        });
    });

    /** Tests extractAbilities() with valid catalogue data. */
    describe('extractAbilities', () => {
        /** Ensures extractAbilities returns abilities from shared profiles. */
        it('extracts abilities from shared profiles', () => {
            const catalogue = buildCatalogue();
            const abilities = extractAbilities(catalogue, 'test.cat', 'sha-123');

            expect(abilities).toHaveLength(1);
            expect(abilities[0]?.id).toBe('ability-1');
            expect(abilities[0]?.name).toBe('Shielded');
            expect(abilities[0]?.description).toBe('Grants a 4+ invulnerable save.');
            expect(abilities[0]?.sourceFile).toBe('test.cat');
            expect(abilities[0]?.sourceSha).toBe('sha-123');
        });

        /** Ensures extractAbilities handles empty input by returning empty array. */
        it('returns empty array for empty catalogue', () => {
            const catalogue = buildEmptyCatalogue();
            const abilities = extractAbilities(catalogue, 'empty.cat', 'sha-456');

            expect(abilities).toEqual([]);
        });

        /** Ensures extractAbilities filters non-ability profiles correctly. */
        it('filters non-ability profiles', () => {
            const catalogue = buildCatalogue();
            const abilities = extractAbilities(catalogue, 'test.cat', 'sha-123');

            const weaponNames = ['Boltgun', 'Chainsword'];

            for (const ability of abilities) {
                expect(weaponNames).not.toContain(ability.name);
            }
        });
    });
});
