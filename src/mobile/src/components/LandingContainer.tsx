/**
 * Orchestrational container for the mobile landing route.
 *
 * @requirements
 * 1. Must own auth, routing, sync-state, and system-activation orchestration.
 * 2. Must delegate all visual rendering to LandingView.
 * 3. Must preserve Auth0 authorize scope and post-sync navigation behavior.
 * 4. Auth sign-in/create-account callbacks now live in ProfileTileContainer.
 *
 * @module landing-container
 */

import * as React from 'react';
import { useRouter } from 'expo-router';
import { useAuth0 } from 'react-native-auth0';
import { useTheme } from 'tamagui';
import type { GameSystemManifest } from '@armoury/data-dao';

import { LandingView } from '@/components/LandingView.js';
import type { LandingTileViewModel } from '@/components/LandingView.js';
import { systemManifests } from '@/lib/discoverSystems.js';
import { getSyncStatus } from '@/lib/getSyncStatus.js';
import { resolveGameSystem } from '@/lib/resolveGameSystem.js';
import { useSyncProgress } from '@/hooks/useSyncProgress.js';
import { useDataContext } from '@/providers/DataContextProvider.js';

/**
 * LandingContainer orchestrates auth-gated system activation.
 *
 * @returns LandingView with precomputed props and handlers.
 */
function LandingContainer(): React.ReactElement {
    const router = useRouter();
    const { authorize, user } = useAuth0();
    const { systemSyncStates, enableSystem, syncProgressCollector } = useDataContext();
    const [activatingId, setActivatingId] = React.useState<string | null>(null);
    const syncProgress = useSyncProgress(syncProgressCollector);
    const theme = useTheme();
    const isAuthenticated = user !== null && user !== undefined;
    const scrollViewBg = theme.background?.val ?? '#121416';

    const handleTilePress = React.useCallback(
        async (manifest: GameSystemManifest) => {
            if (!isAuthenticated) {
                try {
                    await authorize({ scope: 'openid profile email' });
                } catch {
                    return;
                }

                return;
            }

            const status = getSyncStatus(manifest.id, systemSyncStates);

            if (status === 'syncing') {
                return;
            }

            setActivatingId(manifest.id);
            const system = await resolveGameSystem(manifest.id);

            if (system) {
                await enableSystem(system);
                router.push('/(tabs)/armies');
            }

            setActivatingId(null);
        },
        [authorize, enableSystem, isAuthenticated, router, systemSyncStates],
    );

    const tiles: LandingTileViewModel[] = systemManifests.map((manifest) => {
        const status = getSyncStatus(manifest.id, systemSyncStates);
        const isSyncing = status === 'syncing' || activatingId === manifest.id;

        return {
            manifest,
            isSyncing,
            isSynced: status === 'synced',
            isError: status === 'error',
            syncProgress: isSyncing ? syncProgress : undefined,
            onPress: () => {
                void handleTilePress(manifest);
            },
        };
    });

    return <LandingView tiles={tiles} scrollViewBg={scrollViewBg} />;
}

LandingContainer.displayName = 'LandingContainer';

export { LandingContainer };
