# Armoury - Agent Instructions

Behavioral rules for LLM agents on this monorepo. For coding conventions, see `docs/CODING_STANDARDS.md`.

## Documentation Map

| Document                      | Contains                                                    | When to Read                                                  |
| ----------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| `docs/CODING_STANDARDS.md`    | Code style, naming, exports, types, testing, error handling | **Phase 3 only** — before writing or modifying code           |
| `docs/shared/REQUIREMENTS.md` | Data architecture and data flow requirements                | When working on `@armoury/data` or `@armoury/models`          |
| `docs/tooling.md`             | Shared configs, workspace scripts, adding workspaces        | When modifying tooling configs or adding workspaces           |
| `docs/services/`              | Lambda service documentation                                | When working on `@armoury/authorizer` or `@armoury/campaigns` |

### Document Loading Strategy

**Do NOT read documentation files upfront.** Read them lazily, only when entering the relevant phase or scope:

- **Discovery/Planning** (Phase 1-2): Use this file (AGENTS.md) and `grep` only. Do not read CODING_STANDARDS.md or other docs.
- **Implementation** (Phase 3): Load `git-worktree-agent-workflow` skill **before any code changes**. Read `docs/CODING_STANDARDS.md` before writing code. Read workspace-specific docs only for the workspace you're modifying.
- **Integration** (Phase 4): Load `mastering-github-cli` skill. Do not re-read coding standards.
- **Never read a doc "just in case"** — grep for the specific section you need if unsure.

## Project Overview

TypeScript monorepo for managing tabletop game army data using community data files. Cross-platform (web, mobile, server) with adapters for different storage backends and a plugin architecture for game system support.

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

Each workspace defines path aliases in its `tsconfig.json`. Vitest configs mirror these in `resolve.alias`.

| Alias          | Resolves To                  | Available In                                       |
| -------------- | ---------------------------- | -------------------------------------------------- |
| `@shared/*`    | `src/shared/*`               | All workspaces                                     |
| `@streams/*`   | `src/shared/streams/*`       | `@armoury/streams`                                 |
| `@wh40k10e/*`  | `src/systems/src/wh40k10e/*` | `@armoury/systems`, `@armoury/shared` (tests only) |
| `@web/*`       | `src/web/*`                  | `@armoury/web`                                     |
| `@mobile/*`    | `src/mobile/*`               | `@armoury/mobile`                                  |
| `@campaigns/*` | `src/services/campaigns/*`   | `@armoury/campaigns`                               |

Always use `.ts` extensions for relative imports and `.js` extensions for aliased (non-relative) imports. TypeScript cannot rewrite non-relative import extensions in declaration output (TS2877), so aliased imports must use `.js`. See `docs/CODING_STANDARDS.md` for import rules.

## File Organization

- Source files: `src/<workspace>/`
- Tests: `__tests__/` folders colocated with source (`*.test.ts`)
- Integration tests: `__integration__/` folders (`*.integration.test.ts`), separate vitest config
- End-to-end tests: `e2e/` directory (`*.e2e.test.ts`)
- Mocks: `__mocks__/` folders colocated with source
- Fixtures: `__fixtures__/` folders colocated with tests
- Static assets: `public/` at repo root

## Runtime & Tooling

- **Node**: `>=24.0.0` (see `.nvmrc`) | **Package manager**: npm (workspaces) | **Module**: ESM
- **Build**: Turborepo → esbuild for JS, `tsc --emitDeclarationOnly` for types
- **TypeScript**: Strict mode, `ES2022` target, `NodeNext` module resolution (`Bundler` for web/mobile)

For tooling configuration details (Vitest, TypeScript, ESLint, Prettier), workspace script conventions, and adding new workspaces, see `docs/tooling.md`.

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

## Skills Reference

Available skills in `.opencode/skills/`. Load via the `skill` tool only when needed — do not read SKILL.md files upfront.

**Git & CI**: `git-worktree-agent-workflow` (**before any code changes — Phase 3+**), `mastering-github-cli` (Phase 4), `gh-fix-ci`, `gh-address-comments`, `code-reviewer`
**Frontend**: `accessibility`, `core-web-vitals`, `perf-web-optimization`, `seo`, `figma`, `figma-implement-design`
**Security**: `security-best-practices`, `security-threat-model`
**Docs & Design**: `docs-writer`, `technical-design-doc-creator`
**Infrastructure**: `aws-advisor`, `sentry`
**Quality**: `best-practices`

## Coding & Testing Conventions

**Read `docs/CODING_STANDARDS.md` before writing or modifying code.** It covers: code style, naming, exports, types, imports, file extensions, error handling, database schema, and testing patterns.

