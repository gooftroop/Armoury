/**
 * SSR-safe QueryClient factory for TanStack React Query v5.
 *
 * On the server, returns a fresh QueryClient per request to prevent data leaking
 * between users. On the client, returns a stable singleton so React Query state
 * persists across navigations.
 *
 * @requirements
 * 1. Must return a new QueryClient per server request (no cross-request leaking).
 * 2. Must return a stable singleton on the client (React state persists).
 * 3. Default staleTime must be 3_600_000 (1 hour) matching the previous singleton config.
 * 4. Must configure dehydration to include pending queries for SSR hydration.
 */

import { QueryClient, defaultShouldDehydrateQuery } from '@tanstack/react-query';

/**
 * Builds a new QueryClient with the standard Armoury defaults.
 *
 * @returns A freshly configured QueryClient instance.
 */
function makeQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 3_600_000,
            },
            dehydrate: {
                shouldDehydrateQuery: (query) =>
                    defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
            },
        },
    });
}

/** Client-side singleton. Undefined on the server. */
let browserQueryClient: QueryClient | undefined;

/**
 * Returns an SSR-safe QueryClient instance.
 *
 * - **Server**: Always creates a new QueryClient (one per request).
 * - **Browser**: Returns a stable singleton, creating it on first call.
 *
 * @returns The QueryClient instance appropriate for the current environment.
 */
export function getQueryClient(): QueryClient {
    if (typeof window === 'undefined') {
        return makeQueryClient();
    }

    if (!browserQueryClient) {
        browserQueryClient = makeQueryClient();
    }

    return browserQueryClient;
}
