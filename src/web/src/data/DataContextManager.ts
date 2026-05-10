import { BehaviorSubject, EMPTY, Subject, catchError, concatMap, distinctUntilChanged, from, map } from 'rxjs';
import type { Observable, Subscription } from 'rxjs';
import { DataContextBuilder, type DataContext } from '@armoury/data-context';
import { SyncProgressCollector, type DatabaseAdapter, type GameSystem } from '@armoury/data-dao';
import type { SyncResult } from '@armoury/data-dao';
import {
    TOKENS,
    createContainerWithModules,
    coreModule,
    type AdapterFactoryFn,
    type ClientFactoryFn,
} from '@armoury/di';
import { webModule } from '@armoury/di/web';
import type { IGitHubClient } from '@armoury/clients-github';
import type { IWahapediaClient } from '@armoury/clients-wahapedia';
import type { QueryClient } from '@tanstack/react-query';
import type { Container } from 'inversify';
import * as Sentry from '@sentry/nextjs';

import { getQueryClient } from '@/lib/getQueryClient.js';
import type { ManagerState, SystemSyncState } from '@/data/managerState.js';
import { initialManagerState, SyncStatus } from '@/data/managerState.js';

/**
 * @requirements
 * - REQ-WEB-MGR-001: Single PGliteAdapter instance, created lazily on first enableSystem, closed only in dispose().
 * - REQ-WEB-MGR-002: Single DI container shared across all DataContexts.
 * - REQ-WEB-MGR-003: Sync queue is sequential FIFO (rxjs concatMap) with per-system dedup.
 * - REQ-WEB-MGR-004: Per-system sync state changes do not affect active DataContext reference stability.
 * - REQ-WEB-MGR-005: probeSyncedSystems uses the same adapter — no second instance.
 * - REQ-WEB-MGR-006: enableSystem skips sync when the system was already synced in the current
 *   browser session AND its data is still present in the adapter cache. Session scope is
 *   per-tab via sessionStorage, so refreshing the tab reuses the cached data, but a new
 *   tab/session re-syncs to pick up upstream changes.
 */

const SESSION_SYNC_FLAG_PREFIX = 'armoury:synced:';

export type GameSystemDefinition = GameSystem;

interface SyncJob {
    systemId: string;
}

/**
 * Manages DataContext instances and sync execution for enabled game systems.
 */
export class DataContextManager {
    private readonly state$ = new BehaviorSubject<ManagerState>(initialManagerState);
    private readonly activeDataContext$ = new BehaviorSubject<DataContext | null>(null);
    private readonly progress$ = new BehaviorSubject<SyncProgressCollector | null>(null);
    private readonly lastSyncResults$ = new BehaviorSubject<Record<string, SyncResult | null>>({});
    private readonly jobs$ = new Subject<SyncJob>();

    private readonly queueSubscription: Subscription;
    private readonly pendingSystemIds = new Set<string>();
    private readonly inflightSystemSyncs = new Set<string>();
    private readonly systemsById = new Map<string, GameSystemDefinition>();
    private readonly dataContextsBySystemId = new Map<string, DataContext>();
    /**
     * Per-system progress collector — the SAME instance registered into the DataContext
     * via the DI container. Emitted via `progress$` so UI consumers observe the live
     * collector that the sync pipeline actually writes to. Reset between sync runs.
     */
    private readonly progressCollectorsBySystemId = new Map<string, SyncProgressCollector>();

    private adapter: DatabaseAdapter | null = null;
    private container: Container | null = null;
    private githubClient: IGitHubClient | null = null;
    private wahapediaClient: IWahapediaClient | null = null;
    /** Tracks a single in-flight adapter/container initialization to make concurrent callers idempotent. */
    private adapterInitPromise: Promise<void> | null = null;
    private disposed = false;

    public constructor() {
        this.enableSystem = this.enableSystem.bind(this);
        this.disableSystem = this.disableSystem.bind(this);
        this.setActiveSystem = this.setActiveSystem.bind(this);
        this.probeSyncedSystems = this.probeSyncedSystems.bind(this);
        this.rawQuery = this.rawQuery.bind(this);
        this.dispose = this.dispose.bind(this);

        this.queueSubscription = this.jobs$
            .pipe(
                concatMap((job) =>
                    from(this.runSyncJob(job.systemId)).pipe(
                        catchError((error: unknown) => {
                            Sentry.captureException(error, {
                                tags: { area: 'data-context-manager', operation: 'sync-queue' },
                            });
                            this.updateSystemSyncState(job.systemId, {
                                status: SyncStatus.Error,
                                error: error instanceof Error ? error.message : 'Failed to sync system',
                            });

                            return EMPTY;
                        }),
                    ),
                ),
            )
            .subscribe();
    }

