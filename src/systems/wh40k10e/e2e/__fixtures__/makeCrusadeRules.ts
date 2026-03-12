import type { CrusadeRules } from '../../src/models/CrusadeRulesModel.js';
export function makeCrusadeRules(overrides: Partial<CrusadeRules> = {}): CrusadeRules {
    const defaults: CrusadeRules = {
        id: 'crusade-core',
        source: 'core',
        name: 'Crusade Core Rules',
        version: '1.0',
        startingSupplyLimit: 1000,
        startingRequisitionPoints: 5,
        rpPerBattle: 1,
        rankThresholds: [
            { rank: 'Battle-ready', minXP: 0, battleHonoursAllowed: 0 },
            { rank: 'Bloodied', minXP: 6, battleHonoursAllowed: 1 },
            { rank: 'Battle-hardened', minXP: 16, battleHonoursAllowed: 2 },
            { rank: 'Heroic', minXP: 31, battleHonoursAllowed: 3 },
            { rank: 'Legendary', minXP: 51, battleHonoursAllowed: 4 },
        ],
        xpGainRules: [
            {
                id: 'xp-participation',
                name: 'Participated in Battle',
                amount: 1,
                description: 'Each unit that participated gains 1 XP.',
                appliesTo: 'allParticipating',
            },
            {
                id: 'xp-destroyed-unit',
                name: 'Destroyed a Unit',
                amount: 1,
                description: 'A unit that destroys an enemy unit gains 1 XP.',
                appliesTo: 'unit',
            },
        ],
        requisitions: [
            {
                id: 'fresh-recruits',
                name: 'Fresh Recruits',
                costRP: 1,
                description: 'Increase a unit’s starting strength in your Order of Battle.',
                timing: 'addUnit',
                restrictions: ['Infantry'],
            },
            {
                id: 'relic',
                name: 'Relic',
                costRP: 1,
                description: 'Grant a Crusade Relic to a Character unit.',
                timing: 'whenRankGained',
                restrictions: ['Character'],
            },
        ],
        battleHonours: [
            {
                id: 'battle-trait',
                type: 'BattleTrait',
                name: 'Battle Trait',
                description: 'Improve a unit’s performance with a battle trait.',
                applicableTo: ['Infantry', 'Vehicle'],
            },
        ],
        battleScars: [
            {
                id: 'traumatized',
                name: 'Traumatized',
                description: 'Unit suffers from traumatic battle experience.',
                effect: 'Subtract 1 from Leadership.',
                severity: 'mild',
                removable: true,
            },
        ],
        agendas: [
            {
                id: 'head-hunter',
                name: 'Head Hunter',
                category: 'PurgeTheEnemy',
                description: 'Gain XP for destroying enemy Characters.',
                xpReward: 2,
            },
            {
                id: 'plant-the-banner',
                name: 'Plant the Banner',
                category: 'ShadowOperations',
                description: 'Complete an action to plant banners on objectives.',
                xpReward: 2,
            },
        ],
        narrative: 'The galaxy burns as Crusade forces wage endless war.',
        sourceMechanics: {},
    };

    return { ...defaults, ...overrides };
}
