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
} from '@/types.js';

// === Error Classes and Type Guards ===

export { CampaignsApiError, CampaignsNetworkError, isCampaignsApiError, isCampaignsNetworkError } from '@/types.js';

// === Config ===

export { CAMPAIGNS_BASE_URL } from '@/config.js';

// === Query Key Builders ===

export { buildQueryCampaignsKey } from '@/queries/queryCampaigns.js';
export { buildQueryCampaignKey } from '@/queries/queryCampaign.js';
export { buildQueryParticipantsKey } from '@/queries/queryParticipants.js';
export { buildQueryParticipantKey } from '@/queries/queryParticipant.js';

// === Query Options Builders ===

export { queryCampaigns } from '@/queries/queryCampaigns.js';
export { queryCampaign } from '@/queries/queryCampaign.js';
export { queryParticipants } from '@/queries/queryParticipants.js';
export { queryParticipant } from '@/queries/queryParticipant.js';

// === Mutation Options Builders ===

export { mutationCreateCampaign } from '@/mutations/mutationCreateCampaign.js';
export { mutationUpdateCampaign } from '@/mutations/mutationUpdateCampaign.js';
export { mutationDeleteCampaign } from '@/mutations/mutationDeleteCampaign.js';
export { mutationJoinCampaign } from '@/mutations/mutationJoinCampaign.js';
export { mutationUpdateParticipant } from '@/mutations/mutationUpdateParticipant.js';
export { mutationDeleteParticipant } from '@/mutations/mutationDeleteParticipant.js';
