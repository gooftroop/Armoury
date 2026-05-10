/**
 * SystemGridContainer download flow tests — PR #45 regression guard.
 *
 * Companion to the E2E download-game-system.spec.ts. These tests isolate the
 * container's behavior when the underlying sync resolves as a partial failure
 * (some DAOs succeeded, one failed) so the manager reports the system as
 * 'synced'. The container must surface the synced link AND must not show an
 * error indicator simultaneously.
 *
 * @requirements
 * | Requirement | Description | Covered By |
 * | --- | --- | --- |
 * | REQ-SGC-DL-01 | Clicking the download overlay delegates activation to enableSystem. | "delegates download click to enableSystem" |
 * | REQ-SGC-DL-02 | A partial sync failure that resolves as 'synced' must surface the synced link. | "renders synced link after partial failure resolves to synced" |
 * | REQ-SGC-DL-03 | A partial sync failure that resolves as 'synced' must not surface the error indicator. | "does not render error indicator when partial failure resolves to synced" |
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GameSystemManifest, SyncProgressState } from '@armoury/data-dao';

import type { SystemSyncStatus } from '@/data/useDataContext.js';

import { SystemGridContainer } from '../SystemGridContainer.js';

const {
    useDataContextMock,
    useSyncProgressMock,
    resolveGameSystemMock,
    getSyncStatusMock,
    useTranslationsMock,
    getAccessTokenMock,
    mutationUpdateAccountMock,
    systemGridViewMock,
    enableSystemMock,
    mutationFnMock,
} = vi.hoisted(() => ({
    useDataContextMock: vi.fn(),
    useSyncProgressMock: vi.fn(),
    resolveGameSystemMock: vi.fn(),
    getSyncStatusMock: vi.fn(),
    useTranslationsMock: vi.fn(),
    getAccessTokenMock: vi.fn(),
    mutationUpdateAccountMock: vi.fn(),
    systemGridViewMock: vi.fn(),
    enableSystemMock: vi.fn(),
    mutationFnMock: vi.fn(),
}));

vi.mock('@/data/useDataContext.js', () => ({
    useDataContext: useDataContextMock,
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

const IDLE_PROGRESS: SyncProgressState = {
    phase: 'idle',
    completed: 0,
    total: 0,
    failures: 0,
    message: '',
};

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

function renderWithStatus(status: SystemSyncStatus, error?: string): void {
    const statuses = { [manifest.id]: { status, error } };

    useDataContextMock.mockReturnValue({
        systemSyncStates: statuses,
        syncProgressCollector: null,
        enableSystem: enableSystemMock,
    });
    useSyncProgressMock.mockReturnValue(IDLE_PROGRESS);

    render(<SystemGridContainer manifests={[manifest]} userId="user-1" />);
}

describe('SystemGridContainer download flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        systemGridViewMock.mockImplementation(({ tiles }: { tiles: MockTile[] }) => {
            return (
                <ul aria-label="Game systems">
                    {tiles.map((tile) => {
                        return (
                            <li key={tile.id}>
                                <span>{`tile:${tile.id}`}</span>
                                {tile.isSynced ? <span>synced</span> : null}
                                {tile.isError ? <span>error</span> : null}
                                {tile.href ? <a href={tile.href}>Ready</a> : null}
                                <button type="button" onClick={tile.onClick}>
                                    download
                                </button>
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

    it('delegates download click to enableSystem', async () => {
        const user = userEvent.setup();

        renderWithStatus('idle');

        await user.click(screen.getByRole('button', { name: 'download' }));

        expect(resolveGameSystemMock).toHaveBeenCalledWith(manifest.id);
        expect(enableSystemMock).toHaveBeenCalledTimes(1);
        expect(enableSystemMock).toHaveBeenCalledWith({ id: manifest.id });
    });

    it('renders synced link after partial failure resolves to synced', () => {
        renderWithStatus('synced');

        const tile = screen.getByText(`tile:${manifest.id}`).closest('li');

        expect(tile).not.toBeNull();
        expect(within(tile as HTMLElement).getByRole('link', { name: 'Ready' })).toBeInTheDocument();
        expect(within(tile as HTMLElement).getByText('synced')).toBeInTheDocument();
    });

    it('does not render error indicator when partial failure resolves to synced', () => {
        renderWithStatus('synced');

        const tile = screen.getByText(`tile:${manifest.id}`).closest('li');

        expect(tile).not.toBeNull();
        expect(within(tile as HTMLElement).queryByText('error')).not.toBeInTheDocument();
    });
});
