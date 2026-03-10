/**
 * Configuration for the campaigns client.
 */

/** Base URL for the campaigns REST API, sourced from the environment. */
export const CAMPAIGNS_BASE_URL = process.env['CAMPAIGNS_BASE_URL'] ?? 'http://localhost:3000';
