/**
 * Core validation types for the army validation engine.
 *
 * These types define the results returned by the validation engine
 * when checking an army list against construction and gameplay rules.
 */

/**
 * Severity level for a validation result.
 *
 * Indicates the severity of a validation issue found in an army list.
 * - error: Army list is illegal and cannot be used in tournament play
 * - warning: Army list may have issues but is technically legal
 * - info: Informational note (e.g., unused points, suboptimal choices)
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * Category of validation rule that produced this result.
 *
 * Used for grouping and filtering validation results in the UI.
 * - points: Point cost limits and budget constraints
 * - composition: Unit selection and datasheet limits
 * - enhancement: Enhancement selection and limits
 * - wargear: Wargear and upgrade restrictions
 * - leader: Leader attachment and bodyguard rules
 * - warlord: Warlord selection and requirements
 * - transport: Transport capacity and embark rules
 * - detachment: Detachment selection and requirements
 * - faction: Faction keyword and army construction rules
 * - general: General validation rules
 */
export type ValidationCategory =
    | 'points'
    | 'composition'
    | 'enhancement'
    | 'wargear'
    | 'leader'
    | 'warlord'
    | 'transport'
    | 'detachment'
    | 'faction'
    | 'general';

/**
 * A single validation result from the army validation engine.
 *
 * Each result represents one rule check that passed or failed. Results are
 * collected into a ValidationSummary for display to the user. Failed results
 * with severity='error' indicate the army list is illegal.
 */
export interface ValidationResult {
    /**
     * Unique identifier for this validation result.
     * Used to reference this result in the UI or logs.
     */
    id: string;
    /**
     * Whether the rule check passed or failed.
     * True = rule passed, False = rule failed.
     */
    passed: boolean;
    /**
     * Severity of the issue if the check failed.
     * Only meaningful when passed=false.
     */
    severity: ValidationSeverity;
    /**
     * Category of the rule that was checked.
     * Used for grouping and filtering results in the UI.
     */
    category: ValidationCategory;
    /**
     * Human-readable message describing the result.
     * Displayed to the user in the validation report.
     */
    message: string;
    /**
     * The constraint ID that generated this result, if applicable.
     * Links back to the constraint that was violated.
     */
    constraintId?: string;
    /**
     * The army unit ID this result relates to, if unit-specific.
     * Identifies which unit in the army this result concerns.
     */
    unitId?: string;
    /**
     * The army unit name for display, if unit-specific.
     * Human-readable name of the unit for error messages.
     */
    unitName?: string;
    /**
     * Additional context for debugging or detailed error displays.
     * May contain constraint values, actual counts, limits, etc.
     */
    details?: Record<string, unknown>;
}

/**
 * Summary of all validation results for an army.
 *
 * Aggregates all validation results from the validation engine into a single
 * summary object. Provides counts of errors, warnings, and info messages, plus
 * the complete list of individual results. Used to determine if an army list
 * is legal and to display validation reports to the user.
 */
export interface ValidationSummary {
    /**
     * Whether the army is fully legal (no errors).
     * True if errorCount === 0, False otherwise.
     */
    isValid: boolean;
    /**
     * Total number of errors.
     * Errors indicate the army list is illegal and cannot be used.
     */
    errorCount: number;
    /**
     * Total number of warnings.
     * Warnings indicate potential issues but the army is technically legal.
     */
    warningCount: number;
    /**
     * Total number of informational notes.
     * Info messages are non-critical notes (e.g., unused points).
     */
    infoCount: number;
    /**
     * All individual validation results.
     * Complete list of all rule checks performed, both passed and failed.
     */
    results: ValidationResult[];
}
