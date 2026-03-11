import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GitHubClient, createGitHubClient } from './../client.ts';
import { BASE_DELAY_MS, DEFAULT_USER_AGENT, GITHUB_API_BASE_URL, GITHUB_RAW_BASE_URL } from './../config.ts';
import { createAuthHeaders } from './../utils.ts';
import { GitHubApiError, NetworkError, RateLimitError } from './../types.ts';

describe('GitHubClient', () => {
    const originalFetch = globalThis.fetch;
    let fetchCalls: Array<[string, RequestInit | undefined]> = [];
    let fetchResponse: Response | Error = new Response('{}', { status: 200 });

    const setFetchResponse = (response: Response | Error) => {
        fetchResponse = response;
    };

    beforeEach(() => {
        fetchCalls = [];
        fetchResponse = new Response('{}', { status: 200 });

        globalThis.fetch = ((url: string, init?: RequestInit) => {
            fetchCalls.push([url, init]);

            if (fetchResponse instanceof Error) {
                return Promise.reject(fetchResponse);
            }

            return Promise.resolve(fetchResponse.clone());
        }) as typeof fetch;
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        vi.restoreAllMocks();
    });

    describe('listFiles', () => {
        it('returns array of file info', async () => {
            const files = [
                {
                    name: 'file1.cat',
                    path: 'file1.cat',
                    sha: 'abc',
                    size: 100,
                    download_url: 'http://...',
                    type: 'file',
                },
                {
                    name: 'file2.cat',
                    path: 'file2.cat',
                    sha: 'def',
                    size: 200,
                    download_url: 'http://...',
                    type: 'file',
                },
            ];
            setFetchResponse(new Response(JSON.stringify(files), { status: 200 }));

            const client = new GitHubClient();
            const result = await client.listFiles('BSData', 'wh40k-10e', 'data');

            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('file1.cat');
            expect(result[0].sha).toBe('abc');
            expect(fetchCalls[0][0]).toBe(`${GITHUB_API_BASE_URL}/repos/BSData/wh40k-10e/contents/data`);
        });

        it('throws GitHubApiError for non-array response', async () => {
            setFetchResponse(new Response(JSON.stringify({ name: 'single' }), { status: 200 }));

            const client = new GitHubClient();
            await expect(client.listFiles('BSData', 'wh40k-10e', '')).rejects.toThrow(GitHubApiError);
        });
    });

    describe('getFileSha', () => {
        it('returns SHA for a file and caches it', async () => {
            const file = {
                name: 'test.cat',
                path: 'test.cat',
                sha: 'sha123',
                size: 100,
                download_url: null,
                type: 'file',
            };
            setFetchResponse(new Response(JSON.stringify(file), { status: 200 }));

            const client = new GitHubClient();
            const sha = await client.getFileSha('BSData', 'wh40k-10e', 'test.cat');

            expect(sha).toBe('sha123');
        });

        it('throws for directory response', async () => {
            setFetchResponse(new Response(JSON.stringify([{ name: 'dir' }]), { status: 200 }));

            const client = new GitHubClient();
            await expect(client.getFileSha('BSData', 'wh40k-10e', 'somedir')).rejects.toThrow(GitHubApiError);
        });
    });

    describe('downloadFile', () => {
        it('downloads raw file content without API headers', async () => {
            const content = '<catalogue>test</catalogue>';
            setFetchResponse(new Response(content, { status: 200 }));

            const client = new GitHubClient({ token: 'token-1' });
            const result = await client.downloadFile('BSData', 'wh40k-10e', 'test.cat');

            expect(result).toBe(content);
            expect(fetchCalls[0][0]).toBe(`${GITHUB_RAW_BASE_URL}/BSData/wh40k-10e/main/test.cat`);
            const headers = fetchCalls[0][1]?.headers as Record<string, string>;
            expect(headers['Accept']).toBeUndefined();
            expect(headers['Authorization']).toBe('Bearer token-1');
        });
    });

    describe('checkForUpdates', () => {
        it('returns true when SHA differs', async () => {
            const file = { sha: 'newsha' };
            setFetchResponse(new Response(JSON.stringify(file), { status: 200 }));

            const client = new GitHubClient();
            const hasUpdates = await client.checkForUpdates('BSData', 'wh40k-10e', 'test.cat', 'oldsha');

            expect(hasUpdates).toBe(true);
        });

        it('returns false when SHA matches', async () => {
            const file = { sha: 'samesha' };
            setFetchResponse(new Response(JSON.stringify(file), { status: 200 }));

            const client = new GitHubClient();
            const hasUpdates = await client.checkForUpdates('BSData', 'wh40k-10e', 'test.cat', 'samesha');

            expect(hasUpdates).toBe(false);
        });

        it('returns false on 304 Not Modified without cached SHA', async () => {
            setFetchResponse(new Response(null, { status: 304 }));

            const client = new GitHubClient();
            const hasUpdates = await client.checkForUpdates('BSData', 'wh40k-10e', 'test.cat', 'knownsha');

            expect(hasUpdates).toBe(false);
        });

        it('returns true on 304 when cached SHA differs', async () => {
            const file = { sha: 'cachedsha' };
            setFetchResponse(new Response(JSON.stringify(file), { status: 200 }));

            const client = new GitHubClient();
            await client.getFileSha('BSData', 'wh40k-10e', 'test.cat');

            setFetchResponse(new Response(null, { status: 304 }));
            const hasUpdates = await client.checkForUpdates('BSData', 'wh40k-10e', 'test.cat', 'oldsha');

            expect(hasUpdates).toBe(true);
        });

        it('includes If-None-Match when ETag cached', async () => {
            const headers = new Headers({ etag: 'etag-1' });
            setFetchResponse(
                new Response(
                    JSON.stringify({ sha: 'initial', name: 'f', path: 'f', size: 0, download_url: null, type: 'file' }),
                    { status: 200, headers },
                ),
            );

            const client = new GitHubClient();
            await client.getFileSha('BSData', 'wh40k-10e', 'data');

            setFetchResponse(new Response(null, { status: 304 }));
            await client.checkForUpdates('BSData', 'wh40k-10e', 'data', 'initial');

            const requestHeaders = fetchCalls[1][1]?.headers as Record<string, string>;
            expect(requestHeaders['If-None-Match']).toBe('etag-1');
        });
    });

    describe('rate limit handling', () => {
        it('throws RateLimitError on 429 after retries', async () => {
            vi.spyOn(globalThis, 'setTimeout').mockImplementation((handler: TimerHandler) => {
                if (typeof handler === 'function') {
                    handler();
                }

                return 0 as unknown as NodeJS.Timeout;
            });

            const headers = new Headers({
                'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 60),
                'retry-after': '1',
            });
            setFetchResponse(new Response('Rate limited', { status: 429, headers }));

            const client = new GitHubClient();
            await expect(client.listFiles('BSData', 'wh40k-10e', '')).rejects.toThrow(RateLimitError);
            expect(fetchCalls).toHaveLength(3);
        });

        it('throws RateLimitError when x-ratelimit-remaining is 0', async () => {
            const headers = new Headers({
                'x-ratelimit-remaining': '0',
                'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 60),
            });
            setFetchResponse(new Response(JSON.stringify([]), { status: 200, headers }));

            const client = new GitHubClient();
            await expect(client.listFiles('BSData', 'wh40k-10e', '')).rejects.toThrow(RateLimitError);
        });
    });

    describe('error handling', () => {
        it('throws GitHubApiError for 404', async () => {
            setFetchResponse(new Response('Not found', { status: 404, statusText: 'Not Found' }));

            const client = new GitHubClient();
            await expect(client.listFiles('BSData', 'nonexistent', '')).rejects.toThrow(GitHubApiError);
        });

        it('throws NetworkError on fetch failure', async () => {
            vi.spyOn(globalThis, 'setTimeout').mockImplementation((handler: TimerHandler) => {
                if (typeof handler === 'function') {
                    handler();
                }

                return 0 as unknown as NodeJS.Timeout;
            });

            setFetchResponse(new Error('Network error'));

            const client = new GitHubClient();
            await expect(client.listFiles('BSData', 'wh40k-10e', '')).rejects.toThrow(NetworkError);
            expect(fetchCalls).toHaveLength(3);
        });

        it('throws NetworkError for checkForUpdates on fetch failure', async () => {
            setFetchResponse(new Error('Network error'));

            const client = new GitHubClient();
            await expect(client.checkForUpdates('BSData', 'wh40k-10e', 'test.cat', 'sha')).rejects.toThrow(
                NetworkError,
            );
        });
    });

    describe('retry backoff', () => {
        it('applies exponential delays between retries', async () => {
            const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout').mockImplementation((handler: TimerHandler) => {
                if (typeof handler === 'function') {
                    handler();
                }

                return 0 as unknown as NodeJS.Timeout;
            });

            setFetchResponse(new Error('Network error'));

            const client = new GitHubClient();
            await expect(client.listFiles('BSData', 'wh40k-10e', '')).rejects.toThrow(NetworkError);

            expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), BASE_DELAY_MS);
            expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), BASE_DELAY_MS * 2);
        });
    });

    describe('authentication and headers', () => {
        it('includes Authorization header when token provided', async () => {
            setFetchResponse(new Response(JSON.stringify([]), { status: 200 }));

            const client = new GitHubClient({ token: 'test-token' });
            await client.listFiles('BSData', 'wh40k-10e', '');

            const headers = fetchCalls[0][1]?.headers as Record<string, string>;
            expect(headers['Authorization']).toBe('Bearer test-token');
        });

        it('uses default User-Agent when none provided', async () => {
            setFetchResponse(new Response(JSON.stringify([]), { status: 200 }));

            const client = new GitHubClient();
            await client.listFiles('BSData', 'wh40k-10e', '');

            const headers = fetchCalls[0][1]?.headers as Record<string, string>;
            expect(headers['User-Agent']).toBe(DEFAULT_USER_AGENT);
        });
    });

    describe('createGitHubClient factory', () => {
        it('creates GitHubClient instance', () => {
            const client = createGitHubClient({ userAgent: 'TestAgent' });
            expect(client).toBeInstanceOf(GitHubClient);
        });
    });
});

describe('createAuthHeaders', () => {
    it('creates API headers with user agent and accept', () => {
        const headers = createAuthHeaders('Agent/1.0');

        expect(headers).toEqual({
            'User-Agent': 'Agent/1.0',
            Accept: 'application/vnd.github.v3+json',
        });
    });

    it('includes authorization header when token provided', () => {
        const headers = createAuthHeaders('Agent/1.0', 'token');

        expect(headers).toEqual({
            'User-Agent': 'Agent/1.0',
            Accept: 'application/vnd.github.v3+json',
            Authorization: 'Bearer token',
        });
    });

    it('omits accept header for raw content requests', () => {
        const headers = createAuthHeaders('Agent/1.0', undefined, false);

        expect(headers).toEqual({
            'User-Agent': 'Agent/1.0',
        });
    });
});
