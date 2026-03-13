import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerEntityCodec, getEntityCodec, hasEntityCodec, clearCodecRegistry, type EntityCodec } from '@/codec.js';

describe('codec registry', () => {
    beforeEach(() => {
        clearCodecRegistry();
    });

    describe('registerEntityCodec', () => {
        it('registers a codec for an entity type', () => {
            const codec: EntityCodec = {
                serialize: vi.fn(),
                hydrate: vi.fn(),
            };

            registerEntityCodec('testEntity', codec);

            expect(hasEntityCodec('testEntity')).toBe(true);
            expect(getEntityCodec('testEntity')).toBe(codec);
        });

        it('overwrites previous codec when same store is registered twice', () => {
            const firstCodec: EntityCodec = {
                serialize: vi.fn(),
                hydrate: vi.fn(),
            };

            const secondCodec: EntityCodec = {
                serialize: vi.fn(),
                hydrate: vi.fn(),
            };

            registerEntityCodec('testEntity', firstCodec);
            registerEntityCodec('testEntity', secondCodec);

            expect(getEntityCodec('testEntity')).toBe(secondCodec);
            expect(getEntityCodec('testEntity')).not.toBe(firstCodec);
        });

        it('allows registering multiple different entity types', () => {
            const codecA: EntityCodec = {
                serialize: vi.fn(),
                hydrate: vi.fn(),
            };

            const codecB: EntityCodec = {
                serialize: vi.fn(),
                hydrate: vi.fn(),
            };

            registerEntityCodec('entityA', codecA);
            registerEntityCodec('entityB', codecB);

            expect(getEntityCodec('entityA')).toBe(codecA);
            expect(getEntityCodec('entityB')).toBe(codecB);
        });
    });

    describe('getEntityCodec', () => {
        it('returns undefined for unregistered entity type', () => {
            expect(getEntityCodec('nonexistent')).toBeUndefined();
        });

        it('returns registered codec', () => {
            const codec: EntityCodec = {
                serialize: vi.fn(),
                hydrate: vi.fn(),
            };

            registerEntityCodec('testEntity', codec);

            const retrieved = getEntityCodec('testEntity');
            expect(retrieved).toBe(codec);
            expect(retrieved?.serialize).toBeDefined();
            expect(retrieved?.hydrate).toBeDefined();
        });
    });

    describe('hasEntityCodec', () => {
        it('returns false for unregistered entity type', () => {
            expect(hasEntityCodec('nonexistent')).toBe(false);
        });

        it('returns true for registered entity type', () => {
            const codec: EntityCodec = {
                serialize: vi.fn(),
                hydrate: vi.fn(),
            };

            registerEntityCodec('testEntity', codec);

            expect(hasEntityCodec('testEntity')).toBe(true);
        });

        it('returns false after codec is overwritten and cleared', () => {
            const codec: EntityCodec = {
                serialize: vi.fn(),
                hydrate: vi.fn(),
            };

            registerEntityCodec('testEntity', codec);
            clearCodecRegistry();

            expect(hasEntityCodec('testEntity')).toBe(false);
        });
    });

    describe('clearCodecRegistry', () => {
        it('removes all registered codecs', () => {
            const codecA: EntityCodec = {
                serialize: vi.fn(),
                hydrate: vi.fn(),
            };

            const codecB: EntityCodec = {
                serialize: vi.fn(),
                hydrate: vi.fn(),
            };

            registerEntityCodec('entityA', codecA);
            registerEntityCodec('entityB', codecB);

            expect(hasEntityCodec('entityA')).toBe(true);
            expect(hasEntityCodec('entityB')).toBe(true);

            clearCodecRegistry();

            expect(hasEntityCodec('entityA')).toBe(false);
            expect(hasEntityCodec('entityB')).toBe(false);
        });

        it('allows re-registering after clear', () => {
            const codec: EntityCodec = {
                serialize: vi.fn(),
                hydrate: vi.fn(),
            };

            registerEntityCodec('testEntity', codec);
            clearCodecRegistry();

            const newCodec: EntityCodec = {
                serialize: vi.fn(),
                hydrate: vi.fn(),
            };

            registerEntityCodec('testEntity', newCodec);

            expect(hasEntityCodec('testEntity')).toBe(true);
            expect(getEntityCodec('testEntity')).toBe(newCodec);
        });
    });
});
