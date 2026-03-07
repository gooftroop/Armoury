'use client';

import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';
import { useEffect } from 'react';

/** Global error boundary that captures unhandled errors and reports them to Sentry. */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
    useEffect(() => {
        Sentry.captureException(error);
    }, [error]);

    return (
        <html>
            <body>
                <NextError statusCode={0} />
            </body>
        </html>
    );
}
