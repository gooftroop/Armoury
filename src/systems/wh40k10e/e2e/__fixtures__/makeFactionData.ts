import type { FactionData } from '@wh40k10e/models/FactionData.js';
import type { Ability, Detachment, Enhancement, Stratagem } from '@wh40k10e/types/entities.js';
import { makeCaptainInTerminatorArmour } from './makeCaptainInTerminatorArmour.ts';
import { makeIntercessorSquad } from './makeIntercessorSquad.ts';
import { makePowerFist } from './makePowerFist.ts';

export function makeFactionData(overrides: Partial<FactionData> = {}): FactionData {
    const intercessors = makeIntercessorSquad();
    const captain = makeCaptainInTerminatorArmour();
    const weapons = [
        ...intercessors.rangedWeapons,
        ...intercessors.meleeWeapons,
        ...captain.rangedWeapons,
        ...captain.meleeWeapons,
        makePowerFist(),
    ];
    const enhancements: Enhancement[] = [
        {
            id: 'artificer-armour',
            name: 'Artificer Armour',
            points: 10,
            description: 'Add 1 to the bearer’s Save characteristic and they gain Feel No Pain 6+.',
            eligibleKeywords: ['Character', 'Adeptus Astartes'],
            structuredEffect: null,
        },
    ];
    const detachments: Detachment[] = [
        {
            id: 'gladius-task-force',
            name: 'Gladius Task Force',
            sourceFile: 'Imperium - Space Marines.cat',
            sourceSha: '',
            factionId: 'adeptus-astartes',
            rules: ['Combat Doctrines: Choose a doctrine at the start of each battle round.'],
            structuredRules: [],
            enhancements: enhancements,
        },
    ];
    const stratagems: Stratagem[] = [
        {
            id: 'only-in-death-does-duty-end',
            name: 'Only In Death Does Duty End',
            sourceFile: 'Imperium - Space Marines.cat',
            sourceSha: '',
            cp: 2,
            phase: 'Fight',
            description: 'When a model is destroyed, it can fight before it is removed.',
            detachmentId: 'gladius-task-force',
        },
        {
            id: 'armour-of-contempt',
            name: 'Armour of Contempt',
            sourceFile: 'Imperium - Space Marines.cat',
            sourceSha: '',
            cp: 1,
            phase: 'Shooting',
            description: 'Subtract 1 from the AP characteristic of attacks that target your unit.',
            detachmentId: 'gladius-task-force',
        },
    ];
    const abilities: Ability[] = [
        {
            id: 'and-they-shall-know-no-fear',
            name: 'And They Shall Know No Fear',
            sourceFile: 'Imperium - Space Marines - Library.cat',
            sourceSha: '',
            description: 'This unit can re-roll Battle-shock tests.',
        },
    ];
    const defaults = {
        id: 'adeptus-astartes',
        name: 'Adeptus Astartes',
        armyImageUrl: '',
        sourceFiles: ['Imperium - Space Marines.cat', 'Imperium - Space Marines - Library.cat'],
        lastSynced: new Date('2024-06-01T00:00:00Z'),
        factionRules: [
            {
                id: 'oath-of-moment',
                name: 'Oath of Moment',
                description: 'At the start of your Command phase, select one enemy unit to focus your fire upon.',
            },
        ],
        structuredFactionRules: [],
        stratagems,
        detachments,
        enhancements,
        units: [intercessors, captain],
        weapons,
        abilities,
    };

    return { ...defaults, ...overrides };
}
