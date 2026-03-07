---
model: opus
created: 2026-02-02
modified: 2026-03-05
reviewed: 2026-03-05
name: git-worktree-agent-workflow
description: |
    MANDATORY workflow for all agent code changes. Every agent MUST use a git
    worktree for any code modification — no exceptions. Worktrees live in
    .worktrees/ inside the repo (gitignored). Agents MUST NOT make
    code changes directly on any branch in the main working tree. This skill
    covers worktree creation, parallel agent coordination, patch management,
    integration, and cleanup.
allowed-tools: Bash, Read, Write, Edit, Grep, Glob, Task, TodoWrite
---

# Git Worktree Agent Workflow

**MANDATORY** — All agent code changes MUST happen inside a git worktree. No exceptions.

## Enforcement Policy

> **HARD RULE**: Agents MUST NOT make code changes directly on any branch in the main
> repo working tree. Every code modification — bug fixes, features, refactors,
> test additions — MUST be performed inside a worktree under `.worktrees/`.

| Allowed                                         | Forbidden                                     |
| ----------------------------------------------- | --------------------------------------------- |
| Read files in main working tree (for context)   | Write/edit files in main working tree         |
| Run read-only git commands in main working tree | Commit to any branch in main working tree     |
| Create worktrees from main working tree         | Modify code without a worktree                |
| All code changes inside a worktree              | `git checkout -b` + direct edits in main tree |

**If an agent is already operating inside a worktree** (e.g., the user opened VS Code
in `.worktrees/AST-1234`), the agent works in that worktree directly —
no need to create a new one.

## Human Communication (MANDATORY)

Agents MUST clearly communicate worktree usage to the human at every stage.
The human must never wonder whether the agent is modifying their current branch.

### When creating a new worktree

```
📂 WORKTREE CREATED
I've created a new worktree for this work:
  Branch: <branch-name>
  Location: <absolute-path-to-worktree>
  Base: origin/master (fresh)

⚠️  Your current branch (<current-branch>) is UNTOUCHED.
    All changes will happen inside the worktree above.
```

### When using an existing worktree

```
📂 USING EXISTING WORKTREE
I'm working inside an existing worktree:
  Branch: <branch-name>
  Location: <absolute-path-to-worktree>

⚠️  Your main working tree is UNTOUCHED.
```

### When freshening a worktree against master

```
🔄 FRESHENING WORKTREE
Updating worktree against origin/master to ensure it's current:
  Branch: <branch-name>
  Location: <absolute-path-to-worktree>
  Action: fetch origin master && rebase origin/master
```

### When pushing / creating PR

```
🚀 PUSHING WORKTREE BRANCH
Pushing branch from worktree:
  Branch: <branch-name>
  From: <absolute-path-to-worktree>
  To: origin/<branch-name>

Your current branch (<current-branch>) was not affected.
```

### How to detect if you're already in a worktree

```bash
# Returns the path to the main working tree. If it differs from $(pwd), you're in a worktree.
MAIN_TREE=$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null | sed 's|/\.git$||')
CURRENT_DIR=$(pwd -P)

if [ "$MAIN_TREE" != "$CURRENT_DIR" ]; then
  echo "Already in a worktree at: $CURRENT_DIR"
  # Proceed with work — no new worktree needed
else
  echo "In main working tree — MUST create a worktree before making changes"
fi
```

## Worktree Location

All worktrees live in `.worktrees/` inside the root of the repo. This directory is **gitignored**.

```
<repo>/                           # Main working tree (READ-ONLY for agents)
├── .worktrees/                   # All agent worktrees live here (gitignored)
│   ├── AST-4142/                 # Bug fix worktree
│   ├── feature-dark-mode/        # Feature worktree
│   └── refactor-auth/            # Refactor worktree
├── src/
│   ├── shared/
│   ├── systems/
│   ├── web/
│   ├── mobile/
│   ├── services/
│   └── tooling/
├── .gitignore                    # Contains ".worktrees" entry
└── ...
```

**Why inside the repo (gitignored)**:

