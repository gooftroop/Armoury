# Agent Reference — Categories, Operations & Project Structure

Reference material for LLM agents working on this monorepo. This document is loaded on-demand via progressive disclosure from `AGENTS.md` — not on every request.

**When to read**: When you need model selection guidance, operational best practices, project structure details, or the anti-patterns list. You do NOT need this for phase workflow, approval signals, or delegation principles — those are in `AGENTS.md`.

---

## Model Selection Heuristics

Category selection directly controls which model runs the task. Choose the cheapest category that can handle the work:

| Category             | Default Model          | Cost     | Use When                                          |
| -------------------- | ---------------------- | -------- | ------------------------------------------------- |
| `quick`              | Claude Haiku 4.5       | Lowest   | Single file edits, typo fixes, simple writes      |
| `writing`            | Kimi K2P5              | Low      | Documentation, prose, markdown files              |
| `unspecified-low`    | Claude Sonnet 4.6      | Mid      | Moderate tasks that don't fit other categories    |
| `visual-engineering` | Gemini 3.1 Pro         | Mid-High | Frontend, UI/UX, styling                          |
| `artistry`           | Gemini 3.1 Pro         | Mid-High | Creative, unconventional problem-solving          |
| `deep`               | GPT-5.3 Codex          | High     | Autonomous problem-solving, hairy bugs            |
| `ultrabrain`         | GPT-5.3 Codex (xhigh)  | Highest  | Genuinely hard logic, complex architecture        |
| `unspecified-high`   | GPT-5.4 (high)         | Highest  | High-effort tasks that don't fit other categories |

### Agent Subagent Tiers

| Agent       | Default Model                        | Cost    |
| ----------- | ------------------------------------ | ------- |
| `explore`   | Grok Code Fast 1 / Haiku 4.5        | Lowest  |
| `librarian` | Gemini 3 Flash                       | Low     |
| `oracle`    | GPT-5.4 / Gemini 3.1 Pro / Opus 4.6 | Highest |
| `metis`     | Opus 4.6 / GPT-5.4                  | Highest |
| `momus`     | GPT-5.4 / Opus 4.6                  | Highest |

### Decision Tree

1. Can Haiku handle it? (simple, explicit instructions, single concern) → `quick`
2. Is it documentation or prose? → `writing`
3. Is it moderate, non-specialized work? → `unspecified-low`
4. Is it frontend/UI? → `visual-engineering`
5. Does it require deep autonomous reasoning? → `deep`
6. Is it genuinely hard, logic-heavy? → `ultrabrain`
7. Still unsure + high effort? → `unspecified-high`

### Rules

- Default to the cheapest viable category. Escalate only when quality demands it.
- `explore` and `librarian` are cheap per-spawn but compound quickly. Prefer direct tools for deterministic lookups; reserve agent spawns for multi-step reasoning.
- `oracle`, `metis`, `momus` are expensive. Use only when their specialized reasoning is required.
- When delegating to `quick`, prompts MUST be exhaustively explicit (Haiku has limited reasoning).

---

## Operational Guidelines

### File Reading Strategy

Match your reading depth to your current task phase:

- **Planning/Exploration**: Use `documentSymbol` LSP for file outlines, `goToDefinition` for symbol navigation, and `grep` for locating content. Read only the sections you need with `offset`/`limit`.
- **Implementation**: Read what you need to write correct code — including full files when you're modifying them or need to match surrounding patterns.
- **General rule**: Never read a file you don't intend to use. The waste is reading irrelevant files, not reading relevant ones thoroughly.

### Symbol Navigation

Prefer LSP tools over grep for navigating code:

- `lsp_goto_definition` — jump to where a symbol is defined (zero false positives, one round-trip)
- `lsp_find_references` — find all usages of a symbol across the workspace
- `lsp_symbols` (documentSymbol) — get a file's outline without reading the full content
- Fall back to `grep` only for: text in comments/strings, cross-file pattern discovery, or when LSP is unavailable

### Parallel Operations

Parallelize independent tool calls — never issue sequential reads for independent files:

