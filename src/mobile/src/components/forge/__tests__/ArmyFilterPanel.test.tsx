/**
 * ArmyFilterPanel component tests.
 *
 * @requirements
 * - REQ-FORGE-FILTER-PANEL-01: Renders collapsed by default with "Filters ▼" toggle.
 * - REQ-FORGE-FILTER-PANEL-02: Expands to show filter sections on toggle press.
 * - REQ-FORGE-FILTER-PANEL-03: Renders faction chips when factionIds are provided.
 * - REQ-FORGE-FILTER-PANEL-04: Renders battle size chips (Incursion, StrikeForce, Onslaught).
 * - REQ-FORGE-FILTER-PANEL-05: Renders sort chips (Newest, Oldest, Name, Points).
 * - REQ-FORGE-FILTER-PANEL-06: Fires onChange with updated factionId when faction chip pressed.
 * - REQ-FORGE-FILTER-PANEL-07: Fires onChange with updated battleSize when battle size chip pressed.
 * - REQ-FORGE-FILTER-PANEL-08: Fires onChange with updated sortBy when sort chip pressed.
 * - REQ-FORGE-FILTER-PANEL-09: Clears all filters to defaults on "Clear" press.
 * - REQ-FORGE-FILTER-PANEL-10: Shows "Clear" button only when filters are active.
 * - REQ-FORGE-FILTER-PANEL-11: Hides faction section when factionIds is empty.
 * - REQ-FORGE-FILTER-PANEL-12: Toggle deselects faction chip (sets to null) when same chip pressed.
 *
 * Test plan:
 * - starts collapsed → REQ-FORGE-FILTER-PANEL-01
 * - expands on toggle → REQ-FORGE-FILTER-PANEL-02
 * - renders faction chips → REQ-FORGE-FILTER-PANEL-03
 * - renders battle size chips → REQ-FORGE-FILTER-PANEL-04
 * - renders sort chips → REQ-FORGE-FILTER-PANEL-05
 * - faction chip fires onChange → REQ-FORGE-FILTER-PANEL-06
 * - battle size chip fires onChange → REQ-FORGE-FILTER-PANEL-07
 * - sort chip fires onChange → REQ-FORGE-FILTER-PANEL-08
 * - clear resets filters → REQ-FORGE-FILTER-PANEL-09
 * - clear button hidden when no filters → REQ-FORGE-FILTER-PANEL-10
 * - no faction section when empty → REQ-FORGE-FILTER-PANEL-11
 * - toggle off faction → REQ-FORGE-FILTER-PANEL-12
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ArmyFilterPanel, DEFAULT_FORGE_FILTERS } from '../ArmyFilterPanel.js';
import type { ForgeFilters } from '../ArmyFilterPanel.js';

describe('ArmyFilterPanel', () => {
    const defaultProps = {
        filters: { ...DEFAULT_FORGE_FILTERS },
        onChange: vi.fn(),
        factionIds: ['aeldari', 'necrons', 'space-marines'],
    };

    it('starts collapsed showing "Filters ▼" toggle', () => {
        render(<ArmyFilterPanel {...defaultProps} />);

        expect(screen.getByText('Filters ▼')).toBeTruthy();
        expect(screen.queryByText('Faction')).toBeNull();
        expect(screen.queryByText('Battle Size')).toBeNull();
        expect(screen.queryByText('Sort By')).toBeNull();
    });

    it('expands to show filter sections on toggle press', () => {
        render(<ArmyFilterPanel {...defaultProps} />);

        fireEvent.click(screen.getByText('Filters ▼'));

        expect(screen.getByText('Hide Filters ▲')).toBeTruthy();
        expect(screen.getByText('Faction')).toBeTruthy();
        expect(screen.getByText('Battle Size')).toBeTruthy();
        expect(screen.getByText('Sort By')).toBeTruthy();
    });

    it('renders faction chips including "All" when expanded', () => {
        render(<ArmyFilterPanel {...defaultProps} />);
        fireEvent.click(screen.getByText('Filters ▼'));

        expect(screen.getAllByText('All').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('aeldari')).toBeTruthy();
        expect(screen.getByText('necrons')).toBeTruthy();
        expect(screen.getByText('space-marines')).toBeTruthy();
    });

    it('renders battle size chips when expanded', () => {
        render(<ArmyFilterPanel {...defaultProps} />);
        fireEvent.click(screen.getByText('Filters ▼'));

        expect(screen.getByText('Incursion')).toBeTruthy();
        expect(screen.getByText('StrikeForce')).toBeTruthy();
        expect(screen.getByText('Onslaught')).toBeTruthy();
    });

    it('renders sort chips when expanded', () => {
        render(<ArmyFilterPanel {...defaultProps} />);
        fireEvent.click(screen.getByText('Filters ▼'));

        expect(screen.getByText('Newest')).toBeTruthy();
        expect(screen.getByText('Oldest')).toBeTruthy();
        expect(screen.getByText('Name')).toBeTruthy();
        expect(screen.getByText('Points')).toBeTruthy();
    });

    it('fires onChange with updated factionId when faction chip is pressed', () => {
        const onChange = vi.fn();
        render(<ArmyFilterPanel {...defaultProps} onChange={onChange} />);
        fireEvent.click(screen.getByText('Filters ▼'));

        fireEvent.click(screen.getByText('necrons'));

        expect(onChange).toHaveBeenCalledWith({
            ...DEFAULT_FORGE_FILTERS,
            factionId: 'necrons',
        });
    });

    it('fires onChange with updated battleSize when battle size chip is pressed', () => {
        const onChange = vi.fn();
        render(<ArmyFilterPanel {...defaultProps} onChange={onChange} />);
        fireEvent.click(screen.getByText('Filters ▼'));

        fireEvent.click(screen.getByText('Incursion'));

        expect(onChange).toHaveBeenCalledWith({
            ...DEFAULT_FORGE_FILTERS,
            battleSize: 'Incursion',
        });
    });

    it('fires onChange with updated sortBy when sort chip is pressed', () => {
        const onChange = vi.fn();
        render(<ArmyFilterPanel {...defaultProps} onChange={onChange} />);
        fireEvent.click(screen.getByText('Filters ▼'));

        fireEvent.click(screen.getByText('Name'));

        expect(onChange).toHaveBeenCalledWith({
            ...DEFAULT_FORGE_FILTERS,
            sortBy: 'name',
        });
    });

    it('resets all filters to defaults when "Clear" is pressed', () => {
        const onChange = vi.fn();
        const activeFilters: ForgeFilters = {
            factionId: 'necrons',
            battleSize: 'StrikeForce',
            sortBy: 'name',
        };
        render(<ArmyFilterPanel {...defaultProps} filters={activeFilters} onChange={onChange} />);

        fireEvent.click(screen.getByText('Clear'));

        expect(onChange).toHaveBeenCalledWith(DEFAULT_FORGE_FILTERS);
    });

    it('hides "Clear" button when no filters are active', () => {
        render(<ArmyFilterPanel {...defaultProps} filters={DEFAULT_FORGE_FILTERS} />);

        expect(screen.queryByText('Clear')).toBeNull();
    });

    it('hides faction section when factionIds is empty', () => {
        render(<ArmyFilterPanel {...defaultProps} factionIds={[]} />);
        fireEvent.click(screen.getByText('Filters ▼'));

        expect(screen.queryByText('Faction')).toBeNull();
        expect(screen.getByText('Battle Size')).toBeTruthy();
        expect(screen.getByText('Sort By')).toBeTruthy();
    });

    it('toggles faction chip off (sets to null) when same faction pressed again', () => {
        const onChange = vi.fn();
        const activeFilters: ForgeFilters = {
            factionId: 'necrons',
            battleSize: null,
            sortBy: 'newest',
        };
        render(<ArmyFilterPanel {...defaultProps} filters={activeFilters} onChange={onChange} />);
        fireEvent.click(screen.getByText('Filters ▼'));

        fireEvent.click(screen.getByText('necrons'));

        expect(onChange).toHaveBeenCalledWith({
            ...activeFilters,
            factionId: null,
        });
    });
});
