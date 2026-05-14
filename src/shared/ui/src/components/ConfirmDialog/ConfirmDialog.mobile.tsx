/**
 * ConfirmDialog Component (Mobile)
 *
 * A convenience wrapper around AlertDialog for confirming destructive actions on mobile.
 *
 * @requirements
 * 1. Must export ConfirmDialog component and ConfirmDialogProps type.
 * 2. Must wrap mobile AlertDialog primitives.
 * 3. Must accept title, description, confirmLabel, cancelLabel, onConfirm, and variant props.
 * 4. Must support destructive variant for delete confirmations.
 * 5. Must be controlled via open/onOpenChange props.
 * 6. Must display displayName in React DevTools.
 */

import * as React from 'react';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/AlertDialog/AlertDialog.mobile.js';

/**
 * Props for the ConfirmDialog component.
 */
export interface ConfirmDialogProps {
    /** Whether the dialog is open. */
    open: boolean;
    /** Callback fired when the open state changes. */
    onOpenChange: (open: boolean) => void;
    /** The dialog title. */
    title: string;
    /** The dialog description explaining the action to confirm. */
    description: string;
    /** Label for the confirm button. Defaults to "Confirm". */
    confirmLabel?: string;
    /** Label for the cancel button. Defaults to "Cancel". */
    cancelLabel?: string;
    /** Callback fired when the user confirms the action. */
    onConfirm: () => void;
    /** Visual variant of the confirm button. Defaults to "destructive". */
    variant?: 'destructive' | 'primary';
    /** Optional children rendered inside the dialog body, below the description. */
    children?: React.ReactNode;
}

/**
 * ConfirmDialog component — a modal for confirming destructive or important actions on mobile.
 *
 * @param props - Component props including open, onOpenChange, title, description, onConfirm, and variant.
 * @returns The rendered ConfirmDialog component.
 */
function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    variant = 'destructive',
    children,
}: ConfirmDialogProps): React.ReactElement {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>

                {children}

                <AlertDialogFooter>
                    <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
                    <AlertDialogAction onPress={onConfirm} variant={variant}>
                        {confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

ConfirmDialog.displayName = 'ConfirmDialog';

export { ConfirmDialog };
