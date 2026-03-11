import { describe, it, expect } from 'vitest';
import { parseConstraint, parseConstraints } from '@/constraintParser.js';
import type { BattleScribeConstraint } from '@/types.js';

describe('parseConstraint', () => {
    it('parses a complete constraint with all fields', () => {
        const constraint: BattleScribeConstraint = {
            '@_id': 'constraint-1',
            '@_name': 'Max 3 Units',
            '@_type': 'max',
            '@_value': '3',
            '@_field': 'selections',
            '@_scope': 'roster',
        };

        const result = parseConstraint(constraint, 'entry-1', 'Space Marines');

        expect(result).toEqual({
            id: 'constraint-1',
            constraintType: 'max',
            value: 3,
            field: 'selections',
            scope: 'roster',
            sourceEntryId: 'entry-1',
            sourceEntryName: 'Space Marines',
        });
    });

    it('applies default values for missing optional fields', () => {
        const constraint: BattleScribeConstraint = {
            '@_id': 'constraint-2',
            '@_name': 'Min 1 Unit',
            '@_type': 'min',
            '@_value': '1',
        };

        const result = parseConstraint(constraint);

        expect(result).toEqual({
            id: 'constraint-2',
            constraintType: 'min',
            value: 1,
            field: 'selections', // default
            scope: 'self', // default
            sourceEntryId: undefined,
            sourceEntryName: undefined,
        });
    });

    it('parses min constraint type', () => {
        const constraint: BattleScribeConstraint = {
            '@_id': 'constraint-min',
            '@_name': 'Minimum Troops',
            '@_type': 'min',
            '@_value': '2',
            '@_field': 'selections',
            '@_scope': 'force',
        };

        const result = parseConstraint(constraint);

        expect(result.constraintType).toBe('min');
        expect(result.value).toBe(2);
        expect(result.scope).toBe('force');
    });

    it('parses max constraint type', () => {
        const constraint: BattleScribeConstraint = {
            '@_id': 'constraint-max',
            '@_name': 'Maximum Heavy Support',
            '@_type': 'max',
            '@_value': '3',
            '@_field': 'selections',
            '@_scope': 'roster',
        };

        const result = parseConstraint(constraint);

        expect(result.constraintType).toBe('max');
        expect(result.value).toBe(3);
        expect(result.scope).toBe('roster');
    });

    it('parses increment constraint type', () => {
        const constraint: BattleScribeConstraint = {
            '@_id': 'constraint-increment',
            '@_name': 'Squad Size Increment',
            '@_type': 'increment',
            '@_value': '5',
            '@_field': 'selections',
            '@_scope': 'parent',
        };

        const result = parseConstraint(constraint);

        expect(result.constraintType).toBe('increment');
        expect(result.value).toBe(5);
        expect(result.scope).toBe('parent');
    });

    it('parses points field constraint', () => {
        const constraint: BattleScribeConstraint = {
            '@_id': 'constraint-points',
            '@_name': 'Max Points',
            '@_type': 'max',
            '@_value': '2000',
            '@_field': 'points',
            '@_scope': 'roster',
        };

        const result = parseConstraint(constraint);

        expect(result.field).toBe('points');
        expect(result.value).toBe(2000);
    });

    it('handles missing value by defaulting to 0', () => {
        const constraint: BattleScribeConstraint = {
            '@_id': 'constraint-no-value',
            '@_name': 'No Value',
            '@_type': 'max',
            '@_value': undefined as unknown as string,
        };

        const result = parseConstraint(constraint);

        expect(result.value).toBe(0);
    });

    it('handles non-numeric value by defaulting to 0', () => {
        const constraint: BattleScribeConstraint = {
            '@_id': 'constraint-invalid',
            '@_name': 'Invalid Value',
            '@_type': 'max',
            '@_value': 'not-a-number',
        };

        const result = parseConstraint(constraint);

        expect(result.value).toBe(0);
    });

    it('parses decimal values as integers', () => {
        const constraint: BattleScribeConstraint = {
            '@_id': 'constraint-decimal',
            '@_name': 'Decimal Value',
            '@_type': 'max',
            '@_value': '3.7',
        };

        const result = parseConstraint(constraint);

        expect(result.value).toBe(3);
    });

    it('preserves source entry metadata', () => {
        const constraint: BattleScribeConstraint = {
            '@_id': 'constraint-with-source',
            '@_name': 'Constraint',
            '@_type': 'max',
            '@_value': '1',
        };

        const result = parseConstraint(constraint, 'unit-123', 'Intercessor Squad');

        expect(result.sourceEntryId).toBe('unit-123');
        expect(result.sourceEntryName).toBe('Intercessor Squad');
    });

    it('handles all scope types', () => {
        const scopes = ['roster', 'parent', 'self', 'force', 'custom-scope'];

        scopes.forEach((scope) => {
            const constraint: BattleScribeConstraint = {
                '@_id': `constraint-${scope}`,
                '@_name': `Constraint ${scope}`,
                '@_type': 'max',
                '@_value': '1',
                '@_scope': scope,
            };

            const result = parseConstraint(constraint);
            expect(result.scope).toBe(scope);
        });
    });
});

