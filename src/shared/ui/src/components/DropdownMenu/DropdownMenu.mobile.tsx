/**
 * DropdownMenu Component (Mobile)
 *
 * Displays a menu to the user — triggered by a button — with a list of actions or options.
 * Uses React Native Modal and ScrollView for native menu behavior.
 *
 * @requirements
 * 1. Must export DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
 *    DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator,
 *    DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub,
 *    DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuRadioGroup components.
 * 2. Must use Tamagui primitives and React Native Modal/ScrollView.
 * 3. Must use design tokens for styling via useTheme().
 * 4. Must support checkbox items, radio items, sub-menus, and labels.
 * 5. Must display displayName in React DevTools.
 */

import * as React from 'react';
import { Modal, Pressable, ScrollView } from 'react-native';
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

// Internal context for dropdown menu state
interface DropdownMenuContextValue {
    /** Whether the menu is currently open. */
    open: boolean;
    /** Setter for the open state. */
    setOpen: (open: boolean) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue>({
    open: false,
    setOpen: () => {},
});

// Internal context for radio group value
interface RadioGroupContextValue {
    /** The currently selected radio value. */
    value: string;
    /** Callback when the radio value changes. */
    onValueChange: (value: string) => void;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue>({
    value: '',
    onValueChange: () => {},
});

/**
 * Props for the DropdownMenuTrigger component.
 */
export interface DropdownMenuTriggerProps {
    /** The trigger element content. */
    children: React.ReactNode;
    /** Web compatibility prop — accepted but unused on mobile. */
    asChild?: boolean;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the DropdownMenuContent component.
 */
export interface DropdownMenuContentProps {
    /** The menu content elements. */
    children: React.ReactNode;
    /** Side offset from the trigger. */
    sideOffset?: number;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the DropdownMenuItem component.
 */
export interface DropdownMenuItemProps {
    /** The menu item content. */
    children: React.ReactNode;
    /** Whether to inset the item (add left padding). */
    inset?: boolean;
    /** Whether the item is disabled. */
    disabled?: boolean;
    /** Callback when the item is pressed. */
    onPress?: () => void;
    /** Callback from Radix API — mapped to onPress on mobile. */
    onSelect?: () => void;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the DropdownMenuCheckboxItem component.
 */
export interface DropdownMenuCheckboxItemProps {
    /** The checkbox item content. */
    children: React.ReactNode;
    /** Whether the checkbox is checked. */
    checked?: boolean;
    /** Callback when checked state changes. */
    onCheckedChange?: (checked: boolean) => void;
    /** Whether the item is disabled. */
    disabled?: boolean;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the DropdownMenuRadioItem component.
 */
export interface DropdownMenuRadioItemProps {
    /** The radio item content. */
    children: React.ReactNode;
    /** The value associated with this radio item. */
    value: string;
    /** Whether the item is disabled. */
    disabled?: boolean;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the DropdownMenuLabel component.
 */
export interface DropdownMenuLabelProps {
    /** The label text content. */
    children: React.ReactNode;
    /** Whether to inset the label (add left padding). */
    inset?: boolean;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the DropdownMenuSeparator component.
 */
export interface DropdownMenuSeparatorProps {
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the DropdownMenuShortcut component.
 */
export interface DropdownMenuShortcutProps {
    /** The shortcut text content. */
    children: React.ReactNode;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the DropdownMenuSubTrigger component.
 */
export interface DropdownMenuSubTriggerProps {
    /** The sub-trigger content. */
    children: React.ReactNode;
    /** Whether to inset the trigger (add left padding). */
    inset?: boolean;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the DropdownMenuSubContent component.
 */
export interface DropdownMenuSubContentProps {
    /** The sub-menu content elements. */
    children: React.ReactNode;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * DropdownMenu component — the root menu that manages open/close state.
 *
 * @param props - Component props with children and optional controlled state.
 * @returns The rendered DropdownMenu wrapper.
 */
function DropdownMenu({
    children,
    open: controlledOpen,
    onOpenChange,
    defaultOpen = false,
}: {
    /** The menu trigger and content elements. */
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

    return <DropdownMenuContext.Provider value={value}>{children}</DropdownMenuContext.Provider>;
}

DropdownMenu.displayName = 'DropdownMenu';

/**
 * DropdownMenuTrigger component — the button that opens the menu.
 *
 * @param props - Component props with children.
 * @returns The rendered DropdownMenuTrigger component.
 */
function DropdownMenuTrigger({ children }: DropdownMenuTriggerProps): React.ReactElement {
    const { setOpen } = React.useContext(DropdownMenuContext);

    return (
        <Pressable accessibilityRole="button" onPress={() => setOpen(true)}>
            {children}
        </Pressable>
    );
}

DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

/**
 * DropdownMenuPortal component — on mobile this is a passthrough.
 *
 * @param props - Component props with children.
 * @returns The rendered children.
 */
function DropdownMenuPortal({ children }: { children: React.ReactNode }): React.ReactElement {
    return <>{children}</>;
}

DropdownMenuPortal.displayName = 'DropdownMenuPortal';

/**
 * DropdownMenuGroup component — groups related items.
 *
 * @param props - Component props with children.
 * @returns The rendered DropdownMenuGroup component.
 */
function DropdownMenuGroup({ children }: { children: React.ReactNode }): React.ReactElement {
    return <YStack>{children}</YStack>;
}

DropdownMenuGroup.displayName = 'DropdownMenuGroup';

/**
 * DropdownMenuSub component — submenu container.
 * On mobile, sub-menus render inline since nested modals are problematic.
 *
 * @param props - Component props with children.
 * @returns The rendered DropdownMenuSub component.
 */
function DropdownMenuSub({ children }: { children: React.ReactNode }): React.ReactElement {
    return <YStack>{children}</YStack>;
}

DropdownMenuSub.displayName = 'DropdownMenuSub';

/**
 * DropdownMenuRadioGroup component — radio button group container.
 *
 * @param props - Component props with value and onValueChange.
 * @returns The rendered DropdownMenuRadioGroup component.
 */
function DropdownMenuRadioGroup({
    children,
    value: controlledValue,
    onValueChange,
}: {
    /** The radio group content elements. */
    children: React.ReactNode;
    /** The currently selected value. */
    value?: string;
    /** Callback when value changes. */
    onValueChange?: (value: string) => void;
}): React.ReactElement {
    const [internalValue, setInternalValue] = React.useState(controlledValue ?? '');

    const handleValueChange = React.useCallback(
        (nextValue: string) => {
            if (controlledValue === undefined) {
                setInternalValue(nextValue);
            }
            onValueChange?.(nextValue);
        },
        [controlledValue, onValueChange],
    );

    const contextValue = React.useMemo(
        () => ({ value: controlledValue ?? internalValue, onValueChange: handleValueChange }),
        [controlledValue, internalValue, handleValueChange],
    );

    return (
        <RadioGroupContext.Provider value={contextValue}>
            <YStack>{children}</YStack>
        </RadioGroupContext.Provider>
    );
}

DropdownMenuRadioGroup.displayName = 'DropdownMenuRadioGroup';

/**
 * DropdownMenuContent component — the main menu content container.
 * Renders as a bottom sheet modal on mobile.
 *
 * @param props - Component props with children content.
 * @returns The rendered DropdownMenuContent component.
 */
function DropdownMenuContent({ children }: DropdownMenuContentProps): React.ReactElement {
    const { open, setOpen } = React.useContext(DropdownMenuContext);
    const theme = useTheme();

    const bgColor = resolveThemeColor(theme, 'popover') ?? '#ffffff';
    const borderCol = resolveThemeColor(theme, 'borderColor') ?? '#e5e7eb';

    return (
        <Modal animationType="fade" onRequestClose={() => setOpen(false)} transparent visible={open}>
            <Pressable
                onPress={() => setOpen(false)}
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                }}
            >
                <Pressable onPress={(e) => e.stopPropagation()}>
                    <YStack
                        backgroundColor={bgColor}
                        borderColor={borderCol}
                        borderWidth={1}
                        borderRadius={8}
                        padding={4}
                        minWidth={200}
                        maxHeight={400}
                        shadowColor="#000000"
                        shadowOffset={{ width: 0, height: 4 }}
                        shadowOpacity={0.15}
                        shadowRadius={8}
                        elevation={8}
                    >
                        <ScrollView bounces={false}>{children}</ScrollView>
                    </YStack>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

DropdownMenuContent.displayName = 'DropdownMenuContent';

/**
 * DropdownMenuItem component — an individual item in the menu.
 *
 * @param props - Component props with onPress/onSelect callback.
 * @returns The rendered DropdownMenuItem component.
 */
function DropdownMenuItem({
    children,
    inset = false,
    disabled = false,
    onPress,
    onSelect,
}: DropdownMenuItemProps): React.ReactElement {
    const { setOpen } = React.useContext(DropdownMenuContext);
    const theme = useTheme();

    const textColor = resolveThemeColor(theme, 'popoverForeground') ?? '#000000';

    const handlePress = React.useCallback(() => {
        if (!disabled) {
            onPress?.();
            onSelect?.();
            setOpen(false);
        }
    }, [disabled, onPress, onSelect, setOpen]);

    return (
        <Pressable
            accessibilityRole="menuitem"
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={handlePress}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                borderRadius: 4,
                paddingHorizontal: 8,
                paddingVertical: 6,
                paddingLeft: inset ? 32 : 8,
                opacity: disabled ? 0.5 : 1,
            }}
        >
            <Text color={textColor} fontSize={14}>
                {children}
            </Text>
        </Pressable>
    );
}

DropdownMenuItem.displayName = 'DropdownMenuItem';

/**
 * DropdownMenuCheckboxItem component — a checkbox item in the menu.
 *
 * @param props - Component props with checked state.
 * @returns The rendered DropdownMenuCheckboxItem component.
 */
function DropdownMenuCheckboxItem({
    children,
    checked = false,
    onCheckedChange,
    disabled = false,
}: DropdownMenuCheckboxItemProps): React.ReactElement {
    const theme = useTheme();
    const textColor = resolveThemeColor(theme, 'popoverForeground') ?? '#000000';

    const handlePress = React.useCallback(() => {
        if (!disabled) {
            onCheckedChange?.(!checked);
        }
    }, [disabled, checked, onCheckedChange]);

    return (
        <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked, disabled }}
            disabled={disabled}
            onPress={handlePress}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 4,
                paddingVertical: 6,
                paddingLeft: 32,
                paddingRight: 8,
                opacity: disabled ? 0.5 : 1,
            }}
        >
            <XStack position="absolute" left={8} width={14} height={14} alignItems="center" justifyContent="center">
                {checked ? <Text fontSize={12}>✓</Text> : null}
            </XStack>
            <Text color={textColor} fontSize={14}>
                {children}
            </Text>
        </Pressable>
    );
}

DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

/**
 * DropdownMenuRadioItem component — a radio item in the menu.
 *
 * @param props - Component props with value.
 * @returns The rendered DropdownMenuRadioItem component.
 */
function DropdownMenuRadioItem({
    children,
    value: itemValue,
    disabled = false,
}: DropdownMenuRadioItemProps): React.ReactElement {
    const { value: groupValue, onValueChange } = React.useContext(RadioGroupContext);
    const theme = useTheme();

    const isSelected = groupValue === itemValue;
    const textColor = resolveThemeColor(theme, 'popoverForeground') ?? '#000000';

    const handlePress = React.useCallback(() => {
        if (!disabled) {
            onValueChange(itemValue);
        }
    }, [disabled, itemValue, onValueChange]);

    return (
        <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected, disabled }}
            disabled={disabled}
            onPress={handlePress}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 4,
                paddingVertical: 6,
                paddingLeft: 32,
                paddingRight: 8,
                opacity: disabled ? 0.5 : 1,
            }}
        >
            <XStack position="absolute" left={8} width={14} height={14} alignItems="center" justifyContent="center">
                {isSelected ? <Text fontSize={8}>●</Text> : null}
            </XStack>
            <Text color={textColor} fontSize={14}>
                {children}
            </Text>
        </Pressable>
    );
}

DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem';

/**
 * DropdownMenuLabel component — a label for a group of items.
 *
 * @param props - Component props with children text.
 * @returns The rendered DropdownMenuLabel component.
 */
function DropdownMenuLabel({ children, inset = false }: DropdownMenuLabelProps): React.ReactElement {
    const theme = useTheme();
    const textColor = resolveThemeColor(theme, 'popoverForeground') ?? '#000000';

    return (
        <YStack paddingHorizontal={8} paddingVertical={6} paddingLeft={inset ? 32 : 8}>
            <Text color={textColor} fontSize={14} fontWeight="600">
                {children}
            </Text>
        </YStack>
    );
}

DropdownMenuLabel.displayName = 'DropdownMenuLabel';

/**
 * DropdownMenuSeparator component — a visual separator between items.
 *
 * @param _props - Component props.
 * @returns The rendered DropdownMenuSeparator component.
 */
function DropdownMenuSeparator(_props: DropdownMenuSeparatorProps): React.ReactElement {
    const theme = useTheme();
    const bgColor = resolveThemeColor(theme, 'muted') ?? '#e5e7eb';

    return <YStack height={1} backgroundColor={bgColor} marginVertical={4} marginHorizontal={-4} />;
}

DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

/**
 * DropdownMenuShortcut component — displays a keyboard shortcut hint.
 * On mobile, keyboard shortcuts are not actionable but may be shown for reference.
 *
 * @param props - Component props with children text.
 * @returns The rendered DropdownMenuShortcut component.
 */
function DropdownMenuShortcut({ children }: DropdownMenuShortcutProps): React.ReactElement {
    const theme = useTheme();
    const textColor = resolveThemeColor(theme, 'mutedForeground') ?? '#6b7280';

    return (
        <Text color={textColor} fontSize={12} opacity={0.6} marginLeft="auto">
            {children}
        </Text>
    );
}

DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

/**
 * DropdownMenuSubTrigger component — trigger for a submenu.
 * On mobile, sub-menus render inline so this is just a label row.
 *
 * @param props - Component props with children.
 * @returns The rendered DropdownMenuSubTrigger component.
 */
function DropdownMenuSubTrigger({ children, inset = false }: DropdownMenuSubTriggerProps): React.ReactElement {
    const theme = useTheme();
    const textColor = resolveThemeColor(theme, 'popoverForeground') ?? '#000000';

    return (
        <XStack
            alignItems="center"
            gap={8}
            borderRadius={4}
            paddingHorizontal={8}
            paddingVertical={6}
            paddingLeft={inset ? 32 : 8}
        >
            <Text color={textColor} fontSize={14} flex={1}>
                {children}
            </Text>
            <Text color={textColor} fontSize={14} opacity={0.5}>
                ›
            </Text>
        </XStack>
    );
}

DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';

/**
 * DropdownMenuSubContent component — content for a submenu.
 * On mobile, renders inline as a slightly indented section.
 *
 * @param props - Component props with children.
 * @returns The rendered DropdownMenuSubContent component.
 */
function DropdownMenuSubContent({ children }: DropdownMenuSubContentProps): React.ReactElement {
    return <YStack paddingLeft={8}>{children}</YStack>;
}

DropdownMenuSubContent.displayName = 'DropdownMenuSubContent';

export {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuGroup,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuRadioGroup,
};
