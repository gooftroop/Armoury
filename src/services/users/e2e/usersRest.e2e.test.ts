import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Account, CreateAccountPayload, CreateUserPayload, User, UserContext } from '@users/src/types.js';
import { router } from '@users/src/router.js';
import { createE2EAdapter, resetDatabase } from '@users/src/__testing__/e2eAdapter.js';
import type { LocalDatabaseAdapter } from '@users/src/utils/localAdapter.js';

let adapter: LocalDatabaseAdapter;

const userContext: UserContext = { sub: 'user-sub-1', email: 'test@armoury.dev', name: 'Test User' };

const createUserBody: CreateUserPayload = {
    sub: 'user-sub-1',
    email: 'test@armoury.dev',
    name: 'Test User',
    picture: null,
};

const createAccountBody: CreateAccountPayload = {
    preferences: {
        theme: 'dark',
        language: 'en',
        notificationsEnabled: true,
    },
};

function restEvent(method: string, resource: string, body?: unknown, pathParameters?: Record<string, string>) {
    return {
        httpMethod: method,
        path: resource,
        resource,
        body: body !== undefined ? JSON.stringify(body) : null,
        pathParameters: pathParameters ?? null,
    };
}

beforeAll(async () => {
    adapter = await createE2EAdapter();
});

afterAll(async () => {
    await resetDatabase(adapter);
});

