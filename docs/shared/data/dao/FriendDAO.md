# FriendDAO

DAO for managing friend entities. Provides CRUD operations for friend data plus filtering by status.

**Source:** `src/shared/data/dao/FriendDAO.ts`

---

## Exports

### `FriendDAO`

DAO class for managing `Friend` entities. Extends `BaseDAO<Friend>` to inherit standard CRUD operations and adds `listByStatus()` for filtering.

```typescript
class FriendDAO extends BaseDAO<Friend> {
    constructor(adapter: DatabaseAdapter);
    listByStatus(status: FriendStatus): Promise<Friend[]>;
}
```

Inherits all methods from `BaseDAO`:

- `get(id: string): Promise<Friend | null>`
- `list(): Promise<Friend[]>`
- `save(entity: Friend): Promise<void>`
- `saveMany(entities: Friend[]): Promise<void>`
- `delete(id: string): Promise<void>`
- `deleteAll(): Promise<void>`
- `count(): Promise<number>`

---

## Constructor

### `constructor(adapter)`

Creates a DAO instance for friend operations.

| Parameter | Type | Description |
|-----------|------|-------------|
| `adapter` | `DatabaseAdapter` | Database adapter used to execute operations. |

---

## Methods

### `listByStatus(status)`

Lists friends filtered by status.

```typescript
async listByStatus(status: FriendStatus): Promise<Friend[]>;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | `FriendStatus` | Friend status to filter by (`'pending'`, `'accepted'`, `'blocked'`). |

**Returns:** `Promise<Friend[]>` — Array of matching friends.

---

## Usage Examples

### Basic CRUD operations

```typescript
import { createAdapter, Platform } from '@armoury/shared';
import { FriendDAO } from '@armoury/shared';
import type { Friend } from '@armoury/shared';

const adapter = await createAdapter({ platform: Platform.IndexedDB });
const friends = new FriendDAO(adapter);

// Create a friend request
const friend: Friend = {
    id: 'friend-1',
    requesterId: 'user-1',
    receiverId: 'user-2',
    status: 'pending',
    requesterName: 'Alice',
    requesterPicture: 'https://example.com/alice.jpg',
    receiverName: 'Bob',
    receiverPicture: 'https://example.com/bob.jpg',
    canShareArmyLists: true,
    canViewMatchHistory: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

await friends.save(friend);

// Read a friend
const retrieved = await friends.get('friend-1');

// Update friend status
retrieved.status = 'accepted';
await friends.save(retrieved);

// List all friends
const allFriends = await friends.list();

// Delete a friend
await friends.delete('friend-1');
```

### Filtering by status

```typescript
import { FriendDAO } from '@armoury/shared';

const friends = new FriendDAO(adapter);

// Get all accepted friends
const acceptedFriends = await friends.listByStatus('accepted');
console.log(`You have ${acceptedFriends.length} friends`);

// Get all pending friend requests
const pendingRequests = await friends.listByStatus('pending');
console.log(`You have ${pendingRequests.length} pending requests`);

// Get all blocked users
const blockedUsers = await friends.listByStatus('blocked');
```

### Using with DataContext

```typescript
import { DataContext, Platform } from '@armoury/shared';
import { wh40k10eSystem } from '@shared/systems/wh40k10e/system.js';

const dc = await DataContext.builder()
    .system(wh40k10eSystem)
    .platform(Platform.IndexedDB)
    .build();

// Access FriendDAO via DataContext
const acceptedFriends = await dc.social.listByStatus('accepted');
const pendingRequests = await dc.social.listByStatus('pending');

// Save a new friend request
await dc.social.save({
    id: 'friend-2',
    requesterId: 'user-1',
    receiverId: 'user-3',
    status: 'pending',
    requesterName: 'Alice',
    requesterPicture: null,
    receiverName: 'Charlie',
    receiverPicture: null,
    canShareArmyLists: false,
    canViewMatchHistory: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
});

await dc.close();
```

### Batch operations

```typescript
import { FriendDAO } from '@armoury/shared';

const friends = new FriendDAO(adapter);

// Save multiple friend requests at once
await friends.saveMany([
    {
        id: 'friend-1',
        requesterId: 'user-1',
        receiverId: 'user-2',
        status: 'accepted',
        requesterName: 'Alice',
        requesterPicture: null,
        receiverName: 'Bob',
        receiverPicture: null,
        canShareArmyLists: true,
        canViewMatchHistory: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'friend-2',
        requesterId: 'user-1',
        receiverId: 'user-3',
        status: 'pending',
        requesterName: 'Alice',
        requesterPicture: null,
        receiverName: 'Charlie',
        receiverPicture: null,
        canShareArmyLists: false,
        canViewMatchHistory: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
]);

// Count total friends
const count = await friends.count();
console.log(`Total friend records: ${count}`);
```

---

## Related

- [BaseDAO](./BaseDAO.md) — Abstract base class for CRUD operations
- [AccountDAO](./AccountDAO.md) — DAO for account entities
- [DataContext](../DataContext.md) — Primary data access facade
- [Friend](../../models/FriendModel.md) — Friend entity model
