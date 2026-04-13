/**
 * ForgeContainer component tests.
 *
 * @requirements
 * - REQ-CONTAINER-01: Wires query data and loading state into ArmyListView.
 * - REQ-CONTAINER-02: Handles deploy, duplicate, and delete confirmation flows.
 * - REQ-CONTAINER-03: Auto-enables game system when DataContext is idle.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ForgeContainer } from '../ForgeContainer.js';
import { makeArmy } from './fixtures.js';

const mockPush = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockDuplicateMutate = vi.fn();
const mockDeleteMutate = vi.fn();
const useQueryMock = vi.fn();
const useMutationMock = vi.fn();
const mockEnableSystem = vi.fn();
const mockResolveGameSystem = vi.fn();

let mockDataContextValue = {
    status: 'ready' as string,
    dataContext: {
        armies: {
            listByOwner: vi.fn(),
            get: vi.fn(),
            save: vi.fn(),
            delete: vi.fn(),
        },
    },
    enableSystem: mockEnableSystem,
};

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
    usePathname: () => '/en/wh40k10e/armies',
}));

vi.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

vi.mock('@/providers/DataContextProvider.js', () => ({
    useDataContext: () => mockDataContextValue,
}));

vi.mock('@/lib/resolveGameSystem.js', () => ({
    resolveGameSystem: (...args: unknown[]) => mockResolveGameSystem(...args),
}));

vi.mock('@tanstack/react-query', () => ({
    useQuery: (...args: unknown[]) => useQueryMock(...args),
    useMutation: (...args: unknown[]) => useMutationMock(...args),
    useQueryClient: () => ({
        invalidateQueries: mockInvalidateQueries,
    }),
}));

vi.mock('@/components/forge/ArmyListView.js', () => ({
    ArmyListView: ({
        armies,
        isLoading,
        onDeploy,
        onDuplicate,
        onDelete,
    }: {
        armies: Array<{ id: string; name: string }>;
        isLoading: boolean;
        onDeploy: (id: string) => void;
        onDuplicate: (id: string) => void;
        onDelete: (id: string) => void;
    }) => (
        <div>
            <div>loading:{String(isLoading)}</div>
            {armies.map((army) => (
                <button key={army.id} onClick={() => onDeploy(army.id)} type="button">
                    deploy-{army.name}
                </button>
            ))}
            {armies.map((army) => (
                <button key={`dup-${army.id}`} onClick={() => onDuplicate(army.id)} type="button">
                    duplicate-{army.name}
                </button>
            ))}
            {armies.map((army) => (
                <button key={`del-${army.id}`} onClick={() => onDelete(army.id)} type="button">
                    delete-{army.name}
                </button>
            ))}
        </div>
    ),
}));

vi.mock('@/components/shared/index.js', () => ({
    ConfirmDialog: ({
        open,
        onOpenChange,
        onConfirm,
        title,
        description,
    }: {
        open: boolean;
        onOpenChange: (open: boolean) => void;
        onConfirm: () => void;
        title: string;
        description: string;
    }) => (
        <div>
            <div>confirm-open:{String(open)}</div>
            <div>{title}</div>
            <div>{description}</div>
            <button onClick={() => onOpenChange(false)} type="button">
                close-confirm
            </button>
            <button onClick={onConfirm} type="button">
                confirm-delete
            </button>
        </div>
    ),
}));

describe('ForgeContainer', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockDataContextValue = {
            status: 'ready',
            dataContext: {
                armies: {
                    listByOwner: vi.fn(),
                    get: vi.fn(),
                    save: vi.fn(),
                    delete: vi.fn(),
                },
            },
            enableSystem: mockEnableSystem,
        };

        useQueryMock.mockReturnValue({
            data: [makeArmy({ id: 'a-1', name: 'Alpha' })],
            isLoading: false,
        });

        useMutationMock.mockImplementation((options: { mutationFn: (...args: unknown[]) => unknown }) => {
            // Identify mutations by inspecting the function body rather than call order.
            // The delete mutation calls dataContext.armies.delete; the duplicate calls armies.save.
            const fnBody = options.mutationFn.toString();
            const isDeleteMutation = fnBody.includes('.delete(');

            return { mutate: isDeleteMutation ? mockDeleteMutate : mockDuplicateMutate };
        });

        mockResolveGameSystem.mockResolvedValue(null);
    });

    it('passes query data to list view and supports deploy navigation', async () => {
        const user = userEvent.setup();

        render(<ForgeContainer userId="user-1" />);

        expect(screen.getByText('loading:false')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'deploy-Alpha' }));

        expect(mockPush).toHaveBeenCalledWith('./armies/a-1');
    });

    it('triggers duplicate mutation from list action', async () => {
        const user = userEvent.setup();

        render(<ForgeContainer userId="user-1" />);

        await user.click(screen.getByRole('button', { name: 'duplicate-Alpha' }));

        expect(mockDuplicateMutate).toHaveBeenCalledWith('a-1');
    });

    it('opens confirm dialog and confirms delete mutation', async () => {
        const user = userEvent.setup();

        render(<ForgeContainer userId="user-1" />);

        expect(screen.getByText('confirm-open:false')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'delete-Alpha' }));

        expect(screen.getByText('confirm-open:true')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'confirm-delete' }));

        expect(mockDeleteMutate).toHaveBeenCalledWith('a-1');
    });

    describe('auto-enable game system', () => {
        it('calls enableSystem when DataContext status is idle', async () => {
            const fakeSystem = { id: 'wh40k10e' };

            mockResolveGameSystem.mockResolvedValue(fakeSystem);
            mockDataContextValue.status = 'idle';

            render(<ForgeContainer userId="user-1" />);

            await waitFor(() => {
                expect(mockResolveGameSystem).toHaveBeenCalledWith('wh40k10e');
            });

            await waitFor(() => {
                expect(mockEnableSystem).toHaveBeenCalledWith(fakeSystem);
            });
        });

        it('does not call enableSystem when DataContext status is ready', () => {
            mockDataContextValue.status = 'ready';

            render(<ForgeContainer userId="user-1" />);

            expect(mockResolveGameSystem).not.toHaveBeenCalled();
            expect(mockEnableSystem).not.toHaveBeenCalled();
        });

        it('does not call enableSystem when resolveGameSystem returns null', async () => {
            mockResolveGameSystem.mockResolvedValue(null);
            mockDataContextValue.status = 'idle';

            render(<ForgeContainer userId="user-1" />);

            await waitFor(() => {
                expect(mockResolveGameSystem).toHaveBeenCalledWith('wh40k10e');
            });

            expect(mockEnableSystem).not.toHaveBeenCalled();
        });
    });
});
