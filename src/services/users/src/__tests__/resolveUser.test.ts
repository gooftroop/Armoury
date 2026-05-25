/**
 * @requirements
 * - resolveUser returns existing user when found
 * - resolveUser JIT-provisions user+account when sub matches caller
 * - resolveUser uses real claims when present, placeholders otherwise
 * - resolveUser returns null when caller sub does not match path id
 * - resolveUser returns null when userContext is absent (unauthenticated path)
 * - resolveUser wraps JIT writes in adapter.transaction
 * - resolveUser is idempotent under race: if user appears mid-transaction, returns raced user without double-writing
 * - resolveUser reuses an existing account row when the user row is missing (e.g., after partial failure)
 * - account id is deterministic from userId so concurrent JIT calls converge on one account
 *
 * Test plan:
 * - existing user passthrough → no writes
 * - JIT with full claims → real email/name persisted
 * - JIT with missing claims → placeholder email/name persisted
 * - mismatched sub → no JIT, returns null
 * - missing userContext → no JIT, returns null
 * - JIT path invokes adapter.transaction exactly once
 * - race: user inserted between outer check and txn body → no account written, raced user returned
 * - orphaned account (user missing) → user created with same accountId, no duplicate accounts
 * - deterministic account id from userId
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

    it('determines account id from userId deterministically', async () => {
        const result = await resolveUser(adapter, SUB, fullContext);

        expect(result).not.toBeNull();
        expect(result?.accountId).toMatch(/^[a-f0-9]{24}$/);

        const result2 = await resolveUser(adapter, SUB, fullContext);
        expect(result2?.accountId).toBe(result?.accountId);
    });

    it('reuses existing account when user row is missing (orphaned account)', async () => {
        const existingAccount = {
            id: 'orphan-acct-id',
            userId: SUB,
            preferences: { theme: 'dark' as const, language: 'en', notificationsEnabled: false },
            systems: {},
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
        };

        await adapter.put('account', existingAccount);

        const result = await resolveUser(adapter, SUB, fullContext);

        expect(result).not.toBeNull();
        expect(result?.accountId).toBe('orphan-acct-id');
        expect(await adapter.getAll('account')).toHaveLength(1);
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

    it('wraps JIT provisioning writes in adapter.transaction', async () => {
        const txnSpy = vi.spyOn(adapter, 'transaction');

        await resolveUser(adapter, SUB, fullContext);

        expect(txnSpy).toHaveBeenCalledTimes(1);
    });

    it('is idempotent when a concurrent caller provisions the user mid-transaction', async () => {
        const raced: User = {
            id: SUB,
            email: 'raced@example.com',
            name: 'Raced',
            picture: null,
            accountId: 'acct-raced',
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
        };

        // Simulate a parallel JIT insert happening between the outer check and
        // the txn body by injecting the user inside the transaction wrapper.
        const realTxn = adapter.transaction.bind(adapter);
        vi.spyOn(adapter, 'transaction').mockImplementation(async (fn) => {
            await adapter.put('user', raced);

            return realTxn(fn);
        });

        const result = await resolveUser(adapter, SUB, fullContext);

        expect(result).toEqual(raced);
        expect(await adapter.getAll('account')).toHaveLength(0);
        expect(await adapter.getAll('user')).toHaveLength(1);
    });
});
