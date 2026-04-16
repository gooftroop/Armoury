/**
 * SystemGridContainer component tests.
 *
 * @requirements
 * | Requirement | Description | Covered By |
 * | --- | --- | --- |
 * | REQ-SGC-01 | Renders one tile per manifest through SystemGridView. | "renders one tile per manifest" |
 * | REQ-SGC-02 | Derives syncing/synced/error/overlay/href tile states from sync status and persistence errors. | "derives isSyncing", "derives isSynced", "derives isError", "derives href", "derives showOverlay true", "derives showOverlay false", "derives isQueued" |
 * | REQ-SGC-03 | Delegates unauthenticated clicks and blocks activation. | "calls onUnauthenticatedClick" |
 * | REQ-SGC-04 | Ignores clicks while already syncing. | "no-op when sync status is syncing" |
 * | REQ-SGC-05 | Activates idle systems by resolving system and calling enableSystem. | "resolves and enables on idle click", "does nothing when resolve returns null" |
 * | REQ-SGC-06 | Persists enabled system to account when userId is provided. | "persists enabled system when userId exists" |
 * | REQ-SGC-07 | Surfaces persistence failures as tile error and allows retry recovery. | "sets persist error when account mutation fails", "clears persist error after successful retry" |
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GameSystemManifest, SyncProgressState } from '@armoury/data-dao';

import type { SystemSyncStatus } from '@/providers/DataContextProvider.js';
import type { SyncQueueState } from '@/providers/SyncQueueProvider.js';

import { SystemGridContainer } from '../SystemGridContainer.js';

const {
    useDataContextMock,
    useSyncQueueMock,
    useSyncProgressMock,
    resolveGameSystemMock,
    getSyncStatusMock,
    useTranslationsMock,
    getAccessTokenMock,
    mutationUpdateAccountMock,
    systemGridViewMock,
    enableSystemMock,
    mutationFnMock,
} = vi.hoisted(() => {
    return {
        useDataContextMock: vi.fn(),
        useSyncQueueMock: vi.fn(),
        useSyncProgressMock: vi.fn(),
        resolveGameSystemMock: vi.fn(),
        getSyncStatusMock: vi.fn(),
        useTranslationsMock: vi.fn(),
        getAccessTokenMock: vi.fn(),
        mutationUpdateAccountMock: vi.fn(),
        systemGridViewMock: vi.fn(),
        enableSystemMock: vi.fn(),
        mutationFnMock: vi.fn(),
    };
});

vi.mock('@/providers/DataContextProvider.js', () => ({
    useDataContext: useDataContextMock,
}));

vi.mock('@/providers/SyncQueueProvider.js', () => ({
    useSyncQueue: useSyncQueueMock,
}));

vi.mock('@/hooks/useSyncProgress.js', () => ({
    useSyncProgress: useSyncProgressMock,
}));

vi.mock('@/lib/resolveGameSystem.js', () => ({
    resolveGameSystem: resolveGameSystemMock,
}));

vi.mock('@/lib/getSyncStatus.js', () => ({
    getSyncStatus: getSyncStatusMock,
}));

vi.mock('next-intl', () => ({
    useTranslations: useTranslationsMock,
}));

vi.mock('@auth0/nextjs-auth0/client', () => ({
    getAccessToken: getAccessTokenMock,
}));

vi.mock('@armoury/clients-users', () => ({
    mutationUpdateAccount: mutationUpdateAccountMock,
}));

vi.mock('@/components/SystemGridView.js', () => ({
    SystemGridView: systemGridViewMock,
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

const secondManifest: GameSystemManifest = {
    ...manifest,
    id: 'aos4e',
    title: 'Age of Sigmar',
    subtitle: '4th Edition',
};

const IDLE_PROGRESS: SyncProgressState = {
    phase: 'idle',
    completed: 0,
    total: 0,
    failures: 0,
    message: '',
};

interface RenderOptions {
    manifests?: GameSystemManifest[];
    statuses?: Record<string, { status: SystemSyncStatus; error?: string }>;
    queueState?: SyncQueueState;
    userId?: string;
    onUnauthenticatedClick?: () => void;
}

interface MockTile {
    id: string;
    isSyncing: boolean;
    isSynced: boolean;
    isError: boolean;
    showOverlay: boolean;
    overlayText: string;
    href?: string;
    isQueued: boolean;
    onClick: () => void;
}

function renderHarness(options: RenderOptions = {}): void {
    const statuses = options.statuses ?? {};
    const queueState: SyncQueueState =
        options.queueState ??
        ({
            pending: [],
            active: null,
            isProcessing: false,
        } as SyncQueueState);

    useDataContextMock.mockReturnValue({
        systemSyncStates: statuses,
        syncProgressCollector: { getState: () => IDLE_PROGRESS },
        enableSystem: enableSystemMock,
    });
    useSyncQueueMock.mockReturnValue({ state: queueState });
    useSyncProgressMock.mockReturnValue(IDLE_PROGRESS);

    render(
        <SystemGridContainer
            manifests={options.manifests ?? [manifest]}
            userId={options.userId}
            onUnauthenticatedClick={options.onUnauthenticatedClick}
        />,
    );
}

function getTile(systemId: string): HTMLElement {
    const tile = screen.getByText(`tile:${systemId}`).closest('li');

    if (!tile) {
        throw new Error(`Missing tile container for ${systemId}`);
    }

    return tile;
}

describe('SystemGridContainer', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        systemGridViewMock.mockImplementation(({ tiles }: { tiles: MockTile[] }) => {
            return (
                <ul aria-label="Game systems">
                    {tiles.map((tile) => {
                        return (
                            <li key={tile.id}>
                                <span>{`tile:${tile.id}`}</span>
                                {tile.isSyncing ? <output>syncing</output> : null}
                                {tile.isSynced ? <span>synced</span> : null}
                                {tile.isError ? <span>error</span> : null}
                                {tile.showOverlay ? <span>overlay</span> : null}
                                {tile.isQueued ? <span>queued</span> : null}
                                <span>{`text:${tile.overlayText}`}</span>
                                {tile.href ? <a href={tile.href}>link</a> : null}
                                <button type="button" onClick={tile.onClick}>{`click:${tile.id}`}</button>
                            </li>
                        );
                    })}
                </ul>
            );
        });

        useTranslationsMock.mockReturnValue((key: string) => key);
        getAccessTokenMock.mockResolvedValue('mock-token');
        mutationFnMock.mockResolvedValue(undefined);
        mutationUpdateAccountMock.mockReturnValue({ mutationFn: mutationFnMock });
        resolveGameSystemMock.mockResolvedValue({ id: manifest.id });
        enableSystemMock.mockResolvedValue(undefined);

        getSyncStatusMock.mockImplementation(
            (systemId: string, syncStates: Record<string, { status: SystemSyncStatus }>) =>
                syncStates[systemId]?.status ?? 'idle',
        );
    });

    it('renders one tile per manifest', () => {
        renderHarness({ manifests: [manifest, secondManifest] });

        expect(screen.getByRole('list', { name: 'Game systems' })).toBeInTheDocument();
        expect(screen.getAllByRole('listitem')).toHaveLength(2);
        expect(screen.getByText('tile:wh40k10e')).toBeInTheDocument();
        expect(screen.getByText('tile:aos4e')).toBeInTheDocument();
    });

    it('derives isSyncing=true when sync status is syncing', () => {
        renderHarness({ statuses: { [manifest.id]: { status: 'syncing' } } });

        expect(within(getTile(manifest.id)).getByRole('status')).toHaveTextContent('syncing');
        expect(screen.getByText('text:downloading')).toBeInTheDocument();
    });

    it('derives isSynced=true when sync status is synced without persist error', () => {
        renderHarness({ statuses: { [manifest.id]: { status: 'synced' } } });

        expect(within(getTile(manifest.id)).getByText('synced')).toBeInTheDocument();
        expect(screen.getByText('text:synced')).toBeInTheDocument();
    });

    it('derives isError=true when sync status is error', () => {
        renderHarness({ statuses: { [manifest.id]: { status: 'error' } } });

        expect(within(getTile(manifest.id)).getByText('error')).toBeInTheDocument();
        expect(screen.getByText('text:syncError')).toBeInTheDocument();
    });

    it('derives href for synced tiles', () => {
        renderHarness({ statuses: { [manifest.id]: { status: 'synced' } } });

        expect(within(getTile(manifest.id)).getByRole('link', { name: 'link' })).toHaveAttribute(
            'href',
            './wh40k10e/armies',
        );
    });

    it('derives showOverlay=true when tile is not synced', () => {
        renderHarness({ statuses: { [manifest.id]: { status: 'idle' } } });

        expect(within(getTile(manifest.id)).getByText('overlay')).toBeInTheDocument();
        expect(screen.getByText('text:downloadOverlay')).toBeInTheDocument();
    });

    it('derives showOverlay=false when tile is synced', () => {
        renderHarness({ statuses: { [manifest.id]: { status: 'synced' } } });

        expect(within(getTile(manifest.id)).queryByText('overlay')).not.toBeInTheDocument();
    });

    it('derives isQueued=true when system is in queue pending', () => {
        renderHarness({
            queueState: {
                pending: [manifest.id],
                active: null,
                isProcessing: true,
            },
        });

        expect(within(getTile(manifest.id)).getByText('queued')).toBeInTheDocument();
    });

    it('calls onUnauthenticatedClick when provided and does not enable system', async () => {
        const onUnauthenticatedClick = vi.fn();
        const user = userEvent.setup();

        renderHarness({ onUnauthenticatedClick, statuses: { [manifest.id]: { status: 'idle' } } });

        await user.click(screen.getByRole('button', { name: 'click:wh40k10e' }));

        expect(onUnauthenticatedClick).toHaveBeenCalledTimes(1);
        expect(resolveGameSystemMock).not.toHaveBeenCalled();
        expect(enableSystemMock).not.toHaveBeenCalled();
    });

    it('no-op when sync status is syncing', async () => {
        const user = userEvent.setup();
        renderHarness({ statuses: { [manifest.id]: { status: 'syncing' } } });

        await user.click(screen.getByRole('button', { name: 'click:wh40k10e' }));

        expect(resolveGameSystemMock).not.toHaveBeenCalled();
        expect(enableSystemMock).not.toHaveBeenCalled();
    });

    it('resolves and enables on idle click', async () => {
        const user = userEvent.setup();
        renderHarness({ statuses: { [manifest.id]: { status: 'idle' } } });

        await user.click(screen.getByRole('button', { name: 'click:wh40k10e' }));

        await waitFor(() => {
            expect(resolveGameSystemMock).toHaveBeenCalledWith('wh40k10e');
        });
        expect(enableSystemMock).toHaveBeenCalledTimes(1);
    });

    it('does nothing when resolveGameSystem returns null', async () => {
        resolveGameSystemMock.mockResolvedValueOnce(null);
        const user = userEvent.setup();
        renderHarness({ statuses: { [manifest.id]: { status: 'idle' } } });

        await user.click(screen.getByRole('button', { name: 'click:wh40k10e' }));

        await waitFor(() => {
            expect(resolveGameSystemMock).toHaveBeenCalledWith('wh40k10e');
        });
        expect(enableSystemMock).not.toHaveBeenCalled();
    });

    it('persists enabled system when userId exists', async () => {
        const user = userEvent.setup();
        renderHarness({ userId: 'auth0|user-123', statuses: { [manifest.id]: { status: 'idle' } } });

        await user.click(screen.getByRole('button', { name: 'click:wh40k10e' }));

        await waitFor(() => {
            expect(mutationUpdateAccountMock).toHaveBeenCalledTimes(1);
        });

        expect(getAccessTokenMock).toHaveBeenCalledTimes(1);
        expect(mutationUpdateAccountMock).toHaveBeenCalledWith(
            'Bearer mock-token',
            { userId: 'auth0|user-123' },
            expect.objectContaining({
                systems: expect.objectContaining({
                    wh40k10e: expect.objectContaining({ enabled: true, lastSyncedAt: expect.any(String) }),
                }),
            }),
        );
        expect(mutationFnMock).toHaveBeenCalledTimes(1);
    });

    it('sets persist error when account mutation fails', async () => {
        mutationFnMock.mockRejectedValueOnce(new Error('persist failed'));
        const user = userEvent.setup();
        renderHarness({ userId: 'auth0|user-123', statuses: { [manifest.id]: { status: 'synced' } } });

        await user.click(screen.getByRole('button', { name: 'click:wh40k10e' }));

        await waitFor(() => {
            expect(within(getTile(manifest.id)).getByText('error')).toBeInTheDocument();
        });
        expect(screen.getByText('text:syncError')).toBeInTheDocument();
    });

    it('clears persist error after successful retry', async () => {
        mutationFnMock.mockRejectedValueOnce(new Error('persist failed'));
        mutationFnMock.mockResolvedValueOnce(undefined);
        const user = userEvent.setup();

        renderHarness({ userId: 'auth0|user-123', statuses: { [manifest.id]: { status: 'synced' } } });

        await user.click(screen.getByRole('button', { name: 'click:wh40k10e' }));

        await waitFor(() => {
            expect(within(getTile(manifest.id)).getByText('error')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'click:wh40k10e' }));

        await waitFor(() => {
            expect(within(getTile(manifest.id)).queryByText('error')).not.toBeInTheDocument();
        });
        expect(within(getTile(manifest.id)).getByText('synced')).toBeInTheDocument();
        expect(within(getTile(manifest.id)).queryByText('overlay')).not.toBeInTheDocument();
        expect(screen.getByText('text:synced')).toBeInTheDocument();
    });
});
