import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { DatabaseError } from '@shared/types/errors.js';
import type { Account, MatchRecord, Unit } from '@shared/types/entities.js';
import { registerEntityCodec } from '@shared/data/codec.js';

/**
 * Mock entity class for testing codec serialization and hydration.
 */
class MockHydratableEntity {
	readonly id: string;
	readonly name: string;
	readonly sourceFiles: string[];

	constructor(data: { id: string; name: string; sourceFiles: string[] }) {
		this.id = data.id;
		this.name = data.name;
		this.sourceFiles = data.sourceFiles;
	}

	toJSON(): Record<string, unknown> {
		return { id: this.id, name: this.name, sourceFiles: this.sourceFiles };
	}

	static fromJSON(raw: Record<string, unknown>): MockHydratableEntity {
		return new MockHydratableEntity({
			id: raw.id as string,
			name: raw.name as string,
			sourceFiles: raw.sourceFiles as string[],
		});
	}
}

// vi.mock factories are hoisted above imports, so mock tables must use vi.hoisted()
// to be available in the hoisted scope. Each table is an object with Symbol-valued
// properties so the mock DB's getColumnKey() can match column references by identity.
const {
    mockUnits,
    mockWeapons,
    mockAbilities,
    mockStratagems,
    mockDetachments,
    mockFactions,
    mockFactionModels,
    mockSyncStatus,
    mockAccounts,
    mockArmies,
    mockFriends,
    mockMasterCampaigns,
    mockParticipantCampaigns,
    mockMatchRecords,
    mockCrusadeRules,
    mockState,
    resetMockState,
    mockEq,
    mockAsc,
    mockDesc,
    mockDrizzleFactory,
    MockSigner,
    MockClient,
} = vi.hoisted(() => {
    function createMockTable(columnNames: string[]): Record<string, unknown> {
        const table: Record<string, unknown> = {};

        for (const name of columnNames) {
            table[name] = Symbol(name);
        }

        return table;
    }

    const mockState: MockState = {
        signerConfigs: [],
        signerTokenCalls: 0,
        signerTokenError: null,
        clientConfigs: [],
        clientConnectCalls: 0,
        clientEndCalls: 0,
        drizzleCalls: 0,
        db: null,
    };

    /**
     * Resets shared mock state between tests.
     */
    const resetMockState = (): void => {
        mockState.signerConfigs = [];
        mockState.signerTokenCalls = 0;
        mockState.signerTokenError = null;
        mockState.clientConfigs = [];
        mockState.clientConnectCalls = 0;
        mockState.clientEndCalls = 0;
        mockState.drizzleCalls = 0;
        mockState.db = null;
    };

    /**
     * Creates an in-memory mock database with Drizzle-like query chaining.
     */
    const createMockDb = (state: MockDbState): MockDb => {
        /**
         * Retrieves or creates the map for a table.
         */
        const getTableMap = (table: unknown): Map<string, Record<string, unknown>> => {
            const existing = state.tables.get(table);

            if (existing) {
                return existing;
            }

            const created = new Map<string, Record<string, unknown>>();
            state.tables.set(table, created);

            return created;
        };

        /**
         * Finds the column key name for a table column reference.
         */
        const getColumnKey = (table: unknown, column: unknown): string | undefined => {
            if (!table || typeof table !== 'object') {
                return undefined;
            }

            const entries = Object.entries(table as Record<string, unknown>);

            for (const [key, value] of entries) {
                if (value === column) {
                    return key;
                }
            }

            return undefined;
        };

        /**
         * Executes a select query against the in-memory store.
         */
        const executeQuery = (params: {
            table: unknown;
            condition?: EqCondition;
            orderBy?: OrderByCondition;
            limit?: number;
            offset?: number;
        }): Record<string, unknown>[] => {
            if (state.failSelect) {
                throw state.failSelect;
            }

            const rows = Array.from(getTableMap(params.table).values());
            let filtered = rows;

            if (params.condition) {
                const { column, value } = params.condition;
                const key = getColumnKey(params.table, column);

                if (key && value !== column) {
                    filtered = filtered.filter((row) => row[key] === value);
                }
            }

            if (params.orderBy) {
                const key = getColumnKey(params.table, params.orderBy.column);

                if (key) {
                    const direction = params.orderBy.direction === 'desc' ? -1 : 1;
                    filtered = [...filtered].sort((left, right) => {
                        const leftValue = left[key];
                        const rightValue = right[key];

                        if (leftValue === rightValue) {
                            return 0;
                        }

                        if (leftValue === undefined || leftValue === null) {
                            return -1 * direction;
                        }

                        if (rightValue === undefined || rightValue === null) {
                            return 1 * direction;
                        }

                        return leftValue > rightValue ? direction : -1 * direction;
                    });
                }
            }

            const offset = params.offset ?? 0;

            const limit = params.limit ?? filtered.length;

            return filtered.slice(offset, offset + limit);
        };

        /**
         * Builds a query builder that can be awaited.
         */
        const buildQuery = (params: {
            table: unknown;
            condition?: EqCondition;
            orderBy?: OrderByCondition;
            limit?: number;
            offset?: number;
        }): QueryBuilder => {
            const createPromise = () => Promise.resolve().then(() => executeQuery(params));

            const query = {
                then: <TResult1 = Record<string, unknown>[], TResult2 = never>(
                    onFulfilled?: ((value: Record<string, unknown>[]) => TResult1 | PromiseLike<TResult1>) | null,
                    onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
                ) => createPromise().then(onFulfilled, onRejected),
                catch: <TResult = never>(onRejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null) =>
                    createPromise().catch(onRejected),
                finally: (onFinally?: (() => void) | null) => createPromise().finally(onFinally),
                where: (condition: EqCondition) => buildQuery({ ...params, condition }),
                orderBy: (orderBy: OrderByCondition) => buildQuery({ ...params, orderBy }),
                limit: (count: number) => buildQuery({ ...params, limit: count }),
                offset: (count: number) => buildQuery({ ...params, offset: count }),
            };

            return query as QueryBuilder;
        };

        const db: MockDb = {
            select: () => ({
                from: (table: unknown) => buildQuery({ table }),
            }),
            insert: (table: unknown) => ({
                values: (values: Record<string, unknown>) => ({
                    onConflictDoUpdate: async (options: { target: unknown; set: Record<string, unknown> }) => {
                        if (state.failInsert) {
                            throw state.failInsert;
                        }

                        const map = getTableMap(table);
                        const keyName = getColumnKey(table, options.target) ?? 'id';
                        const keyValue = values[keyName];

                        if (typeof keyValue !== 'string') {
                            throw new Error('Missing key value for upsert');
                        }

                        const existing = map.get(keyValue) ?? {};
                        map.set(keyValue, { ...existing, ...values, ...options.set });
                    },
                }),
            }),
            delete: (table: unknown) => ({
                where: async (condition: EqCondition) => {
                    if (state.failDelete) {
                        throw state.failDelete;
                    }

                    const map = getTableMap(table);
                    const key = getColumnKey(table, condition.column);

                    if (!key) {
                        return;
                    }

                    if (condition.value === condition.column) {
                        map.clear();

                        return;
                    }

                    for (const [rowKey, row] of map.entries()) {
                        if (row[key] === condition.value) {
                            map.delete(rowKey);
                        }
                    }
                },
            }),
            transaction: async <T>(fn: (tx: MockDb) => Promise<T>) => {
                if (state.failTransaction) {
                    throw state.failTransaction;
                }

                state.transactionCalls += 1;

                return fn(db);
            },
            getTableRows: (table: unknown) => Array.from(getTableMap(table).values()),
            getTableMap: (table: unknown) => getTableMap(table),
            state,
        };

        return db;
    };

    const mockEq = (column: unknown, value: unknown): EqCondition => ({ column, value });
    const mockAsc = (column: unknown): OrderByCondition => ({ column, direction: 'asc' });
    const mockDesc = (column: unknown): OrderByCondition => ({ column, direction: 'desc' });

    const mockDrizzleFactory = (): MockDb => {
        mockState.drizzleCalls += 1;
        const state: MockDbState = {
            tables: new Map(),
            transactionCalls: 0,
            failSelect: null,
            failInsert: null,
            failDelete: null,
            failTransaction: null,
        };

        const db = createMockDb(state);
        mockState.db = db;

        return db;
    };

    class MockSignerClass {
        readonly config: { hostname: string; region: string };

        constructor(config: { hostname: string; region: string }) {
            this.config = config;
            mockState.signerConfigs.push(config);
        }

        async getDbConnectAdminAuthToken(): Promise<string> {
            mockState.signerTokenCalls += 1;

            if (mockState.signerTokenError) {
                throw mockState.signerTokenError;
            }

            return 'mock-token';
        }
    }

    class MockClientClass {
        readonly config: {
            host: string;
            user: string;
            password: string;
            database: string;
            port: number;
            ssl: boolean;
        };

        constructor(config: {
            host: string;
            user: string;
            password: string;
            database: string;
            port: number;
            ssl: boolean;
        }) {
            this.config = config;
            mockState.clientConfigs.push(config);
        }

        async connect(): Promise<void> {
            mockState.clientConnectCalls += 1;
        }

        async end(): Promise<void> {
            mockState.clientEndCalls += 1;
        }
    }

    return {
        mockUnits: createMockTable([
            'id',
            'name',
            'sourceFile',
            'sourceSha',
            'factionId',
            'movement',
            'toughness',
            'save',
            'wounds',
            'leadership',
            'objectiveControl',
            'invulnerableSave',
            'composition',
            'rangedWeapons',
            'meleeWeapons',
            'wargearOptions',
            'wargearAbilities',
            'abilities',
            'structuredAbilities',
            'constraints',
            'leader',
            'keywords',
            'factionKeywords',
            'imageUrl',
        ]),
        mockWeapons: createMockTable([
            'id',
            'name',
            'sourceFile',
            'sourceSha',
            'type',
            'range',
            'attacks',
            'skill',
            'strength',
            'ap',
            'damage',
            'keywords',
            'unitId',
        ]),
        mockAbilities: createMockTable(['id', 'name', 'sourceFile', 'sourceSha', 'description', 'phase', 'effect']),
        mockStratagems: createMockTable([
            'id',
            'name',
            'sourceFile',
            'sourceSha',
            'cp',
            'phase',
            'description',
            'detachmentId',
        ]),
        mockDetachments: createMockTable([
            'id',
            'name',
            'sourceFile',
            'sourceSha',
            'factionId',
            'rules',
            'enhancements',
        ]),
        mockFactions: createMockTable(['id', 'name', 'sourceFile', 'sourceSha', 'catalogueFile']),
        mockFactionModels: createMockTable([
            'id',
            'name',
            'armyImageUrl',
            'sourceFiles',
            'lastSynced',
            'factionRules',
            'stratagems',
            'detachments',
            'enhancements',
            'units',
            'weapons',
            'abilities',
        ]),
        mockSyncStatus: createMockTable(['id', 'fileKey', 'sha', 'lastSynced', 'etag']),
        mockAccounts: createMockTable([
            'id',
            'displayName',
            'firstName',
            'lastName',
            'nickname',
            'picture',
            'email',
            'emailVerified',
            'linkedProviders',
            'preferences',
            'lastSyncAt',
            'createdAt',
            'updatedAt',
        ]),
        mockArmies: createMockTable([
            'id',
            'ownerId',
            'name',
            'factionId',
            'factionName',
            'detachmentId',
            'detachmentName',
            'battleSize',
            'pointsLimit',
            'units',
            'totalPoints',
            'notes',
            'versions',
            'currentVersion',
            'createdAt',
            'updatedAt',
        ]),
        mockFriends: createMockTable([
            'id',
            'requesterId',
            'receiverId',
            'status',
            'requesterName',
            'requesterPicture',
            'receiverName',
            'receiverPicture',
            'canShareArmyLists',
            'canViewMatchHistory',
            'createdAt',
            'updatedAt',
        ]),
        mockMasterCampaigns: createMockTable([
            'id',
            'name',
            'type',
            'organizerId',
            'organizerName',
            'narrative',
            'startDate',
            'endDate',
            'status',
            'phases',
            'customRules',
            'rankings',
            'participantIds',
            'matchIds',
            'crusadeRulesId',
            'createdAt',
            'updatedAt',
        ]),
        mockParticipantCampaigns: createMockTable([
            'id',
            'masterCampaignId',
            'accountId',
            'displayName',
            'isOrganizer',
            'armyId',
            'armyName',
            'currentPhaseId',
            'matchesInCurrentPhase',
            'crusadeData',
            'matchIds',
            'joinedAt',
            'updatedAt',
        ]),
        mockMatchRecords: createMockTable([
            'id',
            'playerId',
            'playerName',
            'opponentMatchId',
            'opponentId',
            'opponentName',
            'friendId',
            'armyId',
            'armyName',
            'campaignId',
            'participantCampaignId',
            'battleSize',
            'pointsLimit',
            'mission',
            'result',
            'roundScores',
            'totalVP',
            'opponentTotalVP',
            'armyHPState',
            'gameTracker',
            'notes',
            'playedAt',
            'createdAt',
            'updatedAt',
        ]),
        mockCrusadeRules: createMockTable([
            'id',
            'source',
            'name',
            'version',
            'startingSupplyLimit',
            'startingRequisitionPoints',
            'rpPerBattle',
            'rankThresholds',
            'xpGainRules',
            'requisitions',
            'battleHonours',
            'battleScars',
            'agendas',
            'narrative',
            'sourceMechanics',
        ]),
        mockState,
        resetMockState,
        createMockDb,
        mockEq,
        mockAsc,
        mockDesc,
        mockDrizzleFactory,
        MockSigner: MockSignerClass,
        MockClient: MockClientClass,
    };
});

