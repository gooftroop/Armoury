'use client';

/**
 * Input Component
 *
 * A text input component for forms.
 * Built with forwardRef for proper DOM ref forwarding.
 *
 * @requirements
 * 1. Must export Input component with forwardRef.
 * 2. Must support error state styling via data-[error=true] attribute.
 * 3. Must use design tokens for styling (bg-background, border-border, etc.).
 * 4. Must merge user className with default styles using cn utility.
 * 5. Must display displayName in React DevTools.
 */

import * as React from 'react';

import { cn } from '@web/src/lib/utils.js';

/**
 * Props for the Input component.
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    /**
     * Whether the input has an error state.
     */
    error?: boolean;
}

/**
 * Input component - a text input field for forms.
 *
 * @param props - Component props including error, className, and standard input attributes.
 * @param ref - Forwarded ref to the input element.
 * @returns The rendered Input component.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type = 'text', error, ...props }, ref) => (
        <input
            className={cn(
                'flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
                error && 'border-destructive focus-visible:ring-destructive',
                className,
            )}
            data-error={error}
            ref={ref}
            type={type}
            {...props}
        />
    ),
);
Input.displayName = 'Input';

export { Input };
