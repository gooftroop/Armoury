# Armoury - Agent Instructions

Behavioral rules for LLM agents on this monorepo. For coding conventions, see `docs/CODING_STANDARDS.md`.

## Sisyphus Compatibility

This file is designed to work with the Sisyphus agent's built-in system prompt. If a rule in this file conflicts with Sisyphus's immutable behavior on **delegation decisions**, **TODO continuation flow**, or **communication tone**, the system prompt takes precedence. In all other domains (phase workflow, project conventions, coding standards, git workflow), this file takes precedence.

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
| `@providers-bsdata/*`  | `src/shared/providers/bsdata/src/*`   | `@armoury/providers-bsdata`, `@armoury/wh40k10e`   |
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

## Phase-Based Workflow

Every task follows phases. The number of phases and gates depends on task risk level.

### Risk-Based Phase Gates

Not all tasks need the same ceremony. Classify risk first, then apply the matching gate pattern:

| Risk Level | Examples | Required Gates |
|-----------|----------|---------------|
| **Trivial** | Typo fixes, comment updates, single-line config changes | **No gate** — execute, present result. No approval needed before acting. |
| **Low** | Doc edits, single-file changes in established patterns, test additions | Combine Phase 1+2 → present plan → Phase 3 → Phase 4 |
| **Medium** | Feature in established patterns, multi-file edits, refactors within one module | Full Phase 1 → 2 → 3 → 4 with gates at each boundary |
| **High** | Cross-module refactors, schema changes, new architecture patterns, security-sensitive changes | Full Phase 1 → 2 → 3 → 4 with gates + Oracle review before Phase 3 |

When uncertain about risk level, **default to Medium**. The human can always say "just do it" to skip gates.

### Phase 1 — Discovery

Understand the problem before proposing solutions. Read relevant code, identify root cause or affected areas, list unknowns and risks.

**Gate** (Medium/High risk): Present findings → wait for human approval.

### Phase 2 — Plan

Break work into the smallest possible incremental changes. Identify blocking vs. parallelizable work. Each increment should be a single, independently mergeable PR. Include a test plan.

**Gate** (Medium/High risk): Present plan → wait for human approval.

### Phase 3 — Implementation (per increment)

**⚠️ MANDATORY: Load `git-worktree-agent-workflow` skill BEFORE writing any code.** All code changes MUST happen inside a git worktree — no exceptions unless the human explicitly says "skip worktree" or "work on main".

Implement one increment at a time. Run linting, type checks, and tests on affected packages. Summarize what changed and what was verified.

**Gate** (Medium/High risk): After each increment → wait for human feedback.

### Phase 4 — Integration

Commit, push, create PR. Load `mastering-github-cli` skill. Worktree skill should already be loaded from Phase 3.

**Gate** (Medium/High risk): Present PR for review before starting the next increment.

### Phase Gate Approval Signals

The phase gates above require human approval to advance. Recognize these approval patterns:

- **Explicit approval**: "Approved", "LGTM", "Go ahead", "Proceed"
- **Forward intent**: "Continue", "Continue if you have next steps", "Keep going", "What's next?"
- **Conditional approval**: "Proceed with [option]", "Do [X] first, then [Y]"

If the human expresses forward intent and there are pending tasks in your todo list, **continue working**. Do not re-ask for permission that was already granted. Silence after a gate presentation (no response at all) is the only case where you should wait — an explicit message with forward language is approval.

### Approval Persistence

**An approved plan remains approved across the entire implementation phase.** Once the human approves a plan:

- Do not re-ask for permission to perform operations that are part of the approved plan (builds, tests, linting, multi-file edits, npm install in worktrees).
- Each completed increment within the plan gets a brief summary, not a new approval request.
- Only re-ask if you encounter a significant deviation from the approved plan (unexpected error, scope change, new risk discovered).

**Routine operations that never require confirmation** (when part of an approved plan or trivial task):
- Running builds, tests, linting, typechecks
- `npm install` in worktrees
- Git commits (but NOT force push)
- File creation/editing within the approved scope
- Running formatters

**Destructive operations that always require confirmation** (even within an approved plan):
- `git push --force`, `git reset --hard`, branch deletion on remote
- Production deployments, database migrations
- `rm -rf` on directories outside `.worktrees/`
- Any operation that cannot be undone

### TODO Continuation

The system may inject a `TODO CONTINUATION` directive when you have incomplete tasks. This is a **legitimate signal to resume work**, not noise to ignore. When you receive it:

1. Check your todo list for the next pending task.
2. If the human's last message expressed approval or forward intent, continue immediately.
3. If the human's last message redirected the approach, follow the redirect instead.
4. If there was no human message (pure system directive after inactivity), continue with the next pending task.

**Never stall on a TODO continuation when prior approval was given.** The purpose of phase gates is to get human input at decision points — once input is received, execute until the next gate or until all tasks are complete.

### Approval Recovery After Compaction

