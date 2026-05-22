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
 * 3. Must use session.user.sub as the canonical user identifier.
 * 4. Must redirect to /auth/login when authenticated but sub claim is missing.
 * 5. Must discover game system manifests via discoverSystemManifests().
 * 6. Must prefetch account data via React Query when authenticated.
 * 7. Must wrap authenticated path in HydrationBoundary with dehydrated state.
 * 8. Must render AuthenticatedLanding for logged-in users.
 * 9. Must render UnauthenticatedLanding for anonymous users.
 * 10. Must set the request locale for next-intl server-side.
 *
 * @module landing-content
 */

import { getTranslations, setRequestLocale } from 'next-intl/server';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import * as Sentry from '@sentry/nextjs';

import { queryAccount } from '@armoury/clients-users';

import { auth0 } from '@/lib/auth0.js';
import { discoverSystemManifests } from '@/lib/discoverSystems.js';
import { getQueryClient } from '@armoury/query';
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
        const userId = session.user['sub'] as string | undefined;

        if (!userId) {
            // The session exists but lacks internal_id — almost always a misconfigured
            // Auth0 Post-Login Action. Render an error UI instead of redirecting,
            // because redirecting to /auth/login on an active session is what caused
            // the post-signup infinite loop. Sign-out must be user-initiated.
            Sentry.captureMessage('Authenticated session missing internal_id claim on landing', {
                level: 'error',
                tags: { component: 'LandingContent' },
                extra: { sub: session.user.sub, email: session.user.email },
            });

            const t = await getTranslations('error');

            return (
                <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-base p-6 text-foreground">
                    <h1 className="text-2xl font-semibold">{t('title')}</h1>
                    <p className="text-secondary">{t('description')}</p>
                    <a
                        href="/auth/logout"
                        className="rounded-md border border-foreground px-4 py-2 text-sm hover:bg-foreground hover:text-base"
                    >
                        {t('retry')}
                    </a>
                </main>
            );
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