- When reading 2+ independent files, issue all reads in a single message turn
- Batch independent grep searches, LSP lookups, and file reads together
- Fire `explore`/`librarian` agents in background — never block on them
- Cancel background agents you no longer need (individually by task ID, never cancel-all)
- Prefer parallel direct tool calls over parallel agent spawns when they produce equivalent results. Five parallel grep calls in one turn cost zero extra requests; five parallel explore agents cost 15-25+ requests.

### General Rules

- Use `grep` to find _where_ something is. Read to understand _how_ it works.
- Never re-read a file you just wrote or edited in the same turn.
- When delegating to subagents, include all relevant context in the prompt.
- Keep your current todo list updated — it is rehydrated after compaction.
- **Lazy-load documents**: Do not read `docs/CODING_STANDARDS.md` or other detailed docs until entering the phase that needs them. See Document Loading Strategy in `AGENTS.md`.
- Prefer direct tools for deterministic lookups (file finding, pattern matching, single-doc queries). Reserve agent spawns for tasks requiring multi-step reasoning or model quality that exceeds your own capability.
- **Load `git-worktree-agent-workflow` skill before any implementation intent is carried out.** If you are about to write, edit, or create any source file, the worktree skill must already be loaded. No exceptions unless the human explicitly says "skip worktree" or "work on main".

---

## Anti-Patterns (NEVER DO)

- Implementing before the human approves your plan (at Medium/High risk — trivial/low risk tasks may proceed immediately).
- Expanding scope beyond what was requested.
- Reading files you don't intend to use, or re-reading files already in context.
- Echoing back large blocks of code the human can already see.
- Iterating on a broken fix more than twice without stopping to reassess.
- Creating long-lived feature branches instead of small incremental PRs.
- Doing refactoring, cleanup, or "improvements" that weren't requested.
- Continuing work after the human provides feedback that redirects the approach.
- Retrying a failed delegation with the same scope/parameters more than once without changing strategy.
- Giving subagents large, multi-concern tasks when smaller focused tasks would suffice.
- Letting a file grow past ~300 lines without proposing decomposition.
- Spawning explore/librarian agents for lookups that grep, glob, LSP, or codesearch can handle directly.
- Spawning 5+ agents in parallel when 1-2 targeted agents plus direct tools would produce equivalent results.
- Starting implementation without user confirmation (at Medium/High risk) — misunderstood requirements waste all downstream requests.
- Re-asking for confirmation on routine operations (builds, tests, linting) that are part of an already-approved plan.

---

## Monorepo Quick Reference

```
src/
├── shared/          → @armoury/shared (core library, data layer, plugins)
│   ├── data/        → Adapters, DAOs, DataContext, schema, codecs
│   ├── models/      → Core models (Account, Friend)
│   ├── providers/   → External data providers (bsdata/)
│   ├── clients/     → API clients (github/, wahapedia/)
│   ├── types/       → Core types, enums, errors, interfaces
│   ├── validation/  → Game-agnostic validation engine
│   ├── frontend/    → Pure TypeScript shared frontend modules (NO React)
│   ├── streams/     → @armoury/streams (RxJS reactive facades over WebSocket clients)
│   └── e2e/         → Integration tests
├── systems/         → @armoury/systems (game system plugins)
│   └── src/
│       └── wh40k10e/  → Warhammer 40K 10th Edition plugin
│           ├── public/  → Downloadable content (localization, styling, config)
│           ├── dao/     → Game-specific DAOs
│           ├── models/  → Game-specific models
│           ├── types/   → Game-specific types
│           └── validation/ → Game-specific validation rules
├── web/             → @armoury/web (Next.js 15, Tailwind v4, Radix UI)
├── mobile/          → @armoury/mobile (Expo 53, React Native, Tamagui)
├── services/
│   ├── authorizer/  → @armoury/authorizer (Lambda)
│   └── campaigns/   → @armoury/campaigns (Lambda)
└── tooling/
    ├── eslint/      → @armoury/eslint
    ├── esbuild/     → @armoury/esbuild
    ├── typescript/  → @armoury/typescript
    ├── vitest/      → @armoury/vitest
    └── prettier/    → @armoury/prettier
```

