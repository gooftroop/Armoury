# enums.ts

Enum definitions for the shared package, providing type-safe constants for platform selection and other configuration values.

**Source:** `src/shared/types/enums.ts`

## Overview

This file defines enums used throughout the application. Currently it contains the `Platform` enum, which specifies the database backend used by the adapter factory pattern.

---

## Enums

### `Platform`

Supported database platforms for the adapter pattern. Each value corresponds to a specific storage backend optimized for a particular deployment environment.

```typescript
enum Platform {
    SQLite = 'sqlite',
    IndexedDB = 'indexeddb',
    AuroraDSQL = 'aurora-dsql',
}
```

| Member       | Value           | Description                                                        |
| ------------ | --------------- | ------------------------------------------------------------------ |
| `SQLite`     | `'sqlite'`      | File-based relational database for mobile and desktop applications |
| `IndexedDB`  | `'indexeddb'`   | Browser-based key-value store for web applications                 |
| `AuroraDSQL` | `'aurora-dsql'` | AWS Aurora serverless database for server-side applications        |

### Usage

Use the `Platform` enum with `createAdapter()` to create a database adapter for the target environment. Always use the enum members instead of raw string literals.

```typescript
import { Platform, createAdapter } from '@armoury/shared';

// Create an adapter for a web application
const webAdapter = await createAdapter({ platform: Platform.IndexedDB });

// Create an adapter for a mobile application
const mobileAdapter = await createAdapter({ platform: Platform.SQLite });

// Create an adapter for a server application
const serverAdapter = await createAdapter({ platform: Platform.AuroraDSQL });
```

### Checking Platform at Runtime

The enum can also be used for runtime comparisons:

```typescript
import { Platform } from '@armoury/shared';

function getPlatformLabel(platform: Platform): string {
    switch (platform) {
        case Platform.SQLite:
            return 'SQLite (Mobile/Desktop)';
        case Platform.IndexedDB:
            return 'IndexedDB (Web)';
        case Platform.AuroraDSQL:
            return 'Aurora DSQL (Server)';
    }
}
```
