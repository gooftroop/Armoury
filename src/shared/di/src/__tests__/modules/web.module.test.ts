import { afterEach, describe, expect, it, vi } from 'vitest';
import { createContainerWithModules } from '@/container.js';
import { webModule } from '@/modules/web.module.js';
import { TOKENS } from '@/tokens.js';
import type { AdapterFactoryFn, ClientFactoryFn } from '@/types.js';
import type { QueryClient } from '@tanstack/react-query';

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

describe('webModule', () => {
    afterEach(() => {
        createGitHubClientMock.mockReset();
        createWahapediaClientMock.mockReset();
        delete process.env['NEXT_PUBLIC_GITHUB_PROXY_URL'];
    });

    it('loads into a container and binds factories', () => {
        const container = createContainerWithModules(webModule);

        expect(container.isBound(TOKENS.AdapterFactory)).toBe(true);
        expect(container.isBound(TOKENS.GitHubClientFactory)).toBe(true);
        expect(container.isBound(TOKENS.WahapediaClientFactory)).toBe(true);
    });

    it('provides adapter factory that creates a PGlite adapter', async () => {
        const container = createContainerWithModules(webModule);
        const adapterFactory = container.get<AdapterFactoryFn>(TOKENS.AdapterFactory);

        const adapter = (await adapterFactory()) as unknown as { config: { dataDir: string } };
        expect(typeof adapterFactory).toBe('function');
        expect(adapter.config.dataDir).toBe('idb://armoury');
    });

    it('provides GitHub client factory without proxy by default', async () => {
        const queryClient = { key: 'query' } as unknown as QueryClient;
        const expectedClient = { key: 'github-client' };
        createGitHubClientMock.mockReturnValue(expectedClient);

        const container = createContainerWithModules(webModule);
        const factory = container.get<ClientFactoryFn<unknown, QueryClient>>(TOKENS.GitHubClientFactory);
        const client = await factory(queryClient);

        expect(typeof factory).toBe('function');
        expect(client).toBe(expectedClient);
        expect(createGitHubClientMock).toHaveBeenCalledTimes(1);
        expect(createGitHubClientMock).toHaveBeenCalledWith(queryClient, undefined);
    });

    it('passes proxy configuration when NEXT_PUBLIC_GITHUB_PROXY_URL is set', async () => {
        process.env['NEXT_PUBLIC_GITHUB_PROXY_URL'] = 'https://proxy.example';
        const queryClient = { id: 'query-client' } as unknown as QueryClient;

        const container = createContainerWithModules(webModule);
        const factory = container.get<ClientFactoryFn<unknown, QueryClient>>(TOKENS.GitHubClientFactory);
        await factory(queryClient);

        expect(createGitHubClientMock).toHaveBeenCalledWith(queryClient, {
            apiBaseUrl: 'https://proxy.example/api',
            rawBaseUrl: 'https://proxy.example/raw',
        });
    });

    it('provides Wahapedia client factory', async () => {
        const queryClient = { id: 'query-client' } as unknown as QueryClient;
        const expectedClient = { id: 'wahapedia-client' };
        createWahapediaClientMock.mockReturnValue(expectedClient);

        const container = createContainerWithModules(webModule);
        const factory = container.get<ClientFactoryFn<unknown, QueryClient>>(TOKENS.WahapediaClientFactory);
        const client = await factory(queryClient);

        expect(typeof factory).toBe('function');
        expect(client).toBe(expectedClient);
        expect(createWahapediaClientMock).toHaveBeenCalledTimes(1);
        expect(createWahapediaClientMock).toHaveBeenCalledWith(queryClient);
    });
});
