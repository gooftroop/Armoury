'use client';

/**
 * ArmyCardSkeleton Component
 *
 * A loading placeholder that mimics the layout of an ArmyCard.
 * Uses the Skeleton primitive with pulse animation to indicate loading state.
 *
 * @requirements
 * 1. Must export ArmyCardSkeleton component with ref prop.
 * 2. Must visually match the ArmyCard layout (header, body, footer).
 * 3. Must use Skeleton primitive for consistent loading animation.
 * 4. Must use Card primitive for consistent card styling.
 * 5. Must merge user className with default styles using cn utility.
 * 6. Must display displayName in React DevTools.
 */

import type { ReactElement, ComponentPropsWithRef } from 'react';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card.js';
import { Skeleton } from '@/components/ui/skeleton.js';
import { cn } from '@/lib/utils.js';

/**
 * Props for the ArmyCardSkeleton component.
 */
export type ArmyCardSkeletonProps = ComponentPropsWithRef<'div'>;

/**
 * ArmyCardSkeleton component — a loading placeholder for army cards.
 *
 * Renders a Card with Skeleton elements that match the layout of a loaded ArmyCard.
 * Includes placeholders for faction image, army name, unit count, points, and action buttons.
 *
 * @param props - Component props including className and standard div attributes.
 * @returns The rendered ArmyCardSkeleton component.
 */
function ArmyCardSkeleton({ className, ref, ...props }: ArmyCardSkeletonProps): ReactElement {
    return (
        <Card className={cn('overflow-hidden', className)} ref={ref} {...props}>
            {/* Faction splash image placeholder */}
            <Skeleton className="h-32 w-full rounded-none" />

            <CardHeader className="space-y-2 pb-2">
                {/* Army name */}
                <Skeleton className="h-5 w-3/4" />

                {/* Faction name */}
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>

            <CardContent className="space-y-2 pb-2">
                {/* Unit count */}
                <Skeleton className="h-4 w-1/3" />

                {/* Points */}
                <Skeleton className="h-4 w-2/5" />
            </CardContent>

            <CardFooter className="gap-2">
                {/* Deploy button */}
                <Skeleton className="h-9 flex-1" />

                {/* Duplicate button */}
                <Skeleton className="h-9 w-9" />

                {/* Delete button */}
                <Skeleton className="h-9 w-9" />
            </CardFooter>
        </Card>
    );
}

ArmyCardSkeleton.displayName = 'ArmyCardSkeleton';

export { ArmyCardSkeleton };
