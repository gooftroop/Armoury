import type { CoreRules } from '../../src/models/CoreRules.js';

export function makeCoreRules(overrides: Partial<CoreRules> = {}): CoreRules {
    const defaults = {
        id: 'wh40k-10e-gst',
        name: 'Warhammer 40,000 10th Edition',
        revision: '23',
        battleScribeVersion: '2.03',
        profileTypes: [
            {
                id: 'pt-unit',
                name: 'Unit',
                characteristicTypes: [
                    { id: 'm', name: 'M' },
                    { id: 't', name: 'T' },
                    { id: 'sv', name: 'SV' },
                    { id: 'w', name: 'W' },
                    { id: 'ld', name: 'LD' },
                    { id: 'oc', name: 'OC' },
                ],
            },
            {
                id: 'pt-ranged',
                name: 'Ranged Weapons',
                characteristicTypes: [
                    { id: 'range', name: 'Range' },
                    { id: 'a', name: 'A' },
                    { id: 'bs', name: 'BS' },
                    { id: 's', name: 'S' },
                    { id: 'ap', name: 'AP' },
                    { id: 'd', name: 'D' },
                    { id: 'keywords', name: 'Keywords' },
                ],
            },
            {
                id: 'pt-melee',
                name: 'Melee Weapons',
                characteristicTypes: [
                    { id: 'a', name: 'A' },
                    { id: 'ws', name: 'WS' },
                    { id: 's', name: 'S' },
                    { id: 'ap', name: 'AP' },
                    { id: 'd', name: 'D' },
                    { id: 'keywords', name: 'Keywords' },
                ],
            },
            {
                id: 'pt-abilities',
                name: 'Abilities',
                characteristicTypes: [{ id: 'description', name: 'Description' }],
            },
        ],
        costTypes: [{ id: 'pts', name: 'pts', defaultCostLimit: '2000' }],
        categories: [
            { id: 'hq', name: 'HQ' },
            { id: 'troops', name: 'Troops' },
            { id: 'elites', name: 'Elites' },
            { id: 'fast-attack', name: 'Fast Attack' },
            { id: 'heavy-support', name: 'Heavy Support' },
            { id: 'dedicated-transport', name: 'Dedicated Transport' },
            { id: 'flyer', name: 'Flyer' },
            { id: 'lord-of-war', name: 'Lord of War' },
        ],
        sharedRules: [
            { id: 'invulnerable-save', name: 'Invulnerable Save', description: 'Cannot be modified by AP.' },
            { id: 'feel-no-pain', name: 'Feel No Pain', description: 'Ignore wounds on a roll.' },
            { id: 'leader', name: 'Leader', description: 'Can be attached to a Bodyguard unit.' },
            { id: 'deadly-demise', name: 'Deadly Demise', description: 'Explodes on death.' },
            { id: 'deep-strike', name: 'Deep Strike', description: 'Deploy in reserves and arrive later.' },
            { id: 'scouts', name: 'Scouts', description: 'Make a pre-game move.' },
        ],
        constraints: [],
        sourceFile: 'Warhammer 40,000.gst',
        lastSynced: new Date('2024-06-01T00:00:00Z'),
    };

    return { ...defaults, ...overrides };
}
