import type { QueryClient } from '@tanstack/react-query';
import type { IWahapediaClient, IWahapediaParser } from '@armoury/clients-wahapedia';
import type { WahapediaFetchResult } from '@armoury/clients-wahapedia';
import { queryWahapedia, queryWahapediaRaw } from '@armoury/clients-wahapedia';

/**
 * @requirements
 * - Wrap wahapedia HTTP functions in a non-transient adapter using React Query for caching.
 * - Implement IWahapediaClient so consumers (e.g. ChapterApprovedDAO) use it transparently.
 * - Deduplicate concurrent requests via QueryClient.
 */

/**
 * Non-transient adapter for Wahapedia content that uses React Query for
 * request deduplication and caching.
 *
 * Wraps the standalone wahapedia fetch functions behind the `IWahapediaClient`
 * interface so that consumers (e.g. `ChapterApprovedDAO`) can use it as a
 * drop-in replacement while benefiting from QueryClient-level caching.
 */
export class WahapediaAdapter implements IWahapediaClient {
    private readonly queryClient: QueryClient;

    /**
     * Creates a WahapediaAdapter.
     *
     * @param queryClient - React Query client for request deduplication and caching.
     */
    constructor(queryClient: QueryClient) {
        this.queryClient = queryClient;
    }

    /**
     * Fetches a Wahapedia page and transforms the content using the provided parser.
     *
     * Uses React Query's `fetchQuery` for request deduplication and caching.
     *
     * @template T - The type of data produced by the parser.
     * @param url - The Wahapedia URL to fetch.
     * @param parser - Parser that converts HTML into typed data.
     * @returns Promise resolving to parsed data.
     * @throws Error if fetching or parsing fails.
     */
    async fetch<T>(url: string, parser: IWahapediaParser<T>): Promise<T> {
        return this.queryClient.fetchQuery(queryWahapedia(url, parser));
    }

    /**
     * Fetches raw HTML content from a Wahapedia URL.
     *
     * Uses React Query's `fetchQuery` for request deduplication and caching.
     *
     * @param url - The Wahapedia URL to fetch.
     * @returns Promise resolving to the raw HTML content.
     * @throws Error if fetching fails.
     */
    async fetchRaw(url: string): Promise<string> {
        const result = await this.queryClient.fetchQuery(queryWahapediaRaw(url));

        return this.extractContent(result);
    }

    /**
     * Extracts raw HTML content from either a string payload or structured fetch result.
     */
    private extractContent(result: string | WahapediaFetchResult): string {
        if (typeof result === 'string') {
            return result;
        }

        return result.content;
    }
}

/**
 * Creates a WahapediaAdapter backed by the given React Query client.
 *
 * @param queryClient - React Query client for request deduplication and caching.
 * @returns A new WahapediaAdapter instance.
 */
export function createWahapediaClient(queryClient: QueryClient): WahapediaAdapter {
    return new WahapediaAdapter(queryClient);
}
