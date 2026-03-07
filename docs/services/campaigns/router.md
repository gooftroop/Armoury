# router.ts

Routes incoming API Gateway events to the correct CRUD handler using an `event.resource` dispatch map.

## Exports

| Export   | Type             | Description                                     |
| -------- | ---------------- | ----------------------------------------------- |
| `router` | `async function` | Routes an event to the correct handler function |

## How It Works

1. Builds a route key from `event.resource` (API Gateway path template) and `event.httpMethod` in the format `resource::METHOD`
2. Looks up the handler in the `ROUTE_MAP` dispatch table
3. Parses the JSON body (returns 400 for malformed JSON)
4. Extracts path parameters directly from `event.pathParameters` (provided by API Gateway)
5. Returns 404 for unmatched routes

## Route Matching

```
POST   /campaigns                          -> createCampaign
GET    /campaigns                          -> listCampaigns
GET    /campaigns/{id}                     -> getCampaign
PUT    /campaigns/{id}                     -> updateCampaign
DELETE /campaigns/{id}                     -> deleteCampaign
POST   /campaigns/{id}/participants        -> joinCampaign
GET    /campaigns/{id}/participants        -> listParticipants
GET    /campaigns/{id}/participants/{pid}  -> getParticipant
PUT    /campaigns/{id}/participants/{pid}  -> updateParticipant
DELETE /campaigns/{id}/participants/{pid}  -> deleteParticipant
```

## Usage Example

```typescript
import { router } from '@campaigns/src/router.js';

const response = await router(event, adapter, userContext);
```