vi.mock('@shared/data/dsql/schema.js', () => ({
    units: mockUnits,
    weapons: mockWeapons,
    abilities: mockAbilities,
    stratagems: mockStratagems,
    detachments: mockDetachments,
    factions: mockFactions,
    factionModels: mockFactionModels,
    syncStatus: mockSyncStatus,
    accounts: mockAccounts,
    armies: mockArmies,
    friends: mockFriends,
    masterCampaigns: mockMasterCampaigns,
    participantCampaigns: mockParticipantCampaigns,
    matchRecords: mockMatchRecords,
    crusadeRules: mockCrusadeRules,
    unitsFactionIdIndex: null,
    weaponsUnitIdIndex: null,
    stratagemsDetachmentIdIndex: null,
    armiesOwnerIdIndex: null,
    friendsRequesterIdIndex: null,
    friendsReceiverIdIndex: null,
    masterCampaignsOrganizerIdIndex: null,
    participantCampaignsMasterCampaignIdIndex: null,
    participantCampaignsAccountIdIndex: null,
    matchRecordsPlayerIdIndex: null,
    matchRecordsCampaignIdIndex: null,
}));

vi.mock('@shared/data/schema.js', () => ({
    getMergedDSQLSchema: () => ({
        tables: {
            units: mockUnits,
            weapons: mockWeapons,
            abilities: mockAbilities,
            stratagems: mockStratagems,
            detachments: mockDetachments,
            factions: mockFactions,
            factionModels: mockFactionModels,
            syncStatus: mockSyncStatus,
            accounts: mockAccounts,
            armies: mockArmies,
            friends: mockFriends,
            masterCampaigns: mockMasterCampaigns,
            participantCampaigns: mockParticipantCampaigns,
            matchRecords: mockMatchRecords,
            crusadeRules: mockCrusadeRules,
        },
        storeToTable: {
            unit: mockUnits,
            weapon: mockWeapons,
            ability: mockAbilities,
            stratagem: mockStratagems,
            detachment: mockDetachments,
            faction: mockFactions,
            factionModel: mockFactionModels,
            fileSyncStatus: mockSyncStatus,
            account: mockAccounts,
            army: mockArmies,
            friend: mockFriends,
            masterCampaign: mockMasterCampaigns,
            participantCampaign: mockParticipantCampaigns,
            matchRecord: mockMatchRecords,
            crusadeRule: mockCrusadeRules,
        },
    }),
}));

