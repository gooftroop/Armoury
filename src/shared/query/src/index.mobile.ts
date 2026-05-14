/**
 * @requirements
 * 1. Must export the singleton QueryClient for use in mobile providers.
 * 2. Must NOT use Next.js cache() — mobile has no server-side per-request caching.
 */

export { queryClient } from './queryClient.js';
export { getSyncStatus } from './getSyncStatus.js';
