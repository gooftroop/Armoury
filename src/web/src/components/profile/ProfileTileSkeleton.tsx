'use client';

/**
 * Profile tile skeleton — a loading placeholder that matches the dimensions of
 * AuthenticatedProfile. Shown while the client-side auth check resolves to
 * prevent flashing the wrong content.
 *
 * Pure render component — no hooks, no side effects, no props.
 *
 * @module ProfileTileSkeleton
 */

import type { ReactElement } from 'react';

import { Card, CardContent } from '@/components/ui/index.js';
import { Skeleton } from '@/components/ui/skeleton.js';

/**
 * @requirements
 * 1. Must be a pure render component — no hooks, no side effects.
 * 2. Must match the visual dimensions of AuthenticatedProfile (Card with avatar + text).
 * 3. Must use the project Skeleton primitive (animate-pulse bg-muted).
 * 4. Must NOT use data-testid attributes.
 * 5. Must use Card/CardContent for consistent surface styling.
 * 6. Must include an accessible aria-label for screen readers.
 */

/**
 * Pulsing placeholder card that matches AuthenticatedProfile's layout.
 * Renders skeleton bones for the avatar, welcome text, and settings gear.
 *
 * @returns The rendered skeleton card element.
 */
export function ProfileTileSkeleton(): ReactElement {
    return (
        <Card className="border-border/40 bg-surface/60" aria-label="Loading profile" role="status">
            <CardContent className="flex items-center gap-4 px-4 py-2">
                {/* Avatar bone */}
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                {/* Welcome text bone */}
                <Skeleton className="h-4 w-32" />
                {/* Settings gear bone */}
                <Skeleton className="ml-auto h-4 w-4 shrink-0 rounded-md" />
            </CardContent>
        </Card>
    );
}

ProfileTileSkeleton.displayName = 'ProfileTileSkeleton';
