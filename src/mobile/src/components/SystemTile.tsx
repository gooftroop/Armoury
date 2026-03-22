/**
 * Render-only tile for a game-system entry on the landing screen.
 *
 * @requirements
 * 1. Must render the manifest splash art, metadata, and sync overlay.
 * 2. Must preserve accessibility role, label, and hint for tile activation.
 * 3. Must derive tile theming from Tamagui useTheme.
 * 4. Must not perform orchestration logic or data fetching.
 *
 * @module system-tile
 */

import * as React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Paragraph, useTheme } from 'tamagui';
import type { GameSystemManifest } from '@armoury/data-dao';

/**
 * Props for the SystemTile component.
 */
export interface SystemTileProps {
    /** Manifest metadata for the game-system tile. */
    manifest: GameSystemManifest;
    /** Whether this tile is currently syncing/downloading. */
    isSyncing: boolean;
    /** Whether this tile has finished syncing. */
    isSynced: boolean;
    /** Whether the last sync attempt failed. */
    isError: boolean;
    /** Press handler for activating the game system. */
    onPress: () => void;
}

/**
 * Pure render tile for a single game system.
 *
 * @param props - Tile props.
 * @returns The rendered system tile.
 */
function SystemTile({ manifest, isSyncing, isSynced, isError, onPress }: SystemTileProps): React.ReactElement {
    const theme = useTheme();
    const tileBorderColor = theme.borderColor?.val ?? 'rgba(255, 255, 255, 0.08)';
    const tileCardBg = theme.card?.val ?? '#1b1d20';
    const accentColor = manifest.accent === 'gold' ? '#b87333' : 'rgba(255, 255, 255, 0.12)';
    const overlayLabel = isError
        ? 'Retry Download'
        : isSyncing
          ? 'Downloading...'
          : isSynced
            ? 'Ready'
            : 'Press to Download';

    return (
        <Pressable
            onPress={onPress}
            disabled={isSyncing}
            style={[styles.tile, { borderColor: tileBorderColor, backgroundColor: tileCardBg }]}
            accessibilityRole="button"
            accessibilityLabel={manifest.title}
            accessibilityHint="Downloads game data for this system"
        >
            <View style={[styles.tileAccentBar, { backgroundColor: accentColor }]} />
            <View style={[styles.gradientBox, { backgroundColor: manifest.gradientStart }]}>
                <Paragraph
                    style={[styles.splashText, { color: manifest.splashTextColor }]}
                    fontSize={32}
                    fontWeight="800"
                    letterSpacing={4}
                >
                    {manifest.splashText}
                </Paragraph>

                {!isSynced && (
                    <View style={styles.overlay}>
                        {isSyncing ? <ActivityIndicator size="small" color="#ffffff" /> : null}
                        {!isSyncing && (
                            <Paragraph color={isError ? '$destructive' : '$color'} fontWeight="700" size="$4">
                                {isError ? '⚠' : '⬇'}
                            </Paragraph>
                        )}
                        <Paragraph
                            color={isError ? '$destructive' : '$color'}
                            fontWeight="600"
                            size="$2"
                            textTransform="uppercase"
                            letterSpacing={1}
                        >
                            {overlayLabel}
                        </Paragraph>
                    </View>
                )}

                {isSynced && (
                    <View style={styles.syncedBadge}>
                        <Paragraph color="$success" size="$1" fontWeight="600">
                            ✓ Ready
                        </Paragraph>
                    </View>
                )}
            </View>

            <View style={styles.tileFooter}>
                <Paragraph color="$primary" fontWeight="600" size="$5">
                    {manifest.title}
                </Paragraph>
                <Paragraph color="$mutedForeground" size="$2">
                    {manifest.subtitle}
                </Paragraph>
                <Paragraph color="$mutedForeground" size="$2" style={styles.descriptionText}>
                    {manifest.description}
                </Paragraph>
            </View>
        </Pressable>
    );
}

SystemTile.displayName = 'SystemTile';

const styles = StyleSheet.create({
    tile: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
    },
    tileAccentBar: {
        height: 1,
    },
    gradientBox: {
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    splashText: {
        textTransform: 'uppercase',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    syncedBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0, 60, 0, 0.6)',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    tileFooter: {
        padding: 16,
        gap: 6,
    },
    descriptionText: {
        lineHeight: 18,
    },
});

export { SystemTile };
