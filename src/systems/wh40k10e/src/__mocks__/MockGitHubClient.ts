import type { IGitHubClient, GitHubFileInfo } from '@armoury/clients-github';

/**
 * Mock GitHub client for testing.
 * Implements the IGitHubClient interface using in-memory Maps for file contents and SHAs.
 * Tracks all method calls for assertion in tests.
 */
class MockGitHubClient implements IGitHubClient {
    /** Array of files to return from listFiles() */
    files: GitHubFileInfo[] = [];
    /** Map of file paths to their contents */
    fileContents: Map<string, string> = new Map();
    /** Map of file paths to their SHA hashes */
    fileShas: Map<string, string> = new Map();
    /** Whether checkForUpdates() should return true */
    shouldUpdate = false;
    /** Paths that were downloaded via downloadFile() */
    downloadedPaths: string[] = [];
    /** Paths that were requested via getFileSha() */
    shaRequestedPaths: string[] = [];

    /**
     * List files in a GitHub repository path.
     * @param _owner - Repository owner (unused in mock)
     * @param _repo - Repository name (unused in mock)
     * @param _path - Repository path (unused in mock)
     * @returns The files array configured on this mock instance
     */
    async listFiles(_owner: string, _repo: string, _path: string): Promise<GitHubFileInfo[]> {
        return this.files;
    }

    /**
     * Get the SHA hash of a file in a GitHub repository.
     * @param _owner - Repository owner (unused in mock)
     * @param _repo - Repository name (unused in mock)
     * @param path - File path to get SHA for
     * @returns The SHA from fileShas map, or a generated default
     */
    async getFileSha(_owner: string, _repo: string, path: string): Promise<string> {
        this.shaRequestedPaths.push(path);

        return this.fileShas.get(path) ?? 'sha-' + path;
    }

    /**
     * Download a file from a GitHub repository.
     * @param _owner - Repository owner (unused in mock)
     * @param _repo - Repository name (unused in mock)
     * @param path - File path to download
     * @returns The file contents from fileContents map, or empty string
     */
    async downloadFile(_owner: string, _repo: string, path: string): Promise<string> {
        this.downloadedPaths.push(path);

        return this.fileContents.get(path) ?? '';
    }

    /**
     * Check if there are updates available in the GitHub repository.
     * @returns The shouldUpdate flag configured on this mock instance
     */
    async checkForUpdates(): Promise<boolean> {
        return this.shouldUpdate;
    }
}

export { MockGitHubClient };
