import type { NumericExpression } from '@armoury/validation/effects/types';
import type { GameEffect, RuleTiming, StructuredRule } from '@/types/effects.js';

/**
 * Parse a D6+ threshold from text, returning a numeric threshold when present.
 */
function parseThreshold(text: string): 2 | 3 | 4 | 5 | 6 | null {
    const match = text.match(/([2-6])\+/);

    if (!match) {
        return null;
    }

    const value = parseInt(match[1] ?? '0', 10);

    if (value === 2 || value === 3 || value === 4 || value === 5 || value === 6) {
        return value;
    }

    return null;
}

/**
 * Parse a numeric expression from text for dice or constants.
 */
function parseNumericExpression(text: string): NumericExpression {
    const trimmed = text.trim();
    const diceMatch = trimmed.match(/^D(3|6)$/i);

    if (diceMatch) {
        return {
            type: 'dice',
            count: 1,
            sides: parseInt(diceMatch[1] ?? '6', 10),
            modifier: 0,
        };
    }

    const value = parseInt(trimmed, 10);

    if (!Number.isNaN(value)) {
        return { type: 'constant', value };
    }

    return { type: 'raw', text };
}

/**
 * Determine if the text implies a triggered timing.
 */
function inferTiming(description: string): RuleTiming {
    const lower = description.toLowerCase();

    if (lower.includes('each time')) {
        return {
            type: 'triggered',
            trigger: 'each time',
            phase: 'any',
            duration: { type: 'instant' },
        };
    }

    return {
        type: 'passive',
        phase: 'any',
    };
}

/**
 * Build a raw text effect fallback.
 */
function buildRawEffect(text: string, reason?: string): GameEffect {
    return {
        type: 'rawText',
        text,
        reason,
    };
}

/**
 * Parse a rule description into an effect, confidence, and timing.
 */
