/**
 * @armoury/feature-game-system — web barrel file.
 *
 * @requirements
 * 1. Must re-export web game-system hooks and utilities.
 * 2. Must not use default exports.
 */

// === Hooks ===

export { useGameSystem } from './hooks/useGameSystem.js';
export {
    DataContextManagerProvider,
    useDataContext,
    type DataContextManagerProviderProps,
    type DataContextStatus,
    type DataContextValue,
    type SystemSyncState,
    type SystemSyncStatus,
} from './DataContextManagerProvider.web.js';

// === Utilities ===

export { getKnownSystemIds, resolveGameSystem } from './utils/resolveGameSystem.web.js';

// === Components ===

export { SystemAccessGate, type SystemAccessGateProps } from './SystemAccessGate.web.js';
export { SystemAutoRestore, type SystemAutoRestoreProps } from './SystemAutoRestore.web.js';
