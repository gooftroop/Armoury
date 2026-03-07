/**
 * Landing screen for the mobile app.
 *
 * Displays the Armoury logo, tagline, and a scrollable list of game system tiles
 * discovered from bundled manifest files. Each tile shows the system's gradient
 * splash and an interactive overlay for downloading game data. Unauthenticated
 * users are prompted to log in via Auth0 before enabling a system.
 *
 * System display names are NOT hardcoded — they come from BSData at runtime.
 * Until data is synced, the tile shows the manifest splash text as the label.
 *
 * @requirements
 * 1. Must render a full-screen landing view with dark theme.
 * 2. Must list available game systems from bundled manifest data (no hardcoded systems).
 * 3. Must redirect unauthenticated users to Auth0 login when they press a tile overlay.
 * 4. Must call enableSystem() from DataContext when an authenticated user presses the overlay.
 * 5. Must show a loading indicator while a system is syncing.
 * 6. Must show an error state with retry when sync fails.
 * 7. Must navigate to /(tabs)/armies once a system is synced.
 * 8. Must show auth links only when the user is not authenticated.
 *
 * @module landing-screen
 */

import * as React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth0 } from 'react-native-auth0';
import { Button, H1, Paragraph, ScrollView, YStack } from 'tamagui';
import type { GameSystem, GameSystemManifest } from '@armoury/data';

import { useDataContext } from '@mobile/src/providers/DataContextProvider.js';
import { systemManifests } from '@mobile/src/lib/discoverSystems.js';
import type { SystemSyncStatus } from '@mobile/src/providers/DataContextProvider.js';

/**
 * Resolves a GameSystem implementation for the given manifest ID.
 * Uses dynamic imports to avoid bundling all system packages at startup.
 *
 * @param manifestId - The system identifier from the manifest (e.g., 'wh40k10e').
 * @returns The resolved GameSystem, or null if the system is unknown.
 */
async function resolveGameSystem(manifestId: string): Promise<GameSystem | null> {
    switch (manifestId) {
        case 'wh40k10e': {
            const { wh40k10eSystem } = await import('@armoury/wh40k10e/system');

            return wh40k10eSystem;
        }

        default:
            return null;
    }
}

/**
 * Derives the sync status for a given system from the DataContext sync states.
 *
 * @param systemId - The system ID to look up.
 * @param syncStates - The current per-system sync state map.
 * @returns The sync status string, or 'idle' if the system has no state entry.
 */
function getSyncStatus(
    systemId: string,
    syncStates: Record<string, { status: SystemSyncStatus; error?: string }>,
): SystemSyncStatus {
    return syncStates[systemId]?.status ?? 'idle';
}

/**
 * Landing screen component providing game system selection.
 *
 * Displays discovered game system tiles with gradient backgrounds and interactive
 * overlays. Handles auth gating via Auth0 and DataContext initialization for
 * system activation.
 *
 * @returns The rendered landing screen.
 */
