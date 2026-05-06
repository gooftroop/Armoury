/**
 * @requirements
 * 1. Must export the singleton QueryClient for use in web providers.
 * 2. Must export the SSR-safe getQueryClient factory for Next.js RSC/SSR.
 */

export { queryClient } from './queryClient.js';
export { getQueryClient } from './getQueryClient.js';
export { getSyncStatus } from './getSyncStatus.js';
