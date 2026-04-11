/**
 * Pure render view for the mobile landing screen.
 *
 * @requirements
 * 1. Must render hero copy, profile tile, tile list, and disclaimer.
 * 2. Must render SystemTile entries from precomputed tile view models.
 * 3. Must render ProfileTileContainer between hero section and tile list.
 * 4. Must avoid data fetching and orchestration hooks.
 *
 * @module landing-view
 */

import * as React from 'react';
import { StyleSheet } from 'react-native';
import { H1, Paragraph, ScrollView, YStack } from 'tamagui';

import { SystemTile } from '@/components/SystemTile.js';
import type { GameSystemManifest, SyncProgressState } from '@armoury/data-dao';
import { ProfileTileContainer } from '@/components/profile/ProfileTileContainer.js';

/**
 * View model for a rendered landing system tile.
 */
export interface LandingTileViewModel {
    /** System manifest metadata. */
    manifest: GameSystemManifest;
    /** Whether the tile is currently syncing. */
    isSyncing: boolean;
    /** Whether the tile has completed sync. */
    isSynced: boolean;
    /** Whether the tile is currently in error state. */
    isError: boolean;
    /** Live sync progress state, if available. */
    syncProgress?: SyncProgressState;
    /** Press handler for this tile. */
    onPress: () => void;
}

/**
 * Props for LandingView.
 */
export interface LandingViewProps {
    /** Precomputed tile state and handlers for rendering. */
    tiles: readonly LandingTileViewModel[];
    /** Resolved scroll-view background color token/value. */
    scrollViewBg: string;
}

/**
 * Render-only landing view.
 *
 * @param props - Preprocessed landing view props.
 * @returns The landing screen UI.
 */
function LandingView({ tiles, scrollViewBg }: LandingViewProps): React.ReactElement {
    return (
        <ScrollView style={[styles.scrollView, { backgroundColor: scrollViewBg }]}>
            <YStack style={styles.heroSection}>
                <H1 color="$primary" style={styles.heroTitle}>
                    Armoury
                </H1>
                <Paragraph color="$mutedForeground" style={styles.subtitleText}>
                    Select a game system to begin managing your armies and campaigns.
                </Paragraph>
            </YStack>

            <ProfileTileContainer />

            <YStack gap="$4" width="100%" style={styles.tileContainer}>
                {tiles.map((tile) => (
                    <SystemTile
                        key={tile.manifest.id}
                        manifest={tile.manifest}
                        isSyncing={tile.isSyncing}
                        isSynced={tile.isSynced}
                        isError={tile.isError}
                        syncProgress={tile.syncProgress}
                        onPress={tile.onPress}
                    />
                ))}
            </YStack>

            <Paragraph color="$mutedForeground" size="$1" opacity={0.6} style={styles.disclaimer}>
                This is an unofficial, fan-made tool. Not affiliated with or endorsed by any game publisher. All
                trademarks are property of their respective owners.
            </Paragraph>
        </ScrollView>
    );
}

LandingView.displayName = 'LandingView';

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 24,
        gap: 8,
        paddingTop: 48,
        paddingHorizontal: 24,
    },
    heroTitle: {
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    subtitleText: {
        textAlign: 'center',
    },
    tileContainer: {
        maxWidth: 400,
        alignSelf: 'center',
        paddingHorizontal: 24,
    },
    disclaimer: {
        textAlign: 'center',
        marginTop: 32,
        maxWidth: 400,
        alignSelf: 'center',
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
});

export { LandingView };
