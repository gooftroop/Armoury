import { getMergedDSQLSchema } from '@armoury/data-dao';
import { generateAllTablesDDL } from '@armoury/adapters-pglite';

type PGliteInstance = {
    close: () => Promise<void>;
    exec: (sql: string) => Promise<void>;
};

type PGliteConstructor = new (dataDir?: string) => PGliteInstance;

type DrizzleFactory = (client: PGliteInstance, options: { schema: Record<string, unknown> }) => unknown;

const { PGlite } = (await import('@electric-sql/pglite')) as unknown as { PGlite: PGliteConstructor };
const { drizzle } = (await import('drizzle-orm/pglite')) as unknown as { drizzle: DrizzleFactory };

/**
 * Creates an in-memory PGlite instance with all core tables created from the merged Drizzle schema.
 * Call `teardown()` in afterAll/afterEach to close the connection.
 */
export async function createTestDatabase(): Promise<{
    client: PGliteInstance;
    db: unknown;
    teardown: () => Promise<void>;
}> {
    const client = new PGlite();

    const mergedSchema = getMergedDSQLSchema();
    const db = drizzle(client, { schema: mergedSchema.tables });

    const ddl = generateAllTablesDDL();

    if (ddl.trim()) {
        await client.exec(ddl);
    }

    return {
        client,
        db,
        teardown: async () => {
            await client.close();
        },
    };
}
