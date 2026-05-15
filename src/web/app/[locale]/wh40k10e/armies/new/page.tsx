/**
 * Create Army page shell for the WH40K 10e Forge flow.
 *
 * Renders the route scaffold that T4 will compose with the actual form
 * container. Keeps the route reachable without wiring mutation logic yet.
 *
 * @requirements
 * 1. Must be a Server Component.
 * 2. Must set the request locale for next-intl server-side.
 * 3. Must render a placeholder shell for the Create Army page.
 * 4. Must not implement form or container logic.
 */

import { getTranslations, setRequestLocale } from 'next-intl/server';

export interface CreateArmyPageProps {
    params: Promise<{
        locale: string;
    }>;
}

/** Renders the Create Army page shell. */
export default async function CreateArmyPage({ params }: CreateArmyPageProps) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('armyCreation');

    return (
        <div className="flex flex-1 flex-col gap-4 p-6">
            <header className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
            </header>

            <div className="min-h-64 rounded-lg border border-dashed border-border-subtle bg-muted/20 p-6" />
        </div>
    );
}
