'use client';

/**
 * @requirements
 * 1. Must export a hook that returns the current game system ID from the URL pathname.
 * 2. Must derive the game system from the first pathname segment.
 * 3. Must return an empty string when the pathname has no segments.
 */

import { usePathname } from 'next/navigation';

/**
 * Derives the current game system identifier from the URL pathname.
 *
 * next-intl is configured with `localePrefix: 'as-needed'`, so the default
 * locale is stripped from the URL. `usePathname()` returns paths like
 * `/{gameSystem}/armies`, making the game system the first segment.
 *
 * @returns The game system ID string, or an empty string if not present.
 */
export function useGameSystem(): string {
    const pathname = usePathname();
    const segments = pathname.split('/').filter(Boolean);

    return segments[0] ?? '';
}
