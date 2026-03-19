/**
 * Landing skeleton shown while Auth0 state is resolving on app startup.
 *
 * @requirements
 * 1. Must render a full-screen dark background container.
 * 2. Must render hero placeholders (title + subtitle).
 * 3. Must render 1-2 system tile placeholders.
 * 4. Must render an auth button placeholder.
 * 5. Must use Animated opacity pulse loop for skeleton bones.
 * 6. Must respect reduced-motion accessibility preference.
 * 7. Must use Tamagui theme tokens instead of hardcoded colors.
 *
 * @module landing-skeleton
 */

import * as React from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet } from 'react-native';
import { useTheme, XStack, YStack } from 'tamagui';

/**
 * Landing skeleton component.
 *
 * @returns Full-screen loading skeleton for auth gate state.
 */
export function LandingSkeleton(): React.ReactElement {
    const theme = useTheme();
    const opacity = React.useRef(new Animated.Value(0.3)).current;
    const [reduceMotion, setReduceMotion] = React.useState(false);

    React.useEffect(() => {
        const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

        void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);

        return () => {
            subscription.remove();
        };
    }, []);

    React.useEffect(() => {
        if (reduceMotion) {
            opacity.setValue(0.6);

            return;
        }

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
    }, [opacity, reduceMotion]);

    const backgroundColor = theme.background?.val ?? '#121416';
    const boneColor = theme.muted?.val ?? '#222427';
    const borderColor = theme.borderColor?.val ?? 'rgba(255, 255, 255, 0.08)';

    return (
        <YStack style={[styles.container, { backgroundColor }]}>
            <Animated.View style={{ opacity }}>
                <YStack style={styles.heroSkeleton}>
                    <YStack style={[styles.bone, styles.heroTitle, { backgroundColor: boneColor }]} />
                    <YStack style={[styles.bone, styles.heroTagline, { backgroundColor: boneColor }]} />
                </YStack>

                <YStack style={styles.tileStack}>
                    <YStack style={[styles.bone, styles.tile, { borderColor, backgroundColor: boneColor }]}>
                        <YStack style={[styles.bone, styles.tileAccent, { backgroundColor: boneColor }]} />
                        <YStack style={[styles.bone, styles.tileSplash, { backgroundColor: boneColor }]} />
                        <YStack style={styles.tileTextBlock}>
                            <YStack style={[styles.bone, styles.tileTitle, { backgroundColor: boneColor }]} />
                            <YStack style={[styles.bone, styles.tileSubtitle, { backgroundColor: boneColor }]} />
                            <YStack style={[styles.bone, styles.tileDescription, { backgroundColor: boneColor }]} />
                        </YStack>
                    </YStack>

                    <YStack style={[styles.bone, styles.tile, { borderColor, backgroundColor: boneColor }]}>
                        <YStack style={[styles.bone, styles.tileAccent, { backgroundColor: boneColor }]} />
                        <YStack style={[styles.bone, styles.tileSplash, { backgroundColor: boneColor }]} />
                        <YStack style={styles.tileTextBlock}>
                            <YStack style={[styles.bone, styles.tileTitle, { backgroundColor: boneColor }]} />
                            <YStack style={[styles.bone, styles.tileSubtitle, { backgroundColor: boneColor }]} />
                            <YStack style={[styles.bone, styles.tileDescription, { backgroundColor: boneColor }]} />
                        </YStack>
                    </YStack>

                    <XStack style={styles.authButtonRow}>
                        <YStack style={[styles.bone, styles.authButton, { backgroundColor: boneColor }]} />
                    </XStack>
                </YStack>
            </Animated.View>
        </YStack>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 48,
    },
    bone: {
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
