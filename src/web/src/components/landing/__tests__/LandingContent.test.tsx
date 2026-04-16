/**
 * LandingContent server component tests.
 *
 * Tests the async RSC by calling it as a plain function and inspecting the
 * returned React element tree. All external dependencies are mocked.
 *
 * @requirements
 * - REQ-LANDING-01: Renders AuthenticatedLanding wrapped in HydrationBoundary when session exists with userId.
 * - REQ-LANDING-02: Prefetches account data via queryAccount when authenticated.
 * - REQ-LANDING-03: Renders meta refresh redirect to /auth/login when session exists but internal_id is missing.
 * - REQ-LANDING-04: Renders SilentAuthCheck + UnauthenticatedLanding when no session.
 * - REQ-LANDING-05: Calls setRequestLocale with the resolved locale param.
 * - REQ-LANDING-06: Calls discoverSystemManifests and passes manifests to landing components.
 * - REQ-LANDING-07: Passes locale to landing components.
 *
 * Test plan:
 * | Requirement       | Test case                                                                 |
 * |-------------------|---------------------------------------------------------------------------|
 * | REQ-LANDING-01    | authenticated user → HydrationBoundary + AuthenticatedLanding             |
 * | REQ-LANDING-02    | authenticated user → prefetchQuery called with queryAccount               |
 * | REQ-LANDING-03    | authenticated user without internal_id → meta refresh to /auth/login      |
 * | REQ-LANDING-04    | no session → SilentAuthCheck + UnauthenticatedLanding                     |
 * | REQ-LANDING-05    | locale param is forwarded to setRequestLocale                             |
 * | REQ-LANDING-06    | manifests are passed through to landing components                        |
 * | REQ-LANDING-07    | locale is passed through to landing components                            |
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

import type { GameSystemManifest } from '@armoury/data-dao';

/* ---------- hoisted mocks ---------- */

const { mockGetSession, mockSetRequestLocale, mockDiscoverSystemManifests, mockGetQueryClient, mockQueryAccount } =
    vi.hoisted(() => ({
        mockGetSession: vi.fn(),
        mockSetRequestLocale: vi.fn(),
        mockDiscoverSystemManifests: vi.fn(),
        mockGetQueryClient: vi.fn(),
        mockQueryAccount: vi.fn(),
    }));

vi.mock('next-intl/server', () => ({
    setRequestLocale: mockSetRequestLocale,
}));

vi.mock('@/lib/auth0.js', () => ({
    auth0: { getSession: mockGetSession },
    INTERNAL_ID_CLAIM: 'https://armoury.app/internal_id',
}));

vi.mock('@/lib/discoverSystems.js', () => ({
    discoverSystemManifests: mockDiscoverSystemManifests,
}));

vi.mock('@/lib/getQueryClient.js', () => ({
    getQueryClient: mockGetQueryClient,
}));

vi.mock('@armoury/clients-users', () => ({
    queryAccount: mockQueryAccount,
}));

vi.mock('@/components/landing/AuthenticatedLanding.js', () => ({
    AuthenticatedLanding: vi.fn(() => null),
}));

vi.mock('@/components/landing/SilentAuthCheck.js', () => ({
    SilentAuthCheck: vi.fn(() => null),
}));

vi.mock('@/components/landing/UnauthenticatedLanding.js', () => ({
    UnauthenticatedLanding: vi.fn(() => null),
}));

vi.mock('@tanstack/react-query', () => ({
    dehydrate: vi.fn(() => ({ queries: [], mutations: [] })),
    HydrationBoundary: vi.fn(({ children }: { children: React.ReactNode }) => children),
}));

vi.mock('next/headers', () => ({
    cookies: vi.fn(() => Promise.resolve({ get: vi.fn(() => undefined) })),
}));

/* ---------- helpers ---------- */

const INTERNAL_ID_CLAIM = 'https://armoury.app/internal_id';

const fakeManifests: GameSystemManifest[] = [
    {
        id: 'wh40k10e',
        splashText: '40K',
        title: 'Warhammer 40,000',
        subtitle: '10th Edition',
        description: 'In the grim darkness of the far future there is only war.',
        gradientStart: 'oklch(0.3 0.05 250)',
        gradientMid: 'oklch(0.25 0.04 260)',
        gradientEnd: 'oklch(0.2 0.03 270)',
        splashTextColor: 'oklch(0.9 0.02 80 / 0.6)',
        accent: 'gold',
        themeCSS: './theme.css',
        themeTamagui: './theme.tamagui.ts',
        themeStyleSheet: './theme.stylesheet.ts',
        manifestVersion: '1.0.0',
    },
];

