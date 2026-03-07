# BaseDAO

Abstract base class providing CRUD operations for a single entity store. All concrete DAOs extend this class to inherit standard database operations.

**Source:** `src/shared/data/dao/BaseDAO.ts`

---

## Exports

### `BaseDAO<T>`

Abstract base class that provides CRUD operations for a single entity store. Subclasses specify the entity type `T` and the store name used by the database adapter.

```typescript
abstract class BaseDAO<T> {
    protected readonly adapter: DatabaseAdapter;
    protected readonly store: string;
    
    constructor(adapter: DatabaseAdapter, store: string);
    
    get(id: string): Promise<T | null>;
    list(): Promise<T[]>;
    save(entity: T): Promise<void>;
    saveMany(entities: T[]): Promise<void>;
    delete(id: string): Promise<void>;
    deleteAll(): Promise<void>;
    count(): Promise<number>;
    
    protected getStore(): EntityType;
}
```

---

## Constructor

### `constructor(adapter, store)`

Creates a new DAO bound to a specific store name.

| Parameter | Type | Description |
|-----------|------|-------------|
| `adapter` | `DatabaseAdapter` | Database adapter used to execute operations. |
| `store` | `string` | Store name used by the adapter for this entity type. |

---

## Methods

### `get(id)`

Retrieves a single entity by its ID.

```typescript
async get(id: string): Promise<T | null>;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Primary key ID of the entity. |

**Returns:** `Promise<T | null>` — The entity if found, otherwise `null`.

---

### `list()`

Lists all entities from the store.

```typescript
async list(): Promise<T[]>;
```

**Returns:** `Promise<T[]>` — Array of all entities in the store.

---

### `save(entity)`

Saves an entity to the store, inserting or updating by ID.

```typescript
async save(entity: T): Promise<void>;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `entity` | `T` | Entity instance to persist. |

**Returns:** `Promise<void>` — Resolves when the entity is saved.

---

### `saveMany(entities)`

Saves multiple entities to the store in a batch.

```typescript
async saveMany(entities: T[]): Promise<void>;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `entities` | `T[]` | Entities to persist. |

**Returns:** `Promise<void>` — Resolves when all entities are saved.

---

### `delete(id)`

Deletes a single entity by ID.

```typescript
async delete(id: string): Promise<void>;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Primary key ID of the entity. |

**Returns:** `Promise<void>` — Resolves when the entity is deleted.

---

### `deleteAll()`

Deletes all entities from the store.

```typescript
async deleteAll(): Promise<void>;
```

**Returns:** `Promise<void>` — Resolves when all entities are deleted.

---

### `count()`

Counts the total number of entities in the store.

```typescript
async count(): Promise<number>;
```

**Returns:** `Promise<number>` — The count of entities.

---

### `getStore()` (protected)

Returns the store name asserted to the adapter entity type.

```typescript
protected getStore(): EntityType;
```

**Returns:** `EntityType` — Store name as an EntityType.

---

## Usage Examples

### Creating a custom DAO

```typescript
import { BaseDAO } from '@armoury/shared';
import type { DatabaseAdapter } from '@armoury/shared';
import type { Campaign } from './models/Campaign.js';

export class CampaignDAO extends BaseDAO<Campaign> {
    constructor(adapter: DatabaseAdapter) {
        super(adapter, 'campaign');
    }
    
    // Add custom methods beyond CRUD
    async getActiveCampaigns(): Promise<Campaign[]> {
        const all = await this.list();
        return all.filter(c => c.status === 'active');
    }
}
```

### Using a DAO for CRUD operations

```typescript
import { createAdapter, Platform } from '@armoury/shared';
import { CampaignDAO } from './CampaignDAO.js';

const adapter = await createAdapter({ platform: Platform.IndexedDB });
const campaigns = new CampaignDAO(adapter);

// Create
await campaigns.save({
    id: 'campaign-1',
    name: 'Crusade of Fire',
    status: 'active',
    createdAt: new Date().toISOString(),
});

// Read
const campaign = await campaigns.get('campaign-1');
const allCampaigns = await campaigns.list();

// Update (same as create)
campaign.status = 'completed';
await campaigns.save(campaign);

// Delete
await campaigns.delete('campaign-1');

// Count
const count = await campaigns.count();
```

### Batch operations

```typescript
import { CampaignDAO } from './CampaignDAO.js';

const campaigns = new CampaignDAO(adapter);

// Save multiple campaigns at once
await campaigns.saveMany([
    { id: 'c1', name: 'Campaign 1', status: 'active', createdAt: '2024-01-01' },
    { id: 'c2', name: 'Campaign 2', status: 'active', createdAt: '2024-01-02' },
    { id: 'c3', name: 'Campaign 3', status: 'active', createdAt: '2024-01-03' },
]);

// Delete all campaigns
await campaigns.deleteAll();
```

---

## Related

- [BSDataBaseDAO](./BSDataBaseDAO.md) — Base class for BSData-backed entities
- [AccountDAO](./AccountDAO.md) — Concrete DAO for account entities
- [FriendDAO](./FriendDAO.md) — Concrete DAO for friend entities
- [DataContext](../DataContext.md) — Primary data access facade
