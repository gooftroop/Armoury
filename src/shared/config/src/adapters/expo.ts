/**
 * Expo configuration adapter.
 *
 * Reads EXPO_PUBLIC_*_BASE_URL and EXPO_PUBLIC_*_WS_URL from process.env,
 * falling back to defaults for any missing values.
 */

import type { AppConfig } from '../schema.js';
import { defaults } from '../schema.js';

function env(key: string): string | undefined {
    return process.env[key];
}

export const config: AppConfig = {
    services: {
        users: {
            apiBaseUrl: env('EXPO_PUBLIC_USERS_BASE_URL') ?? defaults.services.users.apiBaseUrl,
        },
        friends: {
            apiBaseUrl: env('EXPO_PUBLIC_FRIENDS_BASE_URL') ?? defaults.services.friends.apiBaseUrl,
            wsBaseUrl: env('EXPO_PUBLIC_FRIENDS_WS_URL') ?? defaults.services.friends.wsBaseUrl,
        },
        matches: {
            apiBaseUrl: env('EXPO_PUBLIC_MATCHES_BASE_URL') ?? defaults.services.matches.apiBaseUrl,
            wsBaseUrl: env('EXPO_PUBLIC_MATCHES_WS_URL') ?? defaults.services.matches.wsBaseUrl,
        },
        campaigns: {
            apiBaseUrl: env('EXPO_PUBLIC_CAMPAIGNS_BASE_URL') ?? defaults.services.campaigns.apiBaseUrl,
        },
    },
};
