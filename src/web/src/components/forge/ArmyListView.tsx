'use client';

/**
 * ArmyListView Component
 *
 * Pure render view for the Forge page. Displays page header, filter panel,
 * and a responsive grid of army cards. Handles loading and empty states.
 * Owns zero state — all data and callbacks come from the parent container.
 *
 * @requirements
 * 1. Must export ArmyListView component and ArmyListViewProps type.
 * 2. Must render page title, subtitle, and "Create Army" link.
 * 3. Must render ArmyFilterPanel above the army grid.
 * 4. Must render a responsive grid: 1 col at mobile, 2 at md, 3 at lg.
 * 5. Must show ArmyCardSkeleton placeholders during loading.
 * 6. Must show EmptyState when no armies exist.
 * 7. Must use next-intl useTranslations for all user-facing strings.
 * 8. Must not own any state or perform data fetching.
 * 9. Must display displayName in React DevTools.
 * 10. Must not use default exports.
 */

import * as React from 'react';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Shield } from 'lucide-react';

import { Button } from '@/components/ui/index.js';
import { EmptyState, ArmyCardSkeleton } from '@/components/shared/index.js';
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
 * ArmyListView — pure render view for the Forge (army list) page.
 *
 * Renders the page header, filter panel, and a responsive grid of army cards.
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
    const t = useTranslations('forge');

    return (
        <div className="flex flex-col gap-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary">{t('title')}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
                </div>
                <Link href="armies/new">
                    <Button variant="primary">{t('actions.createArmy')}</Button>
                </Link>
            </div>

            {/* Loading state */}
            {isLoading && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: SKELETON_COUNT }, (_, i) => (
                        <ArmyCardSkeleton key={i} />
                    ))}
                </div>
            )}

            {/* Empty state — no armies at all */}
            {!isLoading && isEmpty && (
                <EmptyState
                    icon={<Shield />}
                    title={t('emptyState.title')}
                    description={t('emptyState.description')}
                    action={
                        <Link href="armies/new">
                            <Button variant="primary">{t('emptyState.action')}</Button>
                        </Link>
                    }
                />
            )}

            {/* Army list with filters */}
            {!isLoading && !isEmpty && (
                <>
                    <ArmyFilterPanel filters={filters} onChange={onFilterChange} factionIds={factionIds} />

                    {armies.length === 0 ? (
                        /* Filters applied but no matches */
                        <p className="py-8 text-center text-sm text-muted-foreground">{t('emptyState.title')}</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {armies.map((army) => (
                                <ArmyCard
                                    key={army.id}
                                    army={army}
                                    onDeploy={() => onDeploy(army.id)}
                                    onDuplicate={() => onDuplicate(army.id)}
                                    onDelete={() => onDelete(army.id)}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

ArmyListView.displayName = 'ArmyListView';

export { ArmyListView };
