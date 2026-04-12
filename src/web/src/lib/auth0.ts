/**
 * Auth0 client singleton for server-side authentication.
 *
 * Configures the Auth0 SDK for Next.js 15 App Router. Environment variables
 * (AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET, AUTH0_AUDIENCE,
 * APP_BASE_URL) must be set in `.env.local`. See `.env.local.example` for reference.
 *
 * The `beforeSessionSaved` hook preserves the custom `internal_id` claim
 * (injected by the Auth0 Post-Login Action) which would otherwise be stripped
 * by the SDK's default ID-token filtering or lost during token refresh.
 *
 * @requirements
 * 1. Must export a singleton Auth0Client instance (or null when unconfigured) for server-side auth operations.
 * 2. Must use environment variables for all Auth0 configuration (no hardcoded values).
 * 3. Must export isAuth0Configured() so consumers can branch without crashing.
 * 4. Must preserve the `https://armoury.app/internal_id` custom claim in session.user via beforeSessionSaved.
 * 5. Must export INTERNAL_ID_CLAIM constant for consistent claim key access across web client code.
 * 6. Must actively extract the internal_id from the raw ID token JWT during both initial login and token refresh.
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
 * Extract a claim from a raw JWT string by base64url-decoding the payload.
 *
 * The ID token has already been cryptographically validated by the SDK before
 * `beforeSessionSaved` is called, so we only need to decode — not verify.
 *
 * @param idToken - The raw JWT string (header.payload.signature).
 * @param claim   - The claim key to extract.
 * @returns The claim value, or undefined if the token is malformed or the claim is absent.
 */
function extractClaimFromJwt(idToken: string, claim: string): string | undefined {
    try {
        const parts = idToken.split('.');

        if (parts.length !== 3 || !parts[1]) {
            return undefined;
        }

        const payload: unknown = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

        if (typeof payload !== 'object' || payload === null) {
            return undefined;
        }

        const value = (payload as Record<string, unknown>)[claim];

        return typeof value === 'string' ? value : undefined;
    } catch {
        return undefined;
    }
}

/**
 * Returns true when all required Auth0 environment variables are set.
 *
 * Checked at module load so consumers can branch instead of crashing.
 */
export function isAuth0Configured(): boolean {
    const domain = process.env['AUTH0_DOMAIN'];
    const clientId = process.env['AUTH0_CLIENT_ID'];
    const secret = process.env['AUTH0_SECRET'];

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
 *
 * On token refresh the SDK may overwrite `session.user` with fresh ID-token claims
 * before invoking this hook. We therefore read the claim directly from the raw JWT
 * (already validated by the SDK) to guarantee it is always present.
 */
export const auth0: Auth0Client | null = isAuth0Configured()
    ? new Auth0Client({
          authorizationParameters: {
              audience: process.env['AUTH0_AUDIENCE'],
          },
          session: {
              rolling: true,
              absoluteDuration: 60 * 60 * 24 * 30, // 30 days
              inactivityDuration: 60 * 60 * 24 * 7, // 7 days
          },
          async beforeSessionSaved(session, idToken) {
              // 1. Try the raw ID token first — this is the authoritative source and
              //    works reliably on both initial login and rolling-session refresh.
              const fromToken = idToken ? extractClaimFromJwt(idToken, INTERNAL_ID_CLAIM) : undefined;

              // 2. Fall back to whatever the SDK already placed on session.user
              //    (covers the edge case where idToken is null).
              const internalId = fromToken ?? (session.user[INTERNAL_ID_CLAIM] as string | undefined);

              return {
                  ...session,
                  user: {
                      ...session.user,
                      [INTERNAL_ID_CLAIM]: internalId,
                  },
              };
          },
      })
    : null;