## Path Aliases

Each workspace defines path aliases in its `tsconfig.json`. Vitest configs mirror these in `resolve.alias`. Use the workspace-specific alias for within-workspace imports.

| Alias                  | Resolves To                           | Available In                                       |
| ---------------------- | ------------------------------------- | -------------------------------------------------- |
| `@data/*`              | `src/shared/data/src/*`               | `@armoury/data`                                    |
| `@models/*`            | `src/shared/models/src/*`             | `@armoury/models`, `@armoury/data`, `@armoury/wh40k10e` |
| `@wh40k10e/*`          | `src/systems/wh40k10e/src/*`          | `@armoury/systems`, `@armoury/data` (tests only)   |
| `@web/*`               | `src/web/*`                           | `@armoury/web`                                     |
| `@mobile/*`            | `src/mobile/*`                        | `@armoury/mobile`                                  |
| `@campaigns/*`         | `src/services/campaigns/*`            | `@armoury/campaigns`                               |
| `@streams/*`           | `src/shared/streams/*`                | `@armoury/streams`                                 |
| `@validation/*`        | `src/shared/validation/src/*`         | `@armoury/validation`, `@armoury/wh40k10e`         |
| `@/*`                  | `src/shared/providers/bsdata/src/*`   | `@armoury/providers-bsdata`, `@armoury/wh40k10e`   |
| `@clients-github/*`    | `src/shared/clients/github/src/*`     | `@armoury/clients-github`, `@armoury/data`         |
| `@clients-wahapedia/*` | `src/shared/clients/wahapedia/src/*`  | `@armoury/clients-wahapedia`                       |

**Note:** `src/shared/` is NOT a workspace — it is an organizational directory containing multiple workspaces (`@armoury/data`, `@armoury/models`, etc.). There is no `@shared/*` alias. Never use `@shared/` in imports.

Always use `.js` extensions on all imports — both aliased and relative. Never use `.ts` or `.tsx` extensions in import specifiers. See `docs/CODING_STANDARDS.md` for full import rules.

## File Organization

- Source files: `src/<workspace>/`
- Tests: `__tests__/` folders colocated with source (`*.test.ts`)
- Integration tests: `__integration__/` folders (`*.integration.test.ts`), separate vitest config
- End-to-end tests: `e2e/` directory (`*.e2e.test.ts`)
- Mocks: `__mocks__/` folders colocated with source
- Fixtures: `__fixtures__/` folders colocated with tests
- Static assets: `public/` at repo root

## Commands

Root scripts delegate to `turbo run`:

```bash
npm run build        # Build all packages
npm run test         # Run all tests
npm run lint         # Lint all packages
npm run typecheck    # Type check all packages
npm run format       # Format all files
npm run format:check # Check formatting without writing
```

**Workspace-scoped** (prefer when changes affect 1-2 packages):

```bash
npm run test -w @armoury/data                    # npm workspace flag
turbo run typecheck --filter=@armoury/web        # turbo filter
```

## Workspace Dependency Graph

Runtime dependencies (excluding shared tooling). Use this to assess **blast radius** of changes.

```
@armoury/data              → @armoury/models, @armoury/clients-github
@armoury/validation        → @armoury/providers-bsdata
@armoury/streams           → @armoury/clients-friends, @armoury/clients-matches

@armoury/wh40k10e          → @armoury/data, @armoury/models, @armoury/clients-github,
                              @armoury/clients-wahapedia, @armoury/providers-bsdata, @armoury/validation

@armoury/web               → @armoury/data, @armoury/models, @armoury/wh40k10e
@armoury/mobile            → @armoury/data, @armoury/models, @armoury/wh40k10e
@armoury/campaigns         → @armoury/data, @armoury/models
```

**High blast-radius**: `@armoury/models`, `@armoury/data`, `@armoury/clients-github`
**Leaf nodes** (no runtime deps): all `tooling/*`, `@armoury/models`, all `clients-*`, `providers-bsdata`, `@armoury/authorizer`
