'use client';

/**
 * Skeleton Component
 *
 * A loading placeholder component that displays a pulsing animation.
 * Used to indicate that content is loading.
 *
 * @requirements
 * 1. Must export Skeleton component with ref prop.
 * 2. Must display a pulse animation for loading state.
 * 3. Must use design tokens for styling (bg-muted, etc.).
 * 4. Must merge user className with default styles using cn utility.
 * 5. Must display displayName in React DevTools.
 */

import * as React from 'react';

import { cn } from '@/lib/utils.js';

/**
 * Props for the Skeleton component.
 */
export type SkeletonProps = React.ComponentPropsWithRef<'div'>;

/**
 * Skeleton component - a loading placeholder with pulse animation.
 *
 * @param props - Component props including className and standard div attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered Skeleton component.
 */
/**
 * Skeleton component - a loading placeholder with pulse animation.
 *
 * @param props - Component props including className and standard div attributes.
 * @returns The rendered Skeleton component.
 */
function Skeleton({ className, ref, ...props }: SkeletonProps): React.ReactElement {
    return <div className={cn('animate-pulse rounded-md bg-muted', className)} ref={ref} {...props} />;
}

Skeleton.displayName = 'Skeleton';

export { Skeleton };
