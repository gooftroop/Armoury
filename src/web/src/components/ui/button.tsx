'use client';

/**
 * Button Component
 *
 * A versatile button component built with class-variance-authority for variant management.
 * Supports multiple visual styles for different contexts in a tactical military theme.
 *
 * @requirements
 * 1. Must export Button component with React.forwardRef for DOM ref forwarding.
 * 2. Must support 6 variants: primary, secondary, highlight, ghost, destructive, outline.
 * 3. Must support 3 sizes: sm, md, lg.
 * 4. Must merge user className with variant styles using cn utility.
 * 5. Must forward all additional props to the underlying button element.
 * 6. Must display Button displayName in React DevTools.
 */

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../lib/utils.ts';

/**
 * Button variant styles using class-variance-authority.
 * Defines visual variants and sizes for the Button component.
 */
const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                primary: 'bg-primary text-primary-foreground shadow hover:bg-primary/90 active:bg-primary/80',
                secondary:
                    'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 active:bg-secondary/70',
                highlight: 'bg-highlight text-highlight-foreground shadow hover:bg-highlight/90 active:bg-highlight/80',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
                destructive:
                    'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:bg-destructive/80',
                outline: 'border border-border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
            },
            size: {
                sm: 'h-8 px-3 text-xs',
                md: 'h-9 px-4 py-2',
                lg: 'h-10 px-6 text-base',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'md',
        },
    },
);

/**
 * Props for the Button component.
 */
export interface ButtonProps extends React.ComponentPropsWithRef<'button'>, VariantProps<typeof buttonVariants> {
    /**
     * If true, renders the component as a Slot (allows composition).
     */
    asChild?: boolean;
}

/**
 * Button component with multiple variants and sizes.
 *
 * @param props - Component props including variant, size, asChild, and standard button attributes.
 * @param ref - Forwarded ref to the button element.
 * @returns The rendered Button component.
 */
function Button({ className, variant, size, asChild = false, ref, ...props }: ButtonProps): React.ReactElement {
    const Comp = asChild ? Slot : 'button';

    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
}

Button.displayName = 'Button';

export { Button, buttonVariants };
