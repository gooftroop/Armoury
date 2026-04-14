/**
 * ArmyListView Component
 *
 * Pure render view for the Forge screen. Displays page header, filter panel,
 * and a scrollable list of army cards. Handles loading and empty states.
 * Owns zero state — all data and callbacks come from the parent container.
 *
 * @requirements
 * 1. Must export ArmyListView component and ArmyListViewProps type.
 * 2. Must render page title and subtitle.
 * 3. Must render ArmyFilterPanel above the army list.
 * 4. Must show ArmyCardSkeleton placeholders during loading.
 * 5. Must show EmptyState callout when no armies exist.
 * 6. Must show "no matches" message when filters produce zero results.
 * 7. Must hardcode English labels (no i18n infrastructure on mobile).
 * 8. Must not own any state or perform data fetching.
 * 9. Must display displayName in React DevTools.
 * 10. Must not use default exports.
 */

import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { ScrollView, YStack, H2, Paragraph } from 'tamagui';

import { EmptyState } from '@/components/shared/EmptyState.js';
import { ArmyCardSkeleton } from '@/components/shared/ArmyCardSkeleton.js';
import { ArmyCard } from '@/components/forge/ArmyCard.js';
import { ArmyFilterPanel } from '@/components/forge/ArmyFilterPanel.js';
import type { ForgeFilters } from '@/components/forge/ArmyFilterPanel.js';
import type { Army } from '@armoury/wh40k10e';

/**
 * Props for the ArmyListView component.
 */
export interface ArmyListViewProps {
    /** Filtered and sorted armies to display. */
    armies: Army[];

    /** Whether army data is currently loading. */
    isLoading: boolean;

    /** Whether the user has zero armies (before filtering). */
    isEmpty: boolean;

    /** Current filter/sort state. */
    filters: ForgeFilters;

    /** Callback fired when filter values change. */
    onFilterChange: (filters: ForgeFilters) => void;

    /** Unique faction IDs derived from the full (unfiltered) army list. */
    factionIds: string[];

    /** Callback fired when the Deploy action is triggered on an army. */
    onDeploy: (armyId: string) => void;

    /** Callback fired when the Duplicate action is triggered on an army. */
    onDuplicate: (armyId: string) => void;

    /** Callback fired when the Delete action is triggered on an army. */
    onDelete: (armyId: string) => void;
}

/** Number of skeleton cards to display during loading. */
const SKELETON_COUNT = 4;

/**
 * ArmyListView — pure render view for the Forge (army list) screen.
 *
 * Renders the page header, filter panel, and a scrollable list of army cards.
 * Delegates all data fetching and state management to the parent container.
 *
 * @param props - Component props including armies, loading state, filters, and action callbacks.
 * @returns The rendered army list view.
 */
function ArmyListView({
    armies,
    isLoading,
    isEmpty,
    filters,
    onFilterChange,
    factionIds,
    onDeploy,
    onDuplicate,
    onDelete,
}: ArmyListViewProps): React.ReactElement {
    return (
        <ScrollView style={styles.scroll}>
            <YStack gap="$4" style={styles.content}>
                {/* Page header */}
                <YStack gap="$1">
                    <H2 color="$primary">The Forge</H2>

                    <Paragraph color="$mutedForeground" size="$3">
                        Manage your army rosters
                    </Paragraph>
                </YStack>

                {/* Loading state */}
                {isLoading && (
                    <YStack gap="$3">
                        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
                            <ArmyCardSkeleton key={`skeleton-${String(i)}`} />
                        ))}
                    </YStack>
                )}

                {/* Empty state — no armies at all */}
                {!isLoading && isEmpty && (
                    <EmptyState
                        title="No armies yet"
                        description="Create your first army to get started with The Forge."
                    />
                )}

                {/* Army list with filters */}
                {!isLoading && !isEmpty && (
                    <YStack gap="$4">
                        <ArmyFilterPanel filters={filters} onChange={onFilterChange} factionIds={factionIds} />

                        {armies.length === 0 ? (
                            /* Filters applied but no matches */
                            <View style={styles.noResults}>
                                <Paragraph color="$mutedForeground" size="$3">
                                    No armies match your filters.
                                </Paragraph>
                            </View>
                        ) : (
                            <YStack gap="$3">
                                {armies.map((army) => (
                                    <ArmyCard
                                        key={army.id}
                                        army={army}
                                        onDeploy={() => onDeploy(army.id)}
                                        onDuplicate={() => onDuplicate(army.id)}
                                        onDelete={() => onDelete(army.id)}
                                    />
                                ))}
                            </YStack>
                        )}
                    </YStack>
                )}
            </YStack>
        </ScrollView>
    );
}

ArmyListView.displayName = 'ArmyListView';

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        padding: 16,
    },
    noResults: {
        alignItems: 'center',
        paddingVertical: 32,
    },
});

export { ArmyListView };
