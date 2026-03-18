// ---------------------------------------------------------------------------
// Sandbox URL injection for Vercel preview deployments.
//
// VERCEL_ENV and VERCEL_GIT_PULL_REQUEST_ID are available at build time.
// Mutating process.env before the config export ensures Next.js's DefinePlugin
// picks up NEXT_PUBLIC_* vars and inlines them into client bundles.
// ---------------------------------------------------------------------------
if (process.env['VERCEL_ENV'] === 'preview' && process.env['VERCEL_GIT_PULL_REQUEST_ID']) {
    const prId = process.env['VERCEL_GIT_PULL_REQUEST_ID'];
    const restBase = `https://pr-${prId}.api.sandbox.armoury-app.com`;
    const wsBase = `wss://ws-sandbox.armoury-app.com`;

    process.env['NEXT_PUBLIC_USERS_BASE_URL'] ??= `${restBase}/users`;
    process.env['NEXT_PUBLIC_FRIENDS_BASE_URL'] ??= `${restBase}/friends`;
    process.env['NEXT_PUBLIC_FRIENDS_WS_URL'] ??= `${wsBase}/pr-${prId}-friends`;
    process.env['NEXT_PUBLIC_MATCHES_BASE_URL'] ??= `${restBase}/matches`;
    process.env['NEXT_PUBLIC_MATCHES_WS_URL'] ??= `${wsBase}/pr-${prId}-matches`;
    process.env['NEXT_PUBLIC_CAMPAIGNS_BASE_URL'] ??= `${restBase}/campaigns`;
}

import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
    eslint: { ignoreDuringBuilds: true },
    productionBrowserSourceMaps: true,
    webpack(config, { isServer, nextRuntime }) {
        // Align webpack's client target with the project's .browserslistrc config.
        // Next.js defaults to 'es6' which triggers false warnings for top-level await
        // even though our browserslist targets (Chrome 109+) fully support ES2022+.
        if (!isServer) {
            config.target = ['web', 'browserslist'];
        }

        // Suppress Edge Runtime warning for @auth0/nextjs-auth0 v4.
        // dpopUtils.js statically imports Node's 'crypto' but uses Web Crypto
        // at runtime — the import is dead code in the edge bundle. The warning
        // is emitted by Next.js's middleware-plugin during parsing (before
        // resolve.fallback can intercept it), so ignoreWarnings is the only fix.
        // See: https://github.com/auth0/nextjs-auth0/issues/2517
        if (nextRuntime === 'edge') {
            config.ignoreWarnings = [...(config.ignoreWarnings ?? []), { module: /@auth0\/nextjs-auth0/ }];
        }

        config.resolve.plugins = [
            ...(config.resolve.plugins ?? []),
            new TsconfigPathsPlugin({ extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'] }),
        ];
        config.resolve.extensionAlias = {
            ...config.resolve.extensionAlias,
            '.js': ['.ts', '.tsx', '.js', '.jsx'],
        };
        return config;
    },
};

export default withSentryConfig(withNextIntl(nextConfig), {
    org: process.env['SENTRY_ORG'],
    project: process.env['SENTRY_PROJECT'],
    silent: !process.env['CI'],
    telemetry: false,
});
