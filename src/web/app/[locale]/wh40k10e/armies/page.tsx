/**
 * Armies (The Forge) page — async Server Component.
 *
 * Fetches the Auth0 session on the server and renders the ForgeContainer
 * client component with the authenticated user's ID. When no session exists,
 * redirects to the Auth0 login page.
 *
 * @requirements
 * 1. Must be a Server Component (no 'use client').
 * 2. Must fetch the Auth0 session via auth0.getSession().
 * 3. Must pass userId (sub claim) to ForgeContainer when authenticated.
 * 4. Must redirect to /auth/logout when no session exists or sub claim is missing (stale session).
 * 5. Must use next-intl for locale setup.
 * 6. Must set the request locale for next-intl server-side.
 */

import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import * as Sentry from '@sentry/nextjs';

import { auth0 } from '@/lib/auth0.js';
import { ForgeContainer } from '@/components/ForgeContainer.js';

export interface ArmiesPageProps {
    params: Promise<{
        locale: string;
    }>;
}

/**
 * Renders the Armies (Forge) page.
 *
 * Server-side: resolves the Auth0 session and locale. If authenticated, renders
 * the ForgeContainer client component with the user's ID. Otherwise, redirects
 * to Auth0 login.
 *
 * @param props - Page props containing route params.
 * @returns The rendered Forge page.
 */
export default async function ArmiesPage({ params }: ArmiesPageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    const session = (await auth0?.getSession()) ?? null;

    if (!session) {
        redirect('/auth/login');
    }

    const userId = session.user['sub'] as string | undefined;

    if (!userId) {
        // Render an error UI instead of redirecting to /auth/logout — an active
        // session without internal_id indicates a broken Auth0 Post-Login Action,
        // not a stale session. Sign-out must be user-initiated to avoid redirect loops.
        Sentry.captureMessage('Authenticated session missing internal_id claim on armies page', {
            level: 'error',
            tags: { component: 'ArmiesPage' },
            extra: { sub: session.user.sub, email: session.user.email },
        });

        const t = await getTranslations('error');

        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
                <h1 className="text-2xl font-semibold">{t('title')}</h1>
                <p className="text-secondary">{t('description')}</p>
                <a
                    href="/auth/logout"
                    className="rounded-md border border-foreground px-4 py-2 text-sm hover:bg-foreground hover:text-base"
                >
                    {t('retry')}
                </a>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col p-6">
            <ForgeContainer userId={userId} />
        </div>
    );
}
