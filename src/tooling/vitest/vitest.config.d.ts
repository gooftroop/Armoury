import type { UserConfig } from 'vitest/config';

/**
 * Type declaration for the base Vitest configuration.
 *
 * Provides type safety for consumers who extend the baseConfig using mergeConfig().
 * The test property is typed as UserConfig['test'] to ensure compatibility with
 * Vitest's configuration schema and enable IDE autocomplete for test options.
 */
export declare const baseConfig: {
    test: UserConfig['test'];
    resolve: {
        alias: {
            '@': string;
        };
    };
};
export default baseConfig;
