# client.ts

HTTP client for fetching HTML content from Wahapedia. Provides automatic retry logic with exponential backoff and error handling.

**Source:** `src/shared/clients/wahapedia/client.ts`

---

## Exports

### `WahapediaClient`

Class implementing `IWahapediaClient` for fetching HTML content from Wahapedia. Provides HTTP GET operations with automatic retry logic and exponential backoff for transient failures. Uses the global `fetch` API (available in Node 18+, browsers, and React Native).

```typescript
class WahapediaClient implements IWahapediaClient {
    constructor(customFetch?: typeof fetch);
    fetch<T>(url: string, parser: IWahapediaParser<T>): Promise<T>;
    fetchRaw(url: string): Promise<string>;
}
```

#### Retry Behavior

All public methods use an internal `fetchWithRetry` method that:

1. Attempts the request up to `MAX_RETRIES` (3) times.
2. On network errors, applies exponential backoff: `BASE_DELAY_MS * 2^attempt` (1s, 2s, 4s).
3. On HTTP errors (non-200 status), throws immediately without retrying.
4. Includes a `User-Agent` header (`Armoury/1.0 (Community Tool)`) to identify the tool.

---

#### `constructor(customFetch?)`

Creates a new WahapediaClient instance.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `customFetch` | `typeof fetch` | No | Optional custom fetch function for testing. Defaults to global `fetch`. |

---

#### `fetch(url, parser)`

Fetches a URL and transforms the content using the provided parser. Makes an HTTP GET request to the specified URL, retrieves the HTML content, and passes it to the parser's `parse()` method to produce typed data.

```typescript
async fetch<T>(url: string, parser: IWahapediaParser<T>): Promise<T>;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | `string` | The Wahapedia URL to fetch |
| `parser` | `IWahapediaParser<T>` | The parser instance to transform HTML into typed data |

**Returns:** `Promise<T>` -- Parsed data produced by the parser.

**Throws:**
- `Error` -- If the HTTP request fails after retries
- `Error` -- If parsing fails

---

#### `fetchRaw(url)`

Fetches raw HTML content from a URL. Makes an HTTP GET request to the specified URL and returns the response body as a string.

```typescript
async fetchRaw(url: string): Promise<string>;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | `string` | The Wahapedia URL to fetch |

**Returns:** `Promise<string>` -- The raw HTML content.

**Throws:**
- `Error` -- If the HTTP request fails after retries

---

### `createWahapediaClient()`

Factory function to create a new `WahapediaClient` instance. This is the recommended way to create clients instead of calling the constructor directly.

```typescript
function createWahapediaClient(customFetch?: typeof fetch): WahapediaClient;
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `customFetch` | `typeof fetch` | No | Optional custom fetch function for testing. Defaults to global `fetch`. |

**Returns:** `WahapediaClient` -- A new configured client instance.

---

## Configuration Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `MAX_RETRIES` | `3` | Maximum number of retry attempts for failed requests |
| `BASE_DELAY_MS` | `1000` | Base delay in milliseconds for exponential backoff (1s, 2s, 4s) |
| `USER_AGENT` | `Armoury/1.0 (Community Tool)` | User-Agent header sent with all requests |

---

## Usage Examples

### Basic usage with the factory function

```typescript
import { createWahapediaClient } from '@armoury/shared';
import type { IWahapediaParser } from '@armoury/shared';

const client = createWahapediaClient();

// Fetch raw HTML
const html = await client.fetchRaw('https://wahapedia.ru/wh40k10ed/the-rules/chapter-approved-2025-26/');
console.log(`Fetched ${html.length} bytes`);
```

### Fetch with a parser

```typescript
import { createWahapediaClient } from '@armoury/shared';
import { ChapterApprovedParser } from '@armoury/systems';

const client = createWahapediaClient();
const parser = new ChapterApprovedParser();

// Fetch and parse Chapter Approved data
const chapterApproved = await client.fetch(
    'https://wahapedia.ru/wh40k10ed/the-rules/chapter-approved-2025-26/',
    parser,
);

console.log(`Chapter Approved version: ${chapterApproved.version}`);
console.log(`Missions: ${chapterApproved.missions.length}`);
```

### Custom parser implementation

```typescript
import { createWahapediaClient } from '@armoury/shared';
import type { IWahapediaParser } from '@armoury/shared';

interface FactionData {
    name: string;
    units: string[];
}

class FactionParser implements IWahapediaParser<FactionData> {
    parse(html: string): FactionData {
        // Parse HTML and extract faction data
        const name = html.match(/<h1>(.*?)<\/h1>/)?.[1] ?? 'Unknown';
        const units = Array.from(html.matchAll(/<li class="unit">(.*?)<\/li>/g))
            .map(match => match[1]);
        
        return { name, units };
    }
}

const client = createWahapediaClient();
const parser = new FactionParser();

const factionData = await client.fetch('https://wahapedia.ru/wh40k10ed/factions/necrons/', parser);
console.log(`${factionData.name} has ${factionData.units.length} units`);
```

### Handle errors gracefully

```typescript
import { createWahapediaClient } from '@armoury/shared';

const client = createWahapediaClient();

try {
    const html = await client.fetchRaw('https://wahapedia.ru/wh40k10ed/invalid-url/');
} catch (error) {
    if (error instanceof Error) {
        if (error.message.includes('HTTP 404')) {
            console.error('Page not found');
        } else if (error.message.includes('Request failed after')) {
            console.error('Network error after retries');
        } else {
            console.error('Unknown error:', error.message);
        }
    }
}
```

### Using the class directly with dependency injection

```typescript
import { WahapediaClient } from '@armoury/shared';
import type { IWahapediaClient } from '@armoury/shared';

function createService(client: IWahapediaClient) {
    return {
        async getChapterApproved() {
            const html = await client.fetchRaw('https://wahapedia.ru/wh40k10ed/the-rules/chapter-approved-2025-26/');
            // Parse HTML...
            return html;
        },
    };
}

const client = new WahapediaClient();
const service = createService(client);
```

### Testing with a custom fetch function

```typescript
import { WahapediaClient } from '@armoury/shared';

// Mock fetch for testing
const mockFetch = async (url: string) => {
    return {
        ok: true,
        status: 200,
        text: async () => '<html><body>Mock HTML</body></html>',
    } as Response;
};

const client = new WahapediaClient(mockFetch);
const html = await client.fetchRaw('https://wahapedia.ru/test/');
console.log(html); // '<html><body>Mock HTML</body></html>'
```

---

## Related

- [IWahapediaClient](./types.md) — Interface for Wahapedia clients
- [IWahapediaParser](./types.md) — Interface for HTML parsers
- [ChapterApprovedDAO](../../systems/wh40k10e/dao/ChapterApprovedDAO.md) — DAO using WahapediaClient
- [ChapterApprovedParser](../../systems/wh40k10e/data/ChapterApprovedParser.md) — Parser for Chapter Approved data
