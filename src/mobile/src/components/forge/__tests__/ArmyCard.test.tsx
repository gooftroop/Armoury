/**
 * ArmyCard component tests.
 *
 * @requirements
 * - REQ-FORGE-CARD-01: Renders army name.
 * - REQ-FORGE-CARD-02: Renders battle size badge.
 * - REQ-FORGE-CARD-03: Renders unit count with correct singular/plural label.
 * - REQ-FORGE-CARD-04: Renders points display (totalPoints / pointsLimit pts).
 * - REQ-FORGE-CARD-05: Renders last-modified date in human-readable format.
 * - REQ-FORGE-CARD-06: Renders ArmyCardActions with forwarded callbacks.
 * - REQ-FORGE-CARD-07: Handles army with zero units (singular "unit" label not used).
 * - REQ-FORGE-CARD-08: Handles army with exactly one unit (singular "unit" label).
 *
 * Test plan:
 * - renders army name → REQ-FORGE-CARD-01
 * - renders battle size badge → REQ-FORGE-CARD-02
 * - renders plural unit count → REQ-FORGE-CARD-03
 * - renders points display → REQ-FORGE-CARD-04
 * - renders last-modified date → REQ-FORGE-CARD-05
 * - action callbacks wired through → REQ-FORGE-CARD-06
 * - zero units shows "0 units" → REQ-FORGE-CARD-07
 * - one unit shows "1 unit" → REQ-FORGE-CARD-08
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Army } from '@armoury/wh40k10e';

import { ArmyCard } from '../ArmyCard.js';

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
        updatedAt: '2026-03-12T14:30:00.000Z',
        ...overrides,
    };
}

describe('ArmyCard', () => {
    const defaultCallbacks = {
        onDeploy: vi.fn(),
        onDuplicate: vi.fn(),
        onDelete: vi.fn(),
    };

    it('renders the army name', () => {
        const army = mockArmy({ name: 'Ultramarines Strike Force' });
        render(<ArmyCard army={army} {...defaultCallbacks} />);

        expect(screen.getByText('Ultramarines Strike Force')).toBeTruthy();
    });

    it('renders the battle size badge', () => {
        const army = mockArmy({ battleSize: 'Onslaught' });
        render(<ArmyCard army={army} {...defaultCallbacks} />);

        expect(screen.getByText('Onslaught')).toBeTruthy();
    });

    it('renders plural unit count for multiple units', () => {
        const army = mockArmy({
            units: [
                { id: 'u1' } as Army['units'][number],
                { id: 'u2' } as Army['units'][number],
                { id: 'u3' } as Army['units'][number],
            ],
        });
        render(<ArmyCard army={army} {...defaultCallbacks} />);

        expect(screen.getByText('3 units')).toBeTruthy();
    });

    it('renders the points display', () => {
        const army = mockArmy({ totalPoints: 1850, pointsLimit: 2000 });
        render(<ArmyCard army={army} {...defaultCallbacks} />);

        expect(screen.getByText('1850 / 2000 pts')).toBeTruthy();
    });

    it('renders the last-modified date', () => {
        const army = mockArmy({ updatedAt: '2026-03-12T14:30:00.000Z' });
        render(<ArmyCard army={army} {...defaultCallbacks} />);

        const dateElements = screen.getAllByText(/Last modified/);
        expect(dateElements.length).toBeGreaterThan(0);
    });

    it('forwards action callbacks to ArmyCardActions', () => {
        const onDeploy = vi.fn();
        const onDuplicate = vi.fn();
        const onDelete = vi.fn();
        const army = mockArmy();

        render(<ArmyCard army={army} onDeploy={onDeploy} onDuplicate={onDuplicate} onDelete={onDelete} />);

        fireEvent.click(screen.getByText('Deploy'));
        expect(onDeploy).toHaveBeenCalledOnce();

        fireEvent.click(screen.getByText('Duplicate'));
        expect(onDuplicate).toHaveBeenCalledOnce();

        fireEvent.click(screen.getByText('Delete'));
        expect(onDelete).toHaveBeenCalledOnce();
    });

    it('renders "0 units" for an army with no units', () => {
        const army = mockArmy({ units: [] });
        render(<ArmyCard army={army} {...defaultCallbacks} />);

        expect(screen.getByText('0 units')).toBeTruthy();
    });

    it('renders "1 unit" for an army with exactly one unit', () => {
        const army = mockArmy({
            units: [{ id: 'u1' } as Army['units'][number]],
        });
        render(<ArmyCard army={army} {...defaultCallbacks} />);

        expect(screen.getByText('1 unit')).toBeTruthy();
    });
});
