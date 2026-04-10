# Dependency Injection Architecture — Inversify Adoption

> **Status**: Draft — pending review  
> **Date**: 2026-04-09  
> **Scope**: Monorepo-wide DI strategy for web, mobile, and Lambda services

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Why Inversify](#why-inversify)
3. [Version Decision: v8](#version-decision-v8)
4. [esbuild + Decorator Compatibility](#esbuild--decorator-compatibility)
5. [Architecture Overview](#architecture-overview)
6. [Token & Module Design](#token--module-design)
7. [Platform Composition Roots](#platform-composition-roots)
    - [Web (Next.js 15 App Router)](#web-nextjs-15-app-router)
    - [Mobile (Expo 53)](#mobile-expo-53)
    - [Lambda Services](#lambda-services)
8. [Game System DAO Registration](#game-system-dao-registration)
9. [Testing & E2E Overrides](#testing--e2e-overrides)
10. [Where DI Adds Value vs Overhead](#where-di-adds-value-vs-overhead)
11. [Migration Strategy](#migration-strategy)
12. [Risks & Mitigations](#risks--mitigations)
13. [Decision Log](#decision-log)

---

## Problem Statement

Adapters and clients are hardcoded in composition roots with no seam for environment-based selection:

```typescript
// src/web/src/providers/DataContextProvider.tsx (line 153)
const adapter = new PGliteAdapter({ dataDir: 'idb://armoury' });

// src/mobile/src/providers/DataContextProvider.tsx (line 156)
const adapter = new SQLiteAdapter(database);

// src/services/campaigns/src/handler.ts (line 112)
const adapter = new DSQLAdapter({ clusterEndpoint, region });
```

**Consequences:**

- **No test seam**: E2E tests cannot swap the production PGlite adapter for a test-configured one without patching the provider.
- **Duplicate wiring**: Web and mobile `DataContextProvider` files are ~90% identical — both construct the same clients (`createGitHubClient`, `createWahapediaClient`) and run the same builder pipeline.
- **40+ manual DAO instantiations**: `createGameContext()` in `wh40k10e/system.ts` (lines 316–402) manually constructs every faction DAO with `new FactionDAO(adapter, githubClient)`. Adding a new faction requires editing this 90-line function.
- **No environment switching**: Swapping adapters for preview deploys, local dev, or integration testing requires code changes rather than configuration.

---

## Why Inversify

### Decision

**Use inversify as the sole DI container.** tsyringe is unmaintained (last meaningful release: 2023).

### Selection Criteria

| Criterion          | inversify                                  | tsyringe               | Manual wiring                   |
| ------------------ | ------------------------------------------ | ---------------------- | ------------------------------- |
| Active maintenance | ✅ ~1,500 commits in 6 months (monorepo)   | ❌ Dormant since 2023  | N/A                             |
| TypeScript-first   | ✅ Written in TS, strict types             | ✅                     | N/A                             |
| Decorator support  | ✅ `@injectable()`, `@inject()` decorators | ✅ Decorators required | N/A                             |
| ESM support        | ✅ v7 dual CJS/ESM, v8 ESM-only            | ⚠️ CJS only            | N/A                             |
| Ecosystem          | ✅ Express, Fastify, Hono adapters         | ❌ None                | N/A                             |
| Weekly downloads   | ~1.86M                                     | ~1.2M                  | N/A                             |
| Solves our problem | ✅ Environment-based registration          | ✅                     | ❌ Requires custom factory code |

### What Inversify Gives Us

1. **Environment-based adapter selection** — Register different adapters for production, e2e, preview, local dev at container setup time.
2. **Centralized wiring** — One place per platform to see all dependencies.
3. **Test overrides** — `container.rebind(TOKEN).to(MockAdapter)` for any test scenario.
4. **DAO auto-wiring** — The 40+ faction DAOs can be registered and resolved from the container rather than manually constructed.

---

## Version Decision: v8

### Recommendation: Use v8.1 (active monorepo)

| Concern                    | v7.10 (legacy)                              | v8.1 (chosen)                               |
| -------------------------- | ------------------------------------------- | ------------------------------------------- |
| ESM + CJS                  | Dual (both available)                       | ✅ ESM-only (matches our monorepo)          |
| esbuild                    | ⚠️ Needs `emitDecoratorMetadata` workaround | ✅ No `emitDecoratorMetadata` needed        |
| Metro (Expo)               | CJS available, Metro-safe                   | ⚠️ ESM-only — requires Metro ESM validation |
| `experimentalDecorators`   | Required                                    | Required                                    |
| Tree-shaking               | `sideEffects: false`                        | ⚠️ `sideEffects: true` (metadata init)      |
| Active development         | 🔴 Legacy repo (2 commits/6mo)              | ✅ Monorepo (~1,500 commits/6mo)            |
| `reflect-metadata`         | Required as peer dep                        | ✅ Bundled internally (no peer dep)         |
| Container snapshot/restore | Built-in                                    | ❌ Not yet ported                           |

**Rationale**: v8 is the actively maintained version (~1,500 commits in 6 months). It drops the `emitDecoratorMetadata` requirement (which was a hard blocker for esbuild in v7), internalizes `reflect-metadata` (no peer dep management), and is ESM-only — aligned with our ESM-only monorepo. The legacy v7 repo has received only 2 commits in 6 months and should be considered unmaintained.

**Metro risk**: v8's ESM-only output is untested with Expo 53's Metro bundler. This must be validated early in Phase 1 (see [Risks & Mitigations](#risks--mitigations)). Mitigation options: Metro's experimental ESM support via `@expo/metro-config`, or configuring `resolver.resolveRequest` to handle the package. If Metro proves incompatible, the fallback is v7 for mobile only.

---

## esbuild + Decorator Compatibility

A previous concern was whether esbuild could handle inversify's decorator requirements. **With v8, there are no issues.** Here's why:

### Issue 1: `emitDecoratorMetadata` (v7-only problem — eliminated)

inversify v7 relied on `emitDecoratorMetadata` to reflect constructor parameter types at runtime. esbuild [does not support `emitDecoratorMetadata`](https://github.com/evanw/esbuild/issues/257) and never will — it's a TypeScript-specific feature that requires type information at build time, which esbuild intentionally discards for speed.

**inversify v8 eliminated this requirement entirely.** v8 uses `@inject(TOKEN)` to explicitly mark each constructor parameter — no runtime type reflection needed. This is why v8 is compatible with esbuild, SWC, and any other transpiler that doesn't support `emitDecoratorMetadata`.

### Issue 2: Decorator transpilation (esbuild supports it)

esbuild v0.21+ natively transpiles `experimentalDecorators` syntax (TypeScript's legacy decorator spec). Our build pipeline already uses esbuild via `@armoury/esbuild/library.js` and `service.js` — both configured with `bundle: true, format: 'esm'`. No additional esbuild configuration is needed for decorator support.

### What's Required

1. **`tsconfig.base.json`**: Add `"experimentalDecorators": true` (already present in `infra/cdk/tsconfig.json` — extend to shared base).
2. **No esbuild config changes**: esbuild reads the tsconfig and transpiles decorators automatically.
3. **No Babel plugins** (for web/services): esbuild handles it. Mobile uses Babel via Metro — `@babel/plugin-proposal-decorators` in legacy mode is needed there.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  Platform Layer                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │   Web    │  │  Mobile  │  │  Lambda Services  │  │
│  │ (Next.js)│  │  (Expo)  │  │  (Node handlers)  │  │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       │              │                 │              │
│       ▼              ▼                 ▼              │
│  ┌──────────────────────────────────────────────┐    │
│  │         Platform Container Module            │    │
│  │  (registers platform-specific bindings)      │    │
│  └──────────────────┬───────────────────────────┘    │
│                     │                                │
├─────────────────────┼────────────────────────────────┤
│                     ▼                                │
│  ┌──────────────────────────────────────────────┐    │
│  │            Shared Container Module           │    │
│  │                                              │    │
│  │  @armoury/di (new package)                   │    │
│  │  ├── tokens.ts         (injection tokens)    │    │
│  │  ├── modules/                                │    │
│  │  │   ├── core.module.ts   (shared bindings)  │    │
│  │  │   ├── web.module.ts    (PGlite, proxy)    │    │
│  │  │   ├── mobile.module.ts (SQLite)           │    │
│  │  │   ├── lambda.module.ts (DSQL)             │    │
│  │  │   └── test.module.ts   (mocks/stubs)      │    │
│  │  └── container.ts      (factory function)    │    │
│  │                                              │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│              Shared Layer (unchanged)                 │
│  ┌────────────┐ ┌───────────┐ ┌──────────────────┐   │
│  │ @armoury/  │ │ @armoury/ │ │ @armoury/systems │   │
│  │ data-dao   │ │ adapters  │ │    (wh40k10e)    │   │
│  └────────────┘ └───────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Key Principles

1. **Decorator syntax on class definitions** — Classes use `@injectable()` and `@inject(TOKEN)` decorators directly. inversify v8 dropped the `emitDecoratorMetadata` requirement, and esbuild v0.21+ natively transpiles `experimentalDecorators` syntax — so there are no build tooling issues.
2. **Modules, not a single container** — Each platform loads shared + platform-specific modules. Tests load shared + test module.
3. **Existing APIs preserved** — `DataContextBuilder` remains the public API. The container is an internal implementation detail that feeds the builder.
4. **No container in React components** — Components use `DataContext` via the existing React context, not inversify directly. The container lives in the provider (composition root) only.
5. **No `reflect-metadata` peer dependency** — v8 internalizes it. No polyfill management needed.

---

## Token & Module Design

### New Package: `@armoury/di`

```
src/shared/di/
├── package.json
├── src/
│   ├── index.ts
│   ├── tokens.ts              # Injection token symbols
│   ├── types.ts               # Container configuration types
│   ├── container.ts           # Container factory
│   ├── registration.ts        # Re-exports decorated classes
│   └── modules/
│       ├── core.module.ts     # Shared bindings (builder, game systems)
│       ├── web.module.ts      # PGliteAdapter, GitHub proxy config
│       ├── mobile.module.ts   # SQLiteAdapter, direct GitHub access
│       ├── lambda.module.ts   # DSQLAdapter, SSM config
│       └── test.module.ts     # Mock adapters, stub clients
└── tsconfig.json
```

### Tokens (`tokens.ts`)

```typescript
/**
 * @requirements
 * - REQ-DI-001: Every injectable dependency has a unique symbol token
 * - REQ-DI-002: Tokens are grouped by domain (adapter, client, system, dao)
 * - REQ-DI-003: Token names match the interface they represent
 */

export const TOKENS = {
    // Adapters
    DatabaseAdapter: Symbol.for('DatabaseAdapter'),
    AdapterConfig: Symbol.for('AdapterConfig'),

    // Clients
    GitHubClient: Symbol.for('GitHubClient'),
    WahapediaClient: Symbol.for('WahapediaClient'),
    QueryClient: Symbol.for('QueryClient'),

    // Configuration
    GitHubProxyConfig: Symbol.for('GitHubProxyConfig'),
    DSQLConfig: Symbol.for('DSQLConfig'),

    // Context
    DataContextBuilder: Symbol.for('DataContextBuilder'),
    GameSystem: Symbol.for('GameSystem'),

    // Factories
    AdapterFactory: Symbol.for('AdapterFactory'),
    GitHubClientFactory: Symbol.for('GitHubClientFactory'),
    WahapediaClientFactory: Symbol.for('WahapediaClientFactory'),
} as const;
```

### Registration (`registration.ts`)

With decorator syntax, `@injectable()` and `@inject()` decorators live on the class definitions themselves (in each adapter/service source file). The `registration.ts` file becomes a re-export barrel that ensures all decorated classes are imported and available to the container:

```typescript
/**
 * @requirements
 * - REQ-DI-010: All injectable classes use @injectable() and @inject() decorators
 * - REQ-DI-011: Registration barrel re-exports decorated classes for container loading
 */

// Re-export decorated classes so container modules can reference them
export { PGliteAdapter } from '@armoury/adapters-pglite';
export { DataContextBuilder } from '@armoury/data-context';
```

The decorators live on the class definitions:

```typescript
// In @armoury/adapters-pglite/src/PGliteAdapter.ts
import { injectable, inject } from 'inversify';
import { TOKENS } from '@armoury/di';

@injectable()
export class PGliteAdapter {
    constructor(@inject(TOKENS.AdapterConfig) config: PGliteAdapterConfig) {
        // ...
    }
}
```

```typescript
// In @armoury/data-context/src/DataContextBuilder.ts
import { injectable } from 'inversify';

@injectable()
export class DataContextBuilder {
    // ...
}
```

### Core Module (`modules/core.module.ts`)

```typescript
/**
 * @requirements
 * - REQ-DI-020: Core module contains only platform-agnostic bindings
 * - REQ-DI-021: Core module is loaded by every platform
 */

import { ContainerModule } from 'inversify';
import { DataContextBuilder } from '@armoury/data-context';
import { TOKENS } from '../tokens.js';

export const coreModule = new ContainerModule((bind) => {
    bind(TOKENS.DataContextBuilder).to(DataContextBuilder).inTransientScope();
});
```

### Web Module (`modules/web.module.ts`)

```typescript
/**
 * @requirements
 * - REQ-DI-030: Web module registers PGlite adapter with IndexedDB storage
 * - REQ-DI-031: Web module registers GitHub client with optional proxy config
 * - REQ-DI-032: All web bindings are singleton-scoped (one per app session)
 */

import { ContainerModule } from 'inversify';
import { TOKENS } from '../tokens.js';

export const webModule = new ContainerModule((bind) => {
    // Adapter factory — deferred construction (dynamic import for code splitting)
    bind(TOKENS.AdapterFactory).toFactory(() => {
        return async () => {
            const { PGliteAdapter } = await import('@armoury/adapters-pglite');
            return new PGliteAdapter({ dataDir: 'idb://armoury' });
        };
    });

    // GitHub client factory — deferred construction
    bind(TOKENS.GitHubClientFactory).toFactory((context) => {
        return async (queryClient: unknown) => {
            const { createGitHubClient } = await import('@armoury/adapters-github');
            const proxyConfig = context.container.isBound(TOKENS.GitHubProxyConfig)
                ? context.container.get(TOKENS.GitHubProxyConfig)
                : undefined;
            return createGitHubClient(queryClient, proxyConfig);
        };
    });

    // Wahapedia client factory — deferred construction
    bind(TOKENS.WahapediaClientFactory).toFactory(() => {
        return async (queryClient: unknown) => {
            const { createWahapediaClient } = await import('@armoury/adapters-wahapedia');
            return createWahapediaClient(queryClient);
        };
    });

    // GitHub proxy config (optional — only for proxied environments)
    const proxyBaseUrl = process.env['NEXT_PUBLIC_GITHUB_PROXY_URL'];
    if (proxyBaseUrl) {
        bind(TOKENS.GitHubProxyConfig).toConstantValue({
            apiBaseUrl: `${proxyBaseUrl}/api`,
            rawBaseUrl: `${proxyBaseUrl}/raw`,
        });
    }
});
```

### Mobile Module (`modules/mobile.module.ts`)

```typescript
/**
 * @requirements
 * - REQ-DI-040: Mobile module registers SQLite adapter with expo-sqlite
 * - REQ-DI-041: Mobile module registers GitHub client with direct access (no proxy)
 */

import { ContainerModule } from 'inversify';
import { TOKENS } from '../tokens.js';

export const mobileModule = new ContainerModule((bind) => {
    bind(TOKENS.AdapterFactory).toFactory(() => {
        return async () => {
            const { SQLiteAdapter } = await import('@armoury/adapters-sqlite');
            const { openDatabaseAsync } = await import('expo-sqlite');
            const database = await openDatabaseAsync('armoury');
            return new SQLiteAdapter(database);
        };
    });

    bind(TOKENS.GitHubClientFactory).toFactory(() => {
        return async (queryClient: unknown) => {
            const { createGitHubClient } = await import('@armoury/adapters-github');
            return createGitHubClient(queryClient);
        };
    });

    bind(TOKENS.WahapediaClientFactory).toFactory(() => {
        return async (queryClient: unknown) => {
            const { createWahapediaClient } = await import('@armoury/adapters-wahapedia');
            return createWahapediaClient(queryClient);
        };
    });
});
```

### Lambda Module (`modules/lambda.module.ts`)

```typescript
/**
 * @requirements
 * - REQ-DI-050: Lambda module registers DSQL adapter as singleton per container instance
 * - REQ-DI-051: Adapter config comes from SSM Parameter Store (resolved at init time)
 * - REQ-DI-052: Container is created once per cold start, reused across warm invocations
 */

import { ContainerModule } from 'inversify';
import { DSQLAdapter } from '@armoury/adapters-dsql';
import { TOKENS } from '../tokens.js';

export function createLambdaModule(config: { clusterEndpoint: string; region: string }): ContainerModule {
    return new ContainerModule((bind) => {
        bind(TOKENS.DatabaseAdapter)
            .toDynamicValue(() => {
                const adapter = new DSQLAdapter({
                    clusterEndpoint: config.clusterEndpoint,
                    region: config.region,
                });
                return adapter;
            })
            .inSingletonScope();
    });
}
```

### Test Module (`modules/test.module.ts`)

```typescript
/**
 * @requirements
 * - REQ-DI-060: Test module provides mock/stub implementations for all tokens
 * - REQ-DI-061: Test module supports partial overrides (rebind specific tokens only)
 */

import { ContainerModule } from 'inversify';
import { TOKENS } from '../tokens.js';

/** Creates a test container module with optional overrides. */
export function createTestModule(overrides?: { adapterFactory?: () => Promise<unknown> }): ContainerModule {
    return new ContainerModule((bind) => {
        bind(TOKENS.AdapterFactory).toFactory(() => {
            return (
                overrides?.adapterFactory ??
                (async () => {
                    // Default: in-memory PGlite for tests
                    const { PGliteAdapter } = await import('@armoury/adapters-pglite');
                    return new PGliteAdapter({ dataDir: 'memory://' });
                })
            );
        });
    });
}
```

---

## Platform Composition Roots

### Web (Next.js 15 App Router)

The container lives in the `DataContextProvider` — the only composition root for web. Components never interact with inversify directly.

```typescript
// src/web/src/providers/DataContextProvider.tsx (updated)

'use client';

import { Container } from 'inversify';
import { coreModule, webModule, TOKENS } from '@armoury/di';

// Container created once per app lifecycle
const container = new Container();
container.load(coreModule, webModule);

const enableSystem = async (system: GameSystem): Promise<void> => {
    const { DataContextBuilder } = await import('@armoury/data-context');
    const { getQueryClient } = await import('@/lib/getQueryClient.js');

    const queryClient = getQueryClient();

    // Resolve factories from container instead of hardcoding
    const createAdapter = container.get<() => Promise<DatabaseAdapter>>(TOKENS.AdapterFactory);
    const createGithub = container.get<(qc: unknown) => Promise<IGitHubClient>>(TOKENS.GitHubClientFactory);
    const createWahapedia = container.get<(qc: unknown) => Promise<IWahapediaClient>>(TOKENS.WahapediaClientFactory);

    const [adapter, githubClient, wahapediaClient] = await Promise.all([
        createAdapter(),
        createGithub(queryClient),
        createWahapedia(queryClient),
    ]);

    const dc = await DataContextBuilder.builder()
        .system(system)
        .adapter(adapter)
        .register('github', githubClient)
        .register('wahapedia', wahapediaClient)
        .build();

    setDataContext(dc);
};
```

#### React Server Components

**Inversify does not cross the RSC boundary.** This is by design:

- **Server Components** (Route Handlers, Server Actions, `page.tsx` without `'use client'`): Import services directly. No container needed — server-side code doesn't need environment switching (it always runs in one environment).
- **Client Components** (`'use client'` subtree): Access `DataContext` via the existing React context provider. The container is an implementation detail of the provider.

```
app/
├── layout.tsx           ← Server Component (no container)
├── page.tsx             ← Server Component (no container)
└── providers.tsx         ← 'use client' (container lives here)
    └── <DataContextProvider>
        └── <ClientApp />  ← All client components use DataContext via React context
```

### Mobile (Expo 53)

Same pattern as web — container in the provider, components unaware of inversify.

```typescript
// src/mobile/src/providers/DataContextProvider.tsx (updated)

import { Container } from 'inversify';
import { coreModule, mobileModule, TOKENS } from '@armoury/di';

const container = new Container();
container.load(coreModule, mobileModule);

const enableSystem = async (system: GameSystem): Promise<void> => {
    const createAdapter = container.get<() => Promise<DatabaseAdapter>>(TOKENS.AdapterFactory);
    const createGithub = container.get<(qc: unknown) => Promise<IGitHubClient>>(TOKENS.GitHubClientFactory);
    const createWahapedia = container.get<(qc: unknown) => Promise<IWahapediaClient>>(TOKENS.WahapediaClientFactory);

    const [adapter, githubClient, wahapediaClient] = await Promise.all([
        createAdapter(),
        createGithub(queryClient),
        createWahapedia(queryClient),
    ]);

    // Same DataContextBuilder pipeline as web
    const dc = await DataContextBuilder.builder()
        .system(system)
        .adapter(adapter)
        .register('github', githubClient)
        .register('wahapedia', wahapediaClient)
        .build();

    setDataContext(dc);
};
```

**Mobile-specific concerns:**

- **Metro bundler**: inversify v8 is ESM-only. Metro's experimental ESM support (via `@expo/metro-config`) must be validated in Phase 1. Fallback: configure `resolver.resolveRequest` to handle the package, or use v7 for mobile only if Metro proves incompatible.
- **Hermes engine**: v8 internalizes `reflect-metadata`, removing the Hermes polyfill concern. Babel's `@babel/plugin-proposal-decorators` in legacy mode handles `@injectable()` / `@inject()` decorator syntax for Hermes compatibility.
- **Bundle size**: inversify v8 is ~33KB unpacked (re-exports from `@inversifyjs/core`, `@inversifyjs/container`, `@inversifyjs/common`). Minified + gzipped for mobile is estimated at ~8-12KB — negligible for a mobile app.

### Lambda Services

Lambda handlers use the container for adapter initialization, replacing the current module-scoped singleton pattern.

```typescript
// src/services/campaigns/src/handler.ts (updated)

import { Container } from 'inversify';
import { coreModule, createLambdaModule, TOKENS } from '@armoury/di';
import type { DatabaseAdapter } from '@armoury/data-dao';

let container: Container | null = null;

async function getContainer(): Promise<Container> {
    if (container) return container;

    const config = await getServiceConfig();
    container = new Container();
    container.load(
        coreModule,
        createLambdaModule({
            clusterEndpoint: config.dsqlClusterEndpoint,
            region: config.dsqlRegion,
        }),
    );

    // Initialize adapter eagerly on cold start
    const adapter = container.get<DatabaseAdapter>(TOKENS.DatabaseAdapter);
    await adapter.initialize();

    return container;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const c = await getContainer();
    const adapter = c.get<DatabaseAdapter>(TOKENS.DatabaseAdapter);
    const userContext = extractUserContext(event);

    return router(normalize(event), adapter, userContext);
};
```

**Lambda-specific concerns:**

- **Cold start**: Container creation is lightweight (~1ms). The `getServiceConfig()` SSM call and `adapter.initialize()` dominate cold start time — same as today.
- **Warm reuse**: Container is module-scoped singleton. The DSQL adapter binding is singleton-scoped, so `container.get()` returns the same instance across warm invocations — identical to the current `adapterInstance` pattern.
- **Request isolation**: Lambda services currently have no per-request state in the adapter (DSQL connections are pooled). No scoped container needed.

---

## Game System DAO Registration

The 40+ manual DAO instantiations in `createGameContext()` (lines 316–410 of `system.ts`) are the highest-value target for DI. Each game system becomes a self-contained `ContainerModule` — a plugin that registers all its DAOs, core rules, and game context when loaded into the container.

### Plugin Module Pattern

Each game system exports a `ContainerModule` that iterates over its DAO registry and binds each one. The container provides the shared dependencies (adapter, clients); the module provides the game-specific wiring.

```typescript
// src/systems/wh40k10e/src/di.module.ts

import { ContainerModule } from 'inversify';
import type { ContainerModuleLoadOptions } from 'inversify';
import type { DatabaseAdapter } from '@armoury/data-dao';
import type { IGitHubClient } from '@armoury/clients-github';
import type { IWahapediaClient } from '@armoury/clients-wahapedia';
import { TOKENS } from '@armoury/di';
import { AeldariDAO, DrukhariDAO /* ... all 37 faction DAOs */ } from '@/dao/factions/index.js';
import { CoreRulesDAO } from '@/dao/CoreRulesDAO.js';
import { CrusadeRulesDAO } from '@/dao/CrusadeRulesDAO.js';
import { ChapterApprovedDAO } from '@/dao/ChapterApprovedDAO.js';
import { ArmyDAO } from '@/dao/ArmyDAO.js';
import { CampaignDAOImpl as CampaignDAO } from '@armoury/data-dao';
import { GameData } from '@/dao/GameData.js';

// ── Faction DAO registry ────────────────────────────────────────
// Adding a new faction = one line here + its DAO class. No other wiring needed.

type FactionDAOConstructor = new (adapter: DatabaseAdapter, client: IGitHubClient) => unknown;

const FACTION_DAO_MAP: ReadonlyMap<string, FactionDAOConstructor> = new Map([
    ['aeldari', AeldariDAO],
    ['drukhari', DrukhariDAO],
    ['chaosSpaceMarines', ChaosSpaceMarinesDAO],
    ['chaosDaemons', ChaosDaemonsDAO],
    ['chaosKnights', ChaosKnightsDAO],
    ['deathGuard', DeathGuardDAO],
    ['emperorsChildren', EmperorsChildrenDAO],
    ['thousandSons', ThousandSonsDAO],
    ['worldEaters', WorldEatersDAO],
    // ... all remaining factions (37 total)
]);

// ── Tokens (scoped to this game system) ─────────────────────────

export const WH40K_TOKENS = {
    FactionDAO: Symbol.for('wh40k.FactionDAO'),
    CoreRulesDAO: Symbol.for('wh40k.CoreRulesDAO'),
    CrusadeRulesDAO: Symbol.for('wh40k.CrusadeRulesDAO'),
    ChapterApprovedDAO: Symbol.for('wh40k.ChapterApprovedDAO'),
    ArmyDAO: Symbol.for('wh40k.ArmyDAO'),
    CampaignDAO: Symbol.for('wh40k.CampaignDAO'),
    GameData: Symbol.for('wh40k.GameData'),
    GameContext: Symbol.for('wh40k.GameContext'),
} as const;

// ── Container module ────────────────────────────────────────────

export const wh40k10eModule = new ContainerModule((options: ContainerModuleLoadOptions): void => {
    // Faction DAOs — iterate the registry, bind each with a named constraint
    for (const [factionId, DAOClass] of FACTION_DAO_MAP) {
        options
            .bind(WH40K_TOKENS.FactionDAO)
            .toDynamicValue((ctx) => {
                const adapter = ctx.get<DatabaseAdapter>(TOKENS.DatabaseAdapter);
                const github = ctx.get<IGitHubClient>(TOKENS.GitHubClient);
                return new DAOClass(adapter, github);
            })
            .inSingletonScope()
            .whenNamed(factionId);
    }

    // Core rules DAOs — each has its own token
    options
        .bind(WH40K_TOKENS.CoreRulesDAO)
        .toDynamicValue((ctx) => {
            const adapter = ctx.get<DatabaseAdapter>(TOKENS.DatabaseAdapter);
            const github = ctx.get<IGitHubClient>(TOKENS.GitHubClient);
            return new CoreRulesDAO(adapter, github);
        })
        .inSingletonScope();

    options
        .bind(WH40K_TOKENS.CrusadeRulesDAO)
        .toDynamicValue((ctx) => {
            const adapter = ctx.get<DatabaseAdapter>(TOKENS.DatabaseAdapter);
            const github = ctx.get<IGitHubClient>(TOKENS.GitHubClient);
            return new CrusadeRulesDAO(adapter, github);
        })
        .inSingletonScope();

    // ChapterApprovedDAO uses WahapediaClient instead of GitHubClient
    options
        .bind(WH40K_TOKENS.ChapterApprovedDAO)
        .toDynamicValue((ctx) => {
            const adapter = ctx.get<DatabaseAdapter>(TOKENS.DatabaseAdapter);
            const wahapedia = ctx.get<IWahapediaClient>(TOKENS.WahapediaClient);
            return new ChapterApprovedDAO(adapter, wahapedia);
        })
        .inSingletonScope();

    // ArmyDAO and CampaignDAO — adapter only, no client
    options
        .bind(WH40K_TOKENS.ArmyDAO)
        .toDynamicValue((ctx) => new ArmyDAO(ctx.get<DatabaseAdapter>(TOKENS.DatabaseAdapter)))
        .inSingletonScope();

    options
        .bind(WH40K_TOKENS.CampaignDAO)
        .toDynamicValue((ctx) => new CampaignDAO(ctx.get<DatabaseAdapter>(TOKENS.DatabaseAdapter)))
        .inSingletonScope();

    // GameData — resolves all faction DAOs from the container
    options
        .bind(WH40K_TOKENS.GameData)
        .toDynamicValue((ctx) => {
            const daoEntries: Record<string, unknown> = {};
            for (const [factionId] of FACTION_DAO_MAP) {
                daoEntries[`${factionId}DAO`] = ctx.getNamed(WH40K_TOKENS.FactionDAO, factionId);
            }
            return new GameData({
                ...daoEntries,
                coreRulesDAO: ctx.get(WH40K_TOKENS.CoreRulesDAO),
                crusadeRulesDAO: ctx.get(WH40K_TOKENS.CrusadeRulesDAO),
                chapterApprovedDAO: ctx.get(WH40K_TOKENS.ChapterApprovedDAO),
            });
        })
        .inSingletonScope();

    // GameContext — the full result object that platform providers consume
    options
        .bind(WH40K_TOKENS.GameContext)
        .toDynamicValue((ctx) => ({
            armies: ctx.get(WH40K_TOKENS.ArmyDAO),
            campaigns: ctx.get(WH40K_TOKENS.CampaignDAO),
            game: ctx.get(WH40K_TOKENS.GameData),
            sync: () => ctx.get<GameData>(WH40K_TOKENS.GameData).sync(),
        }))
        .inSingletonScope();
});
```

### Loading a Game System Plugin

Platform composition roots load game system modules dynamically. The container already has adapter and client bindings from the platform module; the game system module resolves them transparently.

```typescript
// In DataContextProvider (web or mobile)
import { wh40k10eModule, WH40K_TOKENS } from '@armoury/systems-wh40k10e/di.module';

// Load the game system plugin into the container
container.load(wh40k10eModule);

// Resolve the full game context — all 40+ DAOs created automatically
const gameContext = container.get(WH40K_TOKENS.GameContext);
// gameContext.armies, gameContext.campaigns, gameContext.game, gameContext.sync()
```

### Why Plugin Modules Over Factory Pattern

| Concern                    | Factory (Option B)                                        | Plugin Module (Option 3)                                                                 |
| -------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Individual DAO mocking** | ✗ Must mock adapter/client globally                       | ✓ `container.rebind(WH40K_TOKENS.FactionDAO).whenNamed('aeldari').toConstantValue(mock)` |
| **Adding a new faction**   | Edit 90-line `createGameContext()` + GameData constructor | Add one line to `FACTION_DAO_MAP`                                                        |
| **Multi-system support**   | Each system manages its own factory independently         | `container.load(system1Module, system2Module)` — composable                              |
| **Test isolation**         | Mock at adapter/client level                              | Mock at any granularity: individual DAO, all DAOs, or adapter/client                     |
| **Container visibility**   | DAOs invisible to DI — opaque factory                     | Every DAO is a first-class container binding — introspectable, rebindable                |
| **GameSystem interface**   | Unchanged                                                 | Optional `getContainerModule()` method for plugin discovery                              |

### Test Overrides for Game System DAOs

```typescript
// Override a single faction DAO for testing
const container = createTestContainer();
container.load(wh40k10eModule);

// Surgical override: replace only the AeldariDAO
container.rebind(WH40K_TOKENS.FactionDAO).whenNamed('aeldari').toConstantValue(new MockAeldariDAO());

// Everything else resolves normally
const gameContext = container.get(WH40K_TOKENS.GameContext);
```

### GameSystem Interface Extension

The `GameSystem` interface (`@armoury/data-dao`) gains an optional `getContainerModule()` method for plugin discovery. This allows composition roots to load game system DI modules without importing system-specific packages directly.

```typescript
// In @armoury/data-dao types.ts
export interface GameSystem {
    readonly id: string;
    readonly name: string;
    readonly version: string;
    readonly dataSource: DataSourceConfig;
    entityKinds: EntityKindDefinition[];
    validationRules: PluginValidationRule[];
    getHydrators(): Map<string, EntityHydrator>;
    getSchemaExtension(): SchemaExtension;
    register(): void | Promise<void>;
    createGameContext(adapter: DatabaseAdapter, clients: Map<string, unknown>): GameContextResult;

    /**
     * Returns the inversify ContainerModule for this game system.
     * When present, composition roots load this module instead of
     * calling createGameContext() directly.
     */
    getContainerModule?(): ContainerModule;
}
```

This keeps `getContainerModule()` optional — existing game systems without DI still work via `createGameContext()`. Composition roots check for the method:

```typescript
// In platform composition root
const system = getActiveGameSystem(); // e.g., wh40k10eSystem

const systemModule = system.getContainerModule?.();
if (systemModule) {
    container.load(systemModule);
    const gameContext = container.get(WH40K_TOKENS.GameContext);
} else {
    // Fallback: legacy path via createGameContext()
    const adapter = container.get<DatabaseAdapter>(TOKENS.DatabaseAdapter);
    const gameContext = system.createGameContext(adapter, clientsMap);
}
```

---

## Testing & E2E Overrides

### Unit Tests

```typescript
import { Container } from 'inversify';
import { coreModule, createTestModule, TOKENS } from '@armoury/di';

function createTestContainer(overrides?: Parameters<typeof createTestModule>[0]) {
    const container = new Container();
    container.load(coreModule, createTestModule(overrides));
    return container;
}

// Example: test with in-memory adapter
const container = createTestContainer();
const createAdapter = container.get(TOKENS.AdapterFactory);
const adapter = await createAdapter();
// adapter is PGliteAdapter({ dataDir: 'memory://' })
```

### E2E Tests

```typescript
// Override the adapter factory for e2e
const container = createTestContainer({
    adapterFactory: async () => {
        const { PGliteAdapter } = await import('@armoury/adapters-pglite');
        return new PGliteAdapter({
            dataDir: 'idb://armoury-e2e',
            // Additional e2e-specific config (HAR fixtures, etc.)
        });
    },
});
```

### Rebind Pattern (Surgical Overrides)

```typescript
// Start with production bindings, then override specific tokens
const container = new Container();
container.load(coreModule, webModule);

// Override just the adapter for this test scenario
container.rebind(TOKENS.AdapterFactory).toFactory(() => {
    return async () => new MockAdapter();
});
```

---

## Where DI Adds Value vs Overhead

### High Value (Implement First)

| Area                             | Current Pain                             | DI Solution                                                      |
| -------------------------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| **Adapter selection**            | Hardcoded per-platform, no test seam     | Factory token resolved from container, swappable per environment |
| **Client creation**              | Duplicated in web + mobile providers     | Single factory registration, shared across platforms             |
| **E2E test configuration**       | No way to inject test adapters           | `rebind()` or test module with overrides                         |
| **Preview/staging environments** | Requires code changes to switch adapters | Environment-specific module loaded at startup                    |

### Low Value (Do Not Implement)

| Area                          | Why Not                                                                                                                      |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **React component injection** | Components should use React context (DataContext), not inversify. Mixing DI frameworks in the component tree adds confusion. |
| **Lambda request scoping**    | No per-request state exists in Lambda handlers. The singleton adapter pattern is correct.                                    |
| **Utility functions**         | Pure functions (parsers, validators, formatters) don't benefit from DI. They have no dependencies to swap.                   |

### Marginal Value (Evaluate Later)

| Area                         | Consideration                                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| **Configuration management** | Could centralize env var / SSM config resolution in container. Worth it if config sources multiply. |

---

## Migration Strategy

### Phase 1: Package Setup (Low Risk)

1. Create `@armoury/di` package in `src/shared/di/`.
2. Add `"experimentalDecorators": true` to `tsconfig.base.json` (already present in `infra/cdk/tsconfig.json`).
3. Define tokens, types, and container factory.
4. Write core, web, mobile, lambda, and test modules.
5. Add `@injectable()` / `@inject()` decorators to adapter and service class definitions.
6. Add inversify v8 as a dependency (no `reflect-metadata` peer dep needed — v8 internalizes it).
7. **Validate Metro ESM compatibility** — create a minimal Expo 53 test app that imports inversify v8 and runs on iOS/Android simulators. This is the go/no-go gate for mobile.
8. Unit test each module in isolation.

**No existing code changes. Purely additive.**

### Phase 2: Web Provider Migration (Medium Risk)

1. Update `src/web/src/providers/DataContextProvider.tsx` to create container and load `coreModule + webModule`.
2. Replace hardcoded adapter/client construction with container resolution.
3. Preserve `DataContextBuilder` pipeline — container feeds the builder, doesn't replace it.
4. E2E tests validate no behavior change.

### Phase 3: Mobile Provider Migration (Medium Risk)

1. Same as Phase 2 for `src/mobile/src/providers/DataContextProvider.tsx`.
2. Load `coreModule + mobileModule`.
3. Validate on iOS and Android simulators.

### Phase 4: Lambda Handler Migration (Low Risk)

1. Update Lambda handlers to use `createLambdaModule()` with SSM config.
2. One handler at a time (campaigns → friends → users → matches).
3. Deploy and validate in dev environment.

### Phase 5: E2E Test Infrastructure (High Value)

1. Create test container setup that loads `coreModule + testModule`.
2. Wire into Playwright/E2E test harness.
3. Enable adapter swapping for HAR-based fixture tests.

### Estimated Effort

| Phase     | Files Changed | New Files | Effort       |
| --------- | ------------- | --------- | ------------ |
| Phase 1   | 0             | ~8        | 1-2 days     |
| Phase 2   | 1             | 0         | 0.5 day      |
| Phase 3   | 1             | 0         | 0.5 day      |
| Phase 4   | 4             | 0         | 1 day        |
| Phase 5   | 2-3           | 1-2       | 1 day        |
| **Total** | **8-9**       | **~10**   | **4-5 days** |

---

## Risks & Mitigations

| Risk                                          | Likelihood | Impact | Mitigation                                                                                                                                                                                     |
| --------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Metro bundler can't resolve inversify v8 ESM  | Medium     | High   | Validate in Phase 1 with minimal Expo 53 test app. Fallback: use v7 for mobile only (dual CJS/ESM). Configure Metro `resolver.resolveRequest` as intermediate fix.                             |
| `sideEffects: true` prevents tree-shaking     | Low        | Low    | inversify is small (~33KB unpacked). The `sideEffects: true` flag is correct behavior — metadata init is a real side effect. Bundle impact is negligible.                                      |
| `experimentalDecorators` tsconfig requirement | Low        | Low    | Add `"experimentalDecorators": true` to `tsconfig.base.json`. esbuild v0.21+ natively transpiles this syntax. Already present in `infra/cdk/tsconfig.json` — extend to shared base.            |
| Container initialization slows cold start     | Very Low   | Low    | Container creation is ~1ms. Module loading is the bottleneck, which exists with or without DI.                                                                                                 |
| Team unfamiliarity with inversify             | Medium     | Medium | `@injectable()` and `@inject()` decorators are idiomatic TypeScript — familiar to any developer who has used Angular, NestJS, or similar frameworks. Document patterns in CODING_STANDARDS.md. |
| Container snapshot/restore not ported to v8   | Low        | Low    | Only relevant for per-request isolation in Lambda, which we don't need (singleton adapter, no request-scoped state). If needed later, use `Container.createChild()` as alternative.            |

---

## Decision Log

| Decision          | Choice                                               | Rationale                                                                                                                                                                                                                                                   |
| ----------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DI container      | inversify                                            | Only actively maintained TypeScript DI container. tsyringe unmaintained since 2023.                                                                                                                                                                         |
| Version           | v8.1                                                 | Actively maintained (~1,500 commits/6mo), ESM-only (matches monorepo), no `emitDecoratorMetadata` needed, internalizes `reflect-metadata`. Metro ESM compatibility validated in Phase 1.                                                                    |
| API style         | Decorator syntax (`@injectable()`, `@inject(TOKEN)`) | inversify v8 dropped `emitDecoratorMetadata` requirement. esbuild v0.21+ natively transpiles `experimentalDecorators`. Idiomatic TypeScript, familiar from Angular/NestJS. Requires `"experimentalDecorators": true` in `tsconfig.base.json`.               |
| Container scope   | Composition roots only                               | Container is an implementation detail of providers/handlers. Components use React context.                                                                                                                                                                  |
| DAO registration  | Plugin modules (Option 3)                            | Each game system exports a `ContainerModule` that registers all its DAOs via a `FACTION_DAO_MAP` iteration pattern. Every DAO is a first-class container binding — individually mockable, rebindable, and introspectable. Adding a faction = one map entry. |
| React integration | Custom context bridge (not `inversify-react`)        | `inversify-react` doesn't support v8 and is CJS-only. The bridge is 10 lines of code.                                                                                                                                                                       |
| Mobile support    | Yes, same architecture                               | Same container pattern with mobile-specific module. Metro ESM support validated in Phase 1.                                                                                                                                                                 |
| Lambda support    | Yes, singleton container                             | Replaces module-scoped adapter singleton with container-managed singleton. Same lifecycle.                                                                                                                                                                  |
