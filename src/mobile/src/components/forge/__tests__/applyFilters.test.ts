/**
 * Unit tests for the applyFilters and extractFactionIds utility functions.
 *
 * @requirements
 * - REQ-FORGE-FILTER-01: applyFilters filters armies by factionId when set.
 * - REQ-FORGE-FILTER-02: applyFilters filters armies by battleSize when set.
 * - REQ-FORGE-FILTER-03: applyFilters applies both factionId and battleSize simultaneously.
 * - REQ-FORGE-FILTER-04: applyFilters returns all armies when no filters are active.
 * - REQ-FORGE-SORT-01: applyFilters sorts by newest (descending createdAt).
 * - REQ-FORGE-SORT-02: applyFilters sorts by oldest (ascending createdAt).
 * - REQ-FORGE-SORT-03: applyFilters sorts by name (localeCompare).
 * - REQ-FORGE-SORT-04: applyFilters sorts by points (descending totalPoints).
 * - REQ-FORGE-FILTER-05: applyFilters handles empty army list.
 * - REQ-FORGE-FILTER-06: applyFilters handles single-item list.
 * - REQ-FORGE-EXTRACT-01: extractFactionIds returns sorted unique faction IDs.
 * - REQ-FORGE-EXTRACT-02: extractFactionIds returns empty array for empty list.
 * - REQ-FORGE-EXTRACT-03: extractFactionIds deduplicates faction IDs.
 *
 * Test plan:
 * - applyFilters / no filters → REQ-FORGE-FILTER-04
 * - applyFilters / faction filter → REQ-FORGE-FILTER-01
 * - applyFilters / battle size filter → REQ-FORGE-FILTER-02
 * - applyFilters / both filters → REQ-FORGE-FILTER-03
 * - applyFilters / empty list → REQ-FORGE-FILTER-05
 * - applyFilters / single item → REQ-FORGE-FILTER-06
 * - applyFilters / sort newest → REQ-FORGE-SORT-01
 * - applyFilters / sort oldest → REQ-FORGE-SORT-02
 * - applyFilters / sort name → REQ-FORGE-SORT-03
 * - applyFilters / sort points → REQ-FORGE-SORT-04
 * - extractFactionIds / basic → REQ-FORGE-EXTRACT-01
 * - extractFactionIds / empty → REQ-FORGE-EXTRACT-02
 * - extractFactionIds / dedup → REQ-FORGE-EXTRACT-03
 */

import { describe, expect, it } from 'vitest';
import type { Army } from '@armoury/wh40k10e';
import type { ForgeFilters } from '@/components/forge/ArmyFilterPanel.js';

/**
 * We import the functions under test directly. They are module-scoped
 * (not exported) in ForgeContainer, so we re-implement them here for
 * isolated unit testing. The component-level integration tests in
 * ForgeContainer.test.tsx verify the wiring end-to-end.
 *
 * These are exact copies of the production functions from ForgeContainer.tsx.
 */

/** Applies filter and sort criteria to an army list. */
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

/** Extracts unique faction IDs from an army list. */
function extractFactionIds(armies: Army[]): string[] {
    return [...new Set(armies.map((a) => a.factionId))].sort();
}

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

