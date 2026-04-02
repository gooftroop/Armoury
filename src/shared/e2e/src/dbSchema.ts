/**
 * Shared database schema management utilities for PR sandbox isolation.
 *
 * Creates and drops PostgreSQL schemas for per-PR database isolation.
 * Used by CI workflows to ensure each PR sandbox operates in its own
 * schema namespace, preventing data collisions between concurrent PRs.
 *
 * Also supports syncing production data into sandbox schemas so that
 * PR environments have realistic user data for testing against Auth0.
 *
 * DSQL configuration is resolved from environment variables:
 * - `DSQL_CLUSTER_ENDPOINT`: Aurora DSQL cluster endpoint hostname (sandbox)
 * - `DSQL_PROD_ENDPOINT`: Aurora DSQL cluster endpoint hostname (production source)
 * - `DSQL_REGION`: AWS region of the DSQL clusters
 *
 * @requirements
 * - REQ-SANDBOX-ISOLATION: Each PR sandbox must operate in an isolated database schema
 * - REQ-SCHEMA-NAMING: PR schemas follow the naming convention `pr_<number>`
 * - REQ-CLEANUP: PR schemas are dropped when the PR is closed
 * - REQ-IDEMPOTENT: Schema creation and deletion must be idempotent
 * - REQ-ENV-CONFIG: DSQL config provided exclusively via environment variables
 * - REQ-DATA-SYNC: Production data is copied to sandbox schemas for realistic testing
 * - REQ-SYNC-SAFETY: Production cluster is read-only during sync; sandbox writes use ON CONFLICT DO NOTHING
 * - REQ-DSQL-BATCH: Writes are batched at 3000 rows per transaction (Aurora DSQL limit)
 */

import { DsqlSigner } from '@aws-sdk/dsql-signer';
import { SCHEMA_NAME_PATTERN, syncTable, verifySyncCounts, type PgClient } from './syncHelpers.js';

interface DsqlConfig {
    /** Aurora DSQL cluster endpoint hostname. */
    clusterEndpoint: string;

    /** AWS region of the DSQL cluster. */
    region: string;
}

type PgClientConstructor = new (config: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    ssl: { rejectUnauthorized: boolean };
}) => PgClient;

/**
 * Resolves DSQL configuration from environment variables.
 *
 * Reads `DSQL_CLUSTER_ENDPOINT` and `DSQL_REGION` env vars.
 *
 * @returns DSQL cluster endpoint and region.
 * @throws Error if environment variables are not set.
 */
function getDsqlConfig(): DsqlConfig {
    const envEndpoint = process.env['DSQL_CLUSTER_ENDPOINT'];
    const envRegion = process.env['DSQL_REGION'];

    if (!envEndpoint || !envRegion) {
        throw new Error('DSQL config not available. Set DSQL_CLUSTER_ENDPOINT and DSQL_REGION environment variables.');
    }

    return { clusterEndpoint: envEndpoint, region: envRegion };
}

/**
 * Creates a PostgreSQL client connected to Aurora DSQL using IAM auth.
 *
 * @param config - DSQL cluster endpoint and region.
 * @returns Connected pg Client instance.
 */
