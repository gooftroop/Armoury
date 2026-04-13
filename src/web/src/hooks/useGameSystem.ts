'use client';

/**
 * @requirements
 * 1. Must export a hook that returns the current game system ID from the URL pathname.
 * 2. Must derive the game system from the second pathname segment (after locale).
 * 3. Must return an empty string when the pathname has fewer than two segments.
 */

import { usePathname } from 'next/navigation';

/**
 * Derives the current game system identifier from the URL pathname.
 *
 * The app routes follow the pattern `/{locale}/{gameSystem}/...`, so the
 * game system ID is always the second segment.
 *
 * @returns The game system ID string, or an empty string if not present.
 */
export function useGameSystem(): string {
    const pathname = usePathname();
    const segments = pathname.split('/').filter(Boolean);

    return segments[1] ?? '';
}
