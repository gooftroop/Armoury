import { ContainerModule } from 'inversify';
import { TOKENS } from '@/tokens.js';
import type { AdapterFactoryFn, ClientFactoryFn, TestModuleOverrides } from '@/types.js';
import type { QueryClient } from '@tanstack/react-query';

/**
 * Test platform dependency injection module.
 *
 * @requirements
 * - REQ-DI-060: Test module provides default in-memory adapter bindings.
 * - REQ-DI-061: Test module supports partial override bindings.
 */

/**
 * Creates a test module with optional partial binding overrides.
 *
 * @param overrides - Optional custom factories/config for test scenarios.
 * @returns A container module with test-safe defaults.
 */
export function createTestModule(overrides?: TestModuleOverrides): ContainerModule {
    return new ContainerModule((options) => {
        options.bind<AdapterFactoryFn>(TOKENS.AdapterFactory).toFactory(() => {
            return (
                overrides?.adapterFactory ??
                (async () => {
                    const { PGliteAdapter } = await import('@armoury/adapters-pglite');

                    return new PGliteAdapter({ dataDir: 'memory://' });
                })
            );
        });

        options.bind<ClientFactoryFn<unknown, QueryClient>>(TOKENS.GitHubClientFactory).toFactory(() => {
            return (
                overrides?.gitHubClientFactory ??
                (async (queryClient: QueryClient) => {
                    const { createGitHubClient } = await import('@armoury/adapters-github');

                    return createGitHubClient(queryClient);
                })
            );
        });

        options.bind<ClientFactoryFn<unknown, QueryClient>>(TOKENS.WahapediaClientFactory).toFactory(() => {
            return (
                overrides?.wahapediaClientFactory ??
                (async (queryClient: QueryClient) => {
                    const { createWahapediaClient } = await import('@armoury/adapters-wahapedia');

                    return createWahapediaClient(queryClient);
                })
            );
        });

        if (overrides?.gitHubProxyConfig) {
            options.bind(TOKENS.GitHubProxyConfig).toConstantValue(overrides.gitHubProxyConfig);
        }
    });
}
