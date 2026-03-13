/**
 * Forge Components
 *
 * Barrel export for the Forge (army list) feature module.
 *
 * @requirements
 * 1. Must export all Forge components with named exports.
 * 2. Must not use default exports.
 * 3. Must provide type exports for component props.
 */

// Container (orchestrator)
export { ForgeContainer, type ForgeContainerProps } from '@/components/forge/ForgeContainer.js';

// Views
export { ArmyListView, type ArmyListViewProps } from '@/components/forge/ArmyListView.js';

// Components
export { ArmyCard, type ArmyCardProps } from '@/components/forge/ArmyCard.js';
export { ArmyCardActions, type ArmyCardActionsProps } from '@/components/forge/ArmyCardActions.js';
export {
    ArmyFilterPanel,
    DEFAULT_FORGE_FILTERS,
    type ArmyFilterPanelProps,
    type ForgeFilters,
    type ForgeSortBy,
} from '@/components/forge/ArmyFilterPanel.js';