describe('parseConstraints', () => {
    it('parses multiple constraints from array', () => {
        const container = {
            constraint: [
                {
                    '@_id': 'constraint-1',
                    '@_name': 'Max 3',
                    '@_type': 'max',
                    '@_value': '3',
                    '@_field': 'selections',
                    '@_scope': 'roster',
                },
                {
                    '@_id': 'constraint-2',
                    '@_name': 'Min 1',
                    '@_type': 'min',
                    '@_value': '1',
                    '@_field': 'selections',
                    '@_scope': 'parent',
                },
            ] as BattleScribeConstraint[],
        };

        const result = parseConstraints(container, 'entry-1', 'Test Entry');

        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('constraint-1');
        expect(result[0].constraintType).toBe('max');
        expect(result[0].value).toBe(3);
        expect(result[0].sourceEntryId).toBe('entry-1');
        expect(result[0].sourceEntryName).toBe('Test Entry');

        expect(result[1].id).toBe('constraint-2');
        expect(result[1].constraintType).toBe('min');
        expect(result[1].value).toBe(1);
        expect(result[1].sourceEntryId).toBe('entry-1');
        expect(result[1].sourceEntryName).toBe('Test Entry');
    });

    it('parses single constraint (not in array)', () => {
        const container = {
            constraint: {
                '@_id': 'constraint-single',
                '@_name': 'Single Constraint',
                '@_type': 'max',
                '@_value': '1',
                '@_field': 'selections',
                '@_scope': 'self',
            } as BattleScribeConstraint,
        };

        const result = parseConstraints(container);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('constraint-single');
        expect(result[0].constraintType).toBe('max');
        expect(result[0].value).toBe(1);
    });

    it('returns empty array for undefined container', () => {
        const result = parseConstraints(undefined);

        expect(result).toEqual([]);
    });

    it('returns empty array for container with no constraints', () => {
        const container = {
            constraint: [] as BattleScribeConstraint[],
        };

        const result = parseConstraints(container);

        expect(result).toEqual([]);
    });

    it('propagates source metadata to all constraints', () => {
        const container = {
            constraint: [
                {
                    '@_id': 'constraint-1',
                    '@_name': 'Constraint 1',
                    '@_type': 'max',
                    '@_value': '3',
                },
                {
                    '@_id': 'constraint-2',
                    '@_name': 'Constraint 2',
                    '@_type': 'min',
                    '@_value': '1',
                },
            ] as BattleScribeConstraint[],
        };

        const result = parseConstraints(container, 'unit-456', 'Tactical Squad');

        expect(result).toHaveLength(2);
        result.forEach((constraint) => {
            expect(constraint.sourceEntryId).toBe('unit-456');
            expect(constraint.sourceEntryName).toBe('Tactical Squad');
        });
    });

    it('handles mixed constraint types in array', () => {
        const container = {
            constraint: [
                {
                    '@_id': 'constraint-min',
                    '@_name': 'Min',
                    '@_type': 'min',
                    '@_value': '1',
                    '@_field': 'selections',
                    '@_scope': 'parent',
                },
                {
                    '@_id': 'constraint-max',
                    '@_name': 'Max',
                    '@_type': 'max',
                    '@_value': '10',
                    '@_field': 'selections',
                    '@_scope': 'parent',
                },
                {
                    '@_id': 'constraint-increment',
                    '@_name': 'Increment',
                    '@_type': 'increment',
                    '@_value': '5',
                    '@_field': 'selections',
                    '@_scope': 'parent',
                },
            ] as BattleScribeConstraint[],
        };

        const result = parseConstraints(container);

        expect(result).toHaveLength(3);
        expect(result[0].constraintType).toBe('min');
        expect(result[1].constraintType).toBe('max');
        expect(result[2].constraintType).toBe('increment');
    });

    it('handles constraints with different scopes', () => {
        const container = {
            constraint: [
                {
                    '@_id': 'constraint-roster',
                    '@_name': 'Roster Constraint',
                    '@_type': 'max',
                    '@_value': '3',
                    '@_scope': 'roster',
                },
                {
                    '@_id': 'constraint-force',
                    '@_name': 'Force Constraint',
                    '@_type': 'min',
                    '@_value': '1',
                    '@_scope': 'force',
                },
                {
                    '@_id': 'constraint-parent',
                    '@_name': 'Parent Constraint',
                    '@_type': 'max',
                    '@_value': '2',
                    '@_scope': 'parent',
                },
                {
                    '@_id': 'constraint-self',
                    '@_name': 'Self Constraint',
                    '@_type': 'max',
                    '@_value': '1',
                    '@_scope': 'self',
                },
            ] as BattleScribeConstraint[],
        };

        const result = parseConstraints(container);

        expect(result).toHaveLength(4);
        expect(result[0].scope).toBe('roster');
        expect(result[1].scope).toBe('force');
        expect(result[2].scope).toBe('parent');
        expect(result[3].scope).toBe('self');
    });

    it('handles constraints with different fields', () => {
        const container = {
            constraint: [
                {
                    '@_id': 'constraint-selections',
                    '@_name': 'Selections',
                    '@_type': 'max',
                    '@_value': '3',
                    '@_field': 'selections',
                },
                {
                    '@_id': 'constraint-points',
                    '@_name': 'Points',
                    '@_type': 'max',
                    '@_value': '2000',
                    '@_field': 'points',
                },
            ] as BattleScribeConstraint[],
        };

        const result = parseConstraints(container);

        expect(result).toHaveLength(2);
        expect(result[0].field).toBe('selections');
        expect(result[0].value).toBe(3);
        expect(result[1].field).toBe('points');
        expect(result[1].value).toBe(2000);
    });
});
