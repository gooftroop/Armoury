/**
 * Dialog Component (Mobile)
 *
 * A modal dialog that overlays the page content.
 * Uses React Native Modal for native overlay behavior.
 *
 * @requirements
 * 1. Must export Dialog, DialogPortal, DialogOverlay, DialogTrigger, DialogClose,
 *    DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription components.
 * 2. Must use Tamagui primitives and React Native Modal.
 * 3. Must use design tokens for styling via useTheme().
 * 4. Must center content over a semi-transparent overlay.
 * 5. Must display displayName in React DevTools.
 */

import * as React from 'react';
import { Modal, Pressable } from 'react-native';
import { Text, XStack, YStack, useTheme } from 'tamagui';

/**
 * Resolves a theme color token to its string value.
 *
 * @param theme - The Tamagui theme object.
 * @param token - The token name to resolve.
 * @returns The resolved color string, or undefined.
 */
function resolveThemeColor(theme: ReturnType<typeof useTheme>, token: string): string | undefined {
    const themeRecord = theme as unknown as Record<string, { get?: () => string; val?: string } | undefined>;
    const value = themeRecord[token];
    if (value?.get) return value.get();
    return value?.val;
}

// Internal context for dialog open state
interface DialogContextValue {
    /** Whether the dialog is currently open. */
    open: boolean;
    /** Setter for the open state. */
    setOpen: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue>({
    open: false,
    setOpen: () => {},
});

/**
 * Props for the DialogOverlay component.
 */
export interface DialogOverlayProps {
    /** Optional custom overlay content. */
    children?: React.ReactNode;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the DialogContent component.
 */
export interface DialogContentProps {
    /** The dialog content elements. */
    children: React.ReactNode;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the DialogHeader component.
 */
export interface DialogHeaderProps {
    /** The header content elements. */
    children: React.ReactNode;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the DialogFooter component.
 */
export interface DialogFooterProps {
    /** The footer content elements. */
    children: React.ReactNode;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the DialogTitle component.
 */
export interface DialogTitleProps {
    /** The title text content. */
    children: React.ReactNode;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the DialogDescription component.
 */
export interface DialogDescriptionProps {
    /** The description text content. */
    children: React.ReactNode;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Dialog component — the root dialog that manages open/close state.
 *
 * @param props - Component props including controlled open state.
 * @returns The rendered Dialog wrapper.
 */
function Dialog({
    children,
    open: controlledOpen,
    onOpenChange,
    defaultOpen = false,
}: {
    /** The dialog trigger and content elements. */
    children: React.ReactNode;
    /** Controlled open state. */
    open?: boolean;
    /** Callback when open state changes. */
    onOpenChange?: (open: boolean) => void;
    /** Default open state for uncontrolled usage. */
    defaultOpen?: boolean;
}): React.ReactElement {
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;

    const setOpen = React.useCallback(
        (nextOpen: boolean) => {
            if (!isControlled) {
                setInternalOpen(nextOpen);
            }
            onOpenChange?.(nextOpen);
        },
        [isControlled, onOpenChange],
    );

    const value = React.useMemo(() => ({ open, setOpen }), [open, setOpen]);

    return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}

Dialog.displayName = 'Dialog';

/**
 * DialogPortal component — on mobile this is a passthrough.
 * Portal behavior is handled by React Native Modal.
 *
 * @param props - Component props with children.
 * @returns The rendered children.
 */
function DialogPortal({ children }: { children: React.ReactNode }): React.ReactElement {
    return <>{children}</>;
}

DialogPortal.displayName = 'DialogPortal';

/**
 * DialogOverlay component — the backdrop overlay.
 * On mobile this is rendered as part of DialogContent's Modal.
 *
 * @param _props - Component props (visual-only, rendered by DialogContent).
 * @returns Null — overlay is rendered by DialogContent.
 */
function DialogOverlay(_props: DialogOverlayProps): React.ReactElement | null {
    return null;
}

DialogOverlay.displayName = 'DialogOverlay';

/**
 * DialogTrigger component — the button that opens the dialog.
 *
 * @param props - Component props with children.
 * @returns The rendered DialogTrigger component.
 */
function DialogTrigger({
    children,
}: {
    /** The trigger element content. */
    children: React.ReactNode;
    /** Web compatibility prop — accepted but unused on mobile. */
    asChild?: boolean;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}): React.ReactElement {
    const { setOpen } = React.useContext(DialogContext);

    return (
        <Pressable accessibilityRole="button" onPress={() => setOpen(true)}>
            {children}
        </Pressable>
    );
}

DialogTrigger.displayName = 'DialogTrigger';

/**
 * DialogClose component — the button that closes the dialog.
 *
 * @param props - Component props with children.
 * @returns The rendered DialogClose component.
 */
function DialogClose({
    children,
}: {
    /** The close button content. */
    children?: React.ReactNode;
    /** Web compatibility prop — accepted but unused on mobile. */
    asChild?: boolean;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}): React.ReactElement {
    const { setOpen } = React.useContext(DialogContext);
    const theme = useTheme();

    const textColor = resolveThemeColor(theme, 'mutedForeground') ?? '#6b7280';

    return (
        <Pressable
            accessibilityLabel="Close"
            accessibilityRole="button"
            onPress={() => setOpen(false)}
            style={{
                position: 'absolute',
                right: 16,
                top: 16,
                padding: 4,
                borderRadius: 4,
                zIndex: 1,
            }}
        >
            {children ?? (
                <Text color={textColor} fontSize={16}>
                    ✕
                </Text>
            )}
        </Pressable>
    );
}

DialogClose.displayName = 'DialogClose';

/**
 * DialogContent component — the main dialog content container.
 * Renders as a centered React Native Modal with overlay.
 *
 * @param props - Component props with children content.
 * @returns The rendered DialogContent component.
 */
function DialogContent({ children }: DialogContentProps): React.ReactElement {
    const { open, setOpen } = React.useContext(DialogContext);
    const theme = useTheme();

    const bgColor = resolveThemeColor(theme, 'background') ?? '#ffffff';
    const borderCol = resolveThemeColor(theme, 'borderColor') ?? '#e5e7eb';

    return (
        <Modal animationType="fade" onRequestClose={() => setOpen(false)} transparent visible={open}>
            <Pressable
                onPress={() => setOpen(false)}
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                }}
            >
                <Pressable onPress={(e) => e.stopPropagation()}>
                    <YStack
                        backgroundColor={bgColor}
                        borderColor={borderCol}
                        borderWidth={1}
                        borderRadius={12}
                        padding={24}
                        gap={16}
                        width={340}
                        maxWidth="90%"
                        shadowColor="#000000"
                        shadowOffset={{ width: 0, height: 4 }}
                        shadowOpacity={0.25}
                        shadowRadius={8}
                        elevation={8}
                    >
                        {children}
                        <DialogClose />
                    </YStack>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

DialogContent.displayName = 'DialogContent';

/**
 * DialogHeader component — contains title and description.
 *
 * @param props - Component props with children content.
 * @returns The rendered DialogHeader component.
 */
function DialogHeader({ children }: DialogHeaderProps): React.ReactElement {
    return <YStack gap={6}>{children}</YStack>;
}

DialogHeader.displayName = 'DialogHeader';

/**
 * DialogFooter component — contains action buttons.
 *
 * @param props - Component props with children content.
 * @returns The rendered DialogFooter component.
 */
function DialogFooter({ children }: DialogFooterProps): React.ReactElement {
    return (
        <XStack justifyContent="flex-end" gap={8}>
            {children}
        </XStack>
    );
}

DialogFooter.displayName = 'DialogFooter';

/**
 * DialogTitle component — the title of the dialog.
 *
 * @param props - Component props with children text.
 * @returns The rendered DialogTitle component.
 */
function DialogTitle({ children }: DialogTitleProps): React.ReactElement {
    const theme = useTheme();
    const textColor = resolveThemeColor(theme, 'color') ?? '#000000';

    return (
        <Text color={textColor} fontSize={18} fontWeight="600" lineHeight={24}>
            {children}
        </Text>
    );
}

DialogTitle.displayName = 'DialogTitle';

/**
 * DialogDescription component — a description for the dialog content.
 *
 * @param props - Component props with children text.
 * @returns The rendered DialogDescription component.
 */
function DialogDescription({ children }: DialogDescriptionProps): React.ReactElement {
    const theme = useTheme();
    const textColor = resolveThemeColor(theme, 'mutedForeground') ?? '#6b7280';

    return (
        <Text color={textColor} fontSize={14}>
            {children}
        </Text>
    );
}

DialogDescription.displayName = 'DialogDescription';

export {
    Dialog,
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
