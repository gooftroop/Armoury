import { describe, expect, it } from 'vitest';
import type {
    CreateAccountPayload,
    CreateUserPayload,
    UpdateAccountPayload,
    UpdateUserPayload,
    UserPreferences,
} from '@/types.js';
import {
    isUserPreferences,
    parseCreateAccount,
    parseCreateUser,
    parseUpdateAccount,
    parseUpdateUser,
} from '@/utils/validation.js';

describe('validation utilities', () => {
    describe('parseCreateUser', () => {
        it('returns parsed payload for valid input', () => {
            const result = parseCreateUser({
                sub: 'auth0|user-1',
                email: 'user@test.com',
                name: 'Test',
                picture: null,
            });

            expect(result).not.toBeInstanceOf(Error);

            const payload = result as CreateUserPayload;

            expect(payload.sub).toBe('auth0|user-1');
            expect(payload.email).toBe('user@test.com');
            expect(payload.name).toBe('Test');
            expect(payload.picture).toBeNull();
        });

        it('returns error when body is null', () => {
            const result = parseCreateUser(null);

            expect(result).toBeInstanceOf(Error);
            expect((result as Error).message).toBe('Request body is required');
        });

        it('returns error when sub is missing', () => {
            const result = parseCreateUser({ email: 'user@test.com', name: 'Test' });

            expect(result).toBeInstanceOf(Error);
            expect((result as Error).message).toBe('Missing required field: sub');
        });

        it('returns error when email is missing', () => {
            const result = parseCreateUser({ sub: 'auth0|user-1', name: 'Test' });

            expect(result).toBeInstanceOf(Error);
            expect((result as Error).message).toBe('Missing required field: email');
        });

        it('returns error when name is missing', () => {
            const result = parseCreateUser({ sub: 'auth0|user-1', email: 'user@test.com' });

            expect(result).toBeInstanceOf(Error);
            expect((result as Error).message).toBe('Missing required field: name');
        });

        it('returns error for invalid picture value', () => {
            const result = parseCreateUser({
                sub: 'auth0|user-1',
                email: 'user@test.com',
                name: 'Test',
                picture: 123,
            });

            expect(result).toBeInstanceOf(Error);
            expect((result as Error).message).toBe('Invalid picture value');
        });
    });

    describe('parseUpdateUser', () => {
        it('returns parsed payload with email', () => {
            const result = parseUpdateUser({ email: 'new@test.com' });

            expect(result).not.toBeInstanceOf(Error);

            const payload = result as UpdateUserPayload;

            expect(payload.email).toBe('new@test.com');
        });

        it('returns parsed payload with name', () => {
            const result = parseUpdateUser({ name: 'New Name' });

            expect(result).not.toBeInstanceOf(Error);

            const payload = result as UpdateUserPayload;

            expect(payload.name).toBe('New Name');
        });

        it('returns parsed payload with picture', () => {
            const result = parseUpdateUser({ picture: 'https://example.com/pic.jpg' });

            expect(result).not.toBeInstanceOf(Error);

            const payload = result as UpdateUserPayload;

            expect(payload.picture).toBe('https://example.com/pic.jpg');
        });

        it('returns error when body is null', () => {
            const result = parseUpdateUser(null);

            expect(result).toBeInstanceOf(Error);
            expect((result as Error).message).toBe('Request body is required');
        });

        it('returns error when no updates provided', () => {
            const result = parseUpdateUser({});

            expect(result).toBeInstanceOf(Error);
            expect((result as Error).message).toBe('No updates provided');
        });

        it('returns error for invalid email', () => {
            const result = parseUpdateUser({ email: 123 });

            expect(result).toBeInstanceOf(Error);
            expect((result as Error).message).toBe('Invalid email value');
        });
    });

    describe('isUserPreferences', () => {
        it('returns true for valid preferences', () => {
            const prefs: UserPreferences = { theme: 'dark', language: 'en', notificationsEnabled: true };

            expect(isUserPreferences(prefs)).toBe(true);
        });

        it('returns false when theme is missing', () => {
            expect(isUserPreferences({ language: 'en', notificationsEnabled: true })).toBe(false);
        });

        it('returns false for invalid theme', () => {
            expect(isUserPreferences({ theme: 'blue', language: 'en', notificationsEnabled: true })).toBe(false);
        });

        it('returns false when language is missing', () => {
            expect(isUserPreferences({ theme: 'dark', notificationsEnabled: true })).toBe(false);
        });

        it('returns false when notificationsEnabled is missing', () => {
            expect(isUserPreferences({ theme: 'dark', language: 'en' })).toBe(false);
        });

        it('returns false for non-object', () => {
            expect(isUserPreferences('not-an-object')).toBe(false);
        });
    });

    describe('parseCreateAccount', () => {
        const validPayload = {
            preferences: { theme: 'dark' as const, language: 'en', notificationsEnabled: true },
        };

        it('returns parsed payload for valid input', () => {
            const result = parseCreateAccount(validPayload);

            expect(result).not.toBeInstanceOf(Error);

            const payload = result as CreateAccountPayload;

            expect(payload.preferences.theme).toBe('dark');
        });

        it('returns error when body is null', () => {
            const result = parseCreateAccount(null);

            expect(result).toBeInstanceOf(Error);
            expect((result as Error).message).toBe('Request body is required');
        });

        it('returns error for invalid preferences', () => {
            const result = parseCreateAccount({ ...validPayload, preferences: 'bad' });

            expect(result).toBeInstanceOf(Error);
            expect((result as Error).message).toBe('Missing or invalid required field: preferences');
        });
    });

    describe('parseUpdateAccount', () => {
        it('returns parsed payload with preferences', () => {
            const prefs: UserPreferences = { theme: 'light', language: 'fr', notificationsEnabled: false };
            const result = parseUpdateAccount({ preferences: prefs });

            expect(result).not.toBeInstanceOf(Error);

            const payload = result as UpdateAccountPayload;

            expect(payload.preferences).toEqual(prefs);
        });

        it('returns error when body is null', () => {
            const result = parseUpdateAccount(null);

            expect(result).toBeInstanceOf(Error);
            expect((result as Error).message).toBe('Request body is required');
        });

        it('returns error when no updates provided', () => {
            const result = parseUpdateAccount({});

            expect(result).toBeInstanceOf(Error);
            expect((result as Error).message).toBe('No updates provided');
        });

        it('returns error for invalid preferences', () => {
            const result = parseUpdateAccount({ preferences: 'bad' });

            expect(result).toBeInstanceOf(Error);
            expect((result as Error).message).toBe('Invalid preferences value');
        });
    });
});
