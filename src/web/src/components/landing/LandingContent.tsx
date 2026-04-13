/**
 * Landing page content — async server component that checks auth and renders
 * the appropriate client-side landing experience.
 *
 * Replaces the static page.tsx body so the layout can remain statically generated
 * while the landing content reads the Auth0 session at runtime. When authenticated,
 * prefetches the user's account data into a fresh QueryClient and hydrates it into
 * the client tree via HydrationBoundary.
 *
 * @requirements
 * 1. Must be a Server Component (no 'use client').
 * 2. Must call auth0.getSession() at request time to detect authentication.
 * 3. Must extract the internal_id custom claim from session.user for user identification.
 * 4. Must redirect to /auth/login when authenticated but internal_id claim is missing (triggers graceful re-auth).
 * 5. Must discover game system manifests via discoverSystemManifests().
 * 6. Must prefetch account data via React Query when authenticated.
 * 5. Must wrap authenticated path in HydrationBoundary with dehydrated state.
 * 6. Must render AuthenticatedLanding for logged-in users.
 * 7. Must render UnauthenticatedLanding for anonymous users.
 * 8. Must set the request locale for next-intl server-side.
 *
 * @module landing-content
 */

import { setRequestLocale } from 'next-intl/server';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { queryAccount } from '@armoury/clients-users';

import { auth0, INTERNAL_ID_CLAIM } from '@/lib/auth0.js';
import { discoverSystemManifests } from '@/lib/discoverSystems.js';
import { getQueryClient } from '@/lib/getQueryClient.js';
import { AuthenticatedLanding } from '@/components/landing/AuthenticatedLanding.js';
import { SilentAuthCheck } from '@/components/landing/SilentAuthCheck.js';
import { UnauthenticatedLanding } from '@/components/landing/UnauthenticatedLanding.js';

/** Props for the LandingContent server component. */
export interface LandingContentProps {
    /** Promise resolving to the dynamic route params containing the locale. */
    params: Promise<{ locale: string }>;
}

/**
 * Server component that reads the Auth0 session at runtime and renders
 * the correct landing experience — authenticated (with prefetched account data)
 * or unauthenticated (with auth links).
 *
 * @param props - Component props containing route params.
 * @returns The rendered landing content.
 */
export async function LandingContent({ params }: LandingContentProps): Promise<React.ReactElement> {
    const { locale } = await params;
    setRequestLocale(locale);

    const [session, manifests] = await Promise.all([auth0?.getSession() ?? null, discoverSystemManifests()]);

    const isAuthenticated = session !== null && session !== undefined;

    if (isAuthenticated && session.user && session.tokenSet?.accessToken) {
        const authorization = `Bearer ${session.tokenSet.accessToken as string}`;
        const userId = session.user[INTERNAL_ID_CLAIM] as string | undefined;

        if (!userId) {
            // Graceful re-auth: redirect to login instead of logout to avoid an
            // infinite loop when the claim is temporarily missing (e.g. stale session).
            return <meta httpEquiv="refresh" content="0;url=/auth/login" />;
        }

        const queryClient = getQueryClient();
        await queryClient.prefetchQuery(queryAccount(authorization, { userId }));
        const dehydratedState = dehydrate(queryClient);

        return (
            <HydrationBoundary state={dehydratedState}>
                <AuthenticatedLanding userId={userId} manifests={manifests} locale={locale} />
            </HydrationBoundary>
        );
    }

    return (
        <>
            <SilentAuthCheck />
            <UnauthenticatedLanding manifests={manifests} locale={locale} />
        </>
    );
}
