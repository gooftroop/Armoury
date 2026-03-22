/**
 * ArmyCardSkeleton component tests.
 *
 * @requirements
 * - REQ-SKELETON-01: Renders expected skeleton structure.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ArmyCardSkeleton } from '../ArmyCardSkeleton.js';

describe('ArmyCardSkeleton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders all skeleton placeholders in card layout', () => {
        render(<ArmyCardSkeleton data-testid="army-card-skeleton" />);

        const root = screen.getByTestId('army-card-skeleton');
        const placeholders = root.querySelectorAll('[class*="animate-pulse"]');

        expect(root).toBeInTheDocument();
        expect(placeholders.length).toBe(8);
    });
});
