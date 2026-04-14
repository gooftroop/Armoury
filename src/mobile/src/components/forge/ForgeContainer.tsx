/**
 * ForgeContainer Component
 *
 * Container (orchestrator) for the Forge screen. Owns all data fetching,
 * mutations, filter state, and delete confirmation flow. Passes processed
 * data and callbacks down to the ArmyListView pure render component.
 *
 * @requirements
 * 1. Must export ForgeContainer component and ForgeContainerProps type.
 * 2. Must fetch armies via useDataContext().dataContext.armies.listByOwner(userId).
 * 3. Must provide duplicate and delete mutations with optimistic query invalidation.
 * 4. Must own filter state (ForgeFilters) and apply filtering/sorting before passing to view.
 * 5. Must manage delete confirmation via ConfirmDialog.
 * 6. Must navigate to the army editor on deploy (useRouter).
 * 7. Must hardcode English labels (no i18n infrastructure on mobile).
 * 8. Must not render UI directly — delegates to ArmyListView.
 * 9. Must display displayName in React DevTools.
 * 10. Must not use default exports.
 * 11. Must not create query factories — uses direct DAO access.
 */

import { useState, useCallback, useMemo } from 'react';
import * as React from 'react';

import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useDataContext } from '@/providers/DataContextProvider.js';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog.js';
import { ArmyListView } from '@/components/forge/ArmyListView.js';
import { DEFAULT_FORGE_FILTERS } from '@/components/forge/ArmyFilterPanel.js';
import type { ForgeFilters } from '@/components/forge/ArmyFilterPanel.js';
import type { Army } from '@armoury/wh40k10e';

/**
 * Props for the ForgeContainer component.
 */
export interface ForgeContainerProps {
    /** Auth0 subject identifier of the current user. */
    userId: string;
}

/**
 * Applies filter and sort criteria to an army list.
 *
 * @param armies - The full unfiltered army list.
 * @param filters - Active filter and sort state.
 * @returns A new array of armies matching the filters, sorted by the selected order.
 */
function applyFilters(armies: Army[], filters: ForgeFilters): Army[] {
    return armies
        .filter((army) => {
            if (filters.factionId && army.factionId !== filters.factionId) {
                return false;
            }

            if (filters.battleSize && army.battleSize !== filters.battleSize) {
                return false;
            }

            return true;
        })
        .sort((a, b) => {
            switch (filters.sortBy) {
                case 'newest':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'oldest':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'points':
                    return b.totalPoints - a.totalPoints;
                default:
                    return 0;
            }
        });
}

/**
 * Extracts unique faction IDs from an army list for use in filter dropdowns.
 *
 * @param armies - The full army list.
 * @returns A sorted array of unique faction ID strings.
 */
function extractFactionIds(armies: Army[]): string[] {
    return [...new Set(armies.map((a) => a.factionId))].sort();
}

/**
 * ForgeContainer — orchestrator for the Forge (army list) screen.
 *
 * Fetches armies from the DataContext, manages filter/sort state and mutations
 * (duplicate, delete), and delegates all rendering to ArmyListView.
 *
 * @param props - Component props containing the authenticated user's ID.
 * @returns The rendered Forge screen.
 */
function ForgeContainer({ userId }: ForgeContainerProps): React.ReactElement {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { dataContext, status: dcStatus } = useDataContext();

    const [filters, setFilters] = useState<ForgeFilters>(DEFAULT_FORGE_FILTERS);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

    const armiesQuery = useQuery<Army[]>({
        queryKey: ['armies', userId],
        queryFn: () => dataContext!.armies.listByOwner(userId) as Promise<Army[]>,
        enabled: dcStatus === 'ready' && !!dataContext,
    });

    const allArmies = armiesQuery.data ?? [];
    const filteredArmies = useMemo(() => applyFilters(allArmies, filters), [allArmies, filters]);
    const factionIds = useMemo(() => extractFactionIds(allArmies), [allArmies]);

    const duplicateMutation = useMutation({
        mutationFn: async (armyId: string) => {
            const original = (await dataContext!.armies.get(armyId)) as Army | null;

            if (!original) {
                throw new Error('Army not found');
            }

            const copy: Army = {
                ...original,
                id: crypto.randomUUID(),
                name: `${original.name} (Copy)`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            await dataContext!.armies.save(copy as never);

            return copy;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['armies'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (armyId: string) => dataContext!.armies.delete(armyId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['armies'] });
        },
    });

    const handleDeploy = useCallback(
        (armyId: string) => {
            router.push(`/(tabs)/armies/${armyId}` as never);
        },
        [router],
    );

    const handleDuplicate = useCallback(
        (armyId: string) => {
            duplicateMutation.mutate(armyId);
        },
        [duplicateMutation],
    );

    const handleDeleteRequest = useCallback(
        (armyId: string) => {
            const army = allArmies.find((a) => a.id === armyId);
            setDeleteTarget(army ? { id: army.id, name: army.name } : null);
        },
        [allArmies],
    );

    const handleDeleteConfirm = useCallback(() => {
        if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
            setDeleteTarget(null);
        }
    }, [deleteTarget, deleteMutation]);

    const isLoading = dcStatus !== 'ready' || armiesQuery.isLoading;

    return (
        <>
            <ArmyListView
                armies={filteredArmies}
                isLoading={isLoading}
                isEmpty={allArmies.length === 0}
                filters={filters}
                onFilterChange={setFilters}
                factionIds={factionIds}
                onDeploy={handleDeploy}
                onDuplicate={handleDuplicate}
                onDelete={handleDeleteRequest}
            />

            <ConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteTarget(null);
                    }
                }}
                title="Delete Army"
                description={`Are you sure you want to delete "${deleteTarget?.name ?? ''}"? This action cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={handleDeleteConfirm}
            />
        </>
    );
}

ForgeContainer.displayName = 'ForgeContainer';

export { ForgeContainer };
