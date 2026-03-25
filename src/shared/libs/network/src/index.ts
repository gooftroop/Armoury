/**
 * Browser-compatible WebSocket client base class for the Armoury platform.
 *
 * Provides connection management, reconnection with exponential backoff,
 * heartbeat monitoring, and structured error handling. Game-specific
 * WebSocket clients extend this base class.
 *
 * @module @armoury/network
 */

/**
 * @requirements
 * 1. Must export the WebSocketClient base class.
 * 2. Must export all public network client types.
 */

export { WebSocketClient } from './webSocket.js';
export type { WebSocketClientConfig, WebSocketErrorEvent, WebSocketErrorSource, ConnectionState } from './webSocket.js';
