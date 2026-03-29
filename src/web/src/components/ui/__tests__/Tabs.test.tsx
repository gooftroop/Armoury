/**
 * Tabs component tests.
 *
 * @requirements
 * - REQ-TABS-01: Renders tabs and switches visible panel.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs.js';

describe('Tabs', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('switches content by tab trigger', async () => {
        const user = userEvent.setup();

        render(
            <Tabs defaultValue="one">
                <TabsList>
                    <TabsTrigger value="one">One</TabsTrigger>
                    <TabsTrigger value="two">Two</TabsTrigger>
                </TabsList>
                <TabsContent value="one">Panel One</TabsContent>
                <TabsContent value="two">Panel Two</TabsContent>
            </Tabs>,
        );

        expect(screen.getByText('Panel One')).toBeInTheDocument();
        await user.click(screen.getByRole('tab', { name: 'Two' }));
        expect(screen.getByText('Panel Two')).toBeInTheDocument();
    });
});
