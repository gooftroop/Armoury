import { describe, expect, it, vi } from 'vitest';
import { createE2EContainer } from '@/e2eContainer.js';
import { TOKENS } from '@/tokens.js';
import type { AdapterFactoryFn } from '@/types.js';
import type { DatabaseAdapter } from '@armoury/data-dao';

/**
 * Test plan for createE2EContainer:
 *
 * - REQ-E2E-DI-001 → "creates container with default in-memory adapter factory"
 * - REQ-E2E-DI-001 → "resolves adapter factory from container"
 * - REQ-E2E-DI-002 → "uses custom adapter factory override when provided"
 * - REQ-E2E-DI-001 → "resolves GitHub and Wahapedia client factories"
 */

vi.mock('@armoury/adapters-pglite', () => {
    return {
        PGliteAdapter: class {
            readonly config: { dataDir: string };

            constructor(config: { dataDir: string }) {
                this.config = config;
            }
        },
    };
});

vi.mock('@armoury/adapters-github', () => {
    return {
        createGitHubClient: vi.fn(),
    };
});

vi.mock('@armoury/adapters-wahapedia', () => {
    return {
        createWahapediaClient: vi.fn(),
    };
});

describe('createE2EContainer', () => {
    it('creates container with default in-memory adapter factory', () => {
        const container = createE2EContainer();

        expect(container).toBeDefined();

        const factory = container.get<AdapterFactoryFn>(TOKENS.AdapterFactory);

        expect(factory).toBeTypeOf('function');
    });

    it('resolves adapter factory that produces PGlite adapter by default', async () => {
        const container = createE2EContainer();
        const factory = container.get<AdapterFactoryFn>(TOKENS.AdapterFactory);
        const adapter = (await factory()) as unknown as { config: { dataDir: string } };

        expect(adapter.config.dataDir).toBe('memory://');
    });

    it('uses custom adapter factory override when provided', async () => {
        const expectedAdapter = { key: 'custom-docker-adapter' } as unknown as DatabaseAdapter;
        const overrideFactory = vi.fn<AdapterFactoryFn>(async () => expectedAdapter);
        const container = createE2EContainer({
            overrides: { adapterFactory: overrideFactory },
        });
        const factory = container.get<AdapterFactoryFn>(TOKENS.AdapterFactory);
        const adapter = await factory();

        expect(adapter).toBe(expectedAdapter);
        expect(overrideFactory).toHaveBeenCalledTimes(1);
    });

    it('resolves GitHub and Wahapedia client factory tokens', () => {
        const container = createE2EContainer();
        const githubFactory = container.get(TOKENS.GitHubClientFactory);
        const wahapediaFactory = container.get(TOKENS.WahapediaClientFactory);

        expect(githubFactory).toBeTypeOf('function');
        expect(wahapediaFactory).toBeTypeOf('function');
    });
});
