import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fetchWahapediaPage } from '@/api/fetchWahapediaPage.js';
import { fetchWahapediaPageRaw } from '@/api/fetchWahapediaPageRaw.js';
import type { IWahapediaParser } from '@/types.js';

describe('fetchWahapediaPageRaw', () => {
    const originalFetch = globalThis.fetch;
    let fetchCalls: Array<[string, RequestInit | undefined]> = [];
    let fetchResponse: Response | Error = new Response('<html></html>', { status: 200 });

    const setFetchResponse = (response: Response | Error) => {
        fetchResponse = response;
    };

    beforeEach(() => {
        fetchCalls = [];
        fetchResponse = new Response('<html></html>', { status: 200 });

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
    });

    it('fetches raw HTML content', async () => {
        const html = '<html><body><h1>Chapter Approved</h1></body></html>';
        setFetchResponse(new Response(html, { status: 200 }));

        const result = await fetchWahapediaPageRaw('https://wahapedia.ru/wh40k10ed/the-rules/chapter-approved/');

        expect(result).toEqual({ content: html, lastModified: undefined });
        expect(fetchCalls).toHaveLength(1);
        expect(fetchCalls[0][0]).toBe('https://wahapedia.ru/wh40k10ed/the-rules/chapter-approved/');
    });

    it('returns ISO lastModified when Last-Modified header is present', async () => {
        const html = '<html><body>dated</body></html>';
        setFetchResponse(
            new Response(html, {
                status: 200,
                headers: {
                    'Last-Modified': 'Wed, 21 Oct 2015 07:28:00 GMT',
                },
            }),
        );

        const result = await fetchWahapediaPageRaw('https://wahapedia.ru/wh40k10ed/dated');

        expect(result).toEqual({
            content: html,
            lastModified: '2015-10-21T07:28:00.000Z',
        });
    });

    it('includes User-Agent header', async () => {
        setFetchResponse(new Response('<html></html>', { status: 200 }));

        await fetchWahapediaPageRaw('https://wahapedia.ru/wh40k10ed/test');

        const headers = fetchCalls[0][1]?.headers as Record<string, string>;
        expect(headers['User-Agent']).toBe('Armoury/1.0 (Community Tool)');
    });

    it('throws error on 404 HTTP status', async () => {
        setFetchResponse(new Response('Not found', { status: 404, statusText: 'Not Found' }));

        await expect(fetchWahapediaPageRaw('https://wahapedia.ru/nonexistent')).rejects.toThrow(
            'HTTP 404 Not Found for URL: https://wahapedia.ru/nonexistent',
        );
    });

    it('throws error on 500 HTTP status', async () => {
        setFetchResponse(new Response('Server error', { status: 500, statusText: 'Internal Server Error' }));

        await expect(fetchWahapediaPageRaw('https://wahapedia.ru/error')).rejects.toThrow(
            'HTTP 500 Internal Server Error for URL: https://wahapedia.ru/error',
        );
    });

    it('retries on network failure and eventually throws', async () => {
        setFetchResponse(new Error('Network error'));

        const promise = fetchWahapediaPageRaw('https://wahapedia.ru/test');

        await expect(promise).rejects.toThrow('Request failed after 3 retries: Network error');
        expect(fetchCalls).toHaveLength(3);
    }, 15000);

    it('accepts a custom fetch implementation', async () => {
        const html = '<html>custom</html>';
        const customFetch = vi.fn().mockResolvedValue(new Response(html, { status: 200 }));

        const result = await fetchWahapediaPageRaw('https://wahapedia.ru/test', customFetch as typeof fetch);

        expect(result).toEqual({ content: html, lastModified: undefined });
        expect(customFetch).toHaveBeenCalledOnce();
        // Global fetch should NOT have been called
        expect(fetchCalls).toHaveLength(0);
    });
});

describe('fetchWahapediaPage', () => {
    const originalFetch = globalThis.fetch;
    let fetchResponse: Response | Error = new Response('<html></html>', { status: 200 });

    const setFetchResponse = (response: Response | Error) => {
        fetchResponse = response;
    };

    beforeEach(() => {
        fetchResponse = new Response('<html></html>', { status: 200 });

        globalThis.fetch = ((_url: string, _init?: RequestInit) => {
            if (fetchResponse instanceof Error) {
                return Promise.reject(fetchResponse);
            }

            return Promise.resolve(fetchResponse.clone());
        }) as typeof fetch;
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    it('fetches and parses HTML content', async () => {
        const html = '<html><body><div class="data">Test Data</div></body></html>';
        setFetchResponse(new Response(html, { status: 200 }));

        const mockParser: IWahapediaParser<{ data: string }> = {
            parse: vi.fn((htmlContent: string) => {
                expect(htmlContent).toBe(html);

                return { data: 'parsed-data' };
            }),
        };

        const result = await fetchWahapediaPage('https://wahapedia.ru/wh40k10ed/test', mockParser);

        expect(result).toEqual({ data: 'parsed-data' });
        expect(mockParser.parse).toHaveBeenCalledOnce();
        expect(mockParser.parse).toHaveBeenCalledWith(html);
    });

    it('throws if parser fails', async () => {
        const html = '<html><body>Invalid</body></html>';
        setFetchResponse(new Response(html, { status: 200 }));

        const mockParser: IWahapediaParser<{ data: string }> = {
            parse: vi.fn(() => {
                throw new Error('Parse error: Invalid HTML structure');
            }),
        };

        await expect(fetchWahapediaPage('https://wahapedia.ru/wh40k10ed/test', mockParser)).rejects.toThrow(
            'Parse error: Invalid HTML structure',
        );
    });

    it('throws if fetch fails', async () => {
        setFetchResponse(new Response('Not found', { status: 404, statusText: 'Not Found' }));

        const mockParser: IWahapediaParser<{ data: string }> = {
            parse: vi.fn(),
        };

        await expect(fetchWahapediaPage('https://wahapedia.ru/nonexistent', mockParser)).rejects.toThrow('HTTP 404');
        expect(mockParser.parse).not.toHaveBeenCalled();
    }, 15000);
});
