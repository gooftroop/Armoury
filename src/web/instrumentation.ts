import * as Sentry from '@sentry/nextjs';

/**
 * Registers Sentry instrumentation for the appropriate Next.js runtime.
 * Called once by Next.js during server startup.
 */
export async function register(): Promise<void> {
    if (process.env['NEXT_RUNTIME'] === 'nodejs') {
        await import('./sentry.server.config');
    }

    if (process.env['NEXT_RUNTIME'] === 'edge') {
        await import('./sentry.edge.config');
    }
}

/** Captures server-side request errors from Server Components, middleware, and proxies. */
export const onRequestError = Sentry.captureRequestError;
