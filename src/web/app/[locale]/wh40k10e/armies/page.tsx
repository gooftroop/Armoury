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
 * 3. Must pass userId (internal_id claim) to ForgeContainer when authenticated.
 * 4. Must redirect to /auth/logout when no session exists or internal_id claim is missing (stale session).
 * 5. Must use next-intl for locale setup.
 * 6. Must set the request locale for next-intl server-side.
 */

import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { auth0, INTERNAL_ID_CLAIM } from '@/lib/auth0.js';
import { ForgeContainer } from '@/components/forge/index.js';

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

    const userId = session.user[INTERNAL_ID_CLAIM] as string | undefined;

    if (!userId) {
        redirect('/auth/logout');
    }

    return (
        <div className="flex flex-1 flex-col p-6">
            <ForgeContainer userId={userId} />
        </div>
    );
}
