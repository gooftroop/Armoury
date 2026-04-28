import { BehaviorSubject, EMPTY, Subject, catchError, concatMap, distinctUntilChanged, from, map } from 'rxjs';
import type { Observable, Subscription } from 'rxjs';
import { DataContextBuilder, type DataContext } from '@armoury/data-context';
import { SyncProgressCollector, type DatabaseAdapter, type GameSystem } from '@armoury/data-dao';
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

import { getQueryClient } from '@/lib/getQueryClient.js';
import type { ManagerState, SystemSyncState } from '@/data/managerState.js';
import { initialManagerState } from '@/data/managerState.js';

/**
 * @requirements
 * - REQ-WEB-MGR-001: Single PGliteAdapter instance, created lazily on first enableSystem, closed only in dispose().
 * - REQ-WEB-MGR-002: Single DI container shared across all DataContexts.
 * - REQ-WEB-MGR-003: Sync queue is sequential FIFO (rxjs concatMap) with per-system dedup.
 * - REQ-WEB-MGR-004: Per-system sync state changes do not affect active DataContext reference stability.
 * - REQ-WEB-MGR-005: probeSyncedSystems uses the same adapter — no second instance.
 */

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
    private readonly jobs$ = new Subject<SyncJob>();

    private readonly queueSubscription: Subscription;
    private readonly pendingSystemIds = new Set<string>();
    private readonly systemsById = new Map<string, GameSystemDefinition>();
    private readonly dataContextsBySystemId = new Map<string, DataContext>();

    private adapter: DatabaseAdapter | null = null;
    private container: Container | null = null;
    private githubClient: IGitHubClient | null = null;
    private wahapediaClient: IWahapediaClient | null = null;
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
                            this.updateSystemSyncState(job.systemId, {
                                status: 'error',
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

    /** Returns a stream of a specific system's sync state. */
    public selectSystem(systemId: string): Observable<SystemSyncState | undefined> {
        return this.state$.pipe(
            map((state) => state.systemSyncStates[systemId]),
            distinctUntilChanged(),
        );
    }

    /** Enables a game system and enqueues a sync job. */
    public async enableSystem(system: GameSystemDefinition): Promise<void> {
        this.assertNotDisposed();
        this.systemsById.set(system.id, system);

        await this.ensureAdapterAndContainer();
        await this.ensureSystemDataContext(system);

        this.updateSystemSyncState(system.id, {
            systemId: system.id,
            status: 'pending',
            hasCache: false,
            attempts: 0,
            error: undefined,
        });

        this.setActiveSystem(system.id);
        this.enqueueSync(system.id);
    }

    /** Disables a game system and removes associated state and context. */
    public async disableSystem(systemId: string): Promise<void> {
        this.pendingSystemIds.delete(systemId);
        this.systemsById.delete(systemId);

        const dataContext = this.dataContextsBySystemId.get(systemId);

        if (dataContext) {
            await dataContext.close();
            this.dataContextsBySystemId.delete(systemId);
        }

        this.removeSystemState(systemId);

        if (this.state$.value.activeSystemId === systemId) {
            this.setActiveSystem(null);
        }
    }

    /** Sets the active system identifier and active DataContext reference. */
    public setActiveSystem(systemId: string | null): void {
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
        this.progress$.complete();
        this.activeDataContext$.complete();
        this.state$.complete();
    }

    private async runSyncJob(systemId: string): Promise<void> {
        this.pendingSystemIds.delete(systemId);
        const dataContext = this.dataContextsBySystemId.get(systemId);

        if (!dataContext) {
            return;
        }

        this.updateSystemSyncState(systemId, { status: 'syncing', error: undefined });
        const collector = new SyncProgressCollector(40);
        this.progress$.next(collector);

        const previousAttempts = this.state$.value.systemSyncStates[systemId]?.attempts ?? 0;

        try {
            await dataContext.sync();
            this.updateSystemSyncState(systemId, {
                status: 'synced',
                attempts: previousAttempts + 1,
                error: undefined,
            });
            this.patchState({ status: 'ready', error: undefined });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to sync system';
            this.updateSystemSyncState(systemId, {
                status: 'error',
                attempts: previousAttempts + 1,
                error: message,
            });
            this.patchState({ status: 'error', error: message });
            throw error;
        }
    }

    private async ensureAdapterAndContainer(): Promise<void> {
        if (this.container === null) {
            const container = createContainerWithModules(coreModule, webModule);
            const queryClient = getQueryClient();
            container.bind(TOKENS.QueryClient).toConstantValue(queryClient);
            this.container = container;
        }

        if (this.adapter === null) {
            const createAdapter = this.container.get<AdapterFactoryFn>(TOKENS.AdapterFactory);
            this.adapter = await createAdapter();
            await this.adapter.initialize();
            this.patchState({ status: 'initializing', error: undefined });
        }
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
            .register('github', this.githubClient)
            .register('wahapedia', this.wahapediaClient)
            .register('syncProgress', new SyncProgressCollector(40))
            .buildFromCache();

        this.dataContextsBySystemId.set(system.id, dataContext);
        this.patchState({ status: 'ready', error: undefined });
    }

    private enqueueSync(systemId: string): void {
        const state = this.state$.value.systemSyncStates[systemId];

        if (this.pendingSystemIds.has(systemId) || state?.status === 'syncing') {
            return;
        }

        this.pendingSystemIds.add(systemId);
        this.jobs$.next({ systemId });
    }

    private updateSystemSyncState(systemId: string, patch: Partial<SystemSyncState>): void {
        const previous = this.state$.value.systemSyncStates[systemId] ?? {
            systemId,
            status: 'idle',
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
}