vi.mock('module', async (importActual: (path: string) => Promise<unknown>) => {
    const actual = (await importActual('module')) as typeof import('module');

    return {
        ...actual,
        createRequire: (...args: Parameters<typeof actual.createRequire>) => {
            const realRequire = actual.createRequire(...args);

            return (moduleName: string) => {
                if (moduleName === '@aws-sdk/dsql-signer') {
                    return { DsqlSigner: MockSigner };
                }

                if (moduleName === 'pg') {
                    return { Client: MockClient };
                }

                if (moduleName === 'drizzle-orm/node-postgres') {
                    return { drizzle: mockDrizzleFactory };
                }

                if (moduleName === 'drizzle-orm') {
                    return { eq: mockEq, asc: mockAsc, desc: mockDesc };
                }

                return realRequire(moduleName);
            };
        },
    };
});

import { DSQLAdapter } from '@shared/data/dsql/adapter.js';

const accounts = mockAccounts;
const matchRecords = mockMatchRecords;
const syncStatus = mockSyncStatus;

type OrderDirection = 'asc' | 'desc';

type EqCondition = {
    column: unknown;
    value: unknown;
};

type OrderByCondition = {
    column: unknown;
    direction: OrderDirection;
};

type MockDbState = {
    tables: Map<unknown, Map<string, Record<string, unknown>>>;
    transactionCalls: number;
    failSelect: Error | null;
    failInsert: Error | null;
    failDelete: Error | null;
    failTransaction: Error | null;
};

