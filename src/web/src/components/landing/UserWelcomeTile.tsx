'use client';

/**
 * User welcome tile for the authenticated landing page.
 *
 * Displays the user avatar, a localised welcome message, and a settings
 * gear link. This is a pure render component — all data must be passed
 * via props.
 *
 * @requirements
 * 1. Must be a pure render component — no data hooks, no side effects.
 * 2. Must render accessible avatar with initials fallback.
 * 3. Must render a tooltip-wrapped settings link with aria-label.
 * 4. Must NOT use data-testid attributes.
 * 5. Must follow the orchestrational/render split pattern.
 *
 * @module UserWelcomeTile
 */

import { Settings } from 'lucide-react';

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
import { getInitials } from '@/lib/getInitials.js';

/** Props for UserWelcomeTile. */
export interface UserWelcomeTileProps {
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
}

/**
 * Pure render tile showing the authenticated user on the landing page.
 *
 * @param props - User display props.
 * @returns The user welcome tile element.
 */
export function UserWelcomeTile({
    name,
    picture,
    welcomeText,
    settingsLabel,
    settingsHref,
}: UserWelcomeTileProps): React.ReactElement {
    return (
        <div
            className="mb-8 flex items-center gap-4 rounded-lg border border-border/40 bg-surface/60 px-4 py-2"
            role="status"
            aria-label={welcomeText}
        >
            <Avatar size="sm">
                <AvatarImage src={picture} alt={name} />
                <AvatarFallback>{getInitials(name)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground">{welcomeText}</span>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="link" asChild>
                            <a
                                href={settingsHref}
                                className="ml-auto rounded-md p-1 text-secondary transition-colors hover:text-secondary-hover"
                                aria-label={settingsLabel}
                            >
                                <Settings className="h-4 w-4" />
                            </a>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{settingsLabel}</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}

UserWelcomeTile.displayName = 'UserWelcomeTile';
