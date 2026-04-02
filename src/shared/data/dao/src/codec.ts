/**
 * Entity codec for serializing/deserializing entities to/from database storage.
 */
export interface EntityCodec<T = unknown> {
    serialize: (entity: T) => Record<string, unknown>;
    hydrate: (raw: Record<string, unknown>) => T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type-erased storage; callers use generic registerEntityCodec<T>
const codecRegistry = new Map<string, EntityCodec<any>>();

/** Registers a codec for an entity type. */
export function registerEntityCodec<T>(entityKind: string, codec: EntityCodec<T>): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type-erased cast; generic T is preserved at call site
    codecRegistry.set(entityKind, codec as EntityCodec<any>);
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
