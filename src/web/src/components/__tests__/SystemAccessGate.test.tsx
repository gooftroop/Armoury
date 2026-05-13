/**
 * SystemAccessGate tests.
 *
 * @requirements
 * | Requirement ID | Requirement | Test Case(s) |
 * | --- | --- | --- |
 * | REQ-SAG-01 | Must render children when DataContext status is synced. | "renders children when status is synced" |
 * | REQ-SAG-02 | Must render children when SyncManifest marks system synced. | "renders children when SyncManifest has synced" |
 * | REQ-SAG-03 | Must render loading state while pending. | "shows loading for pending status" |
 * | REQ-SAG-04 | Must render loading state while checking staleness. | "shows loading for checking-staleness status" |
 * | REQ-SAG-05 | Must render loading state while syncing. | "shows loading for syncing status" |
 * | REQ-SAG-06 | Must render an error state with a Back-to-home link when sync fails. | "shows error UI with back-to-home link when sync fails" |
 * | REQ-SAG-07 | Must render not-ready state when status is idle or missing. | "shows not ready for idle status" and "shows not ready for undefined status" |
 */

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SystemAccessGate } from '@armoury/feature-game-system';

const { mockUseDataContext } = vi.hoisted(() => ({
    mockUseDataContext: vi.fn(),
}));

vi.mock('next/link', () => ({
    default: ({ children }: { children: unknown; href: string }) => children,
}));

vi.mock('../../../../shared/features/game-system/src/DataContextManagerProvider.web.js', async () => {
    const actual = await vi.importActual(
        '../../../../shared/features/game-system/src/DataContextManagerProvider.web.js',
    );

    return {
        ...actual,
        useDataContext: mockUseDataContext,
    };
});

vi.mock('@armoury/feature-game-system', async () => {
    const actual = await vi.importActual('@armoury/feature-game-system');
    const source = await vi.importActual('../../../../shared/features/game-system/src/SystemAccessGate.web.js');

    return {
        ...actual,
        SystemAccessGate: source.SystemAccessGate,
    };
});

interface RenderHarnessOptions {
    readonly systemId?: string;
}

function renderHarness({ systemId = 'wh40k10e' }: RenderHarnessOptions = {}): void {
    render(
        <SystemAccessGate systemId={systemId}>
            <div>system-content</div>
        </SystemAccessGate>,
    );
}

describe('SystemAccessGate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseDataContext.mockReturnValue({
            systemSyncStates: {},
            hasSynced: vi.fn(() => false),
        });
    });

    it('renders children when status is synced', () => {
        mockUseDataContext.mockReturnValue({
            systemSyncStates: {
                wh40k10e: { status: 'synced' },
            },
            hasSynced: vi.fn(() => false),
        });

        renderHarness();

        expect(screen.getByText('system-content')).toBeInTheDocument();
    });

    it('renders children when SyncManifest has synced', () => {
        mockUseDataContext.mockReturnValue({
            systemSyncStates: {},
            hasSynced: vi.fn(() => true),
        });

        renderHarness();

        expect(screen.getByText('system-content')).toBeInTheDocument();
    });

    it('shows loading for pending status', () => {
        mockUseDataContext.mockReturnValue({
            systemSyncStates: {
                wh40k10e: { status: 'pending' },
            },
            hasSynced: vi.fn(() => false),
        });

        renderHarness();

        expect(screen.getByText('Syncing...')).toBeInTheDocument();
    });

    it('shows loading for checking-staleness status', () => {
        mockUseDataContext.mockReturnValue({
            systemSyncStates: {
                wh40k10e: { status: 'checking-staleness' },
            },
            hasSynced: vi.fn(() => false),
        });

        renderHarness();

        expect(screen.getByText('Syncing...')).toBeInTheDocument();
    });

    it('shows loading for syncing status', () => {
        mockUseDataContext.mockReturnValue({
            systemSyncStates: {
                wh40k10e: { status: 'syncing' },
            },
            hasSynced: vi.fn(() => false),
        });

        renderHarness();

        expect(screen.getByText('Syncing...')).toBeInTheDocument();
    });

    it('shows error UI with back-to-home link when sync fails', () => {
        mockUseDataContext.mockReturnValue({
            systemSyncStates: {
                wh40k10e: { status: 'error', hasCache: false },
            },
            hasSynced: vi.fn(() => false),
        });

        renderHarness();

        expect(screen.getByText('Failed to sync.')).toBeInTheDocument();
        expect(screen.getByText('Back to home')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Use cached data' })).not.toBeInTheDocument();
    });

    it('shows not ready for idle status', () => {
        mockUseDataContext.mockReturnValue({
            systemSyncStates: {
                wh40k10e: { status: 'idle' },
            },
            hasSynced: vi.fn(() => false),
        });

        renderHarness();

        expect(screen.getByText('This game system is not ready yet.')).toBeInTheDocument();
    });

    it('shows not ready for undefined status', () => {
        renderHarness();

        expect(screen.getByText('This game system is not ready yet.')).toBeInTheDocument();
    });
});
