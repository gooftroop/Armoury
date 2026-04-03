/**
 * SilentAuthCheck component tests.
 *
 * @requirements
 * - REQ-SILENT-AUTH-01: Renders nothing.
 * - REQ-SILENT-AUTH-02: Does nothing when Auth0 SPA client is unavailable.
 * - REQ-SILENT-AUTH-03: Redirects to /auth/login?prompt=none with encoded returnTo when silent token succeeds.
 * - REQ-SILENT-AUTH-04: Silently swallows expected Auth0 errors.
 * - REQ-SILENT-AUTH-05: Silently swallows unexpected errors without redirecting.
 * - REQ-SILENT-AUTH-06: Avoids redirect after unmount via effect cleanup cancellation.
 */

import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SilentAuthCheck } from '../SilentAuthCheck.js';

type MockAuthClient = {
    getTokenSilently: () => Promise<unknown>;
};

const { mockGetAuth0SpaClient } = vi.hoisted(() => ({
    mockGetAuth0SpaClient: vi.fn<() => MockAuthClient | null>(),
}));

vi.mock('@/lib/auth0SpaClient.js', () => ({
    getAuth0SpaClient: mockGetAuth0SpaClient,
}));

const originalLocation = window.location;

function mockWindowLocation(pathname: string, search = '', hash = ''): ReturnType<typeof vi.fn> {
    const assign = vi.fn<(url: string | URL) => void>();

    Object.defineProperty(window, 'location', {
        configurable: true,
        writable: true,
        value: {
            ...originalLocation,
            pathname,
            search,
            hash,
            assign,
        },
    });

    return assign;
}

describe('SilentAuthCheck', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        Object.defineProperty(window, 'location', {
            configurable: true,
            writable: true,
            value: originalLocation,
        });
    });

    it('renders null (no DOM output)', () => {
        const { container } = render(<SilentAuthCheck />);

        expect(container.firstChild).toBeNull();
    });

    it('does nothing when getAuth0SpaClient returns null', async () => {
        const assign = mockWindowLocation('/');

        mockGetAuth0SpaClient.mockReturnValue(null);

        render(<SilentAuthCheck />);

        await waitFor(() => {
            expect(mockGetAuth0SpaClient).toHaveBeenCalledTimes(1);
        });

        expect(assign).not.toHaveBeenCalled();
    });

    it('redirects to login with prompt=none and encoded returnTo when silent auth succeeds', async () => {
        const assign = mockWindowLocation('/landing', '?from=home', '#cta');
        const mockGetTokenSilently = vi.fn<() => Promise<unknown>>().mockResolvedValue('token');

        mockGetAuth0SpaClient.mockReturnValue({ getTokenSilently: mockGetTokenSilently });

        render(<SilentAuthCheck />);

        await waitFor(() => {
            expect(assign).toHaveBeenCalledTimes(1);
        });

        const expectedReturnTo = encodeURIComponent('/landing?from=home#cta');
        expect(assign).toHaveBeenCalledWith(`/auth/login?prompt=none&returnTo=${expectedReturnTo}`);
    });

    it('encodes returnTo using pathname + search + hash exactly', async () => {
        const assign = mockWindowLocation('/a/b', '?q=white space&x=1', '#section-2');
        const mockGetTokenSilently = vi.fn<() => Promise<unknown>>().mockResolvedValue('token');

        mockGetAuth0SpaClient.mockReturnValue({ getTokenSilently: mockGetTokenSilently });

        render(<SilentAuthCheck />);

        await waitFor(() => {
            expect(assign).toHaveBeenCalledTimes(1);
        });

        const expectedReturnTo = encodeURIComponent('/a/b?q=white space&x=1#section-2');
        expect(assign).toHaveBeenCalledWith(`/auth/login?prompt=none&returnTo=${expectedReturnTo}`);
    });

    it('silently swallows login_required without redirect', async () => {
        const assign = mockWindowLocation('/');
        const mockGetTokenSilently = vi.fn<() => Promise<unknown>>().mockRejectedValue({ error: 'login_required' });

        mockGetAuth0SpaClient.mockReturnValue({ getTokenSilently: mockGetTokenSilently });

        render(<SilentAuthCheck />);

        await waitFor(() => {
            expect(mockGetTokenSilently).toHaveBeenCalledTimes(1);
        });

        expect(assign).not.toHaveBeenCalled();
    });

    it('silently swallows consent_required without redirect', async () => {
        const assign = mockWindowLocation('/');
        const mockGetTokenSilently = vi.fn<() => Promise<unknown>>().mockRejectedValue({ error: 'consent_required' });

        mockGetAuth0SpaClient.mockReturnValue({ getTokenSilently: mockGetTokenSilently });

        render(<SilentAuthCheck />);

        await waitFor(() => {
            expect(mockGetTokenSilently).toHaveBeenCalledTimes(1);
        });

        expect(assign).not.toHaveBeenCalled();
    });

    it('silently swallows interaction_required without redirect', async () => {
        const assign = mockWindowLocation('/');
        const mockGetTokenSilently = vi
            .fn<() => Promise<unknown>>()
            .mockRejectedValue({ error: 'interaction_required' });

        mockGetAuth0SpaClient.mockReturnValue({ getTokenSilently: mockGetTokenSilently });

        render(<SilentAuthCheck />);

        await waitFor(() => {
            expect(mockGetTokenSilently).toHaveBeenCalledTimes(1);
        });

        expect(assign).not.toHaveBeenCalled();
    });

    it('silently swallows missing_refresh_token without redirect', async () => {
        const assign = mockWindowLocation('/');
        const mockGetTokenSilently = vi
            .fn<() => Promise<unknown>>()
            .mockRejectedValue({ error: 'missing_refresh_token' });

        mockGetAuth0SpaClient.mockReturnValue({ getTokenSilently: mockGetTokenSilently });

        render(<SilentAuthCheck />);

        await waitFor(() => {
            expect(mockGetTokenSilently).toHaveBeenCalledTimes(1);
        });

        expect(assign).not.toHaveBeenCalled();
    });

    it('silently swallows unexpected errors without redirecting or throwing', async () => {
        const assign = mockWindowLocation('/');
        const mockGetTokenSilently = vi.fn<() => Promise<unknown>>().mockRejectedValue(new Error('network failure'));

        mockGetAuth0SpaClient.mockReturnValue({ getTokenSilently: mockGetTokenSilently });

        expect(() => render(<SilentAuthCheck />)).not.toThrow();

        await waitFor(() => {
            expect(mockGetTokenSilently).toHaveBeenCalledTimes(1);
        });

        expect(assign).not.toHaveBeenCalled();
    });

    it('prevents redirect after unmount when silent auth resolves later', async () => {
        const assign = mockWindowLocation('/post-unmount');

        let resolveToken: (() => void) | undefined;
        const mockGetTokenSilently = vi.fn<() => Promise<unknown>>().mockImplementation(
            () =>
                new Promise<void>((resolve) => {
                    resolveToken = resolve;
                }),
        );

        mockGetAuth0SpaClient.mockReturnValue({ getTokenSilently: mockGetTokenSilently });

        const { unmount } = render(<SilentAuthCheck />);

        await waitFor(() => {
            expect(mockGetTokenSilently).toHaveBeenCalledTimes(1);
        });

        unmount();

        if (resolveToken) {
            resolveToken();
        }

        await Promise.resolve();
        await Promise.resolve();

        expect(assign).not.toHaveBeenCalled();
    });
});
