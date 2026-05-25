import { createHash } from 'node:crypto';

import { DEFAULT_PREFERENCES } from '@/utils/defaultPreferences.js';
import type { Account, DatabaseAdapter, User, UserContext } from '@/types.js';

/**
 * @requirements
 * - If a user row exists for the given userId, return it immediately (passthrough).
 * - If no user exists and the caller's JWT sub does NOT match userId, return null.
 * - If no user exists and caller matches, JIT-provision user + account inside a transaction.
 * - If an account already exists for the userId (user row missing), reuse its id rather than creating a duplicate account.
 * - The account id must be deterministic from userId so concurrent JIT calls converge on a single account row.
 * - Placeholder email/name are used when claims are absent; the Auth0 Post-Login Action overwrites them via upsertUser on next login.
 */

function deterministicAccountId(userId: string): string {
    return createHash('sha256').update(userId).digest('hex').slice(0, 24);
}

/**
 * Resolves a user by Auth0 sub, JIT-provisioning a user + account row when
 * missing and the caller's token sub matches the requested id.
 */
export async function resolveUser(
    adapter: DatabaseAdapter,
    userId: string,
    userContext?: UserContext,
): Promise<User | null> {
    const existing = await adapter.get('user', userId);

    if (existing) {
        return existing;
    }

    if (!userContext || userContext.userId !== userId) {
        return null;
    }

    return adapter.transaction(async () => {
        const racedExisting = await adapter.get('user', userId);

        if (racedExisting) {
            return racedExisting;
        }

        const existingAccounts = await adapter.getByField('account', 'userId', userId);
        const now = new Date().toISOString();

        let accountId: string;

        if (existingAccounts.length > 0) {
            accountId = existingAccounts[0]!.id;
        } else {
            accountId = deterministicAccountId(userId);

            const account: Account = {
                id: accountId,
                userId,
                preferences: DEFAULT_PREFERENCES,
                systems: {},
                createdAt: now,
                updatedAt: now,
            };

            await adapter.put('account', account);
        }

        const user: User = {
            id: userId,
            email: userContext.email ?? `pending+${userId}@armoury-app.com`,
            name: userContext.name ?? 'Pending User',
            picture: null,
            accountId,
            createdAt: now,
            updatedAt: now,
        };

        await adapter.put('user', user);

        return user;
    });
}
