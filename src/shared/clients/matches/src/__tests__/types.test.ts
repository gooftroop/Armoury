/**
 * Unit tests for the matches client error classes and type guards.
 *
 * Tests MatchesApiError, MatchesNetworkError constructors and property assignment,
 * and the isMatchesApiError / isMatchesNetworkError type guard functions.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MatchesApiError, MatchesNetworkError, isMatchesApiError, isMatchesNetworkError } from './../types.ts';

describe('MatchesApiError', () => {
    beforeEach(() => vi.clearAllMocks());

    it('sets the name to "MatchesApiError"', () => {
        const error = new MatchesApiError('Not Found', 404);

        expect(error.name).toBe('MatchesApiError');
    });

    it('sets the message correctly', () => {
        const error = new MatchesApiError('Not Found', 404);

        expect(error.message).toBe('Not Found');
    });

    it('sets the statusCode correctly', () => {
        const error = new MatchesApiError('Not Found', 404);

        expect(error.statusCode).toBe(404);
    });

    it('is an instance of Error', () => {
        const error = new MatchesApiError('Server Error', 500);

        expect(error).toBeInstanceOf(Error);
    });

    it('is an instance of MatchesApiError', () => {
        const error = new MatchesApiError('Forbidden', 403);

        expect(error).toBeInstanceOf(MatchesApiError);
    });
});

describe('MatchesNetworkError', () => {
    beforeEach(() => vi.clearAllMocks());

    it('sets the name to "MatchesNetworkError"', () => {
        const error = new MatchesNetworkError('Connection refused');

        expect(error.name).toBe('MatchesNetworkError');
    });

    it('sets the message correctly', () => {
        const error = new MatchesNetworkError('Connection refused');

        expect(error.message).toBe('Connection refused');
    });

    it('sets the cause when provided', () => {
        const cause = new Error('ECONNREFUSED');
        const error = new MatchesNetworkError('Connection refused', cause);

        expect(error.cause).toBe(cause);
    });

    it('leaves cause as undefined when not provided', () => {
        const error = new MatchesNetworkError('Timeout');

        expect(error.cause).toBeUndefined();
    });

    it('is an instance of Error', () => {
        const error = new MatchesNetworkError('Network down');

        expect(error).toBeInstanceOf(Error);
    });

    it('is an instance of MatchesNetworkError', () => {
        const error = new MatchesNetworkError('DNS failure');

        expect(error).toBeInstanceOf(MatchesNetworkError);
    });
});

describe('isMatchesApiError', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns true for a MatchesApiError instance', () => {
        const error = new MatchesApiError('Bad Request', 400);

        expect(isMatchesApiError(error)).toBe(true);
    });

    it('returns false for a plain Error', () => {
        const error = new Error('generic error');

        expect(isMatchesApiError(error)).toBe(false);
    });

    it('returns false for a MatchesNetworkError', () => {
        const error = new MatchesNetworkError('network issue');

        expect(isMatchesApiError(error)).toBe(false);
    });

    it('returns false for non-error values', () => {
        expect(isMatchesApiError(null)).toBe(false);
        expect(isMatchesApiError(undefined)).toBe(false);
        expect(isMatchesApiError('string')).toBe(false);
        expect(isMatchesApiError(42)).toBe(false);
    });
});

describe('isMatchesNetworkError', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns true for a MatchesNetworkError instance', () => {
        const error = new MatchesNetworkError('Connection lost');

        expect(isMatchesNetworkError(error)).toBe(true);
    });

    it('returns false for a plain Error', () => {
        const error = new Error('generic error');

        expect(isMatchesNetworkError(error)).toBe(false);
    });

    it('returns false for a MatchesApiError', () => {
        const error = new MatchesApiError('Not Found', 404);

        expect(isMatchesNetworkError(error)).toBe(false);
    });

    it('returns false for non-error values', () => {
        expect(isMatchesNetworkError(null)).toBe(false);
        expect(isMatchesNetworkError(undefined)).toBe(false);
        expect(isMatchesNetworkError('string')).toBe(false);
        expect(isMatchesNetworkError(42)).toBe(false);
    });
});
