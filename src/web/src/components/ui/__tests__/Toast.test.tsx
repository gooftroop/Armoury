/**
 * Toast component tests.
 *
 * @requirements
 * - REQ-TOAST-01: Renders toast title/description/actions in provider.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction } from '../toast.js';

describe('Toast', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders toast content and action handlers', async () => {
        const user = userEvent.setup();
        const onAction = vi.fn();

        render(
            <ToastProvider>
                <Toast defaultOpen={true}>
                    <ToastTitle>Saved</ToastTitle>
                    <ToastDescription>Army saved successfully.</ToastDescription>
                    <ToastAction altText="undo" onClick={onAction}>
                        Undo
                    </ToastAction>
                    <ToastClose aria-label="close" />
                </Toast>
                <ToastViewport />
            </ToastProvider>,
        );

        expect(screen.getByText('Saved')).toBeInTheDocument();
        expect(screen.getByText('Army saved successfully.')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Undo' }));
        expect(onAction).toHaveBeenCalledTimes(1);
    });
});
