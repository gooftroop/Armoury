/**
 * @requirements
 * - REQ-E2E-DI-001: E2E tests compose adapters via DI containers, not direct instantiation.
 * - REQ-E2E-DI-002: Container helper supports adapter factory overrides for Docker Postgres services.
 */

import { createE2EContainer, TOKENS } from '@armoury/di';
import type { AdapterFactoryFn } from '@armoury/di';
import { LocalDatabaseAdapter } from '@/utils/localAdapter.js';

const E2E_CONFIG = {
    host: 'localhost',
    port: 5432,
    user: 'armoury',
    password: 'armoury_local',
    database: 'armoury_users',
    ssl: false,
} as const;

/**
 * Creates an initialized LocalDatabaseAdapter for the e2e Docker PostgreSQL instance
 * using the shared DI container with a custom adapter factory.
 *
 * @returns Initialized adapter ready for e2e tests.
 */
export async function createE2EAdapter(): Promise<LocalDatabaseAdapter> {
    const container = createE2EContainer({
        overrides: {
            // LocalDatabaseAdapter implements the service-local DatabaseAdapter which is a
            // subset of @armoury/data-dao's full interface. The cast is safe because the DI
            // container only resolves this factory in e2e tests that use the local adapter.
            adapterFactory: (async () => new LocalDatabaseAdapter(E2E_CONFIG)) as unknown as AdapterFactoryFn,
        },
    });
    const factory = container.get<AdapterFactoryFn>(TOKENS.AdapterFactory);
    const adapter = (await factory()) as unknown as LocalDatabaseAdapter;

    await adapter.initialize();

    return adapter;
}

/**
 * Deletes all rows from every entity store to reset state between e2e tests.
 *
 * @param adapter - Initialized database adapter.
 */
export async function resetDatabase(adapter: LocalDatabaseAdapter): Promise<void> {
    await adapter.transaction(async () => {
        const stores = ['account', 'user'] as const;

        for (const store of stores) {
            const all = await adapter.getAll(store);

            for (const entity of all) {
                await adapter.delete(store, (entity as { id: string }).id);
            }
        }
    });
}
