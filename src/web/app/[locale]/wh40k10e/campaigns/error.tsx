'use client';

/**
 * @requirements
 * 1. Must render an error boundary for the route segment.
 * 2. Must log the error.
 */

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

export interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

/** Error boundary component. */
export default function ErrorBoundary({ error, reset }: ErrorProps) {
    const t = useTranslations('error');

    useEffect(() => {
        // Log to console or error tracking service
        console.error('Route segment error:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
            <h2 className="mb-2 text-2xl font-bold text-destructive">{t('title')}</h2>
            <p className="mb-6 text-muted-foreground">{t('description')}</p>
            <button
                onClick={reset}
                className="rounded-md bg-accent-primary px-4 py-2 text-sm font-semibold text-inverse transition-colors hover:bg-accent-primary-hover"
            >
                {t('retry')}
            </button>
        </div>
    );
}
