import { defineConfig } from 'drizzle-kit';

const dbCredentials = process.env['DSQL_TOKEN']
    ? {
          host: process.env['DSQL_CLUSTER_ENDPOINT']!,
          port: 5432,
          user: 'admin',
          password: process.env['DSQL_TOKEN'],
          database: 'postgres',
          ssl: { rejectUnauthorized: false },
      }
    : { url: process.env['DATABASE_URL']! };

export default defineConfig({
    dialect: 'postgresql',
    schema: ['../../shared/data/src/dao/CampaignDAO.ts', '../../shared/data/src/dao/CampaignParticipantDAO.ts'],
    out: './drizzle',
    dbCredentials,
    schemaFilter: process.env['DB_SCHEMA'] ?? 'public',
});
