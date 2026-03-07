/**
 * Auth0 client singleton for server-side authentication.
 *
 * Configures the Auth0 SDK for Next.js 15 App Router. Environment variables
 * (AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET, APP_BASE_URL)
 * must be set in `.env.local`. See `.env.local.example` for reference.
 *
 * @requirements
 * 1. Must export a singleton Auth0Client instance for server-side auth operations.
 * 2. Must use environment variables for all Auth0 configuration (no hardcoded values).
 *
 * @module auth0
 */

import { Auth0Client } from '@auth0/nextjs-auth0/server';

/**
 * Server-side Auth0 client instance.
 *
 * Provides methods for authentication, session management, and route protection.
 * Import this wherever server-side auth is needed (middleware, server components, route handlers).
 */
export const auth0 = new Auth0Client();
