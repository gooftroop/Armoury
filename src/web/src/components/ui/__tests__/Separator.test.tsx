/**
 * Separator component tests.
 *
 * @requirements
 * - REQ-SEPARATOR-01: Renders horizontal and vertical orientations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Separator } from '../separator.js';

describe('Separator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders horizontal separator by default', () => {
        render(<Separator data-testid="sep" />);
        expect(screen.getByTestId('sep')).toHaveAttribute('data-orientation', 'horizontal');
    });

    it('renders vertical separator', () => {
        render(<Separator data-testid="sep-vertical" orientation="vertical" />);
        expect(screen.getByTestId('sep-vertical')).toHaveAttribute('data-orientation', 'vertical');
    });
});