When context is compacted (long sessions), approval state may be lost. To recover:

1. Check your todo list — items marked `completed` indicate prior phases were approved.
2. Check the last human message — forward intent signals still apply.
3. If both indicate prior approval, **resume work at the current phase**. Do not restart from Phase 1.
4. If uncertain, present a one-line summary: "Resuming [task] at Phase [N] — prior phases were approved. OK to continue?"

## Agile Delivery

- **Commit small, commit fast.** Each PR is one focused, reviewable change.
- **Blocking work first.** Do prerequisite work before parallel work.
- **One concern per PR.** Do not bundle refactoring with bug fixes or features.

## Human Collaboration Protocol

You are a partner, not an autonomous executor. The human drives decisions.

- **Never auto-advance between phases** (at Medium/High risk). Always present results and wait.
- **Never assume approval.** Silence is not consent. Ask explicitly.
- **Never expand scope.** If you discover additional work, report it — don't do it.
- **Present options, not decisions.** When tradeoffs exist, lay them out. Let the human choose.
- **Ask before destructive operations.** See the destructive operations list above. Routine operations within an approved plan do not require confirmation.

### When You Are Stuck

If you have attempted a fix twice without success:

1. Stop making changes.
2. Revert to the last known working state.
3. Present what you tried, what failed, and why.
4. Ask for guidance.

## Resource Efficiency

### Delegation Efficiency

Agent spawns consume requests proportional to their complexity. Direct tool calls within a single turn are free. The goal is maximum ROI: quality × success rate / requests consumed.

**Core principle**: Delegate by default (this aligns with Sisyphus's system behavior), but delegate *efficiently*. Optimize by reducing redundancy, scope, and round-trips — not by avoiding delegation.

**Efficiency guidelines**:

- Use direct tools (grep, glob, LSP, codesearch, context7) to pin down specifics *after* delegation surfaces the broad picture. Don't re-search what you already delegated.
- When explore/librarian results arrive, extract what you need and cancel the agent. Don't let background agents run indefinitely.
- Prefer 2 targeted agents over 5 broad ones. Scale up to 3-5 only when questions are genuinely independent and each requires multi-step reasoning.
- One follow-up per question maximum. If a delegated search didn't find it, try a different tool or approach — don't retry the same query.

**Agent Spawn Decision Matrix:**

|                       | Low Complexity                   | High Complexity                                       |
| --------------------- | -------------------------------- | ----------------------------------------------------- |
| **Familiar Domain**   | Self + direct tools (0 requests) | Self + oracle review (~10 requests)                   |
| **Unfamiliar Domain** | Librarian + self (~5 requests)   | Librarian + plan agent + specialist (~20-30 requests) |

### Delegation Scope & Retry Discipline

Prefer more, smaller delegations over fewer, larger ones — 4 focused tasks of 10 items each beats 2 broad tasks of 20 items. Smaller scopes are cheaper to retry and reduce blast radius of failures.

When a delegated task fails, times out, or produces incomplete results:

- **Why** did it fail? (scope too large, output too long, ambiguous instructions)
- **What** can be reduced? (split into smaller chunks, narrow the scope)
- **Propose** the adjusted approach to the human before retrying.

One retry with the same parameters is acceptable. A second failure requires a different strategy.

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

1. Can Haiku handle it? (simple, explicit instructions, single concern) → `quick`
2. Is it documentation or prose? → `writing`
3. Is it moderate, non-specialized work? → `unspecified-low`
4. Is it frontend/UI? → `visual-engineering`
5. Does it require deep autonomous reasoning? → `deep`
6. Is it genuinely hard, logic-heavy? → `ultrabrain`
7. Still unsure + high effort? → `unspecified-high`

**Rules**:

- Default to the cheapest viable category. Escalate only when quality demands it.
- `explore` and `librarian` are cheap per-spawn but compound quickly. Prefer direct tools for deterministic lookups; reserve agent spawns for multi-step reasoning.
- `oracle`, `metis`, `momus` are expensive. Use only when their specialized reasoning is required.
- When delegating to `quick`, prompts MUST be exhaustively explicit (Haiku has limited reasoning).

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
- **Lazy-load documents**: Do not read `docs/CODING_STANDARDS.md` or other detailed docs until entering the phase that needs them. See Document Loading Strategy above.
- Prefer direct tools for deterministic lookups (file finding, pattern matching, single-doc queries). Reserve agent spawns for tasks requiring multi-step reasoning or model quality that exceeds your own capability.
- **Load `git-worktree-agent-workflow` skill before any implementation intent is carried out.** If you are about to write, edit, or create any source file, the worktree skill must already be loaded. No exceptions unless the human explicitly says "skip worktree" or "work on main".

## Research Protocol

When performing research: (1) Define specific questions — research is done when answered. (2) Timebox: Quick 3 min, Focused 5 min, Deep 10 min, Max 15 min. (3) Report findings and let the user decide next steps. Never self-authorize additional research rounds.

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
