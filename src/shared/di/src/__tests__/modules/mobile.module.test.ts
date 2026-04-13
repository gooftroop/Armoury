import { afterEach, describe, expect, it, vi } from 'vitest';
import { createContainerWithModules } from '@/container.js';
import { mobileModule } from '@/modules/mobile.module.js';
import { TOKENS } from '@/tokens.js';
import type { AdapterFactoryFn, ClientFactoryFn } from '@/types.js';
import type { QueryClient } from '@tanstack/react-query';

const openDatabaseAsyncMock = vi.fn();
const createGitHubClientMock = vi.fn();
const createWahapediaClientMock = vi.fn();

vi.mock('@armoury/adapters-sqlite', () => {
    return {
        SQLiteAdapter: class {
            readonly database: unknown;

            constructor(database: unknown) {
                this.database = database;
            }
        },
    };
});

vi.mock('expo-sqlite', () => {
    return {
        openDatabaseAsync: openDatabaseAsyncMock,
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

describe('mobileModule', () => {
    afterEach(() => {
        openDatabaseAsyncMock.mockReset();
        createGitHubClientMock.mockReset();
        createWahapediaClientMock.mockReset();
    });

    it('loads into a container and binds factories', () => {
        const container = createContainerWithModules(mobileModule);

        expect(container.isBound(TOKENS.AdapterFactory)).toBe(true);
        expect(container.isBound(TOKENS.GitHubClientFactory)).toBe(true);
        expect(container.isBound(TOKENS.WahapediaClientFactory)).toBe(true);
    });

    it('provides adapter factory that initializes SQLite adapter', async () => {
        const database = { db: 'sqlite' };
        openDatabaseAsyncMock.mockResolvedValue(database);
        const container = createContainerWithModules(mobileModule);
        const adapterFactory = container.get<AdapterFactoryFn>(TOKENS.AdapterFactory);

        const adapter = (await adapterFactory()) as unknown as { database: unknown };

        expect(openDatabaseAsyncMock).toHaveBeenCalledTimes(1);
        expect(openDatabaseAsyncMock).toHaveBeenCalledWith('armoury');
        expect(adapter.database).toBe(database);
    });

    it('provides GitHub client factory', async () => {
        const queryClient = { id: 'mobile-query-client' } as unknown as QueryClient;
        const expectedClient = { id: 'github-client' };
        createGitHubClientMock.mockReturnValue(expectedClient);
        const container = createContainerWithModules(mobileModule);
        const factory = container.get<ClientFactoryFn<unknown, QueryClient>>(TOKENS.GitHubClientFactory);
        const client = await factory(queryClient);

        expect(client).toBe(expectedClient);
        expect(createGitHubClientMock).toHaveBeenCalledWith(queryClient);
    });

    it('provides Wahapedia client factory', async () => {
        const queryClient = { id: 'mobile-query-client' } as unknown as QueryClient;
        const expectedClient = { id: 'wahapedia-client' };
        createWahapediaClientMock.mockReturnValue(expectedClient);
        const container = createContainerWithModules(mobileModule);
        const factory = container.get<ClientFactoryFn<unknown, QueryClient>>(TOKENS.WahapediaClientFactory);
        const client = await factory(queryClient);

        expect(client).toBe(expectedClient);
        expect(createWahapediaClientMock).toHaveBeenCalledWith(queryClient);
    });
});
