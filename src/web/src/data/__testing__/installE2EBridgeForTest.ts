import type { DataContextManager } from '../DataContextManager.js';
import { installE2EBridge } from './e2eManager.js';

/**
 * @requirements
 * - O7 (PR #45): Proper module replacement for the production NODE_ENV === 'test' branch.
 */

/**
 * Installs the e2e bridge for a manager instance from test code.
 * Replaces the production NODE_ENV branch removed in Task 15 (O7b).
 * Call from e2e harness setup or from individual tests that need the bridge.
 */
export function installE2EBridgeForTest(manager: DataContextManager): void {
    installE2EBridge(manager);
}
