'use client';

/**
 * Authenticated landing experience — shown when the user has a valid Auth0 session.
 *
 * Displays a compact user tile (avatar, welcome text, settings link) and the
 * SystemGrid for browsing/downloading game systems. Account data is hydrated
 * from server-prefetched React Query state — no additional fetch on mount.
 *
 * @requirements
 * 1. Must be a Client Component ('use client').
 * 2. Must render a user tile with avatar, welcome text, and settings link.
 * 3. Must render SystemGrid with isAuthenticated=true.
 * 4. Must use next-intl useTranslations for all user-facing strings.
 * 5. Must reuse the user tile design from the original page.tsx.
 *
 * @module authenticated-landing
 */

import { useTranslations } from 'next-intl';
import { Settings } from 'lucide-react';

import type { GameSystemManifest } from '@armoury/data-dao';

import { SystemGrid } from '@/components/SystemGrid.js';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
    Button,
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/index.js';

/** Minimal Auth0 user shape needed for the landing tile. */
export interface LandingUser {
    /** Auth0 subject identifier. */
    sub: string;
    /** Display name. */
    name: string;
    /** Profile picture URL. */
    picture: string;
}

/** Props for the AuthenticatedLanding component. */
export interface AuthenticatedLandingProps {
    /** Auth0 user profile subset. */
    user: LandingUser;
    /** Discovered game system manifests. */
    manifests: GameSystemManifest[];
    /** Current locale for profile link. */
    locale: string;
}

/**
 * Extracts up to two initials from a display name.
 *
 * @param name - The user's display name.
 * @returns One or two uppercase initial characters, or '?' as fallback.
 */
function getInitials(name: string): string {
    if (!name || name.trim().length === 0) {
        return '?';
    }

    const parts = name.trim().split(/\s+/);

    if (parts.length === 1) {
        return parts[0]![0]!.toUpperCase();
    }

    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/**
 * Renders the authenticated landing page content: user tile + system grid.
 *
 * @param props - Component props.
 * @returns The rendered authenticated landing experience.
 */
export function AuthenticatedLanding({ user, manifests, locale }: AuthenticatedLandingProps): React.ReactElement {
    const t = useTranslations('landing');

    return (
        <>
            <div
                data-testid="user-tile"
                className="mb-8 flex items-center gap-4 rounded-lg border border-border/40 bg-surface/60 px-4 py-2"
            >
                <Avatar size="sm">
                    <AvatarImage src={user.picture} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground">{t('welcome', { name: user.name })}</span>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="link" asChild>
                                <a
                                    href={`/${locale}/account`}
                                    className="ml-auto rounded-md p-1 text-secondary transition-colors hover:text-secondary-hover"
                                    aria-label={t('editProfile')}
                                >
                                    <Settings className="h-4 w-4" />
                                </a>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('editProfile')}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <SystemGrid manifests={manifests} isAuthenticated={true} userId={user.sub} />
        </>
    );
}

AuthenticatedLanding.displayName = 'AuthenticatedLanding';
