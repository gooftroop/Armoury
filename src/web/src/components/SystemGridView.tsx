'use client';

/**
 * System grid view component.
 *
 * Pure render component for the landing system tile grid.
 *
 * @requirements
 * 1. Must render a responsive CSS grid container.
 * 2. Must render one SystemTile per tile descriptor.
 * 3. Must not own DataContext access or side effects.
 *
 * @module system-grid-view
 */

import type { ReactElement } from 'react';

import type { GameSystemManifest, SyncProgressState } from '@armoury/data-dao';

import { SystemTile } from '@/components/SystemTile.js';

/**
 * Render model for a single system tile.
 */
export interface SystemTileData {
    /** Unique system identifier used for React keying. */
    id: string;
    /** Manifest metadata used by tile presentation. */
    manifest: GameSystemManifest;
    /** Whether the system is currently syncing/downloading. */
    isSyncing: boolean;
    /** Whether the system has finished syncing successfully. */
    isSynced: boolean;
    /** Whether the last sync attempt failed. */
    isError: boolean;
    /** Whether overlay UI is shown for this tile. */
    showOverlay: boolean;
    /** Overlay or badge label text. */
    overlayText: string;
    /** Navigation href for synced tiles (links to system's armies page). */
    href?: string;
    /** Real-time sync progress data passed through to SystemTile. */
    syncProgress?: SyncProgressState;
    /** Tile click callback. */
    onClick: () => void;
}

/**
 * Props for the SystemGridView component.
 */
export interface SystemGridViewProps {
    /** Tile render descriptors for all visible systems. */
    tiles: SystemTileData[];
}

/**
 * Renders the landing page system tile grid.
 *
 * @param props - Grid view props.
 * @returns The rendered system grid.
 */
function SystemGridView({ tiles }: SystemGridViewProps): ReactElement {
    return (
        <div
            className="mb-10 grid w-full max-w-[1120px] gap-6"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))' }}
        >
            {tiles.map((tile) => (
                <SystemTile
                    key={tile.id}
                    manifest={tile.manifest}
                    isSyncing={tile.isSyncing}
                    isSynced={tile.isSynced}
                    isError={tile.isError}
                    showOverlay={tile.showOverlay}
                    overlayText={tile.overlayText}
                    syncProgress={tile.syncProgress}
                    href={tile.href}
                    onClick={tile.onClick}
                />
            ))}
        </div>
    );
}

SystemGridView.displayName = 'SystemGridView';

export { SystemGridView };
