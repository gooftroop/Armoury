/**
 * @armoury/feature-game-system — web barrel file.
 *
 * @requirements
 * 1. Must re-export web game-system hooks and utilities.
 * 2. Must not use default exports.
 */

// === Hooks ===

export { useGameSystem } from './hooks/useGameSystem.js';

// === Utilities ===

export { getKnownSystemIds, resolveGameSystem } from './utils/resolveGameSystem.web.js';
