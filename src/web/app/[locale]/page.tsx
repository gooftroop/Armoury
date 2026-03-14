/**
 * Landing page — server component that discovers game systems and renders the system selector.
 *
 * Fetches available game system manifests from the filesystem and the current Auth0 session,
 * then delegates rendering of interactive tiles to the client-side SystemGrid component.
 * Auth links are conditionally shown when no session exists.
 *
 * @requirements
 * 1. Must be a Server Component (no 'use client').
 * 2. Must discover game system manifests via discoverSystemManifests().
 * 3. Must check Auth0 session via auth0.getSession().
 * 4. Must render SystemGrid with manifests and isAuthenticated props.
 * 5. Must show auth links only when the user is not authenticated.
 * 6. Must use next-intl for all user-facing text.
 * 7. Must match the layout from mockups/01-landing.html.
 *
 * @module landing-page
 */

import { getTranslations, setRequestLocale } from 'next-intl/server';

import { auth0 } from '@/lib/auth0.js';
import { discoverSystemManifests } from '@/lib/discoverSystems.js';
import { SystemGrid } from '@/components/SystemGrid.js';

/** Props for the locale-parameterized landing page. */
export interface LandingPageProps {
    params: Promise<{ locale: string }>;
}

/** Renders the landing page with dynamic game system tiles and conditional auth links. */
export default async function LandingPage({ params }: LandingPageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    const t = await getTranslations('landing');
    const [session, manifests] = await Promise.all([auth0?.getSession() ?? null, discoverSystemManifests()]);

    const isAuthenticated = session !== null && session !== undefined;

    return (
        <main className="flex min-h-[100dvh] flex-col items-center justify-center p-6 md:p-8">
            <h1 className="mb-2 font-display text-4xl font-bold uppercase tracking-[0.12em] text-primary md:text-5xl lg:text-6xl">
                {t('logo')}
            </h1>
            <p className="mb-12 tracking-wide text-secondary">{t('tagline')}</p>

            <SystemGrid manifests={manifests} isAuthenticated={isAuthenticated} />

            {!isAuthenticated && (
                <>
                    <div className="flex items-center gap-2 text-sm text-secondary">
                        <span>Already have an account?</span>
                        <a
                            href="/auth/login"
                            className="font-medium text-accent-secondary hover:text-accent-secondary-hover"
                        >
                            Sign In
                        </a>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-secondary">
                        <span>New here?</span>
                        <a
                            href="/auth/login?screen_hint=signup"
                            className="font-medium text-accent-secondary hover:text-accent-secondary-hover"
                        >
                            Create an Account
                        </a>
                    </div>
                </>
            )}

            <div className="mt-8 px-6 text-center">
                <p className="mx-auto max-w-[480px] text-[11px] leading-relaxed text-tertiary opacity-60">
                    {t('legal')}
                </p>
            </div>
        </main>
    );
}
