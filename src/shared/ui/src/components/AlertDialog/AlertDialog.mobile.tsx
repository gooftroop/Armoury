/**
 * AlertDialog Component (Mobile)
 *
 * A modal dialog that interrupts the user with important content and expects a response.
 * Uses React Native Modal for native overlay behavior with action/cancel buttons.
 *
 * @requirements
 * 1. Must export AlertDialog, AlertDialogPortal, AlertDialogOverlay, AlertDialogTrigger,
 *    AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle,
 *    AlertDialogDescription, AlertDialogAction, AlertDialogCancel components.
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

// Internal context for alert dialog open state
interface AlertDialogContextValue {
    /** Whether the dialog is currently open. */
    open: boolean;
    /** Setter for the open state. */
    setOpen: (open: boolean) => void;
}

const AlertDialogContext = React.createContext<AlertDialogContextValue>({
    open: false,
    setOpen: () => {},
});

/**
 * Props for the AlertDialogOverlay component.
 */
export interface AlertDialogOverlayProps {
    /** Optional custom overlay content. */
    children?: React.ReactNode;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the AlertDialogContent component.
 */
export interface AlertDialogContentProps {
    /** The dialog content elements. */
    children: React.ReactNode;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the AlertDialogHeader component.
 */
export interface AlertDialogHeaderProps {
    /** The header content elements. */
    children: React.ReactNode;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the AlertDialogFooter component.
 */
export interface AlertDialogFooterProps {
    /** The footer content elements. */
    children: React.ReactNode;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the AlertDialogTitle component.
 */
export interface AlertDialogTitleProps {
    /** The title text content. */
    children: React.ReactNode;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the AlertDialogDescription component.
 */
export interface AlertDialogDescriptionProps {
    /** The description text content. */
    children: React.ReactNode;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the AlertDialogAction component.
 */
export interface AlertDialogActionProps {
    /** The action button content. */
    children: React.ReactNode;
    /** Callback when the action is pressed. */
    onPress?: () => void;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the AlertDialogCancel component.
 */
export interface AlertDialogCancelProps {
    /** The cancel button content. */
    children: React.ReactNode;
    /** Callback when the cancel is pressed. */
    onPress?: () => void;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * AlertDialog component — the root alert dialog that manages open/close state.
 *
 * @param props - Component props including controlled open state.
 * @returns The rendered AlertDialog wrapper.
 */
function AlertDialog({
    children,
    open: controlledOpen,
    onOpenChange,
    defaultOpen = false,
}: {
    /** The alert dialog trigger and content elements. */
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

    return <AlertDialogContext.Provider value={value}>{children}</AlertDialogContext.Provider>;
}

AlertDialog.displayName = 'AlertDialog';

/**
 * AlertDialogPortal component — on mobile this is a passthrough.
 *
 * @param props - Component props with children.
 * @returns The rendered children.
 */
function AlertDialogPortal({ children }: { children: React.ReactNode }): React.ReactElement {
    return <>{children}</>;
}

AlertDialogPortal.displayName = 'AlertDialogPortal';

/**
 * AlertDialogOverlay component — the backdrop overlay.
 * On mobile this is rendered as part of AlertDialogContent's Modal.
 *
 * @param _props - Component props (visual-only, rendered by AlertDialogContent).
 * @returns Null — overlay is rendered by AlertDialogContent.
 */
function AlertDialogOverlay(_props: AlertDialogOverlayProps): React.ReactElement | null {
    return null;
}

AlertDialogOverlay.displayName = 'AlertDialogOverlay';

/**
 * AlertDialogTrigger component — the button that opens the alert dialog.
 *
 * @param props - Component props with children.
 * @returns The rendered AlertDialogTrigger component.
 */
function AlertDialogTrigger({
    children,
}: {
    /** The trigger element content. */
    children: React.ReactNode;
    /** Web compatibility prop — accepted but unused on mobile. */
    asChild?: boolean;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}): React.ReactElement {
    const { setOpen } = React.useContext(AlertDialogContext);

    return (
        <Pressable accessibilityRole="button" onPress={() => setOpen(true)}>
            {children}
        </Pressable>
    );
}

AlertDialogTrigger.displayName = 'AlertDialogTrigger';

/**
 * AlertDialogContent component — the main alert dialog content container.
 * Renders as a centered React Native Modal. Unlike Dialog, tapping the overlay
 * does NOT close the alert — user must press Action or Cancel.
 *
 * @param props - Component props with children content.
 * @returns The rendered AlertDialogContent component.
 */
function AlertDialogContent({ children }: AlertDialogContentProps): React.ReactElement {
    const { open } = React.useContext(AlertDialogContext);
    const theme = useTheme();

    const bgColor = resolveThemeColor(theme, 'background') ?? '#ffffff';
    const borderCol = resolveThemeColor(theme, 'borderColor') ?? '#e5e7eb';

    return (
        <Modal animationType="fade" transparent visible={open}>
            <Pressable
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
                    </YStack>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

AlertDialogContent.displayName = 'AlertDialogContent';

/**
 * AlertDialogHeader component — contains title and description.
 *
 * @param props - Component props with children content.
 * @returns The rendered AlertDialogHeader component.
 */
function AlertDialogHeader({ children }: AlertDialogHeaderProps): React.ReactElement {
    return (
        <YStack gap={8}>
            {children}
        </YStack>
    );
}

AlertDialogHeader.displayName = 'AlertDialogHeader';

/**
 * AlertDialogFooter component — contains action buttons.
 *
 * @param props - Component props with children content.
 * @returns The rendered AlertDialogFooter component.
 */
function AlertDialogFooter({ children }: AlertDialogFooterProps): React.ReactElement {
    return (
        <XStack justifyContent="flex-end" gap={8}>
            {children}
        </XStack>
    );
}

AlertDialogFooter.displayName = 'AlertDialogFooter';

/**
 * AlertDialogTitle component — the title of the alert dialog.
 *
 * @param props - Component props with children text.
 * @returns The rendered AlertDialogTitle component.
 */
function AlertDialogTitle({ children }: AlertDialogTitleProps): React.ReactElement {
    const theme = useTheme();
    const textColor = resolveThemeColor(theme, 'color') ?? '#000000';

    return (
        <Text color={textColor} fontSize={18} fontWeight="600">
            {children}
        </Text>
    );
}

AlertDialogTitle.displayName = 'AlertDialogTitle';

/**
 * AlertDialogDescription component — a description for the alert dialog content.
 *
 * @param props - Component props with children text.
 * @returns The rendered AlertDialogDescription component.
 */
function AlertDialogDescription({ children }: AlertDialogDescriptionProps): React.ReactElement {
    const theme = useTheme();
    const textColor = resolveThemeColor(theme, 'mutedForeground') ?? '#6b7280';

    return (
        <Text color={textColor} fontSize={14}>
            {children}
        </Text>
    );
}

AlertDialogDescription.displayName = 'AlertDialogDescription';

/**
 * AlertDialogAction component — the confirm action button.
 * Styled as a primary button matching buttonVariants() default style.
 *
 * @param props - Component props with children and onPress callback.
 * @returns The rendered AlertDialogAction component.
 */
function AlertDialogAction({ children, onPress }: AlertDialogActionProps): React.ReactElement {
    const { setOpen } = React.useContext(AlertDialogContext);
    const theme = useTheme();

    const bgColor = resolveThemeColor(theme, 'primary') ?? '#000000';
    const textColor = resolveThemeColor(theme, 'primaryForeground') ?? '#ffffff';

    const handlePress = React.useCallback(() => {
        onPress?.();
        setOpen(false);
    }, [onPress, setOpen]);

    return (
        <Pressable
            accessibilityRole="button"
            onPress={handlePress}
            style={{
                backgroundColor: bgColor,
                borderRadius: 6,
                paddingHorizontal: 16,
                paddingVertical: 8,
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Text color={textColor} fontSize={14} fontWeight="500">
                {children}
            </Text>
        </Pressable>
    );
}

AlertDialogAction.displayName = 'AlertDialogAction';

/**
 * AlertDialogCancel component — the cancel action button.
 * Styled as an outline button matching buttonVariants({ variant: 'outline' }) style.
 *
 * @param props - Component props with children and onPress callback.
 * @returns The rendered AlertDialogCancel component.
 */
function AlertDialogCancel({ children, onPress }: AlertDialogCancelProps): React.ReactElement {
    const { setOpen } = React.useContext(AlertDialogContext);
    const theme = useTheme();

    const borderCol = resolveThemeColor(theme, 'borderColor') ?? '#e5e7eb';
    const textColor = resolveThemeColor(theme, 'color') ?? '#000000';

    const handlePress = React.useCallback(() => {
        onPress?.();
        setOpen(false);
    }, [onPress, setOpen]);

    return (
        <Pressable
            accessibilityRole="button"
            onPress={handlePress}
            style={{
                borderWidth: 1,
                borderColor: borderCol,
                borderRadius: 6,
                paddingHorizontal: 16,
                paddingVertical: 8,
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Text color={textColor} fontSize={14} fontWeight="500">
                {children}
            </Text>
        </Pressable>
    );
}

AlertDialogCancel.displayName = 'AlertDialogCancel';

export {
    AlertDialog,
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
