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
 * 3. Must pass user and accessToken to the AccountSettings client component when authenticated.
 * 4. Must show a sign-in message when no session exists.
 * 5. Must use next-intl for all user-facing text.
 * 6. Must set the request locale for next-intl server-side.
 *
 * @module account-page
 */

import { getTranslations, setRequestLocale } from 'next-intl/server';

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
    const session = (await auth0?.getSession()) ?? null;

    return (
        <main className="flex min-h-screen flex-col bg-base p-6 text-foreground">
            {session ? (
                <AccountSettings
                    user={{
                        sub: session.user.sub as string,
                        name: session.user.name as string,
                        email: session.user.email as string,
                        picture: session.user.picture as string,
                    }}
                    accessToken={session.tokenSet.accessToken as string}
                />
            ) : (
                <div className="mx-auto w-full max-w-3xl">
                    <p className="text-secondary">{t('notAuthenticated')}</p>
                </div>
            )}
        </main>
    );
}
