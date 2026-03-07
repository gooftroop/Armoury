import type { IWahapediaClient, IWahapediaParser } from '@clients-wahapedia/types.js';

/**
 * Mock Wahapedia client for testing.
 * Implements the IWahapediaClient interface using in-memory storage for HTML responses.
 * Supports controllable failure modes and response data for testing error handling.
 */
class MockWahapediaClient implements IWahapediaClient {
    /** HTML content to return from fetchRaw() */
    chapterApprovedHtml = '';
    /** Whether fetch operations should throw errors */
    shouldFail = false;
    /** URLs that were fetched via fetchRaw() */
    fetchedUrls: string[] = [];

    /**
     * Fetches a URL and transforms the content using the provided parser.
     * @param url - The Wahapedia URL to fetch
     * @param parser - The parser instance to transform HTML into typed data
     * @returns Promise resolving to the parsed data
     * @throws Error if shouldFail is true
     */
    async fetch<T>(url: string, parser: IWahapediaParser<T>): Promise<T> {
        const html = await this.fetchRaw(url);

        return parser.parse(html);
    }

    /**
     * Fetches raw HTML content from a URL.
     * @param url - The Wahapedia URL to fetch
     * @returns Promise resolving to the configured chapterApprovedHtml
     * @throws Error if shouldFail is true
     */
    async fetchRaw(url: string): Promise<string> {
        this.fetchedUrls.push(url);

        if (this.shouldFail) {
            throw new Error(`Mock fetch failed for URL: ${url}`);
        }

        return this.chapterApprovedHtml;
    }
}

export { MockWahapediaClient };
