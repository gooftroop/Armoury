/**
 * Unit tests for weapon keyword parsing.
 *
 * Covers both parameterized and simple keywords, plus raw fallbacks and
 * list-level parsing behavior.
 */

import { describe, expect, it } from 'vitest';
import { parseWeaponKeyword, parseWeaponKeywords } from '@/validation/weaponKeywords.js';

/**
 * @requirements
 * - REQ-WEAPON-KEYWORDS-01: Must parse parameterized keywords (rapid fire, sustained hits, anti, melta).
 * - REQ-WEAPON-KEYWORDS-02: Must parse supported simple keywords case-insensitively.
 * - REQ-WEAPON-KEYWORDS-03: Must preserve raw input on recognized variants.
 * - REQ-WEAPON-KEYWORDS-04: Must return raw keyword variant for unknown input.
 * - REQ-WEAPON-KEYWORDS-05: parseWeaponKeywords() must map parseWeaponKeyword() across arrays.
 */

describe('parseWeaponKeyword', () => {
    it('parses parameterized keywords', () => {
        expect(parseWeaponKeyword('Rapid Fire 2')).toEqual({
            type: 'rapidFire',
            attacks: 2,
            raw: 'Rapid Fire 2',
        });

        expect(parseWeaponKeyword('Sustained Hits 1')).toEqual({
            type: 'sustainedHits',
            extraHits: 1,
            raw: 'Sustained Hits 1',
        });

        expect(parseWeaponKeyword('Anti-Infantry 4+')).toEqual({
            type: 'anti',
            targetKeyword: 'Infantry',
            threshold: 4,
            raw: 'Anti-Infantry 4+',
        });

        expect(parseWeaponKeyword('Melta 3')).toEqual({
            type: 'melta',
            bonusDamage: 3,
            raw: 'Melta 3',
        });
    });

    it('parses supported simple keywords case-insensitively', () => {
        expect(parseWeaponKeyword('Assault')).toEqual({ type: 'assault', raw: 'Assault' });
        expect(parseWeaponKeyword('twin-linked')).toEqual({ type: 'twinLinked', raw: 'twin-linked' });
        expect(parseWeaponKeyword('LETHAL HITS')).toEqual({ type: 'lethalHits', raw: 'LETHAL HITS' });
        expect(parseWeaponKeyword('Devastating Wounds')).toEqual({ type: 'devastatingWounds', raw: 'Devastating Wounds' });
        expect(parseWeaponKeyword('Indirect Fire')).toEqual({ type: 'indirectFire', raw: 'Indirect Fire' });
        expect(parseWeaponKeyword('Ignores Cover')).toEqual({ type: 'ignoresCover', raw: 'Ignores Cover' });
        expect(parseWeaponKeyword('Extra Attacks')).toEqual({ type: 'extraAttacks', raw: 'Extra Attacks' });
    });

    it('returns raw variant for unknown tokens', () => {
        expect(parseWeaponKeyword('Supercharged Ω')).toEqual({
            type: 'raw',
            text: 'Supercharged Ω',
        });
    });
});

describe('parseWeaponKeywords', () => {
    it('maps parsing over keyword lists in order', () => {
        const parsed = parseWeaponKeywords(['Rapid Fire 1', 'Assault', 'Unknown Rule']);

        expect(parsed).toEqual([
            { type: 'rapidFire', attacks: 1, raw: 'Rapid Fire 1' },
            { type: 'assault', raw: 'Assault' },
            { type: 'raw', text: 'Unknown Rule' },
        ]);
    });
});