- Single directory to manage — everything lives under the repo root
- `.worktrees` is in `.gitignore` — never committed
- Easy to find — no guessing about sibling directory names
- Each worktree is a fully independent working directory

## Core Expertise

- **Mandatory Isolation**: Every code change happens in a worktree — never the main tree
- **Issue Isolation**: Create independent working directories for each issue
- **Fresh Against Master**: Every worktree starts from (or is rebased onto) latest `origin/master`
- **Contamination Recovery**: Preserve mixed work as patches, reset, redistribute
- **Parallel Execution**: Launch multiple agents working simultaneously
- **Atomic PRs**: Each worktree produces exactly one focused commit/PR
- **Clean Integration**: Sequential PR creation maintains proper git history

## Context

- Current branch: !`git branch --show-current 2>/dev/null`
- Worktrees: !`git worktree list --porcelain 2>/dev/null`
- Uncommitted changes: !`git status --porcelain 2>/dev/null | wc -l`
- Recent commits: !`git log --oneline -10 2>/dev/null`
- Remote tracking: !`git rev-list --left-right --count HEAD...@{u} 2>/dev/null`
- In worktree: !`[ "$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null | sed 's|/\.git$||')" != "$(pwd -P)" ] && echo "YES — $(pwd -P)" || echo "NO — main working tree"`

## Execution

### Step 0: Ensure worktree directory exists (ALWAYS)

This step runs before ANY code change workflow. It is idempotent and safe to run repeatedly.

```bash
# Create the worktrees directory inside the repo if it doesn't exist
mkdir -p .worktrees
```

### Step 1: Check if already in a worktree

Before creating a new worktree, determine if the agent is already working inside one.

```bash
MAIN_TREE=$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null | sed 's|/\.git$||')
CURRENT_DIR=$(pwd -P)

if [ "$MAIN_TREE" != "$CURRENT_DIR" ]; then
  echo "Already in worktree: $CURRENT_DIR — proceeding with work"
  # No new worktree needed. Work directly in the current directory.
else
  echo "In main working tree — creating a worktree now"
  # Proceed to Step 2
fi
```

**If already in a worktree**: Freshen against master (Step 1b), then skip to Step 4 (or the relevant work step). Make all changes in the current directory.

**If in the main working tree**: Continue to Step 2 to create a worktree.

### Step 1b: Freshen worktree against master (ALWAYS before starting work)

Whether you just created a new worktree or are reusing an existing one, it **MUST** be fresh against `origin/master`.

