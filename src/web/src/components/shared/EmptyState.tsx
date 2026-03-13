'use client';

/**
 * EmptyState Component
 *
 * A reusable empty state placeholder displayed when a list or collection has no items.
 * Renders an optional icon, title, description, and call-to-action button.
 *
 * @requirements
 * 1. Must export EmptyState component with forwardRef.
 * 2. Must accept optional icon, title, description, and action props.
 * 3. Must use design tokens: text-muted-foreground, bg-muted/50.
 * 4. Must merge user className with default styles using cn utility.
 * 5. Must display displayName in React DevTools.
 */

import * as React from 'react';

import { cn } from '@/lib/utils.js';

/**
 * Props for the EmptyState component.
 */
export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Optional icon element rendered above the title. */
    icon?: React.ReactNode;

    /** Title text displayed prominently in the empty state. */
    title: string;

    /** Optional description text displayed below the title. */
    description?: string;

    /** Optional action element (typically a Button) rendered below the description. */
    action?: React.ReactNode;
}

/**
 * EmptyState component — a placeholder for empty lists or collections.
 *
 * Renders a centered layout with optional icon, title, description, and action.
 * Designed to guide users toward creating their first item.
 *
 * @param props - Component props including icon, title, description, action, className, and standard div attributes.
 * @param ref - Forwarded ref to the root div element.
 * @returns The rendered EmptyState component.
 */
const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
    ({ className, icon, title, description, action, ...props }, ref) => (
        <div
            className={cn(
                'flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/50 px-6 py-12 text-center',
                className,
            )}
            ref={ref}
            {...props}
        >
            {icon && <div className="mb-4 text-muted-foreground [&_svg]:size-12">{icon}</div>}

            <h3 className="text-lg font-semibold text-foreground">{title}</h3>

            {description && <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>}

            {action && <div className="mt-6">{action}</div>}
        </div>
    ),
);
EmptyState.displayName = 'EmptyState';

export { EmptyState };
