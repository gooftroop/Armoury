import { describe, it, expect } from 'vitest';

import { isRangedWeapon, isMeleeWeapon } from '../typeGuards.ts';
import type { RangedWeapon, MeleeWeapon, Weapon } from '../entities.ts';

const buildRangedWeapon = (overrides: Partial<RangedWeapon> = {}): RangedWeapon => ({
    id: 'weapon-ranged',
    name: 'Boltgun',
    sourceFile: 'test.cat',
    sourceSha: 'sha',
    attacks: '2',
    skill: '3+',
    strength: 4,
    ap: 0,
    damage: '1',
    keywords: ['Rapid Fire 1'],
    parsedKeywords: [],
    type: 'ranged',
    range: '24"',
    ...overrides,
});

const buildMeleeWeapon = (overrides: Partial<MeleeWeapon> = {}): MeleeWeapon => ({
    id: 'weapon-melee',
    name: 'Chainsword',
    sourceFile: 'test.cat',
    sourceSha: 'sha',
    attacks: '3',
    skill: '3+',
    strength: 4,
    ap: -1,
    damage: '1',
    keywords: ['Extra Attacks'],
    parsedKeywords: [],
    type: 'melee',
    ...overrides,
});

describe('type guards', () => {
    it('isRangedWeapon returns true for ranged weapons', () => {
        const weapon: Weapon = buildRangedWeapon();
        expect(isRangedWeapon(weapon)).toBe(true);

        if (isRangedWeapon(weapon)) {
            expect(weapon.range).toBe('24"');
        }
    });

    it('isRangedWeapon returns false for melee weapons', () => {
        const weapon: Weapon = buildMeleeWeapon();
        expect(isRangedWeapon(weapon)).toBe(false);
    });

    it('isMeleeWeapon returns true for melee weapons', () => {
        const weapon: Weapon = buildMeleeWeapon();
        expect(isMeleeWeapon(weapon)).toBe(true);
    });

    it('isMeleeWeapon returns false for ranged weapons', () => {
        const weapon: Weapon = buildRangedWeapon();
        expect(isMeleeWeapon(weapon)).toBe(false);
    });
});
