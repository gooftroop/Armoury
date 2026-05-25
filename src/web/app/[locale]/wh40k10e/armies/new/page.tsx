/**
 * Create Army page for the WH40K 10e Forge flow.
 *
 * Async Server Component that resolves the Auth0 session and locale, then
 * renders the CreateArmyContainer client component. Redirects to login when
 * unauthenticated, mirroring the Forge list page.
 *
 * @requirements
 * 1. Must be a Server Component (no 'use client').
 * 2. Must fetch the Auth0 session via auth0.getSession().
 * 3. Must redirect to /auth/login when no session exists.
 * 4. Must set the request locale for next-intl server-side.
 * 5. Must render the CreateArmyContainer with the authenticated userId and locale.
 */

import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { auth0 } from '@/lib/auth0.js';
import { CreateArmyContainer } from '@/components/CreateArmyContainer.js';

export interface CreateArmyPageProps {
    params: Promise<{
        locale: string;
    }>;
}

/** Renders the Create Army page. */
export default async function CreateArmyPage({ params }: CreateArmyPageProps) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('armyCreation');

    const session = (await auth0?.getSession()) ?? null;

    if (!session) {
        redirect('/auth/login');
    }

    const userId = session.user.sub;

    return (
        <div className="flex flex-1 flex-col gap-4 p-6">
            <header className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
            </header>

            <CreateArmyContainer userId={userId} locale={locale} />
        </div>
    );
}
