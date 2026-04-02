import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '#/app/api/cron/check-bsdata-updates/route.js';

const { revalidateTagMock } = vi.hoisted(() => ({
    revalidateTagMock: vi.fn<(tag: string) => void>(),
}));

vi.mock('next/cache', () => ({
    revalidateTag: revalidateTagMock,
}));

/**
 * Tests for cron-based BSData update checks and cache-tag purging.
 *
 * @requirements
 * 1. Must return 401 when Authorization header is missing or invalid.
 * 2. Must return `{ updated: false, purgedTags: [] }` when GitHub returns 304.
 * 3. Must return `{ updated: true, purgedTags: [...] }` when GitHub content changes.
 * 4. Must call `revalidateTag` for broad and repo-specific tags on updates.
 */

function makeRequest(authorization?: string): Request {
    const headers = new Headers();

    if (authorization) {
        headers.set('authorization', authorization);
    }

    return new Request('https://armoury.test/api/cron/check-bsdata-updates', {
        method: 'GET',
        headers,
    });
}

describe('GET /api/cron/check-bsdata-updates', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
        process.env['CRON_SECRET'] = 'test-secret';
    });

    it('returns 401 for missing authorization header', async () => {
        const response = await GET(makeRequest());

        expect(response.status).toBe(401);
    });

    it('returns 401 for invalid authorization header', async () => {
        const response = await GET(makeRequest('Bearer wrong-secret'));

        expect(response.status).toBe(401);
    });

    it('returns updated false and empty purgedTags when upstream responds 304', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(null, {
                status: 304,
                headers: { etag: '"etag-1"' },
            }),
        );

        const response = await GET(makeRequest('Bearer test-secret'));
        const payload = (await response.json()) as { updated: boolean; purgedTags: string[] };

        expect(response.status).toBe(200);
        expect(payload).toEqual({ updated: false, purgedTags: [] });
        expect(revalidateTagMock).not.toHaveBeenCalled();
    });

    it('returns updated true and purges repo tags when upstream changes', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response('[]', {
                status: 200,
                headers: { etag: '"etag-2"' },
            }),
        );

        const response = await GET(makeRequest('Bearer test-secret'));
        const payload = (await response.json()) as { updated: boolean; purgedTags: string[] };

        expect(response.status).toBe(200);
        expect(payload.updated).toBe(true);
        expect(payload.purgedTags).toEqual([
            'github-proxy',
            'github-api-BSData-wh40k-10e',
            'github-raw-BSData-wh40k-10e',
        ]);
        expect(revalidateTagMock).toHaveBeenCalledTimes(3);
        expect(revalidateTagMock).toHaveBeenCalledWith('github-proxy');
        expect(revalidateTagMock).toHaveBeenCalledWith('github-api-BSData-wh40k-10e');
        expect(revalidateTagMock).toHaveBeenCalledWith('github-raw-BSData-wh40k-10e');
    });
});
