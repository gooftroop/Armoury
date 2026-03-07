import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    dialect: 'postgresql',
    schema: [
        '../../shared/data/src/dao/CampaignDAO.ts',
        '../../shared/data/src/dao/CampaignParticipantDAO.ts',
    ],
    out: './drizzle',
});
