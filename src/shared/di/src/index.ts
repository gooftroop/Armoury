/**
 * Dependency injection utilities and platform modules for Armoury composition roots.
 *
 * Core entry point — platform-agnostic APIs only. Platform-specific modules live
 * in subpath exports to avoid pulling native dependencies into unrelated bundles:
 *
 *   - `@armoury/di/web`    → webModule (PGlite, browser adapters)
 *   - `@armoury/di/mobile` → mobileModule (expo-sqlite, React Native adapters)
 *   - `@armoury/di/lambda` → createLambdaModule (DSQL, server adapters)
 *
 * @module @armoury/di
 *
 * @requirements
 * - REQ-DI-120: Barrel exports expose all public DI APIs via named exports.
 * - REQ-DI-121: Platform modules are isolated in subpath exports to prevent
 *   cross-platform bundling issues (e.g. expo-sqlite leaking into Next.js webpack).
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
export { createTestModule } from '@/modules/test.module.js';
export { createE2EContainer } from '@/e2eContainer.js';
export type { E2EContainerOptions } from '@/e2eContainer.js';
