/**
 * @requirements
 * 1. Must render the Social page content placeholder.
 */

import { getTranslations, setRequestLocale } from 'next-intl/server';

export interface SocialPageProps {
    params: Promise<{
        locale: string;
        gameSystem: string;
    }>;
}

/** Renders the Social page. */
export default async function SocialPage({ params }: SocialPageProps) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('nav');

    return (
        <div className="flex flex-1 flex-col p-6">
            <h1 className="text-3xl font-bold text-primary">{t('social')}</h1>
        </div>
    );
}
