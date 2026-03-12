# PluginRegistry

Global registry for game system plugins. Allows lookup by plugin ID for DataManager builders and factories.

**Source:** `src/shared/data/plugin-registry.ts`

## API

| Method       | Signature                                      | Description                          |
|--------------|-------------------------------------------------|--------------------------------------|
| `register`   | `(plugin: GameSystemPlugin) => void`           | Registers a plugin under its `id`    |
| `get`        | `(id: string) => GameSystemPlugin \| undefined` | Retrieves a plugin by ID             |
| `ids`        | `() => string[]`                               | Returns all registered plugin IDs    |
| `clear`      | `() => void`                                   | Clears all registered plugins (tests) |

## Usage

```typescript
import { PluginRegistry } from '@armoury/shared';
import { wh40k10ePlugin } from '@armoury/systems';

PluginRegistry.register(wh40k10ePlugin);

const plugin = PluginRegistry.get('wh40k10e');
const allIds = PluginRegistry.ids(); // ['wh40k10e']
```
