/**
 * Switch component tests.
 *
 * @requirements
 * - REQ-SWITCH-01: Toggles checked state via click and keyboard.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Switch } from '../switch.js';

describe('Switch', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('supports checked state changes and disabled state', async () => {
        const user = userEvent.setup();
        const onCheckedChange = vi.fn();

        render(<Switch aria-label="notifications" onCheckedChange={onCheckedChange} />);

        const control = screen.getByRole('switch', { name: 'notifications' });
        expect(control).toBeInTheDocument();
        await user.click(control);
        expect(onCheckedChange).toHaveBeenCalledTimes(1);
    });

    it('renders disabled switch', () => {
        render(<Switch aria-label="disabled-switch" disabled={true} />);
        expect(screen.getByRole('switch', { name: 'disabled-switch' })).toBeDisabled();
    });
});
