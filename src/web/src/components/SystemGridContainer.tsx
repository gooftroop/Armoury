'use client';

/**
 * System grid container component.
 *
 * Orchestrates tile state derivation and activation behavior for game systems.
 * Delegates rendering to SystemGridView.
 *
 * @requirements
 * 1. Must use useDataContext() for system sync states and enableSystem().
 * 2. Must delegate unauthenticated tile click behavior to parent via callback.
 * 3. Must resolve game systems via resolveGameSystem utility.
 * 4. Must persist enabled systems to account when userId is provided.
 * 5. Must not render tile layout directly.
 * 6. Must export SystemGrid alias for backwards compatibility.
 * 7. Must NOT use boolean flag props to control auth-gated behavior.
 * 8. Must surface account persistence failures as error state on the tile so the user can retry.
 * 9. Must provide navigation href for synced tiles pointing to the system's armies page.
 * 10. Must derive queue state from system sync statuses without SyncQueueProvider dependencies.
 * 11. Must surface activation failures (thrown errors or null-resolved system) as an error state on the tile so the user can retry, and report them to Sentry with diagnostic context.
 *
 * @module system-grid-container
 */

import { useState, useCallback, useMemo } from 'react';
import type { ReactElement, Dispatch, SetStateAction } from 'react';

import { useTranslations } from 'next-intl';

import * as Sentry from '@sentry/nextjs';

import type { GameSystemManifest } from '@armoury/data-dao';
import type { SyncProgressState } from '@armoury/data-dao';

import { getAccessToken } from '@auth0/nextjs-auth0/client';
import { mutationUpdateAccount } from '@armoury/clients-users';

import { SystemGridView } from '@/components/SystemGridView.js';
import type { SystemTileData } from '@/components/SystemGridView.js';
import { getSyncStatus } from '@armoury/query';
import { resolveGameSystem } from '@armoury/feature-game-system';
import { useSyncProgress } from '@/hooks/useSyncProgress.js';
import { useDataContext } from '@/data/useDataContext.js';
import type { SystemSyncStatus } from '@/data/useDataContext.js';
import { SyncStatus } from '@/data/managerState.js';

/** Per-system sync map used by SystemGrid activation helpers. */
type SyncStateMap = Record<string, { status: SystemSyncStatus; error?: string }>;

/**
 * Props for the SystemGrid container component.
 */
export interface SystemGridProps {
    /** Array of discovered game system manifests to render as tiles. */
    manifests: GameSystemManifest[];
    /** Auth0 user ID used for persisting enabled systems to account. */
    userId?: string;
    /** Callback invoked when an unauthenticated user clicks a tile. Parent provides redirect behavior. */
    onUnauthenticatedClick?: () => void;
}

/**
 * Handles activation flow for a selected game system tile.
 *
 * @param manifest - The selected system manifest.
 * @param onUnauthenticatedClick - Optional callback for unauthenticated tile clicks.
 * @param syncStates - Current per-system sync states.
 * @param enableSystem - DataContext system enable action.
 * @param userId - Optional authenticated user ID for account persistence.
 * @param setActivatingId - Local setter for optimistic syncing state.
 * @param setPersistErrors - Setter for account persistence error tracking.
 */
