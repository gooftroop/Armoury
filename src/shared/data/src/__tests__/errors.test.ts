import { describe, it, expect } from 'vitest';
import { DatabaseError, isDatabaseError } from '@data/types.js';
import {
    GitHubApiError,
    RateLimitError,
    NetworkError,
    isGitHubApiError,
    isRateLimitError,
    isNetworkError,
} from '@clients-github/types.js';
import { XmlParseError, isXmlParseError } from '@providers-bsdata/types.js';

describe('Error type guards', () => {
    it('isGitHubApiError returns true for GitHubApiError', () => {
        const error = new GitHubApiError('Not found', 404, '/repos/test');
        expect(isGitHubApiError(error)).toBe(true);
        expect(error.statusCode).toBe(404);
        expect(error.endpoint).toBe('/repos/test');
    });

    it('isRateLimitError returns true for RateLimitError', () => {
        const resetTime = new Date();
        const error = new RateLimitError('Rate limited', resetTime, 60);
        expect(isRateLimitError(error)).toBe(true);
        expect(error.resetTime).toBe(resetTime);
        expect(error.retryAfter).toBe(60);
    });

    it('isNetworkError returns true for NetworkError', () => {
        const cause = new Error('Connection refused');
        const error = new NetworkError('Network failure', cause);
        expect(isNetworkError(error)).toBe(true);
        expect(error.cause).toBe(cause);
    });

    it('isXmlParseError returns true for XmlParseError', () => {
        const error = new XmlParseError('Invalid XML', { line: 10, column: 5 }, '<broken');
        expect(isXmlParseError(error)).toBe(true);
        expect(error.position?.line).toBe(10);
        expect(error.context).toBe('<broken');
    });

    it('isDatabaseError returns true for DatabaseError', () => {
        const error = new DatabaseError('Insert failed', 'INSERT');
        expect(isDatabaseError(error)).toBe(true);
        expect(error.operation).toBe('INSERT');
    });

    it('all errors extend Error', () => {
        const errors = [
            new GitHubApiError('test', 500, '/test'),
            new RateLimitError('test', new Date(), 60),
            new NetworkError('test'),
            new XmlParseError('test'),
            new DatabaseError('test', 'SELECT'),
        ];

        for (const error of errors) {
            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBeDefined();
            expect(error.message).toBeDefined();
        }
    });

    it('type guards return false for regular Error', () => {
        const error = new Error('test');
        expect(isGitHubApiError(error)).toBe(false);
        expect(isRateLimitError(error)).toBe(false);
        expect(isNetworkError(error)).toBe(false);
        expect(isXmlParseError(error)).toBe(false);
        expect(isDatabaseError(error)).toBe(false);
    });
});
