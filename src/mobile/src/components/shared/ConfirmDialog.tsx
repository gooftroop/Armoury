/**
 * ConfirmDialog Component
 *
 * A convenience wrapper around Tamagui AlertDialog for confirming destructive actions.
 * Renders a modal with title, description, and confirm/cancel buttons.
 *
 * @requirements
 * 1. Must export ConfirmDialog component and ConfirmDialogProps type.
 * 2. Must wrap Tamagui AlertDialog primitives.
 * 3. Must accept title, description, confirmLabel, cancelLabel, onConfirm, and variant props.
 * 4. Must support destructive variant for delete confirmations.
 * 5. Must be controlled via open/onOpenChange props.
 * 6. Must display displayName in React DevTools.
 * 7. Must not use default exports.
 */

import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { AlertDialog, Button, Paragraph } from 'tamagui';

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
}

/**
 * ConfirmDialog — a modal for confirming destructive or important actions.
 *
 * Wraps Tamagui AlertDialog with a simplified API for common confirm/cancel flows.
 * Defaults to destructive styling appropriate for delete confirmations.
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
}: ConfirmDialogProps): React.ReactElement {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialog.Portal>
                <AlertDialog.Overlay key="overlay" opacity={0.5} />

                <AlertDialog.Content
                    key="content"
                    elevate
                    borderWidth={1}
                    borderColor="$borderColor"
                    style={styles.content}
                >
                    <AlertDialog.Title size="$7" fontWeight="600">
                        {title}
                    </AlertDialog.Title>

                    <AlertDialog.Description>
                        <Paragraph color="$mutedForeground" size="$3">
                            {description}
                        </Paragraph>
                    </AlertDialog.Description>

                    <View style={styles.actions}>
                        <AlertDialog.Cancel asChild>
                            <Button variant="outlined" size="$3">
                                {cancelLabel}
                            </Button>
                        </AlertDialog.Cancel>

                        <AlertDialog.Action asChild>
                            <Button
                                size="$3"
                                background={variant === 'destructive' ? '$destructive' : '$primary'}
                                onPress={onConfirm}
                            >
                                <Paragraph color="white" fontWeight="600" size="$2">
                                    {confirmLabel}
                                </Paragraph>
                            </Button>
                        </AlertDialog.Action>
                    </View>
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog>
    );
}

ConfirmDialog.displayName = 'ConfirmDialog';

const styles = StyleSheet.create({
    content: {
        maxWidth: 340,
        alignSelf: 'center',
        padding: 24,
        gap: 12,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'flex-end',
        marginTop: 8,
    },
});

export { ConfirmDialog };
