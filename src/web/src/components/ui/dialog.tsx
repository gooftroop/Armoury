'use client';

/**
 * Dialog Component
 *
 * A modal dialog that overlays the page content.
 * Built on Radix UI Dialog primitive with Tailwind styling.
 *
 * @requirements
 * 1. Must export Dialog, DialogPortal, DialogOverlay, DialogTrigger, DialogClose,
 *    DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription components.
 * 2. Must use Radix UI Dialog primitive from radix-ui package.
 * 3. Must use Dialog.Portal for content positioning.
 * 4. Must use design tokens for styling.
 * 5. Must display displayName in React DevTools.
 */

import { Dialog } from 'radix-ui';
import { X } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils.js';

/**
 * Props for the DialogOverlay component.
 */
export type DialogOverlayProps = React.ComponentPropsWithoutRef<typeof Dialog.Overlay>;

/**
 * Props for the DialogContent component.
 */
export type DialogContentProps = React.ComponentPropsWithoutRef<typeof Dialog.Content>;

/**
 * Props for the DialogHeader component.
 */
export type DialogHeaderProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Props for the DialogFooter component.
 */
export type DialogFooterProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Props for the DialogTitle component.
 */
export type DialogTitleProps = React.ComponentPropsWithoutRef<typeof Dialog.Title>;

/**
 * Props for the DialogDescription component.
 */
export type DialogDescriptionProps = React.ComponentPropsWithoutRef<typeof Dialog.Description>;

/**
 * Dialog component - the root dialog component.
 */
const DialogRoot = Dialog.Root;

/**
 * DialogTrigger component - the button that opens the dialog.
 */
const DialogTrigger = Dialog.Trigger;

/**
 * DialogPortal component - portal for rendering dialog content.
 */
const DialogPortal = Dialog.Portal;

/**
 * DialogClose component - the button that closes the dialog.
 */
const DialogClose = Dialog.Close;

/**
 * DialogOverlay component - the backdrop overlay.
 *
 * @param props - Component props including className and standard Dialog.Overlay attributes.
 * @returns The rendered DialogOverlay component.
 */
function DialogOverlay({ className, ...props }: DialogOverlayProps): React.ReactElement {
    return (
        <Dialog.Overlay
            className={cn(
                'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                className,
            )}
            {...props}
        />
    );
}

DialogOverlay.displayName = 'DialogOverlay';

/**
 * DialogContent component - the main dialog content container.
 *
 * @param props - Component props including className and standard Dialog.Content attributes.
 * @returns The rendered DialogContent component.
 */
function DialogContent({ className, children, ...props }: DialogContentProps): React.ReactElement {
    return (
        <DialogPortal>
            <DialogOverlay />
            <Dialog.Content
                className={cn(
                    'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
                    className,
                )}
                {...props}
            >
                {children}
                <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </Dialog.Close>
            </Dialog.Content>
        </DialogPortal>
    );
}

DialogContent.displayName = 'DialogContent';

/**
 * DialogHeader component - contains title and description.
 *
 * @param props - Component props including className and standard div attributes.
 * @returns The rendered DialogHeader component.
 */
function DialogHeader({ className, ...props }: DialogHeaderProps): React.ReactElement {
    return <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />;
}

DialogHeader.displayName = 'DialogHeader';

/**
 * DialogFooter component - contains action buttons.
 *
 * @param props - Component props including className and standard div attributes.
 * @returns The rendered DialogFooter component.
 */
function DialogFooter({ className, ...props }: DialogFooterProps): React.ReactElement {
    return (
        <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
    );
}

DialogFooter.displayName = 'DialogFooter';

/**
 * DialogTitle component - the title of the dialog.
 *
 * @param props - Component props including className and standard Dialog.Title attributes.
 * @returns The rendered DialogTitle component.
 */
function DialogTitle({ className, ...props }: DialogTitleProps): React.ReactElement {
    return <Dialog.Title className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />;
}

DialogTitle.displayName = 'DialogTitle';

/**
 * DialogDescription component - a description for the dialog content.
 *
 * @param props - Component props including className and standard Dialog.Description attributes.
 * @returns The rendered DialogDescription component.
 */
function DialogDescription({ className, ...props }: DialogDescriptionProps): React.ReactElement {
    return <Dialog.Description className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

DialogDescription.displayName = 'DialogDescription';

export {
    DialogRoot as Dialog,
    DialogPortal,
    DialogOverlay,
    DialogTrigger,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
};
