/**
 * Mobile stub for SystemAccessGate.
 *
 * @requirements
 * 1. Must export a mobile-compatible SystemAccessGate component.
 * 2. Must render children unchanged on mobile.
 * 3. Must not use default exports.
 */

import type { ReactElement, ReactNode } from 'react';

/**
 * Props for the mobile SystemAccessGate stub.
 */
export interface SystemAccessGateProps {
    /** The game system identifier to validate access against. */
    systemId: string;
    /** Child content rendered inside the gate. */
    children: ReactNode;
}

/**
 * Mobile no-op gate.
 *
 * @param props - Access gate props.
 * @returns Child content unchanged.
 */
export function SystemAccessGate({ children }: SystemAccessGateProps): ReactElement {
    return <>{children}</>;
}

SystemAccessGate.displayName = 'SystemAccessGate';
