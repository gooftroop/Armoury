/**
 * ArmyFilterPanel component tests.
 *
 * @requirements
 * - REQ-FILTER-01: Renders filter controls and faction options.
 * - REQ-FILTER-02: Calls onChange with expected filter updates.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

import { ArmyFilterPanel, DEFAULT_FORGE_FILTERS } from '../ArmyFilterPanel.js';

vi.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/ui/index.js', () => ({
    ...(() => {
        const SelectContext = createContext<(value: string) => void>(() => {});

        return {
            Button: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
                <button onClick={onClick} type="button">
                    {children}
                </button>
            ),
            Select: ({ children, onValueChange }: { children: ReactNode; onValueChange?: (value: string) => void }) => (
                <SelectContext.Provider value={onValueChange ?? (() => {})}>{children}</SelectContext.Provider>
            ),
            SelectTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
            SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
            SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
            SelectItem: ({ value, children }: { value: string; children: ReactNode }) => {
                const onValueChange = useContext(SelectContext);

                return (
                    <button data-value={value} onClick={() => onValueChange(value)} type="button">
                        {children}
                    </button>
                );
            },
        };
    })(),
}));

describe('ArmyFilterPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders filter label and faction options when expanded', async () => {
        const user = userEvent.setup();

        render(
            <ArmyFilterPanel
                filters={DEFAULT_FORGE_FILTERS}
                onChange={vi.fn()}
                factionIds={['necrons', 'space-marines']}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'label' }));

        expect(screen.getByText('faction')).toBeInTheDocument();
        expect(screen.getByText('allFactions')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'necrons' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'space-marines' })).toBeInTheDocument();
    });

    it('calls onChange with selected faction value', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(
            <ArmyFilterPanel
                filters={DEFAULT_FORGE_FILTERS}
                onChange={onChange}
                factionIds={['necrons', 'space-marines']}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'label' }));
        await user.click(screen.getByRole('button', { name: 'necrons' }));

        expect(onChange).toHaveBeenCalledWith({
            ...DEFAULT_FORGE_FILTERS,
            factionId: 'necrons',
        });
    });

    it('shows clear button when filters are active and resets filters', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(
            <ArmyFilterPanel
                filters={{ ...DEFAULT_FORGE_FILTERS, factionId: 'necrons' }}
                onChange={onChange}
                factionIds={['necrons']}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'clear' }));

        expect(onChange).toHaveBeenCalledWith(DEFAULT_FORGE_FILTERS);
    });

    it('supports interaction surface through rendered controls', async () => {
        const user = userEvent.setup();

        render(<ArmyFilterPanel filters={DEFAULT_FORGE_FILTERS} onChange={vi.fn()} factionIds={['tau']} />);

        const labelButton = screen.getByRole('button', { name: 'label' });
        fireEvent.click(labelButton);

        const container = labelButton.closest('div');

        expect(container).not.toBeNull();

        if (container) {
            expect(within(container).getByRole('button', { name: 'label' })).toBeInTheDocument();
        }

        await user.click(screen.getByRole('button', { name: 'tau' }));
    });
});
