/**
 * AlertDialog component tests.
 *
 * @requirements
 * - REQ-ALERT-01: Renders title/description/actions for destructive confirmations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
} from '../AlertDialog.js';

describe('AlertDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders open state and action buttons', async () => {
        const user = userEvent.setup();
        const onAction = vi.fn();

        render(
            <AlertDialog>
                <AlertDialogTrigger asChild={true}>
                    <button type="button">Open Alert</button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogTitle>Delete Army</AlertDialogTitle>
                    <AlertDialogDescription>Permanent action.</AlertDialogDescription>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onAction}>Delete</AlertDialogAction>
                </AlertDialogContent>
            </AlertDialog>,
        );

        await user.click(screen.getByRole('button', { name: 'Open Alert' }));
        expect(screen.getByText('Delete Army')).toBeInTheDocument();
        expect(screen.getByText('Permanent action.')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Delete' }));
        expect(onAction).toHaveBeenCalledTimes(1);
    });
});
