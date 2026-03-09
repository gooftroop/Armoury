/**
 * Shared Drizzle Kit database credentials factory for Aurora DSQL.
 *
 * Generates fresh IAM auth tokens at config-load time so drizzle-kit
 * always connects with a valid, non-expired token. When
 * `DSQL_CLUSTER_ENDPOINT` is set (CI), authenticates via IAM with
 * `ssl: { rejectUnauthorized: false }` to match Aurora DSQL TLS
 * requirements. Falls back to `DATABASE_URL` for non-DSQL environments.
 *
 * @requirements
 * - REQ-DSQL-AUTH: Fresh IAM token generated at connection time, never pre-computed
 * - REQ-SSL-COMPAT: Uses rejectUnauthorized:false to avoid node-postgres verify-full mismatch
 * - REQ-FALLBACK: Supports DATABASE_URL for non-DSQL environments (local dev, CI without DSQL)
 */

import { DsqlSigner } from '@aws-sdk/dsql-signer';

/**
 * Host-based credentials for drizzle-kit's postgresql dialect.
 *
 * Matches the `{ host, port, user, password, database, ssl? }` branch
 * of drizzle-kit's `dbCredentials` union type.
 */
interface HostCredentials {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    ssl: { rejectUnauthorized: boolean };
}

/** URL-based credentials for drizzle-kit. */
interface UrlCredentials {
    url: string;
}

/**
 * Resolves database credentials for drizzle-kit.
 *
 * When `DSQL_CLUSTER_ENDPOINT` and `DSQL_REGION` environment variables
 * are set, generates a fresh IAM auth token and returns host-based
 * credentials with SSL configured for Aurora DSQL.
 *
 * Otherwise falls back to `DATABASE_URL` environment variable.
 *
 * @returns Drizzle-kit compatible `dbCredentials` object.
 * @throws Error if neither DSQL config nor DATABASE_URL is available.
 */
export async function getDrizzleCredentials(): Promise<HostCredentials | UrlCredentials> {
    const dsqlEndpoint = process.env['DSQL_CLUSTER_ENDPOINT'];
    const dsqlRegion = process.env['DSQL_REGION'];

    if (dsqlEndpoint && dsqlRegion) {
        const signer = new DsqlSigner({ hostname: dsqlEndpoint, region: dsqlRegion });
        const token = await signer.getDbConnectAdminAuthToken();

        return {
            host: dsqlEndpoint,
            port: 5432,
            user: 'admin',
            password: token,
            database: 'postgres',
            ssl: { rejectUnauthorized: false },
        };
    }

    const databaseUrl = process.env['DATABASE_URL'];

    if (databaseUrl) {
        return { url: databaseUrl };
    }

    throw new Error(
        'No database credentials available. Set DSQL_CLUSTER_ENDPOINT + DSQL_REGION, or DATABASE_URL.',
    );
}
