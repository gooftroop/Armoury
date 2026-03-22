/**
 * ArmyCard component tests.
 *
 * @requirements
 * - REQ-CARD-01: Renders army core metadata.
 * - REQ-CARD-02: Fires action callbacks from card actions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ArmyCard } from '../ArmyCard.js';
import { makeArmy } from './fixtures.js';

vi.mock('next-intl', () => ({
    useTranslations:
        () => (key: string, values?: { count?: number; current?: number; limit?: number; date?: string }) => {
            if (key === 'units') {
                return `Units: ${values?.count ?? 0}`;
            }

            if (key === 'points') {
                return `Points: ${values?.current ?? 0}/${values?.limit ?? 0}`;
            }

            if (key === 'lastModified') {
                return `Last modified: ${values?.date ?? ''}`;
            }

            return key;
        },
}));

describe('ArmyCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders army name, battle size, points, and date metadata', () => {
        render(
            <ArmyCard
                army={makeArmy({
                    name: 'Iron Hands Spearhead',
                    factionId: 'space-marines',
                    battleSize: 'Incursion',
                    totalPoints: 975,
                    pointsLimit: 1000,
                    units: [],
                    updatedAt: '2026-03-10T00:00:00.000Z',
                })}
                onDeploy={vi.fn()}
                onDuplicate={vi.fn()}
                onDelete={vi.fn()}
            />,
        );

        expect(screen.getByText('Iron Hands Spearhead')).toBeInTheDocument();
        expect(screen.getByText('Incursion')).toBeInTheDocument();
        expect(screen.getByText('Units: 0')).toBeInTheDocument();
        expect(screen.getByText('Points: 975/1000')).toBeInTheDocument();
        expect(screen.getByText(/Last modified:/)).toBeInTheDocument();
    });

    it('fires onDeploy, onDuplicate, and onDelete callbacks', async () => {
        const user = userEvent.setup();
        const onDeploy = vi.fn();
        const onDuplicate = vi.fn();
        const onDelete = vi.fn();

        render(<ArmyCard army={makeArmy()} onDeploy={onDeploy} onDuplicate={onDuplicate} onDelete={onDelete} />);

        await user.click(screen.getByRole('button', { name: 'deploy' }));
        await user.click(screen.getByRole('button', { name: 'duplicate' }));
        await user.click(screen.getByRole('button', { name: 'delete' }));

        expect(onDeploy).toHaveBeenCalledTimes(1);
        expect(onDuplicate).toHaveBeenCalledTimes(1);
        expect(onDelete).toHaveBeenCalledTimes(1);
    });
});
