/**
 * Utility for deriving avatar initials from display names.
 *
 * @requirements
 * 1. Must return one or two uppercase initials for valid names.
 * 2. Must return `?` when the input is empty or whitespace-only.
 * 3. Must handle single-word and multi-word names.
 *
 * @module get-initials
 */

/**
 * Extracts up to two initials from a display name.
 *
 * @param name - The user's display name.
 * @returns One or two uppercase initial characters, or '?' as fallback.
 */
export function getInitials(name: string): string {
    if (!name || name.trim().length === 0) {
        return '?';
    }

    const parts = name.trim().split(/\s+/);

    if (parts.length === 1) {
        return parts[0]![0]!.toUpperCase();
    }

    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
