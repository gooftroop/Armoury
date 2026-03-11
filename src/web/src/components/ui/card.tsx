'use client';

/**
 * Card Component
 *
 * A container component for displaying content in a styled card format.
 * Built with forwardRef for proper DOM ref forwarding.
 *
 * @requirements
 * 1. Must export Card component with forwardRef.
 * 2. Must export CardHeader, CardTitle, CardDescription, CardContent, CardFooter subcomponents.
 * 3. Must use design tokens: bg-card, text-card-foreground, border-border.
 * 4. Must merge user className with default styles using cn utility.
 * 5. Must display displayName for each component in React DevTools.
 */

import * as React from 'react';

import { cn } from '../../lib/utils.ts';

/**
 * Props for the Card component.
 */
export type CardProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Props for the CardHeader component.
 */
export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Props for the CardTitle component.
 */
export type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

/**
 * Props for the CardDescription component.
 */
export type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

/**
 * Props for the CardContent component.
 */
export type CardContentProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Props for the CardFooter component.
 */
export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Card component - the main container for card content.
 *
 * @param props - Component props including className and standard div attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered Card component.
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
    <div
        className={cn('rounded-lg border border-border bg-card text-card-foreground shadow-sm', className)}
        ref={ref}
        {...props}
    />
));
Card.displayName = 'Card';

/**
 * CardHeader component - contains title and description.
 *
 * @param props - Component props including className and standard div attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered CardHeader component.
 */
const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(({ className, ...props }, ref) => (
    <div className={cn('flex flex-col space-y-1.5 p-6', className)} ref={ref} {...props} />
));
CardHeader.displayName = 'CardHeader';

/**
 * CardTitle component - the title of the card.
 *
 * @param props - Component props including className and standard heading attributes.
 * @param ref - Forwarded ref to the h3 element.
 * @returns The rendered CardTitle component.
 */
const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(({ className, ...props }, ref) => (
    <h3 className={cn('font-semibold leading-none tracking-tight', className)} ref={ref} {...props} />
));
CardTitle.displayName = 'CardTitle';

/**
 * CardDescription component - a description for the card content.
 *
 * @param props - Component props including className and standard paragraph attributes.
 * @param ref - Forwarded ref to the p element.
 * @returns The rendered CardDescription component.
 */
const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(({ className, ...props }, ref) => (
    <p className={cn('text-sm text-muted-foreground', className)} ref={ref} {...props} />
));
CardDescription.displayName = 'CardDescription';

/**
 * CardContent component - the main content area of the card.
 *
 * @param props - Component props including className and standard div attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered CardContent component.
 */
const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(({ className, ...props }, ref) => (
    <div className={cn('p-6 pt-0', className)} ref={ref} {...props} />
));
CardContent.displayName = 'CardContent';

/**
 * CardFooter component - the footer area of the card.
 *
 * @param props - Component props including className and standard div attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered CardFooter component.
 */
const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(({ className, ...props }, ref) => (
    <div className={cn('flex items-center p-6 pt-0', className)} ref={ref} {...props} />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
