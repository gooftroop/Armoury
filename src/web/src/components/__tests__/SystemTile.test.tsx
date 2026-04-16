/**
 * SystemTile component tests.
 *
 * @requirements
 * | Requirement | Description | Covered By |
 * | --- | --- | --- |
 * | REQ-ST-01 | Renders spinner when syncing without progress data. | "renders spinner when syncing without progress data" |
 * | REQ-ST-02 | Renders spinner when syncing with idle progress. | "renders spinner when syncing with idle progress" |
 * | REQ-ST-03 | Renders ProgressBar when syncing with syncing-phase progress. | "renders ProgressBar when syncing with syncing-phase progress" |
 * | REQ-ST-04 | Renders ProgressBar with failures visible. | "renders ProgressBar with failures visible" |
 * | REQ-ST-05 | Renders error icon when isError is true. | "renders error icon when isError is true" |
 * | REQ-ST-06 | Renders synced badge when isSynced. | "renders synced badge when isSynced" |
 * | REQ-ST-07 | Wraps in Link when href is provided. | "wraps in Link when href is provided" |
 * | REQ-ST-08 | Calls onClick when overlay is clicked. | "calls onClick when overlay is clicked" |
 * | REQ-ST-09 | Disables overlay button when syncing. | "disables overlay button when syncing" |
 * | REQ-ST-10 | Renders queued badge when isQueued. | "renders queued badge when isQueued is true" |
 * | REQ-ST-11 | Does not render overlay when showOverlay is false. | "does not render overlay when showOverlay is false" |
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { GameSystemManifest, SyncProgressState } from '@armoury/data-dao';

import { SystemTile } from '../SystemTile.js';

vi.mock('next/link', () => ({
    __esModule: true,
    default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

const manifest: GameSystemManifest = {
    id: 'wh40k10e',
    title: 'Warhammer 40,000',
    subtitle: '10th Edition',
    description: 'The grimdark future',
    splashText: '40K',
    splashTextColor: '#ffffff',
    gradientStart: '#1a1a2e',
    gradientMid: '#16213e',
    gradientEnd: '#0f3460',
    accent: 'gold',
    themeCSS: 'theme.css',
    themeTamagui: 'theme-tamagui.ts',
    themeStyleSheet: 'theme-stylesheet.ts',
    manifestVersion: '1.0.0',
};

const baseProps = {
    manifest,
    isSyncing: false,
    isSynced: false,
    isError: false,
    showOverlay: true,
    overlayText: 'Download',
    onClick: vi.fn(),
};

describe('SystemTile', () => {
    it('renders spinner when syncing without progress data', () => {
        render(<SystemTile {...baseProps} isSyncing showOverlay overlayText="Downloading..." />);

        expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('renders spinner when syncing with idle progress', () => {
        const idleProgress: SyncProgressState = {
            phase: 'idle',
            completed: 0,
            total: 0,
            failures: 0,
            message: '',
        };

        render(
            <SystemTile
                {...baseProps}
                isSyncing
                showOverlay
                overlayText="Downloading..."
                syncProgress={idleProgress}
            />,
        );

        expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('renders ProgressBar when syncing with syncing-phase progress', () => {
        const syncingProgress: SyncProgressState = {
            phase: 'syncing',
            completed: 15,
            total: 40,
            failures: 0,
            message: 'Syncing 15/40',
        };

        render(
            <SystemTile
                {...baseProps}
                isSyncing
                showOverlay
                overlayText="Downloading..."
                syncProgress={syncingProgress}
            />,
        );

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        expect(screen.getByText('15/40')).toBeInTheDocument();
        expect(screen.getByText('Syncing 15/40')).toBeInTheDocument();
        expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument();
    });

    it('renders ProgressBar with failures visible', () => {
        const progressWithFailures: SyncProgressState = {
            phase: 'syncing',
            completed: 38,
            total: 40,
            failures: 2,
            message: 'Syncing 38/40',
        };

        render(
            <SystemTile
                {...baseProps}
                isSyncing
                showOverlay
                overlayText="Downloading..."
                syncProgress={progressWithFailures}
            />,
        );

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        expect(screen.getByText(/2 failed/)).toBeInTheDocument();
    });

    it('renders error icon when isError is true', () => {
        render(<SystemTile {...baseProps} isError showOverlay overlayText="Sync Error" />);

        expect(screen.getByText('Sync Error')).toBeInTheDocument();
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('renders synced badge when isSynced', () => {
        render(<SystemTile {...baseProps} isSynced showOverlay={false} overlayText="Synced" />);

        expect(screen.getByText('Synced')).toBeInTheDocument();
    });

    it('wraps in Link when href is provided', () => {
        render(
            <SystemTile {...baseProps} isSynced showOverlay={false} overlayText="Synced" href="./wh40k10e/armies" />,
        );

        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', './wh40k10e/armies');
    });

    it('calls onClick when overlay is clicked', async () => {
        const onClick = vi.fn();
        render(<SystemTile {...baseProps} onClick={onClick} overlayText="Download" />);

        await userEvent.click(screen.getByText('Download'));
        expect(onClick).toHaveBeenCalledOnce();
    });

    it('disables overlay button when syncing', () => {
        render(<SystemTile {...baseProps} isSyncing showOverlay overlayText="Downloading..." />);

        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
    });

    it('renders queued badge when isQueued is true', () => {
        render(<SystemTile {...baseProps} isQueued={true} />);

        expect(screen.getByText('Queued')).toBeInTheDocument();
    });

    it('does not render queued badge when syncing', () => {
        render(<SystemTile {...baseProps} isQueued={true} isSyncing={true} />);

        expect(screen.queryByText('Queued')).not.toBeInTheDocument();
    });

    it('does not render overlay when showOverlay is false', () => {
        render(<SystemTile {...baseProps} showOverlay={false} />);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});
