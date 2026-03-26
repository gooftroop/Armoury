import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

import { GET, buildCacheHeaders } from '#/app/api/github/[...path]/route.js';

/**
 * Tests for GitHub proxy CDN cache headers and tag behavior.
 *
 * @requirements
 * 1. Must apply all cache control headers to successful 200 responses.
 * 2. Must apply all cache control headers to successful 304 responses.
 * 3. Must include Vercel cache tags derived from api/raw repository path patterns.
 * 4. Must not apply cache headers to invalid-path (400) errors.
 * 5. Must not apply cache headers to upstream/network error (502) responses.
 * 6. Must expose buildCacheHeaders behavior for direct unit testing.
 */

const CACHE_CONTROL_VALUE = 'public, s-maxage=30, stale-while-revalidate=60';
const CDN_CACHE_CONTROL_VALUE = 'public, s-maxage=300, stale-while-revalidate=600';
const VERCEL_CDN_CACHE_CONTROL_VALUE = 'public, s-maxage=3600, stale-while-revalidate=86400';

function makeRequest(url = 'https://armoury.test/api/github/api/repos/BSData/wh40k-10e/contents'): NextRequest {
    return new NextRequest(url, { method: 'GET' });
}

function makeParams(path: string[]): Promise<{ path: string[] }> {
    return Promise.resolve({ path });
}

describe('github proxy cache headers', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('applies cache headers and api cache tags on successful 200 response', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response('ok', {
                status: 200,
                headers: {
                    'content-type': 'application/json',
                    etag: '"abc"',
                },
            }),
        );

        const response = await GET(makeRequest(), {
            params: makeParams(['api', 'repos', 'BSData', 'wh40k-10e', 'contents']),
        });

        expect(response.status).toBe(200);
        expect(response.headers.get('Cache-Control')).toBe(CACHE_CONTROL_VALUE);
        expect(response.headers.get('CDN-Cache-Control')).toBe(CDN_CACHE_CONTROL_VALUE);
        expect(response.headers.get('Vercel-CDN-Cache-Control')).toBe(VERCEL_CDN_CACHE_CONTROL_VALUE);
        expect(response.headers.get('Vercel-Cache-Tag')).toContain('github-proxy');
        expect(response.headers.get('Vercel-Cache-Tag')).toContain('github-api-BSData-wh40k-10e');
    });

    it('applies cache headers and raw cache tags on successful 304 response', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(null, {
                status: 304,
                headers: {
                    etag: '"etag"',
                },
            }),
        );

        const response = await GET(makeRequest(), {
            params: makeParams(['raw', 'BSData', 'wh40k-10e', 'main', 'index.bsi']),
        });

        expect(response.status).toBe(304);
        expect(response.headers.get('Cache-Control')).toBe(CACHE_CONTROL_VALUE);
        expect(response.headers.get('CDN-Cache-Control')).toBe(CDN_CACHE_CONTROL_VALUE);
        expect(response.headers.get('Vercel-CDN-Cache-Control')).toBe(VERCEL_CDN_CACHE_CONTROL_VALUE);
        expect(response.headers.get('Vercel-Cache-Tag')).toContain('github-proxy');
        expect(response.headers.get('Vercel-Cache-Tag')).toContain('github-raw-BSData-wh40k-10e');
    });

    it('does not apply cache headers on invalid path 400 response', async () => {
        const response = await GET(makeRequest(), {
            params: makeParams(['invalid']),
        });

        expect(response.status).toBe(400);
        expect(response.headers.get('Cache-Control')).toBeNull();
        expect(response.headers.get('CDN-Cache-Control')).toBeNull();
        expect(response.headers.get('Vercel-CDN-Cache-Control')).toBeNull();
        expect(response.headers.get('Vercel-Cache-Tag')).toBeNull();
    });

    it('does not apply cache headers on upstream network error 502 response', async () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('boom'));

        const response = await GET(makeRequest(), {
            params: makeParams(['api', 'repos', 'BSData', 'wh40k-10e', 'contents']),
        });

        expect(response.status).toBe(502);
        expect(response.headers.get('Cache-Control')).toBeNull();
        expect(response.headers.get('CDN-Cache-Control')).toBeNull();
        expect(response.headers.get('Vercel-CDN-Cache-Control')).toBeNull();
        expect(response.headers.get('Vercel-Cache-Tag')).toBeNull();
    });
});

describe('buildCacheHeaders', () => {
    it('returns broad plus api repo tag for api path pattern', () => {
        const headers = buildCacheHeaders(['api', 'repos', 'BSData', 'wh40k-10e', 'contents']);

        expect(headers.get('Vercel-Cache-Tag')).toBe('github-proxy,github-api-BSData-wh40k-10e');
    });

    it('returns broad plus raw repo tag for raw path pattern', () => {
        const headers = buildCacheHeaders(['raw', 'BSData', 'wh40k-10e', 'main', 'index.bsi']);

        expect(headers.get('Vercel-Cache-Tag')).toBe('github-proxy,github-raw-BSData-wh40k-10e');
    });

    it('returns only broad tag for unknown path pattern', () => {
        const headers = buildCacheHeaders(['api', 'users', 'octocat']);

        expect(headers.get('Vercel-Cache-Tag')).toBe('github-proxy');
    });
});
