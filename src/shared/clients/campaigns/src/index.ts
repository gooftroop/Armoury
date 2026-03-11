/**
 * Campaigns API client package.
 *
 * Provides React Query query/mutation options factories, query key builders,
 * and all campaign/participant entity types for the campaigns REST API.
 */

// === Types ===

export type {
    CampaignStatus,
    NarrativeBase,
    CustomNarrative,
    CampaignDataBase,
    CampaignPhase,
    CampaignRanking,
    Campaign,
    CampaignParticipant,
    CampaignParams,
    ParticipantParams,
    CreateCampaignRequest,
    UpdateCampaignRequest,
    JoinCampaignRequest,
    UpdateParticipantRequest,
} from './types.ts';

// === Error Classes and Type Guards ===

export { CampaignsApiError, CampaignsNetworkError, isCampaignsApiError, isCampaignsNetworkError } from './types.ts';

// === Config ===

export { CAMPAIGNS_BASE_URL } from './config.ts';

// === Query Key Builders ===

export { buildQueryCampaignsKey } from './queries/queryCampaigns.ts';
export { buildQueryCampaignKey } from './queries/queryCampaign.ts';
export { buildQueryParticipantsKey } from './queries/queryParticipants.ts';
export { buildQueryParticipantKey } from './queries/queryParticipant.ts';

// === Query Options Builders ===

export { queryCampaigns } from './queries/queryCampaigns.ts';
export { queryCampaign } from './queries/queryCampaign.ts';
export { queryParticipants } from './queries/queryParticipants.ts';
export { queryParticipant } from './queries/queryParticipant.ts';

// === Mutation Options Builders ===

export { mutationCreateCampaign } from './mutations/mutationCreateCampaign.ts';
export { mutationUpdateCampaign } from './mutations/mutationUpdateCampaign.ts';
export { mutationDeleteCampaign } from './mutations/mutationDeleteCampaign.ts';
export { mutationJoinCampaign } from './mutations/mutationJoinCampaign.ts';
export { mutationUpdateParticipant } from './mutations/mutationUpdateParticipant.ts';
export { mutationDeleteParticipant } from './mutations/mutationDeleteParticipant.ts';
