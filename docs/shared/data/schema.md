# schema.ts

Composable schema extension system for database adapters. Core and plugin schemas are registered independently and merged at adapter initialization, enabling game system plugins to provide their own database tables without modifying core adapter code.

**Source:** `src/shared/data/schema.ts`

---

## Exports

### `SchemaExtension`

Umbrella interface for schema extensions. Plugins provide whichever platforms they support (SQLite, IndexedDB, DSQL).

```typescript
interface SchemaExtension {
    sqlite?: SQLiteSchemaExtension;
    indexedDB?: IndexedDBSchemaExtension;
    dsql?: DSQLSchemaExtension;
}
```

| Property | Type | Description |
|----------|------|-------------|
| `sqlite` | `SQLiteSchemaExtension` | SQLite schema (mobile via expo-sqlite). |
| `indexedDB` | `IndexedDBSchemaExtension` | IndexedDB schema (web via Dexie). |
| `dsql` | `DSQLSchemaExtension` | DSQL schema (server via Drizzle + Aurora DSQL). |

---

### `SQLiteSchemaExtension`

SQLite schema extension contributed by core or a plugin.

```typescript
interface SQLiteSchemaExtension {
    createTablesSQL: string;
    storeToTable: Record<string, string>;
    tableColumns: Record<string, ReadonlySet<string>>;
}
```

| Property | Type | Description |
|----------|------|-------------|
| `createTablesSQL` | `string` | SQL CREATE TABLE IF NOT EXISTS statements (may contain multiple statements separated by semicolons). |
| `storeToTable` | `Record<string, string>` | Maps entity kind to SQL table name (e.g., `'unit' → 'units'`). |
| `tableColumns` | `Record<string, ReadonlySet<string>>` | Maps SQL table name to its valid column names (used for SQL injection prevention in ORDER BY). |

---

### `IndexedDBSchemaExtension`

IndexedDB (Dexie) schema extension contributed by core or a plugin.

```typescript
interface IndexedDBSchemaExtension {
    stores: Record<string, string>;
    storeToTable: Record<string, string>;
}
```

| Property | Type | Description |
|----------|------|-------------|
| `stores` | `Record<string, string>` | Maps Dexie table name to index definition string (e.g., `'units' → 'id, name, factionId'`). |
| `storeToTable` | `Record<string, string>` | Maps entity kind to Dexie table name (e.g., `'unit' → 'units'`). |

---

### `DSQLSchemaExtension`

DSQL (Drizzle) schema extension contributed by core or a plugin.

```typescript
interface DSQLSchemaExtension {
    tables: Record<string, unknown>;
    storeToTable: Record<string, unknown>;
}
```

| Property | Type | Description |
|----------|------|-------------|
| `tables` | `Record<string, unknown>` | Drizzle pgTable definitions keyed by entity kind. |
| `storeToTable` | `Record<string, unknown>` | Maps entity kind to Drizzle table reference. |

---

### `registerSchemaExtension(extension)`

Registers a schema extension in the global registry. Called by plugins during initialization and by core at module load time.

```typescript
function registerSchemaExtension(extension: SchemaExtension): void;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `extension` | `SchemaExtension` | The schema extension to register. |

**Returns:** `void`

---

### `getSchemaExtensions()`

Returns all registered schema extensions.

```typescript
function getSchemaExtensions(): readonly SchemaExtension[];
```

**Returns:** `readonly SchemaExtension[]` — Readonly array of registered schema extensions.

---

### `clearSchemaExtensions()`

Clears all registered schema extensions. Primarily used in tests to reset state between test runs.

```typescript
function clearSchemaExtensions(): void;
```

**Returns:** `void`

---

### `getMergedSQLiteSchema()`

Merges all registered SQLite schema extensions into a single schema. Combines CREATE TABLE SQL, store-to-table mappings, and column definitions.

```typescript
function getMergedSQLiteSchema(): SQLiteSchemaExtension;
```

**Returns:** `SQLiteSchemaExtension` — Merged SQLite schema with all core and plugin tables.

---

### `getMergedIndexedDBSchema()`

Merges all registered IndexedDB schema extensions into a single schema. Combines Dexie store definitions and store-to-table mappings.

```typescript
function getMergedIndexedDBSchema(): IndexedDBSchemaExtension;
```

**Returns:** `IndexedDBSchemaExtension` — Merged IndexedDB schema with all core and plugin stores.

---

### `getMergedDSQLSchema()`

Merges all registered DSQL schema extensions into a single schema. Combines Drizzle table definitions and store-to-table mappings.

```typescript
function getMergedDSQLSchema(): DSQLSchemaExtension;
```

**Returns:** `DSQLSchemaExtension` — Merged DSQL schema with all core and plugin tables.

---

## Usage Examples

### Registering a schema extension in a plugin

```typescript
import { registerSchemaExtension } from '@armoury/shared';

// Register schema extension during plugin initialization
registerSchemaExtension({
    sqlite: {
        createTablesSQL: `
            CREATE TABLE IF NOT EXISTS units (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                factionId TEXT NOT NULL,
                stats TEXT NOT NULL,
                abilities TEXT NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS weapons (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                unitId TEXT NOT NULL,
                range TEXT NOT NULL,
                attacks TEXT NOT NULL,
                skill TEXT NOT NULL,
                strength TEXT NOT NULL,
                ap TEXT NOT NULL,
                damage TEXT NOT NULL
            );
        `,
        storeToTable: {
            unit: 'units',
            weapon: 'weapons',
        },
        tableColumns: {
            units: new Set(['id', 'name', 'factionId', 'stats', 'abilities']),
            weapons: new Set(['id', 'name', 'unitId', 'range', 'attacks', 'skill', 'strength', 'ap', 'damage']),
        },
    },
    indexedDB: {
        stores: {
            units: 'id, name, factionId',
            weapons: 'id, name, unitId',
        },
        storeToTable: {
            unit: 'units',
            weapon: 'weapons',
        },
    },
});
```

### Using merged schemas in adapter initialization

```typescript
import { getMergedSQLiteSchema, getMergedIndexedDBSchema } from '@armoury/shared';

// SQLite adapter initialization
const sqliteSchema = getMergedSQLiteSchema();
await db.execAsync(sqliteSchema.createTablesSQL);

// IndexedDB adapter initialization
const indexedDBSchema = getMergedIndexedDBSchema();
const db = new Dexie('armoury');
db.version(1).stores(indexedDBSchema.stores);
```

### Clearing schemas in tests

```typescript
import { clearSchemaExtensions, registerSchemaExtension } from '@armoury/shared';

describe('MyPlugin', () => {
    beforeEach(() => {
        // Reset schema registry before each test
        clearSchemaExtensions();
        
        // Re-register schemas needed for this test
        registerSchemaExtension(myPluginSchema);
    });
    
    it('should merge schemas correctly', () => {
        const merged = getMergedSQLiteSchema();
        expect(merged.storeToTable.unit).toBe('units');
    });
});
```

---

## Related

- [codec](./codec.md) — Entity codec registry
- [DataContext](./DataContext.md) — Primary data access facade
- [createAdapter](./factory.md) — Adapter factory function
