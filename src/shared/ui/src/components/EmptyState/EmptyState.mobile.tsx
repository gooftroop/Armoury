/**
 * EmptyState Component (Mobile)
 *
 * A reusable empty state placeholder displayed when a list or collection has no items.
 * Renders an optional icon, title, description, and call-to-action element using Tamagui.
 *
 * @requirements
 * 1. Must export EmptyState component and EmptyStateProps type.
 * 2. Must accept optional icon, title, description, and action props.
 * 3. Must use Tamagui primitives and design tokens via useTheme().
 * 4. Must accept className for cross-platform compatibility (ignored on mobile).
 * 5. Must display displayName in React DevTools.
 */

import * as React from 'react';
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
 * Props for the EmptyState component.
 */
export interface EmptyStateProps {
    /** Optional icon element rendered above the title. */
    icon?: React.ReactNode;
    /** Title text displayed prominently in the empty state. */
    title: string;
    /** Optional description text displayed below the title. */
    description?: string;
    /** Optional action element (typically a Button) rendered below the description. */
    action?: React.ReactNode;
    /** Web compatibility prop — accepted but unused on mobile. */
    className?: string;
    /** Forward ref to underlying YStack component. */
    ref?: React.Ref<React.ElementRef<typeof YStack>>;
}

/**
 * EmptyState component — a placeholder for empty lists or collections.
 *
 * Renders a centered layout with optional icon, title, description, and action.
 *
 * @param props - Component props including icon, title, description, and action.
 * @returns The rendered EmptyState component.
 */
function EmptyState({ icon, title, description, action, ref }: EmptyStateProps): React.ReactElement {
    const theme = useTheme();
    const borderCol = resolveThemeColor(theme, 'borderColor') ?? '#e5e7eb';
    const bgColor = resolveThemeColor(theme, 'muted') ?? '#f3f4f6';
    const titleColor = resolveThemeColor(theme, 'color') ?? '#000000';
    const descColor = resolveThemeColor(theme, 'mutedForeground') ?? '#6b7280';

    return (
        <YStack
            ref={ref}
            alignItems="center"
            justifyContent="center"
            borderRadius={12}
            borderWidth={1}
            borderStyle="dashed"
            borderColor={borderCol}
            backgroundColor={bgColor}
            paddingHorizontal={24}
            paddingVertical={48}
        >
            {icon ? <YStack marginBottom={16}>{icon}</YStack> : null}

            <Text color={titleColor} fontSize={18} fontWeight="600" textAlign="center">
                {title}
            </Text>

            {description ? (
                <Text color={descColor} fontSize={14} marginTop={8} textAlign="center" maxWidth={320}>
                    {description}
                </Text>
            ) : null}

            {action ? <YStack marginTop={24}>{action}</YStack> : null}
        </YStack>
    );
}

EmptyState.displayName = 'EmptyState';

export { EmptyState };
