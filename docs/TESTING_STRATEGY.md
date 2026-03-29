# Testing Strategy

A comprehensive guide to testing in the Armoury monorepo — covering unit, integration, and E2E testing across all workspaces.

## Table of Contents

1. [Testing Pyramid](#testing-pyramid)
2. [Current State](#current-state)
3. [Unit Testing (Vitest)](#unit-testing-vitest)
4. [Integration Testing (Vitest)](#integration-testing-vitest)
5. [E2E Testing — Web (Playwright)](#e2e-testing--web-playwright)
6. [E2E Testing — Mobile (Maestro)](#e2e-testing--mobile-maestro)
7. [CI/CD Integration](#cicd-integration)
8. [Coverage Strategy](#coverage-strategy)
9. [Testing Conventions](#testing-conventions)

---

## Testing Pyramid

```
          ┌──────────┐
          │   E2E    │  ← Browser + device (Playwright, Maestro)
          │  ~5-10%  │    Critical user journeys only
         ─┼──────────┼─
        / Integration \  ← Real adapters, real services
       /    ~10-20%    \   Cross-module, slower, external deps
      ─┼────────────────┼─
     /       Unit        \  ← Isolated, fast, deterministic
    /        ~70-80%      \  The vast majority of tests
   └────────────────────────┘
```

**Unit tests** form the base. They run in milliseconds, need no external services, and give you fast feedback during development. Write them for every function, class, and module.

**Integration tests** verify that the boundaries between modules behave correctly — data adapters with real SQL, service handlers with real DynamoDB-compatible tables, game system plugins with real fixture data. They're slower and require setup, so write them selectively.

**E2E tests** cover the things only a real browser or device can verify — auth flows, page navigation, multi-step user journeys. Keep them to the critical paths. Don't try to cover every edge case here; that's what unit tests are for.

---

## Current State

### Vitest Configuration Inventory

The monorepo has **23 Vitest configs** spread across workspaces. Each workspace extends the shared `@armoury/vitest` base config and adds workspace-specific path aliases and include/exclude patterns.

| Workspace | Config(s) | Test Types |
|-----------|-----------|------------|
| `@armoury/shared` (models) | `vitest.config.ts` | unit |
| `@armoury/data` | `vitest.config.ts` | unit |
| `@armoury/clients-github` | `vitest.config.ts` | unit |
| `@armoury/clients-wahapedia` | `vitest.config.ts` | unit |
| `@armoury/clients-campaigns` | `vitest.config.ts` | unit |
| `@armoury/clients-friends` | `vitest.config.ts` | unit |
| `@armoury/clients-matches` | `vitest.config.ts` | unit |
| `@armoury/clients-users` | `vitest.config.ts` | unit |
| `@armoury/providers-bsdata` | `vitest.config.ts` | unit |
| `@armoury/validation` | `vitest.config.ts` | unit |
| `@armoury/streams` | `vitest.config.ts` | unit |
| `@armoury/wh40k10e` | `vitest.config.ts`, `vitest.integration.config.ts` | unit, integration |
| `@armoury/web` | `vitest.config.ts` | unit |
| `@armoury/mobile` | `vitest.config.ts` | unit |
| `@armoury/authorizer` | `vitest.config.ts` | unit |
| `@armoury/campaigns` | `vitest.config.ts`, `vitest.e2e.config.ts` | unit, e2e (service) |
| `@armoury/friends` (service) | `vitest.config.ts`, `vitest.e2e.config.ts` | unit, e2e (service) |
| `@armoury/matches` (service) | `vitest.config.ts`, `vitest.e2e.config.ts` | unit, e2e (service) |
| `@armoury/users` (service) | `vitest.config.ts` | unit |

### Test File Locations

```
src/<workspace>/
├── <module>/
│   ├── __tests__/                   # Unit tests
│   │   ├── *.test.ts
│   │   └── __fixtures__/            # Fixtures for unit tests
│   ├── __integration__/             # Integration tests
│   │   ├── *.integration.test.ts
│   │   └── __fixtures__/
│   └── __mocks__/                   # Manual mocks
└── e2e/                             # Service-level E2E (Lambda services)
    └── *.e2e.test.ts
```

For the Lambda services, `e2e/` tests sit at the service workspace root and use Docker-based setup via a shared `src/services/__testing__/docker-setup.ts` global setup file.

### Turbo Pipeline Tasks

```
test             → runs vitest (unit tests only)
test:integration → runs vitest with integration config
test:e2e         → runs service-level e2e tests (Lambda services via Docker)
                   and browser E2E (Playwright, once added)
```

All three tasks depend on `^generate:types` (upstream type generation must complete first). The `test:e2e` task sets `"cache": false` because E2E tests hit real services and their results should never be read from cache.

### Naming Conventions

| Pattern | Runner | Scope |
|---------|--------|-------|
| `*.test.ts` | Vitest | Unit |
| `*.integration.test.ts` | Vitest (integration config) | Integration |
| `*.e2e.test.ts` | Vitest (e2e config) | Service E2E (Docker/Lambda) |
| `*.spec.ts` | Playwright | Browser E2E |
| `*.yaml` | Maestro | Mobile E2E |

The `.test.ts` / `.spec.ts` split is the hard boundary between Vitest and Playwright. Vitest's include glob only matches `.test.ts` files — it never picks up `.spec.ts`. Playwright's `testDir` targets the `e2e/web/` directory, so there's no collision.

---

## Unit Testing (Vitest)

### Shared Base Config

All unit test configs extend `@armoury/vitest`'s `baseConfig`:

```typescript
// src/tooling/vitest/vitest.config.js
export const baseConfig = {
    test: {
        globals: true,
        include: ['**/__tests__/**/*.test.ts'],
        exclude: ['node_modules', 'dist'],
    },
};
```

A workspace config merges this with workspace-specific path aliases:

```typescript
// src/shared/data/vitest.config.ts
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from '@armoury/vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default mergeConfig(
    baseConfig,
    defineConfig({
        resolve: {
            alias: {
                '@data': path.resolve(__dirname, 'src'),
                '@models': path.resolve(__dirname, '../models/src'),
                '@clients-github': path.resolve(__dirname, '../clients/github/src'),
                '@': path.resolve(__dirname, '../providers/bsdata/src'),
            },
        },
        test: {
            // Explicitly exclude integration tests from the default run
            include: ['**/__tests__/**/*.test.ts'],
        },
    }),
);
```

The pattern is consistent across all 23 configs: add aliases and optionally refine `include`/`exclude`. The base config handles everything else.

### Mocking Strategy

**Manual mocks** live in `__mocks__/` directories colocated with the module they mock. Vitest picks these up automatically when `vi.mock()` is called with the matching module path.

**Inline mocks** using `vi.fn()` and `vi.spyOn()` are used for one-off test doubles that don't warrant a standalone file.

**Registry isolation**: modules that use global registries (codec, hydration, schema) expose a `clear*` function. Call it in `beforeEach` to prevent cross-test state leakage:

```typescript
import { describe, it, beforeEach } from 'vitest';
import { clearCodecRegistry } from '@data/codec.js';

describe('codec registry', () => {
    beforeEach(() => {
        clearCodecRegistry();
    });

    it('registers a codec for an entity type', () => { ... });
});
```

**Fixture factories** live in `__fixtures__/` directories and follow the `make*` convention:

```typescript
// __fixtures__/makeArmy.ts
import type { Army } from '@wh40k10e/models/ArmyModel.js';

/** Creates a minimal Army fixture for use in tests. */
export function makeArmy(overrides: Partial<Army> = {}): Army {
    return {
        id: 'army-1',
        ownerId: 'auth0|user-1',
        name: 'Ultramarines Strike Force',
        factionId: 'space-marines',
        factionName: 'Space Marines',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        ...overrides,
    };
}
```

Export all fixtures from an `__fixtures__/index.ts` barrel file.

### Running Unit Tests

```bash
# All workspaces
npm run test

# Single workspace
npm run test -w @armoury/data
turbo run test --filter=@armoury/web

# Watch mode (single workspace)
npx vitest --config src/shared/data/vitest.config.ts --watch
```

---

## Integration Testing (Vitest)

Integration tests use separate config files (`vitest.integration.config.ts`) that include only `*.integration.test.ts` files and configure longer timeouts.

### Configuration Pattern

```typescript
// src/systems/wh40k10e/vitest.integration.config.ts
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vitest configuration for integration tests.
 * Only runs *.integration.test.ts files.
 */
export default defineConfig({
    resolve: {
        alias: {
            '@wh40k10e': path.resolve(__dirname, 'src'),
            '@data': path.resolve(__dirname, '../../shared/data/src'),
            '@models': path.resolve(__dirname, '../../shared/models/src'),
        },
    },
    test: {
        globals: true,
        include: ['**/__tests__/**/*.integration.test.ts'],
        exclude: ['node_modules', 'dist'],
        testTimeout: 60000,   // 60s — real network and DB calls take time
    },
});
```

Note that integration configs typically do **not** extend `baseConfig`. They're standalone so include patterns can't accidentally bleed over from the unit config.

### What Integration Tests Cover

- **Data adapters**: real SQLite or PGlite instances, verifying SQL queries, migrations, and upsert behaviour
- **Game system providers**: `@armoury/providers-bsdata` loading real BattleScribe data files; `@armoury/clients-github` fetching real repository content (requires `GITHUB_TOKEN`)
- **Codec and hydration**: round-trip serialization tests with real adapters, not mock stores
- **Validation engine**: integration with the data layer to test that rule evaluation reads real unit data

### Environment Variables

Integration tests that hit real external APIs require `GITHUB_TOKEN`. The Turbo task declares this:

```json
"test:integration": {
    "dependsOn": ["^generate:types"],
    "env": ["GITHUB_TOKEN"]
}
```

In CI, set this as a repository secret. Locally, load it from `.env.local` or your shell profile.

### Service-Level E2E (Lambda Services)

The Lambda service workspaces (`campaigns`, `friends`, `matches`) have a third config layer — `vitest.e2e.config.ts` — for tests that spin up Docker containers:

```typescript
// src/services/campaigns/vitest.e2e.config.ts
export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            include: ['src/**/*.e2e.test.ts'],
            // Shared Docker setup/teardown across all service e2e tests
            globalSetup: [path.resolve(__dirname, '../__testing__/docker-setup.ts')],
            // Must run sequentially — containers are shared
            fileParallelism: false,
            testTimeout: 30_000,
        },
    }),
);
```

These are not browser E2E tests. They invoke Lambda handlers directly against real (containerised) DynamoDB or PostgreSQL. They belong in the services' `src/` tree alongside the handler code.

### Running Integration Tests

```bash
# All workspaces that have integration tests
npm run test:integration

# Single workspace
npx vitest --config src/systems/wh40k10e/vitest.integration.config.ts

# Service e2e (requires Docker)
npm run test:e2e:services
```

---

## E2E Testing — Web (Playwright)

Playwright covers critical user journeys through the real Next.js 15 application running in a browser. It belongs at the top of the pyramid: high value, high cost, small count.

### Directory Structure

```
e2e/
└── web/
    ├── playwright.config.ts       # Playwright configuration
    ├── auth/
    │   └── setup.ts               # Auth state setup (storageState)
    ├── fixtures/
    │   ├── index.ts               # Barrel — exports all fixtures
    │   ├── auth.fixture.ts        # Authenticated page fixture
    │   └── army.fixture.ts        # Army creation/teardown helper
    ├── pages/                     # Page Object Models
    │   ├── ArmyListPage.ts
    │   ├── ArmyBuilderPage.ts
    │   ├── MatchPage.ts
    │   └── CampaignPage.ts
    └── tests/
        ├── army-creation.spec.ts
        ├── army-builder.spec.ts
        ├── match-flow.spec.ts
        └── campaign-creation.spec.ts
```

This sits at the repo root's `e2e/web/` directory, outside of `src/web/`, because Playwright tests target the running application as a black box. They don't need access to Next.js internals or the `@web` alias.

### Playwright Configuration

```typescript
// e2e/web/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the Armoury web app.
 *
 * Projects are split into:
 *   - setup: Creates auth state once per run
 *   - authenticated: Tests requiring a logged-in user
 *   - unauthenticated: Public pages (auth wall, landing)
 */
export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env['CI'],
    retries: process.env['CI'] ? 2 : 0,
    workers: process.env['CI'] ? 4 : undefined,
    reporter: [
        ['html', { open: 'never' }],
        process.env['CI'] ? ['github'] : ['list'],
    ],

    use: {
        baseURL: process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },

    projects: [
        // --- Setup project: runs once, saves auth cookies ---
        {
            name: 'setup',
            testMatch: /auth\/setup\.ts/,
        },

        // --- Authenticated tests (most tests) ---
        {
            name: 'chromium-authenticated',
            use: {
                ...devices['Desktop Chrome'],
                storageState: 'e2e/web/.auth/user.json',
            },
            dependencies: ['setup'],
            testIgnore: /unauthenticated\//,
        },
        {
            name: 'firefox-authenticated',
            use: {
                ...devices['Desktop Firefox'],
                storageState: 'e2e/web/.auth/user.json',
            },
            dependencies: ['setup'],
            testIgnore: /unauthenticated\//,
        },
        {
            name: 'mobile-chromium-authenticated',
            use: {
                ...devices['Pixel 7'],
                storageState: 'e2e/web/.auth/user.json',
            },
            dependencies: ['setup'],
            testIgnore: /unauthenticated\//,
        },

        // --- Unauthenticated tests (login wall, public pages) ---
        {
            name: 'chromium-unauthenticated',
            use: { ...devices['Desktop Chrome'] },
            testMatch: /unauthenticated\//,
        },
    ],

    // Start Next.js dev server automatically in CI and local runs
    webServer: {
        command: 'npm run dev -w @armoury/web',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env['CI'],
        timeout: 120_000,
        env: {
            // Use a test-specific database so e2e runs don't touch real data
            DATABASE_URL: process.env['E2E_DATABASE_URL'] ?? process.env['DATABASE_URL'] ?? '',
            NEXTAUTH_URL: 'http://localhost:3000',
            NEXTAUTH_SECRET: process.env['E2E_NEXTAUTH_SECRET'] ?? 'e2e-test-secret',
        },
    },
});
```

### Auth Setup with `storageState`

The `setup` project logs in once and saves the browser's auth state (cookies, localStorage) to a file. All authenticated tests load that file instead of logging in on every test, which cuts per-test overhead significantly.

```typescript
// e2e/web/auth/setup.ts
import { test as setup } from '@playwright/test';
import path from 'path';

const authFile = path.resolve('e2e/web/.auth/user.json');

setup('authenticate', async ({ page }) => {
    // Navigate to the auth page and complete the sign-in flow.
    // Exact steps depend on the auth provider (Auth0, Cognito, etc.)
    await page.goto('/auth/signin');
    await page.getByLabel('Email').fill(process.env['E2E_USER_EMAIL']!);
    await page.getByLabel('Password').fill(process.env['E2E_USER_PASSWORD']!);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Wait for redirect to confirm auth succeeded
    await page.waitForURL('/armies');

    // Save auth state — all authenticated tests will load this file
    await page.context().storageState({ path: authFile });
});
```

Add `e2e/web/.auth/` to `.gitignore`. Never commit auth state files.

### Page Object Model

Each significant page or flow gets a Page Object class. This keeps selector logic out of test files, making tests readable and resilient to markup changes.

```typescript
// e2e/web/pages/ArmyBuilderPage.ts
import type { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the army builder.
 *
 * Wraps selectors and interactions so test files read like user stories.
 */
export class ArmyBuilderPage {
    readonly page: Page;
    readonly addUnitButton: Locator;
    readonly unitSearch: Locator;
    readonly saveButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.addUnitButton = page.getByRole('button', { name: 'Add unit' });
        this.unitSearch = page.getByRole('searchbox', { name: 'Search units' });
        this.saveButton = page.getByRole('button', { name: 'Save army' });
    }

    async goto(armyId: string) {
        await this.page.goto(`/armies/${armyId}/builder`);
    }

    async searchForUnit(name: string) {
        await this.addUnitButton.click();
        await this.unitSearch.fill(name);
    }

    async selectUnit(name: string) {
        await this.page.getByRole('option', { name }).click();
    }

    async save() {
        await this.saveButton.click();
        await this.page.waitForURL(/\/armies\/.+\/builder/);
    }
}
```

### Fixture Pattern for Test Data

Playwright fixtures (not to be confused with Vitest fixtures) wrap common setup and teardown logic. They make test files concise and ensure cleanup always runs.

```typescript
// e2e/web/fixtures/army.fixture.ts
import { test as base } from '@playwright/test';

type ArmyFixtures = {
    army: { id: string; name: string };
};

/**
 * Provides a pre-created army that is cleaned up after the test.
 *
 * Uses the API directly (not the UI) to keep setup fast and deterministic.
 */
export const test = base.extend<ArmyFixtures>({
    army: async ({ request }, use) => {
        const response = await request.post('/api/armies', {
            data: {
                name: 'E2E Test Army',
                factionId: 'space-marines',
            },
        });

        const army = await response.json();

        await use(army);

        // Cleanup after the test
        await request.delete(`/api/armies/${army.id}`);
    },
});
```

Compose fixtures in `e2e/web/fixtures/index.ts` so test files import from one place:

```typescript
// e2e/web/fixtures/index.ts
export { test, expect } from './army.fixture.js';
```

A test then reads like a user story:

```typescript
// e2e/web/tests/army-builder.spec.ts
import { test, expect } from '../fixtures/index.js';
import { ArmyBuilderPage } from '../pages/ArmyBuilderPage.js';

test('adds a unit to an existing army', async ({ page, army }) => {
    const builder = new ArmyBuilderPage(page);

    await builder.goto(army.id);
    await builder.searchForUnit('Intercessor Squad');
    await builder.selectUnit('Intercessor Squad');
    await builder.save();

    await expect(page.getByText('Intercessor Squad')).toBeVisible();
});
```

### Critical User Journeys

These are the journeys to cover first, in roughly priority order:

| Journey | Pages | Auth Required |
|---------|-------|---------------|
| Sign in / sign out | `/auth/signin`, `/armies` | No / Yes |
| Create a new army | `/armies/new`, `/armies/:id` | Yes |
| Add units to an army | `/armies/:id/builder` | Yes |
| View army summary | `/armies/:id` | Yes |
| Create a match | `/matches/new` | Yes |
| Link armies to a match | `/matches/:id` | Yes |
| Record a match result | `/matches/:id` | Yes |
| Create a campaign | `/campaigns/new` | Yes |
| Add armies to a campaign | `/campaigns/:id` | Yes |
| Active match — basic mode | `/matches/:id/active` | Yes |
| Active match — guided mode | `/matches/:id/active?mode=guided` | Yes |

Don't cover every variant here. Cover the happy path and one key error state per journey (e.g., "army name required" validation on the create form). Edge cases belong in unit tests.

### Turbo Pipeline Integration

The `test:e2e` Turbo task already exists with `"cache": false`. Playwright tests can run via:

```bash
# Directly (dev mode, webServer starts automatically)
npx playwright test --config e2e/web/playwright.config.ts

# Interactive UI mode
npx playwright test --config e2e/web/playwright.config.ts --ui

# Via Turbo (once wired into a workspace)
turbo run test:e2e --filter=@armoury/e2e-web
```

---

## E2E Testing — Mobile (Maestro)

Maestro covers critical user journeys through the real Expo 53 + React Native app running on a simulator or physical device. Like the Playwright layer, it belongs at the top of the pyramid: high value, high cost, small count.

### Why Maestro

Maestro requires no build-time instrumentation and no native module linking. Tests are plain YAML files that drive the simulator via accessibility identifiers, with no test runner process embedded in the app binary. Compared to Detox, setup is significantly simpler: there's no `detox build` step, no Detox config in `app.json`, and no Jest adapter to wire up. Compared to Appium, Maestro's YAML syntax is readable by engineers who don't know WebDriver, and flows are far shorter for the same interactions. The trade-off is less programmatic flexibility, but Armoury's critical journeys are sequential, UI-driven flows that map naturally to YAML.

### Installation

Maestro is a standalone CLI. Install it once per developer machine.

```bash
# macOS — Homebrew (recommended)
brew install maestro

# macOS / Linux — curl installer
curl -Ls "https://get.maestro.mobile.dev" | bash

# Verify installation
maestro --version
```

On Windows, Maestro must run inside WSL 2. Android flows work in WSL; iOS flows require macOS because the iOS Simulator is macOS-only. Ensure the Expo app is built in development mode and a simulator is running before executing flows.

### Directory Structure

```
e2e/
└── mobile/
    ├── flows/                         # All Maestro flow files
    │   ├── common/                    # Reusable subflows
    │   │   ├── login.yaml             # Login subflow (called by most tests)
    │   │   └── skip-onboarding.yaml   # Dismiss onboarding screens
    │   ├── army-creation.yaml
    │   ├── army-builder.yaml
    │   ├── match-creation.yaml
    │   ├── match-active.yaml
    │   └── campaign-creation.yaml
    ├── scripts/
    │   └── run-all.sh                 # Helper for local full-suite runs
    └── README.md                      # Local setup instructions
```

The `flows/` directory sits under `e2e/mobile/`, keeping mobile E2E isolated from web E2E at the same level in `e2e/web/`. The `flows/common/` subdirectory holds subflows that are called via `runFlow:` from multiple tests. Nothing in `flows/` imports from `src/` — Maestro tests are black-box.

### Element Selection Strategy

Maestro can select elements by text, accessibility label, or `testID`. For Armoury, `testID` is the primary strategy for interactive elements. Text selectors are acceptable for static headings and read-only labels, but never use them for buttons or inputs that might be translated or renamed.

Add `testID` props to React Native components at the screen level:

```tsx
// src/mobile/screens/ArmyListScreen.tsx
// Each interactive element that Maestro needs to target gets a testID.
// Use kebab-case IDs scoped to the screen: <screen>-<element>.
<Pressable testID="army-list-new-button" onPress={handleCreate}>
  <Text>New army</Text>
</Pressable>

<TextInput
  testID="army-list-search-input"
  placeholder="Search armies"
  value={query}
  onChangeText={setQuery}
/>

// List items use a dynamic ID scoped to the item's unique identifier.
<Pressable testID={`army-list-item-${army.id}`} onPress={() => handleSelect(army)}>
  <Text>{army.name}</Text>
</Pressable>
```

The corresponding Maestro selectors:

```yaml
# Tap by testID
- tapOn:
    id: "army-list-new-button"

# Type into a testID-targeted input
- tapOn:
    id: "army-list-search-input"
- inputText: "Ultramarines"

# Assert a list item is visible using a regex when the ID is dynamic
- assertVisible:
    id: "army-list-item-.*"

# Text selector — acceptable for static headings
- assertVisible: "My Armies"
```

Use text selectors only when the string is stable and owned by the app (not game data). Faction names, unit names, and any user-entered content should be matched via `testID` or regex.

### Example Flows

#### Army Creation

```yaml
# e2e/mobile/flows/army-creation.yaml
appId: com.armoury.mobile
env:
  TEST_USER_EMAIL: ${TEST_USER_EMAIL}
  TEST_USER_PASSWORD: ${TEST_USER_PASSWORD}
---
# Log in first using the shared subflow
- runFlow: common/login.yaml
# Verify we land on the army list
- assertVisible: "My Armies"
# Open the new army form
- tapOn:
    id: "army-list-new-button"
# Fill in the army name
- tapOn:
    id: "army-new-name-input"
- inputText: "Maestro Test Army"
# Select a game system
- tapOn:
    id: "army-new-game-system-selector"
- assertVisible: "Warhammer 40,000 10th Edition"
- tapOn: "Warhammer 40,000 10th Edition"
# Select a faction
- tapOn:
    id: "army-new-faction-selector"
- assertVisible: "Space Marines"
- tapOn: "Space Marines"
# Submit and confirm
- tapOn:
    id: "army-new-create-button"
- assertVisible: "Maestro Test Army"
```

#### Army Builder with Scroll and Search

```yaml
# e2e/mobile/flows/army-builder.yaml
appId: com.armoury.mobile
env:
  TEST_ARMY_ID: ${TEST_ARMY_ID}
  TEST_USER_EMAIL: ${TEST_USER_EMAIL}
  TEST_USER_PASSWORD: ${TEST_USER_PASSWORD}
---
- runFlow: common/login.yaml
# Navigate to the builder via deep link
- openLink: "armoury://armies/${TEST_ARMY_ID}/builder"
# Wait for the builder to load
- assertVisible:
    id: "army-builder-add-unit-button"
# Open the unit picker
- tapOn:
    id: "army-builder-add-unit-button"
# Search for a unit — the list may be long, so search first
- tapOn:
    id: "unit-picker-search-input"
- inputText: "Intercessor Squad"
# Scroll until the result appears in case the keyboard pushed it offscreen
- scrollUntilVisible:
    element:
      id: "unit-picker-result-intercessor-squad"
    direction: DOWN
- tapOn:
    id: "unit-picker-result-intercessor-squad"
# Confirm the unit now appears in the builder list
- assertVisible:
    id: "army-builder-unit-intercessor-squad"
```

```yaml
# e2e/mobile/flows/common/login.yaml
# Not run directly — called via runFlow: from other flows.
appId: com.armoury.mobile
---
- launchApp:
    clearState: true
- assertVisible:
    id: "auth-sign-in-heading"
- tapOn:
    id: "auth-email-input"
- inputText: ${TEST_USER_EMAIL}
- tapOn:
    id: "auth-password-input"
- inputText: ${TEST_USER_PASSWORD}
- tapOn:
    id: "auth-sign-in-button"
# Confirm login succeeded before returning to the calling flow
- assertVisible:
    id: "army-list-screen"
    timeout: 10000
```

### Reusable Flows

Most flows start from a logged-in state. Rather than repeating the sign-in steps, extract them into a subflow and call it with `runFlow:`.

```yaml
# Any flow that needs authentication
- runFlow: common/login.yaml

# Any flow that needs to dismiss onboarding for new installs
- runFlow: common/skip-onboarding.yaml
```

Subflows in `flows/common/` inherit the parent flow's `env:` variables automatically. Define credentials once in the parent's `env:` block and they propagate to all called subflows.

Keep subflows focused on a single setup concern. A login subflow should only log in, not assert anything about the post-login screen beyond what's needed to confirm success. The calling flow owns post-login assertions.

### Wait Strategies

Maestro polls by default: most commands retry until the element is visible or a timeout expires. Understand which strategy applies to which situation.

| Command | Use When | Default Timeout |
|---------|----------|-----------------|
| `assertVisible` | Confirming a static element appeared | 5 seconds |
| `assertVisible` with `timeout:` | After async operations (API calls, navigation) | Set explicitly |
| `extendedWaitUntil` | Waiting for a condition before continuing | Configurable |
| `waitForAnimationToEnd` | After transitions, modals, tab switches | Implicit |
| `scrollUntilVisible` | Finding items in a long list | Configurable |

```yaml
# Wait up to 10 seconds for a screen that loads async data
- assertVisible:
    id: "army-builder-screen"
    timeout: 10000
# Wait for an animation to settle before tapping (Expo Router transitions, bottom sheets)
- waitForAnimationToEnd
- tapOn:
    id: "match-active-end-turn-button"
# Poll until a condition is met (e.g., loading spinner disappears)
- extendedWaitUntil:
    notVisible:
      id: "global-loading-spinner"
    timeout: 15000
```

Prefer explicit `timeout:` values on assertions that follow network calls or navigation. The default 5-second timeout causes flaky failures on slower CI runners.

### Environment Variables

Flows receive credentials and runtime config through an `env:` block at the top of the file. Variables declared there are available as `${VARIABLE_NAME}` throughout the flow.

```yaml
# env: block declared at the top of any flow that needs credentials.
appId: com.armoury.mobile
env:
  TEST_USER_EMAIL: ${TEST_USER_EMAIL}
  TEST_USER_PASSWORD: ${TEST_USER_PASSWORD}
---
- tapOn:
    id: "auth-email-input"
- inputText: ${TEST_USER_EMAIL}
```

Pass values at runtime with `--env`:

```bash
maestro test flows/army-creation.yaml \
  --env TEST_USER_EMAIL=test@armoury.dev \
  --env TEST_USER_PASSWORD=secret
```

In CI, pull values from secrets and pass them via `--env`. Never hardcode credentials in YAML files.

### Running Maestro Tests

Ensure the app is running on a simulator or device before executing any flow. For Expo, `npx expo start` with the development build is the typical starting point.

```bash
# Run a single flow
maestro test e2e/mobile/flows/army-creation.yaml

# Run all flows in the directory
maestro test e2e/mobile/flows/

# Run flows matching a tag
maestro test e2e/mobile/flows/ --tag smoke

# Pass credentials inline
maestro test e2e/mobile/flows/army-creation.yaml \
  --env TEST_USER_EMAIL=test@armoury.dev \
  --env TEST_USER_PASSWORD=secret

# Launch Maestro Studio for interactive debugging
maestro studio
```

Maestro Studio is the fastest way to debug a failing selector. It shows element IDs and text in real time without needing to re-run the full flow.

### Critical User Journeys

These are the journeys to cover first, in roughly priority order. They mirror the web journeys in the Playwright section.

| Journey | Screens | Auth Required | Priority |
|---------|---------|---------------|----------|
| Sign in | Auth screen, `/armies` | No | P0 |
| Create a new army | `/armies/new`, `/armies/:id` | Yes | P0 |
| Add units in army builder | `/armies/:id/builder` | Yes | P0 |
| Navigate tab bar | All tab roots | Yes | P1 |
| Create a match | `/matches/new`, `/matches/:id` | Yes | P1 |
| Start an active match | `/matches/:id/active` | Yes | P1 |
| Record a match result | `/matches/:id/active` | Yes | P1 |
| Create a campaign | `/campaigns/new`, `/campaigns/:id` | Yes | P2 |
| Add armies to a campaign | `/campaigns/:id` | Yes | P2 |
| Select a game system | `/armies/new` | Yes | P1 |

Don't cover every variant. Cover the happy path and one key error state per journey (e.g., empty army name on the create form). Edge cases and validation details belong in unit tests.

### CI/CD Options

Three options exist for running Maestro in CI. Choose based on your team's existing infrastructure and budget.

#### GitHub Actions

iOS flows require a macOS runner because the iOS Simulator only runs on macOS. Android flows run on Ubuntu with KVM acceleration. Both incur per-minute costs at GitHub's standard runner rates.

```yaml
# .github/workflows/e2e-mobile.yml
name: Mobile E2E
on:
  workflow_dispatch:
  push:
    branches: [main]

jobs:
  ios:
    runs-on: macos-15
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install Maestro
        run: brew install maestro

      - name: Build Expo app (iOS)
        run: npx expo run:ios --configuration Release
        working-directory: src/mobile

      - name: Run Maestro flows
        run: |
          maestro test e2e/mobile/flows/ \
            --env TEST_USER_EMAIL=${{ secrets.E2E_USER_EMAIL }} \
            --env TEST_USER_PASSWORD=${{ secrets.E2E_USER_PASSWORD }}

  android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm

      - name: Install dependencies
        run: npm ci

      # KVM acceleration is required for the Android emulator on Ubuntu
      - name: Enable KVM
        run: |
          echo 'KERNEL=="kvm", GROUP="kvm", MODE="0666", OPTIONS+="static_node=kvm"' | sudo tee /etc/udev/rules.d/99-kvm4all.rules
          sudo udevadm control --reload-rules && sudo udevadm trigger --name-match=kvm

      - name: Install Maestro
        run: curl -Ls "https://get.maestro.mobile.dev" | bash

      - name: Build Expo app (Android)
        run: npx expo run:android
        working-directory: src/mobile

      - name: Run Maestro flows
        run: |
          ~/.maestro/bin/maestro test e2e/mobile/flows/ \
            --env TEST_USER_EMAIL=${{ secrets.E2E_USER_EMAIL }} \
            --env TEST_USER_PASSWORD=${{ secrets.E2E_USER_PASSWORD }}

#### EAS Workflows

EAS Workflows (Expo Application Services) has native Maestro support via the `maestro` job type. This is simpler than GitHub Actions for Expo projects because EAS manages the simulator provisioning and app build internally.

```yaml
# eas/workflows/e2e-mobile.yml
name: Mobile E2E
on:
  push:
    branches: [main]

jobs:
  ios-e2e:
    type: maestro
    platform: ios
    profile: development
    flows:
      - e2e/mobile/flows/
    env:
      TEST_USER_EMAIL:
        $secret: E2E_USER_EMAIL
      TEST_USER_PASSWORD:
        $secret: E2E_USER_PASSWORD

  android-e2e:
    type: maestro
    platform: android
    profile: development
    flows:
      - e2e/mobile/flows/
    env:
      TEST_USER_EMAIL:
        $secret: E2E_USER_EMAIL
      TEST_USER_PASSWORD:
        $secret: E2E_USER_PASSWORD
```

EAS secrets are configured in the Expo dashboard. The `$secret:` syntax references them without exposing values in the workflow file.

#### Maestro Cloud

Maestro Cloud is a SaaS device farm that runs flows against real devices. Upload flows with the `maestro cloud` command and view results in the Maestro dashboard. Pricing starts at approximately $250/device/month. See [maestro.mobile.dev/cloud](https://maestro.mobile.dev/cloud) for current pricing.

```bash
# Upload and run flows on Maestro Cloud
maestro cloud --apiKey $MAESTRO_CLOUD_API_KEY e2e/mobile/flows/
```

#### Decision Matrix

| Option | Cost | Setup Complexity | Best For |
|--------|------|-----------------|----------|
| GitHub Actions | GitHub runner minutes | Medium (build + emulator config) | Teams already on GitHub Actions |
| EAS Workflows | EAS plan + build minutes | Low (native Expo integration) | Teams using EAS Build |
| Maestro Cloud | ~$250/device/month | Low (upload flows, no infra) | Teams needing real device coverage |

### Known Issues and Workarounds

| Issue | Affected Versions | Workaround |
|-------|------------------|------------|
| iOS Simulator hangs on launch with Xcode 16.2 on macOS Sequoia | Maestro < 1.40.0, Xcode 16.2 | Upgrade to Maestro 1.40.0+, or downgrade Xcode to 16.1 |
| `expo-blur` `BlurView` blocks scroll gestures — `scrollUntilVisible` times out | All Maestro versions | Wrap scrollable content in a plain `View` for E2E builds, or use `scrollUntilVisible` with an increased `timeout:` |
| iOS Simulator crashes on launch when New Architecture is enabled | Maestro < 1.38.0 | Upgrade Maestro, or disable New Architecture in `app.json` for E2E builds |
| Android emulator flows fail on API level < 29 | All Maestro versions | Target API 29+ in your CI emulator config |
| `launchApp: clearState: true` does not clear Expo SecureStore on Android | All Maestro versions | Add an explicit logout step at the start of flows instead of relying on state clear |
---

## CI/CD Integration

### GitHub Actions Workflow

Tests run in separate jobs that parallelise once types are generated.

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  # --- Shared setup ---
  generate-types:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: turbo run generate:types
      - uses: actions/upload-artifact@v4
        with:
          name: generated-types
          path: '**/dist/**/*.d.ts'

  # --- Unit tests ---
  test-unit:
    needs: generate-types
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - uses: actions/download-artifact@v4
        with:
          name: generated-types
      - run: turbo run test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: vitest-coverage
          path: '**/coverage/'

  # --- Integration tests ---
  test-integration:
    needs: generate-types
    runs-on: ubuntu-latest
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - uses: actions/download-artifact@v4
        with:
          name: generated-types
      - run: turbo run test:integration

  # --- Service E2E (Lambda + Docker) ---
  test-e2e-services:
    needs: generate-types
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - uses: actions/download-artifact@v4
        with:
          name: generated-types
      - run: npm run test:e2e:services

  # --- Browser E2E (Playwright) ---
  test-e2e-web:
    needs: generate-types
    runs-on: ubuntu-latest
    env:
      E2E_USER_EMAIL: ${{ secrets.E2E_USER_EMAIL }}
      E2E_USER_PASSWORD: ${{ secrets.E2E_USER_PASSWORD }}
      E2E_DATABASE_URL: ${{ secrets.E2E_DATABASE_URL }}
      E2E_NEXTAUTH_SECRET: ${{ secrets.E2E_NEXTAUTH_SECRET }}
      CI: true
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - uses: actions/download-artifact@v4
        with:
          name: generated-types
      - name: Cache Playwright browsers
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium firefox
      - name: Build Next.js
        run: turbo run build --filter=@armoury/web
      - name: Run Playwright tests
        run: npx playwright test --config e2e/web/playwright.config.ts
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-traces
          path: test-results/
          retention-days: 7
```

### Sharding (for scale)

When the Playwright suite grows past ~5 minutes, shard across multiple runners and merge blob reports at the end:

```yaml
  test-e2e-web:
    needs: generate-types
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      # ... checkout, node, npm ci, download types ...
      - name: Run Playwright shard
        run: npx playwright test --config e2e/web/playwright.config.ts --shard=${{ matrix.shard }}/4
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: blob-report-${{ matrix.shard }}
          path: blob-report/
          retention-days: 1

  merge-playwright-reports:
    needs: test-e2e-web
    runs-on: ubuntu-latest
    if: always()
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - uses: actions/download-artifact@v4
        with:
          path: all-blob-reports/
          pattern: blob-report-*
          merge-multiple: true
      - run: npx playwright merge-reports --reporter html ./all-blob-reports/
      - uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14
```

### Key CI Decisions

**Parallelise across jobs, not within.** `generate-types` runs once; unit, integration, service E2E, and browser E2E all fan out from it in parallel. The full pipeline from push to result should complete in under 10 minutes for PRs.

**Cache Playwright browsers by version.** Add a cache step keyed on `playwright` version and OS to avoid re-downloading ~300MB of browser binaries on every run. The `actions/setup-node` cache covers `node_modules`; Playwright needs its own cache key.

**Upload artifacts on failure only.** HTML reports and traces are only useful when something breaks. Uploading on every run wastes storage and slows down passing runs.

**Never cache `test:e2e`.** The Turbo task already sets `"cache": false`. Do not add Turbo remote caching for E2E outputs.

**`PLAYWRIGHT_BASE_URL` in CI.** Use this env var to point Playwright at the built app. Locally, `webServer` handles startup automatically and `reuseExistingServer: true` means you can run `next dev` alongside `playwright test` without restarts.

---

## Coverage Strategy

### What to Measure

Coverage is a tool for spotting untested code paths, not a target to game. Don't chase a percentage at the cost of writing meaningless tests.

Measure **statement and branch coverage** in the business logic layers:

| Workspace | Target | Notes |
|-----------|--------|-------|
| `@armoury/models` | 90%+ | Pure types and data shapes — high coverage is cheap |
| `@armoury/data` | 80%+ | Core data layer — critical paths must be covered |
| `@armoury/wh40k10e` | 75%+ | Game logic — complex, so aim for branches not just lines |
| `@armoury/validation` | 80%+ | Validation rules should have near-complete branch coverage |
| `@armoury/providers-bsdata` | 60%+ | XML parsing — tricky edge cases, integration tests carry weight here |
| `@armoury/clients-*` | 50%+ | HTTP clients — mock heavy, integration tests more valuable |
| `@armoury/web` | 40%+ | React components — unit test hooks and utils; rely on E2E for UI flows |
| `@armoury/mobile` | 40%+ | Same as web |
| `@armoury/campaigns` | 70%+ | Lambda handlers — business logic should be well tested |
| `@armoury/authorizer` | 70%+ | Auth logic — security-sensitive, test the branches |

### What NOT to Measure

- Generated files (`dist/`)
- Config files (`vitest.config.ts`, `eslint.config.js`, `playwright.config.ts`)
- Type-only files (`.d.ts`, barrel `index.ts` files that only re-export)
- Test helpers (`__fixtures__/`, `__mocks__/`, `__testing__/`)
- E2E test files themselves

### Enabling Coverage in Vitest

Add `@vitest/coverage-v8` to the workspace dev dependencies and configure it in the vitest config:

```typescript
// Example addition to a workspace vitest.config.ts
defineConfig({
    test: {
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            exclude: [
                'node_modules/**',
                'dist/**',
                '**/__tests__/**',
                '**/__mocks__/**',
                '**/__fixtures__/**',
                '**/*.config.ts',
                '**/index.ts',    // barrel files
            ],
        },
    },
});
```

Run with:

```bash
npx vitest --config src/shared/data/vitest.config.ts --coverage
```

Upload LCOV reports to a coverage service (Codecov, Coveralls) in CI for PR-level visibility.

---

## Testing Conventions

These rules apply across all test types. They complement the patterns in `docs/CODING_STANDARDS.md`.

### File Naming Summary

| Type | File pattern | Config that picks it up |
|------|-------------|------------------------|
| Unit | `__tests__/*.test.ts` | `vitest.config.ts` |
| Integration | `__tests__/*.integration.test.ts` | `vitest.integration.config.ts` |
| Service E2E | `src/**/*.e2e.test.ts` | `vitest.e2e.config.ts` |
| Browser E2E | `e2e/web/tests/*.spec.ts` | `playwright.config.ts` |
| Mobile E2E | `e2e/mobile/.maestro/*.yaml` | Maestro CLI |

### Test Plan Comment

Every test file must open with a block that maps requirements to test cases. This enforces traceability and makes the file scannable:

```typescript
/**
 * ArmyDAO — unit tests
 *
 * REQ-01 getById returns null when the army does not exist
 * REQ-02 getById returns the army when it exists
 * REQ-03 save persists a new army with the provided fields
 * REQ-04 save updates an existing army without overwriting unrelated fields
 * REQ-05 delete removes the army from the store
 * REQ-06 list returns all armies for the given owner
 * REQ-07 list returns an empty array when the owner has no armies
 */
```

### `describe` / `it` Structure

```typescript
describe('ArmyDAO', () => {
    describe('getById', () => {
        it('returns null when the army does not exist', () => { ... });
        it('returns the army when it exists', () => { ... });
    });

    describe('save', () => {
        it('persists a new army', () => { ... });
        it('updates an existing army', () => { ... });
    });
});
```

Use a top-level `describe` for the module or class, then nested `describe` blocks per method or feature. `it` labels describe observable behaviour from the caller's perspective, not implementation details.

### Explicit Vitest Imports

Always import test functions explicitly, even though globals are enabled:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
```

### What Makes a Good Test

A test is valuable when:

- It fails when behaviour breaks (regression protection)
- It documents how the module is meant to be used
- It catches a class of bugs you've seen or can reason about

A test is wasteful when:

- It only asserts that a mock was called (testing the mock, not the code)
- It duplicates another test with minor input variation that doesn't test a new branch
- It exists solely to hit a coverage number

Prefer fewer, more meaningful tests over many shallow ones.

### Playwright Conventions

- Use `getByRole` and `getByLabel` selectors exclusively. Never use `data-testid` attributes — all elements must be queryable via accessible names.
- Add accessible labels (`aria-label`, `aria-labelledby`) to elements that have no visible text (e.g., icon-only buttons) so they can be queried by role.
- Never use `page.waitForTimeout()`. Use `waitForURL`, `waitForSelector`, or `expect(locator).toBeVisible()` instead.
- Keep test files under ~100 lines. Extract repeated interactions into Page Objects or fixtures.
- One assertion-heavy test per journey. Don't split a single user flow across many `it` blocks.

### Test Data Isolation

Each test must clean up after itself. Options in priority order:

1. **Transaction rollback** — wrap the test in a DB transaction and roll back on teardown (fastest)
2. **Fixture teardown** — create via API in `setup`, delete via API in `teardown` (Playwright fixture pattern)
3. **Unique data per test** — use a random suffix (`army-${Date.now()}`) so tests don't collide even if cleanup fails

Never share mutable state between tests. Tests must be runnable in any order and in parallel.

### Don't Duplicate Coverage Across Layers

If a DAO method is fully covered by unit tests, don't re-test the same edge cases in an integration test. Integration tests confirm the DAO works with a real database, not every permutation of its logic.

If a flow is covered by an E2E test, don't add a component test that simulates the same user journey at a lower level just to increase coverage numbers.

E2E tests are expensive to run and maintain. Use them to verify the seams between systems, not to re-verify business logic that's already well covered at lower layers.
