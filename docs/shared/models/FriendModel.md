# FriendModel.ts

Friend Model - Bidirectional friend relationships between users. Represents a bidirectional friendship between two users that can be queried by either user's ID.

**Source:** `src/shared/models/FriendModel.ts`

---

## Exports

### `Friend`

Interface representing a friend relationship between two users. A bidirectional friendship is stored once and can be queried by either user's ID. Friends can optionally share army lists and view each other's match history.

```typescript
interface Friend {
    id: string;
    requesterId: string;
    receiverId: string;
    status: FriendStatus;
    requesterName: string;
    requesterPicture: string | null;
    receiverName: string;
    receiverPicture: string | null;
    canShareArmyLists: boolean;
    canViewMatchHistory: boolean;
    createdAt: string;
    updatedAt: string;
}
```

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier for the friend relationship |
| `requesterId` | `string` | ID of the user who initiated the friend request |
| `receiverId` | `string` | ID of the user who received the friend request |
| `status` | `FriendStatus` | Current status of the friendship (`pending`, `accepted`, or `blocked`) |
| `requesterName` | `string` | Display name of the user who initiated the request |
| `requesterPicture` | `string \| null` | Profile picture URL of the requester, or `null` if not set |
| `receiverName` | `string` | Display name of the user who received the request |
| `receiverPicture` | `string \| null` | Profile picture URL of the receiver, or `null` if not set |
| `canShareArmyLists` | `boolean` | Whether the friend can share army lists with this user |
| `canViewMatchHistory` | `boolean` | Whether the friend can view this user's match history |
| `createdAt` | `string` | Timestamp when the friend relationship was created. ISO 8601 format. |
| `updatedAt` | `string` | Timestamp when the friend relationship was last updated. ISO 8601 format. |

---

### `FriendStatus`

Type representing the status of a friend request or friendship.

```typescript
type FriendStatus = 'pending' | 'accepted' | 'blocked';
```

| Value | Description |
|-------|-------------|
| `pending` | Friend request sent but not yet accepted |
| `accepted` | Friendship is active |
| `blocked` | User has blocked this friend |

---

## Usage Examples

### Create a friend request

```typescript
import type { Friend, FriendStatus } from '@armoury/shared';
import { v4 as uuidv4 } from 'uuid';

const friendRequest: Friend = {
    id: uuidv4(),
    requesterId: 'google-oauth2|1234567890',
    receiverId: 'github|9876543210',
    status: 'pending',
    requesterName: 'John Doe',
    requesterPicture: 'https://example.com/john.jpg',
    receiverName: 'Jane Smith',
    receiverPicture: 'https://example.com/jane.jpg',
    canShareArmyLists: false,
    canViewMatchHistory: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};
```

### Access via DataContext

```typescript
import { DataContext, Platform } from '@armoury/shared';
import { wh40k10eSystem } from '@armoury/systems';

const dc = await DataContext.builder()
    .system(wh40k10eSystem)
    .platform(Platform.IndexedDB)
    .build();

// Send a friend request
const friendRequest: Friend = {
    id: uuidv4(),
    requesterId: currentUserId,
    receiverId: targetUserId,
    status: 'pending',
    requesterName: currentUser.displayName,
    requesterPicture: currentUser.picture,
    receiverName: targetUser.displayName,
    receiverPicture: targetUser.picture,
    canShareArmyLists: false,
    canViewMatchHistory: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

await dc.social.save(friendRequest);
```

### Accept a friend request

```typescript
const dc = await DataContext.builder()
    .system(wh40k10eSystem)
    .platform(Platform.IndexedDB)
    .build();

// Get pending friend request
const friendRequest = await dc.social.get(friendRequestId);
if (friendRequest && friendRequest.status === 'pending') {
    // Accept the request
    friendRequest.status = 'accepted';
    friendRequest.updatedAt = new Date().toISOString();
    await dc.social.save(friendRequest);
    
    console.log('Friend request accepted');
}
```

### List friends by status

```typescript
const dc = await DataContext.builder()
    .system(wh40k10eSystem)
    .platform(Platform.IndexedDB)
    .build();

// List all accepted friends
const friends = await dc.social.listByStatus('accepted');
console.log(`You have ${friends.length} friends`);

for (const friend of friends) {
    // Determine which user is the friend (not the current user)
    const friendName = friend.requesterId === currentUserId
        ? friend.receiverName
        : friend.requesterName;
    
    console.log(`- ${friendName}`);
}
```

### Update sharing permissions

```typescript
const dc = await DataContext.builder()
    .system(wh40k10eSystem)
    .platform(Platform.IndexedDB)
    .build();

const friend = await dc.social.get(friendId);
if (friend) {
    // Enable army list sharing
    friend.canShareArmyLists = true;
    friend.canViewMatchHistory = true;
    friend.updatedAt = new Date().toISOString();
    await dc.social.save(friend);
    
    console.log('Sharing permissions updated');
}
```

### Block a friend

```typescript
const dc = await DataContext.builder()
    .system(wh40k10eSystem)
    .platform(Platform.IndexedDB)
    .build();

const friend = await dc.social.get(friendId);
if (friend) {
    // Block the friend
    friend.status = 'blocked';
    friend.canShareArmyLists = false;
    friend.canViewMatchHistory = false;
    friend.updatedAt = new Date().toISOString();
    await dc.social.save(friend);
    
    console.log('Friend blocked');
}
```

### Query friends for a specific user

```typescript
const dc = await DataContext.builder()
    .system(wh40k10eSystem)
    .platform(Platform.IndexedDB)
    .build();

// Get all friends for a user (as requester or receiver)
const allFriends = await dc.social.list();
const userFriends = allFriends.filter(
    f => (f.requesterId === currentUserId || f.receiverId === currentUserId) && f.status === 'accepted'
);

console.log(`User has ${userFriends.length} friends`);
```

### Display friend with correct name/picture

```typescript
const dc = await DataContext.builder()
    .system(wh40k10eSystem)
    .platform(Platform.IndexedDB)
    .build();

const friend = await dc.social.get(friendId);
if (friend) {
    // Determine which user is the friend (not the current user)
    const isRequester = friend.requesterId === currentUserId;
    const friendName = isRequester ? friend.receiverName : friend.requesterName;
    const friendPicture = isRequester ? friend.receiverPicture : friend.requesterPicture;
    
    console.log(`Friend: ${friendName}`);
    if (friendPicture) {
        console.log(`Picture: ${friendPicture}`);
    }
}
```

---

## Related

- [FriendDAO](../data/dao/FriendDAO.md) — DAO for friend relationship management
- [AccountModel](./AccountModel.md) — User account model
- [DataContext](../data/DataContext.md) — Primary data access API
