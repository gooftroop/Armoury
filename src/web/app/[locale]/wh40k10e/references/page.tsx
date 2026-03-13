/**
 * @requirements
 * 1. Must render the References page content placeholder.
 */

import { getTranslations, setRequestLocale } from 'next-intl/server';

export interface ReferencesPageProps {
    params: Promise<{
        locale: string;
    }>;
}

/** Renders the References page. */
export default async function ReferencesPage({ params }: ReferencesPageProps) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('nav');

    return (
        <div className="flex flex-1 flex-col p-6">
            <h1 className="text-3xl font-bold text-primary">{t('references')}</h1>
        </div>
    );
}
