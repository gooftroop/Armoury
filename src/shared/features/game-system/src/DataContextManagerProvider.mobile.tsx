/**
 * Mobile DataContextManagerProvider stub.
 *
 * The mobile app wires its own `DataContextProvider` (see
 * `src/mobile/src/providers/DataContextProvider.tsx`) directly into the
 * Expo Router root layout. That provider cannot be imported from this
 * shared workspace because doing so would create a circular dependency
 * (`@armoury/feature-game-system` → `@armoury/mobile`).
 *
 * This file therefore exports an intentional pass-through stub so that
 * cross-platform consumers of `@armoury/feature-game-system` resolve
 * successfully under the `react-native` export condition. The mobile
 * `DataContextProvider` is the real provider and `useDataContext`
 * should be imported from `@/providers/DataContextProvider.js` on mobile.
 *
 * This mirrors the sibling pattern used by `SystemAccessGate.mobile.tsx`
 * and `SystemAutoRestore.mobile.tsx`.
 *
 * @requirements
 * 1. Must export a DataContextManagerProvider component on mobile.
 * 2. Must render children unchanged (pass-through stub — see file header).
 * 3. Must not use default exports.
 */

import type { ReactElement, ReactNode } from 'react';

/**
 * Props for the mobile DataContextManagerProvider stub.
 */
export interface DataContextManagerProviderProps {
    /** Child components rendered through the stub. */
    children: ReactNode;
}

/**
 * Mobile pass-through stub. See the file header for why this is a stub
 * and where the real mobile DataContextProvider lives.
 *
 * @param props - Provider props.
 * @returns Children rendered unchanged.
 */
export function DataContextManagerProvider({ children }: DataContextManagerProviderProps): ReactElement {
    return <>{children}</>;
}

DataContextManagerProvider.displayName = 'DataContextManagerProvider';
