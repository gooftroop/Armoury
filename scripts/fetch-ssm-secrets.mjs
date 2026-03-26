/**
 * Fetches secrets from AWS SSM Parameter Store and writes them to a .env file
 * for consumption by the build process.
 *
 * Usage:
 *   node scripts/fetch-ssm-secrets.mjs --env <environment> --output <file>
 *
 * Environment determines the SSM path prefix:
 *   - "production" → /armoury/production/...
 *   - "preview"    → /armoury/sandbox/...
 *   - "development" → skipped (uses local .env)
 *
 * Requires AWS credentials in the environment (AWS_ACCESS_KEY_ID,
 * AWS_SECRET_ACCESS_KEY, and optionally AWS_REGION).
 *
 * @requirements
 * 1. Must fetch secrets from SSM Parameter Store using @aws-sdk/client-ssm.
 * 2. Must support global parameters (shared across all services).
 * 3. Must support app-specific parameters (e.g., web sentry DSN).
 * 4. Must write fetched secrets as KEY=VALUE lines to the specified output file.
 * 5. Must mask secrets in CI logs by emitting ::add-mask:: directives.
 * 6. Must exit gracefully when AWS credentials are not available.
 * 7. Must not overwrite existing environment variables — SSM values are fallbacks.
 */

import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

/**
 * SSM parameter definitions.
 * Each entry maps an environment variable name to an SSM parameter path template.
 * The `{env}` placeholder is replaced with the resolved environment name.
 */
const PARAMETER_MAP = {
    global: [
        { envVar: 'SENTRY_AUTH_TOKEN', path: '/armoury/global/sentry-auth-token' },
        { envVar: 'GITHUB_TOKEN', path: '/armoury/global/github-token' },
    ],
    web: [
        { envVar: 'SENTRY_DSN', path: '/armoury/web/sentry-dsn' },
        { envVar: 'NEXT_PUBLIC_SENTRY_DSN', path: '/armoury/web/sentry-dsn' },
    ],
};

/**
 * Fetches a single SSM parameter value.
 *
 * @param {SSMClient} client - The SSM client instance.
 * @param {string} name - The SSM parameter name (full path).
 * @returns {Promise<string | null>} The parameter value, or null if not found.
 */
async function getParameter(client, name) {
    try {
        const response = await client.send(
            new GetParameterCommand({ Name: name, WithDecryption: true }),
        );

        return response.Parameter?.Value ?? null;
    } catch (error) {
        if (error.name === 'ParameterNotFound') {
            console.warn(`⚠ SSM parameter not found: ${name}`);

            return null;
        }

        // Credentials or permission errors — warn but don't fail the build
        if (
            error.name === 'ExpiredTokenException' ||
            error.name === 'AccessDeniedException' ||
            error.name === 'CredentialsProviderError'
        ) {
            console.warn(`⚠ AWS credentials error fetching ${name}: ${error.message}`);

            return null;
        }

        throw error;
    }
}

/**
 * Masks a value in CI logs using GitHub Actions ::add-mask:: syntax.
 *
 * @param {string} value - The value to mask.
 */
function maskInCI(value) {
    if (process.env['CI']) {
        console.log(`::add-mask::${value}`);
    }
}

/**
 * Parses CLI arguments.
 *
 * @returns {{ env: string, output: string, app: string }} Parsed arguments.
 */
function parseCliArgs() {
    const { values } = parseArgs({
        options: {
            env: { type: 'string', default: 'preview' },
            output: { type: 'string', default: '.env.ssm' },
            app: { type: 'string', default: 'web' },
        },
    });

    return {
        env: values.env ?? 'preview',
        output: values.output ?? '.env.ssm',
        app: values.app ?? 'web',
    };
}

async function main() {
    const args = parseCliArgs();

    // Skip for local development
    if (args.env === 'development') {
        console.log('ℹ Skipping SSM fetch for development environment');
        process.exit(0);
    }

    // Validate AWS credentials are available
    if (!process.env['AWS_ACCESS_KEY_ID'] || !process.env['AWS_SECRET_ACCESS_KEY']) {
        console.warn('⚠ AWS credentials not found — skipping SSM secret fetch');
        process.exit(0);
    }

    const region = process.env['AWS_REGION'] || 'us-east-1';
    const client = new SSMClient({ region });

    console.log(`🔑 Fetching SSM secrets for env=${args.env}, app=${args.app}, region=${region}`);

    /** @type {Array<{ key: string, value: string }>} */
    const results = [];

    // Fetch global parameters
    for (const param of PARAMETER_MAP.global) {
        // Don't overwrite existing env vars
        if (process.env[param.envVar]) {
            console.log(`  ✓ ${param.envVar} — already set, skipping SSM fetch`);
            continue;
        }

        const value = await getParameter(client, param.path);

        if (value) {
            maskInCI(value);
            results.push({ key: param.envVar, value });
            console.log(`  ✓ ${param.envVar} — fetched from ${param.path}`);
        } else {
            console.log(`  ✗ ${param.envVar} — not found at ${param.path}`);
        }
    }

    // Fetch app-specific parameters
    const appParams = PARAMETER_MAP[args.app];

    if (appParams) {
        for (const param of appParams) {
            if (process.env[param.envVar]) {
                console.log(`  ✓ ${param.envVar} — already set, skipping SSM fetch`);
                continue;
            }

            const value = await getParameter(client, param.path);

            if (value) {
                maskInCI(value);
                results.push({ key: param.envVar, value });
                console.log(`  ✓ ${param.envVar} — fetched from ${param.path}`);
            } else {
                console.log(`  ✗ ${param.envVar} — not found at ${param.path}`);
            }
        }
    }

    if (results.length === 0) {
        console.log('ℹ No SSM secrets fetched — build will use existing env vars only');
        process.exit(0);
    }

    // Write to output file
    const envContent = results.map(({ key, value }) => `${key}=${value}`).join('\n') + '\n';
    writeFileSync(args.output, envContent, 'utf8');
    console.log(`✅ Wrote ${results.length} secret(s) to ${args.output}`);
}

main().catch((error) => {
    console.error('❌ Failed to fetch SSM secrets:', error.message);
    // Don't fail the build — secrets are optional (Sentry will just be disabled)
    process.exit(0);
});
