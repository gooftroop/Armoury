# DSQLAdapter

Database adapter for Amazon Aurora DSQL using Drizzle ORM and the pg driver.

**Source:** `src/shared/data/dsql/adapter.ts`

## Exports

### `DSQLAdapterConfig` (interface)

Configuration for the Aurora DSQL adapter.

```typescript
interface DSQLAdapterConfig {
    clusterEndpoint: string;
    region: string;
}
```

| Property          | Type     | Description                                |
| ----------------- | -------- | ------------------------------------------ |
| `clusterEndpoint` | `string` | The Aurora DSQL cluster endpoint hostname. |
| `region`          | `string` | The AWS region of the DSQL cluster.        |

### `DSQLAdapter` (class)

Database adapter for Amazon Aurora DSQL. Authenticates via IAM-based auth tokens from `@aws-sdk/dsql-signer` and uses the `pg` driver for PostgreSQL-compatible queries through Drizzle ORM.

```typescript
class DSQLAdapter extends BaseDatabaseAdapter
```

#### Properties

| Property   | Type                  | Description                   |
| ---------- | --------------------- | ----------------------------- |
| `platform` | `Platform.AuroraDSQL` | Always `Platform.AuroraDSQL`. |

#### Constructor

```typescript
constructor(config: DSQLAdapterConfig)
```

| Parameter | Type                | Description                           |
| --------- | ------------------- | ------------------------------------- |
| `config`  | `DSQLAdapterConfig` | Aurora DSQL connection configuration. |

#### Methods

All methods implement the `DatabaseAdapter` interface. See [adapter.md](../adapter.md) for full interface documentation.

| Method                               | Description                                                                                                                   |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `initialize()`                       | Generates IAM auth token via `DsqlSigner`, connects `pg.Client` to Aurora DSQL, and initializes Drizzle ORM with full schema. |
| `close()`                            | Closes the PostgreSQL client connection.                                                                                      |
| `get(store, id)`                     | Uses `drizzle.select().from(table).where(eq(table.id, id)).limit(1)`.                                                         |
| `getAll(store)`                      | Uses `drizzle.select().from(table)`.                                                                                          |
| `getByField(store, field, value)`    | Uses `drizzle.select().from(table).where(eq(column, value))`.                                                                 |
| `put(store, entity)`                 | Uses `drizzle.insert(table).values().onConflictDoUpdate()` for upsert.                                                        |
| `putMany(store, entities)`           | Wraps multiple `put()` calls in a Drizzle transaction.                                                                        |
| `delete(store, id)`                  | Uses `drizzle.delete(table).where(eq(table.id, id))`.                                                                         |
| `deleteAll(store)`                   | Uses `drizzle.delete(table)` without a where clause.                                                                          |
| `deleteByField(store, field, value)` | Uses `drizzle.delete(table).where(eq(column, value))`.                                                                        |
| `transaction(fn)`                    | Uses `drizzle.transaction()` with an active transaction context stored on the instance.                                       |
| `getSyncStatus(fileKey)`             | Queries the `syncStatus` Drizzle table.                                                                                       |
| `setSyncStatus(fileKey, sha, etag?)` | Upserts into `syncStatus` table with `onConflictDoUpdate`.                                                                    |
| `deleteSyncStatus(fileKey)`          | Deletes from `syncStatus` table.                                                                                              |

#### Transaction Context

The adapter maintains an `activeTransaction` property. During a transaction, all database operations use the transaction context instead of the main connection. Nested transactions revert to the previous context when complete.

#### Dependencies

- `@aws-sdk/dsql-signer` -- IAM authentication token generation
- `pg` -- PostgreSQL client driver
- `drizzle-orm/node-postgres` -- Drizzle ORM PostgreSQL adapter
- `drizzle-orm` -- Query builder and operators (`eq`)

All dependencies are loaded via `createRequire` for CommonJS compatibility.

## Usage Example

```typescript
import { createAdapter, Platform } from '@armoury/shared';

const adapter = await createAdapter({
    platform: Platform.AuroraDSQL,
    dsqlConfig: {
        clusterEndpoint: 'my-cluster.dsql.us-east-1.on.aws',
        region: 'us-east-1',
    },
});

const units = await adapter.getAll('unit');
await adapter.close();
```
