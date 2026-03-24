import * as React from 'react';
import { XStack, Text, useTheme } from 'tamagui';
import type { ViewProps } from 'react-native';

/**
 * @requirements
 * 1. Must export Badge, badgeVariants, and BadgeProps with the same names as web.
 * 2. Must support 4 variants: default, secondary, destructive, outline.
 * 3. Must use Tamagui primitives and theme tokens resolved from useTheme().
 * 4. Must accept className for cross-platform compatibility and ignore it on mobile.
 * 5. Must set displayName for React DevTools readability.
 */

/** Supported badge visual variants. */
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

/** Variant option bag used by badgeVariants compatibility helper. */
interface BadgeVariantOptions {
    /** Selected visual variant. */
    variant?: BadgeVariant;
    /** Web-only className compatibility input. */
    className?: string;
}

/**
 * Cross-platform compatibility helper that mirrors the web CVA export shape.
 *
 * @param options - Variant and compatibility values.
 * @returns Normalized variant settings for the mobile implementation.
 */
function badgeVariants(options: BadgeVariantOptions = {}): string {
    return options.variant ?? 'default';
}

/** Props for the mobile Badge component. */
export interface BadgeProps extends ViewProps {
    /** Visual variant controlling foreground/background/border colors. */
    variant?: BadgeVariant;
    /** Web compatibility prop ignored on mobile. */
    className?: string;
    /** Badge content. */
    children?: React.ReactNode;
    /** Forward ref to underlying XStack component. */
    ref?: React.Ref<React.ElementRef<typeof XStack>>;
}

/**
 * Resolves a theme token into a concrete color string.
 *
 * @param theme - Active Tamagui theme object.
 * @param token - Theme token key.
 * @returns Resolved color string when available.
 */
function resolveThemeColor(theme: ReturnType<typeof useTheme>, token: string): string | undefined {
    const themeRecord = theme as unknown as Record<string, { get?: () => string; val?: string } | undefined>;
    const value = themeRecord[token];

    if (value?.get) {
        return value.get();
    }

    return value?.val;
}

/**
 * Badge component - displays a small label for status or counts.
 *
 * @param props - Component props including variant and standard view attributes.
 * @returns The rendered Badge component.
 */
function Badge({ variant = 'default', className: _className, children, ref }: BadgeProps): React.ReactElement {
    const theme = useTheme();

    const backgroundByVariant: Record<BadgeVariant, string | undefined> = {
        default: resolveThemeColor(theme, 'primary'),
        secondary: resolveThemeColor(theme, 'secondary'),
        destructive: resolveThemeColor(theme, 'destructive'),
        outline: 'transparent',
    };

    const textByVariant: Record<BadgeVariant, string | undefined> = {
        default: resolveThemeColor(theme, 'primaryForeground'),
        secondary: resolveThemeColor(theme, 'secondaryForeground'),
        destructive: resolveThemeColor(theme, 'destructiveForeground'),
        outline: resolveThemeColor(theme, 'color'),
    };

    const borderByVariant: Record<BadgeVariant, string | undefined> = {
        default: 'transparent',
        secondary: 'transparent',
        destructive: 'transparent',
        outline: resolveThemeColor(theme, 'borderColor'),
    };

    return (
        <XStack
            ref={ref}
            alignItems="center"
            justifyContent="center"
            backgroundColor={backgroundByVariant[variant]}
            borderColor={borderByVariant[variant]}
            borderWidth={1}
            borderRadius={9999}
            paddingHorizontal="$2"
            paddingVertical="$0.5"
        >
            <Text color={textByVariant[variant]} fontSize="$1" fontWeight="600">
                {children}
            </Text>
        </XStack>
    );
}

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
