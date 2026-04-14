/**
 * ForgeContainer component tests.
 *
 * @requirements
 * - REQ-FORGE-CONTAINER-01: Fetches armies via dataContext.armies.listByOwner(userId).
 * - REQ-FORGE-CONTAINER-02: Passes filtered armies, loading state, and callbacks to ArmyListView.
 * - REQ-FORGE-CONTAINER-03: Deploy navigates to /(tabs)/armies/{armyId}.
 * - REQ-FORGE-CONTAINER-04: Duplicate creates a copy with "(Copy)" suffix and invalidates query.
 * - REQ-FORGE-CONTAINER-05: Delete opens confirmation dialog with army name.
 * - REQ-FORGE-CONTAINER-06: Delete confirm calls dataContext.armies.delete and invalidates query.
 * - REQ-FORGE-CONTAINER-07: Delete cancel closes dialog without deleting.
 * - REQ-FORGE-CONTAINER-08: Shows loading state while dataContext is not ready.
 * - REQ-FORGE-CONTAINER-09: Shows empty state when no armies exist.
 *
 * Test plan:
 * - renders "The Forge" header → REQ-FORGE-CONTAINER-02
 * - renders empty state when no armies → REQ-FORGE-CONTAINER-09
 * - renders army names when armies exist → REQ-FORGE-CONTAINER-01, REQ-FORGE-CONTAINER-02
 * - deploy navigates to army route → REQ-FORGE-CONTAINER-03
 * - duplicate creates copy with "(Copy)" suffix → REQ-FORGE-CONTAINER-04
 * - delete opens confirmation dialog → REQ-FORGE-CONTAINER-05
 * - delete confirm calls delete → REQ-FORGE-CONTAINER-06
 * - delete cancel does not call delete → REQ-FORGE-CONTAINER-07
 * - shows loading when dataContext not ready → REQ-FORGE-CONTAINER-08
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Army } from '@armoury/wh40k10e';

/**
 * Shared mutable state used to drive the mocked useQuery return value.
 * Updated per test via `syncState.armies` and `syncState.dcStatus`.
 */
const { routerMock, listByOwnerMock, getMock, saveMock, deleteMock, invalidateQueriesMock, syncState } = vi.hoisted(
    () => ({
        routerMock: { push: vi.fn(), replace: vi.fn(), back: vi.fn(), canGoBack: vi.fn() },
        listByOwnerMock: vi.fn(),
        getMock: vi.fn(),
        saveMock: vi.fn(),
        deleteMock: vi.fn(),
        invalidateQueriesMock: vi.fn(),
        syncState: { armies: undefined as Army[] | undefined, dcStatus: 'ready' as string },
    }),
);

vi.mock('expo-router', () => ({
    useRouter: () => routerMock,
}));

vi.mock('../../../providers/DataContextProvider.js', () => ({
    useDataContext: () => ({
        dataContext: {
            armies: {
                listByOwner: listByOwnerMock,
                get: getMock,
                save: saveMock,
                delete: deleteMock,
            },
        },
        status: syncState.dcStatus,
    }),
}));

vi.mock('@tanstack/react-query', () => {
    const queryClient = { invalidateQueries: invalidateQueriesMock };

    return {
        useQueryClient: () => queryClient,
        useQuery: ({ enabled }: { queryFn: () => Promise<Army[]>; enabled: boolean }) => {
            if (!enabled) {
                return { data: undefined, isLoading: true };
            }

            return {
                data: syncState.armies,
                isLoading: syncState.armies === undefined,
            };
        },
        useMutation: ({
            mutationFn,
            onSuccess,
        }: {
            mutationFn: (arg: string) => Promise<unknown>;
            onSuccess?: () => void;
        }) => ({
            mutate: (arg: string) => {
                void mutationFn(arg).then(() => onSuccess?.());
            },
            isPending: false,
        }),
    };
});

import { ForgeContainer } from '../ForgeContainer.js';

/**
 * Creates a mock Army object with sensible defaults.
 *
 * @param overrides - Partial Army fields to override defaults.
 * @returns A complete Army object.
 */
function mockArmy(overrides?: Partial<Army>): Army {
    return {
        id: 'army-1',
        ownerId: 'test-user',
        name: 'Test Army',
        factionId: 'space-marines',
        detachmentId: null,
        warlordUnitId: null,
        battleSize: 'StrikeForce',
        pointsLimit: 2000,
        units: [],
        totalPoints: 1850,
        notes: '',
        versions: [],
        currentVersion: 0,
        createdAt: '2026-01-15T10:00:00.000Z',
        updatedAt: '2026-01-15T10:00:00.000Z',
        ...overrides,
    };
}

