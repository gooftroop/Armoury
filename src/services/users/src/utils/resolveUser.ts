import { randomUUID } from 'node:crypto';

import { DEFAULT_PREFERENCES } from '@/utils/defaultPreferences.js';
import type { Account, DatabaseAdapter, User, UserContext } from '@/types.js';

const AUTH0_SUB_PATTERN = /^[a-z0-9-]+\|[A-Za-z0-9|._-]+$/;

/**
 * Resolves a user by Auth0 sub, JIT-provisioning a user + account row when
 * missing and the caller's token sub matches the requested id. Placeholder
 * email/name are used when claims are absent; the Auth0 Post-Login Action
 * overwrites them via `upsertUser` on next login.
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

    if (!AUTH0_SUB_PATTERN.test(userId)) {
        return null;
    }

    return adapter.transaction(async () => {
        const racedExisting = await adapter.get('user', userId);

        if (racedExisting) {
            return racedExisting;
        }

        const now = new Date().toISOString();
        const accountId = randomUUID();

        const account: Account = {
            id: accountId,
            userId,
            preferences: DEFAULT_PREFERENCES,
            systems: {},
            createdAt: now,
            updatedAt: now,
        };

        const user: User = {
            id: userId,
            email: userContext.email ?? `pending+${userId}@armoury-app.com`,
            name: userContext.name ?? 'Pending User',
            picture: null,
            accountId,
            createdAt: now,
            updatedAt: now,
        };

        await adapter.put('account', account);
        await adapter.put('user', user);

        return user;
    });
}
