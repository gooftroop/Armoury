import type { DatabaseAdapter, GameSystem } from '@armoury/data-dao';
import type { IGitHubClient } from '@armoury/clients-github';
import type { IWahapediaClient } from '@armoury/clients-wahapedia';
import type { QueryClient } from '@tanstack/react-query';

/**
 * Shared dependency injection types for @armoury/di.
 *
 * @requirements
 * - REQ-DI-100: Container and module configuration is strongly typed.
 * - REQ-DI-101: Factory signatures are explicit and platform-agnostic.
 * - REQ-DI-102: Test module overrides support partial replacement.
 */

/**
 * Optional container-level options for composition roots.
 */
export interface ContainerOptions {
    /** Optional game system to bind at container creation time. */
    gameSystem?: GameSystem;
}

/**
 * GitHub proxy routing configuration used by web clients.
 */
export interface GitHubProxyConfig {
    /** Base URL for API endpoint proxying. */
    apiBaseUrl: string;
    /** Base URL for raw content proxying. */
    rawBaseUrl: string;
}

/**
 * Lambda DSQL configuration values used to build DSQL adapters.
 */
export interface LambdaModuleConfig {
    /** Aurora DSQL cluster endpoint hostname. */
    clusterEndpoint: string;
    /** AWS region for the DSQL cluster. */
    region: string;
}

/**
 * Async factory for creating a platform-specific DatabaseAdapter.
 */
export type AdapterFactoryFn = () => Promise<DatabaseAdapter>;

/**
 * Async factory for creating service clients from a shared query client instance.
 *
 * @template TClient - Resolved client type.
 * @template TQueryClient - Query client input type.
 */
export type ClientFactoryFn<TClient, TQueryClient = QueryClient> = (queryClient: TQueryClient) => Promise<TClient>;

/**
 * Partial test-module overrides to replace default factory bindings.
 */
export interface TestModuleOverrides {
    /** Optional replacement adapter factory. */
    adapterFactory?: AdapterFactoryFn;
    /** Optional replacement GitHub client factory. */
    gitHubClientFactory?: ClientFactoryFn<IGitHubClient>;
    /** Optional replacement Wahapedia client factory. */
    wahapediaClientFactory?: ClientFactoryFn<IWahapediaClient>;
    /** Optional replacement GitHub proxy config. */
    gitHubProxyConfig?: GitHubProxyConfig;
}
