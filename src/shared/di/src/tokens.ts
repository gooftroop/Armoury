/**
 * Dependency injection token definitions for @armoury/di.
 *
 * @requirements
 * - REQ-DI-001: Every injectable dependency has a unique symbol token.
 * - REQ-DI-002: Tokens use Symbol.for() for cross-module identity.
 * - REQ-DI-003: Token names map directly to dependency roles.
 */

/**
 * Shared injection token registry for all platform/container modules.
 *
 * Adapters, clients, configuration values, and factories resolve through this
 * object to guarantee stable symbol identity across workspaces and bundles.
 */
export const TOKENS = Object.freeze({
    /** Adapter instance token for a concrete DatabaseAdapter implementation. */
    DatabaseAdapter: Symbol.for('DatabaseAdapter'),
    /** Adapter configuration token for platform-specific adapter options. */
    AdapterConfig: Symbol.for('AdapterConfig'),

    /** Resolved GitHub client token. */
    GitHubClient: Symbol.for('GitHubClient'),
    /** Resolved Wahapedia client token. */
    WahapediaClient: Symbol.for('WahapediaClient'),
    /** QueryClient token for request caching/deduplication. */
    QueryClient: Symbol.for('QueryClient'),

    /** Optional GitHub proxy configuration token (web environments). */
    GitHubProxyConfig: Symbol.for('GitHubProxyConfig'),
    /** DSQL adapter configuration token (Lambda environments). */
    DSQLConfig: Symbol.for('DSQLConfig'),

    /** Data context builder token for composition-root orchestration. */
    DataContextBuilder: Symbol.for('DataContextBuilder'),
    /** Active game system token used to resolve plugin registrations. */
    GameSystem: Symbol.for('GameSystem'),

    /** Async adapter factory token returning a platform adapter instance. */
    AdapterFactory: Symbol.for('AdapterFactory'),
    /** Async GitHub client factory token. */
    GitHubClientFactory: Symbol.for('GitHubClientFactory'),
    /** Async Wahapedia client factory token. */
    WahapediaClientFactory: Symbol.for('WahapediaClientFactory'),
} as const);
