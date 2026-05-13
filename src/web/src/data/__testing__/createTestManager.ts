import type { DataContextManager } from '../DataContextManager.js';

/**
 * @requirements
 * - O7 (PR #45): Remove NODE_ENV test branch; test code must use dedicated test factories.
 */

/**
 * Constructs a fake DataContextManager for unit tests.
 *
 * WARNING: Stub methods do NOT enforce inter-method invariants that the real
 * DataContextManager preserves. Tests verifying such invariants MUST use a real
 * DataContextManager instance, not this fake.
 *
 * Each unset method throws on call to prevent silent undefined corruption —
 * tests must explicitly opt into every method they exercise via overrides.
 */
export function createTestManager(overrides: Partial<DataContextManager> = {}): DataContextManager {
    return new Proxy({} as DataContextManager, {
        get(_target, prop: string | symbol) {
            if (prop in overrides) {
                return (overrides as Record<string | symbol, unknown>)[prop];
            }

            throw new Error(
                `createTestManager: method/property "${String(prop)}" was not stubbed. ` +
                    `Add it to the overrides argument.`,
            );
        },
    });
}
