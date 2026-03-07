# hydration.ts

Entity hydration registry for deserializing entities from database storage. Provides a fallback mechanism for plugins that need custom deserialization logic without implementing a full codec.

**Source:** `src/shared/data/hydration.ts`

---

## Exports

### `registerHydrator(entityKind, hydrator)`

Registers a hydrator function for an entity type. Hydrators convert raw stored data back to entity instances.

```typescript
function registerHydrator(entityKind: string, hydrator: EntityHydrator): void;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `entityKind` | `string` | Entity type key (e.g., `'factionModel'`, `'unit'`). |
| `hydrator` | `EntityHydrator` | Function that converts raw stored data to an entity instance. |

**Returns:** `void`

**Note:** If an entity has both a codec (via `registerEntityCodec`) and a hydrator, the codec's `hydrate` method takes precedence.

---

### `getHydrator(entityKind)`

Returns the hydrator for an entity type, or `undefined` if none is registered. Checks the codec registry first, then falls back to the hydration registry.

```typescript
function getHydrator(entityKind: string): EntityHydrator | undefined;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `entityKind` | `string` | Entity type key to look up. |

**Returns:** `EntityHydrator | undefined` — The registered hydrator (from codec or hydration registry), or `undefined` if not found.

---

### `hasHydrator(entityKind)`

Checks if an entity type has a registered hydrator. Checks both the codec registry and the hydration registry.

```typescript
function hasHydrator(entityKind: string): boolean;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `entityKind` | `string` | Entity type key to check. |

**Returns:** `boolean` — `true` if a hydrator is registered (via codec or hydration registry), `false` otherwise.

---

### `clearHydrationRegistry()`

Clears all registered hydrators. Primarily used for test isolation to reset state between test runs.

```typescript
function clearHydrationRegistry(): void;
```

**Returns:** `void`

**Note:** This only clears the hydration registry, not the codec registry. Use `clearCodecRegistry()` to clear codecs.

---

## Usage Examples

### Registering a hydrator for a custom entity type

```typescript
import { registerHydrator } from '@armoury/shared';
import { FactionDataModel } from './models/FactionDataModel.js';

// Register a hydrator that deserializes JSON to a model instance
registerHydrator('factionModel', (raw) => {
    return FactionDataModel.fromJSON(raw.data as string);
});
```

### Using hydrators in adapter operations

```typescript
import { getHydrator, hasHydrator } from '@armoury/shared';

// Check if a hydrator is registered before using it
if (hasHydrator('factionModel')) {
    const hydrator = getHydrator('factionModel');
    
    // Fetch raw data from storage
    const raw = await adapter.get('factions', 'space-marines');
    
    // Hydrate to entity instance
    const faction = hydrator(raw);
}
```

### Clearing hydrators in tests

```typescript
import { clearHydrationRegistry, registerHydrator } from '@armoury/shared';

describe('MyPlugin', () => {
    beforeEach(() => {
        // Reset hydration registry before each test
        clearHydrationRegistry();
        
        // Re-register hydrators needed for this test
        registerHydrator('factionModel', myHydrator);
    });
    
    it('should hydrate faction models', () => {
        // Test hydration behavior...
    });
});
```

---

## Related

- [codec](./codec.md) — Entity codec registry (preferred over hydrators)
- [schema](./schema.md) — Schema extension registry
- [BaseDAO](./dao/BaseDAO.md) — Abstract base class for DAOs