    /** Returns a stream of manager state snapshots. */
    public state(): Observable<ManagerState> {
        return this.state$.asObservable();
    }

    /** Returns the current manager state synchronously. */
    public getSnapshot(): ManagerState {
        return this.state$.value;
    }

    /** Returns a stream of the active DataContext instance reference. */
    public selectActiveDataContext(): Observable<DataContext | null> {
        return this.activeDataContext$.asObservable();
    }

    /** Returns the active DataContext instance synchronously. */
    public getActiveDataContextSnapshot(): DataContext | null {
        return this.activeDataContext$.value;
    }

    /** Returns a stream of the current sync progress collector. */
    public selectSyncProgress(): Observable<SyncProgressCollector | null> {
        return this.progress$.asObservable();
    }

    /** Returns the current sync progress collector synchronously. */
    public getSyncProgressSnapshot(): SyncProgressCollector | null {
        return this.progress$.value;
    }

    /** Returns a stream of a specific system's sync state. */
    public selectSystem(systemId: string): Observable<SystemSyncState | undefined> {
        return this.state$.pipe(
            map((state) => state.systemSyncStates[systemId]),
            distinctUntilChanged(),
        );
    }

    /** Returns a stream of the last SyncResult for a specific system id. */
    public selectLastSyncResult(systemId: string): Observable<SyncResult | null> {
        return this.lastSyncResults$.pipe(
            map((results) => results[systemId] ?? null),
            distinctUntilChanged(),
        );
    }

    /** Returns the last SyncResult snapshot for a specific system id. */
    public getLastSyncResultSnapshot(systemId: string): SyncResult | null {
        return this.lastSyncResults$.value[systemId] ?? null;
    }

    /** Returns true while runSyncJob is actively executing for the given system. */
    public hasInflightSystemSync(systemId: string): boolean {
        return this.inflightSystemSyncs.has(systemId);
    }

    /** Enables a game system and enqueues a sync job. */
    public async enableSystem(system: GameSystemDefinition): Promise<void> {
        this.assertNotDisposed();
        this.systemsById.set(system.id, system);

        await this.ensureAdapterAndContainer();
        await this.ensureSystemDataContext(system);

        /**
         * Skip sync when this system was already synced in the current browser session
         * AND the adapter still has cached data on disk. Both conditions are required:
         * the session flag alone is insufficient if the user cleared IndexedDB, and the
         * cache alone would suppress sync forever across sessions (no freshness guarantee).
         */
        if (this.readSessionSyncFlag(system.id)) {
            const probed = await this.probeSyncedSystems();

            if (probed[system.id] === true) {
                this.updateSystemSyncState(system.id, {
                    systemId: system.id,
                    status: SyncStatus.Synced,
                    hasCache: true,
                    attempts: 0,
                    error: undefined,
                });
                this.setActiveSystem(system.id);
                this.patchState({ status: 'ready', error: undefined });

                return;
            }
        }

        this.updateSystemSyncState(system.id, {
            systemId: system.id,
            status: SyncStatus.Pending,
            hasCache: false,
            attempts: 0,
            error: undefined,
        });

        this.setActiveSystem(system.id);
        this.enqueueSync(system.id);
    }

    /** Disables a game system and removes associated state and context. */
    public async disableSystem(systemId: string): Promise<void> {
        this.assertNotDisposed();

        this.pendingSystemIds.delete(systemId);
        this.systemsById.delete(systemId);

        const dataContext = this.dataContextsBySystemId.get(systemId);

        if (dataContext) {
            await dataContext.close();
            this.dataContextsBySystemId.delete(systemId);
        }

        this.progressCollectorsBySystemId.delete(systemId);

        const nextResults = { ...this.lastSyncResults$.value };
        delete nextResults[systemId];
        this.lastSyncResults$.next(nextResults);

        this.removeSystemState(systemId);

        if (this.state$.value.activeSystemId === systemId) {
            this.setActiveSystem(null);
        }
    }

    /** Sets the active system identifier and active DataContext reference. */
    public setActiveSystem(systemId: string | null): void {
        this.assertNotDisposed();

        const activeDataContext = systemId ? (this.dataContextsBySystemId.get(systemId) ?? null) : null;
        this.activeDataContext$.next(activeDataContext);
        this.patchState({ activeSystemId: systemId });
    }

