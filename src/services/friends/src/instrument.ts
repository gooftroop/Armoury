import * as Sentry from '@sentry/aws-serverless';

Sentry.init({
    dsn: process.env['SENTRY_DSN'],
    tracesSampleRate: 1.0,
    sendDefaultPii: true,
    enableLogs: true,
    environment: process.env['SENTRY_ENVIRONMENT'] ?? 'development',
    release: process.env['SENTRY_RELEASE'],
});
