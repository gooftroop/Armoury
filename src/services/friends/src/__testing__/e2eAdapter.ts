import { LocalDatabaseAdapter } from '@/utils/localAdapter.js';

const E2E_CONFIG = {
    host: 'localhost',
    port: 5434,
    user: 'armoury',
    password: 'armoury_local',
    database: 'armoury_friends',
    ssl: false,
} as const;

/**
 * Creates an initialized LocalDatabaseAdapter for the e2e Docker PostgreSQL instance.
 * @returns Initialized adapter ready for e2e tests.
 */
export async function createE2EAdapter(): Promise<LocalDatabaseAdapter> {
    const adapter = new LocalDatabaseAdapter(E2E_CONFIG);

    await adapter.initialize();

    return adapter;
}

/**
 * Deletes all rows from every entity store to reset state between e2e tests.
 * @param adapter - Initialized database adapter.
 */
export async function resetDatabase(adapter: LocalDatabaseAdapter): Promise<void> {
    await adapter.transaction(async () => {
        const stores = ['friend', 'userPresence'] as const;

        for (const store of stores) {
            const all = await adapter.getAll(store);

            for (const entity of all) {
                const id =
                    store === 'userPresence' ? (entity as { userId: string }).userId : (entity as { id: string }).id;

                await adapter.delete(store, id);
            }
        }
    });
}
