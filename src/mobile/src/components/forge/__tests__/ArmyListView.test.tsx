/**
 * ArmyListView component tests.
 *
 * @requirements
 * - REQ-FORGE-VIEW-01: Renders page title "The Forge".
 * - REQ-FORGE-VIEW-02: Renders subtitle "Manage your army rosters".
 * - REQ-FORGE-VIEW-03: Shows skeleton cards during loading.
 * - REQ-FORGE-VIEW-04: Shows EmptyState when no armies exist.
 * - REQ-FORGE-VIEW-05: Shows "No armies match your filters" when filters produce zero results.
 * - REQ-FORGE-VIEW-06: Renders ArmyFilterPanel when armies exist.
 * - REQ-FORGE-VIEW-07: Renders ArmyCard for each army.
 * - REQ-FORGE-VIEW-08: Propagates onDeploy callback with correct armyId.
 * - REQ-FORGE-VIEW-09: Propagates onDuplicate callback with correct armyId.
 * - REQ-FORGE-VIEW-10: Propagates onDelete callback with correct armyId.
 * - REQ-FORGE-VIEW-11: Does not render filter panel or cards during loading.
 *
 * Test plan:
 * - renders title → REQ-FORGE-VIEW-01
 * - renders subtitle → REQ-FORGE-VIEW-02
 * - loading shows skeletons → REQ-FORGE-VIEW-03
 * - empty shows EmptyState → REQ-FORGE-VIEW-04
 * - no-results shows filter message → REQ-FORGE-VIEW-05
 * - renders filter panel → REQ-FORGE-VIEW-06
 * - renders army cards → REQ-FORGE-VIEW-07
 * - onDeploy fires with armyId → REQ-FORGE-VIEW-08
 * - onDuplicate fires with armyId → REQ-FORGE-VIEW-09
 * - onDelete fires with armyId → REQ-FORGE-VIEW-10
 * - loading hides filter panel → REQ-FORGE-VIEW-11
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Army } from '@armoury/wh40k10e';

import { ArmyListView } from '../ArmyListView.js';
import { DEFAULT_FORGE_FILTERS } from '../ArmyFilterPanel.js';
import type { ArmyListViewProps } from '../ArmyListView.js';

/**
 * Creates a mock Army object with sensible defaults.
 *
 * @param overrides - Partial Army fields to override defaults.
 * @returns A complete Army object.
 */
function mockArmy(overrides?: Partial<Army>): Army {
    return {
        id: 'army-1',
        ownerId: 'test-user',
        name: 'Test Army',
        factionId: 'space-marines',
        detachmentId: null,
        warlordUnitId: null,
        battleSize: 'StrikeForce',
        pointsLimit: 2000,
        units: [],
        totalPoints: 1850,
        notes: '',
        versions: [],
        currentVersion: 0,
        createdAt: '2026-01-15T10:00:00.000Z',
        updatedAt: '2026-01-15T10:00:00.000Z',
        ...overrides,
    };
}

/**
 * Creates default props for ArmyListView with sensible defaults.
 *
 * @param overrides - Partial props to override defaults.
 * @returns Complete ArmyListViewProps.
 */
function defaultProps(overrides?: Partial<ArmyListViewProps>): ArmyListViewProps {
    return {
        armies: [],
        isLoading: false,
        isEmpty: true,
        filters: { ...DEFAULT_FORGE_FILTERS },
        onFilterChange: vi.fn(),
        factionIds: [],
        onDeploy: vi.fn(),
        onDuplicate: vi.fn(),
        onDelete: vi.fn(),
        ...overrides,
    };
}

describe('ArmyListView', () => {
    it('renders the page title "The Forge"', () => {
        render(<ArmyListView {...defaultProps()} />);

        expect(screen.getByText('The Forge')).toBeTruthy();
    });

    it('renders the subtitle "Manage your army rosters"', () => {
        render(<ArmyListView {...defaultProps()} />);

        expect(screen.getByText('Manage your army rosters')).toBeTruthy();
    });

    it('shows skeleton cards during loading', () => {
        render(<ArmyListView {...defaultProps({ isLoading: true })} />);

        const cards = screen.getAllByTestId('Card');
        expect(cards).toHaveLength(4);
    });

    it('does not render filter panel or army cards during loading', () => {
        render(<ArmyListView {...defaultProps({ isLoading: true })} />);

        expect(screen.queryByText('Filters ▼')).toBeNull();
    });

    it('shows EmptyState when no armies exist', () => {
        render(<ArmyListView {...defaultProps({ isLoading: false, isEmpty: true })} />);

        expect(screen.getByText('No armies yet')).toBeTruthy();
        expect(screen.getByText('Create your first army to get started with The Forge.')).toBeTruthy();
    });

    it('shows "No armies match your filters" when filters produce zero results', () => {
        render(
            <ArmyListView
                {...defaultProps({
                    isLoading: false,
                    isEmpty: false,
                    armies: [],
                    factionIds: ['space-marines'],
                })}
            />,
        );

        expect(screen.getByText('No armies match your filters.')).toBeTruthy();
    });

    it('renders ArmyFilterPanel when armies exist', () => {
        const armies = [mockArmy({ id: 'a1' }), mockArmy({ id: 'a2' })];
        render(
            <ArmyListView
                {...defaultProps({
                    isLoading: false,
                    isEmpty: false,
                    armies,
                    factionIds: ['space-marines'],
                })}
            />,
        );

        expect(screen.getByText('Filters ▼')).toBeTruthy();
    });

    it('renders an ArmyCard for each army', () => {
        const armies = [mockArmy({ id: 'a1', name: 'Alpha Legion' }), mockArmy({ id: 'a2', name: 'Blood Angels' })];
        render(
            <ArmyListView
                {...defaultProps({
                    isLoading: false,
                    isEmpty: false,
                    armies,
                    factionIds: ['space-marines'],
                })}
            />,
        );

        expect(screen.getByText('Alpha Legion')).toBeTruthy();
        expect(screen.getByText('Blood Angels')).toBeTruthy();
    });

    it('propagates onDeploy callback with correct armyId', () => {
        const onDeploy = vi.fn();
        const armies = [mockArmy({ id: 'army-42', name: 'Deploy Target' })];
        render(
            <ArmyListView
                {...defaultProps({
                    isLoading: false,
                    isEmpty: false,
                    armies,
                    factionIds: ['space-marines'],
                    onDeploy,
                })}
            />,
        );

        fireEvent.click(screen.getByText('Deploy'));
        expect(onDeploy).toHaveBeenCalledWith('army-42');
    });

    it('propagates onDuplicate callback with correct armyId', () => {
        const onDuplicate = vi.fn();
        const armies = [mockArmy({ id: 'army-42', name: 'Dup Target' })];
        render(
            <ArmyListView
                {...defaultProps({
                    isLoading: false,
                    isEmpty: false,
                    armies,
                    factionIds: ['space-marines'],
                    onDuplicate,
                })}
            />,
        );

        fireEvent.click(screen.getByText('Duplicate'));
        expect(onDuplicate).toHaveBeenCalledWith('army-42');
    });

    it('propagates onDelete callback with correct armyId', () => {
        const onDelete = vi.fn();
        const armies = [mockArmy({ id: 'army-42', name: 'Del Target' })];
        render(
            <ArmyListView
                {...defaultProps({
                    isLoading: false,
                    isEmpty: false,
                    armies,
                    factionIds: ['space-marines'],
                    onDelete,
                })}
            />,
        );

        fireEvent.click(screen.getByText('Delete'));
        expect(onDelete).toHaveBeenCalledWith('army-42');
    });
});
