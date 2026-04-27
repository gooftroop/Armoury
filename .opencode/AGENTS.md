# Armoury - Agent Instructions

Behavioral rules for LLM agents on this monorepo. For coding conventions, see `docs/CODING_STANDARDS.md`.

## Documentation Map

| Document                      | Contains                                                                  | When to Read                                                                        |
| ----------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `docs/CODING_STANDARDS.md`    | Code style, naming, exports, types, testing, error handling               | **Phase 3 only** — before writing or modifying code                                 |
| `docs/AGENT_CATEGORIES.md`    | Model selection, operational guidelines, anti-patterns, project structure | When selecting delegation categories, reading structure, or reviewing anti-patterns |
| `docs/shared/REQUIREMENTS.md` | Data architecture and data flow requirements                              | When working on `@armoury/data` or `@armoury/models`                                |
| `docs/tooling.md`             | Shared configs, workspace scripts, adding workspaces                      | When modifying tooling configs or adding workspaces                                 |
| `docs/services/`              | Lambda service documentation                                              | When working on `@armoury/authorizer` or `@armoury/campaigns`                       |

### Document Loading Strategy

**Do NOT read documentation files upfront.** Read them lazily, only when entering the relevant phase or scope:

- **Discovery/Planning** (Phase 1-2): Use this file (AGENTS.md) and `grep` only. Do not read CODING_STANDARDS.md or other docs.
- **Implementation** (Phase 3): Load `git-worktree-agent-workflow` skill **before any code changes**. Read `docs/CODING_STANDARDS.md` before writing code. Read workspace-specific docs only for the workspace you're modifying.
- **Delegation**: Read `docs/AGENT_CATEGORIES.md` when selecting task categories or reviewing operational guidelines.
- **Integration** (Phase 4): Load `mastering-github-cli` skill. Do not re-read coding standards.
- **Never read a doc "just in case"** — grep for the specific section you need if unsure.

## Project Overview

TypeScript monorepo for managing tabletop game army data using community data files. Cross-platform (web, mobile, server) with adapters for different storage backends and a plugin architecture for game system support.

For full monorepo structure, path aliases, commands, file organization, and dependency graph, see `docs/AGENT_CATEGORIES.md`.

## Runtime & Tooling

- **Node**: `>=24.0.0` (see `.nvmrc`) | **Package manager**: npm (workspaces) | **Module**: ESM
- **Build**: Turborepo → esbuild for JS, `tsc --emitDeclarationOnly` for types
- **TypeScript**: Strict mode, `ES2022` target, `NodeNext` module resolution (`Bundler` for web/mobile)

For tooling configuration details (Vitest, TypeScript, ESLint, Prettier), workspace script conventions, and adding new workspaces, see `docs/tooling.md`.

## Skills Reference

Available skills in `.opencode/skills/`. Load via the `skill` tool only when needed — do not read SKILL.md files upfront.

**Git & CI**: `git-worktree-agent-workflow` (**before any code changes — Phase 3+**), `mastering-github-cli` (Phase 4), `gh-fix-ci`, `gh-address-comments`, `code-reviewer`
**Frontend**: `frontend-ux-engineer` (**mandatory — see below**), `accessibility`, `core-web-vitals`, `perf-web-optimization`, `seo`, `figma`, `figma-implement-design`
**Security**: `security-best-practices`, `security-threat-model`
**Docs & Design**: `docs-writer`, `docs-guardian`, `technical-design-doc-creator`
**Infrastructure**: `aws-advisor`, `sentry`
**Quality**: `best-practices`

### Mandatory Skill: `bootstrap` (implementation phase only)

When executing Speckit workflows (`/specify`, `/plan`, `/tasks`, `/implement` and Product Forge variants),
if planning artifacts imply **creating a new repository** or **adding a new workspace/service scaffold**,
you MUST defer bootstrap execution until the implementation phase.

Phase boundary rule:

- `/specify`, `/plan`, `/tasks`: planning artifacts only — **do not create scaffold code/files**
- `/implement`: execute scaffold creation with `bootstrap` skill, then apply task deltas

Trigger conditions (any of these):

- Plan/tasks include creating monorepo scaffolding
- Plan/tasks include creating a new `library`, `serverless`, `nextjs`, `react-native`, or `nestjs` workspace
- Plan/tasks include infra bootstrapping under workspace-local `infra/`

Required behavior:

1. During planning phases, tag bootstrap intent only (no scaffold execution)
2. At implementation start, load `bootstrap` skill first
3. Run bootstrap script(s) to generate canonical baseline
4. Only then implement task-specific deltas on top
5. Verify generated baseline matches bootstrap expectations (including `docs/CODING_STANDARDS.md` presence)

This prevents drift between planned implementation and canonical bootstrap conventions.

### Mandatory Skill: `frontend-ux-engineer`

**Every task that touches frontend code (web or mobile) MUST load the `frontend-ux-engineer` skill.**
This applies to the orchestrator AND to every subagent delegated for frontend work.

Frontend code includes: React components, hooks, styles (Tailwind/Tamagui), layouts,
pages/screens, providers, animations, accessibility, and any file under `src/web/` or `src/mobile/`.

When delegating frontend tasks, ALWAYS pass the skill:

```typescript
task(
    category="visual-engineering",
    load_skills=["frontend-ux-engineer"],  // MANDATORY for all frontend delegations
    ...
)
```

Without this skill, subagents lack the architectural guidance for proper component
decomposition (orchestrational/render split), accessibility requirements (WCAG 2.1 AA),
and platform-specific patterns (Tailwind v4, Radix UI, Tamagui v2, Expo Router).

**Failure to load this skill for frontend work is a process violation.**

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

