/**
 * Playwright fixture barrel — central import for all E2E tests.
 *
 * Re-exports the extended `test` and `expect` so spec files import from
 * one place and gain access to all custom fixtures.
 *
 * @requirements
 * - REQ-E2E-FIXTURES-01: Single import point for test + expect
 * - REQ-E2E-FIXTURES-02: Extensible — new fixtures compose here
 */

export { test, expect } from '@playwright/test';