async function activateSystemTile(
    manifest: GameSystemManifest,
    onUnauthenticatedClick: (() => void) | undefined,
    syncStates: SyncStateMap,
    enableSystem: ReturnType<typeof useDataContext>['enableSystem'],
    userId: string | undefined,
    setActivatingId: Dispatch<SetStateAction<string | null>>,
    setPersistErrors: Dispatch<SetStateAction<Record<string, string>>>,
    setActivationErrors: Dispatch<SetStateAction<Record<string, string>>>,
): Promise<void> {
    if (onUnauthenticatedClick) {
        onUnauthenticatedClick();

        return;
    }

    const status = getSyncStatus(manifest.id, syncStates);

    if (status === SyncStatus.Syncing) {
        return;
    }

    setActivatingId(manifest.id);
    setActivationErrors((prev) => {
        if (!prev[manifest.id]) {
            return prev;
        }

        const next = { ...prev };
        delete next[manifest.id];

        return next;
    });

    Sentry.addBreadcrumb({
        category: 'system-grid',
        level: 'info',
        message: 'activate:start',
        data: { systemId: manifest.id, hasUserId: Boolean(userId) },
    });

    try {
        const system = await resolveGameSystem(manifest.id);

        if (!system) {
            Sentry.captureMessage('SystemGrid activation: resolveGameSystem returned null', {
                level: 'error',
                tags: { area: 'system-grid', operation: 'resolve-game-system', systemId: manifest.id },
            });
            setActivationErrors((prev) => ({
                ...prev,
                [manifest.id]: `System "${manifest.id}" is not available in this build.`,
            }));

            return;
        }

        Sentry.addBreadcrumb({
            category: 'system-grid',
            level: 'info',
            message: 'activate:resolved',
            data: { systemId: manifest.id },
        });

        await enableSystem(system);

        Sentry.addBreadcrumb({
            category: 'system-grid',
            level: 'info',
            message: 'activate:enabled',
            data: { systemId: manifest.id },
        });

        if (userId) {
            try {
                const token = await getAccessToken();
                const authorization = `Bearer ${token}`;
                const mutation = mutationUpdateAccount(
                    authorization,
                    { userId },
                    {
                        systems: {
                            [manifest.id]: {
                                enabled: true,
                                lastSyncedAt: new Date().toISOString(),
                            },
                        },
                    },
                );

                await mutation.mutationFn();

                setPersistErrors((prev) => {
                    if (!prev[manifest.id]) {
                        return prev;
                    }

                    const next = { ...prev };
                    delete next[manifest.id];

                    return next;
                });
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to save to account';
                setPersistErrors((prev) => ({ ...prev, [manifest.id]: message }));
            }
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to activate system';
        Sentry.captureException(err, {
            tags: { area: 'system-grid', operation: 'activate-system-tile', systemId: manifest.id },
        });
        setActivationErrors((prev) => ({ ...prev, [manifest.id]: message }));
    } finally {
        setActivatingId(null);
    }
}

/**
 * Derives view-model tile descriptors from manifests and sync state.
 *
 * @param manifests - Game system manifests.
 * @param syncStates - Current per-system sync states.
 * @param activatingId - Locally activating system ID.
 * @param persistErrors - Per-system account persistence error messages.
 * @param t - Landing translator function.
 * @param handleTileClick - Tile click callback.
 * @returns Tile descriptors for SystemGridView.
 */
function buildTiles(
    manifests: GameSystemManifest[],
    syncStates: SyncStateMap,
    activatingId: string | null,
    persistErrors: Record<string, string>,
    activationErrors: Record<string, string>,
    syncProgress: SyncProgressState | null,
    t: ReturnType<typeof useTranslations<'landing'>>,
    handleTileClick: (manifest: GameSystemManifest) => void,
): SystemTileData[] {
    return manifests.map((manifest) => {
        const status = getSyncStatus(manifest.id, syncStates);
        const isQueued = status === SyncStatus.Pending || status === SyncStatus.Syncing;
        const isSyncing = status === SyncStatus.Syncing || activatingId === manifest.id;
        const hasPersistError = Boolean(persistErrors[manifest.id]);
        const hasActivationError = Boolean(activationErrors[manifest.id]);
        const isSynced = status === SyncStatus.Synced && !hasPersistError && !hasActivationError;
        const isError = status === SyncStatus.Error || hasPersistError || hasActivationError;
        const showOverlay = !isSynced;

        return {
            id: manifest.id,
            manifest,
            isSyncing,
            isSynced,
            isQueued,
            isError,
            showOverlay,
            overlayText: isError
                ? t('syncError')
                : isSyncing
                  ? t('downloading')
                  : isSynced
                    ? t('synced')
                    : t('downloadOverlay'),
            href: isSynced ? `./${manifest.id}/armies` : undefined,
            syncProgress: isSyncing && syncProgress ? syncProgress : undefined,
            onClick: () => {
                handleTileClick(manifest);
            },
        };
    });
}

/**
 * Orchestrates landing system tiles and delegates rendering to SystemGridView.
 *
 * @param props - Component props.
 * @returns The rendered system grid view.
 */
function SystemGridContainer({ manifests, userId, onUnauthenticatedClick }: SystemGridProps): ReactElement {
    const t = useTranslations('landing');
    const { systemSyncStates, syncProgressCollector, enableSystem } = useDataContext();
    const syncProgress = useSyncProgress(syncProgressCollector);
    const [activatingId, setActivatingId] = useState<string | null>(null);
    const [persistErrors, setPersistErrors] = useState<Record<string, string>>({});
    const [activationErrors, setActivationErrors] = useState<Record<string, string>>({});

    const handleTileClick = useCallback(
        async (manifest: GameSystemManifest) => {
            await activateSystemTile(
                manifest,
                onUnauthenticatedClick,
                systemSyncStates,
                enableSystem,
                userId,
                setActivatingId,
                setPersistErrors,
                setActivationErrors,
            );
        },
        [onUnauthenticatedClick, systemSyncStates, enableSystem, userId],
    );

    const tiles = useMemo(
        () =>
            buildTiles(
                manifests,
                systemSyncStates,
                activatingId,
                persistErrors,
                activationErrors,
                syncProgress.phase !== 'idle' ? syncProgress : null,
                t,
                (manifest) => void handleTileClick(manifest),
            ),
        [manifests, systemSyncStates, activatingId, persistErrors, activationErrors, syncProgress, t, handleTileClick],
    );

    return <SystemGridView tiles={tiles} />;
}

SystemGridContainer.displayName = 'SystemGridContainer';

export { SystemGridContainer };
export { SystemGridContainer as SystemGrid };
