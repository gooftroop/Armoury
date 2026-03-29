/**
 * Name-to-initials utility.
 *
 * Creates a compact avatar fallback string from a display name.
 * Handles empty values and single-word names.
 *
 * @requirements
 * 1. Must return '?' for empty or whitespace-only names.
 * 2. Must return one initial for single-word names.
 * 3. Must return two initials for multi-word names (first + last).
 * 4. Must always return uppercase initials.
 *
 * @module getInitials
 */

/**
 * Returns one or two uppercase initials derived from a display name.
 *
 * @param name - The display name to derive initials from.
 * @returns One or two uppercase initials, or '?' when name is empty.
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
