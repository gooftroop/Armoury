/**
 * Shared constants for e2e tests.
 *
 * Extracted here so both auth/setup.ts (a test file) and fixtures/localstack.ts
 * can reference them without Playwright's "test files must not import other
 * test files" restriction.
 *
 * @requirements
 * 1. Must export E2E_USER_ID matching the seeded Postgres user.
 * 2. Must export E2E_USER_SUB matching the Auth0 sub in the forged session.
 * 3. Must export E2E_ACCOUNT_ID matching the seeded Postgres account.
 */

/** Must match the seeded user in LocalStack (see e2e/fixtures/localstack.ts). */
export const E2E_USER_ID = 'e2e-test-user-00000000-0000-0000-0000-000000000001';

export const E2E_USER_SUB = 'auth0|e2e-test-user';

export const E2E_ACCOUNT_ID = 'e2e-test-account-00000000-0000-0000-0000-000000000001';
