import { DsqlSigner } from '@aws-sdk/dsql-signer';
import { defineConfig } from 'drizzle-kit';

const dsqlEndpoint = process.env['DSQL_CLUSTER_ENDPOINT'];
const dsqlRegion = process.env['DSQL_REGION'];

const dbCredentials =
    dsqlEndpoint && dsqlRegion
        ? {
              host: dsqlEndpoint,
              port: 5432,
              user: 'admin',
              password: await new DsqlSigner({ hostname: dsqlEndpoint, region: dsqlRegion }).getDbConnectAdminAuthToken(),
              database: 'postgres',
              ssl: { rejectUnauthorized: false },
          }
        : { url: process.env['DATABASE_URL']! };

export default defineConfig({
    dialect: 'postgresql',
    schema: ['../../shared/data/src/dao/UserDAO.ts', '../../shared/data/src/dao/AccountDAO.ts'],
    out: './drizzle',
    dbCredentials,
    schemaFilter: process.env['DB_SCHEMA'] ?? 'public',
});
