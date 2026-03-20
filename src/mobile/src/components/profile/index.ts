/**
 * Profile tile component barrel file.
 *
 * @module profile
 */

// === Orchestrational Container ===

export { ProfileTileContainer } from '@/components/profile/ProfileTileContainer.js';

// === Render Components ===

export { AuthenticatedProfile } from '@/components/profile/AuthenticatedProfile.js';

export type { AuthenticatedProfileProps } from '@/components/profile/AuthenticatedProfile.js';

export { UnauthenticatedPrompt } from '@/components/profile/UnauthenticatedPrompt.js';
export type { UnauthenticatedPromptProps } from '@/components/profile/UnauthenticatedPrompt.js';
