import { beforeEach, describe, expect, it } from 'vitest';
import type { User, UserContext } from '@users/src/types.js';
import { createUser, listUsers, getUser, updateUser, deleteUser } from '@users/src/routes/users.js';
import { MockDatabaseAdapter } from '@users/src/__mocks__/MockDatabaseAdapter.js';

const baseUserContext: UserContext = {
    sub: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
};

describe('user routes', () => {
    let adapter: MockDatabaseAdapter;

    beforeEach(() => {
        adapter = new MockDatabaseAdapter();
    });

    describe('createUser', () => {
        it('returns 201 with valid body', async () => {
            const response = await createUser(
                adapter,
                { sub: 'auth0|user-1', email: 'user@test.com', name: 'Test', picture: null },
                null,
                baseUserContext,
            );

            expect(response.statusCode).toBe(201);
            const payload = JSON.parse(response.body) as User;

            expect(payload.id).toEqual(expect.any(String));
            expect(payload.sub).toBe('auth0|user-1');
            expect(payload.email).toBe('user@test.com');
            expect(payload.name).toBe('Test');
            expect(payload.picture).toBeNull();
            expect(payload.createdAt).toEqual(expect.any(String));
            expect(payload.updatedAt).toEqual(expect.any(String));
        });

        it('returns 400 when body is null', async () => {
            const response = await createUser(adapter, null, null, baseUserContext);

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body)).toMatchObject({ error: 'ValidationError' });
        });

        it('returns 400 when required fields are missing', async () => {
            const response = await createUser(
                adapter,
                { sub: 'auth0|user-1' },
                null,
                baseUserContext,
            );

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body)).toMatchObject({ error: 'ValidationError' });
        });
    });

    describe('listUsers', () => {
        it('returns 200 with empty array', async () => {
            const response = await listUsers(adapter, null, null, baseUserContext);

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.body)).toEqual([]);
        });

        it('returns 200 with users after adding some', async () => {
            await createUser(
                adapter,
                { sub: 'auth0|user-1', email: 'a@test.com', name: 'User A', picture: null },
                null,
                baseUserContext,
            );
            await createUser(
                adapter,
                { sub: 'auth0|user-2', email: 'b@test.com', name: 'User B', picture: null },
                null,
                baseUserContext,
            );

            const response = await listUsers(adapter, null, null, baseUserContext);
            const payload = JSON.parse(response.body) as User[];

            expect(response.statusCode).toBe(200);
            expect(payload).toHaveLength(2);
        });
    });

    describe('getUser', () => {
        it('returns 200 with user', async () => {
            const createResponse = await createUser(
                adapter,
                { sub: 'auth0|user-1', email: 'user@test.com', name: 'Test', picture: null },
                null,
                baseUserContext,
            );
            const created = JSON.parse(createResponse.body) as User;

            const response = await getUser(adapter, null, { id: created.id }, baseUserContext);
            const payload = JSON.parse(response.body) as User;

            expect(response.statusCode).toBe(200);
            expect(payload.id).toBe(created.id);
            expect(payload.email).toBe('user@test.com');
        });

        it('returns 400 when id is missing (pathParameters null)', async () => {
            const response = await getUser(adapter, null, null, baseUserContext);

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body)).toMatchObject({ error: 'ValidationError' });
        });

        it('returns 404 when not found', async () => {
            const response = await getUser(adapter, null, { id: 'missing' }, baseUserContext);

            expect(response.statusCode).toBe(404);
            expect(JSON.parse(response.body)).toMatchObject({ error: 'NotFound' });
        });
    });

    describe('updateUser', () => {
        it('returns 200 with updated fields', async () => {
            const createResponse = await createUser(
                adapter,
                { sub: 'auth0|user-1', email: 'user@test.com', name: 'Test', picture: null },
                null,
                baseUserContext,
            );
            const created = JSON.parse(createResponse.body) as User;

            const response = await updateUser(
                adapter,
                { email: 'new@test.com', name: 'Updated' },
                { id: created.id },
                baseUserContext,
            );
            const payload = JSON.parse(response.body) as User;

            expect(response.statusCode).toBe(200);
            expect(payload.email).toBe('new@test.com');
            expect(payload.name).toBe('Updated');
        });

        it('returns 400 when body is null', async () => {
            const response = await updateUser(adapter, null, { id: 'user-1' }, baseUserContext);

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body)).toMatchObject({ error: 'ValidationError' });
        });

        it('returns 400 when no updates provided', async () => {
            const response = await updateUser(adapter, {}, { id: 'user-1' }, baseUserContext);

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body)).toMatchObject({ error: 'ValidationError' });
        });

        it('returns 404 when not found', async () => {
            const response = await updateUser(
                adapter,
                { email: 'new@test.com' },
                { id: 'missing' },
                baseUserContext,
            );

            expect(response.statusCode).toBe(404);
            expect(JSON.parse(response.body)).toMatchObject({ error: 'NotFound' });
        });

        it('returns 400 when id is missing', async () => {
            const response = await updateUser(
                adapter,
                { email: 'new@test.com' },
                null,
                baseUserContext,
            );

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body)).toMatchObject({ error: 'ValidationError' });
        });
    });

    describe('deleteUser', () => {
        it('returns 204', async () => {
            const createResponse = await createUser(
                adapter,
                { sub: 'auth0|user-1', email: 'user@test.com', name: 'Test', picture: null },
                null,
                baseUserContext,
            );
            const created = JSON.parse(createResponse.body) as User;

            const response = await deleteUser(adapter, null, { id: created.id }, baseUserContext);

            expect(response.statusCode).toBe(204);
            expect(response.body).toBe('');
            await expect(adapter.get('user', created.id)).resolves.toBeNull();
        });

        it('returns 400 when id is missing', async () => {
            const response = await deleteUser(adapter, null, null, baseUserContext);

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body)).toMatchObject({ error: 'ValidationError' });
        });

        it('returns 404 when not found', async () => {
            const response = await deleteUser(adapter, null, { id: 'missing' }, baseUserContext);

            expect(response.statusCode).toBe(404);
            expect(JSON.parse(response.body)).toMatchObject({ error: 'NotFound' });
        });
    });
});
