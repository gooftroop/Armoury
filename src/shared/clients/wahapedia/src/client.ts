import type { IWahapediaClient, IWahapediaParser } from '@/types.js';

/**
 * Maximum number of retry attempts for failed requests.
 *
 * The client will attempt the request once, then retry up to MAX_RETRIES times
 * if the request fails due to network errors. HTTP errors (non-200 status) are
 * not retried beyond this count.
 */
const MAX_RETRIES = 3;

/**
 * Base delay in milliseconds between retry attempts.
 *
 * Used for exponential backoff calculation: delay = BASE_DELAY_MS * 2^attempt.
 * First retry after 1s, second after 2s, etc.
 */
const BASE_DELAY_MS = 1000;

/**
 * User-Agent header sent with all requests.
 *
 * Identifies the Armoury tool to Wahapedia servers. This helps Wahapedia
 * track which tools are accessing their data and allows them to contact
 * developers if there are issues.
 */
const USER_AGENT = 'Armoury/1.0 (Community Tool)';

/**
 * Client for fetching HTML content from Wahapedia.
 *
 * Provides HTTP GET operations with automatic retry logic and error handling.
 * All requests include a User-Agent header to identify the tool. Implements
 * exponential backoff for transient failures (network errors, timeouts).
 *
 * The client uses the global fetch API (available in Node 18+, browsers, and React Native)
 * and does not require any external HTTP libraries.
 *
 * Error handling:
 * - Non-200 HTTP responses throw an Error with the status code and URL
 * - Network failures are retried up to MAX_RETRIES times with exponential backoff
 * - After exhausting retries, throws an Error with the last failure reason
 */
export class WahapediaClient implements IWahapediaClient {
    private readonly fetchFn: typeof fetch;

    /**
     * Creates a new WahapediaClient instance.
     *
     * @param customFetch - Optional custom fetch function for testing. Defaults to global fetch.
     */
    constructor(customFetch?: typeof fetch) {
        this.fetchFn = customFetch ?? fetch;
    }

    /**
     * Fetches a URL and transforms the content using the provided parser.
     *
     * Makes an HTTP GET request to the specified URL, retrieves the HTML content,
     * and passes it to the parser's parse() method to produce typed data.
     * Uses fetchWithRetry internally for automatic error handling and retries.
     *
     * @template T - The type of data produced by the parser
     * @param url - The Wahapedia URL to fetch
     * @param parser - The parser instance to transform HTML into typed data
     * @returns Promise resolving to the parsed data
     * @throws Error if the HTTP request fails after retries or if parsing fails
     */
    async fetch<T>(url: string, parser: IWahapediaParser<T>): Promise<T> {
        const html = await this.fetchRaw(url);

        return parser.parse(html);
    }

    /**
     * Fetches raw HTML content from a URL.
     *
     * Makes an HTTP GET request to the specified URL and returns the response body as a string.
     * Uses fetchWithRetry internally for automatic error handling and retries.
     *
     * @param url - The Wahapedia URL to fetch
     * @returns Promise resolving to the raw HTML content
     * @throws Error if the HTTP request fails after retries
     */
    async fetchRaw(url: string): Promise<string> {
        const response = await this.fetchWithRetry(url);

        return response.text();
    }

    /**
     * Fetches a URL with automatic retry logic and exponential backoff.
     *
     * Attempts the request up to MAX_RETRIES times. On network errors, waits with
     * exponential backoff (BASE_DELAY_MS * 2^attempt). On HTTP errors (non-200 status),
     * throws immediately without retrying.
     *
     * @param url - The URL to fetch
     * @returns Promise resolving to the fetch Response object
     * @throws Error if the request fails after all retries or if HTTP status is not 200
     */
    private async fetchWithRetry(url: string): Promise<Response> {
        let lastError: Error | undefined;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const response = await this.fetchFn(url, {
                    headers: {
                        'User-Agent': USER_AGENT,
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status} ${response.statusText} for URL: ${url}`);
                }

                return response;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                if (attempt < MAX_RETRIES - 1) {
                    const backoffMs = BASE_DELAY_MS * Math.pow(2, attempt);
                    await this.delay(backoffMs);
                }
            }
        }

        throw new Error(`Request failed after ${MAX_RETRIES} retries: ${lastError?.message ?? 'Unknown error'}`);
    }

    /**
     * Delays execution for the specified number of milliseconds.
     *
     * Used to implement exponential backoff between retry attempts.
     *
     * @param ms - Number of milliseconds to delay
     * @returns Promise that resolves after the delay
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

/**
 * Factory function to create a new WahapediaClient instance.
 *
 * Provides a convenient way to instantiate a WahapediaClient.
 * This is the recommended way to create clients instead of calling the constructor directly.
 *
 * @param customFetch - Optional custom fetch function for testing. Defaults to global fetch.
 * @returns A new WahapediaClient instance
 */
export function createWahapediaClient(customFetch?: typeof fetch): WahapediaClient {
    return new WahapediaClient(customFetch);
}
