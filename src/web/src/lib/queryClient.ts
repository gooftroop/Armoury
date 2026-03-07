/**
 * @requirements
 * 1. Must export a module-level singleton instance of QueryClient.
 * 2. Default staleTime must be 3_600_000 (1 hour).
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Global singleton QueryClient instance.
 * Shared across the entire web application to manage remote state.
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 3_600_000,
        },
    },
});
