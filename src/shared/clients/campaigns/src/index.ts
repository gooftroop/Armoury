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
} from '@clients-campaigns/types.js';

// === Error Classes and Type Guards ===

export {
    CampaignsApiError,
    CampaignsNetworkError,
    isCampaignsApiError,
    isCampaignsNetworkError,
} from '@clients-campaigns/types.js';

// === Config ===

export { CAMPAIGNS_BASE_URL } from '@clients-campaigns/config.js';

// === Query Key Builders ===

export { buildQueryCampaignsKey } from '@clients-campaigns/queries/queryCampaigns.js';
export { buildQueryCampaignKey } from '@clients-campaigns/queries/queryCampaign.js';
export { buildQueryParticipantsKey } from '@clients-campaigns/queries/queryParticipants.js';
export { buildQueryParticipantKey } from '@clients-campaigns/queries/queryParticipant.js';

// === Query Options Builders ===

export { queryCampaigns } from '@clients-campaigns/queries/queryCampaigns.js';
export { queryCampaign } from '@clients-campaigns/queries/queryCampaign.js';
export { queryParticipants } from '@clients-campaigns/queries/queryParticipants.js';
export { queryParticipant } from '@clients-campaigns/queries/queryParticipant.js';

// === Mutation Options Builders ===

export { mutationCreateCampaign } from '@clients-campaigns/mutations/mutationCreateCampaign.js';
export { mutationUpdateCampaign } from '@clients-campaigns/mutations/mutationUpdateCampaign.js';
export { mutationDeleteCampaign } from '@clients-campaigns/mutations/mutationDeleteCampaign.js';
export { mutationJoinCampaign } from '@clients-campaigns/mutations/mutationJoinCampaign.js';
export { mutationUpdateParticipant } from '@clients-campaigns/mutations/mutationUpdateParticipant.js';
export { mutationDeleteParticipant } from '@clients-campaigns/mutations/mutationDeleteParticipant.js';
