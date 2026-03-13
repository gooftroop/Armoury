/**
 * Shared Components
 *
 * Reusable UI components shared across feature modules.
 * These components compose UI primitives with domain-specific defaults.
 *
 * @requirements
 * 1. Must export all shared components with named exports.
 * 2. Must not use default exports.
 * 3. Must provide type exports for component props.
 */

// EmptyState component
export { EmptyState, type EmptyStateProps } from '@/components/shared/EmptyState.js';

// ConfirmDialog component
export { ConfirmDialog, type ConfirmDialogProps } from '@/components/shared/ConfirmDialog.js';

// ArmyCardSkeleton component
export { ArmyCardSkeleton, type ArmyCardSkeletonProps } from '@/components/shared/ArmyCardSkeleton.js';
