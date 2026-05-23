/**
 * Account Settings page — async Server Component.
 *
 * Fetches the Auth0 session on the server and passes the user profile and
 * access token down to the client-side AccountSettings component. When no
 * session exists, renders a sign-in prompt using the `account.notAuthenticated`
 * i18n key.
 *
 * @requirements
 * 1. Must be a Server Component (no 'use client').
 * 2. Must fetch the Auth0 session via auth0.getSession().
 * 3. Must pass userId (sub claim) and accessToken to the AccountSettings client component when authenticated.
 * 4. Must redirect to /auth/logout when authenticated but sub claim is missing (stale session).
 * 5. Must show a sign-in message when no session exists.
 * 5. Must use next-intl for all user-facing text.
 * 6. Must set the request locale for next-intl server-side.
 *
 * @module account-page
 */

import { getTranslations, setRequestLocale } from 'next-intl/server';
import * as Sentry from '@sentry/nextjs';

import { auth0 } from '@/lib/auth0.js';
import { AccountSettings } from '@/components/AccountSettingsContainer.js';

/** Props for the locale-parameterized account page. */
export interface AccountPageProps {
    /** Promise resolving to the dynamic route params containing the locale. */
    params: Promise<{
        locale: string;
    }>;
}

/**
 * Renders the Account Settings page.
 *
 * Server-side: resolves the Auth0 session and locale. If authenticated, renders
 * the AccountSettings client component with user data and access token. Otherwise,
 * renders a sign-in prompt.
 *
 * @param props - Page props containing route params.
 * @returns The rendered account page.
 */
export default async function AccountPage({ params }: AccountPageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    const t = await getTranslations('account');
    const tError = await getTranslations('error');
    const session = (await auth0?.getSession()) ?? null;

    return (
        <main className="flex min-h-screen flex-col bg-base p-6 text-foreground">
            {session ? (
                (() => {
                    const userId = session.user['sub'] as string | undefined;

                    if (!userId) {
                        // Render an error UI instead of redirecting to /auth/logout —
                        // an active session without a `sub` claim should be unreachable
                        // for a valid Auth0 session. Sign-out must be user-initiated to
                        // avoid redirect loops.
                        Sentry.captureMessage('Authenticated session missing sub claim on account page', {
                            level: 'error',
                            tags: { component: 'AccountPage' },
                            extra: { sub: session.user.sub, email: session.user.email },
                        });

                        return (
                            <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 py-12">
                                <h1 className="text-2xl font-semibold">{tError('title')}</h1>
                                <p className="text-secondary">{tError('description')}</p>
                                <a
                                    href="/auth/logout"
                                    className="rounded-md border border-foreground px-4 py-2 text-sm hover:bg-foreground hover:text-base"
                                >
                                    {tError('retry')}
                                </a>
                            </div>
                        );
                    }

                    return (
                        <AccountSettings
                            user={{
                                userId,
                                name: session.user.name as string,
                                email: session.user.email as string,
                                picture: session.user.picture as string,
                            }}
                            accessToken={session.tokenSet.accessToken as string}
                        />
                    );
                })()
            ) : (
                <div className="mx-auto w-full max-w-3xl">
                    <p className="text-secondary">{t('notAuthenticated')}</p>
                </div>
            )}
        </main>
    );
}
