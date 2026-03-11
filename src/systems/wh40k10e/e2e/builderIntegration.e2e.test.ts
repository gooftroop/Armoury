import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DataContext } from '@armoury/data-context/DataContext';
import type { GameData } from '../src/dao/GameData.ts';
import { wh40k10eSystem } from '../src/system.ts';
import { GitHubClient } from '@armoury/clients-github/client';
import { MockDatabaseAdapter } from '../src/__mocks__/MockDatabaseAdapter.ts';
import { hasEntityCodec } from '@armoury/data-dao/codec';
import 'dotenv/config';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const HAS_TOKEN = Boolean(process.env.GITHUB_TOKEN);

function createGitHubClient(): GitHubClient {
    return new GitHubClient({ token: GITHUB_TOKEN });
}

async function createInitializedAdapter(): Promise<MockDatabaseAdapter> {
    const adapter = new MockDatabaseAdapter();
    await adapter.initialize();

    return adapter;
}

/**
 * Builder integration tests — single shared DataContext for read-only tests.
 *
 * Tests that verify builder behaviour (adapter init, double-build) build WITHOUT
 * `.github()` to avoid GitHub API calls. Only tests that access game data share
 * one GitHub-backed DataContext via `beforeAll`.
 */
describe.skipIf(!HAS_TOKEN)('DataContextBuilder integration', { timeout: 120_000 }, () => {
    let sharedAdapter: MockDatabaseAdapter;
    let sharedDc: DataContext<GameData>;

    beforeAll(async () => {
        const githubClient = createGitHubClient();
        sharedAdapter = await createInitializedAdapter();
        sharedDc = await DataContext.builder<GameData>()
            .system(wh40k10eSystem)
            .adapter(sharedAdapter)
            .github(githubClient)
            .build();
    });

    afterAll(async () => {
        await sharedDc?.close();
    });

    it('builds a DataContext using system, adapter, and GitHub client', () => {
        expect(sharedDc).toBeDefined();
        expect(sharedDc.game).toBeDefined();
    });

    it('registers entity codecs during build', () => {
        expect(hasEntityCodec('coreRules')).toBe(true);
        expect(hasEntityCodec('factionData')).toBe(true);
        expect(hasEntityCodec('chapterApproved')).toBe(true);
    });

    it('initializes the adapter during build', async () => {
        const adapter = await createInitializedAdapter();
        await adapter.close();
        expect(adapter.initialized).toBe(false);

        /** Build WITHOUT .github() — only tests adapter initialization. */
        const dc = await DataContext.builder<GameData>().system(wh40k10eSystem).adapter(adapter).build();

        expect(adapter.initialized).toBe(true);

        await dc.close();
    });

    it('exposes core DAOs after build', () => {
        expect(sharedDc.accounts).toBeDefined();
        expect(sharedDc.social).toBeDefined();
    });

    it('resolves core rules via the game data context', async () => {
        const coreRules = await sharedDc.game.coreRules;

        expect(coreRules).toHaveProperty('id');
        expect(coreRules).toHaveProperty('profileTypes');
    });
    it('supports building twice with the same adapter', async () => {
        const adapter = await createInitializedAdapter();

        /** Build WITHOUT .github() — only tests builder double-build. */
        const builder = DataContext.builder<GameData>().system(wh40k10eSystem).adapter(adapter);

        const first = await builder.build();
        await first.close();

        const second = await builder.build();
        expect(second).toBeDefined();

        await second.close();
    });
});
