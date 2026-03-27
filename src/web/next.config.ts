import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';

// ---------------------------------------------------------------------------
// SSM secret loader (inlined to avoid next.config.ts import-alias limitation)
// See: https://github.com/vercel/next.js/issues/74140
// ---------------------------------------------------------------------------

interface ParameterMapping {
    readonly envVar: string;
    readonly path: string;
}

const PARAMETER_MAP: readonly ParameterMapping[] = [
    { envVar: 'SENTRY_AUTH_TOKEN', path: '/armoury/global/sentry-auth-token' },
    { envVar: 'GITHUB_TOKEN', path: '/armoury/global/github-token' },
    { envVar: 'SENTRY_DSN', path: '/armoury/web/sentry-dsn' },
    { envVar: 'NEXT_PUBLIC_SENTRY_DSN', path: '/armoury/web/sentry-dsn' },
];

let ssmSecretsLoaded = false;

async function loadSSMSecrets(): Promise<void> {
    if (ssmSecretsLoaded) return;

    if (!process.env['CI']) {
        console.log('[ssm-config] CI is not set; skipping SSM fetch for local development.');
        return;
    }

    if (!process.env['AWS_ACCESS_KEY_ID'] || !process.env['AWS_SECRET_ACCESS_KEY']) {
        console.warn('[ssm-config] AWS credentials missing; skipping SSM secret fetch.');
        return;
    }

    ssmSecretsLoaded = true;

    const region = process.env['AWS_REGION'] || 'us-east-1';

    // Dynamic import so the AWS SDK is only loaded when credentials are available.
    const { GetParameterCommand, SSMClient } = await import('@aws-sdk/client-ssm');
    const client = new SSMClient({ region });

    console.log(`[ssm-config] Fetching SSM secrets in region ${region}.`);

    for (const parameter of PARAMETER_MAP) {
        if (process.env[parameter.envVar]) {
            console.log(`[ssm-config] ${parameter.envVar} already set; skipping SSM fetch.`);
            continue;
        }

        try {
            const response = await client.send(new GetParameterCommand({ Name: parameter.path, WithDecryption: true }));
            const value = response.Parameter?.Value;

            if (!value) {
                console.warn(`[ssm-config] ${parameter.path} returned no value; skipping ${parameter.envVar}.`);
                continue;
            }

            process.env[parameter.envVar] = value;
            console.log(`[ssm-config] Loaded ${parameter.envVar} from ${parameter.path}.`);
        } catch (error: unknown) {
            const name =
                typeof error === 'object' && error !== null && 'name' in error
                    ? String((error as { name?: string }).name)
                    : 'UnknownError';

            if (name === 'ParameterNotFound') {
                console.warn(`[ssm-config] Parameter not found: ${parameter.path}.`);
                continue;
            }

            if (
                name === 'ExpiredTokenException' ||
                name === 'AccessDeniedException' ||
                name === 'CredentialsProviderError'
            ) {
                const msg =
                    typeof error === 'object' && error !== null && 'message' in error
                        ? String((error as { message?: string }).message)
                        : 'Unknown error';
                console.warn(
                    `[ssm-config] Credential error (${name}) while fetching ${parameter.path}: ${msg}. Skipping remaining SSM fetches.`,
                );
                return;
            }

            throw error;
        }
    }
}

// ---------------------------------------------------------------------------

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Wrap in an async function to avoid top-level await.
// Next.js compiles next.config.ts to CJS via require(); Node 24 rejects
// require() on ESM graphs with top-level await (ERR_REQUIRE_ASYNC_MODULE).
// An async default export is the supported escape hatch.
export default async function config(): Promise<NextConfig> {
    // Ensure SSM secrets are loaded before Next/Sentry config reads process.env values.
    await loadSSMSecrets();

    const nextConfig: NextConfig = {
        eslint: { ignoreDuringBuilds: true },
        typescript: {
            tsconfigPath: 'tsconfig.build.json',
        },
        productionBrowserSourceMaps: process.env['NODE_ENV'] !== 'production',
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

    return withSentryConfig(withNextIntl(nextConfig), {
        org: process.env['SENTRY_ORG'],
        project: process.env['SENTRY_PROJECT'],
        silent: !process.env['CI'],
        telemetry: false,
    });
}
