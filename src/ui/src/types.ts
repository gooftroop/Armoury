/**
 * Shared base types for @armoury/ui cross-platform components.
 *
 * These types are safe to import from both web and mobile.
 * They must have zero platform-specific imports (no Radix, no Tamagui,
 * no react-native, no DOM types).
 *
 * @requirements
 * 1. Must be importable from both @armoury/web and @armoury/mobile without
 *    transitive platform dependencies.
 * 2. Must not import from Radix UI, Tamagui, react-native, or any DOM type.
 * 3. React.ReactNode is allowed as a type-only import.
 */

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

/** Visual style variant for the Button component. */
export type ButtonVariant = 'primary' | 'secondary' | 'highlight' | 'ghost' | 'destructive' | 'outline';

/** Size preset for the Button component. */
export type ButtonSize = 'sm' | 'md' | 'lg';

// ---------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------

/** Which edge the Drawer slides in from (web) or anchors to (mobile Sheet). */
export type DrawerSide = 'right' | 'left' | 'top' | 'bottom';

// ---------------------------------------------------------------------------
// Badge / Chip
// ---------------------------------------------------------------------------

/** Visual style variant for Badge and Chip components. */
export type BadgeVariant = 'default' | 'secondary' | 'highlight' | 'destructive' | 'outline';

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

/** Visual state variant for Input components. */
export type InputVariant = 'default' | 'error' | 'success';

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------

/** An individual option within a Select component. */
export interface SelectOption {
    /** The value submitted on form submission. */
    value: string;
    /** The label displayed in the dropdown. */
    label: string;
    /** Whether this option is disabled. */
    disabled?: boolean;
}
