/**
 * Avatar component tests.
 *
 * @requirements
 * - REQ-AVATAR-01: Renders image/fallback and size variants.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Avatar, AvatarImage, AvatarFallback } from '../avatar.js';

describe('Avatar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders fallback content and size class', () => {
        render(
            <Avatar data-testid="avatar-root" size="lg">
                <AvatarImage alt="Commander" src="https://example.com/avatar.png" />
                <AvatarFallback>CM</AvatarFallback>
            </Avatar>,
        );

        expect(screen.getByText('CM')).toBeInTheDocument();
        expect(screen.getByTestId('avatar-root').className).toContain('h-12');
    });
});
