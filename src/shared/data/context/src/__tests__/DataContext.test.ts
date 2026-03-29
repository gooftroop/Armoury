/**
 * Unit tests for DataContext runtime behavior.
 *
 * Verifies fallback DAO and game proxy behavior when a game context is not
 * provided, and confirms baseline wiring for close() and builder().
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameSystem } from '@armoury/data-dao';
import { DataContext } from '@/DataContext.js';
import { DataContextBuilder } from '@/DataContextBuilder.js';
import { clearSchemaExtensions, clearCodecRegistry, clearHydrationRegistry, PluginRegistry } from '@armoury/data-dao';
import { MockDatabaseAdapter } from '@/__mocks__/MockDatabaseAdapter.js';

/**
 * @requirements
 * - REQ-DATA-CONTEXT-TEST-01: Fallback armies/campaigns DAOs must reject with explicit not-implemented errors.
 * - REQ-DATA-CONTEXT-TEST-02: Fallback game context proxy must throw with system name and GitHub configuration state.
 * - REQ-DATA-CONTEXT-TEST-03: close() must delegate to adapter.close().
 * - REQ-DATA-CONTEXT-TEST-04: builder() must return a DataContextBuilder instance.
 */

/** Creates a minimal GameSystem fixture for DataContext construction. */
function makeGameSystem(overrides: Partial<GameSystem> = {}): GameSystem {
    const base: GameSystem = {
        id: 'test-system',
        name: 'Test System',
        version: '1.0.0',
        dataSource: {
            type: 'github',
            owner: 'test-owner',
            repo: 'test-repo',
            coreFile: 'core.gst',
            description: 'Test data source',
            licenseStatus: 'MIT',
        },
        entityKinds: [],
        validationRules: [],
        getHydrators: vi.fn(() => new Map()),
        getSchemaExtension: vi.fn(() => ({})),
        register: vi.fn(),
        createGameContext: vi.fn(() => ({})),
    };

    return { ...base, ...overrides };
}

describe('DataContext', () => {
    beforeEach(() => {
        clearSchemaExtensions();
        clearCodecRegistry();
        clearHydrationRegistry();
        PluginRegistry.clear();
    });

    it('rejects fallback armies and campaigns DAO methods when game context is missing', async () => {
        const adapter = new MockDatabaseAdapter();
        const gameSystem = makeGameSystem({ name: 'Warhammer 40,000 10th Edition' });
        const context = new DataContext(adapter, gameSystem, new Map());

        await expect(context.armies.count()).rejects.toThrow("Game-specific DAO 'armies' is not yet implemented.");
        await expect(context.campaigns.count()).rejects.toThrow(
            "Game-specific DAO 'campaigns' is not yet implemented.",
        );
    });

    it('throws informative proxy errors for fallback game context', () => {
        const adapter = new MockDatabaseAdapter();
        const gameSystem = makeGameSystem({ name: 'Warhammer 40,000 10th Edition' });

        const withoutGithub = new DataContext<Record<string, unknown>>(adapter, gameSystem, new Map());
        const githubClient = {
            listFiles: vi.fn(),
            getFileSha: vi.fn(),
            downloadFile: vi.fn(),
            checkForUpdates: vi.fn(async () => false),
        };
        const clientsWithGithub = new Map<string, unknown>([['github', githubClient]]);
        const withGithub = new DataContext<Record<string, unknown>>(adapter, gameSystem, clientsWithGithub);

        expect(() => {
            void withoutGithub.game['anything'];
        }).toThrow(
            "Game-specific data context for 'Warhammer 40,000 10th Edition' is not yet implemented. GitHub client configured: false.",
        );

        expect(() => {
            void withGithub.game['anything'];
        }).toThrow(
            "Game-specific data context for 'Warhammer 40,000 10th Edition' is not yet implemented. GitHub client configured: true.",
        );
    });

    it('delegates close() to adapter.close()', async () => {
        const adapter = new MockDatabaseAdapter();
        const closeSpy = vi.spyOn(adapter, 'close');
        const context = new DataContext(adapter, makeGameSystem(), new Map(), {
            armies: {
                save: vi.fn(),
                saveMany: vi.fn(),
                get: vi.fn(),
                list: vi.fn(),
                listByOwner: vi.fn(),
                listByFaction: vi.fn(),
                delete: vi.fn(),
                deleteAll: vi.fn(),
                count: vi.fn(),
            },
            campaigns: {
                save: vi.fn(),
                saveMany: vi.fn(),
                get: vi.fn(),
                list: vi.fn(),
                listByOrganizer: vi.fn(),
                listByStatus: vi.fn(),
                listByType: vi.fn(),
                delete: vi.fn(),
                deleteAll: vi.fn(),
                count: vi.fn(),
            },
            game: {},
        });

        await context.close();

        expect(closeSpy).toHaveBeenCalledOnce();
    });

    it('exposes builder() as a DataContextBuilder factory', () => {
        const builder = DataContextBuilder.builder();

        expect(builder).toBeInstanceOf(DataContextBuilder);
    });
});
