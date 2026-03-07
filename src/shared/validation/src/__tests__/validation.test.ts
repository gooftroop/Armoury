import { describe, it, expect } from 'vitest';

import type { BattleScribeConstraint } from '@providers-bsdata/types.js';
import { parseConstraints, parseConstraint } from '@validation/constraints/parser.js';
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
});
