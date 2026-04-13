import { ContainerModule } from 'inversify';
import { TOKENS } from '@/tokens.js';
import type { LambdaModuleConfig } from '@/types.js';
import type { DatabaseAdapter } from '@armoury/data-dao';
import { DSQLAdapter } from '@armoury/adapters-dsql';

/**
 * Lambda platform dependency injection module.
 *
 * @requirements
 * - REQ-DI-050: Lambda module registers DSQL adapter as singleton.
 * - REQ-DI-051: Lambda module receives explicit runtime config values.
 */

/**
 * Creates Lambda-specific bindings for server handlers.
 *
 * @param config - DSQL runtime configuration.
 * @returns A container module with Lambda adapter bindings.
 */
export function createLambdaModule(config: LambdaModuleConfig): ContainerModule {
    return new ContainerModule((options) => {
        options.bind<LambdaModuleConfig>(TOKENS.DSQLConfig).toConstantValue(config);

        options
            .bind<DatabaseAdapter>(TOKENS.DatabaseAdapter)
            .toDynamicValue(() => {
                return new DSQLAdapter({
                    clusterEndpoint: config.clusterEndpoint,
                    region: config.region,
                });
            })
            .inSingletonScope();
    });
}
