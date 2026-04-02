import * as Sentry from '@sentry/aws-serverless';

/**
 * Initializes Sentry for the authorizer Lambda function.
 * Loaded via NODE_OPTIONS before the handler module is imported.
 *
 * When SENTRY_DSN is empty or unset (e.g. local development), Sentry is
 * silently disabled — no errors, no network calls.
 */
const dsn = process.env['SENTRY_DSN'];

if (dsn) {
    Sentry.init({
        dsn,
        tracesSampleRate: 1.0,
        sendDefaultPii: true,
        enableLogs: true,
        environment: process.env['SENTRY_ENVIRONMENT'] ?? 'development',
        release: process.env['SENTRY_RELEASE'],
    });
}
