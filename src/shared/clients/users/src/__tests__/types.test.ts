/**
 * Tests for error classes (UsersApiError, UsersNetworkError) and
 * type guard functions (isUsersApiError, isUsersNetworkError).
 *
 * Verifies that custom error classes set name, message, statusCode/cause
 * correctly, extend Error, and that type guards correctly discriminate
 * between error types.
 */

import { describe, it, expect } from 'vitest';
import { UsersApiError, UsersNetworkError, isUsersApiError, isUsersNetworkError } from './../types.ts';

describe('UsersApiError', () => {
    it('sets the name to "UsersApiError"', () => {
        const error = new UsersApiError('Not found', 404);

        expect(error.name).toBe('UsersApiError');
    });

    it('sets the message correctly', () => {
        const error = new UsersApiError('Not found', 404);

        expect(error.message).toBe('Not found');
    });

    it('sets the statusCode correctly', () => {
        const error = new UsersApiError('Not found', 404);

        expect(error.statusCode).toBe(404);
    });

    it('is an instance of Error', () => {
        const error = new UsersApiError('Server error', 500);

        expect(error).toBeInstanceOf(Error);
    });

    it('is an instance of UsersApiError', () => {
        const error = new UsersApiError('Bad request', 400);

        expect(error).toBeInstanceOf(UsersApiError);
    });
});

describe('UsersNetworkError', () => {
    it('sets the name to "UsersNetworkError"', () => {
        const error = new UsersNetworkError('Network failure');

        expect(error.name).toBe('UsersNetworkError');
    });

    it('sets the message correctly', () => {
        const error = new UsersNetworkError('Network failure');

        expect(error.message).toBe('Network failure');
    });

    it('sets the cause correctly when provided', () => {
        const cause = new Error('Connection refused');
        const error = new UsersNetworkError('Network failure', cause);

        expect(error.cause).toBe(cause);
    });

    it('sets cause to undefined when not provided', () => {
        const error = new UsersNetworkError('Network failure');

        expect(error.cause).toBeUndefined();
    });

    it('is an instance of Error', () => {
        const error = new UsersNetworkError('Timeout');

        expect(error).toBeInstanceOf(Error);
    });

    it('is an instance of UsersNetworkError', () => {
        const error = new UsersNetworkError('Timeout');

        expect(error).toBeInstanceOf(UsersNetworkError);
    });
});

describe('isUsersApiError', () => {
    it('returns true for a UsersApiError instance', () => {
        const error = new UsersApiError('Not found', 404);

        expect(isUsersApiError(error)).toBe(true);
    });

    it('returns false for a plain Error', () => {
        const error = new Error('Generic error');

        expect(isUsersApiError(error)).toBe(false);
    });

    it('returns false for a UsersNetworkError', () => {
        const error = new UsersNetworkError('Network failure');

        expect(isUsersApiError(error)).toBe(false);
    });

    it('returns false for a non-error value', () => {
        expect(isUsersApiError('not an error')).toBe(false);
        expect(isUsersApiError(null)).toBe(false);
        expect(isUsersApiError(undefined)).toBe(false);
    });
});

describe('isUsersNetworkError', () => {
    it('returns true for a UsersNetworkError instance', () => {
        const error = new UsersNetworkError('Network failure');

        expect(isUsersNetworkError(error)).toBe(true);
    });

    it('returns false for a plain Error', () => {
        const error = new Error('Generic error');

        expect(isUsersNetworkError(error)).toBe(false);
    });

    it('returns false for a UsersApiError', () => {
        const error = new UsersApiError('Not found', 404);

        expect(isUsersNetworkError(error)).toBe(false);
    });

    it('returns false for a non-error value', () => {
        expect(isUsersNetworkError('not an error')).toBe(false);
        expect(isUsersNetworkError(null)).toBe(false);
        expect(isUsersNetworkError(undefined)).toBe(false);
    });
});
