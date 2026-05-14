/**
 * Mobile stub for SystemAutoRestore.
 *
 * @requirements
 * 1. Must export a mobile-compatible SystemAutoRestore component.
 * 2. Must render null on mobile.
 * 3. Must not use default exports.
 */

/**
 * Props for the mobile SystemAutoRestore stub.
 */
export interface SystemAutoRestoreProps {
    /** The game system identifier to restore. */
    systemId: string;
}

/**
 * Mobile no-op auto-restore.
 *
 * @param _props - Auto-restore props.
 * @returns Always null.
 */
export function SystemAutoRestore(_props: SystemAutoRestoreProps): null {
    return null;
}

SystemAutoRestore.displayName = 'SystemAutoRestore';
