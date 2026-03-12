import type { Threshold } from '@armoury/validation';
import type { WeaponKeyword } from '@/types/effects.js';

/**
 * Parse a single weapon keyword token into a structured keyword object.
 *
 * Converts a weapon keyword string (e.g., "Sustained Hits 1", "Anti-Infantry 4+")
 * into a typed WeaponKeyword object. Uses regex patterns to match parameterized
 * keywords and falls back to simple string matching for keywords without parameters.
 * Returns a raw keyword object if no pattern matches.
 *
 * Supported patterns:
 * - "Rapid Fire X" → WeaponKeywordRapidFire with attacks count
 * - "Sustained Hits X" → WeaponKeywordSustainedHits with extraHits count
 * - "Anti-KEYWORD X+" → WeaponKeywordAnti with targetKeyword and threshold
 * - "Melta X" → WeaponKeywordMelta with bonusDamage
 * - Simple keywords: "Assault", "Heavy", "Pistol", "Torrent", "Blast", "Twin-linked",
 *   "Lethal Hits", "Devastating Wounds", "Precision", "Indirect Fire", "Ignores Cover",
 *   "Lance", "Hazardous", "Extra Attacks"
 *
 * @param keyword - The weapon keyword string to parse (e.g., "Sustained Hits 1")
 * @returns A WeaponKeyword object with type discriminator and parsed data
 */
export function parseWeaponKeyword(keyword: string): WeaponKeyword {
    const trimmed = keyword.trim();

    const rapidFireMatch = trimmed.match(/^rapid\s+fire\s+(\d+)$/i);

    if (rapidFireMatch) {
        return {
            type: 'rapidFire',
            attacks: parseInt(rapidFireMatch[1] ?? '0', 10),
            raw: keyword,
        };
    }

    const sustainedHitsMatch = trimmed.match(/^sustained\s+hits\s+(\d+)$/i);

    if (sustainedHitsMatch) {
        return {
            type: 'sustainedHits',
            extraHits: parseInt(sustainedHitsMatch[1] ?? '0', 10),
            raw: keyword,
        };
    }

    const antiMatch = trimmed.match(/^anti-(\S+)\s+(\d+)\+$/i);

    if (antiMatch) {
        return {
            type: 'anti',
            targetKeyword: antiMatch[1]?.trim() ?? '',
            threshold: parseInt(antiMatch[2] ?? '0', 10) as Threshold,
            raw: keyword,
        };
    }

    const meltaMatch = trimmed.match(/^melta\s+(\d+)$/i);

    if (meltaMatch) {
        return {
            type: 'melta',
            bonusDamage: parseInt(meltaMatch[1] ?? '0', 10),
            raw: keyword,
        };
    }

    const simple = trimmed.toLowerCase();

    switch (simple) {
        case 'assault':
            return { type: 'assault', raw: keyword };
        case 'heavy':
            return { type: 'heavy', raw: keyword };
        case 'pistol':
            return { type: 'pistol', raw: keyword };
        case 'torrent':
            return { type: 'torrent', raw: keyword };
        case 'blast':
            return { type: 'blast', raw: keyword };
        case 'twin-linked':
            return { type: 'twinLinked', raw: keyword };
        case 'lethal hits':
            return { type: 'lethalHits', raw: keyword };
        case 'devastating wounds':
            return { type: 'devastatingWounds', raw: keyword };
        case 'precision':
            return { type: 'precision', raw: keyword };
        case 'indirect fire':
            return { type: 'indirectFire', raw: keyword };
        case 'ignores cover':
            return { type: 'ignoresCover', raw: keyword };
        case 'lance':
            return { type: 'lance', raw: keyword };
        case 'hazardous':
            return { type: 'hazardous', raw: keyword };
        case 'extra attacks':
            return { type: 'extraAttacks', raw: keyword };
        default:
            return { type: 'raw', text: keyword };
    }
}

/**
 * Parse a list of weapon keyword tokens into structured keyword objects.
 *
 * Batch version of parseWeaponKeyword() that processes an array of keyword strings.
 * Maps each keyword string through parseWeaponKeyword() to produce an array of
 * typed WeaponKeyword objects.
 *
 * @param keywords - Array of weapon keyword strings to parse
 * @returns Array of WeaponKeyword objects with type discriminators and parsed data
 */
export function parseWeaponKeywords(keywords: string[]): WeaponKeyword[] {
    return keywords.map((keyword) => parseWeaponKeyword(keyword));
}
