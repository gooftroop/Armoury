# Adapter Factory

Factory function for creating and initializing platform-specific database adapters.

**Source:** `src/shared/data/factory.ts`

## Exports

### `AdapterFactoryConfig` (interface)

Configuration object for the adapter factory. Allows customization of platform selection, database naming, and platform-specific settings.

```typescript
interface AdapterFactoryConfig {
    platform?: Platform;
    databaseName?: string;
    databaseVersion?: number;
    dsqlConfig?: {
        clusterEndpoint: string;
        region: string;
    };
}
```

#### Properties

| Property          | Type       | Default       | Description                                                                        |
| ----------------- | ---------- | ------------- | ---------------------------------------------------------------------------------- |
| `platform`        | `Platform` | auto-detected | The target platform. Auto-detects based on environment if not specified.           |
| `databaseName`    | `string`   | `'armoury'`   | Database name/file path. Used as filename for SQLite, database name for IndexedDB. |
| `databaseVersion` | `number`   | `1`           | Schema version. Currently unused, reserved for future migration support.           |
| `dsqlConfig`      | `object`   | `undefined`   | Aurora DSQL configuration. Required when `platform` is `Platform.AuroraDSQL`.      |

### `createAdapter` (function)

Factory function that creates and initializes a database adapter for the specified platform. Handles platform detection, adapter instantiation, and full initialization.

```typescript
async function createAdapter(config?: AdapterFactoryConfig): Promise<DatabaseAdapter>;
```

#### Parameters

| Parameter | Type                   | Required | Description                                                 |
| --------- | ---------------------- | -------- | ----------------------------------------------------------- |
| `config`  | `AdapterFactoryConfig` | No       | Configuration for platform selection and database settings. |

#### Returns

`Promise<DatabaseAdapter>` -- A fully initialized adapter ready for use.

#### Throws

- `DatabaseError` if Aurora DSQL is selected but `dsqlConfig` is not provided.
- `DatabaseError` if adapter initialization fails.

#### Platform Selection Logic

1. If `config.platform` is provided, uses that platform.
2. Otherwise, auto-detects: `IndexedDB` for web (if `window.indexedDB` exists), `SQLite` for mobile/server.

#### Adapter Instantiation

| Platform              | Adapter            | Notes                                        |
| --------------------- | ------------------ | -------------------------------------------- |
| `Platform.SQLite`     | `SQLiteAdapter`    | Opens expo-sqlite database file.             |
| `Platform.AuroraDSQL` | `DSQLAdapter`      | Dynamically imported. Requires `dsqlConfig`. |
| `Platform.IndexedDB`  | `IndexedDBAdapter` | Creates Dexie-backed adapter.                |

## Usage Example

```typescript
import { createAdapter, Platform } from '@armoury/shared';

// Auto-detect platform with default database name
const adapter = await createAdapter();

// Explicitly use IndexedDB with custom database name
const webAdapter = await createAdapter({
    platform: Platform.IndexedDB,
    databaseName: 'my-app-db',
});

// Use Aurora DSQL for server-side
const serverAdapter = await createAdapter({
    platform: Platform.AuroraDSQL,
    dsqlConfig: {
        clusterEndpoint: 'https://my-cluster.dsql.amazonaws.com',
        region: 'us-east-1',
    },
});
```