Key rules that apply at all phases (not just implementation):

- Every source file must have a `@requirements` block at the top (after imports).
- Follow TDD: requirements → test plan → tests → implementation → refactor.
- Every test file must have a test plan at the top mapping requirements to test cases.
- Comment **why**, not **what**. JSDoc on public APIs only.
- Tests should be meaningful — do not add tests purely for coverage.

## Phase-Based Workflow (MANDATORY)

Every task follows phases. Complete each phase and get explicit human approval before advancing. Never skip phases. Never auto-advance.

### Phase 1 — Discovery

Understand the problem before proposing solutions. Read relevant code, identify root cause or affected areas, list unknowns and risks.

**Gate**: Present findings → wait for human approval.

### Phase 2 — Plan

Break work into the smallest possible incremental changes. Identify blocking vs. parallelizable work. Each increment should be a single, independently mergeable PR. Include a test plan.

**Gate**: Present plan → wait for human approval.

### Phase 3 — Implementation (per increment)

**⚠️ MANDATORY: Load `git-worktree-agent-workflow` skill BEFORE writing any code.** All code changes MUST happen inside a git worktree — no exceptions unless the human explicitly says "skip worktree" or "work on main".

Implement one increment at a time. Run linting, type checks, and tests on affected packages. Summarize what changed and what was verified.

**Gate**: After each increment → wait for human feedback.

### Phase 4 — Integration

Commit, push, create PR. Load `mastering-github-cli` skill. Worktree skill should already be loaded from Phase 3.

**Gate**: Present PR for review before starting the next increment.

### Phase Gate Approval Signals

The phase gates above require human approval to advance. Recognize these approval patterns:

- **Explicit approval**: "Approved", "LGTM", "Go ahead", "Proceed"
- **Forward intent**: "Continue", "Continue if you have next steps", "Keep going", "What's next?"
- **Conditional approval**: "Proceed with [option]", "Do [X] first, then [Y]"

If the human expresses forward intent and there are pending tasks in your todo list, **continue working**. Do not re-ask for permission that was already granted. Silence after a gate presentation (no response at all) is the only case where you should wait — an explicit message with forward language is approval.

### TODO Continuation

The system may inject a `TODO CONTINUATION` directive when you have incomplete tasks. This is a **legitimate signal to resume work**, not noise to ignore. When you receive it:

1. Check your todo list for the next pending task.
2. If the human's last message expressed approval or forward intent, continue immediately.
3. If the human's last message redirected the approach, follow the redirect instead.
4. If there was no human message (pure system directive after inactivity), continue with the next pending task.

**Never stall on a TODO continuation when prior approval was given.** The purpose of phase gates is to get human input at decision points — once input is received, execute until the next gate or until all tasks are complete.

## Agile Delivery

- **Commit small, commit fast.** Each PR is one focused, reviewable change.
- **Blocking work first.** Do prerequisite work before parallel work.
- **One concern per PR.** Do not bundle refactoring with bug fixes or features.

## Human Collaboration Protocol

You are a partner, not an autonomous executor. The human drives decisions.

- **Never auto-advance between phases.** Always present results and wait.
- **Never assume approval.** Silence is not consent. Ask explicitly.
- **Never expand scope.** If you discover additional work, report it — don't do it.
- **Present options, not decisions.** When tradeoffs exist, lay them out. Let the human choose.
- **Ask before large operations.** Before running builds, installs, or multi-file changes — confirm.

### When You Are Stuck

If you have attempted a fix twice without success:

1. Stop making changes.
2. Revert to the last known working state.
3. Present what you tried, what failed, and why.
4. Ask for guidance.

## Resource Efficiency

### Quality-Cost Optimization (QCO)

Agent spawns consume requests proportional to their complexity (spawn + internal reasoning + result collection). Direct tool calls within a single turn are free. The goal is not minimum requests — it is maximum ROI: quality × success rate / requests consumed.

**Direct Tools vs Agent Spawns:**

| Need                                 | Direct Tool (0 extra requests)      | Agent Spawn (3-20+ requests) |
| ------------------------------------ | ----------------------------------- | ---------------------------- |
| Find a file by name                  | `glob`                              | ~~explore~~                  |
| Find a pattern in code               | `grep`, `ast_grep_search`           | ~~explore~~                  |
| Navigate to a definition             | `lsp_goto_definition`               | ~~explore~~                  |
| Get a file outline                   | `lsp_symbols` (documentSymbol)      | ~~explore~~                  |
| Look up one library's API            | `codesearch`, `context7_query-docs` | ~~librarian~~                |
| Fetch a specific URL/doc             | `webfetch`                          | ~~librarian~~                |
| Multi-file reasoning across modules  | Direct tools may miss connections   | `explore` ✓                  |
| Synthesize multiple external sources | Direct tools return raw data        | `librarian` ✓                |
| Architectural trade-off analysis     | Beyond direct tool capability       | `oracle` ✓                   |
| Complex planning with unknowns       | Needs interview-style reasoning     | `plan` agent ✓               |

