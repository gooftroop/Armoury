/**
 * ArmyCardSkeleton component tests.
 *
 * @requirements
 * - REQ-SHARED-SKEL-01: Renders without crashing.
 * - REQ-SHARED-SKEL-02: Renders skeleton bars matching ArmyCard layout structure.
 *
 * Test plan:
 * - renders without crashing → REQ-SHARED-SKEL-01
 * - renders skeleton elements → REQ-SHARED-SKEL-02
 */

import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ArmyCardSkeleton } from '../ArmyCardSkeleton.js';

describe('ArmyCardSkeleton', () => {
    it('renders without crashing', () => {
        const { container } = render(<ArmyCardSkeleton />);
        expect(container.firstChild).toBeTruthy();
    });

    it('renders a card-like structure with skeleton bars', () => {
        const { container } = render(<ArmyCardSkeleton />);
        const card = container.querySelector('[data-testid="Card"]');
        expect(card).toBeTruthy();
    });
});
