# Armoury

A TypeScript monorepo for managing tabletop game army data using community data files. Provides cross-platform data management (web, mobile, server) with adapters for different storage backends and a plugin architecture for game system support.

> **Disclaimer:** This is an unofficial, fan-made tool. It is not affiliated with or endorsed by any game publisher. All game-specific trademarks are property of their respective owners. Game data is provided by community sources and is not included in this application.

## Prerequisites

- **Node.js** `>=24.0.0` (see `.nvmrc`)
- **npm** (ships with Node)

## Getting Started

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run all tests
npm run test

# Lint all packages
npm run lint

# Type check all packages
npm run typecheck

# Format all files
npm run format
```

## Monorepo Structure

| Workspace                 | Package                                               | Description                                                 |
| ------------------------- | ----------------------------------------------------- | ----------------------------------------------------------- |
| `src/shared`              | `@armoury/shared`                                     | Core business logic, data layer, GitHub client, XML parsing |
| `src/systems`             | `@armoury/systems`                                    | Game system plugins (wh40k10e)                              |
| `src/web`                 | `@armoury/web`                                        | Next.js 15 SSR + RSC web app                                |
| `src/mobile`              | `@armoury/mobile`                                     | Expo/React Native mobile app                                |
| `src/services/authorizer` | `@armoury/authorizer`                                 | Lambda authorizer                                           |
| `src/services/campaigns`  | `@armoury/campaigns`                                  | Lambda campaigns service                                    |
| `src/tooling/*`           | `@armoury/eslint`, `typescript`, `vitest`, `prettier` | Shared tooling configs                                      |

Root scripts delegate to [Turborepo](https://turbo.build/repo), which runs the matching script in each workspace.

## Documentation

- [AGENTS.md](AGENTS.md) — Agent context and architecture reference
- [docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md) — Coding standards and conventions
