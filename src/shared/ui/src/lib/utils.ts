/**
 * @requirements
 * 1. Must export a `cn` utility function that combines clsx and tailwind-merge.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and merges Tailwind classes using tailwind-merge.
 *
 * @param inputs - Array of class values to be combined.
 * @returns A single merged class string.
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}
