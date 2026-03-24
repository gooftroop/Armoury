/**
 * @armoury/e2e — Shared end-to-end test infrastructure.
 *
 * Provides Docker lifecycle management, LocalStack configuration,
 * API Gateway event factories, and mock utilities used by all
 * service e2e test suites.
 *
 * @module @armoury/e2e
 */

/**
 * @requirements
 * - REQ-E2E-SHARED: Centralize e2e test infrastructure shared across all services
 * - REQ-E2E-ISOLATION: Each service imports only what it needs via subpath exports
 */

export { e2eEnv } from './e2eEnv.ts';
export { localstackClientConfig } from './localstackConfig.ts';
export { createTestUserContext, createApiGatewayEvent, createWebSocketEvent } from './helpers.ts';
export type { TestUserContext } from './helpers.ts';
export { createMockBroadcaster } from './mockBroadcaster.ts';
export type { BroadcastRecord } from './mockBroadcaster.ts';
export { setup, teardown } from './dockerSetup.ts';
