'use client';

/**
 * Avatar Component
 *
 * An image element with a fallback for representing the user.
 * Built on Radix UI Avatar primitive with Tailwind styling.
 *
 * @requirements
 * 1. Must export Avatar, AvatarImage, AvatarFallback components.
 * 2. Must use Radix UI Avatar primitive from radix-ui package.
 * 3. Must support size variants: sm, md, lg.
 * 4. Must use design tokens for styling.
 * 5. Must display displayName in React DevTools.
 */

import { Avatar as AvatarPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@web/src/lib/utils.js';

/**
 * Avatar size variants using class-variance-authority.
 */
const avatarVariants = cva('relative flex shrink-0 overflow-hidden rounded-full', {
    variants: {
        size: {
            sm: 'h-8 w-8',
            md: 'h-10 w-10',
            lg: 'h-12 w-12',
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

/**
 * Props for the Avatar component.
 */
export type AvatarProps = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> &
    VariantProps<typeof avatarVariants>;

/**
 * Props for the AvatarImage component.
 */
export type AvatarImageProps = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>;

/**
 * Props for the AvatarFallback component.
 */
export type AvatarFallbackProps = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>;

/**
 * Avatar component - the main container for avatar.
 *
 * @param props - Component props including size and standard Avatar.Root attributes.
 * @param ref - Forwarded ref to the span element.
 * @returns The rendered Avatar component.
 */
const Avatar = React.forwardRef<React.ElementRef<typeof AvatarPrimitive.Root>, AvatarProps>(
    ({ className, size, ...props }, ref) => (
        <AvatarPrimitive.Root className={cn(avatarVariants({ size, className }))} ref={ref} {...props} />
    ),
);
Avatar.displayName = 'Avatar';

/**
 * AvatarImage component - the image to display.
 *
 * @param props - Component props including standard Avatar.Image attributes.
 * @param ref - Forwarded ref to the img element.
 * @returns The rendered AvatarImage component.
 */
const AvatarImage = React.forwardRef<React.ElementRef<typeof AvatarPrimitive.Image>, AvatarImageProps>(
    ({ className, ...props }, ref) => (
        <AvatarPrimitive.Image className={cn('aspect-square h-full w-full', className)} ref={ref} {...props} />
    ),
);
AvatarImage.displayName = 'AvatarImage';

/**
 * AvatarFallback component - the fallback content when image fails to load.
 *
 * @param props - Component props including standard Avatar.Fallback attributes.
 * @param ref - Forwarded ref to the span element.
 * @returns The rendered AvatarFallback component.
 */
const AvatarFallback = React.forwardRef<React.ElementRef<typeof AvatarPrimitive.Fallback>, AvatarFallbackProps>(
    ({ className, ...props }, ref) => (
        <AvatarPrimitive.Fallback
            className={cn('flex h-full w-full items-center justify-center rounded-full bg-muted', className)}
            ref={ref}
            {...props}
        />
    ),
);
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback, avatarVariants };
