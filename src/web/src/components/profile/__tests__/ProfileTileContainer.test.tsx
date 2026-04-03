/**
 * ProfileTileContainer component tests.
 *
 * @requirements
 * - REQ-PROFILE-CONTAINER-01: Renders ProfileTileSkeleton when auth state is loading and no error.
 * - REQ-PROFILE-CONTAINER-02: Renders AuthenticatedProfile when user is present.
 * - REQ-PROFILE-CONTAINER-03: Passes expected authenticated props including hrefs and labels.
 * - REQ-PROFILE-CONTAINER-04: Renders UnauthenticatedPrompt when user is absent and auth is resolved.
 * - REQ-PROFILE-CONTAINER-05: Falls through to UnauthenticatedPrompt on error when no user.
 * - REQ-PROFILE-CONTAINER-06: Coerces nullable user name/picture to empty string.
 */

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProfileTileContainer } from '../ProfileTileContainer.js';

const { useUserMock, useTranslationsMock } = vi.hoisted(() => ({
    useUserMock: vi.fn(),
    useTranslationsMock: vi.fn(),
}));

vi.mock('@auth0/nextjs-auth0', () => ({
    useUser: () => useUserMock(),
}));

vi.mock('next-intl', () => ({
    useTranslations: (namespace: string) => useTranslationsMock(namespace),
}));

vi.mock('@/components/profile/AuthenticatedProfile.js', () => ({
    AuthenticatedProfile: (props: Record<string, unknown>) => (
        <div>
            <span>authenticated</span>
            <span>name:{String(props.name)}</span>
            <span>picture:{String(props.picture)}</span>
            <span>welcomeText:{String(props.welcomeText)}</span>
            <span>settingsLabel:{String(props.settingsLabel)}</span>
            <span>settingsHref:{String(props.settingsHref)}</span>
            <span>signOutLabel:{String(props.signOutLabel)}</span>
            <span>signOutHref:{String(props.signOutHref)}</span>
        </div>
    ),
}));

vi.mock('@/components/profile/ProfileTileSkeleton.js', () => ({
    ProfileTileSkeleton: () => <div>profile-skeleton</div>,
}));

vi.mock('@/components/profile/UnauthenticatedPrompt.js', () => ({
    UnauthenticatedPrompt: (props: Record<string, unknown>) => (
        <div>
            <span>unauthenticated</span>
            <span>signInPrefix:{String(props.signInPrefix)}</span>
            <span>signInLabel:{String(props.signInLabel)}</span>
            <span>createAccountPrefix:{String(props.createAccountPrefix)}</span>
            <span>createAccountLabel:{String(props.createAccountLabel)}</span>
        </div>
    ),
}));

describe('ProfileTileContainer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useTranslationsMock.mockReturnValue((key: string) => key);
    });

    it('renders ProfileTileSkeleton while loading without error', () => {
        useUserMock.mockReturnValue({
            user: undefined,
            error: undefined,
            isLoading: true,
        });

        render(<ProfileTileContainer locale="en" />);

        expect(screen.getByText('profile-skeleton')).toBeInTheDocument();
        expect(screen.queryByText('authenticated')).not.toBeInTheDocument();
        expect(screen.queryByText('unauthenticated')).not.toBeInTheDocument();
    });

    it('renders AuthenticatedProfile with expected props when user exists', () => {
        useUserMock.mockReturnValue({
            user: {
                name: 'Alice',
                picture: 'https://cdn.example.com/alice.png',
            },
            error: undefined,
            isLoading: false,
        });

        render(<ProfileTileContainer locale="en" />);

        expect(screen.getByText('authenticated')).toBeInTheDocument();
        expect(screen.getByText('name:Alice')).toBeInTheDocument();
        expect(screen.getByText('picture:https://cdn.example.com/alice.png')).toBeInTheDocument();
        expect(screen.getByText('welcomeText:welcome')).toBeInTheDocument();
        expect(screen.getByText('settingsLabel:editProfile')).toBeInTheDocument();
        expect(screen.getByText('settingsHref:/en/account')).toBeInTheDocument();
        expect(screen.getByText('signOutLabel:signOut')).toBeInTheDocument();
        expect(screen.getByText('signOutHref:/auth/logout')).toBeInTheDocument();
    });

    it('passes locale through to settingsHref', () => {
        useUserMock.mockReturnValue({
            user: {
                name: 'Alice',
                picture: 'https://cdn.example.com/alice.png',
            },
            error: undefined,
            isLoading: false,
        });

        render(<ProfileTileContainer locale="fr-CA" />);

        expect(screen.getByText('settingsHref:/fr-CA/account')).toBeInTheDocument();
    });

    it('renders UnauthenticatedPrompt when no user and auth is resolved', () => {
        useUserMock.mockReturnValue({
            user: undefined,
            error: undefined,
            isLoading: false,
        });

        render(<ProfileTileContainer locale="en" />);

        expect(screen.getByText('unauthenticated')).toBeInTheDocument();
        expect(screen.getByText('signInPrefix:auth.signInPrefix')).toBeInTheDocument();
        expect(screen.getByText('signInLabel:auth.signInLink')).toBeInTheDocument();
        expect(screen.getByText('createAccountPrefix:auth.createAccountPrefix')).toBeInTheDocument();
        expect(screen.getByText('createAccountLabel:auth.createAccountLink')).toBeInTheDocument();
    });

    it('renders UnauthenticatedPrompt when error is present and user is missing', () => {
        useUserMock.mockReturnValue({
            user: undefined,
            error: new Error('auth failed'),
            isLoading: false,
        });

        render(<ProfileTileContainer locale="en" />);

        expect(screen.getByText('unauthenticated')).toBeInTheDocument();
        expect(screen.queryByText('profile-skeleton')).not.toBeInTheDocument();
    });

    it('coerces missing user name and picture to empty strings', () => {
        useUserMock.mockReturnValue({
            user: {
                name: undefined,
                picture: undefined,
            },
            error: undefined,
            isLoading: false,
        });

        render(<ProfileTileContainer locale="en" />);

        expect(screen.getByText('authenticated')).toBeInTheDocument();
        expect(screen.getByText('name:')).toBeInTheDocument();
        expect(screen.getByText('picture:')).toBeInTheDocument();
    });

    it('does not render skeleton when loading is true but error exists', () => {
        useUserMock.mockReturnValue({
            user: undefined,
            error: new Error('boom'),
            isLoading: true,
        });

        render(<ProfileTileContainer locale="en" />);

        expect(screen.queryByText('profile-skeleton')).not.toBeInTheDocument();
        expect(screen.getByText('unauthenticated')).toBeInTheDocument();
    });

    it('renders AuthenticatedProfile even if error exists when user is present', () => {
        useUserMock.mockReturnValue({
            user: {
                name: 'Bob',
                picture: 'https://cdn.example.com/bob.png',
            },
            error: new Error('stale error'),
            isLoading: false,
        });

        render(<ProfileTileContainer locale="en" />);

        expect(screen.getByText('authenticated')).toBeInTheDocument();
        expect(screen.queryByText('unauthenticated')).not.toBeInTheDocument();
    });
});
