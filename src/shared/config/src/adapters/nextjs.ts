/**
 * Next.js configuration adapter.
 *
 * Reads NEXT_PUBLIC_*_BASE_URL and NEXT_PUBLIC_*_WS_URL from process.env,
 * falling back to defaults for any missing values.
 *
 * IMPORTANT: All env var reads use static string literals (process.env.NEXT_PUBLIC_X)
 * so that Next.js / webpack DefinePlugin can inline them at build time.
 * Dynamic access like process.env[key] is NOT replaced and will be undefined
 * in the client bundle.
 *
 * In production and preview builds, these are set via .env.production
 * (with dotenv-expand variable expansion for preview sandbox URLs).
 * In development, they come from .env.development or .env.local.
 * The Vercel dashboard overrides .env.production values for production.
 */

import type { AppConfig } from '../schema.js';
import { defaults } from '../schema.js';

export const config: AppConfig = {
    services: {
        users: {
            apiBaseUrl: process.env.NEXT_PUBLIC_USERS_BASE_URL ?? defaults.services.users.apiBaseUrl,
        },
        friends: {
            apiBaseUrl: process.env.NEXT_PUBLIC_FRIENDS_BASE_URL ?? defaults.services.friends.apiBaseUrl,
            wsBaseUrl: process.env.NEXT_PUBLIC_FRIENDS_WS_URL ?? defaults.services.friends.wsBaseUrl,
        },
        matches: {
            apiBaseUrl: process.env.NEXT_PUBLIC_MATCHES_BASE_URL ?? defaults.services.matches.apiBaseUrl,
            wsBaseUrl: process.env.NEXT_PUBLIC_MATCHES_WS_URL ?? defaults.services.matches.wsBaseUrl,
        },
        campaigns: {
            apiBaseUrl: process.env.NEXT_PUBLIC_CAMPAIGNS_BASE_URL ?? defaults.services.campaigns.apiBaseUrl,
        },
    },
};
