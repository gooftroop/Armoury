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
