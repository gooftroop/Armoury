# CampaignModel

Campaign data model supporting crusade and generic narrative campaigns.

**Source:** `src/shared/data/BSData/wh40k10e/models/CampaignModel.ts`

## Overview

Supports two campaign types:

- **Master Campaign** -- Parent campaign created by an organizer. Contains phases, rankings, and participant references.
- **Participant Campaign** -- Child campaign per player. Tracks army, crusade progression, and matches.

For Crusade campaigns, participants track unit progression (XP, battle honours, scars, kills). Generic campaigns are simpler narrative campaigns without crusade progression.

## Exports

### `CampaignType` (type alias)

```typescript
type CampaignType = 'crusade' | 'generic';
```

### `CampaignStatus` (type alias)

```typescript
type CampaignStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';
```

### `CampaignPhase` (interface)

A campaign phase with point limits, match requirements, and narrative context.

```typescript
interface CampaignPhase {
    id: string;
    name: string;
    order: number;
    pointsLimit: number | null;
    matchesRequired: number;
    notes: string;
    narrative: string;
    customRules: string[];
    startDate: string | null;
    endDate: string | null;
}
```

### `CampaignNarrative` (interface)

Campaign narrative context.

```typescript
interface CampaignNarrative {
    crusadeNarrativeRef: string | null;
    customNarrative: string;
}
```

### `CampaignRanking` (interface)

Campaign ranking entry for a participant.

```typescript
interface CampaignRanking {
    participantId: string;
    accountId: string;
    displayName: string;
    rank: number;
    wins: number;
    losses: number;
    draws: number;
    totalVP: number;
}
```

### `MasterCampaign` (interface)

Master campaign created by an organizer.

```typescript
interface MasterCampaign {
    id: string;
    name: string;
    type: CampaignType;
    organizerId: string;
    organizerName: string;
    narrative: CampaignNarrative;
    startDate: string;
    endDate: string | null;
    status: CampaignStatus;
    phases: CampaignPhase[];
    customRules: string[];
    rankings: CampaignRanking[];
    participantIds: string[];
    matchIds: string[];
    crusadeRulesId: string | null;
    createdAt: string;
    updatedAt: string;
}
```

| Property         | Type                | Description                                |
| ---------------- | ------------------- | ------------------------------------------ |
| `id`             | `string`            | Unique campaign identifier.                |
| `name`           | `string`            | Campaign name.                             |
| `type`           | `CampaignType`      | `'crusade'` or `'generic'`.                |
| `organizerId`    | `string`            | Organizer's account ID.                    |
| `organizerName`  | `string`            | Organizer's display name.                  |
| `narrative`      | `CampaignNarrative` | Narrative context.                         |
| `startDate`      | `string`            | Start date (ISO 8601).                     |
| `endDate`        | `string \| null`    | End date, null if ongoing.                 |
| `status`         | `CampaignStatus`    | Current status.                            |
| `phases`         | `CampaignPhase[]`   | Campaign phases.                           |
| `customRules`    | `string[]`          | Custom rules for the campaign.             |
| `rankings`       | `CampaignRanking[]` | Participant rankings.                      |
| `participantIds` | `string[]`          | Participant campaign IDs.                  |
| `matchIds`       | `string[]`          | Match IDs played in this campaign.         |
| `crusadeRulesId` | `string \| null`    | Crusade rules reference, null for generic. |
| `createdAt`      | `string`            | Creation timestamp (ISO 8601).             |
| `updatedAt`      | `string`            | Last update timestamp (ISO 8601).          |

### `CrusadeBattleHonour` (interface)

A battle honour earned by a crusade unit.

```typescript
interface CrusadeBattleHonour {
    id: string;
    type: 'BattleTrait' | 'WeaponEnhancement' | 'PsychicFortitude' | 'CrusadeRelic';
    name: string;
    description: string;
    earnedInMatchId: string | null;
    earnedAt: string;
}
```

### `CrusadeBattleScar` (interface)

A battle scar acquired by a crusade unit.

```typescript
interface CrusadeBattleScar {
    id: string;
    name: string;
    description: string;
    gainedInMatchId: string | null;
    gainedAt: string;
    removed: boolean;
    removedAt: string | null;
}
```

### `CrusadeUnitProgression` (interface)

Crusade progression for a single unit in a participant's army.

```typescript
interface CrusadeUnitProgression {
    armyUnitId: string;
    unitName: string;
    experiencePoints: number;
    rank: CrusadeUnitRank;
    battleTally: number;
    killCount: number;
    markedForGreatnessCount: number;
    battleHonours: CrusadeBattleHonour[];
    battleScars: CrusadeBattleScar[];
    crusadePoints: number;
}
```

### `CrusadeParticipantData` (interface)

Crusade-specific data for a participant (null for generic campaigns).

```typescript
interface CrusadeParticipantData {
    crusadePoints: number;
    requisitionPoints: number;
    supplyLimit: number;
    unitProgressions: CrusadeUnitProgression[];
}
```

### `ParticipantCampaign` (interface)

Participant campaign created per player. Child entity linked to `MasterCampaign`.

```typescript
interface ParticipantCampaign {
    id: string;
    masterCampaignId: string;
    accountId: string;
    displayName: string;
    isOrganizer: boolean;
    armyId: string;
    armyName: string;
    currentPhaseId: string;
    matchesInCurrentPhase: number;
    crusadeData: CrusadeParticipantData | null;
    matchIds: string[];
    joinedAt: string;
    updatedAt: string;
}
```

| Property                | Type                             | Description                                |
| ----------------------- | -------------------------------- | ------------------------------------------ |
| `id`                    | `string`                         | Unique participant campaign ID.            |
| `masterCampaignId`      | `string`                         | Parent master campaign ID.                 |
| `accountId`             | `string`                         | Participant's account ID.                  |
| `displayName`           | `string`                         | Participant's display name.                |
| `isOrganizer`           | `boolean`                        | Whether this participant is the organizer. |
| `armyId`                | `string`                         | Army ID used in this campaign.             |
| `armyName`              | `string`                         | Army name for display.                     |
| `currentPhaseId`        | `string`                         | Current phase ID.                          |
| `matchesInCurrentPhase` | `number`                         | Matches completed in current phase.        |
| `crusadeData`           | `CrusadeParticipantData \| null` | Crusade data, null for generic campaigns.  |
| `matchIds`              | `string[]`                       | Match IDs played by this participant.      |
| `joinedAt`              | `string`                         | Join timestamp (ISO 8601).                 |
| `updatedAt`             | `string`                         | Last update timestamp (ISO 8601).          |

## Usage Example

```typescript
import type { MasterCampaign, ParticipantCampaign } from '@armoury/shared';

// Create a master campaign
const campaign: MasterCampaign = {
    id: 'campaign-1',
    name: 'Armageddon Campaign 2026',
    type: 'crusade',
    organizerId: 'user-123',
    organizerName: 'Campaign Master',
    narrative: { crusadeNarrativeRef: 'armageddon', customNarrative: '' },
    startDate: new Date().toISOString(),
    endDate: null,
    status: 'active',
    phases: [],
    customRules: [],
    rankings: [],
    participantIds: [],
    matchIds: [],
    crusadeRulesId: 'core',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

await adapter.put('masterCampaign', campaign);
```