function makeMockQueryClient() {
    return {
        prefetchQuery: vi.fn().mockResolvedValue(undefined),
    };
}

function makeSession(userId?: string) {
    return {
        user: {
            sub: 'auth0|abc123',
            ...(userId !== undefined ? { [INTERNAL_ID_CLAIM]: userId } : {}),
        },
        tokenSet: { accessToken: 'test-access-token' },
    };
}

/* ---------- import SUT and mocked modules (after mocks are in place) ---------- */

const { LandingContent } = await import('@/components/landing/LandingContent.js');
const { AuthenticatedLanding } = await import('@/components/landing/AuthenticatedLanding.js');
const { SilentAuthCheck } = await import('@/components/landing/SilentAuthCheck.js');
const { UnauthenticatedLanding } = await import('@/components/landing/UnauthenticatedLanding.js');
const { HydrationBoundary } = await import('@tanstack/react-query');

type ReactElement = { type: unknown; props: Record<string, unknown> };

/**
 * Flatten a React element tree into a list of elements.
 * Handles fragments (type === Symbol(react.fragment)) whose children are in props.children.
 */
function flattenTree(element: ReactElement): ReactElement[] {
    const results: ReactElement[] = [];

    if (!element || typeof element !== 'object') {
        return results;
    }

    results.push(element);

    const children = element.props?.children;

    if (children) {
        const childArray = Array.isArray(children) ? children : [children];

        for (const child of childArray) {
            if (child && typeof child === 'object' && 'type' in (child as object)) {
                results.push(...flattenTree(child as ReactElement));
            }
        }
    }

    return results;
}

function findByType(root: ReactElement, type: unknown): ReactElement | undefined {
    return flattenTree(root).find((el) => el.type === type);
}

function hasType(root: ReactElement, type: unknown): boolean {
    return findByType(root, type) !== undefined;
}

/* ---------- tests ---------- */

