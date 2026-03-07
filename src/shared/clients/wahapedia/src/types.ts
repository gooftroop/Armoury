/**
 * Parser that transforms raw HTML content into typed data.
 *
 * Implementations of this interface are responsible for parsing HTML strings
 * (typically fetched from Wahapedia) and converting them into structured, typed data models.
 * Each parser is specific to a particular data type or page structure.
 *
 * @template T - The type of data this parser produces
 */
export interface IWahapediaParser<T> {
    /**
     * Parses HTML string into structured data.
     *
     * @param html - Raw HTML content to parse
     * @returns Parsed and typed data extracted from the HTML
     * @throws Error if the HTML structure is invalid or required data is missing
     */
    parse(html: string): T;
}

/**
 * Client for fetching content from Wahapedia.
 *
 * Provides methods to fetch HTML content from Wahapedia URLs and automatically
 * transform it into typed data using parser implementations. Handles HTTP errors,
 * retries with exponential backoff, and includes appropriate User-Agent headers
 * to identify the Armoury tool when making requests.
 *
 * All fetching operations use the global fetch API and include retry logic
 * (2 retries with 1 second delay) to handle transient network failures.
 */
export interface IWahapediaClient {
    /**
     * Fetches a URL and transforms the content using the provided parser.
     *
     * Makes an HTTP GET request to the specified URL, retrieves the HTML content,
     * and passes it to the parser's parse() method to produce typed data.
     *
     * @template T - The type of data produced by the parser
     * @param url - The Wahapedia URL to fetch
     * @param parser - The parser instance to transform HTML into typed data
     * @returns Promise resolving to the parsed data
     * @throws Error if the HTTP request fails after retries or if parsing fails
     */
    fetch<T>(url: string, parser: IWahapediaParser<T>): Promise<T>;

    /**
     * Fetches raw HTML content from a URL.
     *
     * Makes an HTTP GET request to the specified URL and returns the response body as a string.
     * Useful when you need the raw HTML for custom processing or debugging.
     *
     * @param url - The Wahapedia URL to fetch
     * @returns Promise resolving to the raw HTML content
     * @throws Error if the HTTP request fails after retries
     */
    fetchRaw(url: string): Promise<string>;
}
