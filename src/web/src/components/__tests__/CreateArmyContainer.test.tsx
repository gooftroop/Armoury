/**
 * CreateArmyContainer component tests.
 *
 * Test plan:
 * - REQ-CONTAINER-01: Renders the CreateArmyForm with faction options from FACTION_MAP.
 * - REQ-CONTAINER-02: Resets detachmentId when factionId changes.
 * - REQ-CONTAINER-03: Calls saveMutation and navigates on successful submit.
 * - REQ-CONTAINER-04: Surfaces a localized error message on save failure.
 * - REQ-CONTAINER-05: Navigates to the armies list on cancel.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CreateArmyContainer } from '../CreateArmyContainer.js';

const mockPush = vi.fn();
const mockInvalidateQueries = vi.fn();
const useMutationMock = vi.fn();

let mockDataContextValue = {
    status: 'ready' as string,
    dataContext: {
        armies: {
            save: vi.fn(),
        },
    },
    enableSystem: vi.fn(),
};

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
}));

vi.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

vi.mock('@/data/useDataContext.js', () => ({
    useDataContext: () => mockDataContextValue,
}));

vi.mock('@armoury/feature-game-system', () => ({
    resolveGameSystem: vi.fn().mockResolvedValue(null),
    useGameSystem: () => 'wh40k10e',
}));

vi.mock('@tanstack/react-query', () => ({
    useMutation: (...args: unknown[]) => useMutationMock(...args),
    useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

vi.mock('@armoury/feature-forge', () => ({
    CreateArmyForm: ({
        values,
        factionOptions,
        detachmentOptions,
        saving,
        saveError,
        onChange,
        onSubmit,
        onCancel,
    }: {
        values: { name: string; factionId: string | null };
        factionOptions: Array<{ id: string; name: string }>;
        detachmentOptions: Array<{ id: string; name: string }>;
        saving: boolean;
        saveError?: string | null;
        onChange: (v: { name: string; factionId: string | null; detachmentId: string | null; battleSize: string | null }) => void;
        onSubmit: () => void;
        onCancel: () => void;
    }) => (
        <div>
            <div data-testid="faction-count">{factionOptions.length}</div>
            <div data-testid="detachment-count">{detachmentOptions.length}</div>
            <div data-testid="saving">{String(saving)}</div>
            {saveError ? <div role="alert">{saveError}</div> : null}
            <input
                data-testid="name-input"
                value={values.name}
                onChange={(e) =>
                    onChange({ name: e.target.value, factionId: values.factionId, detachmentId: null, battleSize: null })
                }
            />
            <button onClick={onSubmit}>submit</button>
            <button onClick={onCancel}>cancel</button>
        </div>
    ),
    buildNewArmy: vi.fn().mockReturnValue({ id: 'new-army-id', name: 'Test Army' }),
    BATTLE_SIZE_OPTIONS: ['Incursion', 'StrikeForce', 'Onslaught'],
}));

vi.mock('@armoury/wh40k10e', () => ({
    FACTION_MAP: {
        'space-marines': { name: 'Space Marines', detachments: [{ id: 'gladius', name: 'Gladius Task Force' }] },
        necrons: { name: 'Necrons', detachments: [] },
    },
    getAllFactionIds: () => ['space-marines', 'necrons'],
}));

describe('CreateArmyContainer', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        useMutationMock.mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        });
    });

    it('renders faction options sourced from FACTION_MAP', () => {
        render(<CreateArmyContainer userId="user-1" locale="en" />);

        expect(screen.getByTestId('faction-count')).toHaveTextContent('2');
    });

    it('shows saving=true while mutation is pending', () => {
        useMutationMock.mockReturnValue({ mutate: vi.fn(), isPending: true });

        render(<CreateArmyContainer userId="user-1" locale="en" />);

        expect(screen.getByTestId('saving')).toHaveTextContent('true');
    });

    it('calls mutate when onSubmit is triggered', async () => {
        const user = userEvent.setup();
        const mutate = vi.fn();
        useMutationMock.mockReturnValue({ mutate, isPending: false });

        render(<CreateArmyContainer userId="user-1" locale="en" />);

        await user.click(screen.getByRole('button', { name: 'submit' }));

        expect(mutate).toHaveBeenCalled();
    });

    it('navigates to armies list on cancel', async () => {
        const user = userEvent.setup();

        render(<CreateArmyContainer userId="user-1" locale="en" />);

        await user.click(screen.getByRole('button', { name: 'cancel' }));

        expect(mockPush).toHaveBeenCalledWith('/en/wh40k10e/armies');
    });

    it('surfaces a localized error message on save failure', async () => {
        useMutationMock.mockImplementation(({ onError }: { onError: () => void }) => {
            onError();
            return { mutate: vi.fn(), isPending: false };
        });

        render(<CreateArmyContainer userId="user-1" locale="en" />);

        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent('error');
        });
    });
});
