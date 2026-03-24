/**
 * ConfirmDialog component tests.
 *
 * @requirements
 * - REQ-CONFIRM-01: Renders title, description, and labels when open.
 * - REQ-CONFIRM-02: Hides content when closed and wires confirm/open-change callbacks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConfirmDialog } from '../ConfirmDialog.js';

describe('ConfirmDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders title, description, and labels when open', () => {
        render(
            <ConfirmDialog
                open={true}
                onOpenChange={vi.fn()}
                title="Delete Army"
                description="This action cannot be undone."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={vi.fn()}
            />,
        );

        expect(screen.getByText('Delete Army')).toBeInTheDocument();
        expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('does not render dialog body when closed', () => {
        render(
            <ConfirmDialog
                open={false}
                onOpenChange={vi.fn()}
                title="Delete Army"
                description="This action cannot be undone."
                onConfirm={vi.fn()}
            />,
        );

        expect(screen.queryByText('Delete Army')).not.toBeInTheDocument();
    });

    it('fires onConfirm and onOpenChange', async () => {
        const user = userEvent.setup();
        const onConfirm = vi.fn();
        const onOpenChange = vi.fn();

        render(
            <ConfirmDialog
                open={true}
                onOpenChange={onOpenChange}
                title="Delete Army"
                description="This action cannot be undone."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={onConfirm}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Delete' }));
        await user.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });
});
