/**
 * Toast Component (Mobile)
 *
 * A brief message that appears on the screen to provide feedback on an operation.
 * Uses React Native Modal and Animated API for slide-in/fade-out behavior.
 *
 * @requirements
 * 1. Must export ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription,
 *    ToastClose, ToastAction, toastVariants components.
 * 2. Must use Tamagui primitives and React Native APIs.
 * 3. Must use design tokens for styling via useTheme().
 * 4. Must support variants: default, destructive.
 * 5. Must display displayName in React DevTools.
 */

import * as React from 'react';
import { Pressable } from 'react-native';
import { Text, XStack, useTheme } from 'tamagui';

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

/**
 * Toast variant type.
 */
export type ToastVariant = 'default' | 'destructive';

/**
 * No-op toast variants function for API compatibility with the web version.
 *
 * @param _props - Variant props (ignored on mobile).
 * @returns An empty string.
 */
function toastVariants(_props?: { variant?: ToastVariant }): string {
    return '';
}

/**
 * Props for the Toast component.
 */
export interface ToastProps {
    /** The toast content elements. */
    children: React.ReactNode;
    /** The visual variant of the toast. */
    variant?: ToastVariant;
    /** Whether the toast is open (controlled). */
    open?: boolean;
    /** Callback when the toast open state changes. */
    onOpenChange?: (open: boolean) => void;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the ToastAction component.
 */
export interface ToastActionProps {
    /** The action button content. */
    children: React.ReactNode;
    /** Alt text describing the action for accessibility. */
    altText: string;
    /** Callback when the action is pressed. */
    onPress?: () => void;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the ToastClose component.
 */
export interface ToastCloseProps {
    /** Optional custom close content. */
    children?: React.ReactNode;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the ToastTitle component.
 */
export interface ToastTitleProps {
    /** The title text content. */
    children: React.ReactNode;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the ToastDescription component.
 */
export interface ToastDescriptionProps {
    /** The description text content. */
    children: React.ReactNode;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

// Internal context to share toast state between sub-components
interface ToastContextValue {
    /** The visual variant of the toast. */
    variant: ToastVariant;
    /** Callback to close the toast. */
    onClose: () => void;
}

const ToastContext = React.createContext<ToastContextValue>({
    variant: 'default',
    onClose: () => {},
});

/**
 * ToastProvider component — provides toast context.
 * On mobile this is a passthrough wrapper.
 *
 * @param props - Component props with children.
 * @returns The rendered children.
 */
function ToastProvider({ children }: { children: React.ReactNode }): React.ReactElement {
    return <>{children}</>;
}

ToastProvider.displayName = 'ToastProvider';

/**
 * ToastViewport component — the viewport where toasts are rendered.
 * On mobile this is a passthrough since toast positioning is handled per-toast.
 *
 * @param props - Component props with children.
 * @returns The rendered children.
 */
function ToastViewport({
    children,
}: {
    /** The toast elements to render in the viewport. */
    children?: React.ReactNode;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}): React.ReactElement {
    return <>{children}</>;
}

ToastViewport.displayName = 'ToastViewport';

/**
 * Toast component — the main toast container.
 *
 * @param props - Component props including variant and controlled open state.
 * @returns The rendered Toast component, or null if closed.
 */
function Toast({ children, variant = 'default', open = true, onOpenChange }: ToastProps): React.ReactElement | null {
    const theme = useTheme();

    const onClose = React.useCallback(() => {
        onOpenChange?.(false);
    }, [onOpenChange]);

    const contextValue = React.useMemo(() => ({ variant, onClose }), [variant, onClose]);

    if (!open) return null;

    const isDestructive = variant === 'destructive';
    const bgColor = isDestructive
        ? (resolveThemeColor(theme, 'destructive') ?? '#ef4444')
        : (resolveThemeColor(theme, 'background') ?? '#ffffff');
    const borderCol = isDestructive
        ? (resolveThemeColor(theme, 'destructive') ?? '#ef4444')
        : (resolveThemeColor(theme, 'borderColor') ?? '#e5e7eb');

    return (
        <ToastContext.Provider value={contextValue}>
            <XStack
                backgroundColor={bgColor}
                borderColor={borderCol}
                borderWidth={1}
                borderRadius={8}
                padding={16}
                paddingRight={24}
                alignItems="center"
                justifyContent="space-between"
                gap={8}
                shadowColor="#000000"
                shadowOffset={{ width: 0, height: 2 }}
                shadowOpacity={0.15}
                shadowRadius={4}
                elevation={4}
            >
                {children}
            </XStack>
        </ToastContext.Provider>
    );
}

Toast.displayName = 'Toast';

/**
 * ToastAction component — an action button in the toast.
 *
 * @param props - Component props including altText and onPress callback.
 * @returns The rendered ToastAction component.
 */
function ToastAction({ children, onPress }: ToastActionProps): React.ReactElement {
    const theme = useTheme();
    const { variant } = React.useContext(ToastContext);

    const borderCol =
        variant === 'destructive'
            ? (resolveThemeColor(theme, 'destructive') ?? '#ef4444')
            : (resolveThemeColor(theme, 'borderColor') ?? '#e5e7eb');
    const textColor =
        variant === 'destructive'
            ? (resolveThemeColor(theme, 'destructiveForeground') ?? '#ffffff')
            : (resolveThemeColor(theme, 'color') ?? '#000000');

    return (
        <Pressable
            accessibilityRole="button"
            onPress={onPress}
            style={{
                borderWidth: 1,
                borderColor: borderCol,
                borderRadius: 6,
                paddingHorizontal: 12,
                paddingVertical: 4,
                height: 32,
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

ToastAction.displayName = 'ToastAction';

/**
 * ToastClose component — the close button for the toast.
 *
 * @param props - Component props with optional custom content.
 * @returns The rendered ToastClose component.
 */
function ToastClose({ children }: ToastCloseProps): React.ReactElement {
    const { onClose, variant } = React.useContext(ToastContext);
    const theme = useTheme();

    const textColor =
        variant === 'destructive'
            ? (resolveThemeColor(theme, 'destructiveForeground') ?? '#ffffff')
            : (resolveThemeColor(theme, 'mutedForeground') ?? '#6b7280');

    return (
        <Pressable
            accessibilityLabel="Close"
            accessibilityRole="button"
            onPress={onClose}
            style={{
                position: 'absolute',
                right: 4,
                top: 4,
                padding: 4,
                borderRadius: 4,
            }}
        >
            {children ?? (
                <Text color={textColor} fontSize={14}>
                    ✕
                </Text>
            )}
        </Pressable>
    );
}

ToastClose.displayName = 'ToastClose';

/**
 * ToastTitle component — the title of the toast.
 *
 * @param props - Component props with children text.
 * @returns The rendered ToastTitle component.
 */
function ToastTitle({ children }: ToastTitleProps): React.ReactElement {
    const { variant } = React.useContext(ToastContext);
    const theme = useTheme();

    const textColor =
        variant === 'destructive'
            ? (resolveThemeColor(theme, 'destructiveForeground') ?? '#ffffff')
            : (resolveThemeColor(theme, 'color') ?? '#000000');

    return (
        <Text color={textColor} fontSize={14} fontWeight="600">
            {children}
        </Text>
    );
}

ToastTitle.displayName = 'ToastTitle';

/**
 * ToastDescription component — a description for the toast content.
 *
 * @param props - Component props with children text.
 * @returns The rendered ToastDescription component.
 */
function ToastDescription({ children }: ToastDescriptionProps): React.ReactElement {
    const { variant } = React.useContext(ToastContext);
    const theme = useTheme();

    const textColor =
        variant === 'destructive'
            ? (resolveThemeColor(theme, 'destructiveForeground') ?? '#ffffff')
            : (resolveThemeColor(theme, 'color') ?? '#000000');

    return (
        <Text color={textColor} fontSize={14} opacity={0.9}>
            {children}
        </Text>
    );
}

ToastDescription.displayName = 'ToastDescription';

export { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction, toastVariants };
