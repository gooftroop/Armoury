# AccountModel.ts

Account data model for user authentication and preferences. Represents a user account with Auth0 profile information, linked social providers, and application-specific preferences.

**Source:** `src/shared/models/AccountModel.ts`

---

## Exports

### `Account`

Interface representing a complete user account with Auth0 profile cache and application preferences. The Auth0 `sub` field (format `"provider|user_id"`) serves as the primary key.

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

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Auth0 subject identifier (format: `"provider\|user_id"`, e.g. `"google-oauth2\|1234567890"`). Primary key. |
| `displayName` | `string \| null` | The user's display name (cached from Auth0). |
| `firstName` | `string \| null` | The user's first name (cached from Auth0). |
| `lastName` | `string \| null` | The user's last name (cached from Auth0). |
| `nickname` | `string \| null` | The user's nickname (cached from Auth0). |
| `picture` | `string \| null` | URL to the user's profile picture (cached from Auth0). |
| `email` | `string \| null` | The user's email address (cached from Auth0). |
| `emailVerified` | `boolean` | Whether the user's email has been verified by Auth0. |
| `linkedProviders` | `LinkedProvider[]` | List of linked social providers (e.g. Google, GitHub, Auth0 database). |
| `preferences` | `UserPreferences` | Application-specific user preferences (not synced to Auth0). |
| `lastSyncAt` | `string` | Timestamp of the last sync with Auth0. ISO 8601 format. |
| `createdAt` | `string` | Timestamp when the account was created. ISO 8601 format. |
| `updatedAt` | `string` | Timestamp when the account was last updated. ISO 8601 format. |

---

### `LinkedProvider`

Interface representing a linked social provider connected to the user's account.

```typescript
interface LinkedProvider {
    provider: string;
    providerUserId: string;
    connection: string;
    isSocial: boolean;
}
```

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `provider` | `string` | The authentication provider name (e.g. `"google"`, `"github"`, `"auth0"`). |
| `providerUserId` | `string` | The user's unique identifier at the provider. |
| `connection` | `string` | The connection name used by Auth0 (e.g. `"google-oauth2"`, `"github"`). |
| `isSocial` | `boolean` | Whether this is a social provider (`true`) or enterprise/database (`false`). |

---

### `UserPreferences`

Interface representing user preferences for the application. Stores user-specific settings that are not synced to Auth0.

```typescript
interface UserPreferences {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    notificationsEnabled: boolean;
}
```

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `theme` | `'light' \| 'dark' \| 'auto'` | The UI theme preference (light, dark, or auto-detect based on system). |
| `language` | `string` | The preferred language code (e.g. `"en"`, `"es"`, `"fr"`). |
| `notificationsEnabled` | `boolean` | Whether push notifications are enabled for this user. |

---

## Usage Examples

### Create a new account

```typescript
import type { Account, LinkedProvider, UserPreferences } from '@armoury/shared';

const linkedProviders: LinkedProvider[] = [
    {
        provider: 'google',
        providerUserId: '1234567890',
        connection: 'google-oauth2',
        isSocial: true,
    },
];

const preferences: UserPreferences = {
    theme: 'dark',
    language: 'en',
    notificationsEnabled: true,
};

const account: Account = {
    id: 'google-oauth2|1234567890',
    displayName: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    nickname: 'johndoe',
    picture: 'https://example.com/avatar.jpg',
    email: 'john.doe@example.com',
    emailVerified: true,
    linkedProviders,
    preferences,
    lastSyncAt: new Date().toISOString(),
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

// Get account by ID
const account = await dc.accounts.get('google-oauth2|1234567890');
if (account) {
    console.log(`Welcome, ${account.displayName}!`);
    console.log(`Theme: ${account.preferences.theme}`);
}

// Update account preferences
account.preferences.theme = 'light';
account.updatedAt = new Date().toISOString();
await dc.accounts.save(account);
```

### List all accounts

```typescript
const dc = await DataContext.builder()
    .system(wh40k10eSystem)
    .platform(Platform.IndexedDB)
    .build();

const accounts = await dc.accounts.list();
for (const account of accounts) {
    console.log(`${account.displayName} (${account.email})`);
}
```

### Check linked providers

```typescript
const account = await dc.accounts.get('google-oauth2|1234567890');
if (account) {
    console.log('Linked providers:');
    for (const provider of account.linkedProviders) {
        console.log(`- ${provider.provider} (${provider.connection})`);
    }
}
```

### Update user preferences

```typescript
const account = await dc.accounts.get('google-oauth2|1234567890');
if (account) {
    // Update theme preference
    account.preferences.theme = 'dark';
    account.updatedAt = new Date().toISOString();
    await dc.accounts.save(account);
    
    console.log('Theme updated to dark mode');
}
```

### Sync with Auth0

```typescript
import { Auth0Client } from '@auth0/auth0-spa-js';

const auth0 = new Auth0Client({
    domain: 'your-domain.auth0.com',
    clientId: 'your-client-id',
});

// Get user profile from Auth0
const user = await auth0.getUser();

// Update account with fresh Auth0 data
const account = await dc.accounts.get(user.sub);
if (account) {
    account.displayName = user.name ?? null;
    account.firstName = user.given_name ?? null;
    account.lastName = user.family_name ?? null;
    account.nickname = user.nickname ?? null;
    account.picture = user.picture ?? null;
    account.email = user.email ?? null;
    account.emailVerified = user.email_verified ?? false;
    account.lastSyncAt = new Date().toISOString();
    account.updatedAt = new Date().toISOString();
    
    await dc.accounts.save(account);
}
```

---

## Related

- [AccountDAO](../data/dao/AccountDAO.md) — DAO for account management
- [FriendModel](./FriendModel.md) — Friend relationship model
- [DataContext](../data/DataContext.md) — Primary data access API
