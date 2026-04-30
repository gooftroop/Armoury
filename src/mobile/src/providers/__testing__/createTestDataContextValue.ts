/**
 * @requirements
 * - REQ-MOBILE-TEST-001: Test-only factory for DataContextValue. Mirrors the web
 *   createTestManager Proxy pattern (PR #45 O7 mobile symmetry / C-prime).
 *   Production code MUST NOT import from __testing__/ (enforced by ESLint).
 */

import type { DataContextValue } from '../DataContextProvider.js';

/**
 * @internal Creates a test stub for DataContextValue using a Proxy that throws on
 * any access to a property not explicitly provided in `overrides`.
 *
 * Usage:
 * ```tsx
 * import { DataContextReactContext } from '../DataContextProvider.js';
 * import { createTestDataContextValue } from './__testing__/createTestDataContextValue.js';
 *
 * render(
 *   <DataContextReactContext.Provider value={createTestDataContextValue({ status: 'ready' })}>
 *     <ComponentUnderTest />
 *   </DataContextReactContext.Provider>
 * );
 * ```
 */
export function createTestDataContextValue(overrides: Partial<DataContextValue>): DataContextValue {
    const stub = { ...overrides } as DataContextValue;

    return new Proxy(stub, {
        get(target, prop) {
            if (prop in target) {
                return target[prop as keyof typeof target];
            }

            throw new Error(`TestError: DataContextValue.${String(prop)} accessed without override`);
        },
    });
}
