/**
 * @requirements
 * - resolveUser returns existing user when found
 * - resolveUser JIT-provisions user+account when sub matches caller and id is valid Auth0 sub
 * - resolveUser uses real claims when present, placeholders otherwise
 * - resolveUser returns null when caller sub does not match path id
 * - resolveUser returns null when id is not a valid Auth0 sub
 * - resolveUser returns null when userContext is absent (unauthenticated path)
 *
 * Test plan:
 * - existing user passthrough → no writes
 * - JIT with full claims → real email/name persisted
 * - JIT with missing claims → placeholder email/name persisted
 * - mismatched sub → no JIT, returns null
 * - non-Auth0-shaped id → no JIT, returns null
 * - missing userContext → no JIT, returns null
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { MockDatabaseAdapter } from '@/__mocks__/MockDatabaseAdapter.js';
import type { User, UserContext } from '@/types.js';
import { resolveUser } from '@/utils/resolveUser.js';

const SUB = 'auth0|6a110d592651e920b35812aa';

const fullContext: UserContext = {
    userId: SUB,
    email: 'real@example.com',
    name: 'Real Name',
};

describe('resolveUser', () => {
    let adapter: MockDatabaseAdapter;

    beforeEach(() => {
        adapter = new MockDatabaseAdapter();
    });

    it('returns existing user without provisioning', async () => {
        const existing: User = {
            id: SUB,
            email: 'existing@example.com',
            name: 'Existing',
            picture: null,
            accountId: 'acct-1',
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
        };
        await adapter.put('user', existing);

        const result = await resolveUser(adapter, SUB, fullContext);

        expect(result).toEqual(existing);
        expect(await adapter.getAll('account')).toHaveLength(0);
    });

    it('JIT-provisions user and account with real claims', async () => {
        const result = await resolveUser(adapter, SUB, fullContext);

        expect(result).not.toBeNull();
        expect(result?.id).toBe(SUB);
        expect(result?.email).toBe('real@example.com');
        expect(result?.name).toBe('Real Name');
        expect(result?.accountId).toBeTruthy();

        const accounts = await adapter.getAll('account');
        expect(accounts).toHaveLength(1);
        expect(accounts[0]?.userId).toBe(SUB);
        expect(accounts[0]?.id).toBe(result?.accountId);
    });

    it('JIT-provisions with placeholder identity when claims absent', async () => {
        const result = await resolveUser(adapter, SUB, { userId: SUB });

        expect(result?.email).toBe(`pending+${SUB}@armoury-app.com`);
        expect(result?.name).toBe('Pending User');
    });

    it('returns null when caller sub does not match requested id', async () => {
        const result = await resolveUser(adapter, SUB, { ...fullContext, userId: 'auth0|other' });

        expect(result).toBeNull();
        expect(await adapter.getAll('user')).toHaveLength(0);
        expect(await adapter.getAll('account')).toHaveLength(0);
    });

    it('returns null for non-Auth0-shaped id', async () => {
        const badId = 'not-an-auth0-sub';
        const result = await resolveUser(adapter, badId, { userId: badId });

        expect(result).toBeNull();
        expect(await adapter.getAll('user')).toHaveLength(0);
    });

    it('returns null when userContext is absent', async () => {
        const result = await resolveUser(adapter, SUB);

        expect(result).toBeNull();
        expect(await adapter.getAll('user')).toHaveLength(0);
    });

    it('accepts non-auth0 strategies (google-oauth2, samlp)', async () => {
        const googleSub = 'google-oauth2|1234567890';
        const result = await resolveUser(adapter, googleSub, { userId: googleSub });

        expect(result).not.toBeNull();
        expect(result?.id).toBe(googleSub);
    });
});
