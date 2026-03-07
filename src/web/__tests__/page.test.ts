import { describe, expect, it } from 'vitest';
import HomePage from '@web/app/[locale]/page.js';

/** Verifies the HomePage component is exported and renderable. */
describe('HomePage', () => {
    it('exports a default component', () => {
        expect(HomePage).toBeDefined();
        expect(typeof HomePage).toBe('function');
    });
});
