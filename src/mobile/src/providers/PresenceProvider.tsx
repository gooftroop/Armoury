/**
 * Presence provider for the mobile application.
 *
 * Connects authenticated users to the friends presence WebSocket, exposes
 * observable streams for online status, and sends heartbeat messages at a
 * fixed cadence while connected.
 *
 * @requirements
 * 1. Must initialize presence only when an authenticated user exists.
 * 2. Must retrieve access tokens through react-native-auth0 getCredentials().
 * 3. Must create and connect a FriendsPresenceClient and PresenceStream.
 * 4. Must send a heartbeat payload every 300_000ms (5 minutes).
 * 5. Must fully cleanup stream/client/subscriptions on auth change and unmount.
 * 6. Must expose connection state and stream observables through a React context hook.
 *
 * @module presence-provider
 */

import * as React from 'react';
import { useAuth0 } from 'react-native-auth0';
import * as Sentry from '@sentry/react-native';
import type { ConnectionState, WebSocketErrorEvent } from '@armoury/clients-friends';
import { createFriendsPresenceClient, DEFAULT_FRIENDS_WS_URL } from '@armoury/clients-friends';
import { createPresenceStream } from '@armoury/streams';
import type { Observable, Subscription } from 'rxjs';

/** Represents a single online friend in presence streams. */
interface OnlineFriend {
    userId: string;
    name: string;
}

/** Minimal contract for clients that can send heartbeat payloads. */
interface HeartbeatSender {
    send(message: Record<string, unknown>): void;
}

/**
 * Type guard for heartbeat-capable presence clients.
 *
 * @param value - Unknown value to check.
 * @returns True when the value exposes a callable send method.
 */
function hasHeartbeatSender(value: unknown): value is HeartbeatSender {
    if (typeof value !== 'object' || value === null || !('send' in value)) {
        return false;
    }

    return typeof (value as { send: unknown }).send === 'function';
}

/** Heartbeat cadence while the presence socket is connected (5 minutes). */
const HEARTBEAT_INTERVAL_MS = 300_000;

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
 * Presence provider that binds WebSocket lifecycle to mobile auth state.
 *
 * @param props - Component props.
 * @returns Provider-wrapped children.
 */
export function PresenceProvider({ children }: PresenceProviderProps): React.ReactElement {
    const { user, getCredentials } = useAuth0();
    const [connectionState, setConnectionState] = React.useState<ConnectionState>('disconnected');
    const [onlineFriends$, setOnlineFriends$] = React.useState<Observable<ReadonlyMap<string, OnlineFriend>> | null>(
        null,
    );
    const [onlineCount$, setOnlineCount$] = React.useState<Observable<number> | null>(null);
    const [isOnline$, setIsOnline$] = React.useState<((userId: string) => Observable<boolean>) | null>(null);
    const getCredentialsRef = React.useRef(getCredentials);

    React.useEffect(() => {
        getCredentialsRef.current = getCredentials;
    }, [getCredentials]);

    React.useEffect(() => {
        let isMounted = true;
        let connectionStateSubscription: Subscription | null = null;
        let errorsSubscription: Subscription | null = null;
        let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
        let stream: ReturnType<typeof createPresenceStream> | null = null;
        let client: ReturnType<typeof createFriendsPresenceClient> | null = null;

        if (!user) {
            setConnectionState('disconnected');
            setOnlineFriends$(null);
            setOnlineCount$(null);
            setIsOnline$(null);

            return () => {};
        }

        async function initializePresence(): Promise<void> {
            const getToken = async (): Promise<string> => {
                const credentials = await getCredentialsRef.current();

                if (!credentials?.accessToken) {
                    throw new Error('No access token available');
                }

                return credentials.accessToken;
            };

            try {
                await getToken();
            } catch {
                return;
            }

            if (!isMounted) {
                return;
            }

            client = createFriendsPresenceClient({
                wsUrl: DEFAULT_FRIENDS_WS_URL,
                getToken,
            });

            const presenceStream = createPresenceStream(client);
            stream = presenceStream;

            connectionStateSubscription = presenceStream.connectionState$.subscribe((state: ConnectionState) => {
                setConnectionState(state);
            });
            errorsSubscription = client.errors$.subscribe(({ error, context }: WebSocketErrorEvent) => {
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
            setConnectionState('disconnected');
            setOnlineFriends$(null);
            setOnlineCount$(null);
            setIsOnline$(null);
        };
    }, [user]);

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
