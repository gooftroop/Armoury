/**
 * Resolves a user by internal ID (primary key) with fallback to Auth0 sub lookup.
 *
 * Clients should always send the internal UUID, but during the migration window
 * some requests may still carry the Auth0 `sub`. This helper tries the fast PK
 * lookup first and falls back to a `sub` field scan only when the PK misses.
 *
 * @requirements
 * 1. Must attempt primary-key lookup first (adapter.get).
 * 2. Must fall back to sub-field lookup (adapter.getByField) when PK lookup returns null.
 * 3. Must return the User entity or null — never throw on missing user.
 *
 * @module resolveUser
 */

import type { DatabaseAdapter, User } from '@/types.js';

/**
 * Resolves a user by internal ID with fallback to Auth0 sub lookup.
 *
 * @param adapter - Database adapter instance.
 * @param userId - Either an internal UUID (primary key) or an Auth0 sub string.
 * @returns The resolved User entity, or null if not found by either method.
 */
export async function resolveUser(adapter: DatabaseAdapter, userId: string): Promise<User | null> {
    const byId = await adapter.get('user', userId);

    if (byId) {
        return byId;
    }

    console.warn('[resolveUser] PK lookup miss, trying sub fallback', JSON.stringify({ userId }));

    const bySub = await adapter.getByField('user', 'sub', userId);
    const resolved = bySub[0] ?? null;

    if (!resolved) {
        console.error(
            '[resolveUser] User not found by PK or sub',
            JSON.stringify({
                userId,
                pkResult: null,
                subResults: bySub.length,
            }),
        );
    } else {
        console.warn(
            '[resolveUser] Resolved via sub fallback',
            JSON.stringify({
                userId,
                resolvedId: resolved.id,
                resolvedSub: resolved.sub,
            }),
        );
    }

    return resolved;
}
