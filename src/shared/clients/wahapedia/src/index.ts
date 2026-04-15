/**
 * Wahapedia client package.
 *
 * Provides standalone fetch functions for Wahapedia content and React Query
 * option builders for cached data access.
 */

// === Types ===
export type { IWahapediaClient, IWahapediaParser } from '@/types.js';
export type { WahapediaFetchResult } from '@/api/fetchWahapediaPageRaw.js';

// === API Functions ===
export { fetchWahapediaPage } from '@/api/fetchWahapediaPage.js';
export { fetchWahapediaPageRaw } from '@/api/fetchWahapediaPageRaw.js';

// === Query Key Builders ===
export { buildQueryWahapediaKey } from '@/queries/queryWahapedia.js';
export { buildQueryWahapediaRawKey } from '@/queries/queryWahapediaRaw.js';

// === Query Options Builders ===
export { queryWahapedia } from '@/queries/queryWahapedia.js';
export { queryWahapediaRaw } from '@/queries/queryWahapediaRaw.js';
