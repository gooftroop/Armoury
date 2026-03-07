# routes/participants.ts

Participant campaign CRUD handlers. Manages per-player campaign entries that are children of a master campaign. Joining and leaving a campaign also updates the master campaign's `participantIds` array within a transaction.

## Exports

| Export              | Type           | Description                           |
| ------------------- | -------------- | ------------------------------------- |
| `joinCampaign`      | `RouteHandler` | Adds a participant to a campaign      |
| `listParticipants`  | `RouteHandler` | Lists participants in a campaign      |
| `getParticipant`    | `RouteHandler` | Retrieves a participant by ID         |
| `updateParticipant` | `RouteHandler` | Updates a participant                 |
| `deleteParticipant` | `RouteHandler` | Removes a participant from a campaign |

## Endpoints

### POST /campaigns/:id/participants

Joins a campaign as a participant. Verifies the campaign exists, creates the participant record, and atomically adds the participant ID to the master campaign's `participantIds` array.

```bash
curl -X POST https://api.example.com/campaigns/550e8400.../participants \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{
        "displayName": "Captain Titus",
        "armyId": "army-uuid-here",
        "armyName": "Ultramarines 2000pts",
        "currentPhaseId": "phase-1"
    }'
```

**Response** (201):

```json
{
    "id": "generated-uuid",
    "masterCampaignId": "550e8400...",
    "accountId": "auth0|abc123",
    "displayName": "Captain Titus",
    "isOrganizer": false,
    "armyId": "army-uuid-here",
    "armyName": "Ultramarines 2000pts",
    "currentPhaseId": "phase-1",
    "matchesInCurrentPhase": 0,
    "crusadeData": null,
    "matchIds": [],
    "joinedAt": "2026-02-07T21:00:00.000Z",
    "updatedAt": "2026-02-07T21:00:00.000Z"
}
```

### GET /campaigns/:id/participants

Lists all participants in a campaign, filtered by `masterCampaignId`.

```bash
curl https://api.example.com/campaigns/550e8400.../participants \
    -H "Authorization: Bearer <token>"
```

### GET /campaigns/:id/participants/:pid

Retrieves a single participant by ID. Returns 404 if not found.

### PUT /campaigns/:id/participants/:pid

Updates a participant's details (display name, army, phase progress, crusade data).

```bash
curl -X PUT https://api.example.com/campaigns/550e8400.../participants/pid-here \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{
        "displayName": "Captain Titus",
        "armyId": "army-uuid-here",
        "armyName": "Ultramarines 2000pts",
        "currentPhaseId": "phase-2",
        "matchesInCurrentPhase": 3
    }'
```

### DELETE /campaigns/:id/participants/:pid

Removes a participant from a campaign. Atomically deletes the participant record and removes the participant ID from the master campaign's `participantIds` array. Returns 204 on success.

```bash
curl -X DELETE https://api.example.com/campaigns/550e8400.../participants/pid-here \
    -H "Authorization: Bearer <token>"
```
