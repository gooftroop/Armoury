'use client';

/**
 * Authenticated profile tile — displays the user avatar, welcome text,
 * and a tooltip-wrapped settings gear link.
 *
 * Pure render component — all data must arrive via props.
 *
 * @module AuthenticatedProfile
 */

import type { ReactElement } from 'react';
import { LogOut, Settings } from 'lucide-react';

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
    Button,
    Card,
    CardContent,
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/index.js';
import { getInitials } from '@/lib/getInitials.js';

/**
 * @requirements
 * 1. Must be a pure render component — no hooks, no side effects.
 * 2. Must render accessible avatar with initials fallback.
 * 3. Must render a tooltip-wrapped settings link with aria-label.
 * 4. Must render a tooltip-wrapped sign-out link with aria-label.
 * 5. Must NOT use data-testid attributes.
 * 6. Must use Card for consistent surface styling.
 */

/** Props for AuthenticatedProfile. */
export interface AuthenticatedProfileProps {
    /** User display name. */
    name: string;
    /** URL to the user's profile picture. */
    picture: string;
    /** Localised welcome string (e.g. "Welcome, John"). */
    welcomeText: string;
    /** Localised tooltip label for the settings link. */
    settingsLabel: string;
    /** Href for the account/settings page. */
    settingsHref: string;
    /** Localised tooltip label for the sign-out link. */
    signOutLabel: string;
    /** Href for the Auth0 logout route (e.g. "/auth/logout"). */
    signOutHref: string;
}

/**
 * Pure render tile showing the authenticated user's avatar, welcome text,
 * and a settings gear link.
 *
 * @param props - User display props.
 * @returns The authenticated profile tile element.
 */
export function AuthenticatedProfile({
    name,
    picture,
    welcomeText,
    settingsLabel,
    settingsHref,
    signOutLabel,
    signOutHref,
}: AuthenticatedProfileProps): ReactElement {
    return (
        <Card className="border-border/40 bg-surface/60">
            <CardContent className="flex items-center gap-4 px-4 py-2">
                <Avatar size="sm">
                    <AvatarImage src={picture} alt={name} />
                    <AvatarFallback>{getInitials(name)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground" role="status" aria-label={welcomeText}>
                    {welcomeText}
                </span>
                <TooltipProvider>
                    <div className="ml-auto flex items-center gap-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="link" asChild>
                                    <a
                                        href={settingsHref}
                                        className="rounded-md p-1 text-secondary transition-colors hover:text-secondary-hover"
                                        aria-label={settingsLabel}
                                    >
                                        <Settings className="h-4 w-4" />
                                    </a>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{settingsLabel}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="link" asChild>
                                    <a
                                        href={signOutHref}
                                        className="rounded-md p-1 text-secondary transition-colors hover:text-secondary-hover"
                                        aria-label={signOutLabel}
                                    >
                                        <LogOut className="h-4 w-4" />
                                    </a>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{signOutLabel}</TooltipContent>
                        </Tooltip>
                    </div>
                </TooltipProvider>
            </CardContent>
        </Card>
    );
}

AuthenticatedProfile.displayName = 'AuthenticatedProfile';
