# Armoury Shared Data Layer

## TL;DR

> **Quick Summary**: Build a cross-platform TypeScript data layer that fetches Warhammer 40k 10th Edition rules from BSData GitHub repo, parses BattleScribe XML, and stores data in SQLite (React Native) or IndexedDB (web) using the Strategy Pattern.
> 
> **Deliverables**:
> - TypeScript interfaces for all data entities and XML structures
> - GitHub API client with caching and rate limit handling
> - BattleScribe XML parser for .gst and .cat files
> - Database adapter interface with SQLite and IndexedDB implementations
> - DataManager with dependency injection pattern
> - Full TDD test coverage
> 
> **Estimated Effort**: Large (8-12 tasks, ~3-5 days)
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Task 1 (Types) -> Task 3 (Adapter Interface) -> Task 5/6 (Adapters) -> Task 8 (DataManager)

---

## Context

### Original Request
Build a shared TypeScript data layer for React Native (mobile) and React (web) apps named "Armoury" that fetches Warhammer 40k 10th edition rules from BSData/wh40k-10e GitHub repo, syncs core rules on app load and faction data on demand, uses SQLite for mobile and IndexedDB for web with Strategy Pattern.

### Interview Summary
**Key Discussions**:
- **Data entities**: All entities - Units, Weapons, Abilities, Stratagems, Detachments, Points, Keywords
- **Error handling**: Fail fast - stop on first error, surface to app
- **Offline support**: Full offline after first sync
- **Test strategy**: TDD - tests first for data integrity
- **Database libraries**: expo-sqlite (React Native) + Dexie (web IndexedDB)
- **Sync strategy**: Full file sync with SHA comparison using ETag headers
- **API pattern**: Factory/DI pattern with `createDataManager(config)`

**Research Findings**:
- BSData uses BattleScribe XML format with `.gst` (core rules) and `.cat` (faction catalogues)
- XML elements: `<gameSystem>`, `<catalogue>`, `<selectionEntry>`, `<profile>`, `<infoLink>`
- fast-xml-parser handles files up to 100MB, verified for React Native
- expo-sqlite provides async/await API with `openDatabaseAsync()`, prepared statements
- Dexie provides `EntityTable<T>` for type-safe IndexedDB with built-in migrations
- GitHub Contents API returns SHA for version comparison; conditional requests (ETag) don't count against rate limit

### Self-Review (Metis-Style Gap Analysis)
**Identified Gaps (addressed in plan)**:
- Need explicit error types for each failure mode -> Task 2 includes error hierarchy
- Database schema migrations need handling -> Tasks 5/6 include migration setup
- XML parsing needs to handle missing optional fields -> Task 4 includes defensive parsing
- Rate limit handling needs exponential backoff -> Task 2 includes retry logic

---

## Work Objectives

### Core Objective
Create a type-safe, cross-platform data layer that fetches, parses, and persists Warhammer 40k rules data with automatic sync capabilities and clean async APIs.

### Concrete Deliverables
- `src/shared/types/battlescribe.ts` - BattleScribe XML type definitions
- `src/shared/types/entities.ts` - Domain entity interfaces
- `src/shared/types/errors.ts` - Error type hierarchy
- `src/shared/clients/github.ts` - GitHub API client
- `src/shared/lib/xml-parser.ts` - BattleScribe XML parser
- `src/shared/data/adapter.ts` - Database adapter interface
- `src/shared/data/sqlite/adapter.ts` - SQLite implementation
- `src/shared/data/indexdb/adapter.ts` - IndexedDB implementation
- `src/shared/data/manager.ts` - Main DataManager with DI
- `src/shared/index.ts` - Public API exports

### Definition of Done
- [ ] `bun test` passes with 100% of written tests green
- [ ] All TypeScript compiles with `strict: true` and no errors
- [ ] DataManager can be instantiated with both SQLite and IndexedDB adapters
- [ ] Core rules sync works end-to-end (fetch -> parse -> store -> retrieve)
- [ ] Faction catalogue sync works on-demand

### Must Have
- Type-safe interfaces for all BattleScribe XML elements
- Strategy Pattern with abstract DatabaseAdapter interface
- Factory function `createDataManager(config)` for DI
- SHA-based sync detection with ETag caching
- Typed error hierarchy with specific error codes
- Full offline capability after initial sync

### Must NOT Have (Guardrails)
- NO UI components or React hooks (data layer only)
- NO army builder logic, point calculations, or list validation
- NO direct database access from outside DataManager
- NO hardcoded file paths or magic strings
- NO synchronous blocking operations
- NO untyped `any` in public APIs
- NO network calls without error handling and timeout

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.
> Every criterion is verified by running a command or using a tool.

