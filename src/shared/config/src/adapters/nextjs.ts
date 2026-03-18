/**
 * Next.js configuration adapter.
 *
 * Reads NEXT_PUBLIC_*_BASE_URL and NEXT_PUBLIC_*_WS_URL from process.env,
 * falling back to defaults for any missing values.
 *
 * In production and preview builds, these are set via .env.production
 * (with dotenv-expand variable expansion for preview sandbox URLs).
 * In development, they come from .env.development or .env.local.
 * The Vercel dashboard overrides .env.production values for production.
 */

import type { AppConfig } from '../schema.js';
import { defaults } from '../schema.js';

function env(key: string): string | undefined {
    return process.env[key];
}

export const config: AppConfig = {
    services: {
        users: {
            apiBaseUrl: env('NEXT_PUBLIC_USERS_BASE_URL') ?? defaults.services.users.apiBaseUrl,
        },
        friends: {
            apiBaseUrl: env('NEXT_PUBLIC_FRIENDS_BASE_URL') ?? defaults.services.friends.apiBaseUrl,
            wsBaseUrl: env('NEXT_PUBLIC_FRIENDS_WS_URL') ?? defaults.services.friends.wsBaseUrl,
        },
        matches: {
            apiBaseUrl: env('NEXT_PUBLIC_MATCHES_BASE_URL') ?? defaults.services.matches.apiBaseUrl,
            wsBaseUrl: env('NEXT_PUBLIC_MATCHES_WS_URL') ?? defaults.services.matches.wsBaseUrl,
        },
        campaigns: {
            apiBaseUrl: env('NEXT_PUBLIC_CAMPAIGNS_BASE_URL') ?? defaults.services.campaigns.apiBaseUrl,
        },
    },
};
