'use client';

/**
 * Badge Component
 *
 * A small label component for displaying status, counts, or short text.
 * Built with class-variance-authority for variant management.
 *
 * @requirements
 * 1. Must export Badge component with forwardRef.
 * 2. Must support 4 variants: default, secondary, destructive, outline.
 * 3. Must use design tokens for styling.
 * 4. Must merge user className with variant styles using cn utility.
 * 5. Must display displayName in React DevTools.
 */

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../lib/utils.ts';

/**
 * Badge variant styles using class-variance-authority.
 */
const badgeVariants = cva(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    {
        variants: {
            variant: {
                default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
                secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
                destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
                outline: 'text-foreground',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

/**
 * Props for the Badge component.
 */
export type BadgeProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>;

/**
 * Badge component - displays a small label for status or counts.
 *
 * @param props - Component props including variant and standard div attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered Badge component.
 */
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(({ className, variant, ...props }, ref) => (
    <div className={cn(badgeVariants({ variant }), className)} ref={ref} {...props} />
));
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
