import { revalidateTag } from 'next/cache';

/**
 * Cron route that checks BSData GitHub repository ETags and purges stale cache tags.
 *
 * @requirements
 * 1. Must only authorize requests with `Authorization: Bearer <CRON_SECRET>`.
 * 2. Must return HTTP 401 for missing/invalid authorization.
 * 3. Must query configured BSData repositories via GitHub contents API.
 * 4. Must send `If-None-Match` when an in-memory ETag exists for a repository path.
 * 5. Must treat non-304 responses as updates and refresh stored ETags.
 * 6. Must call `revalidateTag` for broad and repo-specific proxy cache tags when updates are detected.
 * 7. Must return JSON `{ updated: boolean, purgedTags: string[] }`.
 *
 * @module api/cron/check-bsdata-updates
 */

/** Runtime for cron checks requiring Node APIs. */
export const runtime = 'nodejs';

/** Maximum execution duration (seconds) for cron invocation. */
export const maxDuration = 60;

/** BSData repositories polled for upstream changes. */
const BSDATA_REPOS = [{ owner: 'BSData', repo: 'wh40k-10e', path: '' }] as const;

/** Broad cache tag for all GitHub proxy responses. */
const GITHUB_PROXY_TAG = 'github-proxy';

/** Per-route ETag memory for conditional GitHub checks within warm instances. */
const REPO_ETAGS = new Map<string, string>();

/**
 * Builds a stable repository key for ETag cache storage.
 *
 * @param owner - GitHub repository owner.
 * @param repo - GitHub repository name.
 * @param path - Optional contents path.
 * @returns Stable map key for ETag lookup.
 */
function buildRepoKey(owner: string, repo: string, path: string): string {
    return `${owner}/${repo}:${path}`;
}

/**
 * Builds target cache tags for API and raw proxy paths for a repository.
 *
 * @param owner - GitHub repository owner.
 * @param repo - GitHub repository name.
 * @returns Cache tags that should be purged after updates.
 */
function buildRepoTags(owner: string, repo: string): string[] {
    return [GITHUB_PROXY_TAG, `github-api-${owner}-${repo}`, `github-raw-${owner}-${repo}`];
}

/**
 * Validates the cron Authorization header against CRON_SECRET.
 *
 * @param request - Incoming cron request.
 * @returns True when auth header matches configured secret.
 */
function isAuthorized(request: Request): boolean {
    const secret = process.env['CRON_SECRET'];

    if (!secret) {
        return false;
    }

    const expected = `Bearer ${secret}`;
    const actual = request.headers.get('authorization');

    return actual === expected;
}

/**
 * Checks one BSData repository contents endpoint and updates stored ETag.
 *
 * @param owner - GitHub repository owner.
 * @param repo - GitHub repository name.
 * @param path - GitHub contents path.
 * @returns True when upstream content has changed since the last check.
 */
async function checkRepositoryUpdate(owner: string, repo: string, path: string): Promise<boolean> {
    const key = buildRepoKey(owner, repo, path);
    const cachedEtag = REPO_ETAGS.get(key);
    const token = process.env['GITHUB_TOKEN'];
    const safePath = path.length > 0 ? `/${path}` : '';
    const url = new URL(`https://api.github.com/repos/${owner}/${repo}/contents${safePath}`);
    const headers = new Headers({
        'User-Agent': 'Armoury/1.0 (Community Tool)',
        Accept: 'application/vnd.github.v3+json',
    });

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    if (cachedEtag) {
        headers.set('If-None-Match', cachedEtag);
    }

    const response = await fetch(url, { headers });
    const currentEtag = response.headers.get('etag');

    if (currentEtag) {
        REPO_ETAGS.set(key, currentEtag);
    }

    return response.status !== 304;
}

/**
 * GET handler for scheduled BSData update checks.
 *
 * @param request - Incoming cron request from Vercel Cron.
 * @returns JSON response indicating whether cache tags were purged.
 */
export async function GET(request: Request): Promise<Response> {
    if (!isAuthorized(request)) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const purgedTags = new Set<string>();

    for (const repo of BSDATA_REPOS) {
        const hasUpdate = await checkRepositoryUpdate(repo.owner, repo.repo, repo.path);

        if (!hasUpdate) {
            continue;
        }

        const tags = buildRepoTags(repo.owner, repo.repo);

        for (const tag of tags) {
            revalidateTag(tag);
            purgedTags.add(tag);
        }
    }

    return Response.json({
        updated: purgedTags.size > 0,
        purgedTags: [...purgedTags],
    });
}
