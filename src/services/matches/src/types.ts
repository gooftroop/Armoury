// ---------------------------------------------------------------------------
// Match model types (mirrored from @models/MatchModel)
//
// The service cannot import directly from @shared because tsc's rootDir
// constraint requires all source files to be under the service directory.
// These types must stay in sync with @models/MatchModel.ts.
// ---------------------------------------------------------------------------

export interface MatchDataBase<TPlayerState extends object = Record<string, unknown>> {
    systemId: string;
    schemaVersion: number;
    playerStateById: Record<string, TPlayerState>;
}

export interface MatchPlayer {
    playerId: string;
    campaignParticipantId: string | null;
}

export interface MatchTurn {
    activePlayerId: string | null;
    turnOrder: string[];
    turnNumber: number;
}

export interface MatchScoreEvent {
    playerId: string;
    points: number;
    reason: string;
    recordedAt: string;
}

export interface MatchScore {
    totalsByPlayerId: Record<string, number>;
    events: MatchScoreEvent[];
}

export type MatchStatus = 'setup' | 'deploying' | 'in_progress' | 'completed' | 'abandoned';

export type PlayerResult = 'win' | 'loss' | 'draw';

export interface MatchOutcome {
    status: MatchStatus;
    resultsByPlayerId: Record<string, PlayerResult>;
}

export interface Match<TMatchData extends MatchDataBase<object> | null = MatchDataBase | null> {
    id: string;
    systemId: string;
    players: MatchPlayer[];
    turn: MatchTurn;
    score: MatchScore | null;
    outcome: MatchOutcome;
    campaignId: string | null;
    matchData?: TMatchData;
    notes: string;
    playedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

// ---------------------------------------------------------------------------
// Service infrastructure
// ---------------------------------------------------------------------------

export interface UserContext {
    sub: string;
    email?: string;
    name?: string;
}

export interface PathParameters {
    id?: string;
}

export interface ApiResponse {
    statusCode: number;
    headers?: Record<string, string>;
    body: string;
}

// ---------------------------------------------------------------------------
// Entity types
// ---------------------------------------------------------------------------

export type EntityType = 'match' | 'matchSubscription' | 'wsConnection';

export type EntityMap = {
    match: Match;
    matchSubscription: MatchSubscription;
    wsConnection: WsConnection;
};

// ---------------------------------------------------------------------------
// Database adapter
// ---------------------------------------------------------------------------

export interface DatabaseAdapter {
    initialize(): Promise<void>;
    get<T extends EntityType>(store: T, id: string): Promise<EntityMap[T] | null>;
    getAll<T extends EntityType>(store: T): Promise<EntityMap[T][]>;
    getByField<T extends EntityType>(store: T, field: keyof EntityMap[T], value: string): Promise<EntityMap[T][]>;
    put<T extends EntityType>(store: T, entity: EntityMap[T]): Promise<void>;
    delete<T extends EntityType>(store: T, id: string): Promise<void>;
    deleteByField<T extends EntityType>(store: T, field: keyof EntityMap[T], value: string): Promise<void>;
    transaction<R>(fn: () => Promise<R>): Promise<R>;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export type RouteHandler = (
    adapter: DatabaseAdapter,
    body: unknown | null,
    pathParameters: PathParameters | null | undefined,
    userContext: UserContext,
) => Promise<ApiResponse>;

// ---------------------------------------------------------------------------
// REST request types
// ---------------------------------------------------------------------------

export interface CreateMatchRequest {
    systemId: string;
    players: MatchPlayer[];
    turnOrder?: string[];
    campaignId?: string | null;
    matchData?: MatchDataBase | null;
    notes?: string;
    playedAt?: string | null;
}

export interface UpdateMatchRequest {
    players?: MatchPlayer[];
    turn?: MatchTurn;
    score?: MatchScore | null;
    outcome?: MatchOutcome;
    campaignId?: string | null;
    matchData?: MatchDataBase | null;
    notes?: string;
    playedAt?: string | null;
}

// ---------------------------------------------------------------------------
// WebSocket connection tracking
// ---------------------------------------------------------------------------

export interface WsConnection {
    connectionId: string;
    userId: string;
    connectedAt: string;
}

// ---------------------------------------------------------------------------
// Match subscription
// ---------------------------------------------------------------------------

export interface MatchSubscription {
    id: string;
    connectionId: string;
    matchId: string;
    userId: string;
}

// ---------------------------------------------------------------------------
// WebSocket types
// ---------------------------------------------------------------------------

export interface UpdateMatchFields {
    turn?: MatchTurn;
    score?: MatchScore | null;
    outcome?: MatchOutcome;
    matchData?: MatchDataBase | null;
    notes?: string;
}

export interface WebSocketEvent {
    requestContext: {
        routeKey: string;
        connectionId: string;
        domainName: string;
        stage: string;
        authorizer?: Record<string, unknown>;
        eventType: 'CONNECT' | 'DISCONNECT' | 'MESSAGE';
    };
    queryStringParameters?: Record<string, string | undefined> | null;
    body: string | null;
}

export interface WebSocketResponse {
    statusCode: number;
    body?: string;
}

export interface UpdateMatchMessage {
    action: 'updateMatch';
    matchId: string;
    data: UpdateMatchFields;
}

export interface SubscribeMatchMessage {
    action: 'subscribeMatch';
    matchId: string;
}

export interface UnsubscribeMatchMessage {
    action: 'unsubscribeMatch';
    matchId: string;
}

export type WsRouteHandler = (
    event: WebSocketEvent,
    adapter: DatabaseAdapter,
    userContext: UserContext | null,
) => Promise<WebSocketResponse>;
