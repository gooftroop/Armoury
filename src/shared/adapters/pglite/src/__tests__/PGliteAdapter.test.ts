/**
 * Test Plan for adapter.ts
 *
 * Source: src/shared/adapters/pglite/src/adapter.ts
 *
 * Requirement 1: initialize() is idempotent
 *   - Test: calling initialize() twice creates only one PGlite instance
 *
 * Requirement 2: close() delegates to the active PGlite client
 *   - Test: close() calls client.close() once after initialize()
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockClose, mockPGliteConstructor } = vi.hoisted(() => {
    const close = vi.fn(async () => {});
    const exec = vi.fn(async () => {});
    const query = vi.fn(async () => ({ rows: [] }));
    const ctor = vi.fn(function MockPGlite(this: {
        close: () => Promise<void>;
        exec: (sql: string) => Promise<void>;
        query: (sql: string) => Promise<{ rows: unknown[] }>;
    }) {
        this.close = close;
        this.exec = exec;
        this.query = query;
    });

    return {
        mockClose: close,
        mockPGliteConstructor: ctor,
    };
});

vi.mock('@electric-sql/pglite', () => ({
    PGlite: mockPGliteConstructor,
}));

import { PGliteAdapter } from '@/adapter.js';

/**
 * @requirements
 * - REQ-ADAPTERS-PGLITE-TEST-01: initialize() must be idempotent and avoid creating a second PGlite instance when already initialized.
 * - REQ-ADAPTERS-PGLITE-TEST-02: close() must delegate to the initialized client and close the underlying connection.
 */

describe('PGliteAdapter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('initialize is idempotent — calling twice creates only one PGlite instance', async () => {
        const adapter = new PGliteAdapter({ dataDir: 'memory://' });

        await adapter.initialize();
        await adapter.initialize();

        expect(mockPGliteConstructor).toHaveBeenCalledTimes(1);

        await adapter.close();

        expect(mockClose).toHaveBeenCalledTimes(1);
    });
});
