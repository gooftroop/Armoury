import { describe, it, expect } from 'vitest';

import type { BattleScribeConstraint } from '@armoury/providers-bsdata';

import { validateArmyWithRules } from '@/engine.js';
import { parseConstraints, parseConstraint } from '@/constraints/parser.js';
import type { ValidationResult } from '@/types.js';

/**
 * Test Plan for validation engine and constraint parser
 *
 * Sources:
 * - src/shared/validation/src/engine.ts
 * - src/shared/validation/src/constraints/parser.ts
 *
 * @requirements
 * 1. Validation engine must execute all provided rules and flatten their results.
 *    - Test: aggregates results from multiple rules in order.
 * 2. Validation engine must compute summary counts by severity and pass/fail state.
 *    - Test: counts only failed errors/warnings and counts all info results.
 * 3. Validation engine must set isValid to false when any failed error exists.
 *    - Test: invalid when at least one failed error is present.
 * 4. Validation engine must set isValid to true when there are no failed errors.
 *    - Test: valid when only warnings/info or passed errors are present.
 * 5. Constraint parser must parse single constraints and containers.
 *    - Test: parses single and multi-constraint containers with source metadata.
 * 6. Constraint parser must handle edge and malformed values safely.
 *    - Test: defaults invalid numeric values to 0 and applies field/scope defaults.
 *    - Test: supports empty container, boundary numeric strings, and custom field/scope text.
 */

describe('Constraint Parser', () => {
    it('parses a BattleScribe constraint element', () => {
        const constraint: BattleScribeConstraint = {
            '@_id': 'constraint-1',
            '@_name': 'Max Copies',
            '@_type': 'max',
            '@_value': '3',
            '@_field': 'selections',
            '@_scope': 'roster',
        };
        const parsed = parseConstraint(constraint, 'entry-1', 'Entry Name');
        expect(parsed).toMatchObject({
            id: 'constraint-1',
            constraintType: 'max',
            value: 3,
            field: 'selections',
            scope: 'roster',
            sourceEntryId: 'entry-1',
            sourceEntryName: 'Entry Name',
        });
    });

    it('handles missing optional fields with defaults', () => {
        const constraint = {
            '@_id': 'constraint-2',
            '@_name': 'Default Fields',
            '@_type': 'min',
            '@_value': '1',
            '@_field': undefined,
            '@_scope': undefined,
        } as BattleScribeConstraint;
        const parsed = parseConstraint(constraint);
        expect(parsed).toMatchObject({
            field: 'selections',
            scope: 'self',
            value: 1,
        });
    });

    it('parses a container with multiple constraints', () => {
        const constraints = parseConstraints({
            constraint: [
                {
                    '@_id': 'constraint-3',
                    '@_name': 'Min',
                    '@_type': 'min',
                    '@_value': '1',
                    '@_field': 'selections',
                    '@_scope': 'self',
                },
                {
                    '@_id': 'constraint-4',
                    '@_name': 'Max',
                    '@_type': 'max',
                    '@_value': '3',
                    '@_field': 'selections',
                    '@_scope': 'roster',
                },
            ],
        });
        expect(constraints).toHaveLength(2);
        expect(constraints[1]).toMatchObject({
            id: 'constraint-4',
            constraintType: 'max',
            value: 3,
        });
    });

    it('returns empty array for undefined container', () => {
        expect(parseConstraints(undefined)).toEqual([]);
    });

    it('parses a single-constraint container and keeps source metadata', () => {
        const constraint: BattleScribeConstraint = {
            '@_id': 'constraint-single',
            '@_name': 'Single',
            '@_type': 'increment',
            '@_value': '5',
            '@_field': 'selections',
            '@_scope': 'parent',
        };

        const parsed = parseConstraints({ constraint }, 'entry-2', 'Unit Entry');

        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toMatchObject({
            id: 'constraint-single',
            constraintType: 'increment',
            value: 5,
            field: 'selections',
            scope: 'parent',
            sourceEntryId: 'entry-2',
            sourceEntryName: 'Unit Entry',
        });
    });

    it('defaults malformed numeric values to 0 and defaults field/scope', () => {
        const malformedValueConstraint: BattleScribeConstraint = {
            '@_id': 'constraint-malformed',
            '@_name': 'Malformed Value',
            '@_type': 'max',
            '@_value': 'not-a-number',
        };

        const parsed = parseConstraint(malformedValueConstraint);

        expect(parsed.value).toBe(0);
        expect(parsed.field).toBe('selections');
        expect(parsed.scope).toBe('self');
    });

    it('handles boundary numeric strings and custom scope/field values', () => {
        const zeroConstraint: BattleScribeConstraint = {
            '@_id': 'constraint-zero',
            '@_name': 'Zero',
            '@_type': 'min',
            '@_value': '0',
            '@_field': 'points',
            '@_scope': 'roster',
        };
        const negativeConstraint: BattleScribeConstraint = {
            '@_id': 'constraint-negative',
            '@_name': 'Negative',
            '@_type': 'max',
            '@_value': '-1',
            '@_field': 'customField',
            '@_scope': 'customScope',
        };
        const largeConstraint: BattleScribeConstraint = {
            '@_id': 'constraint-large',
            '@_name': 'Large',
            '@_type': 'max',
            '@_value': '999999',
            '@_field': 'selections',
            '@_scope': 'force',
        };

        const parsed = parseConstraints({ constraint: [zeroConstraint, negativeConstraint, largeConstraint] });

        expect(parsed).toHaveLength(3);
        expect(parsed[0]).toMatchObject({ value: 0, field: 'points', scope: 'roster' });
        expect(parsed[1]).toMatchObject({ value: -1, field: 'customField', scope: 'customScope' });
        expect(parsed[2]).toMatchObject({ value: 999999, field: 'selections', scope: 'force' });
    });

    it('returns empty array for an empty constraints container', () => {
        expect(parseConstraints({ constraint: [] })).toEqual([]);
    });
});

