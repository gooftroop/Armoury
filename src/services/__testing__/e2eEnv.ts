/**
 * Shared AWS/LocalStack environment variables for e2e test configurations.
 *
 * Centralizes the env block that every service vitest.e2e.config.ts needs,
 * so new variables are added in one place instead of duplicated per service.
 *
 * @module e2eEnv
 */

/**
 * @requirements
 * - REQ-E2E-ENV: Centralize AWS/LocalStack env vars shared across all service e2e test configs
 * - REQ-SINGLE-SOURCE: Ensure new env vars are added in one place, not duplicated per service
 */

/** AWS environment variables targeting the local LocalStack instance for e2e tests. */
export const e2eEnv: Record<string, string> = {
    AWS_ENDPOINT_URL: 'http://localhost:4566',
    AWS_ACCESS_KEY_ID: 'test',
    AWS_SECRET_ACCESS_KEY: 'test',
    AWS_REGION: 'us-east-1',
    IS_LOCAL: 'true',
};
