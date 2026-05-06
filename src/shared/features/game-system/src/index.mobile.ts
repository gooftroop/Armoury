/**
 * @armoury/feature-game-system — mobile barrel file.
 *
 * @requirements
 * 1. Must re-export mobile-compatible game-system utilities.
 * 2. Must not use default exports.
 */

// === Providers ===

export {
    DataContextManagerProvider,
    type DataContextManagerProviderProps,
} from './DataContextManagerProvider.mobile.js';

// === Components ===

export { SystemAccessGate, type SystemAccessGateProps } from './SystemAccessGate.mobile.js';
export { SystemAutoRestore, type SystemAutoRestoreProps } from './SystemAutoRestore.mobile.js';

// === Utilities ===

export { resolveGameSystem } from './utils/resolveGameSystem.mobile.js';
