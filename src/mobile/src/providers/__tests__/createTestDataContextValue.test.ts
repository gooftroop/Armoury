/**
 * @requirements
 * - REQ-MOBILE-TEST-001: createTestDataContextValue factory contract
 *
 * Test Plan:
 * | # | Requirement                    | Test case                                      |
 * |---|-------------------------------|------------------------------------------------|
 * | 1 | REQ-MOBILE-TEST-001           | throws on access to non-overridden property    |
 * | 2 | REQ-MOBILE-TEST-001           | returns override value when property provided  |
 */
import { describe, expect, it } from 'vitest';
import { createTestDataContextValue } from '../__testing__/createTestDataContextValue.js';

describe('createTestDataContextValue', () => {
    it('throws on access to non-overridden property', () => {
        const value = createTestDataContextValue({});
        expect(() => (value as unknown as Record<string, unknown>)['status']).toThrow(
            /DataContextValue\.status accessed without override/,
        );
    });

    it('returns the override value when property is provided', () => {
        const value = createTestDataContextValue({ status: 'ready' });
        expect((value as unknown as Record<string, unknown>)['status']).toBe('ready');
    });
});
