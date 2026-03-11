import type { EntityHydrator } from './types.ts';
import { getEntityCodec } from './codec.ts';

/**
 * Global registry for entity hydrators.
 * Plugins register hydration functions for entity types that need
 * special deserialization from database storage (e.g., FactionDataModel from JSON).
 */
const hydrationRegistry = new Map<string, EntityHydrator>();

/**
 * Registers a hydrator for an entity type.
 * @param entityKind - The entity type key (e.g., 'factionModel').
 * @param hydrator - Function that converts raw stored data to the entity instance.
 */
export function registerHydrator(entityKind: string, hydrator: EntityHydrator): void {
    hydrationRegistry.set(entityKind, hydrator);
}

/**
 * Returns the hydrator for an entity type, or undefined if none registered.
 * @param entityKind - The entity type key to look up.
 */
export function getHydrator(entityKind: string): EntityHydrator | undefined {
    return getEntityCodec(entityKind)?.hydrate ?? hydrationRegistry.get(entityKind);
}

/**
 * Checks if an entity type has a registered hydrator.
 * @param entityKind - The entity type key to check.
 */
export function hasHydrator(entityKind: string): boolean {
    return Boolean(getEntityCodec(entityKind)?.hydrate) || hydrationRegistry.has(entityKind);
}

/** Clears all registered hydrators. Used for test isolation. */
export function clearHydrationRegistry(): void {
    hydrationRegistry.clear();
}
