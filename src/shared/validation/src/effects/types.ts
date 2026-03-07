/**
 * D6 threshold values for X+ rolls.
 */
export type Threshold = 2 | 3 | 4 | 5 | 6;

/**
 * Phases of a game turn for rule timing.
 */
export type GamePhase = string;

/**
 * Attack type scope for effects.
 */
export type AttackKind = string;

/**
 * Roll types that can be modified or rerolled.
 */
export type RollKind = string;

/**
 * Numeric expression for values that can be constant, dice-based, or raw text.
 */
export type NumericExpression = ConstantValue | DiceExpression | RawExpression;

/**
 * Constant numeric value.
 */
export interface ConstantValue {
    /**
     * Discriminator for constant values.
     */
    type: 'constant';
    /**
     * Fixed numeric value.
     */
    value: number;
}

/**
 * Dice-based numeric expression.
 */
export interface DiceExpression {
    /**
     * Discriminator for dice expressions.
     */
    type: 'dice';
    /**
     * Number of dice to roll.
     */
    count: number;
    /**
     * Sides per die.
     */
    sides: number;
    /**
     * Modifier added to the roll total.
     */
    modifier: number;
}

/**
 * Raw text numeric expression when parsing fails.
 */
export interface RawExpression {
    /**
     * Discriminator for raw expressions.
     */
    type: 'raw';
    /**
     * Original textual value.
     */
    text: string;
}
