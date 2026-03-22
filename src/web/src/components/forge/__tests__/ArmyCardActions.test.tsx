/**
 * ArmyCardActions component tests.
 *
 * @requirements
 * - REQ-ACTIONS-01: Renders deploy, duplicate, and delete buttons.
 * - REQ-ACTIONS-02: Fires corresponding callbacks on click.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ArmyCardActions } from '../ArmyCardActions.js';

vi.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

describe('ArmyCardActions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders all action buttons', () => {
        render(<ArmyCardActions onDeploy={vi.fn()} onDuplicate={vi.fn()} onDelete={vi.fn()} />);

        expect(screen.getByRole('button', { name: 'deploy' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'duplicate' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'delete' })).toBeInTheDocument();
    });

    it('fires deploy, duplicate, and delete callbacks', async () => {
        const user = userEvent.setup();
        const onDeploy = vi.fn();
        const onDuplicate = vi.fn();
        const onDelete = vi.fn();

        render(<ArmyCardActions onDeploy={onDeploy} onDuplicate={onDuplicate} onDelete={onDelete} />);

        await user.click(screen.getByRole('button', { name: 'deploy' }));
        await user.click(screen.getByRole('button', { name: 'duplicate' }));
        await user.click(screen.getByRole('button', { name: 'delete' }));

        expect(onDeploy).toHaveBeenCalledTimes(1);
        expect(onDuplicate).toHaveBeenCalledTimes(1);
        expect(onDelete).toHaveBeenCalledTimes(1);
    });
});