function parseEffectFromText(
    description: string,
    name: string,
): {
    effect: GameEffect;
    confidence: number;
    timing: RuleTiming;
} {
    const lowerName = name.toLowerCase();
    const lowerDescription = description.toLowerCase();
    const timing = inferTiming(description);

    if (lowerName === 'stealth') {
        return {
            effect: { type: 'stealth' },
            confidence: 1,
            timing: { type: 'passive', phase: 'any' },
        };
    }

    if (lowerName === 'lone operative') {
        return {
            effect: { type: 'targetingRestriction', maxRange: 12 },
            confidence: 1,
            timing: { type: 'passive', phase: 'any' },
        };
    }

    if (lowerName === 'deep strike') {
        return {
            effect: { type: 'deepStrike', minDistanceFromEnemies: 9 },
            confidence: 1,
            timing: { type: 'passive', phase: 'movement' },
        };
    }

    const scoutsMatch = name.match(/^scouts\s+(\d+)"$/i);

    if (scoutsMatch) {
        return {
            effect: {
                type: 'scouts',
                distance: parseInt(scoutsMatch[1] ?? '0', 10),
                minDistanceFromEnemies: 9,
            },
            confidence: 1,
            timing: { type: 'passive', phase: 'movement' },
        };
    }

    if (lowerName === 'infiltrators') {
        return {
            effect: { type: 'infiltrators', minDistanceFromEnemies: 9 },
            confidence: 1,
            timing: { type: 'passive', phase: 'movement' },
        };
    }

    const deadlyDemiseMatch = name.match(/^deadly demise\s+(.+)$/i);

    if (deadlyDemiseMatch) {
        const amount = parseNumericExpression(deadlyDemiseMatch[1] ?? '');

        return {
            effect: { type: 'deadlyDemise', amount },
            confidence: 1,
            timing: {
                type: 'triggered',
                trigger: 'on death',
                phase: 'any',
                duration: { type: 'instant' },
            },
        };
    }

    if (lowerName === 'fights first') {
        return {
            effect: { type: 'fightsFirst' },
            confidence: 1,
            timing: { type: 'passive', phase: 'fight' },
        };
    }

    const feelNoPainMatch = name.match(/^feel no pain\s+(\d)\+$/i);

    if (feelNoPainMatch) {
        const threshold = parseThreshold(feelNoPainMatch[0] ?? '');

        if (threshold) {
            return {
                effect: { type: 'feelNoPain', threshold, against: 'all' },
                confidence: 1,
                timing: { type: 'passive', phase: 'any' },
            };
        }
    }

    if (lowerDescription.includes('feel no pain') || lowerDescription.includes('ignore wound')) {
        const threshold = parseThreshold(description);

        if (threshold) {
            return {
                effect: { type: 'feelNoPain', threshold, against: 'all' },
                confidence: 0.9,
                timing,
            };
        }
    }

    if (lowerDescription.includes('invulnerable save')) {
        const threshold = parseThreshold(description);

        if (threshold) {
            return {
                effect: { type: 'invulnerableSave', threshold },
                confidence: 0.8,
                timing,
            };
        }
    }

    if (lowerDescription.includes('re-roll') && lowerDescription.includes('hit roll')) {
        return {
            effect: { type: 'reroll', roll: 'hit', mode: 'all' },
            confidence: 0.7,
            timing,
        };
    }

    if (lowerDescription.includes('re-roll') && lowerDescription.includes('wound roll')) {
        return {
            effect: { type: 'reroll', roll: 'wound', mode: 'all' },
            confidence: 0.7,
            timing,
        };
    }

    if (
        (lowerDescription.includes('add 1 to') || lowerDescription.includes('+1 to')) &&
        lowerDescription.includes('hit roll')
    ) {
        return {
            effect: { type: 'modifyRoll', roll: 'hit', modifier: 1 },
            confidence: 0.7,
            timing,
        };
    }

    if (
        (lowerDescription.includes('subtract 1') || lowerDescription.includes('-1 to')) &&
        lowerDescription.includes('hit roll')
    ) {
        return {
            effect: { type: 'modifyRoll', roll: 'hit', modifier: -1 },
            confidence: 0.7,
            timing,
        };
    }

    return {
        effect: buildRawEffect(description, 'unmatched'),
        confidence: 0,
        timing,
    };
}

/**
 * Parse a unit ability into a structured rule.
 *
 * Converts a unit ability (from BattleScribe unit data) into a StructuredRule
 * with parsed effects and timing. Uses natural language pattern matching to
 * identify known abilities (Stealth, Deep Strike, etc.) and extract structured
 * game effects. Falls back to rawText effect with confidence=0 if no patterns match.
 *
 * The confidence field (0-1) indicates parsing success:
 * - 1.0: Exact match (e.g., "Stealth" → stealth effect)
 * - 0.7-0.9: Partial match with pattern (e.g., "Feel No Pain 5+" → feelNoPain effect)
 * - 0.0: No match, rawText fallback used
 *
 * @param ability - Object with id, name, and description from BattleScribe
 * @returns StructuredRule with parsed effect, timing, and confidence score
 */
export function parseAbility(ability: { id: string; name: string; description: string }): StructuredRule {
    const { effect, confidence, timing } = parseEffectFromText(ability.description, ability.name);

    return {
        id: ability.id,
        name: ability.name,
        originalText: ability.description,
        origin: {
            type: 'unitAbility',
            abilityId: ability.id,
            abilityName: ability.name,
        },
        timing,
        effect,
        confidence,
    };
}

/**
 * Parse a list of unit abilities into structured rules.
 */
export function parseAbilities(abilities: { id: string; name: string; description: string }[]): StructuredRule[] {
    return abilities.map((ability) => parseAbility(ability));
}

/**
 * Parse a faction rule into a structured rule.
 *
 * Converts a faction rule (from BattleScribe faction data) into a StructuredRule
 * with parsed effects and timing. Uses the same natural language pattern matching
 * as parseAbility() to identify known effects and extract structured game rules.
 * Falls back to rawText effect with confidence=0 if no patterns match.
 *
 * Faction rules are army-wide rules that apply to all units with the faction keyword.
 * The confidence field (0-1) indicates parsing success (see parseAbility() for details).
 *
 * @param rule - Object with id, name, and description from BattleScribe faction data
 * @returns StructuredRule with parsed effect, timing, and confidence score
 */
export function parseFactionRule(rule: { id: string; name: string; description: string }): StructuredRule {
    const { effect, confidence, timing } = parseEffectFromText(rule.description, rule.name);

    return {
        id: rule.id,
        name: rule.name,
        originalText: rule.description,
        origin: {
            type: 'factionRule',
            ruleId: rule.id,
            ruleName: rule.name,
        },
        timing,
        effect,
        confidence,
    };
}

/**
 * Parse a detachment rule text into a structured rule.
 *
 * Converts a detachment rule (from BattleScribe detachment data) into a StructuredRule
 * with parsed effects and timing. Uses the same natural language pattern matching
 * as parseAbility() to identify known effects and extract structured game rules.
 * Falls back to rawText effect with confidence=0 if no patterns match.
 *
 * Detachment rules are special rules provided by the selected detachment and apply
 * to the entire army. The rule ID is generated from detachmentId and index to ensure
 * uniqueness when a detachment has multiple rules.
 *
 * @param ruleText - The rule description text from BattleScribe detachment data
 * @param detachmentId - The ID of the detachment this rule belongs to
 * @param detachmentName - The human-readable name of the detachment
 * @param index - The index of this rule within the detachment (for ID generation)
 * @returns StructuredRule with parsed effect, timing, and confidence score
 */
export function parseDetachmentRule(
    ruleText: string,
    detachmentId: string,
    detachmentName: string,
    index: number,
): StructuredRule {
    const { effect, confidence, timing } = parseEffectFromText(ruleText, detachmentName);

    return {
        id: `${detachmentId}-rule-${index}`,
        name: detachmentName,
        originalText: ruleText,
        origin: {
            type: 'detachment',
            detachmentId,
            detachmentName,
        },
        timing,
        effect,
        confidence,
    };
}

/**
 * Parse an enhancement description into a structured rule.
 *
 * Converts an enhancement (from BattleScribe enhancement data) into a StructuredRule
 * with parsed effects and timing. Uses the same natural language pattern matching
 * as parseAbility() to identify known effects and extract structured game rules.
 * Falls back to rawText effect with confidence=0 if no patterns match.
 *
 * Enhancements are special upgrades that can be applied to Characters in the army.
 * Each army can have at most 3 enhancements, and each enhancement can only appear once.
 * The confidence field (0-1) indicates parsing success (see parseAbility() for details).
 *
 * @param enhancement - Object with id, name, and description from BattleScribe enhancement data
 * @returns StructuredRule with parsed effect, timing, and confidence score
 */
export function parseEnhancementEffect(enhancement: { id: string; name: string; description: string }): StructuredRule {
    const { effect, confidence, timing } = parseEffectFromText(enhancement.description, enhancement.name);

    return {
        id: enhancement.id,
        name: enhancement.name,
        originalText: enhancement.description,
        origin: {
            type: 'enhancement',
            enhancementId: enhancement.id,
            enhancementName: enhancement.name,
        },
        timing,
        effect,
        confidence,
    };
}
