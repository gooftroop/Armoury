import { afterEach, describe, expect, it, vi } from 'vitest';
import { createContainerWithModules } from '@/container.js';
import { createTestModule } from '@/modules/test.module.js';
import { TOKENS } from '@/tokens.js';
import type { AdapterFactoryFn, ClientFactoryFn } from '@/types.js';
import type { QueryClient } from '@tanstack/react-query';
import type { DatabaseAdapter } from '@armoury/data-dao';
import type { IGitHubClient } from '@armoury/clients-github';
import type { IWahapediaClient } from '@armoury/clients-wahapedia';

const createGitHubClientMock = vi.fn();
const createWahapediaClientMock = vi.fn();

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
        createGitHubClient: createGitHubClientMock,
    };
});

vi.mock('@armoury/adapters-wahapedia', () => {
    return {
        createWahapediaClient: createWahapediaClientMock,
    };
});

describe('createTestModule', () => {
    afterEach(() => {
        createGitHubClientMock.mockReset();
        createWahapediaClientMock.mockReset();
    });

    it('provides default in-memory adapter factory', async () => {
        const container = createContainerWithModules(createTestModule());
        const factory = container.get<AdapterFactoryFn>(TOKENS.AdapterFactory);
        const adapter = (await factory()) as unknown as { config: { dataDir: string } };

        expect(adapter.config.dataDir).toBe('memory://');
    });

    it('uses custom adapter factory override when provided', async () => {
        const expectedAdapter = { key: 'custom-adapter' } as unknown as DatabaseAdapter;
        const overrideFactory = vi.fn<AdapterFactoryFn>(async () => expectedAdapter);
        const container = createContainerWithModules(
            createTestModule({
                adapterFactory: overrideFactory,
            }),
        );
        const factory = container.get<AdapterFactoryFn>(TOKENS.AdapterFactory);
        const adapter = await factory();

        expect(adapter).toBe(expectedAdapter);
        expect(overrideFactory).toHaveBeenCalledTimes(1);
    });

    it('supports multiple overrides simultaneously', async () => {
        const customGitHubFactory = vi.fn<ClientFactoryFn<IGitHubClient, QueryClient>>(
            async (_queryClient: QueryClient) => {
                return { id: 'github-override' } as unknown as IGitHubClient;
            },
        );
        const customWahapediaFactory = vi.fn<ClientFactoryFn<IWahapediaClient, QueryClient>>(
            async (_queryClient: QueryClient) => {
                return { id: 'wahapedia-override' } as unknown as IWahapediaClient;
            },
        );
        const proxyConfig = {
            apiBaseUrl: 'https://proxy.example/api',
            rawBaseUrl: 'https://proxy.example/raw',
        };

        const container = createContainerWithModules(
            createTestModule({
                gitHubClientFactory: customGitHubFactory,
                wahapediaClientFactory: customWahapediaFactory,
                gitHubProxyConfig: proxyConfig,
            }),
        );

        const githubFactory = container.get<ClientFactoryFn<IGitHubClient, QueryClient>>(TOKENS.GitHubClientFactory);
        const wahapediaFactory = container.get<ClientFactoryFn<IWahapediaClient, QueryClient>>(
            TOKENS.WahapediaClientFactory,
        );

        expect(await githubFactory({ q: 'query-client' } as unknown as QueryClient)).toEqual({ id: 'github-override' });
        expect(await wahapediaFactory({ q: 'query-client' } as unknown as QueryClient)).toEqual({
            id: 'wahapedia-override',
        });
        expect(container.get(TOKENS.GitHubProxyConfig)).toEqual(proxyConfig);
    });
});
