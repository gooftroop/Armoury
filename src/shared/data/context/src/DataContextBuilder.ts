import type { DatabaseAdapter } from '@armoury/data-dao';
import type { IGitHubClient } from '@armoury/clients-github';
import type { GameSystem } from '@armoury/data-dao';
import { DataContext } from '@/DataContext.js';

/** Creates a stub GitHub client that throws on invocation. */
function createMissingGitHubClient(): IGitHubClient {
    const throwMissing = async (): Promise<never> => {
        throw new Error('GitHub client not configured');
    };

    const noUpdates = async (): Promise<boolean> => {
        return false;
    };

    return {
        listFiles: throwMissing,
        getFileSha: throwMissing,
        downloadFile: throwMissing,
        checkForUpdates: noUpdates,
    };
}

/** Builder for creating DataContext instances with configured dependencies. */
export class DataContextBuilder<TGameData = unknown> {
    /** Creates a new DataContextBuilder instance. */
    public static builder<TGameData = unknown>(): DataContextBuilder<TGameData> {
        return new DataContextBuilder<TGameData>();
    }

    private gameSystem: GameSystem | null = null;
    private adapterInstance: DatabaseAdapter | null = null;
    private githubClient: IGitHubClient | null = null;

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

    /** Sets the GitHub client used for remote data access. */
    public github(client: IGitHubClient): DataContextBuilder<TGameData> {
        this.githubClient = client;

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

        await this.gameSystem.register();
        await this.adapterInstance.initialize();

        const githubClient = this.githubClient ?? createMissingGitHubClient();
        const gameContext = this.gameSystem.createGameContext(this.adapterInstance, githubClient);

        const dc = new DataContext(this.adapterInstance, this.gameSystem, githubClient, {
            armies: gameContext.armies,
            campaigns: gameContext.campaigns,
            game: gameContext.game as TGameData,
        });

        if (gameContext.sync) {
            const syncResult = await gameContext.sync();

            if (syncResult.succeeded.length === 0 && syncResult.failures.length > 0) {
                throw new Error(
                    `Complete sync failure: all ${syncResult.total} DAOs failed. ` +
                        `Failed: ${syncResult.failures.map((f) => f.dao).join(', ')}`,
                );
            }

            dc.syncResult = syncResult;
        }

        return dc;
    }
}
