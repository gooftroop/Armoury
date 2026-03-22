/**
 * ArmyListView component tests.
 *
 * @requirements
 * - REQ-LIST-01: Renders cards for armies and forwards action callbacks.
 * - REQ-LIST-02: Shows loading skeletons and empty states.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import { ArmyListView } from '../ArmyListView.js';
import { DEFAULT_FORGE_FILTERS } from '../ArmyFilterPanel.js';
import { makeArmy } from './fixtures.js';

vi.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

vi.mock('next/link', () => ({
    default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock('@/components/shared/index.js', () => ({
    ArmyCardSkeleton: () => <div data-testid="army-card-skeleton" />,
    EmptyState: ({ title, description, action }: { title: string; description?: string; action?: ReactNode }) => (
        <div>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
            {action}
        </div>
    ),
}));

vi.mock('@/components/forge/ArmyFilterPanel.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../ArmyFilterPanel.js')>();

    return {
        ...actual,
        ArmyFilterPanel: ({ factionIds }: { factionIds: string[] }) => <div>{factionIds.join(',')}</div>,
    };
});

vi.mock('@/components/forge/ArmyCard.js', () => ({
    ArmyCard: ({
        army,
        onDeploy,
        onDuplicate,
        onDelete,
    }: {
        army: { name: string };
        onDeploy: () => void;
        onDuplicate: () => void;
        onDelete: () => void;
    }) => (
        <article>
            <h3>{army.name}</h3>
            <button onClick={onDeploy} type="button">
                deploy-card
            </button>
            <button onClick={onDuplicate} type="button">
                duplicate-card
            </button>
            <button onClick={onDelete} type="button">
                delete-card
            </button>
        </article>
    ),
}));

describe('ArmyListView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders army cards and forwards callbacks', async () => {
        const user = userEvent.setup();
        const onDeploy = vi.fn();
        const onDuplicate = vi.fn();
        const onDelete = vi.fn();

        render(
            <ArmyListView
                armies={[makeArmy({ id: 'a-1', name: 'Alpha' })]}
                isLoading={false}
                isEmpty={false}
                filters={DEFAULT_FORGE_FILTERS}
                onFilterChange={vi.fn()}
                factionIds={['space-marines']}
                onDeploy={onDeploy}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
            />,
        );

        expect(screen.getByRole('heading', { name: 'Alpha' })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'deploy-card' }));
        await user.click(screen.getByRole('button', { name: 'duplicate-card' }));
        await user.click(screen.getByRole('button', { name: 'delete-card' }));

        expect(onDeploy).toHaveBeenCalledWith('a-1');
        expect(onDuplicate).toHaveBeenCalledWith('a-1');
        expect(onDelete).toHaveBeenCalledWith('a-1');
    });

    it('shows loading skeletons while loading', () => {
        const { container } = render(
            <ArmyListView
                armies={[]}
                isLoading={true}
                isEmpty={false}
                filters={DEFAULT_FORGE_FILTERS}
                onFilterChange={vi.fn()}
                factionIds={[]}
                onDeploy={vi.fn()}
                onDuplicate={vi.fn()}
                onDelete={vi.fn()}
            />,
        );

        const skeletons = container.querySelectorAll('[data-testid="army-card-skeleton"]');
        expect(skeletons.length).toBe(4);
    });

    it('shows empty state when no armies exist', () => {
        render(
            <ArmyListView
                armies={[]}
                isLoading={false}
                isEmpty={true}
                filters={DEFAULT_FORGE_FILTERS}
                onFilterChange={vi.fn()}
                factionIds={[]}
                onDeploy={vi.fn()}
                onDuplicate={vi.fn()}
                onDelete={vi.fn()}
            />,
        );

        expect(screen.getByRole('heading', { name: 'emptyState.title' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'emptyState.action' })).toHaveAttribute('href', './armies/new');
    });
});