    /** Probes currently-enabled systems for existing synced cache in the active adapter. */
    public async probeSyncedSystems(): Promise<Record<string, boolean>> {
        this.assertNotDisposed();

        if (!this.adapter) {
            return {};
        }

        const statuses = await this.adapter.getAllSyncStatuses();
        const fileKeys = statuses.map((status) => status.fileKey);
        const result: Record<string, boolean> = {};

        for (const [systemId, system] of this.systemsById.entries()) {
            const prefixes = system.getSyncFileKeyPrefixes();
            result[systemId] = fileKeys.some((fileKey) => prefixes.some((prefix) => fileKey.startsWith(prefix)));
        }

        return result;
    }

    /** Executes a raw SQL query against the shared adapter for e2e/debug flows. */
    public async rawQuery(sql: string, params?: unknown[]): Promise<unknown> {
        this.assertNotDisposed();

        if (!this.adapter) {
            throw new Error('DataContextManager adapter is not initialized.');
        }

        const rawQueryableAdapter = this.adapter as DatabaseAdapter & {
            rawQuery: (query: string, values?: unknown[]) => Promise<unknown>;
        };

        return rawQueryableAdapter.rawQuery(sql, params);
    }

    /** Disposes queue and all held resources. */
    public async dispose(): Promise<void> {
        if (this.disposed) {
            return;
        }

        this.disposed = true;
        this.queueSubscription.unsubscribe();

        const contexts = Array.from(this.dataContextsBySystemId.values());

        for (const dataContext of contexts) {
            await dataContext.close();
        }

        this.dataContextsBySystemId.clear();
        this.progressCollectorsBySystemId.clear();
        this.systemsById.clear();
        this.pendingSystemIds.clear();

        if (this.adapter) {
            await this.adapter.close();
        }

        this.adapter = null;
        this.container = null;
        this.githubClient = null;
        this.wahapediaClient = null;
        this.activeDataContext$.next(null);
        this.progress$.next(null);
        this.state$.next(initialManagerState);

        this.jobs$.complete();
        this.lastSyncResults$.complete();
        this.progress$.complete();
        this.activeDataContext$.complete();
        this.state$.complete();
    }

    private async runSyncJob(systemId: string): Promise<void> {
        this.inflightSystemSyncs.add(systemId);

        try {
            this.pendingSystemIds.delete(systemId);
            const dataContext = this.dataContextsBySystemId.get(systemId);

            if (!dataContext) {
                return;
            }

            this.updateSystemSyncState(systemId, { status: SyncStatus.Syncing, error: undefined });
            const collector = this.progressCollectorsBySystemId.get(systemId);

            if (collector) {
                collector.reset();
                this.progress$.next(collector);
            }

            const previousAttempts = this.state$.value.systemSyncStates[systemId]?.attempts ?? 0;

            try {
                const result = await dataContext.sync();

                if (result && result.succeeded.length === 0 && result.failures.length > 0) {
                    const failureCount = result.failures.length;
                    const detail = result.failures.map((f) => `${f.dao}: ${f.error}`).join('; ');
                    const message = `Sync completed with ${failureCount} DAO failure(s): ${detail}`;

                    this.updateSystemSyncState(systemId, {
                        status: SyncStatus.Error,
                        attempts: previousAttempts + 1,
                        error: message,
                    });
                    this.lastSyncResults$.next({
                        ...this.lastSyncResults$.value,
                        [systemId]: result,
                    });
                    this.patchState({ status: 'error', error: message });

                    return;
                }

                this.updateSystemSyncState(systemId, {
                    status: SyncStatus.Synced,
                    attempts: previousAttempts + 1,
                    error: undefined,
                });
                this.writeSessionSyncFlag(systemId);
                this.lastSyncResults$.next({
                    ...this.lastSyncResults$.value,
                    [systemId]: result,
                });
                this.patchState({ status: 'ready', error: undefined });
            } catch (error) {
                Sentry.captureException(error, { tags: { area: 'data-context-manager', operation: 'run-sync-job' } });
                const message = error instanceof Error ? error.message : 'Failed to sync system';
                this.updateSystemSyncState(systemId, {
                    status: SyncStatus.Error,
                    attempts: previousAttempts + 1,
                    error: message,
                });
                this.lastSyncResults$.next({
                    ...this.lastSyncResults$.value,
                    [systemId]: null,
                });
                this.patchState({ status: 'error', error: message });
                throw error;
            }
        } finally {
            this.inflightSystemSyncs.delete(systemId);
        }
    }

    private ensureAdapterAndContainer(): Promise<void> {
        if (this.adapter && this.container) {
            return Promise.resolve();
        }

        if (this.adapterInitPromise) {
            return this.adapterInitPromise;
        }

        this.adapterInitPromise = this.doInitialize().finally(() => {
            this.adapterInitPromise = null;
        });

        return this.adapterInitPromise;
    }

