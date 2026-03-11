import { LocalDatabaseAdapter } from '../utils/localAdapter.ts';

const E2E_CONFIG = {
    host: 'localhost',
    port: 5432,
    user: 'armoury',
    password: 'armoury_local',
    database: 'armoury_users',
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
        const stores = ['account', 'user'] as const;

        for (const store of stores) {
            const all = await adapter.getAll(store);

            for (const entity of all) {
                await adapter.delete(store, (entity as { id: string }).id);
            }
        }
    });
}