type QueryBuilder = Promise<Record<string, unknown>[]> & {
    where: (condition: EqCondition) => QueryBuilder;
    orderBy: (orderBy: OrderByCondition) => QueryBuilder;
    limit: (count: number) => QueryBuilder;
    offset: (count: number) => QueryBuilder;
};

type MockDb = {
    select: () => {
        from: (table: unknown) => QueryBuilder;
    };
    insert: (table: unknown) => {
        values: (values: Record<string, unknown>) => {
            onConflictDoUpdate: (options: { target: unknown; set: Record<string, unknown> }) => Promise<void>;
        };
    };
    delete: (table: unknown) => {
        where: (condition: EqCondition) => Promise<void>;
    };
    transaction: <T>(fn: (tx: MockDb) => Promise<T>) => Promise<T>;
    getTableRows: (table: unknown) => Record<string, unknown>[];
    getTableMap: (table: unknown) => Map<string, Record<string, unknown>>;
    state: MockDbState;
};

type MockState = {
    signerConfigs: Array<{ hostname: string; region: string }>;
    signerTokenCalls: number;
    signerTokenError: Error | null;
    clientConfigs: Array<{
        host: string;
        user: string;
        password: string;
        database: string;
        port: number;
        ssl: boolean;
    }>;
    clientConnectCalls: number;
    clientEndCalls: number;
    drizzleCalls: number;
    db: MockDb | null;
};

