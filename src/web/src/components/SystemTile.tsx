'use client';

/**
 * System tile render component.
 *
 * Pure visual card for a single game system manifest with sync overlay states.
 *
 * @requirements
 * 1. Must render manifest gradient splash and accent bar.
 * 2. Must render overlay with syncing/error/download states.
 * 3. Must render synced badge when synced.
 * 4. Must not own data fetching or side effects.
 *
 * @module system-tile
 */

import * as React from 'react';

import { Download, Loader2, AlertCircle, Check } from 'lucide-react';

import type { GameSystemManifest } from '@armoury/data-dao';

import { cn } from '@/lib/utils.js';

/**
 * Props for an individual SystemTile.
 */
export interface SystemTileProps {
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
    /** Text to display on the overlay or synced badge. */
    overlayText: string;
    /** Click handler for the tile overlay. */
    onClick: () => void;
}

/**
 * Renders a single game system card with splash, metadata, and sync actions.
 *
 * @param props - Tile props.
 * @returns The rendered system tile.
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

            <div
                className={cn(
                    'flex flex-col gap-2 p-5 pt-4 transition-opacity duration-300',
                    isSyncing && 'animate-pulse opacity-50',
                )}
            >
                <h2 className="text-2xl font-semibold leading-tight text-foreground">{manifest.title}</h2>
                <p className="-mt-1 text-sm text-tertiary">{manifest.subtitle}</p>
                <p className="text-sm leading-relaxed text-tertiary">{manifest.description}</p>
            </div>
        </div>
    );
}

SystemTile.displayName = 'SystemTile';

export { SystemTile };
