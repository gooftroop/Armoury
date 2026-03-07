# types.ts

Type definitions for the campaigns service. Defines request/response types, entity interfaces, and the database adapter contract used throughout the service.

## Key Types

| Type                       | Description                                                                    |
| -------------------------- | ------------------------------------------------------------------------------ |
| `UserContext`              | Authenticated user identity (sub, email, name)                                 |
| `PathParameters`           | Route path parameters (id, pid)                                                |
| `ApiResponse`              | API Gateway proxy response (statusCode, headers, body)                         |
| `DatabaseAdapter`          | Database CRUD interface for campaign entities                                  |
| `EntityType`               | Union of supported entity types: `'masterCampaign'` or `'participantCampaign'` |
| `EntityMap`                | Maps EntityType strings to their TypeScript types                              |
| `RouteHandler`             | Function signature for route handler functions                                 |
| `MasterCampaign`           | Master campaign entity with all fields                                         |
| `ParticipantCampaign`      | Participant campaign entity with all fields                                    |
| `CreateCampaignRequest`    | Request body for creating a campaign                                           |
| `UpdateCampaignRequest`    | Request body for updating a campaign                                           |
| `JoinCampaignRequest`      | Request body for joining a campaign                                            |
| `UpdateParticipantRequest` | Request body for updating a participant                                        |

## Entity Types

The service defines its own local copies of entity interfaces (mirroring `@armoury/shared`) to avoid TypeScript rootDir conflicts in the Lambda bundling context. The database adapter interface is scoped to only the two entity types used by this service.

## Usage Example

```typescript
import type { UserContext, ApiResponse, RouteHandler } from '@campaigns/src/types.js';

const myHandler: RouteHandler = async (adapter, body, params, user) => {
    const campaign = await adapter.get('masterCampaign', params?.id ?? '');

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaign),
    };
};
```
