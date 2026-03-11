import { describe, it, expect } from 'vitest';
import type {
    Unit,
    UnitAbility,
    UnitComposition,
    WargearAbility,
    WargearChoice,
    WargearOption,
    LeaderInfo,
} from '../UnitModel.ts';
import type { Weapon } from '../../types/entities.ts';

/** Builds a basic UnitComposition object for shape testing. */
const buildComposition = (): UnitComposition => ({
    models: 5,
    points: 100,
});

/** Builds a basic WargearChoice object for shape testing. */
const buildWargearChoice = (): WargearChoice => ({
    id: 'choice-1',
    name: 'Boltgun',
    points: 0,
    isDefault: true,
});

/** Builds a basic WargearOption object for shape testing. */
const buildWargearOption = (): WargearOption => ({
    id: 'option-1',
    name: 'Weapon Options',
    choices: [buildWargearChoice()],
    minSelections: 0,
    maxSelections: 1,
});

/** Builds a basic WargearAbility object for shape testing. */
const buildWargearAbility = (): WargearAbility => ({
    id: 'wargear-ability-1',
    name: 'Shielded',
    description: 'Grants an invulnerable save.',
});

/** Builds a basic UnitAbility object for shape testing. */
const buildUnitAbility = (): UnitAbility => ({
    id: 'unit-ability-1',
    name: 'Deep Strike',
    description: 'Can be set up in reserves.',
});

/** Builds a basic LeaderInfo object for shape testing. */
const buildLeaderInfo = (): LeaderInfo => ({
    canAttachTo: ['Infantry'],
    leaderAbility: 'Leader',
});

/** Builds a minimal weapon object for unit weapon arrays. */
const buildWeapon = (): Weapon => ({
    id: 'weapon-1',
    name: 'Boltgun',
    sourceFile: 'Test.cat',
    sourceSha: 'sha-test',
    attacks: '2',
    skill: '3+',
    strength: 4,
    ap: 0,
    damage: '1',
    keywords: [],
    parsedKeywords: [],
    type: 'ranged',
    range: '24"',
});

/** Builds a full Unit object for type shape validation. */
const buildUnit = (): Unit => ({
    id: 'unit-1',
    name: 'Test Unit',
    sourceFile: 'Test.cat',
    sourceSha: 'sha-test',
    factionId: 'faction-1',
    movement: '6"',
    toughness: 4,
    save: '3+',
    wounds: 2,
    leadership: 6,
    objectiveControl: 1,
    invulnerableSave: '4+',
    composition: [buildComposition()],
    rangedWeapons: [buildWeapon()],
    meleeWeapons: [],
    wargearOptions: [buildWargearOption()],
    wargearAbilities: [buildWargearAbility()],
    abilities: [buildUnitAbility()],
    structuredAbilities: [],
    constraints: [],
    leader: buildLeaderInfo(),
    keywords: ['Infantry'],
    factionKeywords: ['Test Faction'],
    imageUrl: '',
});

/** Describes UnitModel interface shape tests. */
describe('UnitModel', () => {
    /** Ensures UnitComposition fields are accessible and typed. */
    it('supports UnitComposition shape', () => {
        const composition = buildComposition();
        expect(composition.models).toBe(5);
        expect(composition.points).toBe(100);
    });

    /** Ensures WargearChoice fields are accessible and typed. */
    it('supports WargearChoice shape', () => {
        const choice = buildWargearChoice();
        expect(choice.isDefault).toBe(true);
        expect(choice.points).toBe(0);
    });

    /** Ensures WargearOption fields are accessible and typed. */
    it('supports WargearOption shape', () => {
        const option = buildWargearOption();
        expect(option.choices).toHaveLength(1);
        expect(option.minSelections).toBe(0);
        expect(option.maxSelections).toBe(1);
    });

    /** Ensures WargearAbility fields are accessible and typed. */
    it('supports WargearAbility shape', () => {
        const ability = buildWargearAbility();
        expect(ability.description).toContain('invulnerable');
    });

    /** Ensures UnitAbility fields are accessible and typed. */
    it('supports UnitAbility shape', () => {
        const ability = buildUnitAbility();
        expect(ability.name).toBe('Deep Strike');
        expect(ability.description).toBeTruthy();
    });

    /** Ensures LeaderInfo fields are accessible and typed. */
    it('supports LeaderInfo shape', () => {
        const leader = buildLeaderInfo();
        expect(leader.canAttachTo).toEqual(['Infantry']);
        expect(leader.leaderAbility).toBe('Leader');
    });

    /** Ensures Unit shape includes all required fields. */
    it('supports Unit shape with full datasheet data', () => {
        const unit = buildUnit();
        expect(unit.factionId).toBe('faction-1');
        expect(unit.movement).toBe('6"');
        expect(unit.toughness).toBe(4);
        expect(unit.rangedWeapons).toHaveLength(1);
        expect(unit.wargearOptions).toHaveLength(1);
        expect(unit.abilities).toHaveLength(1);
        expect(unit.leader?.canAttachTo).toContain('Infantry');
        expect(unit.imageUrl).toBe('');
    });
});
