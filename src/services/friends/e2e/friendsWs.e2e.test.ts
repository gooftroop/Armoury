import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Friend, UserContext, WebSocketEvent } from '@/types.js';
import { createE2EAdapter, resetDatabase } from '@/__testing__/e2eAdapter.js';
import type { LocalDatabaseAdapter } from '@/utils/localAdapter.js';
import type { BroadcastRecord } from '@armoury/e2e/mockBroadcaster.js';
import { createMockBroadcaster } from '@armoury/e2e/mockBroadcaster.js';
import { createTestUserContext, createWebSocketEvent } from '@armoury/e2e/helpers.js';
import { wsRouter } from '@/wsRouter.js';

const mockBroadcast = createMockBroadcaster();

vi.mock('@/utils/broadcast.js', () => ({
    createBroadcaster: () => mockBroadcast.broadcaster,
}));

let adapter: LocalDatabaseAdapter;

const userA: UserContext = createTestUserContext({ sub: 'presence-a', name: 'Friend A' });
const userB: UserContext = createTestUserContext({ sub: 'presence-b', name: 'Friend B' });

function connectEvent(connectionId: string, userContext: UserContext): WebSocketEvent {
    return createWebSocketEvent({
        routeKey: '$connect',
        connectionId,
        userContext,
        eventType: 'CONNECT',
    });
}

function disconnectEvent(connectionId: string): WebSocketEvent {
    return createWebSocketEvent({
        routeKey: '$disconnect',
        connectionId,
        eventType: 'DISCONNECT',
    });
}

async function seedAcceptedFriendship(friendAdapter: LocalDatabaseAdapter, aId: string, bId: string): Promise<Friend> {
    const friend: Friend = {
        id: `friend-${Date.now()}`,
        ownerId: aId,
        userId: bId,
        status: 'accepted',
        canShareArmyLists: false,
        canViewMatchHistory: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
    };

    await friendAdapter.put('friend', friend);
    // Also seed the mirror record for the reverse relationship
    const mirror: Friend = {
        id: `friend-mirror-${Date.now()}`,
        ownerId: bId,
        userId: aId,
        status: 'accepted',
        canShareArmyLists: false,
        canViewMatchHistory: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
    };
    await friendAdapter.put('friend', mirror);

    return friend;
}

beforeAll(async () => {
    adapter = await createE2EAdapter();
});

afterAll(async () => {
    await resetDatabase(adapter);
});

describe('friends WebSocket presence e2e', () => {
    beforeEach(async () => {
        await resetDatabase(adapter);
        mockBroadcast.reset();
    });

    it('connect stores user presence as online', async () => {
        const res = await wsRouter(connectEvent('conn-a', userA), adapter, userA);

        expect(res.statusCode).toBe(200);

        const presence = await adapter.get('userPresence', userA.sub);
        expect(presence).not.toBeNull();
        expect(presence!.status).toBe('online');
        expect(presence!.connectionId).toBe('conn-a');
    });

    it('connect without user context returns 401', async () => {
        const event = createWebSocketEvent({
            routeKey: '$connect',
            connectionId: 'conn-noauth',
            eventType: 'CONNECT',
        });

        const res = await wsRouter(event, adapter, null);
        expect(res.statusCode).toBe(401);
    });

    it('connect broadcasts friendOnline to accepted friends', async () => {
        await seedAcceptedFriendship(adapter, userA.sub, userB.sub);
        await wsRouter(connectEvent('conn-b', userB), adapter, userB);
        mockBroadcast.reset();

        await wsRouter(connectEvent('conn-a', userA), adapter, userA);

        expect(mockBroadcast.broadcasts).toHaveLength(1);
        const broadcast = mockBroadcast.broadcasts[0] as BroadcastRecord;
        expect(broadcast.connectionId).toBe('conn-b');
        expect((broadcast.data as { action: string }).action).toBe('friendOnline');
        expect((broadcast.data as { userId: string }).userId).toBe(userA.sub);
    });

    it('disconnect sets presence to offline', async () => {
        await wsRouter(connectEvent('conn-a', userA), adapter, userA);

        const res = await wsRouter(disconnectEvent('conn-a'), adapter, null);
        expect(res.statusCode).toBe(200);

        const presence = await adapter.get('userPresence', userA.sub);
        expect(presence).not.toBeNull();
        expect(presence!.status).toBe('offline');
        expect(presence!.connectionId).toBeNull();
    });

    it('disconnect broadcasts friendOffline to accepted friends', async () => {
        await seedAcceptedFriendship(adapter, userA.sub, userB.sub);
        await wsRouter(connectEvent('conn-b', userB), adapter, userB);
        await wsRouter(connectEvent('conn-a', userA), adapter, userA);
        mockBroadcast.reset();

        await wsRouter(disconnectEvent('conn-a'), adapter, null);

        expect(mockBroadcast.broadcasts).toHaveLength(1);
        const broadcast = mockBroadcast.broadcasts[0] as BroadcastRecord;
        expect(broadcast.connectionId).toBe('conn-b');
        expect((broadcast.data as { action: string }).action).toBe('friendOffline');
        expect((broadcast.data as { userId: string }).userId).toBe(userA.sub);
    });

    it('disconnect with unknown connection returns 200 gracefully', async () => {
        const res = await wsRouter(disconnectEvent('conn-unknown'), adapter, null);
        expect(res.statusCode).toBe(200);
    });

    it('does not broadcast to non-accepted friends', async () => {
        const pendingFriend: Friend = {
            id: 'friend-pending',
            ownerId: userA.sub,
            userId: userB.sub,
            status: 'pending',
            canShareArmyLists: false,
            canViewMatchHistory: false,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
        };

        await adapter.put('friend', pendingFriend);
        await wsRouter(connectEvent('conn-b', userB), adapter, userB);
        mockBroadcast.reset();

        await wsRouter(connectEvent('conn-a', userA), adapter, userA);

        expect(mockBroadcast.broadcasts).toHaveLength(0);
    });

    it('unknown action returns 400', async () => {
        const event = createWebSocketEvent({
            routeKey: '$default',
            connectionId: 'conn-a',
            eventType: 'MESSAGE',
        });

        const res = await wsRouter(event, adapter, null);
        expect(res.statusCode).toBe(400);
    });
});
