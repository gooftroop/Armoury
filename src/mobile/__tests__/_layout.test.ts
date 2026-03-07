import { describe, expect, it } from 'vitest';
import RootLayout from '@mobile/app/_layout.js';

/**
 * Test Plan for _layout.tsx
 *
 * Source: src/mobile/app/_layout.tsx
 *
 * Requirement 1: Component export
 *   - Test: exports a default component
 */
describe('RootLayout', () => {
    it('exports a default component', () => {
        expect(RootLayout).toBeDefined();
        expect(typeof RootLayout).toBe('function');
    });
});
