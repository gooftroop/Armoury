'use client';

/**
 * ArmyFilterPanel Component
 *
 * Collapsible panel with filter and sort controls for the army list.
 * Pure presentational — filter state is owned by the parent container.
 *
 * @requirements
 * 1. Must export ArmyFilterPanel component, ArmyFilterPanelProps type, and ForgeFilters type.
 * 2. Must render faction, battle size, and sort dropdowns inside a collapsible panel.
 * 3. Must derive faction options from the provided factionIds array.
 * 4. Must use next-intl useTranslations for all user-facing strings.
 * 5. Must delegate filter changes to onChange callback.
 * 6. Must include a "Clear Filters" button that resets all filters to defaults.
 * 7. Must display displayName in React DevTools.
 * 8. Must not use default exports.
 */

import { useState, useCallback } from 'react';
import type { ReactElement } from 'react';

import { useTranslations } from 'next-intl';
import { SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

import { Button, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/index.js';
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

/** Sentinel value used in Select to represent "all" / no filter. */
const ALL_VALUE = '__all__';

/**
 * ArmyFilterPanel — collapsible filter and sort controls for the army list.
 *
 * Renders a toggle button that expands to show faction, battle size, and sort
 * dropdowns. Includes a clear button to reset all filters to defaults.
 *
 * @param props - Component props including current filters, onChange callback, and available faction IDs.
 * @returns The rendered filter panel.
 */
function ArmyFilterPanel({ filters, onChange, factionIds }: ArmyFilterPanelProps): ReactElement {
    const t = useTranslations('forge.filters');
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
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setExpanded((prev) => !prev)}>
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    {t('label')}
                    {expanded ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
                </Button>
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={handleClear}>
                        {t('clear')}
                    </Button>
                )}
            </div>

            {expanded && (
                <div className="flex flex-wrap gap-3">
                    {/* Faction filter */}
                    <Select
                        value={filters.factionId ?? ALL_VALUE}
                        onValueChange={(value) => updateFilter('factionId', value === ALL_VALUE ? null : value)}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={t('faction')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_VALUE}>{t('allFactions')}</SelectItem>
                            {factionIds.map((id) => (
                                <SelectItem key={id} value={id}>
                                    {id}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Battle size filter */}
                    <Select
                        value={filters.battleSize ?? ALL_VALUE}
                        onValueChange={(value) =>
                            updateFilter('battleSize', value === ALL_VALUE ? null : (value as BattleSize))
                        }
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={t('points')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_VALUE}>{t('allPoints')}</SelectItem>
                            <SelectItem value="Incursion">Incursion</SelectItem>
                            <SelectItem value="StrikeForce">Strike Force</SelectItem>
                            <SelectItem value="Onslaught">Onslaught</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Sort order */}
                    <Select
                        value={filters.sortBy}
                        onValueChange={(value) => updateFilter('sortBy', value as ForgeSortBy)}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={t('sort')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">{t('sortNewest')}</SelectItem>
                            <SelectItem value="oldest">{t('sortOldest')}</SelectItem>
                            <SelectItem value="name">{t('sortName')}</SelectItem>
                            <SelectItem value="points">{t('sortPoints')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
    );
}

ArmyFilterPanel.displayName = 'ArmyFilterPanel';

export { ArmyFilterPanel };
