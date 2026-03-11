'use client';

/**
 * System Grid Component
 *
 * A responsive grid of interactive game system tiles for the landing page.
 * Each tile displays a gradient splash from the system manifest and an overlay
 * prompting users to download the game data. Handles auth gating (redirect to
 * Auth0 login if unauthenticated), DataContext initialization via enableSystem,
 * and per-system sync state tracking (loading, synced, error).
 *
 * System display names are NOT hardcoded — they come from BSData at runtime.
 * Until data is synced, the tile shows the manifest splash text as the label.
 *
 * @requirements
 * 1. Must render one tile per GameSystemManifest in a responsive grid.
 * 2. Must show a download overlay on tiles whose system is not yet enabled/synced.
 * 3. Must redirect unauthenticated users to /auth/login when they click a tile overlay.
 * 4. Must call enableSystem() from DataContext when an authenticated user clicks the overlay.
 * 5. Must show a loading indicator while a system is syncing.
 * 6. Must show an error message with retry when sync fails.
 * 7. Must remove the overlay and show the tile as active once synced.
 * 8. Must not hardcode any game system display names.
 *
 * @module system-grid
 */

import * as React from 'react';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Download, Loader2, AlertCircle, Check } from 'lucide-react';

import type { GameSystemManifest, GameSystem } from '@armoury/data-dao/types';

import { useDataContext } from '@/providers/DataContextProvider.js';
import type { SystemSyncStatus } from '@/providers/DataContextProvider.js';
import { cn } from '@/lib/utils.js';

/**
 * Props for the SystemGrid component.
 */
export interface SystemGridProps {
    /** Array of discovered game system manifests to render as tiles. */
    manifests: GameSystemManifest[];
    /** Whether the current user has an active Auth0 session. */
    isAuthenticated: boolean;
}

/**
 * Resolves a GameSystem implementation for the given manifest ID.
 * Uses dynamic imports to avoid bundling all system packages in the initial JS.
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
 * SystemGrid component.
 *
 * Renders a responsive grid of game system tiles discovered from manifest files.
 * Each tile displays the system's gradient splash, accent bar, and an interactive
 * overlay for downloading system data.
 *
 * @param props - Component props.
 * @returns The rendered system grid.
 */
export function SystemGrid({ manifests, isAuthenticated }: SystemGridProps): React.ReactElement {
    const t = useTranslations('landing');
    const router = useRouter();
    const { systemSyncStates, enableSystem } = useDataContext();
    const [activatingId, setActivatingId] = React.useState<string | null>(null);

    /**
     * Handles a tile overlay click.
     * If unauthenticated, redirects to Auth0 login.
     * If authenticated, resolves the GameSystem and calls enableSystem.
     */
    const handleTileClick = React.useCallback(
        async (manifest: GameSystemManifest) => {
            if (!isAuthenticated) {
                router.push('/auth/login?returnTo=/');

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
            }

            setActivatingId(null);
        },
        [isAuthenticated, router, systemSyncStates, enableSystem],
    );

    return (
        <div
            className="mb-10 grid w-full max-w-[1120px] gap-6"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))' }}
        >
            {manifests.map((manifest) => {
                const status = getSyncStatus(manifest.id, systemSyncStates);
                const isSyncing = status === 'syncing' || activatingId === manifest.id;
                const isSynced = status === 'synced';
                const isError = status === 'error';
                const showOverlay = !isSynced;

                return (
                    <SystemTile
                        key={manifest.id}
                        manifest={manifest}
                        isSyncing={isSyncing}
                        isSynced={isSynced}
                        isError={isError}
                        showOverlay={showOverlay}
                        overlayText={
                            isError
                                ? t('syncError')
                                : isSyncing
                                  ? t('downloading')
                                  : isSynced
                                    ? t('synced')
                                    : t('downloadOverlay')
                        }
                        onClick={() => void handleTileClick(manifest)}
                    />
                );
            })}
        </div>
    );
}

SystemGrid.displayName = 'SystemGrid';

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Props for an individual SystemTile.
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
    /** Whether to show the overlay (true when not synced). */
    showOverlay: boolean;
    /** Text to display on the overlay. */
    overlayText: string;
    /** Click handler for the tile. */
    onClick: () => void;
}

/**
 * SystemTile component.
 *
 * Renders a single game system card with gradient splash, accent bar, and
 * interactive overlay for download/sync actions.
 *
 * @param props - Tile props.
 * @returns The rendered tile.
 */
function SystemTile({
    manifest,
    isSyncing,
    isSynced,
    isError,
    showOverlay,
    overlayText,
    onClick,
}: SystemTileProps): React.ReactElement {
    return (
        <div
            className={cn(
                'group relative flex flex-col overflow-hidden rounded-lg border border-border/40',
                'bg-surface/60 backdrop-blur-sm shadow-sm',
                'transition-all duration-200 ease-out',
                isSynced && 'hover:-translate-y-0.5 hover:border-border hover:shadow-md',
                showOverlay && 'hover:-translate-y-0.5 hover:border-border/60',
            )}
        >
            <div
                className="absolute left-0 right-0 top-0 h-1"
                style={{
                    background: manifest.accent === 'gold' ? 'var(--accent-primary)' : 'oklch(1 0 0 / 12%)',
                }}
            />

            <div
                className="relative flex h-20 items-center justify-center overflow-hidden md:h-[120px]"
                style={{
                    background: `linear-gradient(135deg, ${manifest.gradientStart}, ${manifest.gradientMid}, ${manifest.gradientEnd})`,
                }}
            >
                <span
                    className="select-none text-5xl font-extrabold uppercase tracking-[0.1em]"
                    style={{ color: manifest.splashTextColor }}
                >
                    {manifest.splashText}
                </span>

                {showOverlay && (
                    <button
                        type="button"
                        className={cn(
                            'absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-2',
                            'bg-black/60 backdrop-blur-[2px]',
                            'transition-opacity duration-200',
                            isSyncing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                        )}
                        onClick={onClick}
                        disabled={isSyncing}
                    >
                        {isSyncing ? (
                            <Loader2 className="h-6 w-6 animate-spin text-white/90" />
                        ) : isError ? (
                            <AlertCircle className="h-6 w-6 text-red-400" />
                        ) : (
                            <Download className="h-6 w-6 text-white/90" />
                        )}
                        <span
                            className={cn(
                                'text-sm font-semibold uppercase tracking-wider',
                                isError ? 'text-red-400' : 'text-white/90',
                            )}
                        >
                            {overlayText}
                        </span>
                    </button>
                )}

                {isSynced && (
                    <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-green-900/60 px-2.5 py-1 text-xs font-medium text-green-300">
                        <Check className="h-3 w-3" />
                        <span>{overlayText}</span>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2 p-5 pt-4">
                <h2 className="text-lg font-semibold leading-tight text-primary">{manifest.splashText}</h2>
                <p className="text-xs leading-relaxed text-secondary/70">{manifest.id}</p>
            </div>
        </div>
    );
}

SystemTile.displayName = 'SystemTile';
