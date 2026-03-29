/**
 * Configuration constants for the matches client package.
 */
import { config } from '@armoury/config';

/** Base URL for the matches REST API. */
export const MATCHES_BASE_URL = config.services.matches.apiBaseUrl;

/** Default WebSocket URL for the matches real-time service. */
export const DEFAULT_MATCHES_WS_URL = config.services.matches.wsBaseUrl ?? 'ws://localhost:3002';

/** Maximum number of reconnection attempts. */
export const MAX_RECONNECT_ATTEMPTS = 10;

/** Base delay in milliseconds for exponential backoff reconnection. */
export const BASE_RECONNECT_DELAY_MS = 1000;

/** Maximum delay in milliseconds for exponential backoff reconnection. */
export const MAX_RECONNECT_DELAY_MS = 30_000;

/** Timeout in milliseconds to wait for a server ping before terminating the connection. */
export const HEARTBEAT_TIMEOUT_MS = 31_000;
