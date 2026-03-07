# local-adapter.ts

Local PostgreSQL database adapter for campaigns service development. Implements the `DatabaseAdapter` interface against a Postgres database (via docker-compose) instead of Aurora DSQL.

**Source:** `src/services/campaigns/src/utils/local-adapter.ts`

---

## Exports

### `LocalAdapterConfig`

Configuration interface for the local PostgreSQL connection.

```typescript
interface LocalAdapterConfig {
    /** PostgreSQL hostname. */
    host: string;

    /** PostgreSQL port number. */
    port: number;

    /** PostgreSQL username. */
    user: string;

    /** PostgreSQL password. */
    password: string;

    /** PostgreSQL database name. */
    database: string;

    /** Whether to enable SSL for the connection. */
    ssl: boolean;
}
```

---

### `LocalDatabaseAdapter`

A `DatabaseAdapter` implementation backed by PostgreSQL. Uses the `pg` library (loaded via `createRequire`) for database connectivity. Provides full CRUD operations, field-based queries, and transaction support with nesting via a depth counter.

```typescript
class LocalDatabaseAdapter implements DatabaseAdapter {
    constructor(config: LocalAdapterConfig);
}
```

**Constructor Parameters:**

| Parameter | Type                 | Description                         |
| --------- | -------------------- | ----------------------------------- |
| `config`  | `LocalAdapterConfig` | PostgreSQL connection configuration |

#### Methods

| Method                               | Description                                                                         |
| ------------------------------------ | ----------------------------------------------------------------------------------- |
| `initialize()`                       | Opens the PostgreSQL connection. No-op if already connected.                        |
| `get(store, id)`                     | Retrieves a single entity by ID. Returns `null` if not found.                       |
| `getAll(store)`                      | Retrieves all entities for a store.                                                 |
| `getByField(store, field, value)`    | Retrieves entities matching a field value.                                          |
| `put(store, entity)`                 | Upserts an entity using `INSERT ... ON CONFLICT DO UPDATE`.                         |
| `delete(store, id)`                  | Deletes a single entity by ID.                                                      |
| `deleteByField(store, field, value)` | Deletes all entities matching a field value.                                        |
| `transaction(fn)`                    | Wraps `fn` in `BEGIN`/`COMMIT`/`ROLLBACK`. Supports nested calls via depth counter. |

#### Store Configuration

The adapter maps entity types to PostgreSQL tables using an internal `STORE_CONFIGS` constant:

| Entity Type           | Table Name              | JSON Fields                                                        |
| --------------------- | ----------------------- | ------------------------------------------------------------------ |
| `masterCampaign`      | `master_campaigns`      | narrative, phases, customRules, rankings, participantIds, matchIds |
| `participantCampaign` | `participant_campaigns` | crusadeData, matchIds                                              |

Field names are mapped between camelCase (entity) and snake_case (database column). JSON fields are automatically serialized on write (`JSON.stringify`) and parsed on read (`JSON.parse`).

---

## Usage Example

```typescript
import { LocalDatabaseAdapter } from '@campaigns/src/utils/local-adapter.js';
import type { LocalAdapterConfig } from '@campaigns/src/utils/local-adapter.js';

const config: LocalAdapterConfig = {
    host: 'localhost',
    port: 5432,
    user: 'armoury',
    password: 'armoury',
    database: 'campaigns',
    ssl: false,
};

const adapter = new LocalDatabaseAdapter(config);
await adapter.initialize();

// Retrieve all campaigns
const campaigns = await adapter.getAll('masterCampaign');

// Upsert a campaign
await adapter.put('masterCampaign', {
    id: 'abc-123',
    name: 'Crusade of Fire',
    type: 'crusade',
    // ... remaining fields
});

// Transactional operation
await adapter.transaction(async () => {
    await adapter.delete('participantCampaign', 'p-456');
    await adapter.put('masterCampaign', updatedCampaign);
});
```
