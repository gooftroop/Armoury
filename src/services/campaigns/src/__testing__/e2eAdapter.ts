/**
 * @requirements
 * - REQ-E2E-DI-001: E2E tests compose adapters via DI containers, not direct instantiation.
 */

import { createE2EContainer, TOKENS } from '@armoury/di';
import type { AdapterFactoryFn } from '@armoury/di';
import type { DatabaseAdapter } from '@armoury/data-dao';

/**
 * Creates an initialized in-memory PGlite adapter for campaigns E2E tests
 * using the shared DI container.
 *
 * @returns Initialized adapter ready for e2e tests.
 */
export async function createE2EAdapter(): Promise<DatabaseAdapter> {
    const container = createE2EContainer();
    const factory = container.get<AdapterFactoryFn>(TOKENS.AdapterFactory);
    const adapter = await factory();

    await adapter.initialize();

    return adapter;
}

/**
 * Deletes all rows from every entity store to reset state between e2e tests.
 *
 * @param adapter - Initialized database adapter.
 */
export async function resetDatabase(adapter: DatabaseAdapter): Promise<void> {
    await adapter.transaction(async () => {
        const stores = ['campaignParticipant', 'campaign'] as const;

        for (const store of stores) {
            const all = await adapter.getAll(store);

            for (const entity of all) {
                await adapter.delete(store, (entity as { id: string }).id);
            }
        }
    });
}
