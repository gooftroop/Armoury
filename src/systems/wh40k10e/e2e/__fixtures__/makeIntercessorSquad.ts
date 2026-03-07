import type { Unit } from '@wh40k10e/models/UnitModel.js';
import type { Weapon } from '@wh40k10e/types/entities.js';
import { makeBoltRifle } from './makeBoltRifle.ts';

export function makeIntercessorSquad(): Unit {
    const boltRifle = makeBoltRifle();
    const closeCombatWeapon: Weapon = {
        type: 'melee' as const,
        id: 'close-combat-weapon',
        name: 'Close Combat Weapon',
        sourceFile: 'Imperium - Space Marines.cat',
        sourceSha: '',
        attacks: '3',
        skill: '3+',
        strength: 4,
        ap: 0,
        damage: '1',
        keywords: [],
        parsedKeywords: [],
        unitId: 'intercessor-squad',
    };

    return {
        id: 'intercessor-squad',
        name: 'Intercessor Squad',
        sourceFile: 'Imperium - Space Marines.cat',
        sourceSha: '',
        factionId: 'adeptus-astartes',
        movement: '6"',
        toughness: 4,
        save: '3+',
        wounds: 2,
        leadership: 6,
        objectiveControl: 2,
        composition: [
            { models: 5, points: 90 },
            { models: 10, points: 180 },
        ],
        rangedWeapons: [boltRifle],
        meleeWeapons: [closeCombatWeapon],
        wargearOptions: [],
        wargearAbilities: [],
        abilities: [],
        structuredAbilities: [],
        constraints: [],
        keywords: ['Infantry', 'Battleline', 'Grenades', 'Imperium', 'Tacticus', 'Intercessor Squad'],
        factionKeywords: ['Adeptus Astartes'],
        imageUrl: '',
    };
}
