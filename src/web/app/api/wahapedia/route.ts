/**
 * Wahapedia proxy API route.
 *
 * Forwards requests to wahapedia.ru server-side to bypass browser CORS restrictions.
 * The browser cannot fetch wahapedia.ru directly because it does not set Access-Control-Allow-Origin.
 * This route acts as a same-origin proxy: browser → Next.js API → wahapedia.ru → response.
 *
 * @requirements
 * 1. Must accept POST requests with a JSON body containing a `url` string.
 * 2. Must forward the request server-side to the given URL with a User-Agent header.
 * 3. Must return the HTML content as text/html on success.
 * 4. Must return a JSON error with appropriate HTTP status on failure.
 * 5. Must reject requests where the URL does not point to wahapedia.ru.
 *
 * @module api/wahapedia
 */

/** User-Agent header sent with all proxied requests. */
const USER_AGENT = 'Armoury/1.0 (Community Tool)';

/** Allowed hostname for proxied requests. */
const ALLOWED_HOST = 'wahapedia.ru';

/** Hardcoded origin used to construct fetch URLs, breaking the SSRF taint chain. */
const ALLOWED_ORIGIN = `https://${ALLOWED_HOST}`;

/**
 * Validates that a URL string points to wahapedia.ru over HTTPS and
 * reconstructs a sanitised URL using only hardcoded and encoded components.
 *
 * The key security property: each path segment is passed through
 * `encodeURIComponent` (a CodeQL-recognised sanitiser that escapes `/`
 * to `%2F`, preventing path-traversal) and search parameters are rebuilt
 * via `URLSearchParams`. The returned URL is constructed from the
 * hardcoded `ALLOWED_ORIGIN` constant — no tainted string ever reaches
 * the `URL` constructor or `fetch`.
 *
 * @param raw - The raw URL string to validate.
 * @returns A fully sanitised `URL` with hardcoded origin, or `null` if the URL is not allowed.
 */
function buildSanitisedUrl(raw: string): URL | null {
    let parsed: URL;

    try {
        parsed = new URL(raw);
    } catch {
        return null;
    }

    if (parsed.protocol !== 'https:') {
        return null;
    }

    if (parsed.hostname !== ALLOWED_HOST) {
        return null;
    }

    // Rebuild path from scratch: split into segments, encode each one
    // (encodeURIComponent is a CodeQL-recognised taint sanitiser), then rejoin.
    const safePath = parsed.pathname
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/');

    // Rebuild query string from scratch via encodeURIComponent on each
    // key/value pair to break the taint chain for CodeQL.
    const pairs: string[] = [];

    for (const [key, value] of parsed.searchParams) {
        pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }

    // Construct URL from hardcoded origin + sanitised components.
    const target = new URL(safePath, ALLOWED_ORIGIN);
    target.search = pairs.length > 0 ? pairs.join('&') : '';

    return target;
}

/**
 * POST handler for the Wahapedia proxy route.
 *
 * Accepts a JSON body with `{ url: string }`, fetches the URL server-side,
 * and returns the HTML content. Rejects URLs not pointing to wahapedia.ru.
 *
 * @param request - The incoming HTTP request.
 * @returns The proxied HTML response or a JSON error.
 */
export async function POST(request: Request): Promise<Response> {
    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { url } = body as { url?: string };

    if (!url || typeof url !== 'string') {
        return Response.json({ error: 'Missing required field: url' }, { status: 400 });
    }

    const targetUrl = buildSanitisedUrl(url);

    if (!targetUrl) {
        return Response.json({ error: `URL must point to ${ALLOWED_HOST} over HTTPS` }, { status: 403 });
    }

    try {
        const response = await fetch(targetUrl, {
            headers: { 'User-Agent': USER_AGENT },
        });

        if (!response.ok) {
            return Response.json(
                { error: `Upstream HTTP ${response.status} ${response.statusText}` },
                { status: response.status },
            );
        }

        const html = await response.text();

        return new Response(html, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown proxy error';

        return Response.json({ error: message }, { status: 502 });
    }
}
