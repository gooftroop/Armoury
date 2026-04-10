import { ContainerModule } from 'inversify';
import { TOKENS } from '@/tokens.js';
import type { AdapterFactoryFn, ClientFactoryFn, GitHubProxyConfig } from '@/types.js';
import type { QueryClient } from '@tanstack/react-query';

/**
 * Web platform dependency injection module.
 *
 * @requirements
 * - REQ-DI-030: Web module registers a PGlite adapter factory.
 * - REQ-DI-031: Web module registers GitHub and Wahapedia client factories.
 * - REQ-DI-032: Web module binds optional GitHub proxy configuration from env.
 */

/**
 * Web-specific bindings for browser/Next.js composition roots.
 */
export const webModule = new ContainerModule((options) => {
    options.bind<AdapterFactoryFn>(TOKENS.AdapterFactory).toFactory(() => {
        return async () => {
            const { PGliteAdapter } = await import('@armoury/adapters-pglite');

            return new PGliteAdapter({ dataDir: 'idb://armoury' });
        };
    });

    options.bind<ClientFactoryFn<unknown, QueryClient>>(TOKENS.GitHubClientFactory).toFactory((context) => {
        return async (queryClient: QueryClient) => {
            const { createGitHubClient } = await import('@armoury/adapters-github');
            const proxyConfig = context.get<GitHubProxyConfig>(TOKENS.GitHubProxyConfig, { optional: true });

            return createGitHubClient(queryClient, proxyConfig);
        };
    });

    options.bind<ClientFactoryFn<unknown, QueryClient>>(TOKENS.WahapediaClientFactory).toFactory(() => {
        return async (queryClient: QueryClient) => {
            const { createWahapediaClient } = await import('@armoury/adapters-wahapedia');

            return createWahapediaClient(queryClient);
        };
    });

    const proxyBaseUrl = process.env['NEXT_PUBLIC_GITHUB_PROXY_URL'];

    if (proxyBaseUrl) {
        options.bind<GitHubProxyConfig>(TOKENS.GitHubProxyConfig).toConstantValue({
            apiBaseUrl: `${proxyBaseUrl}/api`,
            rawBaseUrl: `${proxyBaseUrl}/raw`,
        });
    }
});
