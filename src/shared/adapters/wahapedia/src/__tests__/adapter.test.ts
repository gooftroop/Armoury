import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { QueryKey } from '@tanstack/react-query';
import { WahapediaAdapter } from '@/adapter.js';

const fetchWahapediaPageMock = vi.fn();
const fetchWahapediaPageRawMock = vi.fn();

vi.mock('@armoury/clients-wahapedia', async () => {
    const actual = await vi.importActual<typeof import('@armoury/clients-wahapedia')>('@armoury/clients-wahapedia');

    return {
        ...actual,
        queryWahapedia: (url: string, parser: { parse: (html: string) => unknown }) => ({
            queryKey: ['wahapedia', url],
            queryFn: async () => fetchWahapediaPageMock(url, parser),
            staleTime: 86_400_000,
        }),
        queryWahapediaRaw: (url: string) => ({
            queryKey: ['wahapediaRaw', url],
            queryFn: async () => fetchWahapediaPageRawMock(url),
            staleTime: 86_400_000,
        }),
    };
});

type QueryOptionsLike = {
    queryKey?: QueryKey;
    queryFn?: () => unknown;
};

describe('WahapediaAdapter', () => {
    afterEach(() => {
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    it('implements IWahapediaClient methods', () => {
        const queryClient = new QueryClient();
        const adapter = new WahapediaAdapter(queryClient);

        expect(typeof adapter.fetch).toBe('function');
        expect(typeof adapter.fetchRaw).toBe('function');
    });

    it('fetch delegates to queryClient.fetchQuery with correct query options', async () => {
        const parser = {
            parse: (html: string) => ({ parsed: html.length }),
        };
        fetchWahapediaPageMock.mockResolvedValue({ parsed: 42 });
        const fetchQuery = vi.fn(async (options: QueryOptionsLike) => options.queryFn?.());
        const queryClient = { fetchQuery } as unknown as QueryClient;
        const adapter = new WahapediaAdapter(queryClient);

        const result = await adapter.fetch('https://wahapedia.ru/test', parser);

        expect(result).toEqual({ parsed: 42 });
        expect(fetchQuery).toHaveBeenCalledTimes(1);
        const options = fetchQuery.mock.calls[0][0] as QueryOptionsLike;
        expect(options.queryKey).toEqual(['wahapedia', 'https://wahapedia.ru/test']);
        expect(fetchWahapediaPageMock).toHaveBeenCalledWith('https://wahapedia.ru/test', parser);
    });

    it('fetchRaw delegates to queryClient.fetchQuery with correct query options', async () => {
        fetchWahapediaPageRawMock.mockResolvedValue('<html />');
        const fetchQuery = vi.fn(async (options: QueryOptionsLike) => options.queryFn?.());
        const queryClient = { fetchQuery } as unknown as QueryClient;
        const adapter = new WahapediaAdapter(queryClient);

        const result = await adapter.fetchRaw('https://wahapedia.ru/raw');

        expect(result).toBe('<html />');
        expect(fetchQuery).toHaveBeenCalledTimes(1);
        const options = fetchQuery.mock.calls[0][0] as QueryOptionsLike;
        expect(options.queryKey).toEqual(['wahapediaRaw', 'https://wahapedia.ru/raw']);
        expect(fetchWahapediaPageRawMock).toHaveBeenCalledWith('https://wahapedia.ru/raw');
    });

    it('deduplicates concurrent fetch calls with same params', async () => {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });
        const adapter = new WahapediaAdapter(queryClient);
        const parser = {
            parse: (html: string) => html,
        };
        fetchWahapediaPageMock.mockImplementation(
            async () => new Promise((resolve) => setTimeout(() => resolve('<html>same</html>'), 20)),
        );

        const [first, second] = await Promise.all([
            adapter.fetch('https://wahapedia.ru/shared', parser),
            adapter.fetch('https://wahapedia.ru/shared', parser),
        ]);

        expect(first).toBe('<html>same</html>');
        expect(second).toBe('<html>same</html>');
        expect(fetchWahapediaPageMock).toHaveBeenCalledTimes(1);
    });
});
