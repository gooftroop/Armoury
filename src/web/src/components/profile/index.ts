/**
 * Profile tile component family barrel file.
 *
 * @requirements
 * 1. Must re-export all components and their prop types.
 * 2. Must not use default exports.
 */

// === Orchestrational Component ===

export { ProfileTileContainer, type ProfileTileContainerProps } from '@/components/profile/ProfileTileContainer.js';

// === Render Components ===

export { ProfileTileView, type ProfileTileViewProps } from '@/components/profile/ProfileTileView.js';
export { AuthenticatedProfile, type AuthenticatedProfileProps } from '@/components/profile/AuthenticatedProfile.js';
export { UnauthenticatedPrompt, type UnauthenticatedPromptProps } from '@/components/profile/UnauthenticatedPrompt.js';
