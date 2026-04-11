import type { DatabaseAdapter } from '@armoury/data-dao';
import type { GameSystem } from '@armoury/data-dao';
import type { GameContextResult } from '@armoury/data-dao';
import { DataContext } from '@/DataContext.js';

/** Builder for creating DataContext instances with configured dependencies. */
export class DataContextBuilder<TGameData = unknown> {
    /** Creates a new DataContextBuilder instance. */
    public static builder<TGameData = unknown>(): DataContextBuilder<TGameData> {
        return new DataContextBuilder<TGameData>();
    }

    private gameSystem: GameSystem | null = null;
    private adapterInstance: DatabaseAdapter | null = null;
    /** Registered client instances keyed by name. */
    private clients: Map<string, unknown> = new Map();

    /** Sets the game system for the data context. */
    public system(gameSystem: GameSystem): DataContextBuilder<TGameData> {
        this.gameSystem = gameSystem;

        return this;
    }

    /** Sets a pre-built adapter instance. */
    public adapter(adapter: DatabaseAdapter): DataContextBuilder<TGameData> {
        this.adapterInstance = adapter;

        return this;
    }

    /** Registers a named client instance for use by game systems. */
    public register(key: string, client: unknown): DataContextBuilder<TGameData> {
        this.clients.set(key, client);

        return this;
    }

    /** Builds a fully initialized DataContext instance. */
    public async build(): Promise<DataContext<TGameData>> {
        if (!this.gameSystem) {
            throw new Error('Game system is required to build a DataContext.');
        }

        if (!this.adapterInstance) {
            throw new Error('An adapter must be provided to build a DataContext.');
        }

        const t0 = Date.now();
        const log = (phase: string) => console.log(`[SYNC-DEBUG] build: ${phase} +${Date.now() - t0}ms`);

        const gameSystem = this.gameSystem as GameSystem & {
            createGameContext(adapter: DatabaseAdapter, clients: Map<string, unknown>): GameContextResult<TGameData>;
        };

        log('register start');
        await gameSystem.register();
        log('register done, adapter.initialize start');
        await this.adapterInstance.initialize();
        log('adapter.initialize done, createGameContext start');

        const gameContext = gameSystem.createGameContext(this.adapterInstance, this.clients);
        log('createGameContext done');

        const dc = new DataContext(this.adapterInstance, gameSystem, this.clients, {
            armies: gameContext.armies,
            campaigns: gameContext.campaigns,
            game: gameContext.game as TGameData,
        });

        if (gameContext.sync && this.clients.has('github')) {
            log('sync start');
            const syncResult = await gameContext.sync();
            log(
                `sync done — succeeded: ${syncResult.succeeded.length}, failed: ${syncResult.failures.length}, total: ${syncResult.total}`,
            );

            if (syncResult.succeeded.length === 0 && syncResult.failures.length > 0) {
                throw new Error(
                    `Complete sync failure: all ${syncResult.total} DAOs failed. ` +
                        `Failed: ${syncResult.failures.map((f) => f.dao).join(', ')}`,
                );
            }

            dc.syncResult = syncResult;
        }

        log('build complete');

        return dc;
    }
}
