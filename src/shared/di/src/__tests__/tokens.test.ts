import { describe, expect, it } from 'vitest';
import { TOKENS } from '@/tokens.js';

describe('TOKENS', () => {
    it('contains all expected token keys', () => {
        expect(Object.keys(TOKENS)).toEqual([
            'DatabaseAdapter',
            'AdapterConfig',
            'GitHubClient',
            'WahapediaClient',
            'QueryClient',
            'GitHubProxyConfig',
            'DSQLConfig',
            'DataContextBuilder',
            'GameSystem',
            'AdapterFactory',
            'GitHubClientFactory',
            'WahapediaClientFactory',
        ]);
    });

    it('uses symbols for every token value', () => {
        for (const token of Object.values(TOKENS)) {
            expect(typeof token).toBe('symbol');
        }
    });

    it('ensures every token symbol is unique', () => {
        const values = Object.values(TOKENS);
        expect(new Set(values).size).toBe(values.length);
    });

    it('ensures Symbol.for identity for all tokens', () => {
        expect(TOKENS.DatabaseAdapter).toBe(Symbol.for('DatabaseAdapter'));
        expect(TOKENS.AdapterConfig).toBe(Symbol.for('AdapterConfig'));
        expect(TOKENS.GitHubClient).toBe(Symbol.for('GitHubClient'));
        expect(TOKENS.WahapediaClient).toBe(Symbol.for('WahapediaClient'));
        expect(TOKENS.QueryClient).toBe(Symbol.for('QueryClient'));
        expect(TOKENS.GitHubProxyConfig).toBe(Symbol.for('GitHubProxyConfig'));
        expect(TOKENS.DSQLConfig).toBe(Symbol.for('DSQLConfig'));
        expect(TOKENS.DataContextBuilder).toBe(Symbol.for('DataContextBuilder'));
        expect(TOKENS.GameSystem).toBe(Symbol.for('GameSystem'));
        expect(TOKENS.AdapterFactory).toBe(Symbol.for('AdapterFactory'));
        expect(TOKENS.GitHubClientFactory).toBe(Symbol.for('GitHubClientFactory'));
        expect(TOKENS.WahapediaClientFactory).toBe(Symbol.for('WahapediaClientFactory'));
    });

    it('is frozen to prevent mutation', () => {
        expect(Object.isFrozen(TOKENS)).toBe(true);
    });
});
