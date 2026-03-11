/**
 * Unit tests for error classes (CampaignsApiError, CampaignsNetworkError)
 * and type guard functions (isCampaignsApiError, isCampaignsNetworkError).
 *
 * Tests:
 * - Constructor property assignment (name, message, statusCode, cause)
 * - Prototype chain (instanceof Error)
 * - Type guards return true for correct instances, false for plain Error
 */

import { describe, expect, it } from 'vitest';
import { CampaignsApiError, CampaignsNetworkError, isCampaignsApiError, isCampaignsNetworkError } from './../types.ts';

describe('CampaignsApiError', () => {
    it('sets name, message, and statusCode correctly', () => {
        const error = new CampaignsApiError('Not found', 404);

        expect(error.name).toBe('CampaignsApiError');
        expect(error.message).toBe('Not found');
        expect(error.statusCode).toBe(404);
    });

    it('is an instance of Error', () => {
        const error = new CampaignsApiError('Server error', 500);

        expect(error).toBeInstanceOf(Error);
    });

    it('is an instance of CampaignsApiError', () => {
        const error = new CampaignsApiError('Bad request', 400);

        expect(error).toBeInstanceOf(CampaignsApiError);
    });
});

describe('CampaignsNetworkError', () => {
    it('sets name, message, and cause correctly', () => {
        const cause = new Error('Connection refused');
        const error = new CampaignsNetworkError('Network failure', cause);

        expect(error.name).toBe('CampaignsNetworkError');
        expect(error.message).toBe('Network failure');
        expect(error.cause).toBe(cause);
    });

    it('sets cause to undefined when not provided', () => {
        const error = new CampaignsNetworkError('Network failure');

        expect(error.name).toBe('CampaignsNetworkError');
        expect(error.message).toBe('Network failure');
        expect(error.cause).toBeUndefined();
    });

    it('is an instance of Error', () => {
        const error = new CampaignsNetworkError('Timeout');

        expect(error).toBeInstanceOf(Error);
    });

    it('is an instance of CampaignsNetworkError', () => {
        const error = new CampaignsNetworkError('DNS error');

        expect(error).toBeInstanceOf(CampaignsNetworkError);
    });
});

describe('isCampaignsApiError', () => {
    it('returns true for a CampaignsApiError', () => {
        const error = new CampaignsApiError('Not found', 404);

        expect(isCampaignsApiError(error)).toBe(true);
    });

    it('returns false for a plain Error', () => {
        const error = new Error('Some error');

        expect(isCampaignsApiError(error)).toBe(false);
    });

    it('returns false for a CampaignsNetworkError', () => {
        const error = new CampaignsNetworkError('Network error');

        expect(isCampaignsApiError(error)).toBe(false);
    });

    it('returns false for non-error values', () => {
        expect(isCampaignsApiError(null)).toBe(false);
        expect(isCampaignsApiError(undefined)).toBe(false);
        expect(isCampaignsApiError('string')).toBe(false);
        expect(isCampaignsApiError(42)).toBe(false);
    });
});

describe('isCampaignsNetworkError', () => {
    it('returns true for a CampaignsNetworkError', () => {
        const error = new CampaignsNetworkError('Network failure');

        expect(isCampaignsNetworkError(error)).toBe(true);
    });

    it('returns false for a plain Error', () => {
        const error = new Error('Some error');

        expect(isCampaignsNetworkError(error)).toBe(false);
    });

    it('returns false for a CampaignsApiError', () => {
        const error = new CampaignsApiError('API error', 500);

        expect(isCampaignsNetworkError(error)).toBe(false);
    });

    it('returns false for non-error values', () => {
        expect(isCampaignsNetworkError(null)).toBe(false);
        expect(isCampaignsNetworkError(undefined)).toBe(false);
        expect(isCampaignsNetworkError('string')).toBe(false);
        expect(isCampaignsNetworkError(42)).toBe(false);
    });
});
