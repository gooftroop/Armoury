import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Account, CreateAccountPayload, User, UserContext } from '@/types.js';
import { router } from '@/router.js';
import { createE2EAdapter, resetDatabase } from '@/__testing__/e2eAdapter.js';
import type { LocalDatabaseAdapter } from '@/utils/localAdapter.js';

let adapter: LocalDatabaseAdapter;

const m2mContext: UserContext = { userId: 'm2m' };

const auth0Sub = 'auth0|test-user-123';

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

describe('Auth0 sub-based user flow e2e', () => {
    beforeEach(async () => {
        await resetDatabase(adapter);
    });

    it('upsertUser creates user with id === sub on first login', async () => {
        const res = await router(
            restEvent('POST', '/upsert', {
                sub: auth0Sub,
                email: 'test@armoury.dev',
                name: 'Auth0 Test User',
                picture: null,
            }),
            adapter,
            m2mContext,
        );

        expect(res.statusCode).toBe(200);
        const user = JSON.parse(res.body) as User;
        expect(user.id).toBe(auth0Sub);
        expect(user.email).toBe('test@armoury.dev');
        expect(user.name).toBe('Auth0 Test User');
    });

    it('upsertUser updates existing user on subsequent login', async () => {
        const first = await router(
            restEvent('POST', '/upsert', {
                sub: auth0Sub,
                email: 'old@armoury.dev',
                name: 'Old Name',
                picture: null,
            }),
            adapter,
            m2mContext,
        );
        expect(first.statusCode).toBe(200);

        const second = await router(
            restEvent('POST', '/upsert', {
                sub: auth0Sub,
                email: 'new@armoury.dev',
                name: 'New Name',
                picture: 'https://example.com/pic.jpg',
            }),
            adapter,
            m2mContext,
        );
        expect(second.statusCode).toBe(200);

        const updated = JSON.parse(second.body) as User;
        expect(updated.id).toBe(auth0Sub);
        expect(updated.email).toBe('new@armoury.dev');
        expect(updated.name).toBe('New Name');
        expect(updated.picture).toBe('https://example.com/pic.jpg');

        const listRes = await router(restEvent('GET', '/'), adapter, m2mContext);
        const users = JSON.parse(listRes.body) as User[];
        expect(users).toHaveLength(1);
    });

    it('getUser resolves by sub (which is id)', async () => {
        await router(
            restEvent('POST', '/upsert', {
                sub: auth0Sub,
                email: 'test@armoury.dev',
                name: 'Test',
                picture: null,
            }),
            adapter,
            m2mContext,
        );

        const res = await router(restEvent('GET', '/{id}', undefined, { id: auth0Sub }), adapter, m2mContext);
        expect(res.statusCode).toBe(200);
        const user = JSON.parse(res.body) as User;
        expect(user.id).toBe(auth0Sub);
    });

    it('account operations use sub as userId', async () => {
        const upsertRes = await router(
            restEvent('POST', '/upsert', {
                sub: auth0Sub,
                email: 'test@armoury.dev',
                name: 'Test',
                picture: null,
            }),
            adapter,
            m2mContext,
        );
        const user = JSON.parse(upsertRes.body) as User;
        expect(user.id).toBe(auth0Sub);

        const createAccountBody: CreateAccountPayload = {
            preferences: { theme: 'dark', language: 'en', notificationsEnabled: false },
        };
        const accountRes = await router(
            restEvent('POST', '/{id}/account', createAccountBody, { id: auth0Sub }),
            adapter,
            m2mContext,
        );
        expect(accountRes.statusCode).toBe(201);
        const account = JSON.parse(accountRes.body) as Account;
        expect(account.userId).toBe(auth0Sub);

        const getRes = await router(
            restEvent('GET', '/{id}/account', undefined, { id: auth0Sub }),
            adapter,
            m2mContext,
        );
        expect(getRes.statusCode).toBe(200);
        const fetched = JSON.parse(getRes.body) as Account;
        expect(fetched.userId).toBe(auth0Sub);
    });

    it('authentication middleware extracts sub as userId', async () => {
        const { extractUserContext } = await import('@/middleware/auth.js');
        const context = extractUserContext({
            requestContext: {
                authorizer: {
                    jwt: {
                        claims: {
                            sub: 'auth0|test-user',
                            'https://armoury.app/email': 'middleware@armoury.dev',
                            'https://armoury.app/name': 'Middleware Test',
                        },
                    },
                },
            },
        });

        expect(context.userId).toBe('auth0|test-user');
        expect(context.email).toBe('middleware@armoury.dev');
        expect(context.name).toBe('Middleware Test');
    });

    it('user creation via createUser uses sub as id', async () => {
        const userContext: UserContext = { userId: auth0Sub, email: 'test@armoury.dev', name: 'Test' };
        const res = await router(
            restEvent('POST', '/', {
                sub: auth0Sub,
                email: 'test@armoury.dev',
                name: 'Test User',
                picture: null,
            }),
            adapter,
            userContext,
        );

        expect(res.statusCode).toBe(201);
        const user = JSON.parse(res.body) as User;
        expect(user.id).toBe(auth0Sub);
    });
});
