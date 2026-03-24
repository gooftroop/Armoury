import { generateAllTablesDDL, getAllTableNames } from '@armoury/adapters-pglite';

type PgClient = {
    connect: () => Promise<void>;
    end: () => Promise<void>;
    query: (text: string) => Promise<unknown>;
};

type PgClientConstructor = new (config: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    ssl: boolean;
}) => PgClient;

const { Client } = (await import('pg')) as unknown as { Client: PgClientConstructor };

const DSQL_E2E_CONFIG = {
    host: 'localhost',
    port: 5436,
    user: 'armoury',
    password: 'armoury_local',
    database: 'armoury_dsql_test',
    ssl: false,
} as const;

/**
 * Creates all tables from the merged Drizzle DSQL schema in the Docker PostgreSQL instance.
 * Intended to run once before DSQL e2e tests.
 */
export async function setupDSQLTestDatabase(): Promise<void> {
    const client = new Client(DSQL_E2E_CONFIG);
    await client.connect();

    const ddl = generateAllTablesDDL();

    if (ddl.trim()) {
        await client.query(ddl);
    }

    await client.end();
}

/**
 * Truncates all tables in the DSQL test database. Runs between tests to ensure isolation.
 */
export async function truncateDSQLTestDatabase(): Promise<void> {
    const client = new Client(DSQL_E2E_CONFIG);
    await client.connect();

    const tableNames = getAllTableNames();

    if (tableNames.length > 0) {
        await client.query(`TRUNCATE ${tableNames.map((n) => `"${n}"`).join(', ')} CASCADE`);
    }

    await client.end();
}

/**
 * Returns the raw connection config for creating a DSQLAdapter in e2e tests.
 */
export function getDSQLTestConfig() {
    return { ...DSQL_E2E_CONFIG };
}
