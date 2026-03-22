/**
 * Landing Skeleton — shown while LandingContent resolves server-side.
 *
 * Mirrors the landing page layout (auth section + system grid) with pulsing
 * placeholder bones so the user sees a meaningful shell during the Auth0
 * session check and manifest discovery.
 *
 * @requirements
 * 1. Must be a Client Component ('use client') — rendered as Suspense fallback.
 * 2. Must reuse the project Skeleton primitive (animate-pulse bg-muted).
 * 3. Must match the visual layout of UnauthenticatedLanding (auth links + SystemGrid).
 * 4. Must be responsive — single column on mobile, multi-column on desktop.
 * 5. Must not import any auth or data-fetching code.
 *
 * @module landing-skeleton
 */

'use client';

import { Skeleton } from '@/components/ui/skeleton.js';

/**
 * A single placeholder tile matching the SystemTile layout:
 * accent bar → gradient splash area → title / subtitle / description bones.
 */
function TileSkeleton(): React.ReactElement {
    return (
        <div className="flex flex-col overflow-hidden rounded-lg border border-border/40 bg-surface/60">
            {/* accent bar */}
            <Skeleton className="h-1 w-full rounded-none" />

            {/* gradient splash area */}
            <Skeleton className="h-20 w-full rounded-none md:h-[120px]" />

            {/* text content area */}
            <div className="flex flex-col gap-2 p-5 pt-4">
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
            </div>
        </div>
    );
}

/**
 * Full-page skeleton matching the landing page layout during Suspense.
 *
 * Renders placeholder bones for the auth section (two text lines) and
 * a grid of system tiles matching SystemGrid's responsive columns.
 */
export function LandingSkeleton(): React.ReactElement {
    return (
        <>
            {/* Auth section bones (matches UnauthenticatedLanding link pair) */}
            <div className="mb-8 flex flex-col items-center gap-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-48" />
            </div>

            {/* System grid bones (matches SystemGrid responsive layout) */}
            <div
                className="mb-10 grid w-full max-w-[1120px] gap-6"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))' }}
            >
                <TileSkeleton />
                <TileSkeleton />
                <TileSkeleton />
            </div>
        </>
    );
}

LandingSkeleton.displayName = 'LandingSkeleton';
