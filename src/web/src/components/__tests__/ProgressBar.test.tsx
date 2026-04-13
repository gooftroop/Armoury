/**
 * ProgressBar component tests.
 *
 * @requirements
 * - REQ-PROG-01: Renders phase label, count text, and ARIA progressbar.
 * - REQ-PROG-02: Shows failure indicator when failures > 0.
 * - REQ-PROG-03: Handles boundary values (0% and 100%).
 * - REQ-PROG-04: Handles total=0 edge case without crashing.
 * - REQ-PROG-05: Hides failure text when failures=0.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ProgressBar } from '../ProgressBar.js';

describe('ProgressBar', () => {
    it('renders phase label, count text, and correct ARIA attributes', () => {
        render(<ProgressBar phase="Syncing" completed={15} total={40} failures={0} />);

        expect(screen.getByText('Syncing')).toBeInTheDocument();
        expect(screen.getByText('15/40')).toBeInTheDocument();

        const progressbar = screen.getByRole('progressbar');
        expect(progressbar).toHaveAttribute('aria-valuenow', '38');
        expect(progressbar).toHaveAttribute('aria-valuemin', '0');
        expect(progressbar).toHaveAttribute('aria-valuemax', '100');
        expect(progressbar).toHaveAttribute('aria-label', 'Sync progress');
    });

    it('shows failure indicator when failures > 0', () => {
        render(<ProgressBar phase="Syncing" completed={38} total={40} failures={2} />);

        expect(screen.getByText(/2 failed/)).toBeInTheDocument();
    });

    it('renders 0% progress at start', () => {
        render(<ProgressBar phase="Loading..." completed={0} total={40} failures={0} />);

        const progressbar = screen.getByRole('progressbar');
        expect(progressbar).toHaveAttribute('aria-valuenow', '0');
    });

    it('renders 100% progress when complete', () => {
        render(<ProgressBar phase="Complete" completed={40} total={40} failures={0} />);

        const progressbar = screen.getByRole('progressbar');
        expect(progressbar).toHaveAttribute('aria-valuenow', '100');
    });

    it('handles total=0 without crashing', () => {
        render(<ProgressBar phase="Idle" completed={0} total={0} failures={0} />);

        const progressbar = screen.getByRole('progressbar');
        expect(progressbar).toHaveAttribute('aria-valuenow', '0');
        expect(screen.getByText('0/0')).toBeInTheDocument();
    });

    it('hides failure text when failures is 0', () => {
        render(<ProgressBar phase="Syncing" completed={20} total={40} failures={0} />);

        expect(screen.queryByText(/failed/)).not.toBeInTheDocument();
    });
});
