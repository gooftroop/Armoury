import type { UserPresence } from '@armoury/models';
export function makeUserPresence(overrides: Partial<UserPresence> = {}): UserPresence {
    return {
        userId: 'auth0|user-1',
        connectionId: 'conn-abc123',
        status: 'online',
        lastSeen: '2025-01-01T00:00:00Z',
        ...overrides,
    };
}
