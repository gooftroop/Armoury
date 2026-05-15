/**
 * @armoury/feature-forge — web barrel file.
 *
 * @requirements
 * 1. Must re-export all forge components and their types.
 * 2. Must not use default exports.
 */

// === Components ===

export { ArmyListView, type ArmyListViewProps } from './components/ArmyListView.web.js';
export { ArmyCard, type ArmyCardProps } from './components/ArmyCard.web.js';
export { ArmyCardActions, type ArmyCardActionsProps } from './components/ArmyCardActions.web.js';
export {
    ArmyFilterPanel,
    DEFAULT_FORGE_FILTERS,
    type ArmyFilterPanelProps,
    type ForgeFilters,
    type ForgeSortBy,
} from './components/ArmyFilterPanel.web.js';
export { ArmyCardSkeleton, type ArmyCardSkeletonProps } from './components/ArmyCardSkeleton.web.js';
export {
    CreateArmyForm,
    BATTLE_SIZE_OPTIONS,
    type CreateArmyFormProps,
    type CreateArmyFormValues,
    type CreateArmyFormErrors,
    type FactionOption,
    type DetachmentOption,
} from './components/CreateArmyForm.web.js';
