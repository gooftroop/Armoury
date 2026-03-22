/**
 * Test Plan for engine.ts
 *
 * Source: src/shared/validation/src/engine.ts
 *
 * @requirements
 * 1. Must return an empty valid summary when no rules are provided.
 *    - Test: empty rules array produces zero counts, no results, and isValid=true.
 * 2. Must aggregate rule outputs in execution order.
 *    - Test: multiple rules append results in order from each rule.
 * 3. Must set isValid=true when there are no failed errors.
 *    - Test: passed result only keeps isValid=true.
 *    - Test: failed warning only keeps isValid=true.
 * 4. Must set isValid=false when there is at least one failed error.
 *    - Test: single failed error result sets isValid=false and errorCount=1.
 * 5. Must count failed errors and failed warnings only.
 *    - Test: mixed passed/failed severities count only failed error/warning results.
 * 6. Must count info results regardless of passed status.
 *    - Test: passed + failed info both increment infoCount.
 * 7. Must tolerate rules that return empty arrays.
 *    - Test: empty-array rule contributes no results and keeps counts unchanged.
 */

import { describe, expect, it } from 'vitest';

import { validateArmyWithRules, type ValidationRuleFn } from '@/engine.js';
import type { ValidationResult } from '@/types.js';

const makeResult = (overrides: Partial<ValidationResult> = {}): ValidationResult => {
    return {
        id: 'result-1',
        passed: true,
        severity: 'info',
        category: 'general',
        message: 'Validation result.',
        ...overrides,
    };
};

describe('validateArmyWithRules', () => {
    it('returns an empty valid summary when rules are empty', () => {
        const summary = validateArmyWithRules({ armyId: 'army-1' }, { dataId: 'data-1' }, []);

        expect(summary).toEqual({
            isValid: true,
            errorCount: 0,
            warningCount: 0,
            infoCount: 0,
            results: [],
        });
    });

    it('keeps isValid true for a single passed result', () => {
        const rule: ValidationRuleFn = () => [
            makeResult({ id: 'passed-info', passed: true, severity: 'info', category: 'general' }),
        ];

        const summary = validateArmyWithRules({}, {}, [rule]);

        expect(summary.isValid).toBe(true);
        expect(summary.errorCount).toBe(0);
        expect(summary.warningCount).toBe(0);
        expect(summary.infoCount).toBe(1);
        expect(summary.results).toHaveLength(1);
    });

    it('sets isValid false for a single failed error', () => {
        const rule: ValidationRuleFn = () => [
            makeResult({
                id: 'failed-error',
                passed: false,
                severity: 'error',
                category: 'composition',
                message: 'Too many units selected.',
            }),
        ];

        const summary = validateArmyWithRules({}, {}, [rule]);

        expect(summary.isValid).toBe(false);
        expect(summary.errorCount).toBe(1);
        expect(summary.warningCount).toBe(0);
        expect(summary.infoCount).toBe(0);
    });

    it('keeps isValid true for a single failed warning', () => {
        const rule: ValidationRuleFn = () => [
            makeResult({
                id: 'failed-warning',
                passed: false,
                severity: 'warning',
                category: 'points',
                message: 'Low points total.',
            }),
        ];

        const summary = validateArmyWithRules({}, {}, [rule]);

        expect(summary.isValid).toBe(true);
        expect(summary.errorCount).toBe(0);
        expect(summary.warningCount).toBe(1);
        expect(summary.infoCount).toBe(0);
    });

    it('aggregates results from multiple rules in order', () => {
        const firstRule: ValidationRuleFn = () => [
            makeResult({
                id: 'rule-1-warning',
                passed: false,
                severity: 'warning',
                category: 'detachment',
                message: 'First rule warning.',
            }),
        ];
        const secondRule: ValidationRuleFn = () => [
            makeResult({
                id: 'rule-2-error',
                passed: false,
                severity: 'error',
                category: 'wargear',
                message: 'Second rule error.',
            }),
            makeResult({
                id: 'rule-2-info',
                passed: true,
                severity: 'info',
                category: 'general',
                message: 'Second rule info.',
            }),
        ];

        const summary = validateArmyWithRules({ id: 'army' }, { id: 'data' }, [firstRule, secondRule]);

        expect(summary.results.map((result) => result.id)).toEqual(['rule-1-warning', 'rule-2-error', 'rule-2-info']);
        expect(summary.errorCount).toBe(1);
        expect(summary.warningCount).toBe(1);
        expect(summary.infoCount).toBe(1);
        expect(summary.isValid).toBe(false);
    });

    it('counts mixed severities correctly and counts info regardless of passed status', () => {
        const mixedRule: ValidationRuleFn = () => [
            makeResult({ id: 'error-failed', passed: false, severity: 'error', category: 'composition' }),
            makeResult({ id: 'warning-failed', passed: false, severity: 'warning', category: 'points' }),
            makeResult({ id: 'warning-passed', passed: true, severity: 'warning', category: 'points' }),
            makeResult({ id: 'info-passed', passed: true, severity: 'info', category: 'general' }),
            makeResult({ id: 'info-failed', passed: false, severity: 'info', category: 'general' }),
        ];

        const summary = validateArmyWithRules({}, {}, [mixedRule]);

        expect(summary.isValid).toBe(false);
        expect(summary.errorCount).toBe(1);
        expect(summary.warningCount).toBe(1);
        expect(summary.infoCount).toBe(2);
        expect(summary.results).toHaveLength(5);
    });

    it('ignores rules that return empty arrays', () => {
        const emptyRule: ValidationRuleFn = () => [];
        const infoRule: ValidationRuleFn = () => [
            makeResult({ id: 'info-only', passed: true, severity: 'info', category: 'general' }),
        ];

        const summary = validateArmyWithRules({}, {}, [emptyRule, infoRule]);

        expect(summary.results).toEqual([
            {
                id: 'info-only',
                passed: true,
                severity: 'info',
                category: 'general',
                message: 'Validation result.',
            },
        ]);
        expect(summary.isValid).toBe(true);
        expect(summary.errorCount).toBe(0);
        expect(summary.warningCount).toBe(0);
        expect(summary.infoCount).toBe(1);
    });
});
