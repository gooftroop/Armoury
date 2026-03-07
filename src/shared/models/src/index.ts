/**
 * Barrel export for all shared model types.
 *
 * Re-exports every model from the @armoury/models package so consumers
 * can import from a single entry point.
 *
 * @module @armoury/models
 */

export type { UserPreferences, SystemPreferences, Account } from './AccountModel.ts';
export type { CampaignStatus } from './CampaignModel.ts';
export type {
    NarrativeBase,
    CustomNarrative,
    CampaignDataBase,
    CampaignPhase,
    CampaignRanking,
    Campaign,
    CampaignParticipant,
} from './CampaignModel.ts';
export type { FriendStatus, Friend } from './FriendModel.ts';
export type { User } from './UserModel.ts';
export type {
    MatchDataBase,
    MatchPlayer,
    MatchTurn,
    MatchScoreEvent,
    MatchScore,
    MatchStatus,
    PlayerResult,
    MatchOutcome,
    Match,
} from './MatchModel.ts';
export type { PresenceStatus, UserPresence } from './UserPresenceModel.ts';
