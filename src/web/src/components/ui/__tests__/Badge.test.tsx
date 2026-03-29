/**
 * Badge component tests.
 *
 * @requirements
 * - REQ-BADGE-01: Renders variant styles and content.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Badge } from '../badge.js';

describe('Badge', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders text and variant class', () => {
        render(<Badge variant="secondary">Ready</Badge>);

        const badge = screen.getByText('Ready');
        expect(badge).toBeInTheDocument();
        expect(badge.className).toContain('bg-secondary');
    });
});
