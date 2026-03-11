/**
 * Unit tests for the friends client error classes and type guards.
 *
 * Tests FriendsApiError and FriendsNetworkError constructors to verify
 * name, message, statusCode, and cause properties. Tests isFriendsApiError
 * and isFriendsNetworkError type guards for correct discrimination.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { FriendsApiError, FriendsNetworkError, isFriendsApiError, isFriendsNetworkError } from './../types.ts';

describe('FriendsApiError', () => {
    beforeEach(() => vi.clearAllMocks());

    it('sets the name to FriendsApiError', () => {
        const error = new FriendsApiError('Not found', 404);

        expect(error.name).toBe('FriendsApiError');
    });

    it('sets the message from the constructor argument', () => {
        const error = new FriendsApiError('Not found', 404);

        expect(error.message).toBe('Not found');
    });

    it('sets the statusCode from the constructor argument', () => {
        const error = new FriendsApiError('Not found', 404);

        expect(error.statusCode).toBe(404);
    });

    it('is an instance of Error', () => {
        const error = new FriendsApiError('Server error', 500);

        expect(error).toBeInstanceOf(Error);
    });

    it('is an instance of FriendsApiError', () => {
        const error = new FriendsApiError('Bad request', 400);

        expect(error).toBeInstanceOf(FriendsApiError);
    });
});

describe('FriendsNetworkError', () => {
    beforeEach(() => vi.clearAllMocks());

    it('sets the name to FriendsNetworkError', () => {
        const error = new FriendsNetworkError('Network failed');

        expect(error.name).toBe('FriendsNetworkError');
    });

    it('sets the message from the constructor argument', () => {
        const error = new FriendsNetworkError('Connection timeout');

        expect(error.message).toBe('Connection timeout');
    });

    it('sets the cause from the constructor argument', () => {
        const cause = new Error('ECONNREFUSED');
        const error = new FriendsNetworkError('Network failed', cause);

        expect(error.cause).toBe(cause);
    });

    it('sets cause to undefined when not provided', () => {
        const error = new FriendsNetworkError('Network failed');

        expect(error.cause).toBeUndefined();
    });

    it('is an instance of Error', () => {
        const error = new FriendsNetworkError('Network failed');

        expect(error).toBeInstanceOf(Error);
    });

    it('is an instance of FriendsNetworkError', () => {
        const error = new FriendsNetworkError('Network failed');

        expect(error).toBeInstanceOf(FriendsNetworkError);
    });
});

describe('isFriendsApiError', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns true for a FriendsApiError instance', () => {
        const error = new FriendsApiError('Not found', 404);

        expect(isFriendsApiError(error)).toBe(true);
    });

    it('returns false for a plain Error instance', () => {
        const error = new Error('Something went wrong');

        expect(isFriendsApiError(error)).toBe(false);
    });

    it('returns false for a FriendsNetworkError instance', () => {
        const error = new FriendsNetworkError('Network failed');

        expect(isFriendsApiError(error)).toBe(false);
    });

    it('returns false for a non-error value', () => {
        expect(isFriendsApiError('not an error')).toBe(false);
    });
});

describe('isFriendsNetworkError', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns true for a FriendsNetworkError instance', () => {
        const error = new FriendsNetworkError('Network failed');

        expect(isFriendsNetworkError(error)).toBe(true);
    });

    it('returns false for a plain Error instance', () => {
        const error = new Error('Something went wrong');

        expect(isFriendsNetworkError(error)).toBe(false);
    });

    it('returns false for a FriendsApiError instance', () => {
        const error = new FriendsApiError('Not found', 404);

        expect(isFriendsNetworkError(error)).toBe(false);
    });

    it('returns false for a non-error value', () => {
        expect(isFriendsNetworkError(null)).toBe(false);
    });
});
