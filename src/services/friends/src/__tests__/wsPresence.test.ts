import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Friend, UserContext, UserPresence, WebSocketEvent } from '@/types.js';
import { MockDatabaseAdapter } from '@/__mocks__/MockDatabaseAdapter.js';
import { handleWsConnect, handleWsDefault, handleWsDisconnect } from '@/routes/wsPresence.js';
import { captureWsError } from '@/utils/wsErrors.js';

const mockSend = vi.fn().mockResolvedValue(undefined);
const mockSendToMany = vi.fn().mockResolvedValue([]);

vi.mock('@sentry/aws-serverless', () => ({
    addBreadcrumb: vi.fn(),
    withScope: vi.fn((fn) => fn({ setTag: vi.fn(), setUser: vi.fn(), setContext: vi.fn() })),
    captureException: vi.fn(),
}));

vi.mock('@/utils/broadcast.js', () => ({
    createBroadcaster: vi.fn(() => ({ send: mockSend, sendToMany: mockSendToMany })),
}));

vi.mock('@/utils/wsErrors.js', () => ({ captureWsError: vi.fn() }));

describe('wsPresence handlers', () => {
    let adapter: MockDatabaseAdapter;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSend.mockResolvedValue(undefined);
        mockSendToMany.mockResolvedValue([]);
        adapter = new MockDatabaseAdapter();
    });

    describe('handleWsConnect', () => {
        it('returns 401 when userContext is null', async () => {
            const event = makeWebSocketEvent();

            const response = await handleWsConnect(event, adapter, null);

            expect(response.statusCode).toBe(401);
            expect(response.body).toBeDefined();
            expect(JSON.parse(response.body ?? '{}')).toMatchObject({
                error: 'Unauthorized',
                message: 'Missing user context',
            });
        });

        it('returns 200 and stores user presence as online with connectionId', async () => {
            const event = makeWebSocketEvent({
                requestContext: { connectionId: 'conn-online-1' },
            });
            const userContext = makeUserContext({ userId: 'user-online-1' });

            const response = await handleWsConnect(event, adapter, userContext);
            const storedPresence = await adapter.getByField('userPresence', 'connectionId', 'conn-online-1');

            expect(response.statusCode).toBe(200);
            expect(storedPresence).toHaveLength(1);
            expect(storedPresence[0]).toMatchObject({
                userId: 'user-online-1',
                status: 'online',
                connectionId: 'conn-online-1',
            });
        });

        it('looks up accepted friends and broadcasts friendOnline to their connectionIds', async () => {
            const event = makeWebSocketEvent({
                requestContext: { connectionId: 'conn-owner-1' },
            });
            const userContext = makeUserContext({ userId: 'owner-1', name: 'Owner One' });
            const acceptedFriend = makeFriend({
                id: 'friend-accepted-1',
                ownerId: 'owner-1',
                userId: 'friend-user-1',
                status: 'accepted',
            });
            const pendingFriend = makeFriend({
                id: 'friend-pending-1',
                ownerId: 'owner-1',
                userId: 'friend-user-2',
                status: 'pending',
            });
            const friendPresence = {
                ...makeUserPresence({ userId: 'friend-user-1', connectionId: 'friend-conn-1' }),
                id: 'friend-user-1',
            };

            await adapter.put('friend', acceptedFriend);
            await adapter.put('friend', pendingFriend);
            await adapter.put('userPresence', friendPresence);

            const response = await handleWsConnect(event, adapter, userContext);

            expect(response.statusCode).toBe(200);
            expect(mockSendToMany).toHaveBeenCalledTimes(1);
            expect(mockSendToMany).toHaveBeenCalledWith(['friend-conn-1'], {
                action: 'friendOnline',
                userId: 'owner-1',
                name: 'Owner One',
            });
        });

        it('marks gone connections offline when sendToMany reports stale connections', async () => {
            const event = makeWebSocketEvent({
                requestContext: { connectionId: 'conn-owner-2' },
            });
            const userContext = makeUserContext({ userId: 'owner-2' });
            const acceptedFriend = makeFriend({
                id: 'friend-accepted-2',
                ownerId: 'owner-2',
                userId: 'friend-user-3',
                status: 'accepted',
            });
            const friendPresence = {
                ...makeUserPresence({ userId: 'friend-user-3', connectionId: 'friend-conn-gone' }),
                id: 'friend-user-3',
            };

            await adapter.put('friend', acceptedFriend);
            await adapter.put('userPresence', friendPresence);
            mockSendToMany.mockResolvedValueOnce(['friend-conn-gone']);

            const response = await handleWsConnect(event, adapter, userContext);
            const updatedFriendPresence = await adapter.get('userPresence', 'friend-user-3');

            expect(response.statusCode).toBe(200);
            expect(updatedFriendPresence).not.toBeNull();
            expect(updatedFriendPresence).toMatchObject({
                userId: 'friend-user-3',
                status: 'offline',
                connectionId: null,
            });
        });

        it('returns 500 with ServerError when db put fails', async () => {
            const event = makeWebSocketEvent();
            const userContext = makeUserContext();

            vi.spyOn(adapter, 'put').mockRejectedValueOnce(new Error('db write failed'));

            const response = await handleWsConnect(event, adapter, userContext);

            expect(response.statusCode).toBe(500);
            expect(JSON.parse(response.body ?? '{}')).toMatchObject({
                error: 'ServerError',
                message: 'Failed to establish presence',
            });
            expect(captureWsError).toHaveBeenCalledTimes(1);
        });
    });

    describe('handleWsDisconnect', () => {
        it('returns 200 when no presence exists for the connectionId', async () => {
            const event = makeWebSocketEvent({
                requestContext: {
                    routeKey: '$disconnect',
                    eventType: 'DISCONNECT',
                    connectionId: 'conn-missing',
                },
            });

            const response = await handleWsDisconnect(event, adapter, null);

            expect(response.statusCode).toBe(200);
            expect(mockSendToMany).not.toHaveBeenCalled();
        });

        it('marks the user presence offline with null connectionId', async () => {
            const presence = {
                ...makeUserPresence({ userId: 'disconnect-user-1', connectionId: 'conn-disc-1' }),
                id: 'disconnect-user-1',
            };
            const event = makeWebSocketEvent({
                requestContext: {
                    routeKey: '$disconnect',
                    eventType: 'DISCONNECT',
                    connectionId: 'conn-disc-1',
                },
            });

            await adapter.put('userPresence', presence);

            const response = await handleWsDisconnect(event, adapter, null);
            const updatedPresence = await adapter.get('userPresence', 'disconnect-user-1');

            expect(response.statusCode).toBe(200);
            expect(updatedPresence).not.toBeNull();
            expect(updatedPresence).toMatchObject({
                userId: 'disconnect-user-1',
                status: 'offline',
                connectionId: null,
            });
        });

        it('broadcasts friendOffline to accepted friends connection IDs', async () => {
            const disconnectingPresence = {
                ...makeUserPresence({ userId: 'disconnect-user-2', connectionId: 'conn-disc-2' }),
                id: 'disconnect-user-2',
            };
            const acceptedFriend = makeFriend({
                id: 'friend-accepted-3',
                ownerId: 'disconnect-user-2',
                userId: 'friend-user-4',
                status: 'accepted',
            });
            const friendPresence = {
                ...makeUserPresence({ userId: 'friend-user-4', connectionId: 'friend-conn-4' }),
                id: 'friend-user-4',
            };
            const event = makeWebSocketEvent({
                requestContext: {
                    routeKey: '$disconnect',
                    eventType: 'DISCONNECT',
                    connectionId: 'conn-disc-2',
                },
            });

            await adapter.put('userPresence', disconnectingPresence);
            await adapter.put('friend', acceptedFriend);
            await adapter.put('userPresence', friendPresence);

            const response = await handleWsDisconnect(event, adapter, null);

            expect(response.statusCode).toBe(200);
            expect(mockSendToMany).toHaveBeenCalledTimes(1);
            expect(mockSendToMany).toHaveBeenCalledWith(['friend-conn-4'], {
                action: 'friendOffline',
                userId: 'disconnect-user-2',
            });
        });

        it('returns 200 even when broadcast errors occur', async () => {
            const disconnectingPresence = {
                ...makeUserPresence({ userId: 'disconnect-user-3', connectionId: 'conn-disc-3' }),
                id: 'disconnect-user-3',
            };
            const acceptedFriend = makeFriend({
                id: 'friend-accepted-4',
                ownerId: 'disconnect-user-3',
                userId: 'friend-user-5',
                status: 'accepted',
            });
            const friendPresence = {
                ...makeUserPresence({ userId: 'friend-user-5', connectionId: 'friend-conn-5' }),
                id: 'friend-user-5',
            };
            const event = makeWebSocketEvent({
                requestContext: {
                    routeKey: '$disconnect',
                    eventType: 'DISCONNECT',
                    connectionId: 'conn-disc-3',
                },
            });

            await adapter.put('userPresence', disconnectingPresence);
            await adapter.put('friend', acceptedFriend);
            await adapter.put('userPresence', friendPresence);
            mockSendToMany.mockRejectedValueOnce(new Error('broadcast failed'));

            const response = await handleWsDisconnect(event, adapter, null);

            expect(response.statusCode).toBe(200);
            expect(captureWsError).toHaveBeenCalledTimes(1);
        });
    });

    describe('handleWsDefault', () => {
        it('sends pong when action is ping', async () => {
            const event = makeWebSocketEvent({
                requestContext: {
                    routeKey: '$default',
                    eventType: 'MESSAGE',
                    connectionId: 'conn-ping-1',
                },
                body: JSON.stringify({ action: 'ping' }),
            });

            const response = await handleWsDefault(event, adapter, null);

            expect(response.statusCode).toBe(200);
            expect(mockSend).toHaveBeenCalledTimes(1);
            expect(mockSend).toHaveBeenCalledWith('conn-ping-1', { action: 'pong' });
        });

        it('returns 400 for unsupported actions', async () => {
            const event = makeWebSocketEvent({
                requestContext: {
                    routeKey: '$default',
                    eventType: 'MESSAGE',
                },
                body: JSON.stringify({ action: 'noop' }),
            });

            const response = await handleWsDefault(event, adapter, null);

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body ?? '{}')).toMatchObject({
                error: 'UnknownAction',
                message: 'Unsupported action',
            });
        });

        it('returns 400 when body is null or empty', async () => {
            const nullBodyEvent = makeWebSocketEvent({
                requestContext: {
                    routeKey: '$default',
                    eventType: 'MESSAGE',
                },
                body: null,
            });
            const emptyBodyEvent = makeWebSocketEvent({
                requestContext: {
                    routeKey: '$default',
                    eventType: 'MESSAGE',
                },
                body: '',
            });

            const nullBodyResponse = await handleWsDefault(nullBodyEvent, adapter, null);
            const emptyBodyResponse = await handleWsDefault(emptyBodyEvent, adapter, null);

            expect(nullBodyResponse.statusCode).toBe(400);
            expect(emptyBodyResponse.statusCode).toBe(400);
        });
    });
});

function makeWebSocketEvent(overrides?: Partial<WebSocketEvent>): WebSocketEvent {
    return {
        requestContext: {
            routeKey: '$connect',
            connectionId: 'conn-1',
            domainName: 'ws.example.com',
            stage: 'prod',
            eventType: 'CONNECT' as const,
            ...overrides?.requestContext,
        },
        body: overrides?.body ?? null,
        queryStringParameters: overrides?.queryStringParameters ?? null,
    };
}

function makeUserContext(overrides?: Partial<UserContext>): UserContext {
    return {
        userId: 'user-1',
        email: 'user-1@example.com',
        name: 'User One',
        ...overrides,
    };
}

function makeUserPresence(overrides?: Partial<UserPresence>): UserPresence {
    return {
        userId: 'user-1',
        status: 'online',
        connectionId: 'conn-1',
        lastSeen: '2024-01-01T00:00:00.000Z',
        ...overrides,
    };
}

function makeFriend(overrides?: Partial<Friend>): Friend {
    return {
        id: 'friend-1',
        ownerId: 'owner-1',
        userId: 'friend-user-1',
        status: 'accepted',
        canShareArmyLists: false,
        canViewMatchHistory: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        ...overrides,
    };
}
