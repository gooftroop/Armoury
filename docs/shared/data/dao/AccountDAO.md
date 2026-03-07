# AccountDAO

DAO for managing account entities. Provides CRUD operations for user account data.

**Source:** `src/shared/data/dao/AccountDAO.ts`

---

## Exports

### `AccountDAO`

DAO class for managing `Account` entities. Extends `BaseDAO<Account>` to inherit standard CRUD operations.

```typescript
class AccountDAO extends BaseDAO<Account> {
    constructor(adapter: DatabaseAdapter);
}
```

Inherits all methods from `BaseDAO`:

- `get(id: string): Promise<Account | null>`
- `list(): Promise<Account[]>`
- `save(entity: Account): Promise<void>`
- `saveMany(entities: Account[]): Promise<void>`
- `delete(id: string): Promise<void>`
- `deleteAll(): Promise<void>`
- `count(): Promise<number>`

---

## Constructor

### `constructor(adapter)`

Creates a DAO instance for account operations.

| Parameter | Type | Description |
|-----------|------|-------------|
| `adapter` | `DatabaseAdapter` | Database adapter used to execute operations. |

---

## Usage Examples

### Basic CRUD operations

```typescript
import { createAdapter, Platform } from '@armoury/shared';
import { AccountDAO } from '@armoury/shared';
import type { Account } from '@armoury/shared';

const adapter = await createAdapter({ platform: Platform.IndexedDB });
const accounts = new AccountDAO(adapter);

// Create an account
const account: Account = {
    id: 'user-1',
    displayName: 'John Doe',
    email: 'john@example.com',
    emailVerified: true,
    linkedProviders: ['google'],
    preferences: { theme: 'dark', notifications: true },
    lastSyncAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

await accounts.save(account);

// Read an account
const retrieved = await accounts.get('user-1');
console.log(retrieved?.displayName); // 'John Doe'

// Update an account
retrieved.displayName = 'Jane Doe';
await accounts.save(retrieved);

// List all accounts
const allAccounts = await accounts.list();

// Delete an account
await accounts.delete('user-1');
```

### Using with DataContext

```typescript
import { DataContext, Platform } from '@armoury/shared';
import { wh40k10eSystem } from '@shared/systems/wh40k10e/system.js';

const dc = await DataContext.builder()
    .system(wh40k10eSystem)
    .platform(Platform.IndexedDB)
    .build();

// Access AccountDAO via DataContext
const account = await dc.accounts.get('user-1');
await dc.accounts.save({
    id: 'user-2',
    displayName: 'Alice',
    email: 'alice@example.com',
    emailVerified: false,
    linkedProviders: [],
    preferences: {},
    lastSyncAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
});

await dc.close();
```

### Batch operations

```typescript
import { AccountDAO } from '@armoury/shared';

const accounts = new AccountDAO(adapter);

// Save multiple accounts at once
await accounts.saveMany([
    {
        id: 'user-1',
        displayName: 'User 1',
        email: 'user1@example.com',
        emailVerified: true,
        linkedProviders: ['google'],
        preferences: {},
        lastSyncAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'user-2',
        displayName: 'User 2',
        email: 'user2@example.com',
        emailVerified: false,
        linkedProviders: [],
        preferences: {},
        lastSyncAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
]);

// Count accounts
const count = await accounts.count();
console.log(`Total accounts: ${count}`);
```

---

## Related

- [BaseDAO](./BaseDAO.md) — Abstract base class for CRUD operations
- [FriendDAO](./FriendDAO.md) — DAO for friend entities
- [DataContext](../DataContext.md) — Primary data access facade
- [Account](../../models/AccountModel.md) — Account entity model
