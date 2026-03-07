/**
 * @requirements
 * 1. Must render the Matches page content placeholder.
 */

import { getTranslations, setRequestLocale } from 'next-intl/server';

export interface MatchesPageProps {
    params: Promise<{
        locale: string;
        gameSystem: string;
    }>;
}

/** Renders the Matches page. */
export default async function MatchesPage({ params }: MatchesPageProps) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('nav');

    return (
        <div className="flex flex-1 flex-col p-6">
            <h1 className="text-3xl font-bold text-primary">{t('matches')}</h1>
        </div>
    );
}
