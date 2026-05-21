/**
 * Resolves a user by their ID, which is their Auth0 sub.
 *
 * After the migration, `users.id === Auth0 sub` directly, so a simple
 * primary-key lookup via `adapter.get` is sufficient.
 *
 * @param adapter - Database adapter instance.
 * @param userId - The user's Auth0 sub (which is their database id).
 * @returns The resolved User entity, or null if not found.
 */
import type { DatabaseAdapter, User } from '@/types.js';

export async function resolveUser(adapter: DatabaseAdapter, userId: string): Promise<User | null> {
    return adapter.get('user', userId);
}
