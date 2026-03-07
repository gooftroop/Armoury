# codec.ts

Entity codec registry for serializing and deserializing entities to/from database storage. Plugins register codecs for custom entity types to enable adapter-agnostic persistence.

**Source:** `src/shared/data/codec.ts`

---

## Exports

### `EntityCodec<T>`

Interface for entity serialization and deserialization.

```typescript
interface EntityCodec<T = unknown> {
    serialize: (entity: T) => Record<string, unknown>;
    hydrate: (raw: Record<string, unknown>) => T;
}
```

| Property | Type | Description |
|----------|------|-------------|
| `serialize` | `(entity: T) => Record<string, unknown>` | Converts an entity instance to a plain object for storage. |
| `hydrate` | `(raw: Record<string, unknown>) => T` | Converts a stored plain object back to an entity instance. |

---

### `registerEntityCodec(entityKind, codec)`

Registers a codec for an entity type. Called by game system plugins during initialization to enable custom entity persistence.

```typescript
function registerEntityCodec(entityKind: string, codec: EntityCodec): void;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `entityKind` | `string` | Entity type key (e.g., `'unit'`, `'weapon'`, `'factionModel'`). |
| `codec` | `EntityCodec` | Codec implementation with `serialize` and `hydrate` methods. |

**Returns:** `void`

---

### `getEntityCodec(entityKind)`

Returns the codec for an entity type, or `undefined` if none is registered.

```typescript
function getEntityCodec(entityKind: string): EntityCodec | undefined;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `entityKind` | `string` | Entity type key to look up. |

**Returns:** `EntityCodec | undefined` — The registered codec, or `undefined` if not found.

---

### `hasEntityCodec(entityKind)`

Checks if an entity type has a registered codec.

```typescript
function hasEntityCodec(entityKind: string): boolean;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `entityKind` | `string` | Entity type key to check. |

**Returns:** `boolean` — `true` if a codec is registered, `false` otherwise.

---

### `clearCodecRegistry()`

Clears all registered entity codecs. Primarily used for test isolation to reset state between test runs.

```typescript
function clearCodecRegistry(): void;
```

**Returns:** `void`

---

## Usage Examples

### Registering a codec for a custom entity type

```typescript
import { registerEntityCodec } from '@armoury/shared';
import type { EntityCodec } from '@armoury/shared';
import { UnitModel } from './models/UnitModel.js';

const unitCodec: EntityCodec<UnitModel> = {
    serialize: (unit) => ({
        id: unit.id,
        name: unit.name,
        factionId: unit.factionId,
        stats: JSON.stringify(unit.stats),
        abilities: JSON.stringify(unit.abilities),
    }),
    hydrate: (raw) => new UnitModel({
        id: raw.id as string,
        name: raw.name as string,
        factionId: raw.factionId as string,
        stats: JSON.parse(raw.stats as string),
        abilities: JSON.parse(raw.abilities as string),
    }),
};

// Register during plugin initialization
registerEntityCodec('unit', unitCodec);
```

### Using codecs in adapter operations

```typescript
import { getEntityCodec, hasEntityCodec } from '@armoury/shared';

// Check if a codec is registered before using it
if (hasEntityCodec('unit')) {
    const codec = getEntityCodec('unit');
    
    // Serialize entity for storage
    const serialized = codec.serialize(myUnit);
    await adapter.put('units', serialized);
    
    // Hydrate entity from storage
    const raw = await adapter.get('units', 'unit-1');
    const unit = codec.hydrate(raw);
}
```

### Clearing codecs in tests

```typescript
import { clearCodecRegistry, registerEntityCodec } from '@armoury/shared';

describe('MyPlugin', () => {
    beforeEach(() => {
        // Reset codec registry before each test
        clearCodecRegistry();
        
        // Re-register codecs needed for this test
        registerEntityCodec('unit', unitCodec);
    });
    
    it('should serialize and hydrate units', () => {
        // Test codec behavior...
    });
});
```

---

## Related

- [hydration](./hydration.md) — Entity hydration registry (legacy, prefer codecs)
- [schema](./schema.md) — Schema extension registry
- [BaseDAO](./dao/BaseDAO.md) — Abstract base class for DAOs
