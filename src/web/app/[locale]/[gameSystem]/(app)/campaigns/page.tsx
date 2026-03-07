/**
 * @requirements
 * 1. Must render the Campaigns page content placeholder.
 */

import { getTranslations, setRequestLocale } from 'next-intl/server';

export interface CampaignsPageProps {
    params: Promise<{
        locale: string;
        gameSystem: string;
    }>;
}

/** Renders the Campaigns page. */
export default async function CampaignsPage({ params }: CampaignsPageProps) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('nav');

    return (
        <div className="flex flex-1 flex-col p-6">
            <h1 className="text-3xl font-bold text-primary">{t('campaigns')}</h1>
        </div>
    );
}
