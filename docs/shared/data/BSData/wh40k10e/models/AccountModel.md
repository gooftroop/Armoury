# AccountModel

Account data model for user authentication and preferences, cached from Auth0.

**Source:** `src/shared/data/BSData/wh40k10e/models/AccountModel.ts`

## Exports

### `LinkedProvider` (interface)

A linked social provider connected to the user's account.

```typescript
interface LinkedProvider {
    provider: string;
    providerUserId: string;
    connection: string;
    isSocial: boolean;
}
```

| Property         | Type      | Description                                                                  |
| ---------------- | --------- | ---------------------------------------------------------------------------- |
| `provider`       | `string`  | Authentication provider name (e.g., `"google"`, `"github"`, `"auth0"`).      |
| `providerUserId` | `string`  | User's unique identifier at the provider.                                    |
| `connection`     | `string`  | Auth0 connection name (e.g., `"google-oauth2"`, `"github"`).                 |
| `isSocial`       | `boolean` | Whether this is a social provider (`true`) or enterprise/database (`false`). |

### `UserPreferences` (interface)

User preferences for the application. Stored locally, not synced to Auth0.

```typescript
interface UserPreferences {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    notificationsEnabled: boolean;
}
```

| Property               | Type                          | Description                                     |
| ---------------------- | ----------------------------- | ----------------------------------------------- |
| `theme`                | `'light' \| 'dark' \| 'auto'` | UI theme preference.                            |
| `language`             | `string`                      | Preferred language code (e.g., `"en"`, `"es"`). |
| `notificationsEnabled` | `boolean`                     | Whether push notifications are enabled.         |

### `Account` (interface)

Complete user account with Auth0 profile cache and application preferences. The Auth0 `sub` field (format `"provider|user_id"`) serves as the primary key.

```typescript
interface Account {
    id: string;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
    nickname: string | null;
    picture: string | null;
    email: string | null;
    emailVerified: boolean;
    linkedProviders: LinkedProvider[];
    preferences: UserPreferences;
    lastSyncAt: string;
    createdAt: string;
    updatedAt: string;
}
```

| Property          | Type               | Description                                                            |
| ----------------- | ------------------ | ---------------------------------------------------------------------- |
| `id`              | `string`           | Auth0 subject identifier (format: `"provider\|user_id"`). Primary key. |
| `displayName`     | `string \| null`   | User's display name (cached from Auth0).                               |
| `firstName`       | `string \| null`   | User's first name (cached from Auth0).                                 |
| `lastName`        | `string \| null`   | User's last name (cached from Auth0).                                  |
| `nickname`        | `string \| null`   | User's nickname (cached from Auth0).                                   |
| `picture`         | `string \| null`   | Profile picture URL (cached from Auth0).                               |
| `email`           | `string \| null`   | Email address (cached from Auth0).                                     |
| `emailVerified`   | `boolean`          | Whether the email is verified.                                         |
| `linkedProviders` | `LinkedProvider[]` | Linked social providers.                                               |
| `preferences`     | `UserPreferences`  | Application-specific preferences.                                      |
| `lastSyncAt`      | `string`           | Last Auth0 sync timestamp (ISO 8601).                                  |
| `createdAt`       | `string`           | Account creation timestamp (ISO 8601).                                 |
| `updatedAt`       | `string`           | Last update timestamp (ISO 8601).                                      |

## Usage Example

```typescript
import type { Account, UserPreferences } from '@armoury/shared';

const account: Account = {
    id: 'google-oauth2|1234567890',
    displayName: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    nickname: 'johnd',
    picture: 'https://example.com/photo.jpg',
    email: 'john@example.com',
    emailVerified: true,
    linkedProviders: [
        { provider: 'google', providerUserId: '1234567890', connection: 'google-oauth2', isSocial: true },
    ],
    preferences: { theme: 'dark', language: 'en', notificationsEnabled: true },
    lastSyncAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

// Store via adapter
await adapter.put('account', account);

// Retrieve
const stored = await adapter.get('account', 'google-oauth2|1234567890');
```
