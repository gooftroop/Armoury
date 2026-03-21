/**
 * Select component tests.
 *
 * @requirements
 * - REQ-SELECT-01: Renders trigger/value and selectable items.
 * - REQ-SELECT-02: Calls onValueChange when item is selected.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../select.js';

describe('Select', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders trigger and selectable items', async () => {
        const user = userEvent.setup();

        render(
            <Select>
                <SelectTrigger>
                    <SelectValue placeholder="Choose faction" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="space-marines">Space Marines</SelectItem>
                    <SelectItem value="necrons">Necrons</SelectItem>
                </SelectContent>
            </Select>,
        );

        await user.click(screen.getByRole('combobox'));
        expect(screen.getByText('Space Marines')).toBeInTheDocument();
        expect(screen.getByText('Necrons')).toBeInTheDocument();
    });

    it('calls onValueChange on selection', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();

        render(
            <Select onValueChange={onValueChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Choose faction" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="necrons">Necrons</SelectItem>
                </SelectContent>
            </Select>,
        );

        await user.click(screen.getByRole('combobox'));
        await user.click(screen.getByText('Necrons'));
        expect(onValueChange).toHaveBeenCalledWith('necrons');
    });
});