**Rule**: Use direct tools for deterministic lookups. Use agents when their model's reasoning adds measurable quality over what direct tools provide.

**Agent Spawn Decision Matrix:**

|                       | Low Complexity                   | High Complexity                                       |
| --------------------- | -------------------------------- | ----------------------------------------------------- |
| **Familiar Domain**   | Self + direct tools (0 requests) | Self + oracle review (~10 requests)                   |
| **Unfamiliar Domain** | Librarian + self (~5 requests)   | Librarian + plan agent + specialist (~20-30 requests) |

**Planning Scale — Always plan, scale the method:**

| Complexity                              | Method                                  | Request Cost |
| --------------------------------------- | --------------------------------------- | ------------ |
| Trivial (1-2 steps, obvious)            | Direct todos                            | 0            |
| Simple (3-5 steps, clear scope)         | Direct tool exploration → todos         | 0            |
| Medium (5+ steps, some unknowns)        | Exploration → todos → user confirmation | 0            |
| Complex (many unknowns, cross-cutting)  | Plan agent (superior model reasoning)   | 5-10         |
| Very complex (architectural, ambiguous) | Metis → plan agent → momus review       | 15-25        |

### File Reading Strategy

Match your reading depth to your current task phase:

- **Planning/Exploration**: Use `documentSymbol` LSP for file outlines, `goToDefinition` for symbol navigation, and `grep` for locating content. Read only the sections you need with `offset`/`limit`.
- **Implementation**: Read what you need to write correct code — including full files when you're modifying them or need to match surrounding patterns. Don't artificially restrict yourself.
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

### Delegation Scope & Retry Discipline

You are accountable for the tokens you and your subagents consume. Prefer more, smaller delegations over fewer, larger ones — it is better to delegate 4 focused tasks of 10 items each than 2 broad tasks of 20 items each. Smaller scopes are cheaper to retry if they fail and reduce the blast radius of a timeout or bad output. Use cheaper agent categories (e.g., `quick`, `writing`) liberally as long as quality is not sacrificed.

When a delegated task fails, times out, or produces incomplete results, do not blindly retry with the same parameters. Stop and evaluate:

- **Why** did it fail? (scope too large, output too long, ambiguous instructions)
- **What** can be reduced? (split into smaller chunks, narrow the scope, simplify the deliverable)
- **Propose** the adjusted approach to the human before retrying.

One retry with the same parameters is acceptable. A second failure on the same task requires a different strategy — do not attempt a third time without changing the approach.

### Model Selection Heuristics

Category selection directly controls which model runs the task. Choose the cheapest category that can handle the work:

| Category             | Default Model         | Cost     | Use When                                          |
| -------------------- | --------------------- | -------- | ------------------------------------------------- |
| `quick`              | Claude Haiku 4.5      | Lowest   | Single file edits, typo fixes, simple writes      |
| `writing`            | Kimi K2P5             | Low      | Documentation, prose, markdown files              |
| `unspecified-low`    | Claude Sonnet 4.6     | Mid      | Moderate tasks that don't fit other categories    |
| `visual-engineering` | Gemini 3.1 Pro        | Mid-High | Frontend, UI/UX, styling                          |
| `artistry`           | Gemini 3.1 Pro        | Mid-High | Creative, unconventional problem-solving          |
| `deep`               | GPT-5.3 Codex         | High     | Autonomous problem-solving, hairy bugs            |
| `ultrabrain`         | GPT-5.3 Codex (xhigh) | Highest  | Genuinely hard logic, complex architecture        |
| `unspecified-high`   | GPT-5.4 (high)        | Highest  | High-effort tasks that don't fit other categories |

Agent subagent_types also have fixed model tiers:

| Agent       | Default Model                       | Cost    |
| ----------- | ----------------------------------- | ------- |
| `explore`   | Grok Code Fast 1 / Haiku 4.5        | Lowest  |
| `librarian` | Gemini 3 Flash                      | Low     |
| `oracle`    | GPT-5.4 / Gemini 3.1 Pro / Opus 4.6 | Highest |
| `metis`     | Opus 4.6 / GPT-5.4                  | Highest |
| `momus`     | GPT-5.4 / Opus 4.6                  | Highest |

