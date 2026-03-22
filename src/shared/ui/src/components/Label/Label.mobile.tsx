import * as React from 'react';
import { Text, useTheme } from 'tamagui';
import type { TextProps as RNTextProps } from 'react-native';

/**
 * @requirements
 * 1. Must export Label component and LabelProps interface.
 * 2. Must style as a small, medium-weight form label.
 * 3. Must use Tamagui primitives and theme tokens resolved from useTheme().
 * 4. Must accept htmlFor for cross-platform compatibility (no-op on mobile).
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

/** Props for the mobile Label component. */
export interface LabelProps extends RNTextProps {
    /** Web compatibility prop — links label to input by id (no-op on mobile). */
    htmlFor?: string;
    /** Web compatibility prop ignored on mobile. */
    className?: string;
    /** Label content. */
    children?: React.ReactNode;
}

/**
 * Label component - a label for form fields.
 *
 * @param props - Component props including standard text attributes.
 * @returns The rendered Label component.
 */
const Label = React.forwardRef<React.ElementRef<typeof Text>, LabelProps>(
    ({ htmlFor: _htmlFor, className: _className, children, ...props }, ref) => {
        const theme = useTheme();

        return (
            <Text
                ref={ref}
                fontSize={14}
                fontWeight="500"
                lineHeight={14}
                color={resolveThemeColor(theme, 'color')}
                {...props}
            >
                {children}
            </Text>
        );
    },
);

Label.displayName = 'Label';

export { Label };
