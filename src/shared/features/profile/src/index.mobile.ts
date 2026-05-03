/**
 * @armoury/feature-profile — mobile barrel file.
 *
 * @requirements
 * 1. Must re-export all mobile profile components, utilities, and providers.
 * 2. Must not use default exports.
 */

// === Components ===

export { ProfileTileContainer } from './components/ProfileTileContainer.mobile.js';
export { AuthenticatedProfile, type AuthenticatedProfileProps } from './components/AuthenticatedProfile.mobile.js';
export { UnauthenticatedPrompt, type UnauthenticatedPromptProps } from './components/UnauthenticatedPrompt.mobile.js';
export { ProfileCard, type ProfileCardProps } from './components/ProfileCard.mobile.js';

// === Utilities ===

export { getInitials } from './utils/getInitials.js';

// === Providers ===

export {
    PresenceProvider,
    usePresence,
    type PresenceContextValue,
    type PresenceProviderProps,
} from './providers/PresenceProvider.mobile.js';