export default function LandingScreen() {
    const router = useRouter();
    const { authorize, user } = useAuth0();
    const { systemSyncStates, enableSystem } = useDataContext();
    const [activatingId, setActivatingId] = React.useState<string | null>(null);
    const isAuthenticated = user !== null && user !== undefined;

    /**
     * Handles a tile overlay press.
     * If unauthenticated, triggers Auth0 login flow.
     * If authenticated, resolves the GameSystem and calls enableSystem.
     * Navigates to the armies tab once synced.
     */
    const handleTilePress = React.useCallback(
        async (manifest: GameSystemManifest) => {
            if (!isAuthenticated) {
                try {
                    await authorize({ scope: 'openid profile email' });
                } catch {
                    /* User cancelled login — no action needed. */
                }

                return;
            }

            const status = getSyncStatus(manifest.id, systemSyncStates);

            if (status === 'syncing') {return;}

            setActivatingId(manifest.id);
            const system = await resolveGameSystem(manifest.id);

            if (system) {
                await enableSystem(system);
                router.push('/(tabs)/armies');
            }

            setActivatingId(null);
        },
        [isAuthenticated, authorize, router, systemSyncStates, enableSystem],
    );

    return (
        <ScrollView style={styles.scrollView}>
            <YStack style={styles.heroSection}>
                <H1 color="$primary">Armoury</H1>
                <Paragraph color="$mutedForeground" style={styles.subtitleText}>
                    Select a game system to begin managing your armies and campaigns.
                </Paragraph>
            </YStack>

            <YStack gap="$4" width="100%" style={styles.tileContainer}>
                {systemManifests.map((manifest) => {
                    const status = getSyncStatus(manifest.id, systemSyncStates);
                    const isSyncing = status === 'syncing' || activatingId === manifest.id;
                    const isSynced = status === 'synced';
                    const isError = status === 'error';

                    return (
                        <SystemTile
                            key={manifest.id}
                            manifest={manifest}
                            isSyncing={isSyncing}
                            isSynced={isSynced}
                            isError={isError}
                            onPress={() => void handleTilePress(manifest)}
                        />
                    );
                })}
            </YStack>

            {!isAuthenticated && (
                <YStack style={styles.authSection}>
                    <Button
                        size="$3"
                        theme="accent"
                        onPress={() => void authorize({ scope: 'openid profile email' })}
                    >
                        Sign In
                    </Button>
                    <Paragraph color="$mutedForeground" size="$2">
                        New here? Sign in to create an account.
                    </Paragraph>
                </YStack>
            )}

            <Paragraph
                color="$mutedForeground"
                size="$1"
                opacity={0.6}
                style={styles.disclaimer}
            >
                This is an unofficial, fan-made tool. Not affiliated with or endorsed by any game
                publisher. All trademarks are property of their respective owners.
            </Paragraph>
        </ScrollView>
    );
}

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Props for an individual SystemTile component.
 */
interface SystemTileProps {
    /** The manifest data for this system. */
    manifest: GameSystemManifest;
    /** Whether the system is currently syncing/downloading. */
    isSyncing: boolean;
    /** Whether the system has finished syncing. */
    isSynced: boolean;
    /** Whether the last sync attempt failed. */
    isError: boolean;
    /** Press handler for the tile. */
    onPress: () => void;
}

/**
 * SystemTile component.
 *
 * Renders a single game system card with gradient background and
 * interactive overlay for download/sync actions.
 *
 * @param props - Tile props.
 * @returns The rendered tile.
 */
function SystemTile({ manifest, isSyncing, isSynced, isError, onPress }: SystemTileProps): React.ReactElement {
    const overlayLabel = isError
        ? 'Retry Download'
        : isSyncing
          ? 'Downloading...'
          : isSynced
            ? 'Ready'
            : 'Press to Download';

    return (
        <Pressable onPress={onPress} disabled={isSyncing} style={styles.tile}>
            <View style={[styles.gradientBox, { backgroundColor: manifest.gradientStart }]}>
                <Paragraph
                    style={styles.splashText}
                    color={manifest.splashTextColor}
                    fontSize={48}
                    fontWeight="800"
                    letterSpacing={4}
                >
                    {manifest.splashText}
                </Paragraph>

                {!isSynced && (
                    <View style={styles.overlay}>
                        {isSyncing ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : null}
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
                    {manifest.splashText}
                </Paragraph>
                <Paragraph color="$mutedForeground" size="$2">
                    {manifest.id}
                </Paragraph>
            </View>
        </Pressable>
    );
}

/**
 * Styles for the landing screen and system tiles.
 */
const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: '#0a0c0e',
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 24,
        gap: 8,
        paddingTop: 48,
        paddingHorizontal: 24,
    },
    subtitleText: {
        textAlign: 'center',
    },
    tileContainer: {
        maxWidth: 400,
        alignSelf: 'center',
        paddingHorizontal: 24,
    },
    authSection: {
        alignItems: 'center',
        marginTop: 32,
        gap: 12,
    },
    disclaimer: {
        textAlign: 'center',
        marginTop: 32,
        maxWidth: 400,
        alignSelf: 'center',
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    tile: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
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
        gap: 4,
    },
});
