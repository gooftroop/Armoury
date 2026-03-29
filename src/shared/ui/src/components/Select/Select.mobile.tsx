/**
 * Select Component (Mobile)
 *
 * Displays a list of options for the user to pick from — triggered by a button.
 * Uses React Native Modal and ScrollView for native select behavior.
 *
 * @requirements
 * 1. Must export Select, SelectGroup, SelectValue, SelectTrigger, SelectContent,
 *    SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton components.
 * 2. Must use Tamagui primitives and React Native Modal/ScrollView.
 * 3. Must use design tokens for styling via useTheme().
 * 4. Must support controlled and uncontrolled value selection.
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

// Internal context for select state
interface SelectContextValue {
    /** Whether the select dropdown is open. */
    open: boolean;
    /** Setter for the open state. */
    setOpen: (open: boolean) => void;
    /** The currently selected value. */
    value: string;
    /** Callback when a value is selected. */
    onValueChange: (value: string) => void;
}

const SelectContext = React.createContext<SelectContextValue>({
    open: false,
    setOpen: () => {},
    value: '',
    onValueChange: () => {},
});

/**
 * Props for the SelectTrigger component.
 */
export interface SelectTriggerProps {
    /** The trigger content elements. */
    children: React.ReactNode;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the SelectContent component.
 */
export interface SelectContentProps {
    /** The content elements (items, labels, separators). */
    children: React.ReactNode;
    /** Content position strategy. */
    position?: 'popper' | 'item-aligned';
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the SelectLabel component.
 */
export interface SelectLabelProps {
    /** The label text content. */
    children: React.ReactNode;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the SelectItem component.
 */
export interface SelectItemProps {
    /** The item display content. */
    children: React.ReactNode;
    /** The value associated with this item. */
    value: string;
    /** Whether the item is disabled. */
    disabled?: boolean;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the SelectSeparator component.
 */
export interface SelectSeparatorProps {
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the SelectScrollUpButton component.
 */
export interface SelectScrollUpButtonProps {
    /** Optional custom content. */
    children?: React.ReactNode;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Props for the SelectScrollDownButton component.
 */
export interface SelectScrollDownButtonProps {
    /** Optional custom content. */
    children?: React.ReactNode;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}

/**
 * Select component — the root select that manages value and open state.
 *
 * @param props - Component props including value and onValueChange.
 * @returns The rendered Select wrapper.
 */
function Select({
    children,
    value: controlledValue,
    onValueChange,
    defaultValue = '',
    open: controlledOpen,
    onOpenChange,
    defaultOpen = false,
}: {
    /** The select trigger and content elements. */
    children: React.ReactNode;
    /** Controlled selected value. */
    value?: string;
    /** Callback when value changes. */
    onValueChange?: (value: string) => void;
    /** Default value for uncontrolled usage. */
    defaultValue?: string;
    /** Controlled open state. */
    open?: boolean;
    /** Callback when open state changes. */
    onOpenChange?: (open: boolean) => void;
    /** Default open state for uncontrolled usage. */
    defaultOpen?: boolean;
}): React.ReactElement {
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen);

    const isValueControlled = controlledValue !== undefined;
    const isOpenControlled = controlledOpen !== undefined;

    const value = isValueControlled ? controlledValue : internalValue;
    const open = isOpenControlled ? controlledOpen : internalOpen;

    const handleValueChange = React.useCallback(
        (nextValue: string) => {
            if (!isValueControlled) {
                setInternalValue(nextValue);
            }
            onValueChange?.(nextValue);
        },
        [isValueControlled, onValueChange],
    );

    const setOpen = React.useCallback(
        (nextOpen: boolean) => {
            if (!isOpenControlled) {
                setInternalOpen(nextOpen);
            }
            onOpenChange?.(nextOpen);
        },
        [isOpenControlled, onOpenChange],
    );

    const contextValue = React.useMemo(
        () => ({ open, setOpen, value, onValueChange: handleValueChange }),
        [open, setOpen, value, handleValueChange],
    );

