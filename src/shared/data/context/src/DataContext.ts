import type { DatabaseAdapter } from '@armoury/data-dao';
import type { IGitHubClient } from '@armoury/clients-github';
import type { GameSystem } from '@armoury/data-dao';
import type { ArmyDAO, CampaignDAO, GameContextResult, SyncResult } from '@armoury/data-dao';
import { AccountDAO } from '@armoury/data-dao';
import { FriendDAO } from '@armoury/data-dao';
import { MatchDAO } from '@armoury/data-dao';
import { UserDAO } from '@armoury/data-dao';

/**
 * DataContext interface exposing core and game-specific DAOs.
 */
export interface DataContextShape<TGameData = unknown> {
    /** Account DAO for user account data. */
    readonly accounts: AccountDAO;
    /** Friend DAO for social data. */
    readonly social: FriendDAO;
    /** User DAO for user profile data. */
    readonly users: UserDAO;
    /** Core match DAO (game-agnostic). */
    readonly matches: MatchDAO;
    /** Game system army DAO. */
    readonly armies: ArmyDAO;
    /** Game system campaign DAO. */
    readonly campaigns: CampaignDAO;
    /** Game-specific data context. */
    readonly game: TGameData;
    /** Result from the most recent sync operation. Undefined if sync hasn't run. */
    readonly syncResult?: SyncResult;
    /** Closes the underlying adapter connection. */
    close(): Promise<void>;
}

/**
 * DataContext implementation wiring core DAOs and placeholder game DAOs.
 */
export class DataContext<TGameData = unknown> implements DataContextShape<TGameData> {
    public accounts: AccountDAO;
    public social: FriendDAO;
    public users: UserDAO;
    public matches: MatchDAO;
    public armies: ArmyDAO;
    public campaigns: CampaignDAO;
    public game: TGameData;
    public syncResult?: SyncResult;

    private readonly adapter: DatabaseAdapter;
    private readonly gameSystem: GameSystem;
    private readonly githubClient: IGitHubClient | null;

    /**
     * Creates a DataContext implementation bound to a database adapter.
     * @param adapter - Database adapter used by DAOs.
     * @param gameSystem - Game system descriptor.
     * @param githubClient - Optional GitHub client for remote access.
     * @param gameContext - Optional game-specific DAO wiring from the system's createGameContext().
     */
    public constructor(
        adapter: DatabaseAdapter,
        gameSystem: GameSystem,
        githubClient: IGitHubClient | null,
        gameContext?: GameContextResult<TGameData>,
    ) {
        this.adapter = adapter;
        this.gameSystem = gameSystem;
        this.githubClient = githubClient;
        this.accounts = new AccountDAO(adapter);
        this.social = new FriendDAO(adapter);
        this.users = new UserDAO(adapter);
        this.matches = new MatchDAO(adapter);
        this.armies = gameContext?.armies ?? this.createNotImplementedArmyDAO();
        this.campaigns = gameContext?.campaigns ?? this.createNotImplementedCampaignDAO();
        this.game = gameContext?.game ?? this.createNotImplementedGameData();
    }

    /**
     * Closes the database adapter connection.
     */
    public async close(): Promise<void> {
        await this.adapter.close();
    }

    /**
     * Creates a placeholder DAO that throws until game-specific DAOs are implemented.
     * @returns Placeholder army DAO implementation.
     */
    private createNotImplementedArmyDAO(): ArmyDAO {
        const notImplemented = async (): Promise<never> => {
            throw new Error("Game-specific DAO 'armies' is not yet implemented.");
        };

        return {
            save: notImplemented,
            saveMany: notImplemented,
            get: notImplemented,
            list: notImplemented,
            listByOwner: notImplemented,
            listByFaction: notImplemented,
            delete: notImplemented,
            deleteAll: notImplemented,
            count: notImplemented,
        };
    }

    /**
     * Creates a placeholder campaign DAO that throws until game-specific DAOs are implemented.
     * @returns Placeholder campaign DAO implementation.
     */
    private createNotImplementedCampaignDAO(): CampaignDAO {
        const notImplemented = async (): Promise<never> => {
            throw new Error("Game-specific DAO 'campaigns' is not yet implemented.");
        };

        return {
            save: notImplemented,
            saveMany: notImplemented,
            get: notImplemented,
            list: notImplemented,
            listByOrganizer: notImplemented,
            listByStatus: notImplemented,
            listByType: notImplemented,
            delete: notImplemented,
            deleteAll: notImplemented,
            count: notImplemented,
        };
    }

    /**
     * Creates a placeholder game data context that throws on access.
     * @returns Placeholder game data context.
     */
    private createNotImplementedGameData(): TGameData {
        const systemName = this.gameSystem.name;
        const githubConfigured = this.githubClient !== null;

        return new Proxy(
            {},
            {
                get(): never {
                    throw new Error(
                        `Game-specific data context for '${systemName}' is not yet implemented. GitHub client configured: ${String(githubConfigured)}.`,
                    );
                },
            },
        ) as TGameData;
    }
}
