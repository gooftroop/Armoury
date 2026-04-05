/**
 * Auth0 client singleton for server-side authentication.
 *
 * Configures the Auth0 SDK for Next.js 15 App Router. Environment variables
 * (AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET, AUTH0_AUDIENCE,
 * APP_BASE_URL) must be set in `.env.local`. See `.env.local.example` for reference.
 *
 * The `beforeSessionSaved` hook preserves the custom `internal_id` claim
 * (injected by the Auth0 Post-Login Action) which would otherwise be stripped
 * by the SDK's default ID-token filtering.
 *
 * @requirements
 * 1. Must export a singleton Auth0Client instance (or null when unconfigured) for server-side auth operations.
 * 2. Must use environment variables for all Auth0 configuration (no hardcoded values).
 * 3. Must export isAuth0Configured() so consumers can branch without crashing.
 * 4. Must preserve the `https://armoury.app/internal_id` custom claim in session.user via beforeSessionSaved.
 * 5. Must export INTERNAL_ID_CLAIM constant for consistent claim key access across web client code.
 *
 * @module auth0
 */

import { Auth0Client } from '@auth0/nextjs-auth0/server';

/**
 * Custom claim namespace for the internal user identifier.
 *
 * Matches the claim key set by the Auth0 Post-Login Action. Consumers use this
 * constant to read the internal user ID from `session.user`.
 */
export const INTERNAL_ID_CLAIM = 'https://armoury.app/internal_id' as const;

/**
 * Returns true when all required Auth0 environment variables are set.
 *
 * Checked at module load so consumers can branch instead of crashing.
 */
export function isAuth0Configured(): boolean {
    const domain = process.env['AUTH0_DOMAIN'];
    const clientId = process.env['AUTH0_CLIENT_ID'];
    const secret = process.env['AUTH0_SECRET'];

    console.error(
        `[E2E-DIAG] isAuth0Configured: domain=${!!domain}, clientId=${!!clientId}, secret=${!!secret}, result=${Boolean(domain && clientId && secret)}`,
    );

    return Boolean(domain && clientId && secret);
}

/**
 * Server-side Auth0 client instance, or null when Auth0 is not configured.
 *
 * Provides methods for authentication, session management, and route protection.
 * Import this wherever server-side auth is needed (middleware, server components, route handlers).
 * When null, callers must skip auth operations gracefully.
 *
 * The `beforeSessionSaved` hook ensures the custom `internal_id` claim from the
 * ID token survives the SDK's default claim filtering and is available on
 * `session.user[INTERNAL_ID_CLAIM]` for all downstream consumers.
 */
export const auth0: Auth0Client | null = isAuth0Configured()
    ? new Auth0Client({
          authorizationParameters: {
              audience: process.env['AUTH0_AUDIENCE'],
          },
          async beforeSessionSaved(session) {
              return {
                  ...session,
                  user: {
                      ...session.user,
                      [INTERNAL_ID_CLAIM]: session.user[INTERNAL_ID_CLAIM] as string | undefined,
                  },
              };
          },
      })
    : null;