describe('LandingContent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockDiscoverSystemManifests.mockResolvedValue(fakeManifests);
    });

    it('calls setRequestLocale with the resolved locale', async () => {
        mockGetSession.mockResolvedValue(null);

        await LandingContent({ params: Promise.resolve({ locale: 'fr' }) });

        expect(mockSetRequestLocale).toHaveBeenCalledWith('fr');
    });

    it('renders SilentAuthCheck + UnauthenticatedLanding when no session exists', async () => {
        mockGetSession.mockResolvedValue(null);

        const result = (await LandingContent({ params: Promise.resolve({ locale: 'en' }) })) as unknown as ReactElement;

        expect(hasType(result, SilentAuthCheck)).toBe(true);
        expect(hasType(result, UnauthenticatedLanding)).toBe(true);
        expect(hasType(result, AuthenticatedLanding)).toBe(false);
    });

    it('passes manifests and locale to UnauthenticatedLanding', async () => {
        mockGetSession.mockResolvedValue(null);

        const result = (await LandingContent({ params: Promise.resolve({ locale: 'de' }) })) as unknown as ReactElement;
        const unauthed = findByType(result, UnauthenticatedLanding);

        expect(unauthed).toBeDefined();
        expect(unauthed!.props.manifests).toEqual(fakeManifests);
        expect(unauthed!.props.locale).toBe('de');
    });

    it('renders SilentAuthCheck + UnauthenticatedLanding when session is undefined', async () => {
        mockGetSession.mockResolvedValue(undefined);

        const result = (await LandingContent({ params: Promise.resolve({ locale: 'en' }) })) as unknown as ReactElement;

        expect(hasType(result, SilentAuthCheck)).toBe(true);
        expect(hasType(result, UnauthenticatedLanding)).toBe(true);
        expect(hasType(result, AuthenticatedLanding)).toBe(false);
    });

    it('renders HydrationBoundary + AuthenticatedLanding when authenticated with userId', async () => {
        const mockQc = makeMockQueryClient();
        mockGetQueryClient.mockReturnValue(mockQc);
        mockGetSession.mockResolvedValue(makeSession('user-123'));
        mockQueryAccount.mockReturnValue({ queryKey: ['account', 'user-123'] });

        const result = (await LandingContent({ params: Promise.resolve({ locale: 'en' }) })) as unknown as ReactElement;

        expect(hasType(result, HydrationBoundary)).toBe(true);
        expect(hasType(result, AuthenticatedLanding)).toBe(true);
        expect(hasType(result, UnauthenticatedLanding)).toBe(false);
        expect(hasType(result, SilentAuthCheck)).toBe(false);
    });

    it('passes userId, manifests, and locale to AuthenticatedLanding', async () => {
        const mockQc = makeMockQueryClient();
        mockGetQueryClient.mockReturnValue(mockQc);
        mockGetSession.mockResolvedValue(makeSession('user-456'));
        mockQueryAccount.mockReturnValue({ queryKey: ['account', 'user-456'] });

        const result = (await LandingContent({ params: Promise.resolve({ locale: 'ja' }) })) as unknown as ReactElement;

        const authed = findByType(result, AuthenticatedLanding);
        expect(authed).toBeDefined();
        expect(authed!.props.userId).toBe('user-456');
        expect(authed!.props.manifests).toEqual(fakeManifests);
        expect(authed!.props.locale).toBe('ja');
    });

    it('prefetches account data via queryClient.prefetchQuery when authenticated', async () => {
        const mockQc = makeMockQueryClient();
        mockGetQueryClient.mockReturnValue(mockQc);
        mockGetSession.mockResolvedValue(makeSession('user-789'));
        const queryOpts = { queryKey: ['account', 'user-789'] };
        mockQueryAccount.mockReturnValue(queryOpts);

        await LandingContent({ params: Promise.resolve({ locale: 'en' }) });

        expect(mockQueryAccount).toHaveBeenCalledWith('Bearer test-access-token', { userId: 'user-789' });
        expect(mockQc.prefetchQuery).toHaveBeenCalledWith(queryOpts);
    });

    it('renders meta refresh redirect when authenticated but internal_id is missing', async () => {
        mockGetSession.mockResolvedValue(makeSession());

        const result = (await LandingContent({ params: Promise.resolve({ locale: 'en' }) })) as unknown as ReactElement;

        expect(result.type).toBe('meta');
        expect(result.props.httpEquiv).toBe('refresh');
        expect(result.props.content).toBe('0;url=/auth/login');
    });

    it('renders UnauthenticatedLanding when session has no tokenSet', async () => {
        mockGetSession.mockResolvedValue({
            user: { sub: 'auth0|abc' },
            tokenSet: undefined,
        });

        const result = (await LandingContent({ params: Promise.resolve({ locale: 'en' }) })) as unknown as ReactElement;

        expect(hasType(result, UnauthenticatedLanding)).toBe(true);
        expect(hasType(result, AuthenticatedLanding)).toBe(false);
    });

    it('renders UnauthenticatedLanding when session has no accessToken', async () => {
        mockGetSession.mockResolvedValue({
            user: { sub: 'auth0|abc' },
            tokenSet: { accessToken: undefined },
        });

        const result = (await LandingContent({ params: Promise.resolve({ locale: 'en' }) })) as unknown as ReactElement;

        expect(hasType(result, UnauthenticatedLanding)).toBe(true);
        expect(hasType(result, AuthenticatedLanding)).toBe(false);
    });

    it('handles discoverSystemManifests returning empty array', async () => {
        mockGetSession.mockResolvedValue(null);
        mockDiscoverSystemManifests.mockResolvedValue([]);

        const result = (await LandingContent({ params: Promise.resolve({ locale: 'en' }) })) as unknown as ReactElement;
        const unauthed = findByType(result, UnauthenticatedLanding);

        expect(unauthed).toBeDefined();
        expect(unauthed!.props.manifests).toEqual([]);
    });

    it('handles discoverSystemManifests rejection gracefully', async () => {
        mockGetSession.mockResolvedValue(null);
        mockDiscoverSystemManifests.mockRejectedValue(new Error('Network error'));

        await expect(LandingContent({ params: Promise.resolve({ locale: 'en' }) })).rejects.toThrow('Network error');
    });
});
