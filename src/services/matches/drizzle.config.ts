import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    dialect: 'postgresql',
    schema: ['../../shared/data/src/dao/MatchDAO.ts'],
    out: './drizzle',
    dbCredentials: {
        url: process.env['DATABASE_URL']!,
    },
    schemaFilter: process.env['DB_SCHEMA'] ?? 'public',
});
