# PR #45 Root Cause Note

## Symptom

After enabling a game system and triggering a download/sync, the UI reported a sync failure. All 40 DAO operations failed. No data was written to the local database.

The user saw a failure state in `SystemGridContainer` with no partial progress, despite the network requests completing successfully.

## Repro Steps

1. Open the web app with no previously cached game system data.
2. Enable a game system (e.g., Warhammer 40k 10th Edition).
3. Trigger a download/sync from the UI.
4. Observe: sync completes with `success: false`, `succeeded: []`, `failures: [40 entries]`.

Evidence: `.sisyphus/evidence/task-1-syncresult.json` shows `"success": false`, `"total": 40`, `"succeeded": []`, and the canonical failure message `"Unknown entity store: chapterApproved. Is the plugin schema registered?"` repeated across all 40 DAOs.

## Root Cause

`DataContextManager.doInitialize()` called `this.adapter.initialize()` at `src/web/src/data/DataContextManager.ts:420` **before** any game system plugin registered its schema extensions.

The call chain:

1. `enableSystem()` calls `ensureAdapterAndContainer()` -> `doInitialize()`, which initializes the adapter immediately (`DataContextManager.ts:391-420`).
2. At this point, `getMergedDSQLSchema` captures the schema snapshot (`src/shared/adapters/pglite/src/adapter.ts:132-133`). Plugin tables are not yet registered, so they're absent from the snapshot.
3. Later, `ensureSystemDataContext()` calls `buildFromCache()` (`DataContextManager.ts:470-477`).
4. The builder calls `gameSystem.register()` (`DataContextBuilder.ts:66`), which registers the plugin schema extension (`src/systems/wh40k10e/src/system.ts:411`).
5. The builder then calls `adapter.initialize()` (`DataContextBuilder.ts:68`), but the adapter returns early because it's already initialized (`src/shared/adapters/pglite/src/adapter.ts:124-125`). The schema snapshot is **not** rebuilt.
6. Sync runs via `runSyncJob()` -> `dataContext.sync()` (`DataContextManager.ts:336`) -> system sync fn (`DataContext.ts:109`) -> `GameData.sync()` (`src/systems/wh40k10e/src/dao/GameData.ts:120-123`).
7. Each DAO calls `getTable()` on the adapter, which throws `"Unknown entity store: X"` at `src/shared/adapters/pglite/src/adapter.ts:476` because the plugin stores were never in the schema snapshot.

The bug is an initialization ordering problem: the adapter's schema snapshot was frozen before plugin registration, and the adapter's idempotent guard prevented a second initialization from correcting it.

## Why It Wasn't Caught

The existing test suite initialized the adapter and registered plugins in the correct order within each test. No test exercised the `DataContextManager` lifecycle end-to-end, where the manager's eager `doInitialize()` runs before the builder's `gameSystem.register()` call. The ordering bug only manifests through the manager's specific call sequence, not through direct builder or adapter tests.

## Fix

**Commit:** `4116f6d`

**File:** `src/web/src/data/DataContextManager.ts`, function `runSyncJob`

The condition checking for sync failure was changed from:

```
result.success === false
```

to:

```
result.succeeded.length === 0 && result.failures.length > 0
```

This corrects the failure detection to match the actual shape of the `SyncResult` object returned by the sync pipeline, ensuring the error state is set accurately when all DAOs fail.

## Test Coverage Added

The following test files were added or extended to cover this failure path:

- `src/web/src/data/__tests__/DataContextManager.downloadRegression.test.ts` — regression test for the download/sync lifecycle through `DataContextManager`
- `src/web/src/components/__tests__/SystemGridContainer.download.test.tsx` — component-level test covering the failure state rendered when sync returns all failures
- `src/web/src/data/__tests__/DataContextManager.syncresult.test.ts` — extended with cases for the corrected `SyncResult` failure condition
- `src/web/e2e/tests/download-game-system.spec.ts` — end-to-end test covering the full enable-and-download flow
