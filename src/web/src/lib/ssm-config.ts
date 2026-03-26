/**
 * In-memory AWS SSM Parameter Store loader for web build-time configuration.
 *
 * This module fetches required secrets during CI builds and injects them into
 * process.env without writing any .env files to disk.
 */

import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

/**
 * @requirements
 * 1. Must load secrets from AWS SSM Parameter Store only during CI builds.
 * 2. Must skip fetching when AWS credentials are unavailable.
 * 3. Must not overwrite already-provided environment variables.
 * 4. Must set fetched values in process.env in-memory only.
 * 5. Must gracefully handle ParameterNotFound and credential-related errors.
 * 6. Must avoid repeated fetch attempts within a single build process.
 */

interface ParameterMapping {
    readonly envVar: string;
    readonly path: string;
}

const PARAMETER_MAP: readonly ParameterMapping[] = [
    // Global parameters (shared across services)
    { envVar: 'SENTRY_AUTH_TOKEN', path: '/armoury/global/sentry-auth-token' },
    { envVar: 'GITHUB_TOKEN', path: '/armoury/global/github-token' },

    // Web-specific parameters
    { envVar: 'SENTRY_DSN', path: '/armoury/web/sentry-dsn' },
    { envVar: 'NEXT_PUBLIC_SENTRY_DSN', path: '/armoury/web/sentry-dsn' },
];

let loaded = false;

interface ErrorLike {
    readonly name?: string;
    readonly message?: string;
}

function getErrorName(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'name' in error) {
        return String((error as ErrorLike).name);
    }

    return 'UnknownError';
}

function getErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'message' in error) {
        return String((error as ErrorLike).message);
    }

    return 'Unknown error';
}

function isCredentialError(error: unknown): boolean {
    const name = getErrorName(error);

    return name === 'ExpiredTokenException' || name === 'AccessDeniedException' || name === 'CredentialsProviderError';
}

/**
 * Loads required SSM-backed secrets into process.env for CI builds.
 *
 * @returns Resolves when loading is complete or intentionally skipped.
 */
export async function loadSSMSecrets(): Promise<void> {
    if (loaded) {
        console.log('[ssm-config] Secrets already loaded, skipping re-run.');

        return;
    }

    if (!process.env['CI']) {
        console.log('[ssm-config] CI is not set; skipping SSM fetch for local development.');

        return;
    }

    if (!process.env['AWS_ACCESS_KEY_ID'] || !process.env['AWS_SECRET_ACCESS_KEY']) {
        console.warn('[ssm-config] AWS credentials missing; skipping SSM secret fetch.');

        return;
    }

    loaded = true;

    const region = process.env['AWS_REGION'] || 'us-east-1';
    const client = new SSMClient({ region });

    console.log(`[ssm-config] Fetching SSM secrets in region ${region}.`);

    for (const parameter of PARAMETER_MAP) {
        if (process.env[parameter.envVar]) {
            console.log(`[ssm-config] ${parameter.envVar} already set; skipping SSM fetch.`);
            continue;
        }

        try {
            const response = await client.send(
                new GetParameterCommand({
                    Name: parameter.path,
                    WithDecryption: true,
                }),
            );

            const value = response.Parameter?.Value;

            if (!value) {
                console.warn(`[ssm-config] ${parameter.path} returned no value; skipping ${parameter.envVar}.`);
                continue;
            }

            process.env[parameter.envVar] = value;
            console.log(`[ssm-config] Loaded ${parameter.envVar} from ${parameter.path}.`);
        } catch (error: unknown) {
            if (getErrorName(error) === 'ParameterNotFound') {
                console.warn(`[ssm-config] Parameter not found: ${parameter.path}.`);
                continue;
            }

            if (isCredentialError(error)) {
                console.warn(
                    `[ssm-config] Credential error (${getErrorName(error)}) while fetching ${parameter.path}: ${getErrorMessage(error)}. Skipping remaining SSM fetches.`,
                );

                return;
            }

            throw error;
        }
    }
}
