# FriendModel

Bidirectional friend relationship model between users.

**Source:** `src/shared/data/BSData/wh40k10e/models/FriendModel.ts`

## Overview

Represents a bidirectional friendship between two users. A friend relationship is stored once and can be queried by either user's ID. Friends can optionally share army lists and view each other's match history.

## Exports

### `FriendStatus` (type alias)

Status of a friend request or friendship.

```typescript
type FriendStatus = 'pending' | 'accepted' | 'blocked';
```

| Value        | Description                               |
| ------------ | ----------------------------------------- |
| `'pending'`  | Friend request sent but not yet accepted. |
| `'accepted'` | Friendship is active.                     |
| `'blocked'`  | User has blocked this friend.             |

### `Friend` (interface)

Represents a friend relationship between two users.

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

| Property              | Type             | Description                                    |
| --------------------- | ---------------- | ---------------------------------------------- |
| `id`                  | `string`         | Unique identifier for the friend relationship. |
| `requesterId`         | `string`         | ID of the user who initiated the request.      |
| `receiverId`          | `string`         | ID of the user who received the request.       |
| `status`              | `FriendStatus`   | Current friendship status.                     |
| `requesterName`       | `string`         | Display name of the requester.                 |
| `requesterPicture`    | `string \| null` | Profile picture URL of the requester.          |
| `receiverName`        | `string`         | Display name of the receiver.                  |
| `receiverPicture`     | `string \| null` | Profile picture URL of the receiver.           |
| `canShareArmyLists`   | `boolean`        | Whether the friend can share army lists.       |
| `canViewMatchHistory` | `boolean`        | Whether the friend can view match history.     |
| `createdAt`           | `string`         | Creation timestamp (ISO 8601).                 |
| `updatedAt`           | `string`         | Last update timestamp (ISO 8601).              |

## Usage Example

```typescript
import type { Friend, FriendStatus } from '@armoury/shared';

const friendship: Friend = {
    id: 'friend-1',
    requesterId: 'user-123',
    receiverId: 'user-456',
    status: 'accepted',
    requesterName: 'Player 1',
    requesterPicture: 'https://example.com/p1.jpg',
    receiverName: 'Player 2',
    receiverPicture: null,
    canShareArmyLists: true,
    canViewMatchHistory: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

// Store via adapter
await adapter.put('friend', friendship);

// Query by requester
const sentRequests = await adapter.getByField('friend', 'requesterId', 'user-123');

// Query by receiver
const receivedRequests = await adapter.getByField('friend', 'receiverId', 'user-456');
```
