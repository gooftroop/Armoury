'use client';

import * as React from 'react';
import { getAccessToken } from '@auth0/nextjs-auth0/client';
import * as Sentry from '@sentry/nextjs';
import type { ConnectionState } from '@armoury/clients-friends';
import { createFriendsPresenceClient, DEFAULT_FRIENDS_WS_URL } from '@armoury/clients-friends';
import { createPresenceStream } from '@armoury/streams';
import type { Observable, Subscription } from 'rxjs';

interface OnlineFriend {
    userId: string;
    name: string;
}

interface HeartbeatSender {
    send(message: Record<string, unknown>): void;
}

function hasHeartbeatSender(value: unknown): value is HeartbeatSender {
    if (typeof value !== 'object' || value === null || !('send' in value)) {
        return false;
    }

    return typeof (value as { send: unknown }).send === 'function';
}

/** Heartbeat cadence while the presence socket is connected (5 minutes). */
const HEARTBEAT_INTERVAL_MS = 300_000;

/**
 * @requirements
 * 1. Must attempt to initialize presence only when an Auth0 access token can be retrieved.
 * 2. Must create a FriendsPresenceClient and PresenceStream on successful auth check.
 * 3. Must connect the presence client on initialization and dispose it on unmount.
 * 4. Must send a heartbeat payload every 5 minutes while provider is mounted.
 * 5. Must expose connection state and stream observables through a React context hook.
 */

/**
 * Presence context shape exposed by usePresence().
 */
export interface PresenceContextValue {
    /** Current connection lifecycle state for the friends presence WebSocket. */
    connectionState: ConnectionState;
    /** Stream of online friends keyed by userId. Null when unauthenticated/not initialized. */
    onlineFriends$: Observable<ReadonlyMap<string, OnlineFriend>> | null;
    /** Stream of online friend count. Null when unauthenticated/not initialized. */
    onlineCount$: Observable<number> | null;
    /** Observable factory for a single user's online status. Null when unauthenticated/not initialized. */
    isOnline$: ((userId: string) => Observable<boolean>) | null;
}

/**
 * Props for PresenceProvider.
 */
export interface PresenceProviderProps {
    /** Provider children. */
    children: React.ReactNode;
}

/**
 * Default context value when the presence connection is not initialized.
 */
const defaultPresenceContextValue: PresenceContextValue = {
    connectionState: 'disconnected',
    onlineFriends$: null,
    onlineCount$: null,
    isOnline$: null,
};

/**
 * React context for presence streams and connection state.
 */
const PresenceContext = React.createContext<PresenceContextValue | undefined>(undefined);

/**
 * Presence provider that binds the WebSocket lifecycle to client auth availability.
 *
 * @param props - Component props.
 * @returns Provider-wrapped children.
 */
export function PresenceProvider({ children }: PresenceProviderProps): React.ReactElement {
    const [connectionState, setConnectionState] = React.useState<ConnectionState>('disconnected');
    const [onlineFriends$, setOnlineFriends$] = React.useState<Observable<ReadonlyMap<string, OnlineFriend>> | null>(
        null,
    );
    const [onlineCount$, setOnlineCount$] = React.useState<Observable<number> | null>(null);
    const [isOnline$, setIsOnline$] = React.useState<((userId: string) => Observable<boolean>) | null>(null);

    /**
     * Initialize the presence WebSocket on mount.
     *
     * The empty dependency array is intentional: Auth0's Next.js SDK uses a
     * server-redirect silent-auth flow that causes a full page reload after
     * login. Because the page reloads, this effect re-runs with the freshly
     * authenticated session without needing `user` in the dependency array.
     * Adding reactive auth state here would cause unnecessary reconnections.
     */
    React.useEffect(() => {
        let isMounted = true;
        let connectionStateSubscription: Subscription | null = null;
        let errorsSubscription: Subscription | null = null;
        let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
        let stream: ReturnType<typeof createPresenceStream> | null = null;
        let client: ReturnType<typeof createFriendsPresenceClient> | null = null;

        async function initializePresence(): Promise<void> {
            try {
                await getAccessToken();
            } catch {
                return;
            }

            if (!isMounted) {
                return;
            }

            client = createFriendsPresenceClient({
                wsUrl: DEFAULT_FRIENDS_WS_URL,
                getToken: getAccessToken,
            });
            const presenceStream = createPresenceStream(client);
            stream = presenceStream;

            connectionStateSubscription = presenceStream.connectionState$.subscribe((state: ConnectionState) => {
                setConnectionState(state);
            });
            errorsSubscription = client.errors$.subscribe(({ error, context }) => {
                Sentry.captureException(error, { extra: context });
            });
            setOnlineFriends$(() => presenceStream.onlineFriends$);
            setOnlineCount$(() => presenceStream.onlineCount$);
            setIsOnline$(() => (userId: string) => presenceStream.isOnline$(userId));

            client.connect();
            heartbeatInterval = setInterval(() => {
                if (hasHeartbeatSender(client)) {
                    client.send({ action: 'heartbeat' });
                }
            }, HEARTBEAT_INTERVAL_MS);
        }

        void initializePresence();

        return () => {
            isMounted = false;

            if (heartbeatInterval !== null) {
                clearInterval(heartbeatInterval);
            }

            connectionStateSubscription?.unsubscribe();
            errorsSubscription?.unsubscribe();
            stream?.dispose();
            client?.disconnect();
            client?.dispose();
        };
    }, []);

    const value = React.useMemo<PresenceContextValue>(
        () => ({
            ...defaultPresenceContextValue,
            connectionState,
            onlineFriends$,
            onlineCount$,
            isOnline$,
        }),
        [connectionState, onlineFriends$, onlineCount$, isOnline$],
    );

    return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

/**
 * Returns the current presence context.
 *
 * @returns Presence connection and observable stream handles.
 */
export function usePresence(): PresenceContextValue {
    const context = React.useContext(PresenceContext);

    if (context === undefined) {
        throw new Error('usePresence must be used within a PresenceProvider');
    }

    return context;
}
