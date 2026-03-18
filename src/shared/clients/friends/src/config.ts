/**
 * Configuration constants for the friends client package.
 */
import { config } from '@armoury/config';

/** Base URL for the friends REST API. */
export const FRIENDS_BASE_URL = config.services.friends.apiBaseUrl;

/** WebSocket URL for the friends presence service. */
export const DEFAULT_FRIENDS_WS_URL = config.services.friends.wsBaseUrl ?? 'ws://localhost:3005';

/** Maximum number of reconnection attempts before giving up. */
export const MAX_RECONNECT_ATTEMPTS = 10;

/** Base delay in milliseconds for exponential backoff reconnection. */
export const BASE_RECONNECT_DELAY_MS = 1000;