    private async doInitialize(): Promise<void> {
        if (this.container === null) {
            const container = createContainerWithModules(coreModule, webModule);
            const queryClient = getQueryClient();
            container.bind(TOKENS.QueryClient).toConstantValue(queryClient);
            this.container = container;
        }

        if (this.adapter === null) {
            const createAdapter = this.container.get<AdapterFactoryFn>(TOKENS.AdapterFactory);
            this.adapter = await createAdapter();

            // Adapter init is deferred to DataContextBuilder.buildContext(), which
            // runs gameSystem.register() first. The PGlite schema merge happens
            // once on the first initialize(); initializing here locks in a
            // core-only schema and every plugin DAO throws "Unknown entity store".
            this.patchState({ status: 'initializing', error: undefined });
        }
    }

    private getOrCreateProgressCollector(systemId: string): SyncProgressCollector {
        const existing = this.progressCollectorsBySystemId.get(systemId);

        if (existing) {
            return existing;
        }

        const collector = new SyncProgressCollector(40);
        this.progressCollectorsBySystemId.set(systemId, collector);

        return collector;
    }

    private async ensureSystemDataContext(system: GameSystemDefinition): Promise<void> {
        const existingContext = this.dataContextsBySystemId.get(system.id);

        if (existingContext) {
            return;
        }

        if (!this.container || !this.adapter) {
            throw new Error('DataContextManager dependencies are not initialized.');
        }

        const queryClient = this.container.get<QueryClient>(TOKENS.QueryClient);

        if (this.githubClient === null) {
            const createGitHub = this.container.get<ClientFactoryFn<IGitHubClient, QueryClient>>(
                TOKENS.GitHubClientFactory,
            );
            this.githubClient = await createGitHub(queryClient);
        }

        if (this.wahapediaClient === null) {
            const createWahapedia = this.container.get<ClientFactoryFn<IWahapediaClient, QueryClient>>(
                TOKENS.WahapediaClientFactory,
            );
            this.wahapediaClient = await createWahapedia(queryClient);
        }

        const dataContext = await DataContextBuilder.builder()
            .system(system)
            .adapter(this.adapter)
            .ownsAdapter(false)
            .register('github', this.githubClient)
            .register('wahapedia', this.wahapediaClient)
            .register('syncProgress', this.getOrCreateProgressCollector(system.id))
            .buildFromCache();

        this.dataContextsBySystemId.set(system.id, dataContext);
        this.patchState({ status: 'ready', error: undefined });
    }

    private enqueueSync(systemId: string): void {
        const state = this.state$.value.systemSyncStates[systemId];

        if (this.pendingSystemIds.has(systemId) || state?.status === SyncStatus.Syncing) {
            return;
        }

        this.pendingSystemIds.add(systemId);
        this.jobs$.next({ systemId });
    }

    private updateSystemSyncState(systemId: string, patch: Partial<SystemSyncState>): void {
        const previous = this.state$.value.systemSyncStates[systemId] ?? {
            systemId,
            status: SyncStatus.Idle,
            hasCache: false,
            attempts: 0,
        };

        const nextSystemState: SystemSyncState = {
            ...previous,
            ...patch,
            systemId,
        };

        this.patchState({
            systemSyncStates: {
                ...this.state$.value.systemSyncStates,
                [systemId]: nextSystemState,
            },
        });
    }

    private removeSystemState(systemId: string): void {
        const nextStates = { ...this.state$.value.systemSyncStates };
        delete nextStates[systemId];
        this.patchState({ systemSyncStates: nextStates });
    }

    private patchState(patch: Partial<ManagerState>): void {
        this.state$.next({
            ...this.state$.value,
            ...patch,
        });
    }

    private assertNotDisposed(): void {
        if (this.disposed) {
            throw new Error('DataContextManager has been disposed.');
        }
    }

    private readSessionSyncFlag(systemId: string): boolean {
        if (typeof window === 'undefined') {
            return false;
        }

        try {
            return window.sessionStorage.getItem(`${SESSION_SYNC_FLAG_PREFIX}${systemId}`) === '1';
        } catch {
            return false;
        }
    }

    private writeSessionSyncFlag(systemId: string): void {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            window.sessionStorage.setItem(`${SESSION_SYNC_FLAG_PREFIX}${systemId}`, '1');
        } catch {
            /* sessionStorage unavailable (private mode, quota, disabled) — degrade to re-sync next mount. */
        }
    }
}
