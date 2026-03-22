/**
 * Query key builders for GitHub API queries.
 */

/**
 * @requirements
 * 1. Must provide unique, stable query keys for each GitHub API operation.
 * 2. Keys must include all parameters that affect the query result.
 */

/** Builds query key for listing files in a repository path. */
export function buildQueryGitHubFilesKey(owner: string, repo: string, path: string) {
    return ['github', 'files', owner, repo, path] as const;
}

/** Builds query key for getting a file's SHA hash. */
export function buildQueryGitHubFileShaKey(owner: string, repo: string, path: string) {
    return ['github', 'fileSha', owner, repo, path] as const;
}

/** Builds query key for downloading a file's content. */
export function buildQueryGitHubFileKey(owner: string, repo: string, path: string) {
    return ['github', 'file', owner, repo, path] as const;
}

/** Builds query key for checking file updates. */
export function buildQueryGitHubUpdateCheckKey(owner: string, repo: string, path: string, knownSha: string) {
    return ['github', 'updateCheck', owner, repo, path, knownSha] as const;
}
