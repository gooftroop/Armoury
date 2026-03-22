import * as React from 'react';
import { Switch as RNSwitch } from 'react-native';
import { useTheme } from 'tamagui';
import type { SwitchProps as RNSwitchProps } from 'react-native';

/**
 * @requirements
 * 1. Must export Switch component and SwitchProps type.
 * 2. Must display a thumb indicator that moves on state change.
 * 3. Must use theme tokens resolved from useTheme() for track colors.
 * 4. Must support both Radix-style (checked/onCheckedChange) and RN-style (value/onValueChange) APIs.
 * 5. Must set displayName for React DevTools readability.
 */

/**
 * Resolves a theme token into a concrete color string.
 */
function resolveThemeColor(theme: ReturnType<typeof useTheme>, token: string): string | undefined {
    const themeRecord = theme as unknown as Record<string, { get?: () => string; val?: string } | undefined>;
    const value = themeRecord[token];

    if (value?.get) {
        return value.get();
    }

    return value?.val;
}

/** Props for the mobile Switch component. */
export interface SwitchProps extends Omit<RNSwitchProps, 'value' | 'onValueChange'> {
    /** Radix-compatible checked state. */
    checked?: boolean;
    /** Radix-compatible change handler. */
    onCheckedChange?: (checked: boolean) => void;
    /** RN-compatible value state. */
    value?: boolean;
    /** RN-compatible change handler. */
    onValueChange?: (value: boolean) => void;
    /** Web compatibility prop ignored on mobile. */
    className?: string;
    /** Forward ref to underlying RNSwitch component. */
    ref?: React.Ref<React.ElementRef<typeof RNSwitch>>;
}

/**
 * Switch component - a toggle control for on/off state.
 *
 * Supports both Radix-style (checked/onCheckedChange) and React Native-style
 * (value/onValueChange) APIs for cross-platform compatibility.
 *
 * @param props - Component props including checked state and standard switch attributes.
 * @returns The rendered Switch component.
 */
function Switch({
    checked,
    onCheckedChange,
    value,
    onValueChange,
    className: _className,
    ref,
    ...props
}: SwitchProps): React.ReactElement {
    const theme = useTheme();

    // Support both Radix (checked/onCheckedChange) and RN (value/onValueChange) APIs
    const isChecked = checked ?? value ?? false;
    const handleChange = (newValue: boolean): void => {
        onCheckedChange?.(newValue);
        onValueChange?.(newValue);
    };

    return (
        <RNSwitch
            ref={ref}
            value={isChecked}
            onValueChange={handleChange}
            trackColor={{
                false: resolveThemeColor(theme, 'input') ?? '#e4e4e7',
                true: resolveThemeColor(theme, 'primary') ?? '#18181b',
            }}
            thumbColor={resolveThemeColor(theme, 'background') ?? '#ffffff'}
            {...props}
        />
    );
}

Switch.displayName = 'Switch';

export { Switch };
