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

/**
 * Validates that a URL string points to wahapedia.ru over HTTPS.
 *
 * Parses the input, verifies the hostname and protocol, and reconstructs
 * a sanitised URL string from validated components. Returns null if
 * validation fails.
 *
 * @param raw - The raw URL string to validate.
 * @returns A sanitised URL string built from validated components, or null if the URL is not allowed.
 */
function buildAllowedUrl(raw: string): string | null {
    let parsed: URL;

    try {
        parsed = new URL(raw);
    } catch {
        return null;
    }

    if (parsed.protocol !== 'https:') {
        return null;
    }

    if (parsed.hostname !== ALLOWED_HOST && !parsed.hostname.endsWith(`.${ALLOWED_HOST}`)) {
        return null;
    }

    // Reconstruct from validated components to break the taint chain.
    return `https://${parsed.hostname}${parsed.pathname}${parsed.search}`;
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

    const sanitisedUrl = buildAllowedUrl(url);

    if (!sanitisedUrl) {
        return Response.json({ error: `URL must point to ${ALLOWED_HOST} over HTTPS` }, { status: 403 });
    }

    try {
        const response = await fetch(sanitisedUrl, {
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
