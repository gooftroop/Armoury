import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    dialect: 'postgresql',
    schema: ['../../shared/data/src/dao/FriendDAO.ts', '../../shared/data/src/dao/UserPresenceDAO.ts'],
    out: './drizzle',
    dbCredentials: {
        url: process.env['DATABASE_URL']!,
    },
    schemaFilter: process.env['DB_SCHEMA'] ?? 'public',
});
