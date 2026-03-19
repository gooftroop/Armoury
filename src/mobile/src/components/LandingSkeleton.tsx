/**
 * Landing skeleton shown while Auth0 state is resolving on app startup.
 *
 * @requirements
 * 1. Must render a full-screen dark background container.
 * 2. Must render hero placeholders (title + subtitle).
 * 3. Must render 1-2 system tile placeholders.
 * 4. Must render an auth button placeholder.
 * 5. Must use Animated opacity pulse loop for skeleton bones.
 *
 * @module landing-skeleton
 */

import * as React from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { XStack, YStack } from 'tamagui';

const BONE_COLOR = 'rgba(255, 255, 255, 0.08)';
const BACKGROUND_COLOR = '#0a0c0e';

/**
 * Landing skeleton component.
 *
 * @returns Full-screen loading skeleton for auth gate state.
 */
export function LandingSkeleton(): React.ReactElement {
    const opacity = React.useRef(new Animated.Value(0.3)).current;

    React.useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 900,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 900,
                    easing: Easing.inOut(Easing.quad),
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
        <YStack style={styles.container}>
            <Animated.View style={{ opacity }}>
                <YStack style={styles.heroSkeleton}>
                    <YStack style={[styles.bone, styles.heroTitle]} />
                    <YStack style={[styles.bone, styles.heroTagline]} />
                </YStack>

                <YStack style={styles.tileStack}>
                    <YStack style={[styles.bone, styles.tile]}>
                        <YStack style={[styles.bone, styles.tileAccent]} />
                        <YStack style={[styles.bone, styles.tileSplash]} />
                        <YStack style={styles.tileTextBlock}>
                            <YStack style={[styles.bone, styles.tileTitle]} />
                            <YStack style={[styles.bone, styles.tileSubtitle]} />
                            <YStack style={[styles.bone, styles.tileDescription]} />
                        </YStack>
                    </YStack>

                    <YStack style={[styles.bone, styles.tile]}>
                        <YStack style={[styles.bone, styles.tileAccent]} />
                        <YStack style={[styles.bone, styles.tileSplash]} />
                        <YStack style={styles.tileTextBlock}>
                            <YStack style={[styles.bone, styles.tileTitle]} />
                            <YStack style={[styles.bone, styles.tileSubtitle]} />
                            <YStack style={[styles.bone, styles.tileDescription]} />
                        </YStack>
                    </YStack>

                    <XStack style={styles.authButtonRow}>
                        <YStack style={[styles.bone, styles.authButton]} />
                    </XStack>
                </YStack>
            </Animated.View>
        </YStack>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BACKGROUND_COLOR,
        paddingHorizontal: 24,
        paddingTop: 48,
    },
    bone: {
        backgroundColor: BONE_COLOR,
        borderRadius: 8,
    },
    heroSkeleton: {
        alignItems: 'center',
        gap: 8,
        marginBottom: 24,
    },
    tileStack: {
        alignSelf: 'center',
        width: '100%',
        maxWidth: 400,
        gap: 16,
    },
    tileTextBlock: {
        padding: 16,
        gap: 8,
    },
    authButtonRow: {
        justifyContent: 'center',
        marginTop: 16,
    },
    heroTitle: {
        height: 36,
        width: 180,
    },
    heroTagline: {
        height: 16,
        width: 280,
    },
    tile: {
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
        overflow: 'hidden',
    },
    tileAccent: {
        height: 1,
        borderRadius: 0,
    },
    tileSplash: {
        height: 96,
        borderRadius: 0,
    },
    tileTitle: {
        height: 24,
        width: '58%',
    },
    tileSubtitle: {
        height: 14,
        width: '72%',
    },
    tileDescription: {
        height: 14,
        width: '92%',
    },
    authButton: {
        height: 40,
        width: 170,
    },
});
