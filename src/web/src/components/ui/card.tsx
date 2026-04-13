'use client';

/**
 * Card Component
 *
 * A container component for displaying content in a styled card format.
 * Built with ref prop for proper DOM ref forwarding.
 *
 * @requirements
 * 1. Must export Card component with ref prop.
 * 2. Must export CardHeader, CardTitle, CardDescription, CardContent, CardFooter subcomponents.
 * 3. Must use design tokens: bg-card, text-card-foreground, border-border.
 * 4. Must merge user className with default styles using cn utility.
 * 5. Must display displayName for each component in React DevTools.
 */

import type { ReactElement, ComponentPropsWithRef } from 'react';

import { cn } from '@/lib/utils.js';

/**
 * Props for the Card component.
 */
export type CardProps = ComponentPropsWithRef<'div'>;

/**
 * Props for the CardHeader component.
 */
export type CardHeaderProps = ComponentPropsWithRef<'div'>;

/**
 * Props for the CardTitle component.
 */
export type CardTitleProps = ComponentPropsWithRef<'h3'>;

/**
 * Props for the CardDescription component.
 */
export type CardDescriptionProps = ComponentPropsWithRef<'p'>;

/**
 * Props for the CardContent component.
 */
export type CardContentProps = ComponentPropsWithRef<'div'>;

/**
 * Props for the CardFooter component.
 */
export type CardFooterProps = ComponentPropsWithRef<'div'>;

/**
 * Card component - the main container for card content.
 *
 * @param props - Component props including className and standard div attributes.
 * @returns The rendered Card component.
 */
function Card({ className, ref, ...props }: CardProps): ReactElement {
    return (
        <div
            className={cn('rounded-lg border border-border bg-card text-card-foreground shadow-sm', className)}
            ref={ref}
            {...props}
        />
    );
}

Card.displayName = 'Card';

/**
 * CardHeader component - contains title and description.
 *
 * @param props - Component props including className and standard div attributes.
 * @returns The rendered CardHeader component.
 */
function CardHeader({ className, ref, ...props }: CardHeaderProps): ReactElement {
    return <div className={cn('flex flex-col space-y-1.5 p-6', className)} ref={ref} {...props} />;
}

CardHeader.displayName = 'CardHeader';

/**
 * CardTitle component - the title of the card.
 *
 * @param props - Component props including className and standard heading attributes.
 * @returns The rendered CardTitle component.
 */
function CardTitle({ className, ref, ...props }: CardTitleProps): ReactElement {
    return <h3 className={cn('font-semibold leading-none tracking-tight', className)} ref={ref} {...props} />;
}

CardTitle.displayName = 'CardTitle';

/**
 * CardDescription component - a description for the card content.
 *
 * @param props - Component props including className and standard paragraph attributes.
 * @returns The rendered CardDescription component.
 */
function CardDescription({ className, ref, ...props }: CardDescriptionProps): ReactElement {
    return <p className={cn('text-sm text-muted-foreground', className)} ref={ref} {...props} />;
}

CardDescription.displayName = 'CardDescription';

/**
 * CardContent component - the main content area of the card.
 *
 * @param props - Component props including className and standard div attributes.
 * @returns The rendered CardContent component.
 */
function CardContent({ className, ref, ...props }: CardContentProps): ReactElement {
    return <div className={cn('p-6 pt-0', className)} ref={ref} {...props} />;
}

CardContent.displayName = 'CardContent';

/**
 * CardFooter component - the footer area of the card.
 *
 * @param props - Component props including className and standard div attributes.
 * @returns The rendered CardFooter component.
 */
function CardFooter({ className, ref, ...props }: CardFooterProps): ReactElement {
    return <div className={cn('flex items-center p-6 pt-0', className)} ref={ref} {...props} />;
}

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
