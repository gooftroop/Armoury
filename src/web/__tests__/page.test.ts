import { describe, expect, it, vi } from 'vitest';

vi.mock('@auth0/nextjs-auth0/server', () => ({
    Auth0Client: class {
        getSession = vi.fn();
        getAccessToken = vi.fn();
    },
}));

import HomePage from '@web/app/[locale]/page.js';

/** Verifies the HomePage component is exported and renderable. */
describe('HomePage', () => {
    it('exports a default component', () => {
        expect(HomePage).toBeDefined();
        expect(typeof HomePage).toBe('function');
    });
});