    return <SelectContext.Provider value={contextValue}>{children}</SelectContext.Provider>;
}

Select.displayName = 'Select';

/**
 * SelectGroup component — groups related items.
 *
 * @param props - Component props with children.
 * @returns The rendered SelectGroup component.
 */
function SelectGroup({ children }: { children: React.ReactNode }): React.ReactElement {
    return <YStack>{children}</YStack>;
}

SelectGroup.displayName = 'SelectGroup';

/**
 * SelectValue component — displays the selected value text.
 *
 * @param props - Component props with placeholder text.
 * @returns The rendered SelectValue component.
 */
function SelectValue({
    placeholder,
}: {
    /** Placeholder text shown when no value is selected. */
    placeholder?: string;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
}): React.ReactElement {
    const { value } = React.useContext(SelectContext);
    const theme = useTheme();

    const textColor = value
        ? (resolveThemeColor(theme, 'color') ?? '#000000')
        : (resolveThemeColor(theme, 'placeholderColor') ?? '#9ca3af');

    return (
        <Text color={textColor} fontSize={14} numberOfLines={1}>
            {value || placeholder || ''}
        </Text>
    );
}

SelectValue.displayName = 'SelectValue';

/**
 * SelectTrigger component — the button that opens the select dropdown.
 *
 * @param props - Component props with children.
 * @returns The rendered SelectTrigger component.
 */
function SelectTrigger({ children }: SelectTriggerProps): React.ReactElement {
    const { setOpen } = React.useContext(SelectContext);
    const theme = useTheme();

    const borderCol = resolveThemeColor(theme, 'borderColor') ?? '#e5e7eb';
    const bgColor = 'transparent';

    return (
        <Pressable
            accessibilityRole="button"
            onPress={() => setOpen(true)}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: 36,
                width: '100%',
                borderWidth: 1,
                borderColor: borderCol,
                borderRadius: 6,
                backgroundColor: bgColor,
                paddingHorizontal: 12,
                paddingVertical: 8,
            }}
        >
            {children}
            <Text fontSize={14} opacity={0.5}>
                ▼
            </Text>
        </Pressable>
    );
}

SelectTrigger.displayName = 'SelectTrigger';

/**
 * SelectScrollUpButton component — scroll indicator for long lists.
 * On mobile, scroll is handled natively by ScrollView; this is a visual-only element.
 *
 * @param _props - Component props (no-op on mobile).
 * @returns Null — scrolling is handled by native ScrollView.
 */
function SelectScrollUpButton(_props: SelectScrollUpButtonProps): React.ReactElement | null {
    return null;
}

SelectScrollUpButton.displayName = 'SelectScrollUpButton';

/**
 * SelectScrollDownButton component — scroll indicator for long lists.
 * On mobile, scroll is handled natively by ScrollView; this is a visual-only element.
 *
 * @param _props - Component props (no-op on mobile).
 * @returns Null — scrolling is handled by native ScrollView.
 */
function SelectScrollDownButton(_props: SelectScrollDownButtonProps): React.ReactElement | null {
    return null;
}

SelectScrollDownButton.displayName = 'SelectScrollDownButton';

/**
 * SelectContent component — the dropdown content container.
 * Renders as a bottom sheet modal on mobile.
 *
 * @param props - Component props with children content.
 * @returns The rendered SelectContent component.
 */
function SelectContent({ children }: SelectContentProps): React.ReactElement {
    const { open, setOpen } = React.useContext(SelectContext);
    const theme = useTheme();

    const bgColor = resolveThemeColor(theme, 'popover') ?? '#ffffff';
    const borderCol = resolveThemeColor(theme, 'borderColor') ?? '#e5e7eb';

    return (
        <Modal animationType="slide" onRequestClose={() => setOpen(false)} transparent visible={open}>
            <Pressable
                onPress={() => setOpen(false)}
                style={{
                    flex: 1,
                    justifyContent: 'flex-end',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                }}
            >
                <Pressable onPress={(e) => e.stopPropagation()}>
                    <YStack
                        backgroundColor={bgColor}
                        borderColor={borderCol}
                        borderWidth={1}
                        borderTopLeftRadius={12}
                        borderTopRightRadius={12}
                        paddingVertical={8}
                        maxHeight={400}
                    >
                        <ScrollView bounces={false}>{children}</ScrollView>
                    </YStack>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

SelectContent.displayName = 'SelectContent';

/**
 * SelectLabel component — a label for a group of items.
 *
 * @param props - Component props with children text.
 * @returns The rendered SelectLabel component.
 */
function SelectLabel({ children }: SelectLabelProps): React.ReactElement {
    const theme = useTheme();
    const textColor = resolveThemeColor(theme, 'color') ?? '#000000';

    return (
        <YStack paddingHorizontal={8} paddingVertical={6}>
            <Text color={textColor} fontSize={14} fontWeight="600">
                {children}
            </Text>
        </YStack>
    );
}

SelectLabel.displayName = 'SelectLabel';

/**
 * SelectItem component — an individual option in the select.
 *
 * @param props - Component props with value and children.
 * @returns The rendered SelectItem component.
 */
function SelectItem({ children, value: itemValue, disabled = false }: SelectItemProps): React.ReactElement {
    const { value, onValueChange, setOpen } = React.useContext(SelectContext);
    const theme = useTheme();

    const isSelected = value === itemValue;
    const textColor = resolveThemeColor(theme, 'color') ?? '#000000';
    const accentBg = resolveThemeColor(theme, 'accent') ?? '#f3f4f6';

    const handlePress = React.useCallback(() => {
        if (!disabled) {
            onValueChange(itemValue);
            setOpen(false);
        }
    }, [disabled, itemValue, onValueChange, setOpen]);

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled, selected: isSelected }}
            disabled={disabled}
            onPress={handlePress}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 10,
                paddingLeft: 8,
                paddingRight: 32,
                backgroundColor: isSelected ? accentBg : 'transparent',
                opacity: disabled ? 0.5 : 1,
            }}
        >
            <XStack width={24} alignItems="center" justifyContent="center" marginRight={4}>
                {isSelected ? <Text fontSize={14}>✓</Text> : null}
            </XStack>
            <Text color={textColor} fontSize={14}>
                {children}
            </Text>
        </Pressable>
    );
}

SelectItem.displayName = 'SelectItem';

/**
 * SelectSeparator component — a visual separator between items.
 *
 * @param _props - Component props.
 * @returns The rendered SelectSeparator component.
 */
function SelectSeparator(_props: SelectSeparatorProps): React.ReactElement {
    const theme = useTheme();
    const bgColor = resolveThemeColor(theme, 'muted') ?? '#e5e7eb';

    return <YStack height={1} backgroundColor={bgColor} marginVertical={4} marginHorizontal={-4} />;
}

SelectSeparator.displayName = 'SelectSeparator';

export {
    Select,
    SelectGroup,
    SelectValue,
    SelectTrigger,
    SelectContent,
    SelectLabel,
    SelectItem,
    SelectSeparator,
    SelectScrollUpButton,
    SelectScrollDownButton,
};
