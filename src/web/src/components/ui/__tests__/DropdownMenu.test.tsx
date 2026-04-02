/**
 * DropdownMenu component tests.
 *
 * @requirements
 * - REQ-MENU-01: Renders menu content and item interactions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../DropdownMenu.js';

describe('DropdownMenu', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders content and handles item click', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();

        render(
            <DropdownMenu>
                <DropdownMenuTrigger asChild={true}>
                    <button type="button">Open Menu</button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={onSelect}>Delete</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>,
        );

        await user.click(screen.getByRole('button', { name: 'Open Menu' }));
        await user.click(screen.getByText('Delete'));

        expect(onSelect).toHaveBeenCalledTimes(1);
    });
});
