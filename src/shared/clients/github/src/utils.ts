/**
 * Creates HTTP headers for GitHub API requests.
 *
 * Constructs a HeadersInit object with the appropriate User-Agent, Accept, and Authorization headers.
 * The Accept header is only added for API requests (not for raw content downloads).
 * The Authorization header is only added if a token is provided.
 *
 * @param userAgent - The User-Agent string to send with the request (e.g., 'Armoury-DataLayer/1.0')
 * @param token - Optional GitHub personal access token. If provided, adds Bearer token authorization.
 * @param isApi - Whether this is an API request (true) or raw content request (false). Defaults to true.
 *                If true, adds 'Accept: application/vnd.github.v3+json' header.
 * @returns HeadersInit object ready to pass to fetch() options
 */
export function createAuthHeaders(userAgent: string, token?: string, isApi = true): HeadersInit {
    const headers: HeadersInit = { 'User-Agent': userAgent };

    if (isApi) {
        headers['Accept'] = 'application/vnd.github.v3+json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}