describe('validateArmyWithRules', () => {
    it('executes all rules and flattens their results in order', () => {
        const calls: string[] = [];
        const army = { id: 'army-1' };
        const data = { gameSystem: 'wh40k10e' };

        const firstRule = (_army: unknown, _data: unknown): ValidationResult[] => {
            calls.push('first');

            return [
                {
                    id: 'result-error',
                    passed: false,
                    severity: 'error',
                    category: 'composition',
                    message: 'Too many copies selected.',
                },
            ];
        };

        const secondRule = (_army: unknown, _data: unknown): ValidationResult[] => {
            calls.push('second');

            return [
                {
                    id: 'result-warning',
                    passed: false,
                    severity: 'warning',
                    category: 'points',
                    message: 'Army has very low points.',
                },
                {
                    id: 'result-info',
                    passed: true,
                    severity: 'info',
                    category: 'general',
                    message: 'Validation completed.',
                },
            ];
        };

        const summary = validateArmyWithRules(army, data, [firstRule, secondRule]);

        expect(calls).toEqual(['first', 'second']);
        expect(summary.results.map((result) => result.id)).toEqual(['result-error', 'result-warning', 'result-info']);
    });

    it('counts severities correctly and sets isValid false when failed errors exist', () => {
        const rules = [
            (): ValidationResult[] => [
                {
                    id: 'failed-error',
                    passed: false,
                    severity: 'error',
                    category: 'composition',
                    message: 'Illegal list.',
                },
                {
                    id: 'failed-warning',
                    passed: false,
                    severity: 'warning',
                    category: 'general',
                    message: 'Potential issue.',
                },
                {
                    id: 'passed-error',
                    passed: true,
                    severity: 'error',
                    category: 'points',
                    message: 'Rule check passed.',
                },
                {
                    id: 'info-item',
                    passed: true,
                    severity: 'info',
                    category: 'general',
                    message: 'Informational result.',
                },
            ],
        ];

        const summary = validateArmyWithRules({}, {}, rules);

        expect(summary.isValid).toBe(false);
        expect(summary.errorCount).toBe(1);
        expect(summary.warningCount).toBe(1);
        expect(summary.infoCount).toBe(1);
        expect(summary.results).toHaveLength(4);
    });

    it('sets isValid true when no failed errors are present', () => {
        const rules = [
            (): ValidationResult[] => [
                {
                    id: 'warning-only',
                    passed: false,
                    severity: 'warning',
                    category: 'points',
                    message: 'Points are unusually low.',
                },
                {
                    id: 'info-only',
                    passed: true,
                    severity: 'info',
                    category: 'general',
                    message: 'No hard failures.',
                },
            ],
        ];

        const summary = validateArmyWithRules({}, {}, rules);

        expect(summary.isValid).toBe(true);
        expect(summary.errorCount).toBe(0);
        expect(summary.warningCount).toBe(1);
        expect(summary.infoCount).toBe(1);
    });

    it('returns an empty valid summary when no rules are provided', () => {
        const summary = validateArmyWithRules({}, {}, []);

        expect(summary).toEqual({
            isValid: true,
            errorCount: 0,
            warningCount: 0,
            infoCount: 0,
            results: [],
        });
    });
});
