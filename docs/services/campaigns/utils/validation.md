# validation.ts

Type guards and request payload parsers for campaigns service route handlers.

**Source:** `src/services/campaigns/src/utils/validation.ts`

---

## Exports

### Type Guards

#### `isRecord()`

Checks whether a value is a non-null, non-array object.

```typescript
function isRecord(value: unknown): value is Record<string, unknown>;
```

**Parameters:**

| Parameter | Type      | Description        |
| --------- | --------- | ------------------ |
| `value`   | `unknown` | The value to check |

**Returns:** `true` if `value` is a plain object.

---

#### `isString()`

Checks whether a value is a string.

```typescript
function isString(value: unknown): value is string;
```

**Parameters:**

| Parameter | Type      | Description        |
| --------- | --------- | ------------------ |
| `value`   | `unknown` | The value to check |

**Returns:** `true` if `value` is a string.

---

#### `isStringArray()`

Checks whether a value is an array where every element is a string.

```typescript
function isStringArray(value: unknown): value is string[];
```

**Parameters:**

| Parameter | Type      | Description        |
| --------- | --------- | ------------------ |
| `value`   | `unknown` | The value to check |

**Returns:** `true` if `value` is a `string[]`.

---

#### `isNumber()`

Checks whether a value is a finite number.

```typescript
function isNumber(value: unknown): value is number;
```

**Parameters:**

| Parameter | Type      | Description        |
| --------- | --------- | ------------------ |
| `value`   | `unknown` | The value to check |

**Returns:** `true` if `value` is a finite number (excludes `NaN`, `Infinity`).

---

#### `isNarrative()`

Checks whether a value matches the campaign narrative shape. A valid narrative is an object with a required `customNarrative` string and an optional `crusadeNarrativeRef` that is either a string, `null`, or `undefined`.

```typescript
function isNarrative(value: unknown): value is CreateCampaignRequest['narrative'];
```

**Parameters:**

| Parameter | Type      | Description        |
| --------- | --------- | ------------------ |
| `value`   | `unknown` | The value to check |

**Returns:** `true` if `value` is a valid narrative object.

---

### Request Parsers

All parsers accept a raw request body (`unknown | null`) and return either a typed request object or an `Error` describing the validation failure. This pattern allows route handlers to check `result instanceof Error` to determine whether validation passed.

#### `parseCreateCampaignRequest()`

Validates a create campaign request payload.

```typescript
function parseCreateCampaignRequest(body: unknown | null): CreateCampaignRequest | Error;
```

**Required fields:** `name` (string), `type` (string), `startDate` (string), `status` (string), `narrative` (object).

**Optional fields:** `endDate` (string | null), `customRules` (string[]), `crusadeRulesId` (string | null).

**Returns:** `CreateCampaignRequest` on success, `Error` on validation failure.

---

#### `parseUpdateCampaignRequest()`

Validates an update campaign request payload. Accepts the same required fields as create, plus additional optional fields for existing campaigns.

```typescript
function parseUpdateCampaignRequest(body: unknown | null): UpdateCampaignRequest | Error;
```

**Required fields:** `name` (string), `type` (string), `startDate` (string), `status` (string), `narrative` (object).

**Optional fields:** `endDate` (string | null), `phases` (array), `customRules` (string[]), `rankings` (array), `participantIds` (string[]), `matchIds` (string[]), `crusadeRulesId` (string | null).

**Returns:** `UpdateCampaignRequest` on success, `Error` on validation failure.

---

#### `parseJoinCampaignRequest()`

Validates a join campaign (create participant) request payload.

```typescript
function parseJoinCampaignRequest(body: unknown | null): JoinCampaignRequest | Error;
```

**Required fields:** `displayName` (string), `armyId` (string), `armyName` (string), `currentPhaseId` (string).

**Optional fields:** `matchesInCurrentPhase` (number), `crusadeData` (object | null), `matchIds` (string[]).

**Returns:** `JoinCampaignRequest` on success, `Error` on validation failure.

---

#### `parseUpdateParticipantRequest()`

Validates an update participant request payload. Unlike the join request, `matchesInCurrentPhase` is required.

```typescript
function parseUpdateParticipantRequest(body: unknown | null): UpdateParticipantRequest | Error;
```

**Required fields:** `displayName` (string), `armyId` (string), `armyName` (string), `currentPhaseId` (string), `matchesInCurrentPhase` (number).

**Optional fields:** `crusadeData` (object | null), `matchIds` (string[]).

**Returns:** `UpdateParticipantRequest` on success, `Error` on validation failure.

---

## Usage Example

```typescript
import { parseCreateCampaignRequest } from '@campaigns/src/utils/validation.js';
import { errorResponse } from '@campaigns/src/utils/response.js';

// In a route handler
const parsed = parseCreateCampaignRequest(body);

if (parsed instanceof Error) {
    return errorResponse(400, 'Bad Request', parsed.message);
}

// parsed is now typed as CreateCampaignRequest
const campaign = await adapter.put('masterCampaign', {
    id: crypto.randomUUID(),
    name: parsed.name,
    type: parsed.type,
    // ...
});
```
