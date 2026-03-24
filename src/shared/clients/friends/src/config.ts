/**
 * Configuration constants for the friends client package.
 */

/** Base URL for the friends REST API, sourced from the environment. */
export const FRIENDS_BASE_URL = process.env.FRIENDS_BASE_URL ?? 'http://localhost:3004';

/** Default WebSocket URL for the friends presence service. */
export const DEFAULT_FRIENDS_WS_URL = 'ws://localhost:3005';

/** Maximum number of reconnection attempts before giving up. */
export const MAX_RECONNECT_ATTEMPTS = 10;

/** Base delay in milliseconds for exponential backoff reconnection. */
export const BASE_RECONNECT_DELAY_MS = 1000;

/** Maximum delay in milliseconds for exponential backoff reconnection. */
export const MAX_RECONNECT_DELAY_MS = 30_000;

/** Timeout in milliseconds to wait for a server ping before terminating the connection. */
export const HEARTBEAT_TIMEOUT_MS = 31_000;
