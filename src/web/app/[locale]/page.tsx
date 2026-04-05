/**
 * Landing page — dynamic server-rendered page that delegates to LandingContent.
 *
 * This page must render dynamically (not statically) because LandingContent reads
 * the Auth0 session cookie to determine authentication state. Static generation
 * would freeze the page as unauthenticated since no cookies exist at build time.
 *
 * LandingContent is an async server component wrapped in <Suspense> so the browser
 * sees a skeleton shell while the Auth0 session check and manifest discovery resolve.
 *
 * @requirements
 * 1. Must be a Server Component (no 'use client').
 * 2. Must delegate auth-dependent rendering to LandingContent.
 * 3. Must render the static shell (heading, tagline, legal disclaimer).
 * 4. Must use next-intl for all user-facing text.
 * 5. Must match the layout from mockups/01-landing.html.
 * 6. Must use text-highlight for the h1 heading color (bronze/copper).
 * 7. Must use text-foreground for the legal disclaimer (white, prominent).
 * 8. Must wrap LandingContent in Suspense with LandingSkeleton fallback.
 * 9. Must use relative positioning on main for ProfileTile absolute placement.
 *
 * @module landing-page
 */

import { getTranslations, setRequestLocale } from 'next-intl/server';

import { LandingContent } from '@/components/landing/LandingContent.js';

/**
 * Forces dynamic rendering so auth0.getSession() reads cookies at request time.
 * Without this, generateStaticParams() in the layout causes Next.js to statically
 * generate this page at build time (when no session cookie exists), freezing it
 * as the unauthenticated view.
 */
export const dynamic = 'force-dynamic';

/** Props for the locale-parameterized landing page. */
export interface LandingPageProps {
    params: Promise<{ locale: string }>;
}

/** Renders the landing page with a static shell and dynamic auth-aware content. */
export default async function LandingPage({ params }: LandingPageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    const t = await getTranslations('landing');

    return (
        <main className="relative flex min-h-[100dvh] flex-col items-center justify-center p-6 md:p-8">
            <h1 className="mb-2 font-display text-4xl font-bold uppercase tracking-[0.12em] text-highlight md:text-5xl lg:text-6xl">
                {t('logo')}
            </h1>
            <p className="mb-8 tracking-wide text-tertiary">{t('tagline')}</p>

            <LandingContent params={params} />

            <div className="mt-8 px-6 text-center">
                <p className="mx-auto max-w-[480px] text-[11px] leading-relaxed text-foreground">{t('legal')}</p>
            </div>
        </main>
    );
}
