import { ContainerModule } from 'inversify';
import { TOKENS } from '@/tokens.js';
import type { AdapterFactoryFn, ClientFactoryFn } from '@/types.js';
import type { QueryClient } from '@tanstack/react-query';

/**
 * Mobile platform dependency injection module.
 *
 * @requirements
 * - REQ-DI-040: Mobile module registers a SQLite adapter factory.
 * - REQ-DI-041: Mobile module registers direct GitHub and Wahapedia client factories.
 */

/**
 * Mobile-specific bindings for Expo/React Native composition roots.
 */
export const mobileModule = new ContainerModule((options) => {
    options.bind<AdapterFactoryFn>(TOKENS.AdapterFactory).toFactory(() => {
        return async () => {
            const { SQLiteAdapter } = await import('@armoury/adapters-sqlite');
            const { openDatabaseAsync } = await import('expo-sqlite');
            const database = await openDatabaseAsync('armoury');

            return new SQLiteAdapter(database);
        };
    });

    options.bind<ClientFactoryFn<unknown, QueryClient>>(TOKENS.GitHubClientFactory).toFactory(() => {
        return async (queryClient: QueryClient) => {
            const { createGitHubClient } = await import('@armoury/adapters-github');

            return createGitHubClient(queryClient);
        };
    });

    options.bind<ClientFactoryFn<unknown, QueryClient>>(TOKENS.WahapediaClientFactory).toFactory(() => {
        return async (queryClient: QueryClient) => {
            const { createWahapediaClient } = await import('@armoury/adapters-wahapedia');

            return createWahapediaClient(queryClient);
        };
    });
});