| Risk Level  | Examples                                                                                      | Required Gates                                                           |
| ----------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Trivial** | Typo fixes, comment updates, single-line config changes                                       | **No gate** — execute, present result. No approval needed before acting. |
| **Low**     | Doc edits, single-file changes in established patterns, test additions                        | Combine Phase 1+2 → present plan → Phase 3 → Phase 4                     |
| **Medium**  | Feature in established patterns, multi-file edits, refactors within one module                | Full Phase 1 → 2 → 3 → 4 with gates at each boundary                     |
| **High**    | Cross-module refactors, schema changes, new architecture patterns, security-sensitive changes | Full Phase 1 → 2 → 3 → 4 with gates + Oracle review before Phase 3       |

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

Speckit implementation gate:

- If implementing a Speckit-generated task that creates repo/workspace scaffolding, use `bootstrap` skill first to materialize baseline.
- Do not hand-roll scaffold files that the bootstrap scripts already define.

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

**Core principle**: Delegate by default (this aligns with Sisyphus's system behavior), but delegate _efficiently_. Optimize by reducing redundancy, scope, and round-trips — not by avoiding delegation.

**Efficiency guidelines**:

- Use direct tools (grep, glob, LSP, codesearch, context7) to pin down specifics _after_ delegation surfaces the broad picture. Don't re-search what you already delegated.
- When explore/librarian results arrive, extract what you need and cancel the agent. Don't let background agents run indefinitely.
- Prefer 2 targeted agents over 5 broad ones. Scale up to 3-5 only when questions are genuinely independent and each requires multi-step reasoning.
- One follow-up per question maximum. If a delegated search didn't find it, try a different tool or approach — don't retry the same query.

For model selection heuristics, agent cost tiers, category decision trees, and the agent spawn decision matrix, see `docs/AGENT_CATEGORIES.md`.

### Delegation Scope & Retry Discipline

Prefer more, smaller delegations over fewer, larger ones — 4 focused tasks of 10 items each beats 2 broad tasks of 20 items. Smaller scopes are cheaper to retry and reduce blast radius of failures.

When a delegated task fails, times out, or produces incomplete results:

- **Why** did it fail? (scope too large, output too long, ambiguous instructions)
- **What** can be reduced? (split into smaller chunks, narrow the scope)
- **Propose** the adjusted approach to the human before retrying.

One retry with the same parameters is acceptable. A second failure requires a different strategy.

## Research Protocol

When performing research: (1) Define specific questions — research is done when answered. (2) Timebox: Quick 3 min, Focused 5 min, Deep 10 min, Max 15 min. (3) Report findings and let the user decide next steps. Never self-authorize additional research rounds.

## Issue Ownership

**Never assume any failure is "pre-existing" or "not my problem."** If something fails during your session — test, lint, build, typecheck, CI pipeline — you own it. Investigate, fix it, or explicitly justify why it is out of scope with evidence (e.g., the failure is on a service you have no access to). The label "pre-existing" is not a justification; it is an excuse.

This applies to all failure types:

- **Tests**: If a test is in the repo and it fails, either fix it or delete it with a commit message explaining why. Never report "N tests failed but they were pre-existing."
- **Lint / Format / Typecheck**: If the linter or type checker reports errors on files in your working tree, resolve them. Do not assume someone else left them broken.
- **Build / CI**: If a CI job fails after your push, investigate the failure logs. Do not assume it is flaky or unrelated without evidence.

## Root Cause Verification

**Never accept your first hypothesis as the root cause.** When diagnosing a failure, actively try to disprove your theory before acting on it. Confirmation bias is the most common source of wasted debugging time.

The falsification protocol:

1. **Form a hypothesis**: "I believe the failure is caused by X."
2. **Design a disproof**: "If my hypothesis is wrong, then Y should be true." Find a concrete, observable prediction that would contradict your theory.
3. **Test the disproof**: Run the check. Read the code path. Verify the actual values, not the ones you expect.
4. **Only act when disproof fails**: If you cannot disprove your hypothesis after a genuine attempt, proceed with the fix. If the disproof succeeds (your hypothesis was wrong), form a new one and repeat.

What this looks like in practice:

- Before fixing a test failure, read the actual DAO/service code that changed — confirm the test's expectation is genuinely stale, not that your understanding of the new behavior is wrong.
- Before blaming a dependency or environment, reproduce the failure locally with a minimal case.
- Before concluding "this value is always X," check the code path that produces it and trace the actual runtime flow.

## CI Pipeline Polling

**Never poll or repeatedly check CI/CD pipeline status.** After pushing to a remote branch or PR, do not loop, sleep, or periodically call `gh pr checks`, `gh run watch`, or any equivalent command to wait for CI results. CI pipelines can take minutes to hours — polling wastes context, tokens, and time.

Instead:

- **Report that you pushed** and state which CI jobs are expected to run.
- **Stop and let the human monitor CI.** They will tell you if something fails.
- If the human reports a CI failure, investigate the logs at that point — do not preemptively watch for failures.

This applies to all CI/CD systems: GitHub Actions, Vercel deployments, Buildkite, CircleCI, or any other pipeline triggered by a push or PR event.


## Anti-Patterns

For the full anti-patterns list, see `docs/AGENT_CATEGORIES.md`. Key rules to always keep in mind:

- Never implement before the human approves your plan (at Medium/High risk).
- Never expand scope beyond what was requested.
- Never iterate on a broken fix more than twice without stopping to reassess.
- Never re-ask for confirmation on routine operations that are part of an already-approved plan.
- Never dismiss failing tests as "pre-existing" — fix them or delete them.
- Never assume your first diagnosis is the root cause — try to disprove it first.
- Never poll CI pipeline status — push, report, and stop.
