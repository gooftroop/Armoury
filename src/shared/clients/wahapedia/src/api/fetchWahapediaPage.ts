import { fetchWahapediaPageRaw } from '@/api/fetchWahapediaPageRaw.js';
import type { IWahapediaParser } from '@/types.js';

/**
 * @requirements
 * - Provide a function-based Wahapedia fetch API without class state.
 * - Parse fetched HTML via the provided parser contract.
 */

/**
 * Fetches and parses a Wahapedia page into typed data.
 *
 * @template T - Parsed result type.
 * @param url - The Wahapedia URL to fetch.
 * @param parser - Parser that converts raw HTML into typed data.
 * @param customFetch - Optional fetch implementation for tests.
 * @returns Promise resolving to parsed data.
 * @throws Error if fetching or parsing fails.
 */
export async function fetchWahapediaPage<T>(
    url: string,
    parser: IWahapediaParser<T>,
    customFetch?: typeof fetch,
): Promise<T> {
    const html = await fetchWahapediaPageRaw(url, customFetch);

    return parser.parse(html);
}
