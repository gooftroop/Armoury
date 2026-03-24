import * as React from 'react';
import { YStack, XStack, Text, useTheme } from 'tamagui';
import type { ViewProps, TextProps as RNTextProps } from 'react-native';

/**
 * @requirements
 * 1. Must export Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter.
 * 2. Must export all type aliases: CardProps, CardHeaderProps, CardTitleProps, etc.
 * 3. Must use Tamagui YStack/XStack/Text primitives with theme tokens.
 * 4. Must accept className for cross-platform compatibility and ignore it on mobile.
 * 5. Must set displayName for every sub-component.
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

/** Props for the Card component. */
export interface CardProps extends ViewProps {
    /** Web compatibility prop ignored on mobile. */
    className?: string;
    /** Card content. */
    children?: React.ReactNode;
    /** Forward ref to underlying YStack component. */
    ref?: React.Ref<React.ElementRef<typeof YStack>>;
}

/** Props for the CardHeader component. */
export interface CardHeaderProps extends ViewProps {
    /** Web compatibility prop ignored on mobile. */
    className?: string;
    /** Header content. */
    children?: React.ReactNode;
    /** Forward ref to underlying YStack component. */
    ref?: React.Ref<React.ElementRef<typeof YStack>>;
}

/** Props for the CardTitle component. */
export interface CardTitleProps extends RNTextProps {
    /** Web compatibility prop ignored on mobile. */
    className?: string;
    /** Title content. */
    children?: React.ReactNode;
    /** Forward ref to underlying Text component. */
    ref?: React.Ref<React.ElementRef<typeof Text>>;
}

/** Props for the CardDescription component. */
export interface CardDescriptionProps extends RNTextProps {
    /** Web compatibility prop ignored on mobile. */
    className?: string;
    /** Description content. */
    children?: React.ReactNode;
    /** Forward ref to underlying Text component. */
    ref?: React.Ref<React.ElementRef<typeof Text>>;
}

/** Props for the CardContent component. */
export interface CardContentProps extends ViewProps {
    /** Web compatibility prop ignored on mobile. */
    className?: string;
    /** Content children. */
    children?: React.ReactNode;
    /** Forward ref to underlying YStack component. */
    ref?: React.Ref<React.ElementRef<typeof YStack>>;
}

/** Props for the CardFooter component. */
export interface CardFooterProps extends ViewProps {
    /** Web compatibility prop ignored on mobile. */
    className?: string;
    /** Footer content. */
    children?: React.ReactNode;
    /** Forward ref to underlying XStack component. */
    ref?: React.Ref<React.ElementRef<typeof XStack>>;
}

/**
 * Card component - the main container for card content.
 *
 * @param props - Component props including className and standard view attributes.
 * @returns The rendered Card component.
 */
function Card({ className: _className, children, ref }: CardProps): React.ReactElement {
    const theme = useTheme();

    return (
        <YStack
            ref={ref}
            borderRadius="$3"
            borderWidth={1}
            borderColor={resolveThemeColor(theme, 'borderColor')}
            backgroundColor={resolveThemeColor(theme, 'card')}
            shadowColor="rgba(0,0,0,0.05)"
            shadowOffset={{ width: 0, height: 1 }}
            shadowOpacity={1}
            shadowRadius={2}
            elevation={1}
        >
            {children}
        </YStack>
    );
}
Card.displayName = 'Card';

/**
 * CardHeader component - contains title and description.
 *
 * @param props - Component props including className and standard view attributes.
 * @returns The rendered CardHeader component.
 */
function CardHeader({ className: _className, children, ref }: CardHeaderProps): React.ReactElement {
    return (
        <YStack ref={ref} padding="$4" gap="$1.5">
            {children}
        </YStack>
    );
}
CardHeader.displayName = 'CardHeader';

/**
 * CardTitle component - the title of the card.
 *
 * @param props - Component props including className and standard text attributes.
 * @returns The rendered CardTitle component.
 */
function CardTitle({ className: _className, children, ref, ...props }: CardTitleProps): React.ReactElement {
    const theme = useTheme();

    return (
        <Text ref={ref} fontWeight="600" fontSize="$5" color={resolveThemeColor(theme, 'cardForeground')} {...props}>
            {children}
        </Text>
    );
}
CardTitle.displayName = 'CardTitle';

/**
 * CardDescription component - a description for the card content.
 *
 * @param props - Component props including className and standard text attributes.
 * @returns The rendered CardDescription component.
 */
function CardDescription({ className: _className, children, ref, ...props }: CardDescriptionProps): React.ReactElement {
    const theme = useTheme();

    return (
        <Text ref={ref} fontSize="$2" color={resolveThemeColor(theme, 'mutedForeground')} {...props}>
            {children}
        </Text>
    );
}
CardDescription.displayName = 'CardDescription';

/**
 * CardContent component - the main content area of the card.
 *
 * @param props - Component props including className and standard view attributes.
 * @returns The rendered CardContent component.
 */
function CardContent({ className: _className, children, ref }: CardContentProps): React.ReactElement {
    return (
        <YStack ref={ref} paddingHorizontal="$4" paddingBottom="$4">
            {children}
        </YStack>
    );
}
CardContent.displayName = 'CardContent';

/**
 * CardFooter component - the footer area of the card.
 *
 * @param props - Component props including className and standard view attributes.
 * @returns The rendered CardFooter component.
 */
function CardFooter({ className: _className, children, ref }: CardFooterProps): React.ReactElement {
    return (
        <XStack ref={ref} alignItems="center" paddingHorizontal="$4" paddingBottom="$4">
            {children}
        </XStack>
    );
}
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
