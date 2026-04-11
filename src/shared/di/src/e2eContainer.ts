/**
 * E2E test container factory for composing DI containers in service e2e tests.
 *
 * Combines the core module with a test module, optionally accepting adapter
 * factory overrides so that services using Docker PostgreSQL (friends, users,
 * matches) can inject their own LocalDatabaseAdapter while campaigns uses the
 * default in-memory PGliteAdapter.
 *
 * @module @armoury/di
 *
 * @requirements
 * - REQ-E2E-DI-001: E2E tests compose adapters via DI containers, not direct instantiation.
 * - REQ-E2E-DI-002: Container helper supports adapter factory overrides for Docker Postgres services.
 */

import type { Container } from 'inversify';
import { createContainerWithModules } from '@/container.js';
import { coreModule } from '@/modules/core.module.js';
import { createTestModule } from '@/modules/test.module.js';
import type { TestModuleOverrides } from '@/types.js';

export interface E2EContainerOptions {
    overrides?: TestModuleOverrides;
}

/** Creates a DI container configured for E2E testing with core + test modules. */
export function createE2EContainer(options?: E2EContainerOptions): Container {
    return createContainerWithModules(coreModule, createTestModule(options?.overrides));
}
