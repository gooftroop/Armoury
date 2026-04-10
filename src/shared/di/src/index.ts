/**
 * Dependency injection utilities and platform modules for Armoury composition roots.
 *
 * @module @armoury/di
 *
 * @requirements
 * - REQ-DI-120: Barrel exports expose all public DI APIs via named exports.
 */

export { TOKENS } from '@/tokens.js';
export type {
    AdapterFactoryFn,
    ClientFactoryFn,
    ContainerOptions,
    GitHubProxyConfig,
    LambdaModuleConfig,
    TestModuleOverrides,
} from '@/types.js';
export { createContainer, createContainerWithModules } from '@/container.js';
export { coreModule } from '@/modules/core.module.js';
export { webModule } from '@/modules/web.module.js';
export { mobileModule } from '@/modules/mobile.module.js';
export { createLambdaModule } from '@/modules/lambda.module.js';
export { createTestModule } from '@/modules/test.module.js';
