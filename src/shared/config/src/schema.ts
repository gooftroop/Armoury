/**
 * Unified application configuration schema.
 *
 * Platform adapters (Next.js, Expo) populate this from environment variables
 * with platform-appropriate prefixes (NEXT_PUBLIC_*, EXPO_PUBLIC_*).
 * Values are layered: env vars override defaults.
 */

/** Configuration for a single REST+WS service. */
export interface ServiceConfig {
    /** Base URL for REST API requests (e.g. "https://api.armoury-app.com/users"). */
    readonly apiBaseUrl: string;
    /** Base URL for WebSocket connections, if the service supports WS. */
    readonly wsBaseUrl?: string;
}

/** Top-level application configuration. */
export interface AppConfig {
    readonly services: {
        readonly users: ServiceConfig;
        readonly friends: ServiceConfig;
        readonly matches: ServiceConfig;
        readonly campaigns: ServiceConfig;
    };
}

/** Default configuration — localhost fallbacks for local development. */
export const defaults: AppConfig = {
    services: {
        users: { apiBaseUrl: 'http://localhost:3000' },
        friends: { apiBaseUrl: 'http://localhost:3004', wsBaseUrl: 'ws://localhost:3005' },
        matches: { apiBaseUrl: 'http://localhost:3001', wsBaseUrl: 'ws://localhost:3002' },
        campaigns: { apiBaseUrl: 'http://localhost:3000' },
    },
};
