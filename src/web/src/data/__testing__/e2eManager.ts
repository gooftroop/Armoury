/**
 * E2E test bridge for DataContextManager.
 *
 * Installs window.__armoury_raw_query against the manager's live adapter so
 * Playwright specs in src/web/e2e/ can issue raw SQL against the same PGlite
 * instance the app uses. Loaded only when NODE_ENV === 'test' via dynamic
 * import in managerContext.tsx — production bundles tree-shake this module
 * out entirely.
 *
 * @module @armoury/web/data/testing
 *
 * @requirements
 * - REQ-WEB-E2E-001: Test bridge code MUST NOT appear in production bundles.
 * - REQ-WEB-E2E-002: Bridge MUST query the same adapter instance the app uses.
 */

import type { DataContextManager } from '../DataContextManager.js';

declare global {
    interface Window {
        __armoury_raw_query?: (sql: string, params?: unknown[]) => Promise<unknown>;
    }
}

export function installE2EBridge(manager: DataContextManager): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.__armoury_raw_query = (sql: string, params?: unknown[]) => manager.rawQuery(sql, params);
}
