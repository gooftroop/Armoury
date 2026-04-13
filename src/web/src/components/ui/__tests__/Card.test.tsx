/**
 * Card component tests.
 *
 * @requirements
 * - REQ-CARD-UI-01: Supports compound composition and class customization.
 * - REQ-CARD-UI-02: Forwards refs on root component.
 */

import { createRef } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card.js';

describe('Card', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders compound subcomponents', () => {
        render(
            <Card>
                <CardHeader>
                    <CardTitle>Army Card</CardTitle>
                    <CardDescription>Details</CardDescription>
                </CardHeader>
                <CardContent>Body</CardContent>
                <CardFooter>Actions</CardFooter>
            </Card>,
        );

        expect(screen.getByText('Army Card')).toBeInTheDocument();
        expect(screen.getByText('Details')).toBeInTheDocument();
        expect(screen.getByText('Body')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('forwards ref to card root', () => {
        const ref = createRef<HTMLDivElement>();
        render(<Card ref={ref}>content</Card>);
        expect(ref.current?.tagName).toBe('DIV');
    });
});
