import * as Sentry from '@sentry/nextjs';
// replayIntegration is a browser-only export. @sentry/nextjs v10 unified types
// omit it because @sentry/browser ships without .d.ts files, breaking the
// re-export chain (@sentry/nextjs → @sentry/react → @sentry/browser).
// Import directly from the internal replay package which has proper types.
import { replayIntegration } from '@sentry-internal/replay';

Sentry.init({
    dsn: process.env['NEXT_PUBLIC_SENTRY_DSN'],
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [replayIntegration()],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
