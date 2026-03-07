import * as Sentry from '@sentry/nextjs';

/** Initializes Sentry on the Edge runtime. */
Sentry.init({
    dsn: process.env['SENTRY_DSN'],
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
});
