# MatchModel

Match/game tracking data model.

**Source:** `src/shared/data/BSData/wh40k10e/models/MatchModel.ts`

## Overview

Represents a complete match record from one player's perspective. Each match creates TWO `MatchRecord` entries (one per player) with cross-references via `opponentMatchId` to enable honesty verification and prevent data tampering.

## Exports

### `RoundScore` (interface)

Score tracking for a single battle round.

```typescript
interface RoundScore {
    round: number;
    primaryVP: number;
    secondaryVP: number;
    cpSpent: number;
    cpGained: number;
    notes: string;
}
```

| Property      | Type     | Description                              |
| ------------- | -------- | ---------------------------------------- |
| `round`       | `number` | Battle round number (1-5).               |
| `primaryVP`   | `number` | Victory points from primary objective.   |
| `secondaryVP` | `number` | Victory points from secondary objective. |
| `cpSpent`     | `number` | Command points spent this round.         |
| `cpGained`    | `number` | Command points gained this round.        |
| `notes`       | `string` | Player notes for this round.             |

### `ModelHPEntry` (interface)

Wound/HP state for a single model in a unit.

```typescript
interface ModelHPEntry {
    currentWounds: number;
    maxWounds: number;
    destroyed: boolean;
}
```

### `ModelHPState` (interface)

Complete HP state for a unit within an army during a match.

```typescript
interface ModelHPState {
    armyUnitId: string;
    unitName: string;
    modelHP: ModelHPEntry[];
}
```

### `PlayerTurn` (type alias)

```typescript
type PlayerTurn = 'player1' | 'player2';
```

### `GamePhase` (type alias)

```typescript
type GamePhase = 'Command' | 'Movement' | 'Shooting' | 'Charge' | 'Fight';
```

### `GameTracker` (interface)

Tracks the current state of an active game.

```typescript
interface GameTracker {
    currentRound: number;
    currentTurn: PlayerTurn;
    currentPhase: GamePhase;
    gameEnded: boolean;
}
```

| Property       | Type         | Description                                       |
| -------------- | ------------ | ------------------------------------------------- |
| `currentRound` | `number`     | Current battle round (1-5).                       |
| `currentTurn`  | `PlayerTurn` | Which player's turn (`'player1'` or `'player2'`). |
| `currentPhase` | `GamePhase`  | Current phase of the turn.                        |
| `gameEnded`    | `boolean`    | Whether the game has ended.                       |

### `MatchResult` (type alias)

```typescript
type MatchResult = 'win' | 'loss' | 'draw';
```

### `BattleSize` (type alias)

```typescript
type BattleSize = 'Incursion' | 'StrikeForce' | 'Onslaught';
```

### `MatchRecord` (interface)

Complete match record from one player's perspective.

```typescript
interface MatchRecord {
    id: string;
    playerId: string;
    playerName: string;
    opponentMatchId: string | null;
    opponentId: string;
    opponentName: string;
    friendId: string | null;
    armyId: string;
    armyName: string;
    campaignId: string | null;
    participantCampaignId: string | null;
    battleSize: BattleSize;
    pointsLimit: number;
    mission: string;
    result: MatchResult;
    roundScores: RoundScore[];
    totalVP: number;
    opponentTotalVP: number;
    armyHPState: ModelHPState[];
    gameTracker: GameTracker;
    notes: string;
    playedAt: string;
    createdAt: string;
    updatedAt: string;
}
```

| Property                | Type             | Description                                         |
| ----------------------- | ---------------- | --------------------------------------------------- |
| `id`                    | `string`         | Unique match record identifier.                     |
| `playerId`              | `string`         | Player's user ID.                                   |
| `playerName`            | `string`         | Player's display name.                              |
| `opponentMatchId`       | `string \| null` | Opponent's MatchRecord ID for honesty verification. |
| `opponentId`            | `string`         | Opponent's user ID.                                 |
| `opponentName`          | `string`         | Opponent's display name.                            |
| `friendId`              | `string \| null` | Friend ID if opponent is a friend.                  |
| `armyId`                | `string`         | Army ID used in this match.                         |
| `armyName`              | `string`         | Army name for display.                              |
| `campaignId`            | `string \| null` | Campaign ID if part of a campaign.                  |
| `participantCampaignId` | `string \| null` | Participant campaign ID if part of a campaign.      |
| `battleSize`            | `BattleSize`     | Battle size.                                        |
| `pointsLimit`           | `number`         | Points limit (1000, 2000, or 3000).                 |
| `mission`               | `string`         | Mission name or description.                        |
| `result`                | `MatchResult`    | Match result (`'win'`, `'loss'`, or `'draw'`).      |
| `roundScores`           | `RoundScore[]`   | VP scores for each round.                           |
| `totalVP`               | `number`         | Player's total victory points.                      |
| `opponentTotalVP`       | `number`         | Opponent's total victory points.                    |
| `armyHPState`           | `ModelHPState[]` | Army wound state at end of match.                   |
| `gameTracker`           | `GameTracker`    | Game state tracker.                                 |
| `notes`                 | `string`         | Player notes.                                       |
| `playedAt`              | `string`         | When the match was played (ISO 8601).               |
| `createdAt`             | `string`         | Creation timestamp (ISO 8601).                      |
| `updatedAt`             | `string`         | Last update timestamp (ISO 8601).                   |

## Usage Example

```typescript
import type { MatchRecord, RoundScore, MatchResult } from '@armoury/shared';

const match: MatchRecord = {
    id: 'match-1',
    playerId: 'user-123',
    playerName: 'Player 1',
    opponentMatchId: 'match-2',
    opponentId: 'user-456',
    opponentName: 'Player 2',
    friendId: 'friend-1',
    armyId: 'army-1',
    armyName: 'Ultramarines',
    campaignId: null,
    participantCampaignId: null,
    battleSize: 'StrikeForce',
    pointsLimit: 2000,
    mission: 'Only War',
    result: 'win',
    roundScores: [{ round: 1, primaryVP: 3, secondaryVP: 2, cpSpent: 1, cpGained: 1, notes: '' }],
    totalVP: 85,
    opponentTotalVP: 60,
    armyHPState: [],
    gameTracker: { currentRound: 5, currentTurn: 'player1', currentPhase: 'Fight', gameEnded: true },
    notes: 'Great game',
    playedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

await adapter.put('matchRecord', match);
```
