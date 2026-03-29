/**
 * Test Plan for FactionDataParser.ts
 *
 * Source: src/systems/wh40k10e/src/data/FactionDataParser.ts
 *
 * Requirement 1 (REQ-1): Parse a BattleScribeCatalogue into a FactionData plain object
 *   - Test: parses catalogue metadata and returns plain object structure
 *
 * Requirement 2 (REQ-2): Extract all unit datasheets with profiles, abilities, keywords, and composition
 *   - Test: extracts unit stats, abilities, leader info, keywords, composition, and constraints
 *
 * Requirement 3 (REQ-3): Extract weapons (ranged and melee) with parsed keywords
 *   - Test: extracts ranged + melee weapons and parses keyword tokens into structured keywords
 *
 * Requirement 4 (REQ-4): Extract shared abilities from shared profiles
 *   - Test: extracts shared ability profiles into faction abilities array
 *
 * Requirement 5 (REQ-5): Extract faction rules from shared rules and shared profiles
 *   - Test: merges faction rules from sharedRules + shared ability/faction-rule profiles
 *
 * Requirement 6 (REQ-6): Extract stratagems, detachments, and enhancements from selection entry trees
 *   - Test: traverses shared selection entry group tree and extracts detachment-linked entities
 *
 * Requirement 7 (REQ-7): Populate structured rules and parsed weapon keywords for validation
 *   - Test: populates structuredFactionRules, detachment structuredRules, enhancement structuredEffect, and parsedKeywords
 *
 * Requirement 8 (REQ-8): Set lastSynced to current time and armyImageUrl to empty string
 *   - Test: uses fake timers to assert deterministic lastSynced and empty armyImageUrl
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
    BattleScribeCatalogue,
    BattleScribeCharacteristic,
    BattleScribeProfile,
    BattleScribeSelectionEntry,
} from '@armoury/providers-bsdata';
import { parseFactionData } from '@/data/FactionDataParser.js';

const buildCharacteristic = (name: string, value: string): BattleScribeCharacteristic => ({
    '@_name': name,
    '@_typeId': `${name.toLowerCase()}-type`,
    '#text': value,
});

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
        characteristic: Object.entries(characteristics).map(([characteristicName, characteristicValue]) =>
            buildCharacteristic(characteristicName, characteristicValue),
        ),
    },
});

const buildUnitEntry = (): BattleScribeSelectionEntry => ({
    '@_id': 'unit-intercessors',
    '@_name': 'Intercessor Squad',
    '@_type': 'unit',
    profiles: {
        profile: [
            buildProfile('profile-unit', 'Intercessor Squad', 'Unit', {
                M: '6"',
                T: '4',
                SV: '3+',
                W: '2',
                LD: '6+',
                OC: '2',
                INV: '5+',
            }),
            buildProfile('profile-leader', 'Leader', 'Abilities', {
                Description: 'This unit can be attached to an Intercessor Squad.',
            }),
            buildProfile('profile-wargear-ability', 'Bolt Discipline', 'Wargear Abilities', {
                Description: "Improve this unit's ranged attacks.",
            }),
            buildProfile('profile-ranged', 'Bolt Rifle', 'Ranged Weapons', {
                Range: '24"',
                A: '2',
                BS: '3+',
                S: '4',
                AP: '-1',
                D: '1',
                Keywords: 'Assault, Heavy, Anti-Infantry 4+',
            }),
        ],
    },
    selectionEntries: {
        selectionEntry: {
            '@_id': 'unit-melee-choice',
            '@_name': 'Power Sword',
            '@_type': 'upgrade',
            profiles: {
                profile: buildProfile('profile-melee', 'Power Sword', 'Melee Weapons', {
                    A: '4',
                    WS: '3+',
                    S: '5',
                    AP: '-2',
                    D: '2',
                    Keywords: 'Lethal Hits',
                }),
            },
        },
    },
    categoryLinks: {
        categoryLink: [
            {
                '@_id': 'cat-infantry',
                '@_name': 'Infantry',
                '@_targetId': 'cat-infantry',
            },
            {
                '@_id': 'cat-config',
                '@_name': 'Configuration',
                '@_targetId': 'cat-config',
            },
            {
                '@_id': 'cat-leader-target',
                '@_name': 'Leader: Intercessor Squad',
                '@_targetId': 'cat-leader-target',
            },
            {
                '@_id': 'cat-faction',
                '@_name': 'Faction: Adeptus Astartes',
                '@_targetId': 'cat-faction',
            },
        ],
    },
    constraints: {
        constraint: [
            {
                '@_id': 'constraint-min',
                '@_name': 'Minimum Models',
                '@_type': 'min',
                '@_value': '5',
                '@_field': 'selections',
                '@_scope': 'self',
            },
            {
                '@_id': 'constraint-max',
                '@_name': 'Maximum Models',
                '@_type': 'max',
                '@_value': '10',
                '@_field': 'selections',
                '@_scope': 'self',
            },
            {
                '@_id': 'constraint-increment',
                '@_name': 'Model Step',
                '@_type': 'increment',
                '@_value': '5',
                '@_field': 'selections',
                '@_scope': 'self',
            },
        ],
    },
    costs: {
        cost: {
            '@_name': 'pts',
            '@_typeId': 'points-type',
            '@_value': '100',
        },
    },
});

const buildDetachmentTree = (): BattleScribeSelectionEntry => ({
    '@_id': 'detachment-anvil',
    '@_name': 'Anvil Detachment',
    '@_type': 'detachment',
    profiles: {
        profile: [
            buildProfile('detachment-rule-1', 'Anvil Rule', 'Detachment Rule', {
                Description: 'Each time this unit is selected to shoot, it has Stealth.',
            }),
            buildProfile('stratagem-1', 'Reactive Volley', 'Stratagem', {
                CP: '1',
                Phase: 'Shooting',
                Description: 'Use in your Shooting phase. Improve hit rolls by 1.',
            }),
        ],
    },
    selectionEntries: {
        selectionEntry: {
            '@_id': 'enhancement-1',
            '@_name': 'Adaptive Tactics Enhancement',
            '@_type': 'enhancement',
            costs: {
                cost: {
                    '@_name': 'pts',
                    '@_typeId': 'points-type',
                    '@_value': '25',
                },
            },
            profiles: {
                profile: buildProfile('enhancement-profile-1', 'Adaptive Tactics', 'Abilities', {
                    Description: 'Bearer gains Stealth.',
                }),
            },
        },
    },
});

const buildCatalogueFixture = (): BattleScribeCatalogue => ({
    catalogue: {
        '@_id': 'faction-adeptus-astartes',
        '@_name': 'Adeptus Astartes',
        '@_revision': '1',
        '@_battleScribeVersion': '2.03',
        '@_gameSystemId': 'wh40k-10e',
        '@_gameSystemRevision': '1',
        selectionEntries: {
            selectionEntry: buildUnitEntry(),
        },
        sharedProfiles: {
            profile: [
                buildProfile('shared-ability-stealth', 'Stealth', 'Abilities', {
                    Description: 'Harder to hit at range.',
                }),
                buildProfile('shared-faction-rule-1', 'Oath of Moment', 'Faction Rule', {
                    Description: 'Re-roll Hit rolls of 1.',
                }),
                buildProfile('shared-ranged-weapon', 'Storm Bolter', 'Ranged Weapons', {
                    Range: '24"',
                    A: '2',
                    BS: '3+',
                    S: '4',
                    AP: '0',
                    D: '1',
                    Keywords: 'Rapid Fire 2',
                }),
            ],
        },
        sharedRules: {
            rule: {
                '@_id': 'shared-rule-1',
                '@_name': 'Army Rule',
                description: 'Units in this army gain Objective Secured.',
            },
        },
        sharedSelectionEntryGroups: {
            selectionEntryGroup: {
                '@_id': 'group-detachments',
                '@_name': 'Detachments',
                selectionEntries: {
                    selectionEntry: buildDetachmentTree(),
                },
            },
        },
    },
});

const buildEmptyCatalogueFixture = (): BattleScribeCatalogue => ({
    catalogue: {
        '@_id': 'empty-faction',
        '@_name': 'Empty Faction',
        '@_revision': '1',
        '@_battleScribeVersion': '2.03',
        '@_gameSystemId': 'wh40k-10e',
        '@_gameSystemRevision': '1',
    },
});

describe('parseFactionData', () => {
    beforeEach(() => {
        vi.useRealTimers();
    });

    it('REQ-1 and REQ-8: parses catalogue metadata into plain object and sets deterministic sync metadata', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-05T10:00:00.000Z'));

        const result = parseFactionData(buildCatalogueFixture(), ['core.cat', 'adeptus-astartes.cat']);

        expect(result.id).toBe('faction-adeptus-astartes');
        expect(result.name).toBe('Adeptus Astartes');
        expect(result.sourceFiles).toEqual(['core.cat', 'adeptus-astartes.cat']);
        expect(result.armyImageUrl).toBe('');
        expect(result.lastSynced).toEqual(new Date('2026-01-05T10:00:00.000Z'));
        expect(Array.isArray(result.units)).toBe(true);
        expect(Array.isArray(result.weapons)).toBe(true);
        expect(Array.isArray(result.abilities)).toBe(true);
    });

    it('REQ-2: extracts unit datasheet profiles, abilities, keywords, composition, and constraints', () => {
        const result = parseFactionData(buildCatalogueFixture(), ['adeptus-astartes.cat']);
        const unit = result.units[0];

        expect(result.units).toHaveLength(1);
        expect(unit?.id).toBe('unit-intercessors');
        expect(unit?.name).toBe('Intercessor Squad');
        expect(unit?.movement).toBe('6"');
        expect(unit?.toughness).toBe(4);
        expect(unit?.save).toBe('3+');
        expect(unit?.wounds).toBe(2);
        expect(unit?.leadership).toBe(6);
        expect(unit?.objectiveControl).toBe(2);
        expect(unit?.invulnerableSave).toBe('5+');
        expect(unit?.abilities.map((ability) => ability.name)).toContain('Leader');
        expect(unit?.leader?.canAttachTo).toEqual(['Intercessor Squad']);
        expect(unit?.leader?.leaderAbility).toContain('attached');
        expect(unit?.keywords).toEqual(expect.arrayContaining(['Infantry', 'Leader: Intercessor Squad']));
        expect(unit?.keywords).not.toContain('Configuration');
        expect(unit?.factionKeywords).toEqual(['Adeptus Astartes']);
        expect(unit?.composition).toEqual([
            { models: 5, points: 100 },
            { models: 10, points: 100 },
        ]);
        expect(unit?.constraints).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ constraintType: 'min', value: 5 }),
                expect.objectContaining({ constraintType: 'max', value: 10 }),
                expect.objectContaining({ constraintType: 'increment', value: 5 }),
            ]),
        );
    });

    it('REQ-3: extracts ranged and melee weapons with parsed keyword structures', () => {
        const result = parseFactionData(buildCatalogueFixture(), ['adeptus-astartes.cat']);
        const boltRifle = result.weapons.find((weapon) => weapon.name === 'Bolt Rifle');
        const powerSword = result.weapons.find((weapon) => weapon.name === 'Power Sword');

        expect(boltRifle?.type).toBe('ranged');
        expect(boltRifle?.keywords).toEqual(['Assault', 'Heavy', 'Anti-Infantry 4+']);
        expect(boltRifle?.parsedKeywords).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ type: 'assault' }),
                expect.objectContaining({ type: 'heavy' }),
                expect.objectContaining({ type: 'anti', targetKeyword: 'Infantry', threshold: 4 }),
            ]),
        );

        expect(powerSword?.type).toBe('melee');
        expect(powerSword?.parsedKeywords).toEqual(
            expect.arrayContaining([expect.objectContaining({ type: 'lethalHits' })]),
        );
    });

    it('REQ-4: extracts shared abilities from shared profiles', () => {
        const result = parseFactionData(buildCatalogueFixture(), ['adeptus-astartes.cat']);
        const sharedAbility = result.abilities.find((ability) => ability.id === 'shared-ability-stealth');

        expect(sharedAbility).toBeDefined();
        expect(sharedAbility?.name).toBe('Stealth');
        expect(sharedAbility?.description).toBe('Harder to hit at range.');
        expect(sharedAbility?.sourceFile).toBe('adeptus-astartes.cat');
    });

    it('REQ-5: extracts faction rules from shared rules and shared profiles', () => {
        const result = parseFactionData(buildCatalogueFixture(), ['adeptus-astartes.cat']);
        const factionRuleIds = result.factionRules.map((rule) => rule.id);

        expect(factionRuleIds).toEqual(
            expect.arrayContaining(['shared-rule-1', 'shared-ability-stealth', 'shared-faction-rule-1']),
        );
        expect(result.factionRules.find((rule) => rule.id === 'shared-rule-1')?.description).toContain(
            'Objective Secured',
        );
        expect(result.factionRules.find((rule) => rule.id === 'shared-faction-rule-1')?.description).toContain(
            'Re-roll',
        );
    });

    it('REQ-6: extracts stratagems, detachments, and enhancements from selection entry trees', () => {
        const result = parseFactionData(buildCatalogueFixture(), ['adeptus-astartes.cat']);

        expect(result.detachments).toHaveLength(1);
        expect(result.detachments[0]?.id).toBe('detachment-anvil');
        expect(result.detachments[0]?.enhancements.map((enhancement) => enhancement.id)).toContain('enhancement-1');

        expect(result.enhancements.map((enhancement) => enhancement.id)).toContain('enhancement-1');
        expect(result.stratagems).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: 'stratagem-1', detachmentId: 'detachment-anvil', cp: 1 }),
            ]),
        );
    });

    it('REQ-7: populates structured rules and parsed weapon keywords for downstream validation', () => {
        const result = parseFactionData(buildCatalogueFixture(), ['adeptus-astartes.cat']);
        const detachment = result.detachments[0];
        const enhancement = result.enhancements.find((entry) => entry.id === 'enhancement-1');
        const stormBolter = result.weapons.find((weapon) => weapon.id === 'shared-ranged-weapon');

        expect(result.structuredFactionRules).toHaveLength(result.factionRules.length);
        expect(result.structuredFactionRules[0]?.origin.type).toBe('factionRule');

        expect(detachment?.structuredRules.length).toBeGreaterThan(0);
        expect(detachment?.structuredRules[0]?.origin.type).toBe('detachment');

        expect(enhancement?.structuredEffect).toBeTruthy();
        expect(enhancement?.structuredEffect?.origin.type).toBe('enhancement');

        expect(stormBolter?.parsedKeywords).toEqual(
            expect.arrayContaining([expect.objectContaining({ type: 'rapidFire', attacks: 2 })]),
        );
    });

    it('handles empty catalogue edge case by returning empty collections', () => {
        const result = parseFactionData(buildEmptyCatalogueFixture(), ['empty.cat']);

        expect(result.id).toBe('empty-faction');
        expect(result.name).toBe('Empty Faction');
        expect(result.units).toEqual([]);
        expect(result.weapons).toEqual([]);
        expect(result.abilities).toEqual([]);
        expect(result.factionRules).toEqual([]);
        expect(result.structuredFactionRules).toEqual([]);
        expect(result.stratagems).toEqual([]);
        expect(result.detachments).toEqual([]);
        expect(result.enhancements).toEqual([]);
    });
});
