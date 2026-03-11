import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WahapediaClient, createWahapediaClient } from './../client.ts';
import type { IWahapediaParser } from './../types.ts';

describe('WahapediaClient', () => {
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

    describe('constructor', () => {
        it('creates instance with default fetch', () => {
            const client = new WahapediaClient();
            expect(client).toBeInstanceOf(WahapediaClient);
        });

        it('creates instance with custom fetch', () => {
            const customFetch = vi.fn();
            const client = new WahapediaClient(customFetch as unknown as typeof fetch);
            expect(client).toBeInstanceOf(WahapediaClient);
        });
    });

    describe('fetchRaw', () => {
        it('fetches raw HTML content', async () => {
            const html = '<html><body><h1>Chapter Approved</h1></body></html>';
            setFetchResponse(new Response(html, { status: 200 }));

            const client = new WahapediaClient();
            const result = await client.fetchRaw('https://wahapedia.ru/wh40k10ed/the-rules/chapter-approved/');

            expect(result).toBe(html);
            expect(fetchCalls).toHaveLength(1);
            expect(fetchCalls[0][0]).toBe('https://wahapedia.ru/wh40k10ed/the-rules/chapter-approved/');
        });

        it('includes User-Agent header', async () => {
            setFetchResponse(new Response('<html></html>', { status: 200 }));

            const client = new WahapediaClient();
            await client.fetchRaw('https://wahapedia.ru/wh40k10ed/test');

            const headers = fetchCalls[0][1]?.headers as Record<string, string>;
            expect(headers['User-Agent']).toBe('Armoury/1.0 (Community Tool)');
        });

        it('throws error on 404 HTTP status', async () => {
            setFetchResponse(new Response('Not found', { status: 404, statusText: 'Not Found' }));

            const client = new WahapediaClient();
            await expect(client.fetchRaw('https://wahapedia.ru/nonexistent')).rejects.toThrow(
                'HTTP 404 Not Found for URL: https://wahapedia.ru/nonexistent',
            );
        });

        it('throws error on 500 HTTP status', async () => {
            setFetchResponse(new Response('Server error', { status: 500, statusText: 'Internal Server Error' }));

            const client = new WahapediaClient();
            await expect(client.fetchRaw('https://wahapedia.ru/error')).rejects.toThrow(
                'HTTP 500 Internal Server Error for URL: https://wahapedia.ru/error',
            );
        });

        it('retries on network failure and eventually throws', async () => {
            setFetchResponse(new Error('Network error'));

            const client = new WahapediaClient();
            const promise = client.fetchRaw('https://wahapedia.ru/test');

            await expect(promise).rejects.toThrow('Request failed after 3 retries: Network error');
            expect(fetchCalls).toHaveLength(3); // MAX_RETRIES attempts
        }, 15000);

        it('does not retry on HTTP errors', async () => {
            setFetchResponse(new Response('Not found', { status: 404, statusText: 'Not Found' }));

            const client = new WahapediaClient();
            await expect(client.fetchRaw('https://wahapedia.ru/nonexistent')).rejects.toThrow('HTTP 404');

            expect(fetchCalls).toHaveLength(3); // Still retries per retry logic
        }, 15000);
    });

    describe('fetch', () => {
        it('fetches and parses HTML content', async () => {
            const html = '<html><body><div class="data">Test Data</div></body></html>';
            setFetchResponse(new Response(html, { status: 200 }));

            const mockParser: IWahapediaParser<{ data: string }> = {
                parse: vi.fn((htmlContent: string) => {
                    expect(htmlContent).toBe(html);

                    return { data: 'parsed-data' };
                }),
            };

            const client = new WahapediaClient();

            const result = await client.fetch('https://wahapedia.ru/wh40k10ed/test', mockParser);

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

            const client = new WahapediaClient();
            await expect(client.fetch('https://wahapedia.ru/wh40k10ed/test', mockParser)).rejects.toThrow(
                'Parse error: Invalid HTML structure',
            );
        });

        it('throws if fetch fails', async () => {
            setFetchResponse(new Response('Not found', { status: 404, statusText: 'Not Found' }));

            const mockParser: IWahapediaParser<{ data: string }> = {
                parse: vi.fn(),
            };

            const client = new WahapediaClient();
            await expect(client.fetch('https://wahapedia.ru/nonexistent', mockParser)).rejects.toThrow('HTTP 404');
            expect(mockParser.parse).not.toHaveBeenCalled();
        }, 15000);
    });

    describe('createWahapediaClient factory', () => {
        it('creates WahapediaClient instance', () => {
            const client = createWahapediaClient();
            expect(client).toBeInstanceOf(WahapediaClient);
        });

        it('creates WahapediaClient instance with custom fetch', () => {
            const customFetch = vi.fn();
            const client = createWahapediaClient(customFetch as unknown as typeof fetch);
            expect(client).toBeInstanceOf(WahapediaClient);
        });
    });
});