**Decision tree**:

1. Can Haiku handle it? (simple, explicit instructions, single concern) -> `quick`
2. Is it documentation or prose? -> `writing`
3. Is it moderate, non-specialized work? -> `unspecified-low`
4. Is it frontend/UI? -> `visual-engineering`
5. Does it require deep autonomous reasoning? -> `deep`
6. Is it genuinely hard, logic-heavy? -> `ultrabrain`
7. Still unsure + high effort? -> `unspecified-high`

**Rules**:

- Default to the cheapest viable category. Escalate only when quality demands it.
- `explore` and `librarian` are cheap per-spawn but compound quickly. Prefer direct tools (grep, LSP, codesearch, context7) for deterministic lookups; reserve agent spawns for tasks requiring multi-step reasoning.
- `oracle`, `metis`, `momus` are expensive. Use only when their specialized reasoning is required.
- When delegating to `quick`, prompts MUST be exhaustively explicit (Haiku has limited reasoning).
- Agent spawns have compounding request cost: spawn + internal reasoning turns + result collection. A single `explore` agent may consume 3-6 requests total. Factor this into cheapest-viable-category decisions.
- When direct tools (grep, LSP, codesearch, context7) can answer a question with equivalent quality, prefer them over agent spawns.

### Phase Cost Estimation

Before executing any non-trivial phase, present a rough cost estimate to the human:

```
Phase: [Phase name]

Estimated operations:
  - [N] file reads (~X lines each)
  - [N] file writes/edits
  - [N] delegated tasks: [categories] → [models]
  - [N] agent calls: [types]

Request budget:
  - Direct tool operations: [N] (0 extra requests)
  - Agent spawns: [N] × ~[X] requests each = ~[total]
  - Quality trade-off: [What agent usage buys vs self-execution]

Relative cost: [Cheap / Moderate / Expensive / Very Expensive]
Confidence: [High / Medium / Low] (low = more unknowns, actual cost may vary)
```

This is not a precise dollar estimate. It is a relative cost classification so the human can make informed go/no-go decisions. Present it inline before starting the phase. If the human does not object, proceed.

### Large File Decomposition

If a file exceeds ~300 lines or is growing beyond what can be efficiently read, written, or delegated in a single pass, proactively suggest decomposing it into smaller files with a lazy-load index. Do not wait for the file to cause problems — propose the split as soon as the size trend is apparent. This applies to both source code and documentation.

### General Rules

- Use `grep` to find _where_ something is. Read to understand _how_ it works.
- Never re-read a file you just wrote or edited in the same turn.
- When delegating to subagents, include all relevant context in the prompt.
- Keep your current todo list updated — it is rehydrated after compaction.
- **Lazy-load documents**: Do not read `docs/CODING_STANDARDS.md` or other detailed docs until entering the phase that needs them. See Document Loading Strategy above.
- Prefer direct tools for deterministic lookups (file finding, pattern matching, single-doc queries). Reserve agent spawns for tasks requiring multi-step reasoning or model quality that exceeds your own capability.
- Always confirm with the user before starting implementation phases — this prevents wasted requests on misunderstood requirements.
- **Load `git-worktree-agent-workflow` skill before any implementation intent is carried out.** If you are about to write, edit, or create any source file, the worktree skill must already be loaded. No exceptions unless the human explicitly says "skip worktree" or "work on main".

## Research Protocol

When performing research: (1) Define specific questions — research is done when answered. (2) Timebox: Quick 3 min, Focused 5 min, Deep 10 min, Max 15 min. (3) Report findings and let the user decide next steps. Never self-authorize additional research rounds.

## Anti-Patterns (NEVER DO)

- Implementing before the human approves your plan.
- Expanding scope beyond what was requested.
- Reading files you don't intend to use, or re-reading files already in context.
- Echoing back large blocks of code the human can already see.
- Running builds or installs without confirming first.
- Iterating on a broken fix more than twice without stopping to reassess.
- Creating long-lived feature branches instead of small incremental PRs.
- Doing refactoring, cleanup, or "improvements" that weren't requested.
- Continuing work after the human provides feedback that redirects the approach.
- Retrying a failed delegation with the same scope/parameters more than once without changing strategy.
- Giving subagents large, multi-concern tasks when smaller focused tasks would suffice.
- Letting a file grow past ~300 lines without proposing decomposition.
- Spawning explore/librarian agents for lookups that grep, glob, LSP, or codesearch can handle directly.
- Spawning 5+ agents in parallel when 1-2 targeted agents plus direct tools would produce equivalent results.
- Starting implementation without user confirmation — misunderstood requirements waste all downstream requests.
