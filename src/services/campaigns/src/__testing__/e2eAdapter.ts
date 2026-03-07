import { PGliteAdapter } from '@adapters-pglite/adapter.js';

export async function createE2EAdapter(): Promise<PGliteAdapter> {
    const adapter = new PGliteAdapter({ dataDir: 'memory://' });

    await adapter.initialize();

    return adapter;
}

/**
 * Deletes all rows from every entity store to reset state between e2e tests.
 * @param adapter - Initialized database adapter.
 */
export async function resetDatabase(adapter: PGliteAdapter): Promise<void> {
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
