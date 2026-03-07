import type { Weapon } from '@wh40k10e/types/entities.js';

export function makePowerFist(): Weapon {
    return {
        type: 'melee' as const,
        id: 'power-fist',
        name: 'Power Fist',
        sourceFile: 'Imperium - Space Marines.cat',
        sourceSha: '',
        attacks: '3',
        skill: '3+',
        strength: 8,
        ap: -2,
        damage: '2',
        keywords: [],
        parsedKeywords: [],
        unitId: 'captain-in-terminator-armour',
    };
}
