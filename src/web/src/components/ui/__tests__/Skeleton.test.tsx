/**
 * Skeleton component tests.
 *
 * @requirements
 * - REQ-SKEL-UI-01: Renders loading placeholder classes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Skeleton } from '../skeleton.js';

describe('Skeleton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders with animate-pulse class', () => {
        render(<Skeleton data-testid="skeleton" />);
        expect(screen.getByTestId('skeleton').className).toContain('animate-pulse');
    });
});
