import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    dialect: 'postgresql',
    schema: [
        '../../shared/data/src/dao/UserDAO.ts',
        '../../shared/data/src/dao/AccountDAO.ts',
    ],
    out: './drizzle',
});
