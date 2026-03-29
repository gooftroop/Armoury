import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
    GitHubClient,
    buildQueryGitHubFileKey,
    buildQueryGitHubFileShaKey,
    buildQueryGitHubFilesKey,
    buildQueryGitHubUpdateCheckKey,
} from '@armoury/clients-github';
import type { QueryKey } from '@tanstack/react-query';
import { GitHubAdapter } from '@/adapter.js';

type QueryOptionsLike = {
    queryKey?: QueryKey;
    queryFn?: () => unknown;
};

describe('GitHubAdapter', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('implements IGitHubClient methods', () => {
        const queryClient = new QueryClient();
        const adapter = new GitHubAdapter(queryClient);

        expect(typeof adapter.listFiles).toBe('function');
        expect(typeof adapter.getFileSha).toBe('function');
        expect(typeof adapter.downloadFile).toBe('function');
        expect(typeof adapter.checkForUpdates).toBe('function');
    });

    it('listFiles delegates to queryClient.fetchQuery with correct query options', async () => {
        const files = [
            { name: 'a.cat', path: 'a.cat', sha: 'sha-a', size: 1, download_url: null, type: 'file' as const },
        ];
        const listFilesSpy = vi.spyOn(GitHubClient.prototype, 'listFiles').mockResolvedValue(files);
        const fetchQuery = vi.fn(async (options: QueryOptionsLike) => options.queryFn?.());
        const queryClient = { fetchQuery } as unknown as QueryClient;
        const adapter = new GitHubAdapter(queryClient);

        const result = await adapter.listFiles('BSData', 'wh40k-10e', 'data');

        expect(result).toEqual(files);
        expect(fetchQuery).toHaveBeenCalledTimes(1);
        const options = fetchQuery.mock.calls[0][0] as QueryOptionsLike;
        expect(options.queryKey).toEqual(buildQueryGitHubFilesKey('BSData', 'wh40k-10e', 'data'));
        expect(listFilesSpy).toHaveBeenCalledWith('BSData', 'wh40k-10e', 'data');
    });

    it('getFileSha delegates to queryClient.fetchQuery with correct query options', async () => {
        const getFileShaSpy = vi.spyOn(GitHubClient.prototype, 'getFileSha').mockResolvedValue('sha-123');
        const fetchQuery = vi.fn(async (options: QueryOptionsLike) => options.queryFn?.());
        const queryClient = { fetchQuery } as unknown as QueryClient;
        const adapter = new GitHubAdapter(queryClient);

        const result = await adapter.getFileSha('BSData', 'wh40k-10e', 'file.cat');

        expect(result).toBe('sha-123');
        expect(fetchQuery).toHaveBeenCalledTimes(1);
        const options = fetchQuery.mock.calls[0][0] as QueryOptionsLike;
        expect(options.queryKey).toEqual(buildQueryGitHubFileShaKey('BSData', 'wh40k-10e', 'file.cat'));
        expect(getFileShaSpy).toHaveBeenCalledWith('BSData', 'wh40k-10e', 'file.cat');
    });

    it('downloadFile delegates to queryClient.fetchQuery with correct query options', async () => {
        const downloadFileSpy = vi.spyOn(GitHubClient.prototype, 'downloadFile').mockResolvedValue('<catalogue />');
        const fetchQuery = vi.fn(async (options: QueryOptionsLike) => options.queryFn?.());
        const queryClient = { fetchQuery } as unknown as QueryClient;
        const adapter = new GitHubAdapter(queryClient);

        const result = await adapter.downloadFile('BSData', 'wh40k-10e', 'file.cat');

        expect(result).toBe('<catalogue />');
        expect(fetchQuery).toHaveBeenCalledTimes(1);
        const options = fetchQuery.mock.calls[0][0] as QueryOptionsLike;
        expect(options.queryKey).toEqual(buildQueryGitHubFileKey('BSData', 'wh40k-10e', 'file.cat'));
        expect(downloadFileSpy).toHaveBeenCalledWith('BSData', 'wh40k-10e', 'file.cat');
    });

    it('checkForUpdates delegates to queryClient.fetchQuery with correct query options', async () => {
        const checkForUpdatesSpy = vi.spyOn(GitHubClient.prototype, 'checkForUpdates').mockResolvedValue(true);
        const fetchQuery = vi.fn(async (options: QueryOptionsLike) => options.queryFn?.());
        const queryClient = { fetchQuery } as unknown as QueryClient;
        const adapter = new GitHubAdapter(queryClient);

        const result = await adapter.checkForUpdates('BSData', 'wh40k-10e', 'file.cat', 'known-sha');

        expect(result).toBe(true);
        expect(fetchQuery).toHaveBeenCalledTimes(1);
        const options = fetchQuery.mock.calls[0][0] as QueryOptionsLike;
        expect(options.queryKey).toEqual(
            buildQueryGitHubUpdateCheckKey('BSData', 'wh40k-10e', 'file.cat', 'known-sha'),
        );
        expect(checkForUpdatesSpy).toHaveBeenCalledWith('BSData', 'wh40k-10e', 'file.cat', 'known-sha');
    });

    it('deduplicates concurrent calls with same params', async () => {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });
        const adapter = new GitHubAdapter(queryClient);
        const downloadFileSpy = vi
            .spyOn(GitHubClient.prototype, 'downloadFile')
            .mockImplementation(async () => new Promise((resolve) => setTimeout(() => resolve('<catalogue />'), 20)));

        const [first, second] = await Promise.all([
            adapter.downloadFile('BSData', 'wh40k-10e', 'shared.cat'),
            adapter.downloadFile('BSData', 'wh40k-10e', 'shared.cat'),
        ]);

        expect(first).toBe('<catalogue />');
        expect(second).toBe('<catalogue />');
        expect(downloadFileSpy).toHaveBeenCalledTimes(1);
    });
});
