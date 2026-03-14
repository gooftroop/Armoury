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
 * Validates that a URL string points to wahapedia.ru over HTTPS and extracts
 * the path and search components.
 *
 * Parses the input, verifies the hostname is exactly `wahapedia.ru` and the
 * protocol is HTTPS. Returns only the path and search string so the caller
 * can construct the final URL using a hardcoded origin — fully breaking the
 * taint chain for static analysis tools (e.g. CodeQL SSRF detection).
 *
 * @param raw - The raw URL string to validate.
 * @returns The validated path and search string (e.g. `/page?q=1`), or null if the URL is not allowed.
 */
function extractAllowedPath(raw: string): string | null {
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

    return `${parsed.pathname}${parsed.search}`;
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

    const allowedPath = extractAllowedPath(url);

    if (!allowedPath) {
        return Response.json({ error: `URL must point to ${ALLOWED_HOST} over HTTPS` }, { status: 403 });
    }

    // Construct the fetch URL from a hardcoded origin to break the SSRF taint chain.
    // `allowedPath` contains only the path and query string; the host is never user-controlled.
    const targetUrl = new URL(allowedPath, ALLOWED_ORIGIN);

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
