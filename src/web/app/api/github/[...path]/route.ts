/**
 * GitHub API proxy route.
 *
 * Forwards browser requests to GitHub's API and raw-content CDN server-side,
 * injecting a `GITHUB_TOKEN` for authenticated rate limits (5,000 req/hr
 * instead of the unauthenticated 60 req/hr).
 *
 * The catch-all `[...path]` segment determines the upstream target:
 * - `/api/github/api/repos/owner/repo/contents/...` → `api.github.com/repos/...`
 * - `/api/github/raw/owner/repo/main/...`            → `raw.githubusercontent.com/owner/...`
 *
 * @requirements
 * 1. Must accept GET requests only.
 * 2. Must route to api.github.com or raw.githubusercontent.com based on the first path segment.
 * 3. Must inject GITHUB_TOKEN as a Bearer token when present in the environment.
 * 4. Must reject requests whose path does not start with "api" or "raw".
 * 5. Must forward ETag, x-ratelimit-*, and cache-related headers from the upstream response.
 * 6. Must sanitise the path to prevent SSRF beyond the two allowed origins.
 * 7. Must return appropriate HTTP status codes on upstream errors.
 *
 * @module api/github/[...path]
 */

import type { NextRequest } from 'next/server';

/** User-Agent header sent with all proxied requests. */
const USER_AGENT = 'Armoury/1.0 (Community Tool)';

/**
 * Mapping from the first path segment to the upstream origin.
 * Only these two origins are reachable through the proxy.
 */
const UPSTREAM_ORIGINS: Record<string, string> = {
    api: 'https://api.github.com',
    raw: 'https://raw.githubusercontent.com',
};

/**
 * Response headers to forward from the GitHub upstream back to the browser.
 * Preserves caching semantics and rate-limit visibility for client-side retry logic.
 */
const FORWARDED_HEADERS = [
    'content-type',
    'etag',
    'last-modified',
    'cache-control',
    'x-ratelimit-limit',
    'x-ratelimit-remaining',
    'x-ratelimit-reset',
    'x-ratelimit-used',
    'x-ratelimit-resource',
    'retry-after',
];

/**
 * Builds the upstream GitHub URL from the catch-all path segments.
 *
 * The first segment selects the upstream origin ("api" or "raw"). The remaining
 * segments are individually encoded with `encodeURIComponent` — a
 * CodeQL-recognised taint sanitiser that escapes `/` to `%2F`, preventing
 * path traversal — then rejoined. The final URL is constructed from a
 * hardcoded origin constant, so no tainted string ever reaches `fetch`.
 *
 * @param pathSegments - The `[...path]` catch-all segments from the route.
 * @param searchParams - The request's query string (forwarded verbatim to upstream).
 * @returns A sanitised upstream URL, or `null` if the first segment is not an allowed origin.
 */
function buildUpstreamUrl(pathSegments: string[], searchParams: URLSearchParams): URL | null {
    if (pathSegments.length < 2) {
        return null;
    }

    const [prefix, ...rest] = pathSegments;
    const origin = UPSTREAM_ORIGINS[prefix!];

    if (!origin) {
        return null;
    }

    // Encode each segment individually to prevent path traversal,
    // then rejoin with '/' to form the upstream path.
    const safePath = rest.map((segment) => encodeURIComponent(segment)).join('/');

    const url = new URL(`/${safePath}`, origin);

    // Rebuild query string from scratch via encodeURIComponent on each
    // key/value pair to break the taint chain for CodeQL.
    const pairs: string[] = [];

    for (const [key, value] of searchParams) {
        pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }

    url.search = pairs.length > 0 ? pairs.join('&') : '';

    return url;
}

/**
 * Builds the request headers for the upstream GitHub request.
 *
 * Injects the `GITHUB_TOKEN` as a Bearer token when present. Sets the
 * `Accept` header for API requests (not raw content). Forwards the
 * `If-None-Match` header from the client for ETag-based conditional requests.
 *
 * @param isApi - Whether the target is api.github.com (true) or raw.githubusercontent.com (false).
 * @param clientHeaders - The incoming request headers from the browser.
 * @returns Headers to send to the upstream GitHub endpoint.
 */
function buildUpstreamHeaders(isApi: boolean, clientHeaders: Headers): HeadersInit {
    const headers: Record<string, string> = {
        'User-Agent': USER_AGENT,
    };

    if (isApi) {
        headers['Accept'] = 'application/vnd.github.v3+json';
    }

    const token = process.env['GITHUB_TOKEN'];

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Forward conditional request headers for ETag caching
    const ifNoneMatch = clientHeaders.get('if-none-match');

    if (ifNoneMatch) {
        headers['If-None-Match'] = ifNoneMatch;
    }

    return headers;
}

/**
 * Picks the subset of upstream response headers that should be forwarded
 * back to the browser (caching, rate-limit, and content-type headers).
 *
 * @param upstreamHeaders - Headers from the GitHub upstream response.
 * @returns A new Headers object containing only the allowed forwarded headers.
 */
function pickForwardedHeaders(upstreamHeaders: Headers): Headers {
    const headers = new Headers();

    for (const name of FORWARDED_HEADERS) {
        const value = upstreamHeaders.get(name);

        if (value) {
            headers.set(name, value);
        }
    }

    return headers;
}

/**
 * GET handler for the GitHub proxy route.
 *
 * Extracts the catch-all `[...path]` segments, builds a sanitised upstream URL,
 * fetches the resource with an injected auth token, and returns the response
 * with forwarded caching and rate-limit headers.
 *
 * @param request - The incoming Next.js request.
 * @param context - The route context containing the `path` catch-all params.
 * @returns The proxied GitHub response or a JSON error.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
    const { path: pathSegments } = await params;

    const upstreamUrl = buildUpstreamUrl(pathSegments, request.nextUrl.searchParams);

    if (!upstreamUrl) {
        return Response.json(
            { error: 'Invalid path. Expected /api/github/api/... or /api/github/raw/...' },
            { status: 400 },
        );
    }

    const isApi = pathSegments[0] === 'api';

    try {
        const response = await fetch(upstreamUrl, {
            headers: buildUpstreamHeaders(isApi, request.headers),
        });

        const forwardedHeaders = pickForwardedHeaders(response.headers);

        // 304 Not Modified: return as-is with forwarded headers (no body)
        if (response.status === 304) {
            return new Response(null, { status: 304, headers: forwardedHeaders });
        }

        // Forward upstream errors with the same status code
        if (!response.ok) {
            const errorBody = await response.text();

            return new Response(errorBody, {
                status: response.status,
                headers: forwardedHeaders,
            });
        }

        const body = await response.arrayBuffer();

        return new Response(body, {
            status: 200,
            headers: forwardedHeaders,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown proxy error';

        return Response.json({ error: message }, { status: 502 });
    }
}