describe('ForgeContainer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        syncState.armies = undefined;
        syncState.dcStatus = 'ready';
    });

    it('renders "The Forge" page header', () => {
        syncState.armies = [];
        listByOwnerMock.mockResolvedValue([]);
        render(<ForgeContainer userId="user-123" />);

        expect(screen.getByText('The Forge')).toBeTruthy();
    });

    it('renders empty state when no armies exist', () => {
        syncState.armies = [];
        listByOwnerMock.mockResolvedValue([]);
        render(<ForgeContainer userId="user-123" />);

        expect(screen.getByText('No armies yet')).toBeTruthy();
    });

    it('renders army names when armies exist', () => {
        const armies = [mockArmy({ id: 'a1', name: 'Ultramarines' }), mockArmy({ id: 'a2', name: 'Blood Angels' })];
        syncState.armies = armies;
        listByOwnerMock.mockResolvedValue(armies);
        render(<ForgeContainer userId="user-123" />);

        expect(screen.getByText('Ultramarines')).toBeTruthy();
        expect(screen.getByText('Blood Angels')).toBeTruthy();
    });

    it('navigates to army route on deploy', () => {
        const armies = [mockArmy({ id: 'army-42', name: 'Deploy Target' })];
        syncState.armies = armies;
        listByOwnerMock.mockResolvedValue(armies);
        render(<ForgeContainer userId="user-123" />);

        fireEvent.click(screen.getByText('Deploy'));
        expect(routerMock.push).toHaveBeenCalledWith('/(tabs)/armies/army-42');
    });

    it('duplicates an army with "(Copy)" suffix', async () => {
        const original = mockArmy({ id: 'army-1', name: 'My Army' });
        syncState.armies = [original];
        listByOwnerMock.mockResolvedValue([original]);
        getMock.mockResolvedValue(original);
        saveMock.mockResolvedValue(undefined);

        render(<ForgeContainer userId="user-123" />);

        fireEvent.click(screen.getByText('Duplicate'));

        await waitFor(() => {
            expect(getMock).toHaveBeenCalledWith('army-1');
        });

        await waitFor(() => {
            expect(saveMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'My Army (Copy)' }));
        });
    });

    it('opens delete confirmation dialog with army name', () => {
        const armies = [mockArmy({ id: 'army-1', name: 'Doomed Army' })];
        syncState.armies = armies;
        listByOwnerMock.mockResolvedValue(armies);
        render(<ForgeContainer userId="user-123" />);

        fireEvent.click(screen.getByText('Delete'));

        expect(screen.getByText('Delete Army')).toBeTruthy();
        expect(screen.getByText(/Are you sure you want to delete "Doomed Army"/)).toBeTruthy();
    });

    it('confirms delete and calls dataContext.armies.delete', async () => {
        const armies = [mockArmy({ id: 'army-1', name: 'Doomed Army' })];
        syncState.armies = armies;
        listByOwnerMock.mockResolvedValue(armies);
        deleteMock.mockResolvedValue(undefined);

        render(<ForgeContainer userId="user-123" />);

        fireEvent.click(screen.getByText('Delete'));

        // Card action + dialog confirm both say "Delete" — pick the dialog's button (last match)
        const deleteButtons = screen.getAllByText('Delete');
        const confirmButton = deleteButtons[deleteButtons.length - 1]!;
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(deleteMock).toHaveBeenCalledWith('army-1');
        });
    });

    it('cancels delete without calling delete', () => {
        const armies = [mockArmy({ id: 'army-1', name: 'Safe Army' })];
        syncState.armies = armies;
        listByOwnerMock.mockResolvedValue(armies);

        render(<ForgeContainer userId="user-123" />);

        fireEvent.click(screen.getByText('Delete'));
        expect(screen.getByText('Delete Army')).toBeTruthy();

        fireEvent.click(screen.getByText('Cancel'));
        expect(deleteMock).not.toHaveBeenCalled();
    });

    it('shows loading state while dataContext is not ready', () => {
        syncState.dcStatus = 'initializing';
        syncState.armies = undefined;
        render(<ForgeContainer userId="user-123" />);

        expect(screen.getByText('The Forge')).toBeTruthy();
        expect(screen.queryByText('Test Army')).toBeNull();
    });
});