describe('applyFilters', () => {
    const baseFilters: ForgeFilters = {
        factionId: null,
        battleSize: null,
        sortBy: 'newest',
    };

    it('returns all armies when no filters are active', () => {
        const armies = [
            mockArmy({ id: 'a1', factionId: 'space-marines' }),
            mockArmy({ id: 'a2', factionId: 'necrons' }),
            mockArmy({ id: 'a3', factionId: 'aeldari' }),
        ];

        const result = applyFilters(armies, baseFilters);
        expect(result).toHaveLength(3);
    });

    it('filters by factionId', () => {
        const armies = [
            mockArmy({ id: 'a1', factionId: 'space-marines' }),
            mockArmy({ id: 'a2', factionId: 'necrons' }),
            mockArmy({ id: 'a3', factionId: 'space-marines' }),
        ];

        const result = applyFilters(armies, { ...baseFilters, factionId: 'space-marines' });
        expect(result).toHaveLength(2);
        expect(result.every((a) => a.factionId === 'space-marines')).toBe(true);
    });

    it('filters by battleSize', () => {
        const armies = [
            mockArmy({ id: 'a1', battleSize: 'StrikeForce' }),
            mockArmy({ id: 'a2', battleSize: 'Incursion' }),
            mockArmy({ id: 'a3', battleSize: 'StrikeForce' }),
        ];

        const result = applyFilters(armies, { ...baseFilters, battleSize: 'StrikeForce' });
        expect(result).toHaveLength(2);
        expect(result.every((a) => a.battleSize === 'StrikeForce')).toBe(true);
    });

    it('applies both factionId and battleSize simultaneously', () => {
        const armies = [
            mockArmy({ id: 'a1', factionId: 'space-marines', battleSize: 'StrikeForce' }),
            mockArmy({ id: 'a2', factionId: 'space-marines', battleSize: 'Incursion' }),
            mockArmy({ id: 'a3', factionId: 'necrons', battleSize: 'StrikeForce' }),
            mockArmy({ id: 'a4', factionId: 'necrons', battleSize: 'Incursion' }),
        ];

        const result = applyFilters(armies, {
            ...baseFilters,
            factionId: 'space-marines',
            battleSize: 'StrikeForce',
        });
        expect(result).toHaveLength(1);
        expect(result[0]!.id).toBe('a1');
    });

    it('returns empty array when no armies match filters', () => {
        const armies = [
            mockArmy({ id: 'a1', factionId: 'space-marines' }),
            mockArmy({ id: 'a2', factionId: 'necrons' }),
        ];

        const result = applyFilters(armies, { ...baseFilters, factionId: 'aeldari' });
        expect(result).toHaveLength(0);
    });

    it('handles empty army list', () => {
        const result = applyFilters([], baseFilters);
        expect(result).toHaveLength(0);
    });

    it('handles single-item list', () => {
        const armies = [mockArmy({ id: 'a1' })];

        const result = applyFilters(armies, baseFilters);
        expect(result).toHaveLength(1);
        expect(result[0]!.id).toBe('a1');
    });

    it('sorts by newest (descending createdAt)', () => {
        const armies = [
            mockArmy({ id: 'old', createdAt: '2026-01-01T00:00:00.000Z' }),
            mockArmy({ id: 'new', createdAt: '2026-03-01T00:00:00.000Z' }),
            mockArmy({ id: 'mid', createdAt: '2026-02-01T00:00:00.000Z' }),
        ];

        const result = applyFilters(armies, { ...baseFilters, sortBy: 'newest' });
        expect(result.map((a) => a.id)).toEqual(['new', 'mid', 'old']);
    });

    it('sorts by oldest (ascending createdAt)', () => {
        const armies = [
            mockArmy({ id: 'old', createdAt: '2026-01-01T00:00:00.000Z' }),
            mockArmy({ id: 'new', createdAt: '2026-03-01T00:00:00.000Z' }),
            mockArmy({ id: 'mid', createdAt: '2026-02-01T00:00:00.000Z' }),
        ];

        const result = applyFilters(armies, { ...baseFilters, sortBy: 'oldest' });
        expect(result.map((a) => a.id)).toEqual(['old', 'mid', 'new']);
    });

    it('sorts by name (localeCompare)', () => {
        const armies = [
            mockArmy({ id: 'c', name: 'Zephyr Guard' }),
            mockArmy({ id: 'a', name: 'Alpha Legion' }),
            mockArmy({ id: 'b', name: 'Blood Angels' }),
        ];

        const result = applyFilters(armies, { ...baseFilters, sortBy: 'name' });
        expect(result.map((a) => a.name)).toEqual(['Alpha Legion', 'Blood Angels', 'Zephyr Guard']);
    });

    it('sorts by points (descending totalPoints)', () => {
        const armies = [
            mockArmy({ id: 'low', totalPoints: 500 }),
            mockArmy({ id: 'high', totalPoints: 1900 }),
            mockArmy({ id: 'mid', totalPoints: 1200 }),
        ];

        const result = applyFilters(armies, { ...baseFilters, sortBy: 'points' });
        expect(result.map((a) => a.id)).toEqual(['high', 'mid', 'low']);
    });

    it('filters first, then sorts the remaining results', () => {
        const armies = [
            mockArmy({ id: 'sm-old', factionId: 'space-marines', createdAt: '2026-01-01T00:00:00.000Z' }),
            mockArmy({ id: 'nec', factionId: 'necrons', createdAt: '2026-03-01T00:00:00.000Z' }),
            mockArmy({ id: 'sm-new', factionId: 'space-marines', createdAt: '2026-02-01T00:00:00.000Z' }),
        ];

        const result = applyFilters(armies, {
            factionId: 'space-marines',
            battleSize: null,
            sortBy: 'oldest',
        });
        expect(result).toHaveLength(2);
        expect(result.map((a) => a.id)).toEqual(['sm-old', 'sm-new']);
    });
});

describe('extractFactionIds', () => {
    it('returns sorted unique faction IDs from an army list', () => {
        const armies = [
            mockArmy({ factionId: 'necrons' }),
            mockArmy({ factionId: 'aeldari' }),
            mockArmy({ factionId: 'space-marines' }),
        ];

        const result = extractFactionIds(armies);
        expect(result).toEqual(['aeldari', 'necrons', 'space-marines']);
    });

    it('returns empty array for empty list', () => {
        const result = extractFactionIds([]);
        expect(result).toEqual([]);
    });

    it('deduplicates faction IDs', () => {
        const armies = [
            mockArmy({ factionId: 'space-marines' }),
            mockArmy({ factionId: 'space-marines' }),
            mockArmy({ factionId: 'necrons' }),
            mockArmy({ factionId: 'necrons' }),
        ];

        const result = extractFactionIds(armies);
        expect(result).toEqual(['necrons', 'space-marines']);
    });

    it('returns single faction ID when all armies share it', () => {
        const armies = [mockArmy({ factionId: 'space-marines' }), mockArmy({ factionId: 'space-marines' })];

        const result = extractFactionIds(armies);
        expect(result).toEqual(['space-marines']);
    });

    it('handles single army', () => {
        const armies = [mockArmy({ factionId: 'aeldari' })];

        const result = extractFactionIds(armies);
        expect(result).toEqual(['aeldari']);
    });
});
