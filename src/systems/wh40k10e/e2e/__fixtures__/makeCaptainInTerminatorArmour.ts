import type { Unit } from '@wh40k10e/models/UnitModel.js';
import type { Weapon } from '@wh40k10e/types/entities.js';

export function makeCaptainInTerminatorArmour(): Unit {
    const stormBolter: Weapon = {
        type: 'ranged' as const,
        id: 'storm-bolter',
        name: 'Storm Bolter',
        sourceFile: 'Imperium - Space Marines.cat',
        sourceSha: '',
        range: '24"',
        attacks: '2',
        skill: '2+',
        strength: 4,
        ap: 0,
        damage: '1',
        keywords: ['Rapid Fire 1'],
        parsedKeywords: [{ type: 'rapidFire', attacks: 1 }],
        unitId: 'captain-in-terminator-armour',
    };
    const masterCraftedPowerWeapon: Weapon = {
        type: 'melee' as const,
        id: 'master-crafted-power-weapon',
        name: 'Master-crafted Power Weapon',
        sourceFile: 'Imperium - Space Marines.cat',
        sourceSha: '',
        attacks: '5',
        skill: '2+',
        strength: 5,
        ap: -2,
        damage: '2',
        keywords: [],
        parsedKeywords: [],
        unitId: 'captain-in-terminator-armour',
    };

    return {
        id: 'captain-in-terminator-armour',
        name: 'Captain in Terminator Armour',
        sourceFile: 'Imperium - Space Marines.cat',
        sourceSha: '',
        factionId: 'adeptus-astartes',
        movement: '5"',
        toughness: 5,
        save: '2+',
        wounds: 6,
        leadership: 6,
        objectiveControl: 1,
        invulnerableSave: '4+',
        composition: [{ models: 1, points: 100 }],
        rangedWeapons: [stormBolter],
        meleeWeapons: [masterCraftedPowerWeapon],
        wargearOptions: [],
        wargearAbilities: [],
        abilities: [],
        structuredAbilities: [],
        constraints: [],
        leader: {
            canAttachTo: ['Terminator Squad', 'Assault Terminator Squad'],
            leaderAbility: 'This model can be attached to a Terminator Squad or Assault Terminator Squad.',
        },
        keywords: ['Infantry', 'Character', 'Imperium', 'Terminator', 'Captain'],
        factionKeywords: ['Adeptus Astartes'],
        imageUrl: '',
    };
}
