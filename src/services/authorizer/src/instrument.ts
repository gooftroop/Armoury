import * as Sentry from '@sentry/aws-serverless';

/**
 * Initializes Sentry for the authorizer Lambda function.
 * Loaded via NODE_OPTIONS before the handler module is imported.
 */
Sentry.init({
    dsn: process.env['SENTRY_DSN'],
    tracesSampleRate: 1.0,
    environment: process.env['SENTRY_ENVIRONMENT'] ?? 'development',
});