/**
 * Builds a consistent unit entity for tests.
 */
function createUnit(id: string, name: string, factionId = 'faction-1'): Unit {
    return {
        id,
        name,
        sourceFile: 'unit.cat',
        sourceSha: 'sha-123',
        factionId,
        movement: '6"',
        toughness: 4,
        save: '3+',
        wounds: 2,
        leadership: 6,
        objectiveControl: 2,
        invulnerableSave: undefined,
        composition: [],
        rangedWeapons: [],
        meleeWeapons: [],
        wargearOptions: [],
        wargearAbilities: [],
        abilities: [],
        structuredAbilities: [],
        constraints: [],
        leader: undefined,
        keywords: ['Infantry'],
        factionKeywords: ['Faction'],
        imageUrl: '',
    };
}

/**
 * Builds a consistent account entity for tests.
 */
function createAccount(id: string): Account {
    return {
        id,
        displayName: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        nickname: 'tester',
        picture: null,
        email: 'test@example.com',
        emailVerified: true,
        linkedProviders: [
            {
                provider: 'auth0',
                providerUserId: 'user-1',
                connection: 'auth0',
                isSocial: false,
            },
        ],
        preferences: {
            theme: 'dark',
            language: 'en',
            notificationsEnabled: true,
        },
        lastSyncAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Builds a match record entity for tests.
 */
function createMatchRecord(id: string): MatchRecord {
    return {
        id,
        playerId: 'player-1',
        playerName: 'Player One',
        opponentMatchId: null,
        opponentId: 'player-2',
        opponentName: 'Player Two',
        friendId: null,
        armyId: 'army-1',
        armyName: 'Test Army',
        campaignId: null,
        participantCampaignId: null,
        battleSize: 'Incursion',
        pointsLimit: 1000,
        mission: 'Mission',
        result: 'win',
        roundScores: [],
        totalVP: 50,
        opponentTotalVP: 40,
        armyHPState: [],
        gameTracker: {
            currentRound: 1,
            currentTurn: 'player1',
            currentPhase: 'Command',
            gameEnded: false,
        },
        notes: 'Notes',
        playedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

vi.mock('@aws-sdk/dsql-signer', () => ({
    DsqlSigner: MockSigner,
}));

vi.mock('pg', () => ({
    Client: MockClient,
}));

vi.mock('drizzle-orm', () => ({
    eq: mockEq,
    asc: mockAsc,
    desc: mockDesc,
}));

vi.mock('drizzle-orm/node-postgres', () => ({
    drizzle: mockDrizzleFactory,
}));

describe('DSQLAdapter', () => {
	beforeAll(() => {
		registerEntityCodec('factionModel', {
			serialize: (entity) => {
				const model = entity as MockHydratableEntity;

				return typeof model.toJSON === 'function'
					? (model.toJSON() as Record<string, unknown>)
					: ({ ...(entity as Record<string, unknown>) } as Record<string, unknown>);
			},
			hydrate: (raw) => MockHydratableEntity.fromJSON(raw),
		});
	});
    beforeEach(() => {
        resetMockState();
    });

    it('initializes with signer, client, and drizzle', async () => {
        const adapter = new DSQLAdapter({ clusterEndpoint: 'example.com', region: 'us-east-1' });

        await adapter.initialize();

        expect(mockState.signerConfigs).toEqual([{ hostname: 'example.com', region: 'us-east-1' }]);
        expect(mockState.signerTokenCalls).toBe(1);
        expect(mockState.clientConfigs).toHaveLength(1);
        expect(mockState.clientConnectCalls).toBe(1);
        expect(mockState.drizzleCalls).toBe(1);
    });

    it('closes the client and clears state', async () => {
        const adapter = new DSQLAdapter({ clusterEndpoint: 'example.com', region: 'us-east-1' });
        await adapter.initialize();

        await adapter.close();

        expect(mockState.clientEndCalls).toBe(1);
        await expect(adapter.getAll('unit')).rejects.toMatchObject({ operation: 'INITIALIZE' });
    });

    it('returns null when get misses', async () => {
        const adapter = new DSQLAdapter({ clusterEndpoint: 'example.com', region: 'us-east-1' });
        await adapter.initialize();

        const result = await adapter.get('unit', 'missing');

        expect(result).toBeNull();
    });

    it('round-trips units with get and getAll', async () => {
        const adapter = new DSQLAdapter({ clusterEndpoint: 'example.com', region: 'us-east-1' });
        await adapter.initialize();

        const unit = createUnit('unit-1', 'Intercessors');
        await adapter.put('unit', unit);

        const result = await adapter.get('unit', 'unit-1');
        const all = await adapter.getAll('unit');

        expect(result).toEqual(unit);
        expect(all).toHaveLength(1);
        expect(all[0]).toEqual(unit);
    });

    it('serializes arrays and objects for non-faction entities', async () => {
        const adapter = new DSQLAdapter({ clusterEndpoint: 'example.com', region: 'us-east-1' });
        await adapter.initialize();

        const account = createAccount('account-1');
        await adapter.put('account', account);

        const db = mockState.db;

        if (!db) {
            throw new Error('Missing mock database');
        }

        const rows = db.getTableRows(accounts);
        expect(rows).toHaveLength(1);
        expect(typeof rows[0]?.linkedProviders).toBe('string');
        expect(typeof rows[0]?.preferences).toBe('string');

        const hydrated = await adapter.get('account', 'account-1');
        expect(hydrated).toEqual(account);
    });

	it('hydrates faction model entities', async () => {
		const adapter = new DSQLAdapter({ clusterEndpoint: 'example.com', region: 'us-east-1' });
		await adapter.initialize();

		const model = new MockHydratableEntity({
			id: 'faction-1',
			name: 'Faction',
			sourceFiles: ['test.cat'],
		});

		await adapter.put('factionModel', model);

		const result = await adapter.get('factionModel', 'faction-1');
		expect(result).toEqual(model);
	});

    it('supports getAll pagination and ordering', async () => {
        const adapter = new DSQLAdapter({ clusterEndpoint: 'example.com', region: 'us-east-1' });
        await adapter.initialize();

        await adapter.put('unit', createUnit('unit-1', 'Bravo'));
        await adapter.put('unit', createUnit('unit-2', 'Alpha'));
        await adapter.put('unit', createUnit('unit-3', 'Charlie'));

        const results = await adapter.getAll('unit', {
            orderBy: 'name',
            direction: 'asc',
            offset: 1,
            limit: 1,
        });

        expect(results.map((unit: Unit) => unit.name)).toEqual(['Bravo']);
    });

    it('filters with getByField and applies ordering', async () => {
        const adapter = new DSQLAdapter({ clusterEndpoint: 'example.com', region: 'us-east-1' });
        await adapter.initialize();

        await adapter.put('unit', createUnit('unit-1', 'Alpha', 'faction-a'));
        await adapter.put('unit', createUnit('unit-2', 'Charlie', 'faction-a'));
        await adapter.put('unit', createUnit('unit-3', 'Bravo', 'faction-b'));

        const results = await adapter.getByField('unit', 'factionId', 'faction-a', {
            orderBy: 'name',
            direction: 'desc',
        });

        expect(results.map((unit: Unit) => unit.name)).toEqual(['Charlie', 'Alpha']);
    });

    it('counts total and filtered rows', async () => {
        const adapter = new DSQLAdapter({ clusterEndpoint: 'example.com', region: 'us-east-1' });
        await adapter.initialize();

        await adapter.put('unit', createUnit('unit-1', 'Alpha', 'faction-a'));
        await adapter.put('unit', createUnit('unit-2', 'Bravo', 'faction-a'));
        await adapter.put('unit', createUnit('unit-3', 'Charlie', 'faction-b'));

        const total = await adapter.count('unit');
        const filtered = await adapter.count('unit', 'factionId', 'faction-a');

        expect(total).toBe(3);
        expect(filtered).toBe(2);
    });

    it('upserts via put and updates records', async () => {
        const adapter = new DSQLAdapter({ clusterEndpoint: 'example.com', region: 'us-east-1' });
        await adapter.initialize();

        const unit = createUnit('unit-1', 'Alpha');
        await adapter.put('unit', unit);
        await adapter.put('unit', { ...unit, name: 'Alpha Prime' });

        const result = await adapter.get('unit', 'unit-1');
        expect(result?.name).toBe('Alpha Prime');
    });

    it('wraps putMany in a transaction', async () => {
        const adapter = new DSQLAdapter({ clusterEndpoint: 'example.com', region: 'us-east-1' });
        await adapter.initialize();

        await adapter.putMany('unit', [createUnit('unit-1', 'Alpha'), createUnit('unit-2', 'Bravo')]);

        const db = mockState.db;

        if (!db) {
            throw new Error('Missing mock database');
        }

        expect(db.state.transactionCalls).toBe(1);
        expect(await adapter.getAll('unit')).toHaveLength(2);
    });

    it('deletes by id, field, and store', async () => {
        const adapter = new DSQLAdapter({ clusterEndpoint: 'example.com', region: 'us-east-1' });
        await adapter.initialize();

        await adapter.put('unit', createUnit('unit-1', 'Alpha', 'faction-a'));
        await adapter.put('unit', createUnit('unit-2', 'Bravo', 'faction-a'));
        await adapter.put('unit', createUnit('unit-3', 'Charlie', 'faction-b'));

        await adapter.delete('unit', 'unit-1');
        expect(await adapter.get('unit', 'unit-1')).toBeNull();

        await adapter.deleteByField('unit', 'factionId', 'faction-a');

        const remaining = await adapter.getAll('unit');
        expect(remaining.map((unit: Unit) => unit.id)).toEqual(['unit-3']);

        await adapter.deleteAll('unit');
        expect(await adapter.getAll('unit')).toEqual([]);
    });

    it('supports adapter transactions', async () => {
        const adapter = new DSQLAdapter({ clusterEndpoint: 'example.com', region: 'us-east-1' });
        await adapter.initialize();

        const result = await adapter.transaction(async () => {
            await adapter.put('unit', createUnit('unit-1', 'Alpha'));

            return 'ok';
        });

        const db = mockState.db;

        if (!db) {
            throw new Error('Missing mock database');
        }

        expect(result).toBe('ok');
        expect(db.state.transactionCalls).toBe(1);
        expect(await adapter.getAll('unit')).toHaveLength(1);
    });

    it('handles sync status operations', async () => {
        const adapter = new DSQLAdapter({ clusterEndpoint: 'example.com', region: 'us-east-1' });
        await adapter.initialize();

        await adapter.setSyncStatus('core.gst', 'sha-1', 'etag-1');

        const status = await adapter.getSyncStatus('core.gst');

        expect(status).not.toBeNull();
        expect(status?.sha).toBe('sha-1');
        expect(status?.etag).toBe('etag-1');

        await adapter.deleteSyncStatus('core.gst');
        const deleted = await adapter.getSyncStatus('core.gst');
        expect(deleted).toBeNull();

        const rows = mockState.db?.getTableRows(syncStatus) ?? [];
        expect(rows).toHaveLength(0);
    });

    it('deserializes JSON strings for complex entities', async () => {
        const adapter = new DSQLAdapter({ clusterEndpoint: 'example.com', region: 'us-east-1' });
        await adapter.initialize();

        const record = createMatchRecord('match-1');
        await adapter.put('matchRecord', record);
        const stored = mockState.db?.getTableRows(matchRecords) ?? [];
        expect(typeof stored[0]?.gameTracker).toBe('string');
        expect(typeof stored[0]?.roundScores).toBe('string');

        const result = await adapter.get('matchRecord', 'match-1');
        expect(result).toEqual(record);
    });

    it('throws DatabaseError when not initialized', async () => {
        const adapter = new DSQLAdapter({ clusterEndpoint: 'example.com', region: 'us-east-1' });

        await expect(adapter.getAll('unit')).rejects.toMatchObject({ operation: 'SELECT' });
    });

    it('wraps select errors with DatabaseError', async () => {
        const adapter = new DSQLAdapter({ clusterEndpoint: 'example.com', region: 'us-east-1' });
        await adapter.initialize();

        const db = mockState.db;

        if (!db) {
            throw new Error('Missing mock database');
        }

        db.state.failSelect = new Error('select failed');

        await expect(adapter.getAll('unit')).rejects.toMatchObject({ operation: 'SELECT' });
    });

    it('wraps insert errors with DatabaseError', async () => {
        const adapter = new DSQLAdapter({ clusterEndpoint: 'example.com', region: 'us-east-1' });
        await adapter.initialize();

        const db = mockState.db;

        if (!db) {
            throw new Error('Missing mock database');
        }

        db.state.failInsert = new Error('insert failed');

        await expect(adapter.put('unit', createUnit('unit-1', 'Alpha'))).rejects.toMatchObject({
            operation: 'INSERT',
        });
    });

    it('wraps delete errors with DatabaseError', async () => {
        const adapter = new DSQLAdapter({ clusterEndpoint: 'example.com', region: 'us-east-1' });
        await adapter.initialize();

        const db = mockState.db;

        if (!db) {
            throw new Error('Missing mock database');
        }

        db.state.failDelete = new Error('delete failed');

        await expect(adapter.delete('unit', 'unit-1')).rejects.toMatchObject({ operation: 'DELETE' });
    });

    it('wraps initialization errors with DatabaseError', async () => {
        const adapter = new DSQLAdapter({ clusterEndpoint: 'example.com', region: 'us-east-1' });
        mockState.signerTokenError = new Error('token failed');

        await expect(adapter.initialize()).rejects.toBeInstanceOf(DatabaseError);
        await expect(adapter.initialize()).rejects.toMatchObject({ operation: 'INITIALIZE' });
    });
});
