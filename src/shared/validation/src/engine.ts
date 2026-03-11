import type { ValidationResult, ValidationSummary } from '@/types.js';

/**
 * A validation rule function that can be provided by plugins.
 */
export type ValidationRuleFn = (army: unknown, factionData: unknown) => ValidationResult[];

/**
 * Generic army validation that accepts rules as parameters.
 * Used by the plugin system — plugins provide their own validation rules.
 * @param army - The army list to validate.
 * @param data - The data for validation context.
 * @param rules - Array of validation rule functions to execute.
 * @returns A ValidationSummary with results from all rules.
 */
export function validateArmyWithRules(army: unknown, data: unknown, rules: ValidationRuleFn[]): ValidationSummary {
    const results: ValidationResult[] = [];

    for (const rule of rules) {
        results.push(...rule(army, data));
    }

    const errorCount = results.filter((result) => result.severity === 'error' && !result.passed).length;
    const warningCount = results.filter((result) => result.severity === 'warning' && !result.passed).length;
    const infoCount = results.filter((result) => result.severity === 'info').length;

    return {
        isValid: errorCount === 0,
        errorCount,
        warningCount,
        infoCount,
        results,
    };
}
