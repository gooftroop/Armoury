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
 * | REQ-SAG-06 | Must render cache fallback error UI when sync fails but cache exists. | "shows error with cache fallback UI for error with cache" |
 * | REQ-SAG-07 | Must render blocking error UI when sync fails and cache is unavailable. | "shows error without cache UI for error without cache" |
 * | REQ-SAG-08 | Must render not-ready state when status is idle or missing. | "shows not ready for idle status" and "shows not ready for undefined status" |
 */

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SystemAccessGate } from '../SystemAccessGate.js';

const { mockUseDataContext, mockUseSyncManifest } = vi.hoisted(() => ({
    mockUseDataContext: vi.fn(),
    mockUseSyncManifest: vi.fn(),
}));

vi.mock('next/link', () => ({
    default: ({ children }: { children: unknown; href: string }) => children,
}));

vi.mock('@/providers/DataContextProvider.js', () => ({
    useDataContext: mockUseDataContext,
}));

vi.mock('@/providers/SyncManifestProvider.js', () => ({
    useSyncManifest: mockUseSyncManifest,
}));

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
        mockUseSyncManifest.mockReturnValue({ hasSynced: vi.fn(() => false) });
        mockUseDataContext.mockReturnValue({ systemSyncStates: {} });
    });

    it('renders children when status is synced', () => {
        mockUseDataContext.mockReturnValue({
            systemSyncStates: {
                wh40k10e: { status: 'synced' },
            },
        });

        renderHarness();

        expect(screen.getByText('system-content')).toBeInTheDocument();
    });

    it('renders children when SyncManifest has synced', () => {
        mockUseSyncManifest.mockReturnValue({ hasSynced: vi.fn(() => true) });

        renderHarness();

        expect(screen.getByText('system-content')).toBeInTheDocument();
    });

    it('shows loading for pending status', () => {
        mockUseDataContext.mockReturnValue({
            systemSyncStates: {
                wh40k10e: { status: 'pending' },
            },
        });

        renderHarness();

        expect(screen.getByText('Syncing...')).toBeInTheDocument();
    });

    it('shows loading for checking-staleness status', () => {
        mockUseDataContext.mockReturnValue({
            systemSyncStates: {
                wh40k10e: { status: 'checking-staleness' },
            },
        });

        renderHarness();

        expect(screen.getByText('Syncing...')).toBeInTheDocument();
    });

    it('shows loading for syncing status', () => {
        mockUseDataContext.mockReturnValue({
            systemSyncStates: {
                wh40k10e: { status: 'syncing' },
            },
        });

        renderHarness();

        expect(screen.getByText('Syncing...')).toBeInTheDocument();
    });

    it('shows error with cache fallback UI for error with cache', () => {
        mockUseDataContext.mockReturnValue({
            systemSyncStates: {
                wh40k10e: { status: 'error', hasCache: true },
            },
        });

        renderHarness();

        expect(screen.getByText('Sync failed but cached data is available.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Use cached data' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });

    it('shows error without cache UI for error without cache', () => {
        mockUseDataContext.mockReturnValue({
            systemSyncStates: {
                wh40k10e: { status: 'error', hasCache: false },
            },
        });

        renderHarness();

        expect(screen.getByText('Failed to sync.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
        expect(screen.getByText('Back to home')).toBeInTheDocument();
    });

    it('shows not ready for idle status', () => {
        mockUseDataContext.mockReturnValue({
            systemSyncStates: {
                wh40k10e: { status: 'idle' },
            },
        });

        renderHarness();

        expect(screen.getByText('This game system is not ready yet.')).toBeInTheDocument();
    });

    it('shows not ready for undefined status', () => {
        renderHarness();

        expect(screen.getByText('This game system is not ready yet.')).toBeInTheDocument();
    });
});
