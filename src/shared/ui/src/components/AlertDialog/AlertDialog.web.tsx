'use client';

/**
 * AlertDialog Component
 *
 * A modal dialog that interrupts the user with important content and expects a response.
 * Built on Radix UI AlertDialog primitive with Tailwind styling.
 *
 * @requirements
 * 1. Must export AlertDialog, AlertDialogPortal, AlertDialogOverlay, AlertDialogTrigger,
 *    AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle,
 *    AlertDialogDescription, AlertDialogAction, AlertDialogCancel components.
 * 2. Must use Radix UI AlertDialog primitive from radix-ui package.
 * 3. Must use AlertDialog.Portal for content positioning.
 * 4. Must use design tokens for styling.
 * 5. Must display displayName in React DevTools.
 */

import { AlertDialog } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils.js';
import { buttonVariants } from '@/components/Button/index.js';

/**
 * Props for the AlertDialogOverlay component.
 */
export type AlertDialogOverlayProps = React.ComponentPropsWithoutRef<typeof AlertDialog.Overlay>;

/**
 * Props for the AlertDialogContent component.
 */
export type AlertDialogContentProps = React.ComponentPropsWithoutRef<typeof AlertDialog.Content>;

/**
 * Props for the AlertDialogHeader component.
 */
export type AlertDialogHeaderProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Props for the AlertDialogFooter component.
 */
export type AlertDialogFooterProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Props for the AlertDialogTitle component.
 */
export type AlertDialogTitleProps = React.ComponentPropsWithoutRef<typeof AlertDialog.Title>;

/**
 * Props for the AlertDialogDescription component.
 */
export type AlertDialogDescriptionProps = React.ComponentPropsWithoutRef<typeof AlertDialog.Description>;

/**
 * Props for the AlertDialogAction component.
 */
export type AlertDialogActionProps = React.ComponentPropsWithoutRef<typeof AlertDialog.Action>;

/**
 * Props for the AlertDialogCancel component.
 */
export type AlertDialogCancelProps = React.ComponentPropsWithoutRef<typeof AlertDialog.Cancel>;

/**
 * AlertDialog component - the root alert dialog component.
 */
const AlertDialogRoot = AlertDialog.Root;

/**
 * AlertDialogTrigger component - the button that opens the alert dialog.
 */
const AlertDialogTrigger = AlertDialog.Trigger;

/**
 * AlertDialogPortal component - portal for rendering alert dialog content.
 */
const AlertDialogPortal = AlertDialog.Portal;

/**
 * AlertDialogOverlay component - the backdrop overlay.
 *
 * @param props - Component props including className and standard AlertDialog.Overlay attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered AlertDialogOverlay component.
 */
const AlertDialogOverlay = React.forwardRef<React.ElementRef<typeof AlertDialog.Overlay>, AlertDialogOverlayProps>(
    ({ className, ...props }, ref) => (
        <AlertDialog.Overlay
            className={cn(
                'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                className,
            )}
            ref={ref}
            {...props}
        />
    ),
);
AlertDialogOverlay.displayName = 'AlertDialogOverlay';

/**
 * AlertDialogContent component - the main alert dialog content container.
 *
 * @param props - Component props including className and standard AlertDialog.Content attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered AlertDialogContent component.
 */
const AlertDialogContent = React.forwardRef<React.ElementRef<typeof AlertDialog.Content>, AlertDialogContentProps>(
    ({ className, ...props }, ref) => (
        <AlertDialogPortal>
            <AlertDialogOverlay />
            <AlertDialog.Content
                className={cn(
                    'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
                    className,
                )}
                ref={ref}
                {...props}
            />
        </AlertDialogPortal>
    ),
);
AlertDialogContent.displayName = 'AlertDialogContent';

/**
 * AlertDialogHeader component - contains title and description.
 *
 * @param props - Component props including className and standard div attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered AlertDialogHeader component.
 */
const AlertDialogHeader = React.forwardRef<HTMLDivElement, AlertDialogHeaderProps>(({ className, ...props }, ref) => (
    <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} ref={ref} {...props} />
));
AlertDialogHeader.displayName = 'AlertDialogHeader';

/**
 * AlertDialogFooter component - contains action buttons.
 *
 * @param props - Component props including className and standard div attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered AlertDialogFooter component.
 */
const AlertDialogFooter = React.forwardRef<HTMLDivElement, AlertDialogFooterProps>(({ className, ...props }, ref) => (
    <div
        className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
        ref={ref}
        {...props}
    />
));
AlertDialogFooter.displayName = 'AlertDialogFooter';

/**
 * AlertDialogTitle component - the title of the alert dialog.
 *
 * @param props - Component props including className and standard AlertDialog.Title attributes.
 * @param ref - Forwarded ref to the h2 element.
 * @returns The rendered AlertDialogTitle component.
 */
const AlertDialogTitle = React.forwardRef<React.ElementRef<typeof AlertDialog.Title>, AlertDialogTitleProps>(
    ({ className, ...props }, ref) => (
        <AlertDialog.Title className={cn('text-lg font-semibold', className)} ref={ref} {...props} />
    ),
);
AlertDialogTitle.displayName = 'AlertDialogTitle';

/**
 * AlertDialogDescription component - a description for the alert dialog content.
 *
 * @param props - Component props including className and standard AlertDialog.Description attributes.
 * @param ref - Forwarded ref to the p element.
 * @returns The rendered AlertDialogDescription component.
 */
const AlertDialogDescription = React.forwardRef<
    React.ElementRef<typeof AlertDialog.Description>,
    AlertDialogDescriptionProps
>(({ className, ...props }, ref) => (
    <AlertDialog.Description className={cn('text-sm text-muted-foreground', className)} ref={ref} {...props} />
));
AlertDialogDescription.displayName = 'AlertDialogDescription';

/**
 * AlertDialogAction component - the confirm action button.
 *
 * @param props - Component props including className and standard AlertDialog.Action attributes.
 * @param ref - Forwarded ref to the button element.
 * @returns The rendered AlertDialogAction component.
 */
const AlertDialogAction = React.forwardRef<React.ElementRef<typeof AlertDialog.Action>, AlertDialogActionProps>(
    ({ className, ...props }, ref) => (
        <AlertDialog.Action className={cn(buttonVariants(), className)} ref={ref} {...props} />
    ),
);
AlertDialogAction.displayName = 'AlertDialogAction';

/**
 * AlertDialogCancel component - the cancel action button.
 *
 * @param props - Component props including className and standard AlertDialog.Cancel attributes.
 * @param ref - Forwarded ref to the button element.
 * @returns The rendered AlertDialogCancel component.
 */
const AlertDialogCancel = React.forwardRef<React.ElementRef<typeof AlertDialog.Cancel>, AlertDialogCancelProps>(
    ({ className, ...props }, ref) => (
        <AlertDialog.Cancel
            className={cn(buttonVariants({ variant: 'outline' }), 'mt-2 sm:mt-0', className)}
            ref={ref}
            {...props}
        />
    ),
);
AlertDialogCancel.displayName = 'AlertDialogCancel';

export {
    AlertDialogRoot as AlertDialog,
    AlertDialogPortal,
    AlertDialogOverlay,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
};
