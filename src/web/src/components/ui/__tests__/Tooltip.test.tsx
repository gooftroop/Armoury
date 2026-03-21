/**
 * Tooltip component tests.
 *
 * @requirements
 * - REQ-TOOLTIP-01: Shows tooltip content on hover/focus interactions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '../tooltip.js';

describe('Tooltip', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders tooltip content on hover', async () => {
        const user = userEvent.setup();

        render(
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild={true}>
                        <button type="button">Trigger</button>
                    </TooltipTrigger>
                    <TooltipContent>Tooltip text</TooltipContent>
                </Tooltip>
            </TooltipProvider>,
        );

        await user.hover(screen.getByRole('button', { name: 'Trigger' }));
        await vi.waitFor(() => {
            expect(screen.getByRole('tooltip')).toHaveTextContent('Tooltip text');
        });
    });
});
