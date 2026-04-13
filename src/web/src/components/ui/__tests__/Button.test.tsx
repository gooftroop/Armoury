/**
 * Button component tests.
 *
 * @requirements
 * - REQ-BTN-01: Renders variants and handles interaction/disabled states.
 * - REQ-BTN-02: Forwards refs to button element.
 */

import { createRef } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Button } from '../button.js';

describe('Button', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders variant classes and click handler', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();

        render(
            <Button onClick={onClick} variant="destructive">
                Delete
            </Button>,
        );

        const button = screen.getByRole('button', { name: 'Delete' });
        expect(button.className).toContain('bg-destructive');
        await user.click(button);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('supports disabled and ref forwarding', () => {
        const ref = createRef<HTMLButtonElement>();

        render(
            <Button disabled={true} ref={ref}>
                Disabled
            </Button>,
        );

        expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
        expect(ref.current?.tagName).toBe('BUTTON');
    });
});
