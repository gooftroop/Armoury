import type { Friend } from '@models/FriendModel.js';
export function makeFriend(overrides: Partial<Friend> = {}): Friend {
    return {
        id: 'friend-1',
        ownerId: 'auth0|user-1',
        userId: 'auth0|user-2',
        status: 'accepted',
        canShareArmyLists: true,
        canViewMatchHistory: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        ...overrides,
    };
}
