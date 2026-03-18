/**
 * @requirements
 * - Extract raw fetch and retry logic from the legacy class-based client.
 * - Include User-Agent header on all requests.
 * - Retry failed requests with exponential backoff before throwing.
 */

/**
 * Maximum number of retry attempts for failed requests.
 */
const MAX_RETRIES = 3;

/**
 * Base delay in milliseconds between retry attempts.
 */
const BASE_DELAY_MS = 1000;

/**
 * User-Agent header sent with all Wahapedia requests.
 */
const USER_AGENT = 'Armoury/1.0 (Community Tool)';

/**
 * Delays execution for a given number of milliseconds.
 *
 * @param ms - Duration of the delay in milliseconds.
 * @returns Promise that resolves after the delay.
 */
function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches a URL with retry logic and exponential backoff.
 *
 * @param url - Target URL to fetch.
 * @param customFetch - Optional fetch implementation for tests.
 * @returns A successful HTTP response.
 * @throws Error when all retry attempts are exhausted.
 */
async function fetchWithRetry(url: string, customFetch?: typeof fetch): Promise<Response> {
    let lastError: Error | undefined;
    const fetchFn = customFetch ?? fetch;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const response = await fetchFn(url, {
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
                await delay(backoffMs);
            }
        }
    }

    throw new Error(`Request failed after ${MAX_RETRIES} retries: ${lastError?.message ?? 'Unknown error'}`);
}

/**
 * Fetches raw HTML content from a Wahapedia URL.
 *
 * @param url - The Wahapedia URL to fetch.
 * @param customFetch - Optional fetch implementation for tests.
 * @returns Promise resolving to the raw HTML response body.
 * @throws Error if the request fails after retries.
 */
export async function fetchWahapediaPageRaw(url: string, customFetch?: typeof fetch): Promise<string> {
    const response = await fetchWithRetry(url, customFetch);

    return response.text();
}
