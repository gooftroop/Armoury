import * as React from 'react';
import { useState } from 'react';
import { Image } from 'react-native';
import { YStack, Text, useTheme } from 'tamagui';
import type { ViewProps, ImageProps as RNImageProps, TextProps as RNTextProps } from 'react-native';

/**
 * @requirements
 * 1. Must export Avatar, AvatarImage, AvatarFallback, avatarVariants.
 * 2. Must export type aliases: AvatarProps, AvatarImageProps, AvatarFallbackProps.
 * 3. Must support size variants: sm (32px), md (40px), lg (48px).
 * 4. Must use Tamagui primitives and theme tokens resolved from useTheme().
 * 5. Must set displayName for React DevTools readability.
 */

/** Supported avatar size variants. */
type AvatarSize = 'sm' | 'md' | 'lg';

/** Size map for avatar dimensions in pixels. */
const SIZE_MAP: Record<AvatarSize, number> = {
    sm: 32,
    md: 40,
    lg: 48,
};

/** Variant option bag used by avatarVariants compatibility helper. */
interface AvatarVariantOptions {
    /** Selected size variant. */
    size?: AvatarSize;
    /** Web-only className compatibility input. */
    className?: string;
}

/**
 * Cross-platform compatibility helper that mirrors the web CVA export shape.
 *
 * @param options - Size and compatibility values.
 * @returns Normalized size setting for the mobile implementation.
 */
function avatarVariants(options: AvatarVariantOptions = {}): string {
    return options.size ?? 'md';
}

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

/** Context to share avatar state between sub-components. */
const AvatarContext = React.createContext<{
    size: number;
    imageLoaded: boolean;
    setImageLoaded: (loaded: boolean) => void;
}>({
    size: SIZE_MAP.md,
    imageLoaded: false,
    setImageLoaded: () => {},
});

/** Props for the Avatar component. */
export interface AvatarProps extends ViewProps {
    /** Size variant controlling avatar dimensions. */
    size?: AvatarSize;
    /** Web compatibility prop ignored on mobile. */
    className?: string;
    /** Avatar sub-components (AvatarImage, AvatarFallback). */
    children?: React.ReactNode;
}

/** Props for the AvatarImage component. */
export interface AvatarImageProps extends Omit<RNImageProps, 'source'> {
    /** Image source URI. */
    src?: string;
    /** Alt text for the image (accessibility). */
    alt?: string;
    /** Web compatibility prop ignored on mobile. */
    className?: string;
}

/** Props for the AvatarFallback component. */
export interface AvatarFallbackProps extends RNTextProps {
    /** Web compatibility prop ignored on mobile. */
    className?: string;
    /** Fallback content (initials, icon, etc). */
    children?: React.ReactNode;
}

/**
 * Avatar component - the circular container for avatar content.
 *
 * @param props - Component props including size and standard view attributes.
 * @returns The rendered Avatar component.
 */
const Avatar = React.forwardRef<React.ElementRef<typeof YStack>, AvatarProps>(
    ({ size = 'md', className: _className, children }, ref) => {
        const [imageLoaded, setImageLoaded] = useState(false);
        const sizeValue = SIZE_MAP[size];

        return (
            <AvatarContext.Provider value={{ size: sizeValue, imageLoaded, setImageLoaded }}>
                <YStack
                    ref={ref}
                    width={sizeValue}
                    height={sizeValue}
                    borderRadius={sizeValue / 2}
                    overflow="hidden"
                    alignItems="center"
                    justifyContent="center"
                >
                    {children}
                </YStack>
            </AvatarContext.Provider>
        );
    },
);
Avatar.displayName = 'Avatar';

/**
 * AvatarImage component - the image displayed inside the avatar.
 *
 * @param props - Component props including src and standard image attributes.
 * @returns The rendered AvatarImage component or null if image fails.
 */
const AvatarImage = React.forwardRef<React.ElementRef<typeof Image>, AvatarImageProps>(
    ({ src, alt, className: _className, ...props }, ref) => {
        const { size, setImageLoaded } = React.useContext(AvatarContext);

        if (!src) {
            return null;
        }

        return (
            <Image
                ref={ref as React.Ref<Image>}
                source={{ uri: src }}
                accessibilityLabel={alt}
                style={{ width: size, height: size }}
                onLoad={() => {
                    setImageLoaded(true);
                }}
                onError={() => {
                    setImageLoaded(false);
                }}
                {...props}
            />
        );
    },
);
AvatarImage.displayName = 'AvatarImage';

/**
 * AvatarFallback component - the fallback content when image fails to load.
 *
 * @param props - Component props including standard text attributes.
 * @returns The rendered AvatarFallback component or null if image loaded.
 */
const AvatarFallback = React.forwardRef<React.ElementRef<typeof Text>, AvatarFallbackProps>(
    ({ className: _className, children, ...props }, ref) => {
        const theme = useTheme();
        const { size, imageLoaded } = React.useContext(AvatarContext);

        if (imageLoaded) {
            return null;
        }

        return (
            <YStack
                width={size}
                height={size}
                borderRadius={size / 2}
                alignItems="center"
                justifyContent="center"
                backgroundColor={resolveThemeColor(theme, 'muted')}
            >
                <Text
                    ref={ref}
                    fontSize={size * 0.4}
                    color={resolveThemeColor(theme, 'mutedForeground')}
                    {...props}
                >
                    {children}
                </Text>
            </YStack>
        );
    },
);
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback, avatarVariants };