describe('users REST e2e', () => {
    beforeEach(async () => {
        await resetDatabase(adapter);
    });

    it('creates a user and returns 201', async () => {
        const res = await router(restEvent('POST', '/users', createUserBody), adapter, userContext);

        expect(res.statusCode).toBe(201);
        const user = JSON.parse(res.body) as User;
        expect(user.name).toBe('Test User');
        expect(user.email).toBe('test@armoury.dev');
        expect(user.sub).toBe('user-sub-1');
        expect(user.id).toBeTruthy();
    });

    it('lists users', async () => {
        await router(restEvent('POST', '/users', createUserBody), adapter, userContext);
        await router(
            restEvent('POST', '/users', { ...createUserBody, sub: 'user-sub-2', name: 'Second User' }),
            adapter,
            userContext,
        );

        const res = await router(restEvent('GET', '/users'), adapter, userContext);
        expect(res.statusCode).toBe(200);
        const users = JSON.parse(res.body) as User[];
        expect(users.length).toBeGreaterThanOrEqual(2);
    });

    it('gets a user by id', async () => {
        const createRes = await router(restEvent('POST', '/users', createUserBody), adapter, userContext);
        const created = JSON.parse(createRes.body) as User;

        const getRes = await router(
            restEvent('GET', '/users/{id}', undefined, { id: created.id }),
            adapter,
            userContext,
        );

        expect(getRes.statusCode).toBe(200);
        const fetched = JSON.parse(getRes.body) as User;
        expect(fetched.id).toBe(created.id);
    });

    it('updates a user', async () => {
        const createRes = await router(restEvent('POST', '/users', createUserBody), adapter, userContext);
        const created = JSON.parse(createRes.body) as User;

        const updateRes = await router(
            restEvent('PUT', '/users/{id}', { name: 'Updated Name', email: 'updated@armoury.dev' }, { id: created.id }),
            adapter,
            userContext,
        );

        expect(updateRes.statusCode).toBe(200);
        const updated = JSON.parse(updateRes.body) as User;
        expect(updated.name).toBe('Updated Name');
        expect(updated.email).toBe('updated@armoury.dev');
    });

    it('deletes a user', async () => {
        const createRes = await router(restEvent('POST', '/users', createUserBody), adapter, userContext);
        const created = JSON.parse(createRes.body) as User;

        const deleteRes = await router(
            restEvent('DELETE', '/users/{id}', undefined, { id: created.id }),
            adapter,
            userContext,
        );
        expect(deleteRes.statusCode).toBe(204);

        const getRes = await router(
            restEvent('GET', '/users/{id}', undefined, { id: created.id }),
            adapter,
            userContext,
        );
        expect(getRes.statusCode).toBe(404);
    });

    it('creates an account for a user', async () => {
        const createUserRes = await router(restEvent('POST', '/users', createUserBody), adapter, userContext);
        const user = JSON.parse(createUserRes.body) as User;

        const createAccountRes = await router(
            restEvent('POST', '/users/{id}/account', createAccountBody, { id: user.id }),
            adapter,
            userContext,
        );

        expect(createAccountRes.statusCode).toBe(201);
        const account = JSON.parse(createAccountRes.body) as Account;
        expect(account.userId).toBe(user.id);
        expect(account.preferences.theme).toBe('dark');
        expect(account.id).toBeTruthy();
    });

    it('gets an account for a user', async () => {
        const createUserRes = await router(restEvent('POST', '/users', createUserBody), adapter, userContext);
        const user = JSON.parse(createUserRes.body) as User;

        await router(
            restEvent('POST', '/users/{id}/account', createAccountBody, { id: user.id }),
            adapter,
            userContext,
        );

        const getRes = await router(
            restEvent('GET', '/users/{id}/account', undefined, { id: user.id }),
            adapter,
            userContext,
        );

        expect(getRes.statusCode).toBe(200);
        const account = JSON.parse(getRes.body) as Account;
        expect(account.userId).toBe(user.id);
    });

    it('updates an account', async () => {
        const createUserRes = await router(restEvent('POST', '/users', createUserBody), adapter, userContext);
        const user = JSON.parse(createUserRes.body) as User;

        await router(
            restEvent('POST', '/users/{id}/account', createAccountBody, { id: user.id }),
            adapter,
            userContext,
        );

        const updateRes = await router(
            restEvent(
                'PUT',
                '/users/{id}/account',
                { preferences: { theme: 'light', language: 'es', notificationsEnabled: false } },
                { id: user.id },
            ),
            adapter,
            userContext,
        );

        expect(updateRes.statusCode).toBe(200);
        const updated = JSON.parse(updateRes.body) as Account;
        expect(updated.preferences.theme).toBe('light');
        expect(updated.preferences.language).toBe('es');
    });

    it('deletes an account', async () => {
        const createUserRes = await router(restEvent('POST', '/users', createUserBody), adapter, userContext);
        const user = JSON.parse(createUserRes.body) as User;

        await router(
            restEvent('POST', '/users/{id}/account', createAccountBody, { id: user.id }),
            adapter,
            userContext,
        );

        const deleteRes = await router(
            restEvent('DELETE', '/users/{id}/account', undefined, { id: user.id }),
            adapter,
            userContext,
        );
        expect(deleteRes.statusCode).toBe(204);

        const getRes = await router(
            restEvent('GET', '/users/{id}/account', undefined, { id: user.id }),
            adapter,
            userContext,
        );
        expect(getRes.statusCode).toBe(404);
    });

    it('returns 404 for nonexistent user', async () => {
        const res = await router(
            restEvent('GET', '/users/{id}', undefined, { id: 'nonexistent' }),
            adapter,
            userContext,
        );
        expect(res.statusCode).toBe(404);
    });

    it('returns 409 when creating duplicate account', async () => {
        const createUserRes = await router(restEvent('POST', '/users', createUserBody), adapter, userContext);
        const user = JSON.parse(createUserRes.body) as User;

        await router(
            restEvent('POST', '/users/{id}/account', createAccountBody, { id: user.id }),
            adapter,
            userContext,
        );

        const duplicateRes = await router(
            restEvent('POST', '/users/{id}/account', createAccountBody, { id: user.id }),
            adapter,
            userContext,
        );
        expect(duplicateRes.statusCode).toBe(409);
    });

    it('returns 404 for route not found', async () => {
        const res = await router(restEvent('GET', '/nonexistent'), adapter, userContext);
        expect(res.statusCode).toBe(404);
    });
});
