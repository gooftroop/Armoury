import type { Weapon } from '@wh40k10e/types/entities.js';

export function makeBoltRifle(): Weapon {
    return {
        type: 'ranged' as const,
        id: 'bolt-rifle',
        name: 'Bolt Rifle',
        sourceFile: 'Imperium - Space Marines.cat',
        sourceSha: '',
        range: '30"',
        attacks: '2',
        skill: '3+',
        strength: 4,
        ap: -1,
        damage: '1',
        keywords: ['Assault', 'Heavy'],
        parsedKeywords: [{ type: 'assault' }, { type: 'heavy' }],
        unitId: 'intercessor-squad',
    };
}
