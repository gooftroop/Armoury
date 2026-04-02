/**
 * Dialog component tests.
 *
 * @requirements
 * - REQ-DIALOG-01: Renders trigger/content and supports open/close interactions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '../dialog.js';

describe('Dialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('opens content from trigger and shows title/description', async () => {
        const user = userEvent.setup();

        render(
            <Dialog>
                <DialogTrigger asChild={true}>
                    <button type="button">Open Dialog</button>
                </DialogTrigger>
                <DialogContent>
                    <DialogTitle>Dialog Title</DialogTitle>
                    <DialogDescription>Dialog Description</DialogDescription>
                </DialogContent>
            </Dialog>,
        );

        await user.click(screen.getByRole('button', { name: 'Open Dialog' }));

        expect(screen.getByText('Dialog Title')).toBeInTheDocument();
        expect(screen.getByText('Dialog Description')).toBeInTheDocument();
    });
});
