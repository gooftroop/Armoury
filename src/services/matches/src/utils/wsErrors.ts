/**
 * Structured WebSocket error capture for the matches service.
 *
 * Wraps Sentry.captureException with WebSocket-specific context tags
 * so errors in CloudWatch and Sentry dashboards carry connection,
 * route, and user metadata for rapid triage.
 */

import * as Sentry from '@sentry/aws-serverless';

/**
 * Identifies the subsystem that produced a WebSocket error.
 *
 * Mirrors the client-side `WebSocketErrorSource` taxonomy adapted
 * for AWS API Gateway Lambda handlers.
 */
export type WsErrorSource =
    | 'adapter:init'
    | 'auth:extract'
    | 'broadcast:send'
    | 'db:operation'
    | 'message:parse'
    | 'route:not-found'
    | 'validation:message';

/** Contextual metadata attached to every captured WebSocket error. */
export interface WsErrorContext {
    /** API Gateway connection ID. */
    connectionId?: string;

    /** WebSocket route key ($connect, $disconnect, updateMatch, etc.). */
    routeKey?: string;

    /** Authenticated user ID, when available. */
    userId?: string;

    /** Additional context fields (e.g. operation name, store, matchId). */
    [key: string]: unknown;
}

/**
 * Captures a WebSocket error to Sentry with structured context.
 *
 * Sets tags for `ws.error.source`, `ws.connectionId`, and `ws.routeKey`
 * so Sentry issue grouping and search work across all WebSocket errors.
 * The full context object is attached as a Sentry context block for
 * detailed inspection in the issue detail view.
 *
 * @param error - The error instance to capture.
 * @param source - Subsystem that produced the error.
 * @param context - Optional metadata for connection, route, and user.
 */
export function captureWsError(error: Error, source: WsErrorSource, context?: WsErrorContext): void {
    Sentry.withScope((scope) => {
        scope.setTag('ws.error.source', source);

        if (context?.connectionId) {
            scope.setTag('ws.connectionId', context.connectionId);
        }

        if (context?.routeKey) {
            scope.setTag('ws.routeKey', context.routeKey);
        }

        if (context?.userId) {
            scope.setUser({ id: context.userId });
        }

        if (context) {
            scope.setContext('ws_error', context);
        }

        Sentry.captureException(error);
    });
}
