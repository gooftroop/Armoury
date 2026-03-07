import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    dialect: 'postgresql',
    schema: ['../shared/data/src/dao/*.ts', '../systems/wh40k10e/src/dao/*.ts'],
    out: './drizzle',
});
