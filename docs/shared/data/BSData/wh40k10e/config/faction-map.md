# Faction Map

Configuration mapping of all factions to their data files.

**Source:** `src/shared/data/BSData/wh40k10e/config/faction-map.ts`

## Exports

### `FactionConfig` (interface)

Configuration for a single faction. Specifies which catalogue files to load and the faction's super-faction grouping.

```typescript
interface FactionConfig {
    id: string;
    name: string;
    files: string[];
    superFaction: string;
}
```

| Property       | Type       | Description                                                                 |
| -------------- | ---------- | --------------------------------------------------------------------------- |
| `id`           | `string`   | Unique faction identifier (e.g. `"space-marines"`, `"necrons"`).            |
| `name`         | `string`   | Display name of the faction (e.g. `"Space Marines"`, `"Necrons"`).          |
| `files`        | `string[]` | Catalogue file names to load (library first, then faction-specific).        |
| `superFaction` | `string`   | Super-faction grouping: `"Imperium"`, `"Chaos"`, `"Xenos"`, or `"Aeldari"`. |

### `FACTION_MAP` (constant)

Complete mapping of all factions organized by super-faction.

```typescript
const FACTION_MAP: Record<string, FactionConfig>;
```

Contains 30 factions across 4 super-factions:

| Super-Faction | Factions                                                                                                                                                                                                                                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Aeldari       | `aeldari`, `drukhari`                                                                                                                                                                                                                                                                                                                      |
| Chaos         | `chaos-daemons`, `chaos-knights`, `chaos-space-marines`, `death-guard`, `emperors-children`, `thousand-sons`, `world-eaters`                                                                                                                                                                                                               |
| Imperium      | `adepta-sororitas`, `adeptus-custodes`, `adeptus-mechanicus`, `agents-of-the-imperium`, `astra-militarum`, `imperial-knights`, `grey-knights`, `space-marines`, `black-templars`, `blood-angels`, `dark-angels`, `deathwatch`, `space-wolves`, `ultramarines`, `imperial-fists`, `iron-hands`, `raven-guard`, `salamanders`, `white-scars` |
| Xenos         | `genestealer-cults`, `leagues-of-votann`, `necrons`, `orks`, `tau-empire`, `tyranids`                                                                                                                                                                                                                                                      |

Factions that inherit from a parent catalogue (e.g., Space Marine chapters) list the parent file first in their `files` array. For example, `blood-angels` lists `['Imperium - Space Marines.cat', 'Imperium - Blood Angels.cat']`.

### `getFactionConfig` (function)

Retrieves a faction configuration by its ID.

```typescript
function getFactionConfig(id: string): FactionConfig | undefined;
```

| Parameter | Type     | Description                                       |
| --------- | -------- | ------------------------------------------------- |
| `id`      | `string` | Faction ID (e.g. `"space-marines"`, `"necrons"`). |

**Returns:** `FactionConfig | undefined` -- The faction config if found, `undefined` otherwise.

### `getAllFactionIds` (function)

Retrieves all available faction IDs.

```typescript
function getAllFactionIds(): string[];
```

**Returns:** `string[]` -- Array of all faction IDs in the system.

## Usage Example

```typescript
import { getFactionConfig, getAllFactionIds, FACTION_MAP } from '@armoury/shared';

// Get a specific faction config
const smConfig = getFactionConfig('space-marines');
// { id: 'space-marines', name: 'Space Marines', files: ['Imperium - Space Marines.cat'], superFaction: 'Imperium' }

// List all available faction IDs
const allIds = getAllFactionIds();
// ['aeldari', 'drukhari', 'chaos-daemons', ...]

// Access the map directly
const necrons = FACTION_MAP['necrons'];
// { id: 'necrons', name: 'Necrons', files: ['Necrons.cat'], superFaction: 'Xenos' }
```
