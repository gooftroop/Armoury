/**
 * Compact user identity tile for the side navigation.
 *
 * Renders an initials-based avatar alongside the user's display name and
 * subscription plan. Collapses to avatar-only when the sidebar is narrow.
 *
 * @requirements
 * 1. Must be a pure render component — no hooks, no side effects.
 * 2. Must support collapsed (avatar-only) and expanded (avatar + text) layouts.
 * 3. Must derive initials via the shared getInitials utility.
 * 4. Must follow the orchestrational/render split pattern.
 *
 * @module SideNavUserTile
 */

import { getInitials } from '@/lib/getInitials.js';
import { cn } from '@/lib/utils.js';

/** Props for SideNavUserTile. */
export interface SideNavUserTileProps {
    /** User display name — shown next to the avatar when expanded. */
    userName: string;
    /** Subscription tier label (e.g. "Free Plan", "Pro"). */
    userPlan: string;
    /** Whether the sidebar is in its collapsed (icon-only) state. */
    collapsed: boolean;
}

/**
 * Pure render tile showing the current user in the side navigation.
 *
 * @param props - User identity display props.
 * @returns The user tile element.
 */
export function SideNavUserTile({ userName, userPlan, collapsed }: SideNavUserTileProps): React.ReactElement {
    return (
        <div
            className={cn('flex items-center rounded-md p-2', collapsed ? 'justify-center' : 'gap-3 px-3')}
            role="status"
            aria-label={`Signed in as ${userName}`}
        >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-border">
                <span className="text-xs font-medium">{getInitials(userName)}</span>
            </div>
            {!collapsed && (
                <div className="flex flex-col overflow-hidden">
                    <span className="truncate text-sm font-medium leading-tight text-primary">{userName}</span>
                    <span className="truncate text-xs text-tertiary">{userPlan}</span>
                </div>
            )}
        </div>
    );
}

SideNavUserTile.displayName = 'SideNavUserTile';
