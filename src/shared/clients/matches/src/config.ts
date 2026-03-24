/** Base URL for the matches REST API, sourced from the environment. */
export const MATCHES_BASE_URL = process.env.MATCHES_BASE_URL ?? 'http://localhost:3001';

/** Default WebSocket URL for the matches real-time service. */
export const DEFAULT_MATCHES_WS_URL = 'ws://localhost:3002';

/** Maximum number of reconnection attempts. */
export const MAX_RECONNECT_ATTEMPTS = 10;

/** Base delay in milliseconds for exponential backoff reconnection. */
export const BASE_RECONNECT_DELAY_MS = 1000;

/** Maximum delay in milliseconds for exponential backoff reconnection. */
export const MAX_RECONNECT_DELAY_MS = 30_000;

/** Timeout in milliseconds to wait for a server ping before terminating the connection. */
export const HEARTBEAT_TIMEOUT_MS = 31_000;
