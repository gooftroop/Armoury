/**
 * Match — typed wrapper class for a core Match with MatchData.
 *
 * Instantiated when the client loads a core Match record whose matchData
 * contains 40K-specific data. Provides typed accessors and immutable
 * mutation methods that return new Match instances.
 */

import type { Match as CoreMatch, MatchPlayer, MatchTurn, MatchScore, MatchOutcome } from '@models/MatchModel.js';
import type {
    MatchData,
    GameState,
    GamePhase,
    MissionConfig,
    PlayerState,
    UnitProjection,
    UnitFlags,
} from '@wh40k10e/models/MatchData.js';
import { createDefaultUnitFlags, PHASE_ORDER } from '@wh40k10e/models/MatchData.js';

/**
 * Typed wrapper around a core Match<MatchData>.
 * All mutation methods are immutable — they return new Match instances.
 */
export class Match {
    /** The underlying core match record. */
    public readonly match: CoreMatch<MatchData>;

    private constructor(match: CoreMatch<MatchData>) {
        this.match = match;
    }

    public static fromMatch(match: CoreMatch<MatchData>): Match {
        if (!match.matchData) {
            throw new Error('Cannot create Match: matchData is null.');
        }

        if (match.matchData.systemId !== 'wh40k10e') {
            throw new Error(`Cannot create Match: expected systemId 'wh40k10e', got '${match.matchData.systemId}'.`);
        }

        return new Match(match);
    }

    // ============ IDENTITY ACCESSORS ============

    /** Match ID. */
    public get id(): string {
        return this.match.id;
    }

    /** Participating players. */
    public get players(): readonly MatchPlayer[] {
        return this.match.players;
    }

    /** Current turn state. */
    public get turn(): MatchTurn {
        return this.match.turn;
    }

    /** Current score state. */
    public get score(): MatchScore | null {
        return this.match.score;
    }

    /** Match outcome state. */
    public get outcome(): MatchOutcome {
        return this.match.outcome;
    }

    /** Campaign ID, or null. */
    public get campaignId(): string | null {
        return this.match.campaignId;
    }

    // ============ 40K DATA ACCESSORS ============

    /** 40K match data payload (never null after construction). */
    public get data(): MatchData {
        return this.match.matchData!;
    }

    /** Mission configuration. */
    public get config(): MissionConfig {
        return this.data.config;
    }

    /** Current game state. */
    public get gameState(): GameState {
        return this.data.gameState;
    }

    /** Current battle round. */
    public get round(): number {
        return this.data.gameState.round;
    }

    /** Current game phase. */
    public get phase(): GamePhase {
        return this.data.gameState.phase;
    }

    /** Per-player state map. */
    public get playerStateById(): Record<string, PlayerState> {
        return this.data.playerStateById;
    }

    // ============ PLAYER STATE HELPERS ============

    /** Returns the player state for a given player ID, or undefined if not found. */
    public getPlayerState(playerId: string): PlayerState | undefined {
        return this.data.playerStateById[playerId];
    }

    /** Returns the unit projection for a given player and army unit ID, or undefined. */
    public getUnitProjection(playerId: string, armyUnitId: string): UnitProjection | undefined {
        return this.data.playerStateById[playerId]?.armyProjection.unitsByArmyUnitId[armyUnitId];
    }

    /** Returns the current command points for a player. */
    public getCommandPoints(playerId: string): number {
        return this.data.playerStateById[playerId]?.commandPoints ?? 0;
    }

    // ============ IMMUTABLE MUTATIONS ============

    /**
     * Applies wound damage to a specific model in a unit.
     * @param playerId - Owner of the unit.
     * @param armyUnitId - Army unit instance ID (map key).
     * @param modelName - Name of the model in the modelWounds record.
     * @param wounds - Number of wounds to apply (positive value).
     */
    public applyDamage(playerId: string, armyUnitId: string, modelName: string, wounds: number): Match {
        return this.updateUnitProjection(playerId, armyUnitId, (unit) => {
            const current = unit.modelWounds[modelName] ?? 0;

            return {
                ...unit,
                modelWounds: { ...unit.modelWounds, [modelName]: Math.max(0, current - wounds) },
            };
        });
    }

    /**
     * Records a kill for a unit (increments kill counter).
     * @param playerId - Owner of the unit that scored the kill.
     * @param armyUnitId - Army unit instance ID.
     * @param count - Number of kills to add (defaults to 1).
     */
    public recordKill(playerId: string, armyUnitId: string, count: number = 1): Match {
        return this.updateUnitProjection(playerId, armyUnitId, (unit) => ({
            ...unit,
            kills: unit.kills + count,
        }));
    }

