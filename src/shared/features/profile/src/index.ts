/**
 * @armoury/feature-profile — web barrel file.
 *
 * @requirements
 * 1. Must re-export all profile components, utilities, and providers.
 * 2. Must not use default exports.
 */

// === Components ===

export { ProfileTileContainer, type ProfileTileContainerProps } from './components/ProfileTileContainer.web.js';
export { AuthenticatedProfile, type AuthenticatedProfileProps } from './components/AuthenticatedProfile.web.js';
export { UnauthenticatedPrompt, type UnauthenticatedPromptProps } from './components/UnauthenticatedPrompt.web.js';
export { ProfileTileSkeleton } from './components/ProfileTileSkeleton.web.js';

// === Utilities ===

export { getInitials } from './utils/getInitials.js';

// === Providers ===

export {
    PresenceProvider,
    usePresence,
    type PresenceContextValue,
    type PresenceProviderProps,
} from './providers/PresenceProvider.web.js';
