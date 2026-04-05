import { defineConfig } from 'drizzle-kit';

const schema = process.env['DB_SCHEMA'] ?? 'public';

const dbCredentials = process.env['DSQL_TOKEN']
    ? {
          url: `postgresql://admin:${encodeURIComponent(process.env['DSQL_TOKEN'])}@${process.env['DSQL_CLUSTER_ENDPOINT']}:5432/postgres?sslmode=require&options=${encodeURIComponent(`-c search_path=${schema}`)}`,
      }
    : { url: process.env['DATABASE_URL']! };

export default defineConfig({
    dialect: 'postgresql',
    schema: ['./schema.ts'],
    out: './drizzle',
    dbCredentials,
    schemaFilter: schema,
    migrations: {
        schema: 'drizzle_friends',
    },
});
