import { defineConfig } from 'drizzle-kit';

import { getDrizzleCredentials } from '../__testing__/drizzleCredentials.ts';

const dbCredentials = await getDrizzleCredentials();

export default defineConfig({
    dialect: 'postgresql',
    schema: ['../../shared/data/src/dao/CampaignDAO.ts', '../../shared/data/src/dao/CampaignParticipantDAO.ts'],
    out: './drizzle',
    dbCredentials,
    schemaFilter: process.env['DB_SCHEMA'] ?? 'public',
});
