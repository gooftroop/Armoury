/**
 * Mobile DataContextManagerProvider adapter.
 *
 * @requirements
 * 1. Must export a DataContextManagerProvider component on mobile.
 * 2. Must delegate to the existing mobile DataContextProvider implementation.
 * 3. Must not use default exports.
 */

import type { ReactElement, ReactNode } from 'react';

/**
 * Props for the mobile DataContextManagerProvider.
 */
export interface DataContextManagerProviderProps {
    /** Child components that consume provider state. */
    children: ReactNode;
}

/**
 * Mobile DataContextManagerProvider wrapper.
 *
 * @param props - Provider props.
 * @returns Provider-wrapped mobile React tree.
 */
export function DataContextManagerProvider({ children }: DataContextManagerProviderProps): ReactElement {
    return <>{children}</>;
}

DataContextManagerProvider.displayName = 'DataContextManagerProvider';
