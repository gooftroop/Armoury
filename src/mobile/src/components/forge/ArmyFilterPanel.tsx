/**
 * ArmyFilterPanel Component
 *
 * Collapsible panel with filter and sort controls for the army list.
 * Pure presentational — filter state is owned by the parent container.
 *
 * @requirements
 * 1. Must export ArmyFilterPanel component, ArmyFilterPanelProps type, ForgeFilters type,
 *    ForgeSortBy type, and DEFAULT_FORGE_FILTERS constant.
 * 2. Must render faction, battle size, and sort pickers inside a collapsible panel.
 * 3. Must derive faction options from the provided factionIds array.
 * 4. Must hardcode English labels (no i18n infrastructure on mobile).
 * 5. Must delegate filter changes to onChange callback.
 * 6. Must include a "Clear Filters" button that resets all filters to defaults.
 * 7. Must display displayName in React DevTools.
 * 8. Must not use default exports.
 */

import { useState, useCallback } from 'react';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Paragraph, YStack, XStack } from 'tamagui';

import type { BattleSize } from '@armoury/wh40k10e';

/** Sort order options for the army list. */
export type ForgeSortBy = 'newest' | 'oldest' | 'name' | 'points';

/**
 * Filter state for the Forge army list.
 */
export interface ForgeFilters {
    /** Selected faction ID filter, or null for all factions. */
    factionId: string | null;

    /** Selected battle size filter, or null for all sizes. */
    battleSize: BattleSize | null;

    /** Current sort order. */
    sortBy: ForgeSortBy;
}

/** Default filter state with no filters applied and newest-first sort. */
export const DEFAULT_FORGE_FILTERS: ForgeFilters = {
    factionId: null,
    battleSize: null,
    sortBy: 'newest',
};

/**
 * Props for the ArmyFilterPanel component.
 */
export interface ArmyFilterPanelProps {
    /** Current filter state. */
    filters: ForgeFilters;

    /** Callback fired when any filter value changes. */
    onChange: (filters: ForgeFilters) => void;

    /** Unique faction IDs extracted from the current armies list. */
    factionIds: string[];
}

/** All battle size options. */
const BATTLE_SIZES: BattleSize[] = ['Incursion', 'StrikeForce', 'Onslaught'];

/** All sort options with display labels. */
const SORT_OPTIONS: { value: ForgeSortBy; label: string }[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'name', label: 'Name' },
    { value: 'points', label: 'Points' },
];

/**
 * A chip-style toggle button for filter options.
 *
 * @param props - Label, active state, and press handler.
 * @returns The rendered filter chip.
 */
function FilterChip({
    label,
    active,
    onPress,
}: {
    label: string;
    active: boolean;
    onPress: () => void;
}): React.ReactElement {
    return (
        <Button size="$2" background={active ? '$primary' : '$muted'} onPress={onPress}>
            <Paragraph color={active ? 'white' : '$color'} fontWeight="600" size="$1">
                {label}
            </Paragraph>
        </Button>
    );
}

FilterChip.displayName = 'FilterChip';

/**
 * ArmyFilterPanel — collapsible filter and sort controls for the army list.
 *
 * Renders a toggle button that expands to show faction, battle size, and sort
 * chip selectors. Includes a clear button to reset all filters to defaults.
 *
 * @param props - Component props including current filters, onChange callback, and available faction IDs.
 * @returns The rendered filter panel.
 */
function ArmyFilterPanel({ filters, onChange, factionIds }: ArmyFilterPanelProps): React.ReactElement {
    const [expanded, setExpanded] = useState(false);

    /** Updates a single filter key while preserving the rest. */
    const updateFilter = useCallback(
        <K extends keyof ForgeFilters>(key: K, value: ForgeFilters[K]) => {
            onChange({ ...filters, [key]: value });
        },
        [filters, onChange],
    );

    /** Resets all filters to defaults. */
    const handleClear = useCallback(() => {
        onChange(DEFAULT_FORGE_FILTERS);
    }, [onChange]);

    const hasActiveFilters = filters.factionId !== null || filters.battleSize !== null;

    return (
        <YStack gap="$3">
            <XStack gap="$2">
                <Button size="$3" variant="outlined" onPress={() => setExpanded((prev) => !prev)}>
                    <Paragraph color="$color" fontWeight="600" size="$2">
                        {expanded ? 'Hide Filters ▲' : 'Filters ▼'}
                    </Paragraph>
                </Button>

                {hasActiveFilters && (
                    <Button size="$3" variant="outlined" onPress={handleClear}>
                        <Paragraph color="$color" fontWeight="600" size="$2">
                            Clear
                        </Paragraph>
                    </Button>
                )}
            </XStack>

            {expanded && (
                <YStack gap="$3">
                    {/* Faction filter */}
                    {factionIds.length > 0 && (
                        <YStack gap="$1">
                            <Paragraph color="$mutedForeground" size="$2" fontWeight="600">
                                Faction
                            </Paragraph>

                            <View style={styles.chipRow}>
                                <FilterChip
                                    label="All"
                                    active={filters.factionId === null}
                                    onPress={() => updateFilter('factionId', null)}
                                />
                                {factionIds.map((id) => (
                                    <FilterChip
                                        key={id}
                                        label={id}
                                        active={filters.factionId === id}
                                        onPress={() => updateFilter('factionId', filters.factionId === id ? null : id)}
                                    />
                                ))}
                            </View>
                        </YStack>
                    )}

                    {/* Battle size filter */}
                    <YStack gap="$1">
                        <Paragraph color="$mutedForeground" size="$2" fontWeight="600">
                            Battle Size
                        </Paragraph>

                        <View style={styles.chipRow}>
                            <FilterChip
                                label="All"
                                active={filters.battleSize === null}
                                onPress={() => updateFilter('battleSize', null)}
                            />
                            {BATTLE_SIZES.map((size) => (
                                <FilterChip
                                    key={size}
                                    label={size}
                                    active={filters.battleSize === size}
                                    onPress={() =>
                                        updateFilter('battleSize', filters.battleSize === size ? null : size)
                                    }
                                />
                            ))}
                        </View>
                    </YStack>

                    {/* Sort order */}
                    <YStack gap="$1">
                        <Paragraph color="$mutedForeground" size="$2" fontWeight="600">
                            Sort By
                        </Paragraph>

                        <View style={styles.chipRow}>
                            {SORT_OPTIONS.map((option) => (
                                <FilterChip
                                    key={option.value}
                                    label={option.label}
                                    active={filters.sortBy === option.value}
                                    onPress={() => updateFilter('sortBy', option.value)}
                                />
                            ))}
                        </View>
                    </YStack>
                </YStack>
            )}
        </YStack>
    );
}

ArmyFilterPanel.displayName = 'ArmyFilterPanel';

const styles = StyleSheet.create({
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
});

export { ArmyFilterPanel };
