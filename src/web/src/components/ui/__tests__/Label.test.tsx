/**
 * Label component tests.
 *
 * @requirements
 * - REQ-LABEL-01: Associates with form controls through htmlFor.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Label } from '../label.js';

describe('Label', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders with htmlFor and text', () => {
        render(
            <>
                <Label htmlFor="army-name">Army Name</Label>
                <input id="army-name" />
            </>,
        );

        expect(screen.getByText('Army Name')).toHaveAttribute('for', 'army-name');
    });
});
