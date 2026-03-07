import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerHydrator, getHydrator, hasHydrator, clearHydrationRegistry } from '@data/hydration.js';
import { registerEntityCodec, clearCodecRegistry, type EntityCodec } from '@data/codec.js';

describe('hydration registry', () => {
    beforeEach(() => {
        clearHydrationRegistry();
        clearCodecRegistry();
    });

    describe('registerHydrator', () => {
        it('registers a hydration function', () => {
            const hydrator = vi.fn();

            registerHydrator('testEntity', hydrator);

            expect(hasHydrator('testEntity')).toBe(true);
            expect(getHydrator('testEntity')).toBe(hydrator);
        });

        it('overwrites previous hydrator when same entity type is registered twice', () => {
            const firstHydrator = vi.fn();
            const secondHydrator = vi.fn();

            registerHydrator('testEntity', firstHydrator);
            registerHydrator('testEntity', secondHydrator);

            expect(getHydrator('testEntity')).toBe(secondHydrator);
            expect(getHydrator('testEntity')).not.toBe(firstHydrator);
        });

        it('allows registering multiple different entity types', () => {
            const hydratorA = vi.fn();
            const hydratorB = vi.fn();

            registerHydrator('entityA', hydratorA);
            registerHydrator('entityB', hydratorB);

            expect(getHydrator('entityA')).toBe(hydratorA);
            expect(getHydrator('entityB')).toBe(hydratorB);
        });
    });

    describe('getHydrator', () => {
        it('returns undefined for unregistered entity type', () => {
            expect(getHydrator('nonexistent')).toBeUndefined();
        });

        it('returns registered hydrator', () => {
            const hydrator = vi.fn();

            registerHydrator('testEntity', hydrator);

            expect(getHydrator('testEntity')).toBe(hydrator);
        });

        it('prefers codec hydrate function over hydration registry', () => {
            const hydratorFromRegistry = vi.fn();
            const hydratorFromCodec = vi.fn();

            const codec: EntityCodec = {
                serialize: vi.fn(),
                hydrate: hydratorFromCodec,
            };

            registerHydrator('testEntity', hydratorFromRegistry);
            registerEntityCodec('testEntity', codec);

            expect(getHydrator('testEntity')).toBe(hydratorFromCodec);
            expect(getHydrator('testEntity')).not.toBe(hydratorFromRegistry);
        });

        it('falls back to hydration registry when no codec is registered', () => {
            const hydrator = vi.fn();

            registerHydrator('testEntity', hydrator);

            expect(getHydrator('testEntity')).toBe(hydrator);
        });
    });

    describe('hasHydrator', () => {
        it('returns false for unregistered entity type', () => {
            expect(hasHydrator('nonexistent')).toBe(false);
        });

        it('returns true for registered hydrator', () => {
            const hydrator = vi.fn();

            registerHydrator('testEntity', hydrator);

            expect(hasHydrator('testEntity')).toBe(true);
        });

        it('returns true when codec with hydrate function exists', () => {
            const codec: EntityCodec = {
                serialize: vi.fn(),
                hydrate: vi.fn(),
            };

            registerEntityCodec('testEntity', codec);

            expect(hasHydrator('testEntity')).toBe(true);
        });

        it('returns true when both codec and hydrator are registered', () => {
            const codec: EntityCodec = {
                serialize: vi.fn(),
                hydrate: vi.fn(),
            };

            const hydrator = vi.fn();

            registerEntityCodec('testEntity', codec);
            registerHydrator('testEntity', hydrator);

            expect(hasHydrator('testEntity')).toBe(true);
        });
    });

    describe('clearHydrationRegistry', () => {
        it('removes all registered hydrators', () => {
            const hydratorA = vi.fn();
            const hydratorB = vi.fn();

            registerHydrator('entityA', hydratorA);
            registerHydrator('entityB', hydratorB);

            expect(hasHydrator('entityA')).toBe(true);
            expect(hasHydrator('entityB')).toBe(true);

            clearHydrationRegistry();

            expect(hasHydrator('entityA')).toBe(false);
            expect(hasHydrator('entityB')).toBe(false);
        });

        it('does not affect codec registry', () => {
            const codec: EntityCodec = {
                serialize: vi.fn(),
                hydrate: vi.fn(),
            };

            registerEntityCodec('testEntity', codec);

            clearHydrationRegistry();

            // hasHydrator should still return true because codec is still registered
            expect(hasHydrator('testEntity')).toBe(true);
            expect(getHydrator('testEntity')).toBe(codec.hydrate);
        });

        it('allows re-registering after clear', () => {
            const hydrator = vi.fn();

            registerHydrator('testEntity', hydrator);
            clearHydrationRegistry();

            const newHydrator = vi.fn();

            registerHydrator('testEntity', newHydrator);

            expect(hasHydrator('testEntity')).toBe(true);
            expect(getHydrator('testEntity')).toBe(newHydrator);
        });
    });
});
