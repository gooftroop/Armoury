/**
 * Entity codec for serializing/deserializing entities to/from database storage.
 */
export interface EntityCodec<T = unknown> {
    serialize: (entity: T) => Record<string, unknown>;
    hydrate: (raw: Record<string, unknown>) => T;
}

const codecRegistry = new Map<string, EntityCodec>();

/** Registers a codec for an entity type. */
export function registerEntityCodec(entityKind: string, codec: EntityCodec): void {
    codecRegistry.set(entityKind, codec);
}

/** Returns the codec for an entity type, or undefined if none. */
export function getEntityCodec(entityKind: string): EntityCodec | undefined {
    return codecRegistry.get(entityKind);
}

/** Checks if an entity type has a registered codec. */
export function hasEntityCodec(entityKind: string): boolean {
    return codecRegistry.has(entityKind);
}

/** Clears all registered entity codecs. Used for test isolation. */
export function clearCodecRegistry(): void {
    codecRegistry.clear();
}
