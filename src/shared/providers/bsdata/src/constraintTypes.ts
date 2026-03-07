/**
 * Parsed constraint types extracted from BattleScribe XML.
 *
 * These represent machine-readable army construction constraints
 * that the validation engine evaluates at runtime. All values come
 * from the .gst (game system) and .cat (catalogue) data files.
 */

/**
 * The type of limit a constraint imposes.
 *
 * Extracted from BattleScribe constraint @_type attribute.
 * - min: Minimum value constraint (e.g., "must select at least 1")
 * - max: Maximum value constraint (e.g., "can select at most 3")
 * - increment: Value must be a multiple of the specified amount
 */
export type ConstraintType = 'min' | 'max' | 'increment';

/**
 * What field the constraint applies to (from BattleScribe @_field).
 *
 * Specifies which aspect of army construction the constraint limits.
 * - selections: Number of times a unit entry can be selected in the army
 * - points: Total point cost limits for selections
 * - Other string values: Custom fields defined in BattleScribe data files
 */
export type ConstraintField = 'selections' | 'points' | string;

/**
 * The scope at which a constraint is enforced (from BattleScribe @_scope).
 *
 * Determines the hierarchical level at which the constraint applies during validation.
 * - roster: Applies to the entire army list (e.g., "max 3 units with same datasheet")
 * - parent: Applies within the parent selection entry (e.g., "max 2 upgrades per unit")
 * - self: Applies to this specific entry only (e.g., "max 1 per model")
 * - force: Applies within the force organization structure
 * - Other string values: Custom scopes defined in BattleScribe data files
 */
export type ConstraintScope = 'roster' | 'parent' | 'self' | 'force' | string;

/**
 * A single machine-readable constraint extracted from BattleScribe XML.
 *
 * Represents a parsed constraint from BattleScribe `<constraint>` elements.
 * These constraints define army construction rules like "max 3 units with same datasheet"
 * or "max 500 points in Strategic Reserves". The validation engine evaluates these
 * constraints at runtime to ensure army lists are legal.
 *
 * Preserves the original BattleScribe constraint attributes in a typed format.
 */
export interface ParsedConstraint {
    /**
     * Unique identifier from BattleScribe constraint @_id.
     * Used to reference this constraint in validation results.
     */
    id: string;
    /**
     * The type of limit: min, max, or increment.
     * Determines how the value is interpreted during validation.
     */
    constraintType: ConstraintType;
    /**
     * The limit value (e.g., 3 for "max 3 units").
     * Compared against the actual count/points during validation.
     */
    value: number;
    /**
     * What is being constrained (e.g., "selections", "points").
     * Determines which aspect of the army is validated.
     */
    field: ConstraintField;
    /**
     * Scope of enforcement (e.g., "roster" for army-wide, "parent" for within a unit).
     * Determines the hierarchical level at which the constraint applies.
     */
    scope: ConstraintScope;
    /**
     * The category or entry ID this constraint targets, if scoped to a category.
     * Optional; used when constraint applies to specific unit types.
     */
    targetId?: string;
    /**
     * Human-readable name for the target (for error messages).
     * Displayed to users when this constraint is violated.
     */
    targetName?: string;
    /**
     * The selection entry ID this constraint belongs to.
     * Identifies which unit/upgrade this constraint came from.
     */
    sourceEntryId?: string;
    /**
     * Human-readable name for the source entry.
     * Displayed in validation error messages for context.
     */
    sourceEntryName?: string;
}

/**
 * A collection of parsed constraints organized by scope for efficient lookup.
 *
 * Constraints are grouped by their scope (roster, force, parent, self) to enable
 * fast validation lookups. This structure is built during data initialization and
 * used by the validation engine to check army construction rules.
 */
export interface ConstraintSet {
    /**
     * Constraints that apply at the roster (army) level.
     * These are checked against the entire army list.
     */
    roster: ParsedConstraint[];
    /**
     * Constraints that apply at the force level.
     * These are checked within force organization structures.
     */
    force: ParsedConstraint[];
    /**
     * Constraints scoped to a parent entry, keyed by parent entry ID.
     * Used for constraints like "max 2 upgrades per unit".
     */
    parent: Map<string, ParsedConstraint[]>;
    /**
     * Constraints scoped to a specific entry, keyed by entry ID.
     * Used for constraints like "max 1 per model".
     */
    self: Map<string, ParsedConstraint[]>;
}
