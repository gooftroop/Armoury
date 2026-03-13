/**
 * @requirements
 * 1. Must render a loading skeleton for the route segment.
 */

import { useTranslations } from 'next-intl';

/** Renders a loading skeleton. */
export default function Loading() {
    const t = useTranslations('loading');

    return (
        <div className="flex h-full w-full items-center justify-center p-6">
            <div className="text-muted-foreground animate-pulse">{t('default')}</div>
        </div>
    );
}
