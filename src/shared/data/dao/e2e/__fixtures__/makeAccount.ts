import type { Account } from '@armoury/models/AccountModel';

/** Creates a test Account fixture with sensible defaults. */
export function makeAccount(overrides: Partial<Account> = {}): Account {
    return {
        id: 'a1b2c3d4-0001-0000-0000-000000000001',
        userId: 'user-123',
        preferences: { theme: 'dark', language: 'en', notificationsEnabled: true },
        systems: {},
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        ...overrides,
    };
}
