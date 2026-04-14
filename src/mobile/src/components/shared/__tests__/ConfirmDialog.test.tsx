/**
 * ConfirmDialog component tests.
 *
 * @requirements
 * - REQ-SHARED-DIALOG-01: Renders title, description, confirm and cancel buttons when open.
 * - REQ-SHARED-DIALOG-02: Does not render content when closed (open=false).
 * - REQ-SHARED-DIALOG-03: Confirm button fires onConfirm callback.
 * - REQ-SHARED-DIALOG-04: Uses custom confirmLabel and cancelLabel.
 * - REQ-SHARED-DIALOG-05: Defaults to "Confirm" and "Cancel" labels.
 *
 * Test plan:
 * - renders when open → REQ-SHARED-DIALOG-01
 * - hidden when closed → REQ-SHARED-DIALOG-02
 * - confirm fires callback → REQ-SHARED-DIALOG-03
 * - custom labels → REQ-SHARED-DIALOG-04
 * - default labels → REQ-SHARED-DIALOG-05
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmDialog } from '../ConfirmDialog.js';

describe('ConfirmDialog', () => {
    const baseProps = {
        open: true,
        onOpenChange: vi.fn(),
        title: 'Delete Army',
        description: 'Are you sure you want to delete this army?',
        onConfirm: vi.fn(),
    };

    it('renders title, description, and buttons when open', () => {
        render(<ConfirmDialog {...baseProps} confirmLabel="Delete" cancelLabel="Cancel" />);

        expect(screen.getByText('Delete Army')).toBeTruthy();
        expect(screen.getByText('Are you sure you want to delete this army?')).toBeTruthy();
        expect(screen.getByText('Delete')).toBeTruthy();
        expect(screen.getByText('Cancel')).toBeTruthy();
    });

    it('does not render content when closed', () => {
        render(<ConfirmDialog {...baseProps} open={false} />);

        expect(screen.queryByText('Delete Army')).toBeNull();
    });

    it('fires onConfirm when the confirm button is pressed', () => {
        const onConfirm = vi.fn();
        render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} confirmLabel="Delete" />);

        fireEvent.click(screen.getByText('Delete'));
        expect(onConfirm).toHaveBeenCalledOnce();
    });

    it('renders custom confirmLabel and cancelLabel', () => {
        render(<ConfirmDialog {...baseProps} confirmLabel="Yes, delete" cancelLabel="No, keep it" />);

        expect(screen.getByText('Yes, delete')).toBeTruthy();
        expect(screen.getByText('No, keep it')).toBeTruthy();
    });

    it('defaults to "Confirm" and "Cancel" labels when not specified', () => {
        render(<ConfirmDialog {...baseProps} />);

        expect(screen.getByText('Confirm')).toBeTruthy();
        expect(screen.getByText('Cancel')).toBeTruthy();
    });
});
