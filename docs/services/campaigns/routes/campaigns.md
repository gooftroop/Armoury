# routes/campaigns.ts

Master campaign CRUD handlers. Each handler receives the database adapter, parsed request body, path parameters, and authenticated user context.

## Exports

| Export           | Type           | Description                   |
| ---------------- | -------------- | ----------------------------- |
| `createCampaign` | `RouteHandler` | Creates a new master campaign |
| `listCampaigns`  | `RouteHandler` | Lists all master campaigns    |
| `getCampaign`    | `RouteHandler` | Retrieves a campaign by ID    |
| `updateCampaign` | `RouteHandler` | Updates a campaign by ID      |
| `deleteCampaign` | `RouteHandler` | Deletes a campaign by ID      |

## Endpoints

### POST /campaigns

Creates a new master campaign. Sets `organizerId` and `organizerName` from the authenticated user context. Initializes empty arrays for phases, rankings, participantIds, and matchIds.

```bash
curl -X POST https://api.example.com/campaigns \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Armageddon Campaign 2026",
        "type": "crusade",
        "narrative": {
            "crusadeNarrativeRef": null,
            "customNarrative": "The forces of Chaos descend upon Armageddon..."
        },
        "startDate": "2026-03-01T00:00:00.000Z",
        "endDate": null,
        "status": "upcoming",
        "customRules": ["No Flyers in Phase 1"],
        "crusadeRulesId": "core"
    }'
```

**Response** (201):

```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Armageddon Campaign 2026",
    "type": "crusade",
    "organizerId": "auth0|abc123",
    "organizerName": "John",
    "narrative": { "crusadeNarrativeRef": null, "customNarrative": "..." },
    "startDate": "2026-03-01T00:00:00.000Z",
    "endDate": null,
    "status": "upcoming",
    "phases": [],
    "customRules": ["No Flyers in Phase 1"],
    "rankings": [],
    "participantIds": [],
    "matchIds": [],
    "crusadeRulesId": "core",
    "createdAt": "2026-02-07T21:00:00.000Z",
    "updatedAt": "2026-02-07T21:00:00.000Z"
}
```

### GET /campaigns

Lists all master campaigns.

```bash
curl https://api.example.com/campaigns \
    -H "Authorization: Bearer <token>"
```

### GET /campaigns/:id

Retrieves a single master campaign by ID. Returns 404 if not found.

```bash
curl https://api.example.com/campaigns/550e8400-e29b-41d4-a716-446655440000 \
    -H "Authorization: Bearer <token>"
```

### PUT /campaigns/:id

Updates a master campaign. All required fields must be provided (full replacement, not partial).

```bash
curl -X PUT https://api.example.com/campaigns/550e8400-e29b-41d4-a716-446655440000 \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Armageddon Campaign 2026 (Updated)",
        "type": "crusade",
        "narrative": { "crusadeNarrativeRef": null, "customNarrative": "..." },
        "startDate": "2026-03-01T00:00:00.000Z",
        "endDate": "2026-06-01T00:00:00.000Z",
        "status": "active"
    }'
```

### DELETE /campaigns/:id

Deletes a master campaign. Returns 204 with empty body on success.

```bash
curl -X DELETE https://api.example.com/campaigns/550e8400-e29b-41d4-a716-446655440000 \
    -H "Authorization: Bearer <token>"
```