    /**
     * Sets a specific flag on a unit.
     * @param playerId - Owner of the unit.
     * @param armyUnitId - Army unit instance ID.
     * @param flag - Flag name to set.
     * @param value - Boolean value to set.
     */
    public setUnitFlag(playerId: string, armyUnitId: string, flag: keyof UnitFlags, value: boolean): Match {
        return this.updateUnitProjection(playerId, armyUnitId, (unit) => ({
            ...unit,
            flags: { ...unit.flags, [flag]: value },
        }));
    }

    /** Resets all transient unit flags for a player's army (called at turn boundaries). */
    public resetUnitFlags(playerId: string): Match {
        const playerState = this.data.playerStateById[playerId];

        if (!playerState) {
            return this;
        }

        const updatedUnits: Record<string, UnitProjection> = {};

        for (const [id, unit] of Object.entries(playerState.armyProjection.unitsByArmyUnitId)) {
            updatedUnits[id] = { ...unit, flags: createDefaultUnitFlags() };
        }

        return this.updatePlayerState(playerId, (state) => ({
            ...state,
            armyProjection: {
                ...state.armyProjection,
                unitsByArmyUnitId: updatedUnits,
            },
        }));
    }

    /**
     * Advances to the next game phase, or to the next player's turn / next round.
     * Returns a new Match with the updated game state.
     */
    public advancePhase(): Match {
        const { gameState } = this.data;
        const currentPhaseIndex = PHASE_ORDER.indexOf(gameState.phase);

        if (currentPhaseIndex === -1 || gameState.phase === 'Setup' || gameState.phase === 'Deployment') {
            return this;
        }

        const nextPhaseIndex = currentPhaseIndex + 1;

        if (nextPhaseIndex < PHASE_ORDER.length) {
            return this.updateGameState((gs) => ({
                ...gs,
                phase: PHASE_ORDER[nextPhaseIndex]!,
            }));
        }

        // End phase reached — advance to next player's turn or next round
        const turnOrder = this.match.turn.turnOrder;
        const currentPlayerIndex = turnOrder.indexOf(gameState.activePlayerId ?? '');
        const nextPlayerIndex = currentPlayerIndex + 1;

        if (nextPlayerIndex < turnOrder.length) {
            // Next player's turn in the same round
            const nextPlayerId = turnOrder[nextPlayerIndex]!;

            return this.updateGameState((gs) => ({
                ...gs,
                phase: 'Command',
                activePlayerId: nextPlayerId,
            })).updateTurn((t) => ({
                ...t,
                activePlayerId: nextPlayerId,
                turnNumber: t.turnNumber + 1,
            }));
        }

        // All players have completed their turns — advance to next round
        const nextRound = gameState.round + 1;

        if (nextRound > 5) {
            return this.updateGameState((gs) => ({
                ...gs,
                gameEnded: true,
            }));
        }

        const firstPlayerId = turnOrder[0] ?? null;

        return this.updateGameState((gs) => ({
            ...gs,
            round: nextRound,
            phase: 'Command',
            activePlayerId: firstPlayerId,
        })).updateTurn((t) => ({
            ...t,
            activePlayerId: firstPlayerId,
            turnNumber: t.turnNumber + 1,
        }));
    }

    /** Updates the command points for a player. */
    public setCommandPoints(playerId: string, cp: number): Match {
        return this.updatePlayerState(playerId, (state) => ({
            ...state,
            commandPoints: cp,
        }));
    }

    // ============ INTERNAL HELPERS ============

    private updateData(fn: (data: MatchData) => MatchData): Match {
        return new Match({
            ...this.match,
            matchData: fn(this.data),
        });
    }

    private updateGameState(fn: (gs: GameState) => GameState): Match {
        return this.updateData((data) => ({
            ...data,
            gameState: fn(data.gameState),
        }));
    }

    private updateTurn(fn: (t: MatchTurn) => MatchTurn): Match {
        return new Match({
            ...this.match,
            turn: fn(this.match.turn),
        });
    }

    private updatePlayerState(playerId: string, fn: (state: PlayerState) => PlayerState): Match {
        const existing = this.data.playerStateById[playerId];

        if (!existing) {
            return this;
        }

        return this.updateData((data) => ({
            ...data,
            playerStateById: {
                ...data.playerStateById,
                [playerId]: fn(existing),
            },
        }));
    }

    private updateUnitProjection(
        playerId: string,
        armyUnitId: string,
        fn: (unit: UnitProjection) => UnitProjection,
    ): Match {
        return this.updatePlayerState(playerId, (state) => {
            const existingUnit = state.armyProjection.unitsByArmyUnitId[armyUnitId];

            if (!existingUnit) {
                return state;
            }

            return {
                ...state,
                armyProjection: {
                    ...state.armyProjection,
                    unitsByArmyUnitId: {
                        ...state.armyProjection.unitsByArmyUnitId,
                        [armyUnitId]: fn(existingUnit),
                    },
                },
            };
        });
    }
}
