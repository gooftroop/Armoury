import * as React from 'react';
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { YStack, useTheme } from 'tamagui';
import type { ViewProps } from 'react-native';

/**
 * @requirements
 * 1. Must export Skeleton component and SkeletonProps type.
 * 2. Must display a pulse animation for loading state.
 * 3. Must use Tamagui primitives and theme tokens resolved from useTheme().
 * 4. Must accept className for cross-platform compatibility and ignore it on mobile.
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

/** Props for the Skeleton component. */
export interface SkeletonProps extends ViewProps {
    /** Web compatibility prop ignored on mobile. */
    className?: string;
    /** Custom width. */
    width?: number | string;
    /** Custom height. */
    height?: number | string;
    /** Custom border radius. */
    borderRadius?: number;
    /** Children (rarely used). */
    children?: React.ReactNode;
}

/**
 * Skeleton component - a loading placeholder with pulse animation.
 *
 * Uses React Native Animated to create a subtle opacity pulse effect
 * that indicates content is loading.
 *
 * @param props - Component props including size and standard view attributes.
 * @returns The rendered Skeleton component.
 */
const Skeleton = React.forwardRef<React.ElementRef<typeof YStack>, SkeletonProps>(
    ({ className: _className, width, height, borderRadius = 6, children }, ref) => {
        const theme = useTheme();
        const opacity = useRef(new Animated.Value(1)).current;
        const animatedWidth = typeof width === 'number' ? width : undefined;
        const animatedHeight = typeof height === 'number' ? height : undefined;

        useEffect(() => {
            const animation = Animated.loop(
                Animated.sequence([
                    Animated.timing(opacity, {
                        toValue: 0.5,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ]),
            );

            animation.start();

            return () => {
                animation.stop();
            };
        }, [opacity]);

        return (
            <Animated.View style={{ opacity, width: animatedWidth, height: animatedHeight, borderRadius }}>
                <YStack
                    ref={ref}
                    backgroundColor={resolveThemeColor(theme, 'muted')}
                    borderRadius={borderRadius}
                    width={width}
                    height={height}
                    flex={width === undefined && height === undefined ? 1 : undefined}
                >
                    {children}
                </YStack>
            </Animated.View>
        );
    },
);

Skeleton.displayName = 'Skeleton';

export { Skeleton };
