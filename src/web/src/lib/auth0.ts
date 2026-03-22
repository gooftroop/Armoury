/**
 * Auth0 client singleton for server-side authentication.
 *
 * Configures the Auth0 SDK for Next.js 15 App Router. Environment variables
 * (AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET, AUTH0_AUDIENCE,
 * APP_BASE_URL) must be set in `.env.local`. See `.env.local.example` for reference.
 *
 * @requirements
 * 1. Must export a singleton Auth0Client instance (or null when unconfigured) for server-side auth operations.
 * 2. Must use environment variables for all Auth0 configuration (no hardcoded values).
 * 3. Must export isAuth0Configured() so consumers can branch without crashing.
 *
 * @module auth0
 */

import { Auth0Client } from '@auth0/nextjs-auth0/server';

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
 */
export const auth0: Auth0Client | null = isAuth0Configured()
    ? new Auth0Client({
          authorizationParameters: {
              audience: process.env['AUTH0_AUDIENCE'],
          },
      })
    : null;
