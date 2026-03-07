import { describe, it, expect } from 'vitest';

import {
    parseAbility,
    parseDetachmentRule,
    parseEnhancementEffect,
    parseFactionRule,
} from '@wh40k10e/validation/abilityParser.js';

describe('Ability Parser', () => {
    it('parses Stealth by name', () => {
        const rule = parseAbility({
            id: 'ability-1',
            name: 'Stealth',
            description: 'Harder to hit at range.',
        });
        expect(rule.effect).toMatchObject({ type: 'stealth' });
        expect(rule.confidence).toBe(1);
    });

    it('parses Lone Operative', () => {
        const rule = parseAbility({
            id: 'ability-2',
            name: 'Lone Operative',
            description: 'Cannot be targeted beyond 12".',
        });
        expect(rule.effect).toMatchObject({
            type: 'targetingRestriction',
            maxRange: 12,
        });
    });

    it('parses Deep Strike', () => {
        const rule = parseAbility({
            id: 'ability-3',
            name: 'Deep Strike',
            description: 'Arrives from reserves.',
        });
        expect(rule.effect).toMatchObject({
            type: 'deepStrike',
            minDistanceFromEnemies: 9,
        });
    });

    it('parses Scouts 6"', () => {
        const rule = parseAbility({
            id: 'ability-4',
            name: 'Scouts 6"',
            description: 'Can make a pregame move.',
        });
        expect(rule.effect).toMatchObject({
            type: 'scouts',
            distance: 6,
        });
    });

    it('parses Deadly Demise D3', () => {
        const rule = parseAbility({
            id: 'ability-5',
            name: 'Deadly Demise D3',
            description: 'Explodes when destroyed.',
        });
        expect(rule.effect).toMatchObject({
            type: 'deadlyDemise',
            amount: { type: 'dice', count: 1, sides: 3, modifier: 0 },
        });
    });

    it('parses Fights First', () => {
        const rule = parseAbility({
            id: 'ability-6',
            name: 'Fights First',
            description: 'Strikes before others.',
        });
        expect(rule.effect).toMatchObject({ type: 'fightsFirst' });
    });

    it('parses Feel No Pain 5+ by name', () => {
        const rule = parseAbility({
            id: 'ability-7',
            name: 'Feel No Pain 5+',
            description: 'Ignores wounds on 5+.',
        });
        expect(rule.effect).toMatchObject({
            type: 'feelNoPain',
            threshold: 5,
        });
    });

    it('parses invulnerable save from description', () => {
        const rule = parseAbility({
            id: 'ability-8',
            name: 'Shielded',
            description: 'This model has an invulnerable save of 4+.',
        });
        expect(rule.effect).toMatchObject({
            type: 'invulnerableSave',
            threshold: 4,
        });
    });

    it('parses re-roll hit rolls from description', () => {
        const rule = parseAbility({
            id: 'ability-9',
            name: 'Precise',
            description: 'You can re-roll hit rolls for this unit.',
        });
        expect(rule.effect).toMatchObject({
            type: 'reroll',
            roll: 'hit',
            mode: 'all',
        });
    });

    it('falls back to rawText for unrecognized descriptions', () => {
        const rule = parseAbility({
            id: 'ability-10',
            name: 'Mystery',
            description: 'Unclear effects occur.',
        });
        expect(rule.effect).toMatchObject({ type: 'rawText' });
    });

    it('parseFactionRule sets origin.type to factionRule', () => {
        const rule = parseFactionRule({
            id: 'faction-rule-1',
            name: 'Stealth',
            description: 'Harder to hit.',
        });
        expect(rule.origin.type).toBe('factionRule');
    });

    it('parseDetachmentRule sets origin.type to detachment', () => {
        const rule = parseDetachmentRule('This detachment grants bonuses.', 'detachment-1', 'Gladius Task Force', 0);
        expect(rule.origin.type).toBe('detachment');
    });

    it('parseEnhancementEffect sets origin.type to enhancement', () => {
        const rule = parseEnhancementEffect({
            id: 'enhancement-1',
            name: 'Enhanced Shield',
            description: 'Grants an invulnerable save of 4+.',
        });
        expect(rule.origin.type).toBe('enhancement');
    });
});