**For an existing worktree** (you're already inside it):

```bash
# Fetch the latest master
git fetch origin master

# Rebase current branch onto latest origin/master
git rebase origin/master

# If rebase has conflicts, abort and recreate the worktree instead
# git rebase --abort
# (then go to Step 3 to recreate)
```

**Communicate to the human** using the "When freshening a worktree against master" template above.

**For a newly created worktree**: This is handled automatically by branching from `origin/master` after a fresh fetch (see Step 3).

### Step 2: Preserve existing work (if applicable)

Only needed when the main tree has uncommitted or contaminated work that must be saved.

```bash
# 1. Identify the clean base commit
git log --oneline -20  # Find last clean commit before contamination

# 2. Preserve work as patches
git format-patch <clean-base>..HEAD -o /tmp/patches/

# 3. Save stash if exists
git stash show -p > /tmp/patches/stash.patch 2>/dev/null || true

# 4. Save uncommitted changes
git diff > /tmp/patches/working-tree.patch
git diff --staged > /tmp/patches/staged.patch

# 5. Reset to clean state (requires user confirmation)
git reset --hard <clean-base>
git stash drop 2>/dev/null || true
```

**Patch contents**:

- `0001-*.patch`, `0002-*.patch`, etc. - Individual commits
- `stash.patch` - Stashed changes
- `working-tree.patch` - Uncommitted modifications
- `staged.patch` - Staged but uncommitted changes

### Step 3: Create worktrees

Create worktrees in `.worktrees/`. **Always fetch latest master first**, then branch from `origin/master`.

```bash
# ALWAYS fetch latest master before creating worktrees
git fetch origin master

# Single issue — create one worktree
git worktree add .worktrees/AST-4142 -b AST-4142 origin/master

# Multiple issues — create one worktree per issue
git worktree add .worktrees/AST-4142 -b AST-4142 origin/master
git worktree add .worktrees/AST-4200 -b AST-4200 origin/master
git worktree add .worktrees/AST-4201 -b AST-4201 origin/master

# List all worktrees
git worktree list

# Each worktree:
# - Lives in .worktrees/ inside the repo (gitignored)
# - Shares the same .git database (efficient)
# - Has an independent branch
# - Is fresh against origin/master
# - Can be worked on simultaneously
```

**Communicate to the human** using the "When creating a new worktree" template above.

**Naming convention**: `.worktrees/<identifier>` with branch `<identifier>`

Identifiers can be:

- Jira ticket IDs: `AST-4142`
- Descriptive names: `feature-dark-mode`, `fix-auth-redirect`, `refactor-color-manager`
- Any consistent naming the developer prefers

### Step 4: Install dependencies (if new worktree)

New worktrees need dependency installation since `node_modules` is not shared.

```bash
# From within the worktree
cd .worktrees/AST-4142
npm install
```

### Step 5: Apply existing work (if applicable)

Distribute saved patches to appropriate worktrees.

**For complete patches (single-issue commits)**:

```bash
git -C .worktrees/AST-4142 am /tmp/patches/0001-feat-implementation.patch
```

**For mixed patches (multi-issue commits)**:

```bash
# Extract specific files from a mixed commit
git show <commit> -- path/to/file1 path/to/file2 > /tmp/patches/AST-4142-files.patch

# Apply to appropriate worktree
git -C .worktrees/AST-4142 apply /tmp/patches/AST-4142-files.patch
```

**For partial work (needs agent completion)**:

```bash
git -C .worktrees/AST-4142 apply /tmp/patches/partial-work.patch
# Agent will complete remaining work
```

### Step 6: Launch parallel agents

Launch agents to complete work in their respective worktrees.

**Critical**: Each agent receives the **absolute path** to its worktree.

**Agent prompt template**:

```
You are working in the worktree at: <repo-root>/.worktrees/<identifier>

## WORKTREE ENFORCEMENT
You MUST make ALL code changes inside this worktree directory ONLY.
DO NOT modify any files in the main repo working tree.
You may READ files from the main tree for context, but ALL writes go to your worktree.

⚠️  IMPORTANT: The human's current branch is UNTOUCHED by your work.
All changes are isolated in the worktree above.

**Issue**: <identifier> — <issue title>

<issue description>

## Already applied changes
<list of files with partial changes, if any>

## Your task
1. <specific tasks>
2. Run relevant tests: npm run test --workspace=<package>
3. Stage all changes and create a commit with message:
   <commit type>: <description>

   Fixes <identifier>

   Co-Authored-By: Claude <noreply@anthropic.com>

## Constraints
- ALL file modifications MUST be inside <repo-root>/.worktrees/<identifier>/
- DO NOT modify any files outside your worktree
- Run npm install if dependencies are not yet installed

## Skills
- If your task includes pushing branches or creating PRs, load the `mastering-github-cli` skill for `gh` command patterns, auth checks, and CI monitoring.

**Parallelization**: Agents run simultaneously because:

- Each has its own isolated directory
- No file conflicts possible
- Independent git histories until merge

### Step 7: Integrate sequentially

Push branches and create PRs in order. Load the `mastering-github-cli` skill for advanced `gh` patterns (JSON output, auth verification, rate limits, CI monitoring).

```bash
# Verify gh authentication first
gh auth status

# From each worktree, push to origin
git -C .worktrees/AST-4142 push origin AST-4142

# Create PR via GitHub CLI
gh pr create --title "fix: description" --body "Fixes AST-4142" --base master

# Monitor CI status on the PR
gh pr checks --watch
```

**Communicate to the human** using the "When pushing / creating PR" template above.

**Why sequential**: PRs are created one at a time to:

- Allow proper PR numbering
- Enable dependent PRs if needed
- Maintain clean git history

### Step 8: Clean up worktrees

Remove worktrees and temporary branches after PRs are merged.

```bash
# Remove worktrees
git worktree remove .worktrees/AST-4142
git worktree remove .worktrees/AST-4200
git worktree remove .worktrees/AST-4201

# Prune stale worktree references
git worktree prune

# Delete local branches (only after MR is merged)
git branch -D AST-4142 AST-4200 AST-4201

# Clean up patches
rm -rf /tmp/patches/
```

## Orchestrator Responsibilities

The main agent (orchestrator) handles:

1. **Worktree check**: Determine if already in a worktree or need to create one
2. **Freshness check**: Ensure worktree is up-to-date with `origin/master` before starting work
3. **Human communication**: Clearly state worktree path and that the human's branch is untouched
4. **Analysis**: Determine which issues are independent vs. interdependent
5. **Patch extraction**: Separate mixed commits into per-issue patches (if needed)
6. **Worktree creation**: Set up isolated environments in `.worktrees/`
7. **Agent dispatch**: Launch subagents with precise worktree paths
8. **Verification**: Run tests in each worktree before integration
9. **Integration**: Push branches and create PRs
10. **Cleanup**: Remove worktrees and temporary artifacts

## Subagent Responsibilities

Each subagent MUST:

1. **Verify it is in a worktree** before making any changes (Step 1 check)
2. **Communicate worktree location** to the human using the templates above
3. **Work in assigned worktree only** — this is a hard constraint, not a suggestion
4. **NEVER modify files in the main repo working tree**
5. Complete the assigned issue
6. Run relevant tests within the worktree
7. Create a single, focused commit
8. Report completion status

## Decision Matrix

| Scenario                     | Approach                                  |
| ---------------------------- | ----------------------------------------- |
| Single issue, any complexity | Create worktree → Agent implements        |
| Multiple independent issues  | Parallel worktrees (one per issue)        |
| Issues with dependencies     | Sequential worktrees (order matters)      |
| Contaminated branch          | Preserve → Reset → Worktrees → Reapply    |
| Partial work exists          | Apply patch to worktree → Agent completes |
| Already in a worktree        | Freshen against master → Work directly    |
| Read-only investigation      | Main tree is fine (no code changes)       |

**Note**: "Standard branch workflow" (editing directly on a branch in the main tree) is
**never an option** for code changes. The ONLY exception is read-only operations
(grep, exploration, reading files for context).

## Verification Checklist

**Before integration**:

- [ ] Agent verified it was working inside a worktree (not the main tree)
- [ ] Worktree was freshened against `origin/master` before work began
- [ ] Agent communicated worktree location to the human
- [ ] Each worktree has exactly 1 commit ahead of base
- [ ] Tests pass in each worktree
- [ ] Commits reference correct issue numbers
- [ ] No files were modified in the main repo working tree

**After integration**:

- [ ] Each PR has clean, single-purpose changes
- [ ] Worktrees removed (if PR merged or no longer needed)
- [ ] Local branches cleaned up
- [ ] Main branch unchanged
- [ ] Human was informed of push and PR creation

## Key Constraints for Agents

1. **Worktree required**: ALL code changes MUST happen in a worktree — no exceptions
2. **Fresh against master**: Worktrees MUST be up-to-date with `origin/master` before work begins
3. **Human communication**: ALWAYS tell the human which worktree you're using and that their branch is safe
4. **Absolute paths only**: Always pass full paths to avoid confusion
5. **No directory changes in main tree**: Code work happens via worktree paths, not `cd` in main
6. **Single commit per worktree**: Keep changes atomic and reviewable
7. **Issue reference in commit**: Always include the ticket/issue identifier
8. **Dependency installation**: New worktrees need `npm install`
9. **Main tree is read-only**: Agents may read from main tree but MUST NOT write to it

## Agentic Optimizations

| Context               | Command                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------- |
| Ensure worktrees dir  | `mkdir -p .worktrees`                                                                       |
| List worktrees        | `git worktree list --porcelain`                                                             |
| Create worktree       | `git worktree add .worktrees/<id> -b <id> origin/master`                                    |
| Remove worktree       | `git worktree remove .worktrees/<id>`                                                       |
| Freshen worktree      | `git -C .worktrees/<id> fetch origin master && git -C .worktrees/<id> rebase origin/master` |
| Preserve commits      | `git format-patch <base>..HEAD -o /tmp/patches/`                                            |
| Apply patch (am)      | `git -C .worktrees/<id> am /tmp/patches/*.patch`                                            |
| Apply patch (apply)   | `git -C .worktrees/<id> apply /tmp/patches/file.patch`                                      |
| Extract file changes  | `git show <commit> -- path/to/file > /tmp/patch.patch`                                      |
| Check worktree status | `git -C .worktrees/<id> status --porcelain`                                                 |
| Run tests in worktree | `cd .worktrees/<id> && npm run test --workspace=<pkg>`                                    |
| Push worktree branch  | `git -C .worktrees/<id> push origin <id>`                                                   |
| Detect worktree       | `git rev-parse --path-format=absolute --git-common-dir`                                     |
| Install deps          | `cd .worktrees/<id> && npm install`                                                    |

## Quick Reference

| Operation            | Command                                                      |
| -------------------- | ------------------------------------------------------------ |
| Ensure dir exists    | `mkdir -p .worktrees`                                        |
| Fetch latest master  | `git fetch origin master`                                    |
| Add worktree         | `git worktree add .worktrees/<id> -b <branch> origin/master` |
| Freshen worktree     | `git -C .worktrees/<id> rebase origin/master`                |
| List worktrees       | `git worktree list`                                          |
| Remove worktree      | `git worktree remove .worktrees/<id>`                        |
| Prune stale          | `git worktree prune`                                         |
| Lock worktree        | `git worktree lock .worktrees/<id>`                          |
| Unlock worktree      | `git worktree unlock .worktrees/<id>`                        |
| Move worktree        | `git worktree move .worktrees/<id> .worktrees/<new-id>`      |
| Format patches       | `git format-patch <base>..<head> -o <dir>`                   |
| Apply patch series   | `git am <patches>`                                           |
| Apply single patch   | `git apply <patch>`                                          |
| Show commit as patch | `git show <commit> --format=email`                           |
| Am I in a worktree?  | `git rev-parse --path-format=absolute --git-common-dir`      |

## Example Coordination Flow

```
Orchestrator (main repo — READ ONLY for code changes)
    |
    +--- Step 0: mkdir -p .worktrees
    |
    +--- Step 1: Check if already in worktree
    |         +-- YES → freshen against master, then skip to Step 6
    |         +-- NO → continue to Step 2
    |
    +--- Step 1b: Freshen worktree (fetch + rebase origin/master)
    |         +-- Communicate freshening to human
    |
    +--- Step 2: Analyze & preserve contaminated work (if any)
    |
    +--- Step 3: git fetch origin master → Create worktrees from origin/master
    |         +-- .worktrees/AST-4142
    |         +-- .worktrees/AST-4200
    |         +-- .worktrees/AST-4201
    |         +-- Communicate worktree locations to human
    |
    +--- Step 4: Install dependencies (npm install in each worktree)
    |
    +--- Step 5: Apply patches (if preserving existing work)
    |         +-- git am (complete patches)
    |         +-- git apply (partial patches)
    |
    +--- Step 6: Launch agents IN PARALLEL
    |         |
    |         +---> Agent 1 -> .worktrees/AST-4142
    |         |         +-- Communicates worktree to human
    |         |         +-- Implements fix, runs tests, commits
    |         |
    |         +---> Agent 2 -> .worktrees/AST-4200
    |         |         +-- Communicates worktree to human
    |         |         +-- Implements fix, runs tests, commits
    |         |
    |         +---> Agent 3 -> .worktrees/AST-4201
    |                   +-- Communicates worktree to human
    |                   +-- Implements fix, runs tests, commits
    |
    +--- Step 7: Sequential integration
    |         +-- Verify tests pass in each worktree
    |         +-- Push branches to origin
    |         +-- Create PRs
    |         +-- Communicate push/PR to human
    |
    +--- Step 8: Cleanup
              +-- Remove worktrees
              +-- Delete local branches
```