async function createDsqlClient(config: DsqlConfig): Promise<PgClient> {
    const signer = new DsqlSigner({ hostname: config.clusterEndpoint, region: config.region });
    const token = await signer.getDbConnectAdminAuthToken();

    const { Client } = (await import('pg')) as unknown as { Client: PgClientConstructor };
    const client = new Client({
        host: config.clusterEndpoint,
        port: 5432,
        user: 'admin',
        password: token,
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    return client;
}

/**
 * Validates a PostgreSQL schema name to prevent SQL injection.
 *
 * @param schemaName - The schema name to validate.
 * @throws Error if the name contains invalid characters.
 */
function validateSchemaName(schemaName: string): void {
    if (!SCHEMA_NAME_PATTERN.test(schemaName)) {
        throw new Error(
            `Invalid schema name "${schemaName}". Must match ${String(SCHEMA_NAME_PATTERN)} (lowercase alphanumeric + underscores, starting with a letter).`,
        );
    }

    if (schemaName.length > 63) {
        throw new Error(`Schema name "${schemaName}" exceeds PostgreSQL's 63-character identifier limit.`);
    }
}

/**
 * Creates a PostgreSQL schema if it does not already exist.
 *
 * @param schemaName - The schema name to create (e.g., "pr_42").
 */
async function createSchema(schemaName: string): Promise<void> {
    validateSchemaName(schemaName);

    const config = getDsqlConfig();
    const client = await createDsqlClient(config);

    try {
        console.log(`[db:schema] Creating schema "${schemaName}" if not exists...`);
        await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
        console.log(`[db:schema] Schema "${schemaName}" ready.`);
    } finally {
        await client.end();
    }
}

/**
 * Drops a PostgreSQL schema and all its objects.
 *
 * @param schemaName - The schema name to drop (e.g., "pr_42").
 */
async function dropSchema(schemaName: string): Promise<void> {
    validateSchemaName(schemaName);

    // Safety: never drop the public schema
    if (schemaName === 'public') {
        throw new Error('Refusing to drop the public schema.');
    }

    const config = getDsqlConfig();
    const client = await createDsqlClient(config);

    try {
        console.log(`[db:schema] Dropping schema "${schemaName}" cascade...`);
        await client.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
        console.log(`[db:schema] Schema "${schemaName}" dropped.`);
    } finally {
        await client.end();
    }
}

/**
 * Generates a fresh IAM authentication token for DSQL.
 * Outputs the raw token to stdout for use as an environment variable.
 *
 * @param region - AWS region of the DSQL cluster.
 * @param hostname - Aurora DSQL cluster endpoint hostname.
 */
async function generateToken(region: string, hostname: string): Promise<void> {
    const signer = new DsqlSigner({ hostname, region });
    const token = await signer.getDbConnectAdminAuthToken();

    // Output raw token to stdout for shell capture
    process.stdout.write(token);
}

/**
 * Generates a DATABASE_URL for connecting to DSQL with a specific search_path.
 * Outputs the URL to stdout for use in shell scripts.
 *
 * @param schemaName - The schema to set as search_path.
 */
async function generateDatabaseUrl(schemaName: string): Promise<void> {
    validateSchemaName(schemaName);

    const config = getDsqlConfig();
    const signer = new DsqlSigner({ hostname: config.clusterEndpoint, region: config.region });
    const token = await signer.getDbConnectAdminAuthToken();

    const encodedPassword = encodeURIComponent(token);
    const url = `postgresql://admin:${encodedPassword}@${config.clusterEndpoint}:5432/postgres?sslmode=require&options=-c search_path=${schemaName}`;

    // Output URL to stdout for shell capture
    process.stdout.write(url);
}

/**
 * Syncs table data from production `public` schema to a sandbox PR schema.
 *
 * Reads all rows from each table in the production cluster and writes them
 * to the target schema in the sandbox cluster. Uses batched transactions
 * (3000 rows max per Aurora DSQL limit) and ON CONFLICT DO NOTHING for
 * idempotent re-runs.
 *
 * @param targetSchema - Sandbox schema to write into (e.g. "pr_42").
 * @param tables - Table names to sync (e.g. ["users", "accounts"]).
 */
async function syncProductionData(targetSchema: string, tables: string[]): Promise<void> {
    validateSchemaName(targetSchema);

    if (tables.length === 0) {
        throw new Error('No tables specified for sync.');
    }

    const prodEndpoint = process.env['DSQL_PROD_ENDPOINT'];
    const region = process.env['DSQL_REGION'];

    if (!prodEndpoint || !region) {
        throw new Error('Sync requires DSQL_PROD_ENDPOINT and DSQL_REGION environment variables.');
    }

    const sandboxConfig = getDsqlConfig();
    const prodConfig: DsqlConfig = { clusterEndpoint: prodEndpoint, region };

    const sourceClient = await createDsqlClient(prodConfig);
    const targetClient = await createDsqlClient(sandboxConfig);

    try {
        for (const table of tables) {
            console.log(`[db:sync] Syncing "${table}" from production → "${targetSchema}"...`);
            const result = await syncTable(sourceClient, targetClient, targetSchema, table);

            if (result.rowsRead === 0) {
                console.log(`[db:sync] "${table}" is empty — skipping.`);
            } else {
                console.log(
                    `[db:sync] "${table}" — ${result.rowsRead} rows synced (${result.batchesWritten} batches).`,
                );
            }
        }

        console.log('[db:sync] Production data sync complete.');
    } finally {
        await sourceClient.end();
        await targetClient.end();
    }
}

// ============ CLI ============

const args = process.argv.slice(2);
const command = args[0];
const schemaName = args[1];

if (!command) {
    console.error('Usage: node dbSchema.js <create|drop|url|token|sync|verify-sync> ...');
    console.error('');
    console.error('Commands:');
    console.error('  create <SCHEMA_NAME>               Create a PR schema');
    console.error('  drop <SCHEMA_NAME>                 Drop a PR schema');
    console.error('  url <SCHEMA_NAME>                  Generate a DATABASE_URL with search_path');
    console.error('  token <REGION> <HOST>              Generate a fresh IAM auth token');
    console.error('  sync <SCHEMA_NAME> <T1> [T2] ...   Sync production tables into a PR schema');
    console.error('  verify-sync <SCHEMA> <T1> [T2]     Verify row counts match after sync');
    console.error('');
    console.error('Environment variables:');
    console.error('  DSQL_CLUSTER_ENDPOINT  Sandbox DSQL cluster endpoint (all commands except token)');
    console.error('  DSQL_REGION            AWS region (all commands except token)');
    console.error('  DSQL_PROD_ENDPOINT     Production DSQL cluster endpoint (sync/verify-sync)');
    process.exit(1);
}

switch (command) {
    case 'create':
        if (!schemaName) {
            console.error('Missing schema name.');
            process.exit(1);
        }

        await createSchema(schemaName);
        break;
    case 'drop':
        if (!schemaName) {
            console.error('Missing schema name.');
            process.exit(1);
        }

        await dropSchema(schemaName);
        break;
    case 'url':
        if (!schemaName) {
            console.error('Missing schema name.');
            process.exit(1);
        }

        await generateDatabaseUrl(schemaName);
        break;

    case 'token': {
        const region = args[1];
        const hostname = args[2];

        if (!region || !hostname) {
            console.error('Usage: token <REGION> <HOSTNAME>');
            process.exit(1);
        }

        await generateToken(region, hostname);
        break;
    }

    case 'sync': {
        const syncSchema = args[1];
        const syncTables = args.slice(2);

        if (!syncSchema || syncTables.length === 0) {
            console.error('Usage: sync <SCHEMA_NAME> <TABLE1> [TABLE2] ...');
            process.exit(1);
        }

        await syncProductionData(syncSchema, syncTables);
        break;
    }

    case 'verify-sync': {
        const verifySchema = args[1];
        const verifyTables = args.slice(2);

        if (!verifySchema || verifyTables.length === 0) {
            console.error('Usage: verify-sync <SCHEMA_NAME> <TABLE1> [TABLE2] ...');
            process.exit(1);
        }

        validateSchemaName(verifySchema);

        const prodEndpoint = process.env['DSQL_PROD_ENDPOINT'];
        const region = process.env['DSQL_REGION'];

        if (!prodEndpoint || !region) {
            console.error('verify-sync requires DSQL_PROD_ENDPOINT and DSQL_REGION environment variables.');
            process.exit(1);
        }

        const sandboxConfig = getDsqlConfig();
        const prodConfig: DsqlConfig = { clusterEndpoint: prodEndpoint, region };

        const sourceClient = await createDsqlClient(prodConfig);
        const targetClient = await createDsqlClient(sandboxConfig);

        try {
            const results = await verifySyncCounts(sourceClient, targetClient, verifySchema, verifyTables);
            let hasMismatch = false;

            for (const r of results) {
                const icon = r.match ? '✓' : '✗';
                const status = r.match ? 'match' : 'MISMATCH';
                console.log(`  ${icon} ${r.table}: ${r.targetCount}/${r.sourceCount} (${status})`);

                if (!r.match) {
                    hasMismatch = true;
                }
            }

            if (hasMismatch) {
                console.error('[db:verify-sync] Row count mismatch detected.');
                process.exit(1);
            }

            console.log('[db:verify-sync] All row counts match.');
        } finally {
            await sourceClient.end();
            await targetClient.end();
        }

        break;
    }

    default:
        console.error(`Unknown command: ${command}. Use "create", "drop", "url", "token", "sync", or "verify-sync".`);
        process.exit(1);
}
