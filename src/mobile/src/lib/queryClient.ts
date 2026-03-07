/**
 * @requirements
 * 1. Must export a single shared QueryClient instance.
 * 2. Must configure queries with a staleTime of 3_600_000 (1 hour).
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Shared QueryClient instance for the mobile app.
 * Prevents recreation on re-renders and provides global defaults.
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 3_600_000,
        },
    },
});