### Test Decision
- **Infrastructure exists**: NO (new project)
- **Automated tests**: TDD (tests first)
- **Framework**: `bun test` (Bun's built-in test runner)

### Test Infrastructure Setup (Task 0)
Before any feature work, test infrastructure must be established:
- `bun init` if needed
- `tsconfig.json` with strict mode
- Test file convention: `*.test.ts` adjacent to source files

### Agent-Executed QA Scenarios (MANDATORY - ALL tasks)

Every task includes QA scenarios the executing agent performs directly:
- **Unit tests**: `bun test [file]` with assertions
- **Type checking**: `bunx tsc --noEmit`
- **Integration**: Import and call functions, verify outputs

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 0: Project setup and test infrastructure
├── Task 1: TypeScript interfaces (types/)
└── Task 2: GitHub client (clients/github.ts)

Wave 2 (After Wave 1):
├── Task 3: Database adapter interface (data/adapter.ts)
└── Task 4: XML Parser (lib/xml-parser.ts)

Wave 3 (After Wave 2):
├── Task 5: SQLite adapter (data/sqlite/)
└── Task 6: IndexedDB adapter (data/indexdb/)

Wave 4 (After Wave 3):
├── Task 7: DataManager implementation (data-manager.ts)
└── Task 8: Integration tests and public API (index.ts)

Critical Path: Task 0 -> Task 1 -> Task 3 -> Task 5/6 -> Task 7 -> Task 8
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 0 | None | All | None |
| 1 | 0 | 3, 4, 5, 6, 7 | 2 |
| 2 | 0 | 7 | 1 |
| 3 | 1 | 5, 6, 7 | 4 |
| 4 | 1 | 7 | 3 |
| 5 | 3 | 7 | 6 |
| 6 | 3 | 7 | 5 |
| 7 | 4, 5, 6 | 8 | None |
| 8 | 7 | None | None |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Approach |
|------|-------|---------------------|
| 1 | 0, 1, 2 | Task 0 first (setup), then 1 and 2 in parallel |
| 2 | 3, 4 | Can run in parallel after Task 1 completes |
| 3 | 5, 6 | Can run in parallel after Task 3 completes |
| 4 | 7, 8 | Sequential: Task 7 then Task 8 |

---

## TODOs

### Wave 1: Foundation

- [ ] 0. Project Setup and Test Infrastructure

  **What to do**:
  - Initialize project with `bun init` if package.json doesn't exist
  - Create `tsconfig.json` with strict TypeScript settings
  - Create folder structure: `src/shared/{types,clients,lib,data,data/sqlite,data/indexdb}`
  - Create a sample test file to verify `bun test` works
  - Install dependencies: `fast-xml-parser`, `axios`, `axios-cache-interceptor`

  **Must NOT do**:
  - Do NOT install expo-sqlite or dexie yet (platform-specific, installed in adapter tasks)
  - Do NOT create any implementation code yet

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple setup task, no complex logic
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**:
    - `git-master`: Not needed for setup

  **Parallelization**:
  - **Can Run In Parallel**: NO (must complete first)
  - **Parallel Group**: Wave 1 - sequential first
  - **Blocks**: All other tasks
  - **Blocked By**: None

  **References**:
  - Bun docs: https://bun.sh/docs/cli/init
  - tsconfig strict: https://www.typescriptlang.org/tsconfig#strict

  **Acceptance Criteria**:

  **TDD Steps:**
  - [ ] RED: Create `src/shared/lib/sample.test.ts` with failing test
  - [ ] GREEN: Create `src/shared/lib/sample.ts` to make it pass
  - [ ] REFACTOR: Remove sample files after verifying setup

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Project structure exists
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run: ls -la src/shared/
      2. Assert: directories exist (types, clients, lib, data, data/sqlite, data/indexdb)
    Expected Result: All 6 directories present
    Evidence: Terminal output captured

  Scenario: TypeScript compiles with strict mode
    Tool: Bash
    Preconditions: tsconfig.json created
    Steps:
      1. Run: bunx tsc --noEmit
      2. Assert: Exit code 0
      3. Assert: No errors in output
    Expected Result: Clean compilation
    Evidence: Terminal output shows no errors

  Scenario: Bun test runner works
    Tool: Bash
    Preconditions: Sample test file exists
    Steps:
      1. Run: bun test
      2. Assert: Output contains "pass"
      3. Assert: Exit code 0
    Expected Result: Tests pass
    Evidence: Test output captured
  ```

  **Commit**: YES
  - Message: `chore(shared): initialize project structure and test infrastructure`
  - Files: `package.json`, `tsconfig.json`, `src/shared/**`
  - Pre-commit: `bun test && bunx tsc --noEmit`

---

- [ ] 1. TypeScript Interfaces - Domain Types and BattleScribe XML

  **What to do**:
  - Create `src/shared/types/battlescribe.ts` - Raw XML parsed structure types
  - Create `src/shared/types/entities.ts` - Clean domain entity interfaces
  - Create `src/shared/types/errors.ts` - Error type hierarchy
  - Create `src/shared/types/index.ts` - Re-exports
  - Types must cover: Unit, Weapon (Ranged/Melee), Ability, Stratagem, Detachment, Keyword, Faction
  - Include sync metadata types: FileSyncStatus, SyncResult

  **Must NOT do**:
  - Do NOT implement any logic - types only
  - Do NOT use `any` type
  - Do NOT create circular dependencies between type files

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Requires careful type design and understanding of BattleScribe schema
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No UI involved

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Tasks 3, 4, 5, 6, 7
  - **Blocked By**: Task 0

  **References**:

  **BattleScribe XML Structure** (from research):
  ```xml
  <!-- .gst file structure -->
  <gameSystem id="..." name="Warhammer 40,000 10th Edition" revision="87">
    <profileTypes>
      <profileType id="..." name="Unit">
        <characteristicTypes>
          <characteristicType id="..." name="M"/>  <!-- Movement -->
          <characteristicType id="..." name="T"/>  <!-- Toughness -->
          <characteristicType id="..." name="SV"/> <!-- Save -->
          <characteristicType id="..." name="W"/>  <!-- Wounds -->
          <characteristicType id="..." name="LD"/> <!-- Leadership -->
          <characteristicType id="..." name="OC"/> <!-- Objective Control -->
        </characteristicTypes>
      </profileType>
    </profileTypes>
  </gameSystem>
  
  <!-- .cat file structure -->
  <catalogue id="..." name="Imperium - Space Marines" revision="15">
    <selectionEntries>
      <selectionEntry id="..." name="Intercessor Squad" type="unit">
        <profiles>
          <profile id="..." name="Intercessor" typeId="..." typeName="Unit">
            <characteristics>
              <characteristic name="M" typeId="...">6"</characteristic>
              <characteristic name="T" typeId="...">4</characteristic>
            </characteristics>
          </profile>
        </profiles>
        <selectionEntries><!-- nested selections --></selectionEntries>
      </selectionEntry>
    </selectionEntries>
  </catalogue>
  ```

  **Type Design Pattern** (from research):
  ```typescript
  // Entity base pattern
  interface Entity {
    id: string;
    name: string;
    sourceFile: string;
    sourceSha: string;
  }
  
  // Discriminated union for weapons
  type Weapon = RangedWeapon | MeleeWeapon;
  interface RangedWeapon extends Entity {
    type: 'ranged';
    range: string;
    // ...
  }
  ```

  **Acceptance Criteria**:

  **TDD Steps:**
  - [ ] RED: Create `src/shared/types/entities.test.ts` - type guard tests
  - [ ] GREEN: Define types that satisfy type guards
  - [ ] REFACTOR: Ensure no redundant types

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: All type files compile without errors
    Tool: Bash
    Preconditions: Type files created
    Steps:
      1. Run: bunx tsc --noEmit src/shared/types/*.ts
      2. Assert: Exit code 0
      3. Assert: No type errors in output
    Expected Result: Clean compilation
    Evidence: Terminal output shows no errors

  Scenario: Type guards work correctly
    Tool: Bash
    Preconditions: Type tests created
    Steps:
      1. Run: bun test src/shared/types/
      2. Assert: All tests pass
      3. Assert: Output contains "isRangedWeapon" test
      4. Assert: Output contains "isMeleeWeapon" test
    Expected Result: Type guards validated
    Evidence: Test output captured

  Scenario: No 'any' types in public interfaces
    Tool: Bash
    Preconditions: Type files created
    Steps:
      1. Run: grep -r "any" src/shared/types/*.ts | grep -v "test.ts" | grep -v "//"
      2. Assert: No matches (empty output or only in comments)
    Expected Result: No untyped any usage
    Evidence: grep output captured
  ```

  **Commit**: YES
  - Message: `feat(shared): add TypeScript interfaces for BattleScribe entities and sync types`
  - Files: `src/shared/types/*.ts`
  - Pre-commit: `bun test src/shared/types/ && bunx tsc --noEmit`

---

- [ ] 2. GitHub API Client with Caching and Rate Limit Handling

  **What to do**:
  - Create `src/shared/clients/github.ts` with GitHubClient class
  - Implement: `listFiles(repo, path)` - returns file list with SHA
  - Implement: `getFileSha(repo, path)` - returns SHA for specific file
  - Implement: `downloadFile(repo, path)` - returns raw file content
  - Implement: `checkForUpdates(repo, path, knownSha)` - returns boolean using ETag
  - Use axios-cache-interceptor for caching
  - Handle rate limits with exponential backoff
  - Create typed error classes: GitHubApiError, RateLimitError, NetworkError

  **Must NOT do**:
  - Do NOT parse XML in this client (raw content only)
  - Do NOT store data (that's DataManager's job)
  - Do NOT hardcode BSData repo - accept as parameter

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Network client with async patterns, error handling
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**:
    - `playwright`: Not browser automation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 7
  - **Blocked By**: Task 0

  **References**:

  **GitHub API Response Types** (from research):
  ```typescript
  interface GitHubFileInfo {
    name: string;
    path: string;
    sha: string;
    size: number;
    download_url: string;
    type: 'file' | 'dir';
  }
  ```

  **axios-cache-interceptor setup** (from research):
  ```typescript
  import Axios from 'axios';
  import { setupCache } from 'axios-cache-interceptor';
  
  const axios = setupCache(Axios.create(), {
    ttl: 1000 * 60 * 15, // 15 min
    etag: true,
    modifiedSince: true,
  });
  ```

  **Rate limit headers** (from GitHub docs):
  - `x-ratelimit-remaining`: Requests left
  - `x-ratelimit-reset`: Unix timestamp when limit resets
  - `retry-after`: Seconds to wait (on 429)

  **Acceptance Criteria**:

  **TDD Steps:**
  - [ ] RED: Write test for `listFiles` with mocked axios
  - [ ] GREEN: Implement `listFiles` to pass test
  - [ ] RED: Write test for rate limit handling (mock 429 response)
  - [ ] GREEN: Implement exponential backoff
  - [ ] REFACTOR: Extract common retry logic

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: List files returns typed array
    Tool: Bash
    Preconditions: GitHub client created with mocked axios
    Steps:
      1. Run: bun test src/shared/clients/github.test.ts --test-name-pattern "listFiles"
      2. Assert: Test passes
      3. Assert: Response type is GitHubFileInfo[]
    Expected Result: Typed file list returned
    Evidence: Test output captured

  Scenario: Rate limit triggers retry with backoff
    Tool: Bash
    Preconditions: Test mocks 429 then 200 response
    Steps:
      1. Run: bun test src/shared/clients/github.test.ts --test-name-pattern "rate limit"
      2. Assert: Test passes
      3. Assert: Retry occurred (mock called twice)
    Expected Result: Automatic retry on rate limit
    Evidence: Test output with mock call count

  Scenario: ETag caching prevents unnecessary downloads
    Tool: Bash
    Preconditions: Test with ETag mock
    Steps:
      1. Run: bun test src/shared/clients/github.test.ts --test-name-pattern "ETag"
      2. Assert: 304 response returns cached data
      3. Assert: No rate limit consumed
    Expected Result: Conditional request works
    Evidence: Test output captured

  Scenario: Network error throws typed NetworkError
    Tool: Bash
    Preconditions: Test mocks network failure
    Steps:
      1. Run: bun test src/shared/clients/github.test.ts --test-name-pattern "NetworkError"
      2. Assert: Error is instanceof NetworkError
      3. Assert: Error has code property
    Expected Result: Typed error thrown
    Evidence: Test output captured
  ```

  **Commit**: YES
  - Message: `feat(shared): add GitHub API client with caching and rate limit handling`
  - Files: `src/shared/clients/github.ts`, `src/shared/clients/github.test.ts`
  - Pre-commit: `bun test src/shared/clients/`

---

### Wave 2: Core Components

- [ ] 3. Database Adapter Interface (Strategy Pattern)

  **What to do**:
  - Create `src/shared/data/adapter.ts` with abstract DatabaseAdapter interface
  - Define CRUD methods: `get`, `getAll`, `getByField`, `put`, `putMany`, `delete`, `deleteAll`
  - Define transaction method: `transaction<T>(fn: () => Promise<T>): Promise<T>`
  - Define initialization: `initialize(): Promise<void>`, `close(): Promise<void>`
  - Define sync metadata methods: `getSyncStatus(fileKey)`, `setSyncStatus(fileKey, sha, timestamp)`
  - Include type discriminator: `readonly platform: 'sqlite' | 'indexeddb'`
  - Create `src/shared/data/types.ts` for database-specific types (table schemas)

  **Must NOT do**:
  - Do NOT implement concrete adapters here (that's Task 5/6)
  - Do NOT include platform-specific imports
  - Do NOT add methods that can't be implemented by both SQLite and IndexedDB

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Critical architecture decision, interface design
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**:
    - All skills: Pure TypeScript interface design

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 4)
  - **Blocks**: Tasks 5, 6, 7
  - **Blocked By**: Task 1

  **References**:

  **Strategy Pattern from TanStack DB** (from research):
  ```typescript
  export abstract class BaseStorageAdapter implements StorageAdapter {
    abstract get(key: string): Promise<string | null>
    abstract set(key: string, value: string): Promise<void>
    abstract delete(key: string): Promise<void>
  }
  ```

  **Entity constraint pattern**:
  ```typescript
  interface Entity {
    id: string;
  }
  
  interface DatabaseAdapter<TSchema extends Record<string, Entity>> {
    get<K extends keyof TSchema>(
      store: K,
      id: string
    ): Promise<TSchema[K] | null>;
  }
  ```

  **Acceptance Criteria**:

  **TDD Steps:**
  - [ ] RED: Write interface compliance test (mock adapter must implement all methods)
  - [ ] GREEN: Define interface that TypeScript enforces
  - [ ] REFACTOR: Ensure generic constraints are minimal but sufficient

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Interface is implementable (mock test)
    Tool: Bash
    Preconditions: Adapter interface created
    Steps:
      1. Run: bun test src/shared/data/adapter.test.ts
      2. Assert: Mock adapter compiles and passes type checks
      3. Assert: All interface methods are tested
    Expected Result: Interface is sound
    Evidence: Test output captured

  Scenario: Generic constraints work with entity types
    Tool: Bash
    Preconditions: Types from Task 1 available
    Steps:
      1. Run: bunx tsc --noEmit
      2. Assert: No errors when using adapter with entity types
    Expected Result: Type safety maintained
    Evidence: TypeScript output captured

  Scenario: Platform discriminator is readonly
    Tool: Bash
    Preconditions: Interface defined
    Steps:
      1. Create test that tries to modify platform property
      2. Run: bunx tsc --noEmit
      3. Assert: TypeScript error for readonly violation
    Expected Result: Platform is immutable
    Evidence: Expected TS error in output
  ```

  **Commit**: YES
  - Message: `feat(shared): add DatabaseAdapter interface with Strategy Pattern`
  - Files: `src/shared/data/adapter.ts`, `src/shared/data/types.ts`, `src/shared/data/adapter.test.ts`
  - Pre-commit: `bun test src/shared/data/adapter.test.ts && bunx tsc --noEmit`

---

- [ ] 4. BattleScribe XML Parser

  **What to do**:
  - Create `src/shared/lib/xml-parser.ts` with parsing functions
  - Implement: `parseGameSystem(xml: string): GameSystem` - parse .gst files
  - Implement: `parseCatalogue(xml: string, gameSystem: GameSystem): Catalogue` - parse .cat files
  - Implement: `extractUnits(catalogue: Catalogue): Unit[]` - extract units
  - Implement: `extractWeapons(catalogue: Catalogue): Weapon[]` - extract weapons
  - Implement: `extractAbilities(catalogue: Catalogue): Ability[]` - extract abilities
  - Use fast-xml-parser with proper configuration
  - Handle missing optional fields defensively
  - Throw XmlParseError with context on parse failures

  **Must NOT do**:
  - Do NOT fetch XML (that's GitHubClient's job)
  - Do NOT store parsed data (that's DataManager's job)
  - Do NOT silently ignore parse errors

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Complex XML structure, needs careful mapping
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**:
    - All skills: Pure data transformation logic

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 3)
  - **Blocks**: Task 7
  - **Blocked By**: Task 1

  **References**:

  **fast-xml-parser configuration** (from research):
  ```typescript
  import { XMLParser } from 'fast-xml-parser';
  
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseTagValue: true,
    trimValues: true,
    isArray: (name, jpath) => {
      // Force arrays for elements that can be multiple
      const alwaysArray = [
        'selectionEntry', 'profile', 'characteristic',
        'selectionEntryGroup', 'entryLink', 'infoLink'
      ];
      return alwaysArray.includes(name);
    }
  });
  ```

  **BattleScribe element mapping**:
  - `<selectionEntry type="unit">` -> Unit entity
  - `<profile typeName="Ranged Weapons">` -> RangedWeapon entity
  - `<profile typeName="Melee Weapons">` -> MeleeWeapon entity
  - `<profile typeName="Abilities">` -> Ability entity
  - `<characteristic name="M">` -> Unit.movement

  **Acceptance Criteria**:

  **TDD Steps:**
  - [ ] RED: Write test with sample .gst XML snippet, assert GameSystem returned
  - [ ] GREEN: Implement parseGameSystem
  - [ ] RED: Write test with sample .cat XML snippet, assert units extracted
  - [ ] GREEN: Implement parseCatalogue and extractUnits
  - [ ] RED: Write test for malformed XML, assert XmlParseError thrown
  - [ ] GREEN: Add error handling
  - [ ] REFACTOR: Extract common parsing helpers

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Parse minimal gameSystem XML
    Tool: Bash
    Preconditions: Test with hardcoded XML snippet
    Steps:
      1. Run: bun test src/shared/lib/xml-parser.test.ts --test-name-pattern "gameSystem"
      2. Assert: Returns GameSystem with correct id, name, revision
      3. Assert: profileTypes array populated
    Expected Result: GameSystem parsed correctly
    Evidence: Test output captured

  Scenario: Parse catalogue and extract units
    Tool: Bash
    Preconditions: Test with hardcoded catalogue XML
    Steps:
      1. Run: bun test src/shared/lib/xml-parser.test.ts --test-name-pattern "extractUnits"
      2. Assert: Returns Unit[] with correct properties
      3. Assert: Unit has id, name, movement, toughness, save, wounds
    Expected Result: Units extracted with stats
    Evidence: Test output captured

  Scenario: Malformed XML throws XmlParseError
    Tool: Bash
    Preconditions: Test with invalid XML
    Steps:
      1. Run: bun test src/shared/lib/xml-parser.test.ts --test-name-pattern "malformed"
      2. Assert: XmlParseError thrown
      3. Assert: Error message contains position/context
    Expected Result: Descriptive error thrown
    Evidence: Test output captured

  Scenario: Missing optional fields don't crash
    Tool: Bash
    Preconditions: Test with XML missing optional elements
    Steps:
      1. Run: bun test src/shared/lib/xml-parser.test.ts --test-name-pattern "optional"
      2. Assert: Parsing succeeds
      3. Assert: Missing fields are undefined, not error
    Expected Result: Defensive parsing works
    Evidence: Test output captured
  ```

  **Commit**: YES
  - Message: `feat(shared): add BattleScribe XML parser for .gst and .cat files`
  - Files: `src/shared/lib/xml-parser.ts`, `src/shared/lib/xml-parser.test.ts`
  - Pre-commit: `bun test src/shared/lib/xml-parser.test.ts`

---

### Wave 3: Database Adapters

- [ ] 5. SQLite Adapter Implementation (expo-sqlite)

  **What to do**:
  - Install expo-sqlite: `bun add expo-sqlite`
  - Create `src/shared/data/sqlite/adapter.ts` implementing DatabaseAdapter
  - Create `src/shared/data/sqlite/migrations.ts` for schema versioning
  - Create `src/shared/data/sqlite/index.ts` for exports
  - Implement all interface methods using expo-sqlite async API
  - Use `db.withExclusiveTransactionAsync()` for transactions
  - Use PRAGMA user_version for migration tracking
  - Create tables: units, weapons, abilities, stratagems, detachments, sync_status

  **Must NOT do**:
  - Do NOT use synchronous API methods
  - Do NOT skip migrations (always check and apply)
  - Do NOT expose database handle outside adapter

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Database implementation with async patterns
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**:
    - All skills: SQLite-specific implementation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 6)
  - **Blocks**: Task 7
  - **Blocked By**: Task 3

  **References**:

  **expo-sqlite async patterns** (from research):
  ```typescript
  import * as SQLite from 'expo-sqlite';
  
  const db = await SQLite.openDatabaseAsync('armoury.db');
  
  // Run with transaction
  await db.withExclusiveTransactionAsync(async () => {
    await db.runAsync('INSERT INTO units (id, name) VALUES (?, ?)', [id, name]);
  });
  
  // Query with types
  const unit = await db.getFirstAsync<Unit>('SELECT * FROM units WHERE id = ?', [id]);
  const units = await db.getAllAsync<Unit>('SELECT * FROM units');
  ```

  **Migration pattern** (from research):
  ```typescript
  async function migrate(db: SQLiteDatabase) {
    const { user_version } = await db.getFirstAsync<{user_version: number}>('PRAGMA user_version');
    
    if (user_version < 1) {
      await db.execAsync(`CREATE TABLE units (...)`);
      await db.execAsync('PRAGMA user_version = 1');
    }
  }
  ```

  **Acceptance Criteria**:

  **TDD Steps:**
  - [ ] RED: Write test for initialize() - expect tables created
  - [ ] GREEN: Implement initialize with migrations
  - [ ] RED: Write test for put/get - expect round-trip works
  - [ ] GREEN: Implement CRUD methods
  - [ ] RED: Write test for transaction rollback on error
  - [ ] GREEN: Implement transaction with error handling
  - [ ] REFACTOR: Ensure SQL queries are parameterized

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Initialize creates all tables
    Tool: Bash
    Preconditions: Fresh database
    Steps:
      1. Run: bun test src/shared/data/sqlite/adapter.test.ts --test-name-pattern "initialize"
      2. Assert: All 6 tables exist (units, weapons, abilities, stratagems, detachments, sync_status)
      3. Assert: PRAGMA user_version is set
    Expected Result: Schema created
    Evidence: Test output captured

  Scenario: CRUD operations work
    Tool: Bash
    Preconditions: Database initialized
    Steps:
      1. Run: bun test src/shared/data/sqlite/adapter.test.ts --test-name-pattern "CRUD"
      2. Assert: put() stores entity
      3. Assert: get() retrieves same entity
      4. Assert: delete() removes entity
      5. Assert: getAll() returns empty array after delete
    Expected Result: CRUD cycle works
    Evidence: Test output captured

  Scenario: Transaction rolls back on error
    Tool: Bash
    Preconditions: Database with existing data
    Steps:
      1. Run: bun test src/shared/data/sqlite/adapter.test.ts --test-name-pattern "rollback"
      2. Assert: Error thrown mid-transaction
      3. Assert: Data unchanged after error
    Expected Result: Atomic transactions
    Evidence: Test output captured

  Scenario: Sync status tracking works
    Tool: Bash
    Preconditions: Database initialized
    Steps:
      1. Run: bun test src/shared/data/sqlite/adapter.test.ts --test-name-pattern "syncStatus"
      2. Assert: setSyncStatus stores sha and timestamp
      3. Assert: getSyncStatus retrieves correct values
    Expected Result: Sync metadata persisted
    Evidence: Test output captured
  ```

  **Commit**: YES
  - Message: `feat(shared): add SQLite adapter implementation with expo-sqlite`
  - Files: `src/shared/data/sqlite/*.ts`
  - Pre-commit: `bun test src/shared/data/sqlite/`

---

- [ ] 6. IndexedDB Adapter Implementation (Dexie)

  **What to do**:
  - Install dexie: `bun add dexie`
  - Create `src/shared/data/indexdb/adapter.ts` implementing DatabaseAdapter
  - Create `src/shared/data/indexdb/schema.ts` for Dexie schema definition
  - Create `src/shared/data/indexdb/index.ts` for exports
  - Implement all interface methods using Dexie API
  - Use `db.transaction('rw', ...)` for transactions
  - Use Dexie's built-in version().stores() for migrations
  - Create stores: units, weapons, abilities, stratagems, detachments, syncStatus

  **Must NOT do**:
  - Do NOT use raw IndexedDB API (use Dexie abstractions)
  - Do NOT skip schema versioning
  - Do NOT expose Dexie instance outside adapter

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Database implementation with async patterns
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**:
    - All skills: IndexedDB-specific implementation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 5)
  - **Blocks**: Task 7
  - **Blocked By**: Task 3

  **References**:

  **Dexie TypeScript patterns** (from research):
  ```typescript
  import Dexie, { EntityTable } from 'dexie';
  import { Unit, Weapon, SyncStatus } from '../types';
  
  const db = new Dexie('armoury') as Dexie & {
    units: EntityTable<Unit, 'id'>;
    weapons: EntityTable<Weapon, 'id'>;
    syncStatus: EntityTable<SyncStatus, 'fileKey'>;
  };
  
  db.version(1).stores({
    units: 'id, name, factionId',
    weapons: 'id, name, type',
    syncStatus: 'fileKey'
  });
  ```

  **Dexie transaction pattern**:
  ```typescript
  await db.transaction('rw', db.units, db.weapons, async () => {
    await db.units.put(unit);
    await db.weapons.bulkPut(weapons);
  });
  ```

  **Acceptance Criteria**:

  **TDD Steps:**
  - [ ] RED: Write test for initialize() - expect stores created
  - [ ] GREEN: Implement schema with Dexie
  - [ ] RED: Write test for put/get - expect round-trip works
  - [ ] GREEN: Implement CRUD methods
  - [ ] RED: Write test for transaction rollback on error
  - [ ] GREEN: Implement transaction with error handling
  - [ ] REFACTOR: Ensure consistent API with SQLite adapter

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Initialize creates all stores
    Tool: Bash
    Preconditions: Fresh IndexedDB (delete before test)
    Steps:
      1. Run: bun test src/shared/data/indexdb/adapter.test.ts --test-name-pattern "initialize"
      2. Assert: All stores exist (units, weapons, abilities, stratagems, detachments, syncStatus)
    Expected Result: Schema created
    Evidence: Test output captured

  Scenario: CRUD operations work
    Tool: Bash
    Preconditions: Database initialized
    Steps:
      1. Run: bun test src/shared/data/indexdb/adapter.test.ts --test-name-pattern "CRUD"
      2. Assert: put() stores entity
      3. Assert: get() retrieves same entity
      4. Assert: delete() removes entity
      5. Assert: getAll() returns empty array after delete
    Expected Result: CRUD cycle works
    Evidence: Test output captured

  Scenario: Transaction rolls back on error
    Tool: Bash
    Preconditions: Database with existing data
    Steps:
      1. Run: bun test src/shared/data/indexdb/adapter.test.ts --test-name-pattern "rollback"
      2. Assert: Error thrown mid-transaction causes rollback
      3. Assert: Data unchanged after error
    Expected Result: Atomic transactions
    Evidence: Test output captured

  Scenario: API matches SQLite adapter
    Tool: Bash
    Preconditions: Both adapters implemented
    Steps:
      1. Run: bunx tsc --noEmit
      2. Assert: IndexedDBAdapter implements DatabaseAdapter
      3. Assert: Same method signatures as SQLiteAdapter
    Expected Result: Interchangeable adapters
    Evidence: TypeScript output captured
  ```

  **Commit**: YES
  - Message: `feat(shared): add IndexedDB adapter implementation with Dexie`
  - Files: `src/shared/data/indexdb/*.ts`
  - Pre-commit: `bun test src/shared/data/indexdb/`

---

### Wave 4: Integration

- [ ] 7. DataManager Implementation with DI

  **What to do**:
  - Create `src/shared/data-manager.ts` as the main orchestrator
  - Implement factory: `createDataManager(config: DataManagerConfig): DataManager`
  - Config includes: adapter instance, githubClient instance, options
  - Implement: `initialize()` - setup adapter, load core rules if needed
  - Implement: `syncCoreRules()` - check SHA, download if changed, parse, store
  - Implement: `syncFaction(factionId)` - download faction catalogue on demand
  - Implement: `getUnits(factionId?)` - query units from adapter
  - Implement: `getWeapons(unitId?)` - query weapons
  - Implement: `getSyncStatus()` - return current sync state
  - Wire together: GitHubClient -> XmlParser -> DatabaseAdapter

  **Must NOT do**:
  - Do NOT create adapter internally (accept via DI)
  - Do NOT hardcode BSData repo URL (accept in config)
  - Do NOT expose internal state directly

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Core orchestration, dependency injection, complex async flows
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**:
    - All skills: Pure orchestration logic

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 - sequential
  - **Blocks**: Task 8
  - **Blocked By**: Tasks 2, 4, 5, 6

  **References**:

  **DI Factory Pattern**:
  ```typescript
  interface DataManagerConfig {
    adapter: DatabaseAdapter;
    githubClient: GitHubClient;
    repo: { owner: string; name: string };
    coreRulesPath: string; // "Warhammer 40,000.gst"
  }
  
  function createDataManager(config: DataManagerConfig): DataManager {
    return new DataManagerImpl(config);
  }
  ```

  **Sync flow**:
  ```
  syncCoreRules():
    1. getSyncStatus('core') from adapter
    2. checkForUpdates(repo, path, knownSha) via githubClient
    3. if changed: downloadFile() -> parseGameSystem() -> adapter.putMany()
    4. adapter.setSyncStatus('core', newSha, now)
  ```

  **Acceptance Criteria**:

  **TDD Steps:**
  - [ ] RED: Write test for createDataManager - returns DataManager
  - [ ] GREEN: Implement factory and class shell
  - [ ] RED: Write test for syncCoreRules with mocked dependencies
  - [ ] GREEN: Implement sync flow
  - [ ] RED: Write test for getUnits after sync
  - [ ] GREEN: Implement query methods
  - [ ] REFACTOR: Extract common sync logic

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Factory creates DataManager with injected dependencies
    Tool: Bash
    Preconditions: All dependencies mocked
    Steps:
      1. Run: bun test src/shared/data-manager.test.ts --test-name-pattern "factory"
      2. Assert: createDataManager returns DataManager instance
      3. Assert: Injected adapter is used (mock called)
    Expected Result: DI works correctly
    Evidence: Test output captured

  Scenario: syncCoreRules fetches, parses, and stores
    Tool: Bash
    Preconditions: Mocked GitHub returning sample XML
    Steps:
      1. Run: bun test src/shared/data-manager.test.ts --test-name-pattern "syncCoreRules"
      2. Assert: GitHubClient.downloadFile called
      3. Assert: XmlParser.parseGameSystem called
      4. Assert: Adapter.putMany called with parsed data
      5. Assert: Adapter.setSyncStatus called with new SHA
    Expected Result: Full sync flow executes
    Evidence: Test output with mock call verification

  Scenario: syncCoreRules skips download when SHA unchanged
    Tool: Bash
    Preconditions: Mock checkForUpdates returns false
    Steps:
      1. Run: bun test src/shared/data-manager.test.ts --test-name-pattern "skip download"
      2. Assert: checkForUpdates called
      3. Assert: downloadFile NOT called
    Expected Result: Efficient sync check
    Evidence: Test output showing mock not called

  Scenario: getUnits returns stored units
    Tool: Bash
    Preconditions: Mock adapter with test data
    Steps:
      1. Run: bun test src/shared/data-manager.test.ts --test-name-pattern "getUnits"
      2. Assert: Returns Unit[] from adapter
      3. Assert: Filters by factionId when provided
    Expected Result: Query delegation works
    Evidence: Test output captured

  Scenario: Error propagates with context
    Tool: Bash
    Preconditions: Mock GitHub throws error
    Steps:
      1. Run: bun test src/shared/data-manager.test.ts --test-name-pattern "error"
      2. Assert: Error bubbles up with original cause
      3. Assert: Error type is DataLayerError subclass
    Expected Result: Fail fast with context
    Evidence: Test output captured
  ```

  **Commit**: YES
  - Message: `feat(shared): add DataManager with dependency injection and sync logic`
  - Files: `src/shared/data-manager.ts`, `src/shared/data-manager.test.ts`
  - Pre-commit: `bun test src/shared/data-manager.test.ts`

---

- [ ] 8. Integration Tests and Public API Exports

  **What to do**:
  - Create `src/shared/index.ts` with public API exports
  - Export: `createDataManager`, `DataManager` type, `DataManagerConfig` type
  - Export: `DatabaseAdapter` type, `SQLiteAdapter`, `IndexedDBAdapter`
  - Export: `GitHubClient`, `createGitHubClient`
  - Export: All entity types from types/
  - Export: All error types
  - Create `src/shared/__tests__/integration.test.ts` for end-to-end tests
  - Test full flow: create manager -> sync -> query -> verify data

  **Must NOT do**:
  - Do NOT export internal implementation details
  - Do NOT export database handles or raw parsers
  - Do NOT skip integration tests

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Integration testing, API design
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**:
    - All skills: Final integration work

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 - final task
  - **Blocks**: None (final task)
  - **Blocked By**: Task 7

  **References**:

  **Public API surface**:
  ```typescript
  // src/shared/index.ts
  
  // Main API
  export { createDataManager } from './data-manager';
  export type { DataManager, DataManagerConfig } from './data-manager';
  
  // Adapters (for DI)
  export { SQLiteAdapter } from './data/sqlite';
  export { IndexedDBAdapter } from './data/indexdb';
  export type { DatabaseAdapter } from './data/adapter';
  
  // GitHub client (for DI)
  export { GitHubClient, createGitHubClient } from './clients/github';
  
  // Types
  export * from './types';
  ```

  **Integration test pattern**:
  ```typescript
  describe('Integration: Full sync flow', () => {
    it('syncs core rules and queries units', async () => {
      const adapter = new MockAdapter();
      const github = new MockGitHubClient();
      
      const manager = createDataManager({ adapter, github, ... });
      await manager.initialize();
      await manager.syncCoreRules();
      
      const units = await manager.getUnits();
      expect(units.length).toBeGreaterThan(0);
    });
  });
  ```

  **Acceptance Criteria**:

  **TDD Steps:**
  - [ ] RED: Write integration test for full sync flow
  - [ ] GREEN: Ensure all components work together
  - [ ] REFACTOR: Clean up exports, ensure minimal public API

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Public API exports all required types
    Tool: Bash
    Preconditions: index.ts created
    Steps:
      1. Run: bunx tsc --noEmit
      2. Create test file importing all exports
      3. Assert: All expected exports are available
    Expected Result: Complete public API
    Evidence: TypeScript output captured

  Scenario: Integration test - full sync flow
    Tool: Bash
    Preconditions: All components implemented
    Steps:
      1. Run: bun test src/shared/__tests__/integration.test.ts
      2. Assert: createDataManager succeeds
      3. Assert: syncCoreRules completes
      4. Assert: getUnits returns data
    Expected Result: End-to-end flow works
    Evidence: Test output captured

  Scenario: No internal implementation details exported
    Tool: Bash
    Preconditions: index.ts finalized
    Steps:
      1. Run: grep -E "export.*Impl|export.*Internal" src/shared/index.ts
      2. Assert: No matches (empty output)
    Expected Result: Clean public API
    Evidence: grep output empty

  Scenario: All tests pass
    Tool: Bash
    Preconditions: All tasks complete
    Steps:
      1. Run: bun test
      2. Assert: All tests pass
      3. Assert: No skipped tests
    Expected Result: 100% test pass rate
    Evidence: Full test output captured
  ```

  **Commit**: YES
  - Message: `feat(shared): add public API exports and integration tests`
  - Files: `src/shared/index.ts`, `src/shared/__tests__/integration.test.ts`
  - Pre-commit: `bun test`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 0 | `chore(shared): initialize project structure and test infrastructure` | package.json, tsconfig.json, src/shared/** | bun test |
| 1 | `feat(shared): add TypeScript interfaces for BattleScribe entities and sync types` | src/shared/types/*.ts | bun test src/shared/types/ |
| 2 | `feat(shared): add GitHub API client with caching and rate limit handling` | src/shared/clients/*.ts | bun test src/shared/clients/ |
| 3 | `feat(shared): add DatabaseAdapter interface with Strategy Pattern` | src/shared/data/adapter.ts, types.ts | bunx tsc --noEmit |
| 4 | `feat(shared): add BattleScribe XML parser for .gst and .cat files` | src/shared/lib/xml-parser.ts | bun test src/shared/lib/ |
| 5 | `feat(shared): add SQLite adapter implementation with expo-sqlite` | src/shared/data/sqlite/*.ts | bun test src/shared/data/sqlite/ |
| 6 | `feat(shared): add IndexedDB adapter implementation with Dexie` | src/shared/data/indexdb/*.ts | bun test src/shared/data/indexdb/ |
| 7 | `feat(shared): add DataManager with dependency injection and sync logic` | src/shared/data-manager.ts | bun test src/shared/ |
| 8 | `feat(shared): add public API exports and integration tests` | src/shared/index.ts, __tests__/*.ts | bun test |

---

## Success Criteria

### Verification Commands
```bash
# All tests pass
bun test

# TypeScript compiles with strict mode
bunx tsc --noEmit

# No any types in public API
grep -r "any" src/shared/index.ts src/shared/types/*.ts | grep -v test | grep -v "//"
# Expected: empty output

# Integration test passes
bun test src/shared/__tests__/integration.test.ts
```

### Final Checklist
- [ ] All "Must Have" requirements implemented
- [ ] All "Must NOT Have" guardrails respected
- [ ] All 9 tasks completed with passing tests
- [ ] Public API is minimal and well-typed
- [ ] DataManager can be instantiated with both SQLite and IndexedDB adapters
- [ ] Sync flow works: fetch -> parse -> store -> query
