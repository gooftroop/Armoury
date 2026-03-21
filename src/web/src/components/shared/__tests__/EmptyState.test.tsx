/**
 * EmptyState component tests.
 *
 * @requirements
 * - REQ-EMPTY-01: Renders icon, heading, description, and CTA action.
 * - REQ-EMPTY-02: Forwards interaction through CTA button.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EmptyState } from '../EmptyState.js';

describe('EmptyState', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders icon, heading, description, and action', () => {
        render(
            <EmptyState
                icon={<svg aria-label="state-icon" role="img" />}
                title="No armies yet"
                description="Create your first army to get started."
                action={<button type="button">Create Army</button>}
            />,
        );

        expect(screen.getByLabelText('state-icon')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'No armies yet' })).toBeInTheDocument();
        expect(screen.getByText('Create your first army to get started.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Create Army' })).toBeInTheDocument();
    });

    it('fires CTA button click', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();

        render(<EmptyState title="No armies" action={<button onClick={onClick} type="button">Create</button>} />);

        await user.click(screen.getByRole('button', { name: 'Create' }));

        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
