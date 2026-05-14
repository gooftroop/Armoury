/**
 * Skeleton component tests.
 *
 * @requirements
 * - REQ-SKEL-UI-01: Renders loading placeholder classes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Skeleton } from '@armoury/ui';

describe('Skeleton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders with shimmer animation class and reduced-motion fallback', () => {
        render(<Skeleton data-testid="skeleton" />);
        const el = screen.getByTestId('skeleton');
        expect(el.className).toContain('animate-shimmer');
        expect(el.className).toContain('motion-reduce:animate-pulse');
    });
});
