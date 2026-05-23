import { randomUUID } from 'node:crypto';

import { DEFAULT_PREFERENCES } from '@/routes/users.js';
import type { Account, DatabaseAdapter, User, UserContext } from '@/types.js';

// Auth0 sub: `<strategy>|<provider-id>` (e.g. `auth0|abc`, `google-oauth2|123`, `samlp|tenant|user`).
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

    // Only JIT-provision authenticated callers whose path id matches their token sub.
    if (!userContext || userContext.userId !== userId) {
        return null;
    }

    if (!AUTH0_SUB_PATTERN.test(userId)) {
        return null;
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

    console.info(
        '[resolveUser] JIT-provisioned user',
        JSON.stringify({ userId, accountId, hasEmail: Boolean(userContext.email), hasName: Boolean(userContext.name) }),
    );

    return user;
}
