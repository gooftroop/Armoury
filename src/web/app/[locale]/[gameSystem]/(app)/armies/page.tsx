/**
 * @requirements
 * 1. Must render the Armies page content placeholder.
 */

import { getTranslations, setRequestLocale } from 'next-intl/server';

export interface ArmiesPageProps {
    params: Promise<{
        locale: string;
        gameSystem: string;
    }>;
}

/** Renders the Armies page. */
export default async function ArmiesPage({ params }: ArmiesPageProps) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('nav');

    return (
        <div className="flex flex-1 flex-col p-6">
            <h1 className="text-3xl font-bold text-primary">{t('armies')}</h1>
        </div>
    );
}
