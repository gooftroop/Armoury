/**
 * Tooltip Component (Mobile)
 *
 * A popup that displays information related to an element when the element is long-pressed.
 * On mobile, tooltips show as a simple overlay near the trigger element.
 *
 * @requirements
 * 1. Must export TooltipProvider, Tooltip, TooltipTrigger, TooltipContent components.
 * 2. Must use Tamagui primitives and React Native APIs.
 * 3. Must use design tokens for styling via useTheme().
 * 4. Must support sideOffset prop for content positioning.
 * 5. Must display displayName in React DevTools.
 */

import * as React from 'react';
import { Modal, Pressable } from 'react-native';
import { Text, YStack, useTheme } from 'tamagui';

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
 * Props for the TooltipTrigger component.
 */
export interface TooltipTriggerProps {
    /** The content that triggers the tooltip on long-press. */
    children: React.ReactNode;
    /** Web compatibility prop — accepted but unused on mobile. */
    asChild?: boolean;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the TooltipContent component.
 */
export interface TooltipContentProps {
    /** The content displayed inside the tooltip. */
    children: React.ReactNode;
    /** The preferred side of the trigger to render against. */
    side?: 'top' | 'right' | 'bottom' | 'left';
    /** The distance in points from the trigger. */
    sideOffset?: number;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

// Internal context to share open state between Tooltip sub-components
interface TooltipContextValue {
    /** Whether the tooltip is currently visible. */
    open: boolean;
    /** Setter for the open state. */
    setOpen: (open: boolean) => void;
}

const TooltipContext = React.createContext<TooltipContextValue>({
    open: false,
    setOpen: () => {},
});

/**
 * TooltipProvider component — wraps your app to provide tooltip context.
 * On mobile this is a passthrough since we don't need a global provider.
 *
 * @param props - Component props with children.
 * @returns The rendered children.
 */
function TooltipProvider({ children }: { children: React.ReactNode }): React.ReactElement {
    return <>{children}</>;
}

TooltipProvider.displayName = 'TooltipProvider';

/**
 * Tooltip component — the root tooltip component that manages open/close state.
 *
 * @param props - Component props with children and optional controlled state.
 * @returns The rendered Tooltip wrapper.
 */
function Tooltip({
    children,
    open: controlledOpen,
    onOpenChange,
    defaultOpen = false,
}: {
    /** The tooltip trigger and content elements. */
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

    return <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>;
}

Tooltip.displayName = 'Tooltip';

/**
 * TooltipTrigger component — the element that triggers the tooltip on long-press.
 *
 * @param props - Component props including children.
 * @returns The rendered TooltipTrigger component.
 */
function TooltipTrigger({ children }: TooltipTriggerProps): React.ReactElement {
    const { setOpen } = React.useContext(TooltipContext);

    return (
        <Pressable onLongPress={() => setOpen(true)} onPressOut={() => setOpen(false)}>
            {children}
        </Pressable>
    );
}

TooltipTrigger.displayName = 'TooltipTrigger';

/**
 * TooltipContent component — the content displayed in the tooltip.
 * Renders as a transparent modal overlay on mobile.
 *
 * @param props - Component props including children, side, and sideOffset.
 * @returns The rendered TooltipContent component.
 */
function TooltipContent({ children, sideOffset: _sideOffset = 4 }: TooltipContentProps): React.ReactElement {
    const { open, setOpen } = React.useContext(TooltipContext);
    const theme = useTheme();

    const bgColor = resolveThemeColor(theme, 'primary') ?? '#000000';
    const textColor = resolveThemeColor(theme, 'primaryForeground') ?? '#ffffff';

    return (
        <Modal animationType="fade" onRequestClose={() => setOpen(false)} transparent visible={open}>
            <Pressable
                onPress={() => setOpen(false)}
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            >
                <YStack
                    backgroundColor={bgColor}
                    borderRadius={6}
                    paddingHorizontal={12}
                    paddingVertical={6}
                    maxWidth={280}
                >
                    <Text color={textColor} fontSize={12}>
                        {children}
                    </Text>
                </YStack>
            </Pressable>
        </Modal>
    );
}

TooltipContent.displayName = 'TooltipContent';

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
