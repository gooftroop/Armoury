/**
 * EmptyState component tests.
 *
 * @requirements
 * - REQ-SHARED-EMPTY-01: Renders title text.
 * - REQ-SHARED-EMPTY-02: Renders description when provided.
 * - REQ-SHARED-EMPTY-03: Omits description when not provided.
 * - REQ-SHARED-EMPTY-04: Renders action element when provided.
 * - REQ-SHARED-EMPTY-05: Renders icon element when provided.
 *
 * Test plan:
 * - renders title → REQ-SHARED-EMPTY-01
 * - renders description → REQ-SHARED-EMPTY-02
 * - omits description → REQ-SHARED-EMPTY-03
 * - renders action → REQ-SHARED-EMPTY-04
 * - renders icon → REQ-SHARED-EMPTY-05
 */

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EmptyState } from '../EmptyState.js';

describe('EmptyState', () => {
    it('renders the title', () => {
        render(<EmptyState title="No armies yet" />);
        expect(screen.getByText('No armies yet')).toBeTruthy();
    });

    it('renders the description when provided', () => {
        render(<EmptyState title="No armies yet" description="Create your first army to get started." />);
        expect(screen.getByText('Create your first army to get started.')).toBeTruthy();
    });

    it('omits the description when not provided', () => {
        render(<EmptyState title="No armies yet" />);
        expect(screen.queryByText('Create your first army to get started.')).toBeNull();
    });

    it('renders an action element when provided', () => {
        render(<EmptyState title="No armies yet" action={<button type="button">Create Army</button>} />);
        expect(screen.getByText('Create Army')).toBeTruthy();
    });

    it('renders an icon element when provided', () => {
        render(<EmptyState title="No armies yet" icon={<span data-testid="icon">🛡️</span>} />);
        expect(screen.getByTestId('icon')).toBeTruthy();
    });
});
