/**
 * Shared database schema management utilities for PR sandbox isolation.
 *
 * Creates and drops PostgreSQL schemas for per-PR database isolation.
 * Used by CI workflows to ensure each PR sandbox operates in its own
 * schema namespace, preventing data collisions between concurrent PRs.
 *
 * DSQL configuration is resolved from environment variables:
 * - `DSQL_CLUSTER_ENDPOINT`: Aurora DSQL cluster endpoint hostname
 * - `DSQL_REGION`: AWS region of the DSQL cluster
 *
 * @requirements
 * - REQ-SANDBOX-ISOLATION: Each PR sandbox must operate in an isolated database schema
 * - REQ-SCHEMA-NAMING: PR schemas follow the naming convention `pr_<number>`
 * - REQ-CLEANUP: PR schemas are dropped when the PR is closed
 * - REQ-IDEMPOTENT: Schema creation and deletion must be idempotent
 * - REQ-ENV-CONFIG: DSQL config provided exclusively via environment variables
 */

import { DsqlSigner } from '@aws-sdk/dsql-signer';

/** Schema name validation pattern: only alphanumeric and underscores. */
const SCHEMA_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;

interface DsqlConfig {
    /** Aurora DSQL cluster endpoint hostname. */
    clusterEndpoint: string;

    /** AWS region of the DSQL cluster. */
    region: string;
}

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

// ============ CLI ============

const args = process.argv.slice(2);
const command = args[0];
const schemaName = args[1];

if (!command) {
    console.error('Usage: node dbSchema.js <create|drop|url|token> <SCHEMA_NAME|REGION HOSTNAME>');
    console.error('');
    console.error('Commands:');
    console.error('  create <SCHEMA_NAME>    Create a PR schema');
    console.error('  drop <SCHEMA_NAME>      Drop a PR schema');
    console.error('  url <SCHEMA_NAME>       Generate a DATABASE_URL with search_path');
    console.error('  token <REGION> <HOST>   Generate a fresh IAM auth token');
    console.error('');
    console.error('DSQL config is read from DSQL_CLUSTER_ENDPOINT and DSQL_REGION env vars (except token).');
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

    default:
        console.error(`Unknown command: ${command}. Use "create", "drop", "url", or "token".`);
        process.exit(1);
}
