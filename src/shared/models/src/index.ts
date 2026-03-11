/**
 * Barrel export for all shared model types.
 *
 * Re-exports every model from the @armoury/models package so consumers
 * can import from a single entry point.
 *
 * @module @armoury/models
 */

export type { UserPreferences, SystemPreferences, Account } from '@/AccountModel.js';
export type { CampaignStatus } from '@/CampaignModel.js';
export type {
    NarrativeBase,
    CustomNarrative,
    CampaignDataBase,
    CampaignPhase,
    CampaignRanking,
    Campaign,
    CampaignParticipant,
} from '@/CampaignModel.js';
export type { FriendStatus, Friend } from '@/FriendModel.js';
export type { User } from '@/UserModel.js';
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
} from '@/MatchModel.js';
export type { PresenceStatus, UserPresence } from '@/UserPresenceModel.js';
