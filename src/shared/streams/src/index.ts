/**
 * Barrel export for the @armoury/streams package.
 *
 * Re-exports all public types, classes, and factory functions so consumers
 * can import from a single entry point:
 *
 * ```typescript
 * import { createPresenceStream, createMatchStream } from '@armoury/streams';
 * import type { IPresenceStream, IMatchStream } from '@armoury/streams';
 * ```
 *
 * @module @armoury/streams
 */

// === Types ===
export type { ConnectionState, OnlineFriend, IStream, IPresenceStream, IMatchStream } from '@/types.js';

// === Presence ===
export { PresenceStream, createPresenceStream } from '@/presence/PresenceStream.js';

// === Matches ===
export { MatchStream, createMatchStream } from '@/matches/MatchStream.js';
