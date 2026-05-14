/**
 * ArmyCardSkeleton Component
 *
 * A loading placeholder that mimics the layout of an ArmyCard.
 * Uses static gray blocks to indicate loading state.
 *
 * @requirements
 * 1. Must export ArmyCardSkeleton component.
 * 2. Must visually match the ArmyCard layout (header, body, footer).
 * 3. Must use Tamagui design tokens for consistent theming.
 * 4. Must not own any state or perform data fetching.
 * 5. Must display displayName in React DevTools.
 * 6. Must not use default exports.
 */

import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, YStack } from 'tamagui';

/**
 * A single skeleton bar that mimics text or button content.
 *
 * @param props - Width and height for the skeleton bar.
 * @returns A styled gray placeholder element.
 */
function SkeletonBar({ width, height }: { width: number; height: number }): React.ReactElement {
    return <YStack background="$muted" width={width} height={height} opacity={0.6} style={styles.skeletonBar} />;
}

SkeletonBar.displayName = 'SkeletonBar';

/**
 * ArmyCardSkeleton — a loading placeholder for army cards.
 *
 * Renders a Card with static gray blocks that match the layout of a loaded ArmyCard.
 * Includes placeholders for army name, badge, stats, and action buttons.
 *
 * @returns The rendered ArmyCardSkeleton component.
 */
function ArmyCardSkeleton(): React.ReactElement {
    return (
        <Card borderWidth={1} borderColor="$borderColor" padding="$4" gap="$3">
            {/* Header: name + badge */}
            <View style={styles.header}>
                <SkeletonBar width={160} height={20} />
                <SkeletonBar width={80} height={24} />
            </View>

            {/* Content: stats */}
            <YStack gap="$2">
                <SkeletonBar width={120} height={16} />
                <SkeletonBar width={150} height={16} />
                <SkeletonBar width={100} height={12} />
            </YStack>

            {/* Footer: action buttons */}
            <View style={styles.footer}>
                <SkeletonBar width={80} height={36} />
                <SkeletonBar width={80} height={36} />
                <SkeletonBar width={80} height={36} />
            </View>
        </Card>
    );
}

ArmyCardSkeleton.displayName = 'ArmyCardSkeleton';

const styles = StyleSheet.create({
    skeletonBar: {
        borderRadius: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
});

export { ArmyCardSkeleton };
