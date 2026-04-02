import * as React from 'react';
import { YStack, useTheme } from 'tamagui';
import type { ViewProps } from 'react-native';

/**
 * @requirements
 * 1. Must export Separator component and SeparatorProps type.
 * 2. Must support horizontal and vertical orientations.
 * 3. Must use Tamagui primitives and theme tokens resolved from useTheme().
 * 4. Must accept className and decorative for cross-platform compatibility.
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

/** Props for the Separator component. */
export interface SeparatorProps extends ViewProps {
    /** Orientation of the separator. */
    orientation?: 'horizontal' | 'vertical';
    /** Whether the separator is purely decorative (accessibility hint). */
    decorative?: boolean;
    /** Web compatibility prop ignored on mobile. */
    className?: string;
    /** Forward ref to underlying YStack component. */
    ref?: React.Ref<React.ElementRef<typeof YStack>>;
}

/**
 * Separator component - a visual divider between sections.
 *
 * @param props - Component props including orientation and standard view attributes.
 * @returns The rendered Separator component.
 */
function Separator({
    orientation = 'horizontal',
    decorative: _decorative,
    className: _className,
    ref,
}: SeparatorProps): React.ReactElement {
    const theme = useTheme();
    const isHorizontal = orientation === 'horizontal';

    return (
        <YStack
            ref={ref}
            backgroundColor={resolveThemeColor(theme, 'borderColor')}
            width={isHorizontal ? '100%' : 1}
            height={isHorizontal ? 1 : '100%'}
            flexShrink={0}
            accessibilityRole="none"
        />
    );
}

Separator.displayName = 'Separator';

export { Separator };
