/**
 * Mutation options builder for removing a participant from a campaign.
 */

import type { UseMutationOptions } from '@tanstack/react-query';
import { deleteParticipant } from './../api/deleteParticipant.ts';
import type { ParticipantParams } from './../types.ts';

/**
 * Builds React Query mutation options for removing a participant from a campaign.
 *
 * @param authorization - The Authorization header value
 * @param params - Parameters containing the campaign ID and participant ID
 * @param options - Optional React Query mutation configuration (excluding mutationFn)
 * @returns Mutation options object ready for use with useMutation
 */
export function mutationDeleteParticipant(
    authorization: string,
    params: ParticipantParams,
    options?: Omit<UseMutationOptions<void, Error, void>, 'mutationFn'>,
): UseMutationOptions<void, Error, void> {
    return {
        mutationFn: () => deleteParticipant(authorization, params),
        ...options,
    };
}
