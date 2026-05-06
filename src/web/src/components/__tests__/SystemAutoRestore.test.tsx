/**
 * SystemAutoRestore tests.
 *
 * @requirements
 * | Requirement ID | Requirement | Test Case(s) |
 * | --- | --- | --- |
 * | REQ-SAR-01 | Component must render no DOM output (null render). | "renders null" |
 * | REQ-SAR-02 | Must call enableSystem when no sync state exists and provider is idle. | "calls enableSystem when no sync state exists and provider status is idle" |
 * | REQ-SAR-03 | Must not call enableSystem when status is initializing. | "does not call enableSystem when status is initializing" |
 * | REQ-SAR-04 | Must not call enableSystem when status is ready. | "does not call enableSystem when status is ready" |
 * | REQ-SAR-05 | Must not call enableSystem when status is error. | "does not call enableSystem when status is error" |
 * | REQ-SAR-06 | Must not call enableSystem when sync status is pending/checking-staleness/syncing. | "does not call enableSystem when sync state is pending" and "does not call enableSystem when sync state is checking-staleness" and "does not call enableSystem when sync state is syncing" |
 * | REQ-SAR-07 | Must call enableSystem again when status returns to idle after a non-idle status. | "calls enableSystem again when status returns to idle" |
 * | REQ-SAR-08 | Must call resolveGameSystem with the provided systemId. | "uses the provided systemId in resolveGameSystem" |
 * | REQ-SAR-09 | Must not call enableSystem when resolveGameSystem returns null. | "does not call enableSystem when system cannot be resolved" |
 */

import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SystemAutoRestore } from '@armoury/feature-game-system';

type DataContextStatus = 'idle' | 'initializing' | 'ready' | 'error';
type SystemSyncStatus = 'idle' | 'pending' | 'checking-staleness' | 'syncing' | 'synced' | 'error';

const { mockEnableSystem, mockUseDataContext, mockResolveGameSystem } = vi.hoisted(() => ({
    mockEnableSystem: vi.fn(),
    mockUseDataContext: vi.fn(),
    mockResolveGameSystem: vi.fn(),
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

vi.mock('../../../../shared/features/game-system/src/utils/resolveGameSystem.web.js', async () => {
    const actual = await vi.importActual('../../../../shared/features/game-system/src/utils/resolveGameSystem.web.js');

    return {
        ...actual,
        resolveGameSystem: mockResolveGameSystem,
    };
});

vi.mock('@armoury/feature-game-system', async () => {
    const actual = await vi.importActual('@armoury/feature-game-system');
    const source = await vi.importActual('../../../../shared/features/game-system/src/SystemAutoRestore.web.js');

    return {
        ...actual,
        SystemAutoRestore: source.SystemAutoRestore,
    };
});

interface MockDataContextProviderProps {
    readonly children: ReactNode;
}

function MockDataContextProvider({ children }: MockDataContextProviderProps): ReactElement {
    return children as ReactElement;
}

interface HarnessProps {
    readonly systemId: string;
}

function Harness({ systemId }: HarnessProps): ReactElement {
    return MockDataContextProvider({ children: <SystemAutoRestore systemId={systemId} /> });
}

describe('SystemAutoRestore', () => {
    const resolvedSystem = { id: 'wh40k10e' };

    const flushPromises = async (): Promise<void> => {
        await Promise.resolve();
        await Promise.resolve();
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseDataContext.mockReturnValue({
            status: 'idle',
            enableSystem: mockEnableSystem,
            systemSyncStates: {},
        });
        mockResolveGameSystem.mockResolvedValue(resolvedSystem);
    });

    it('renders null', () => {
        const { container } = render(<Harness systemId="wh40k10e" />);

        expect(container).toBeEmptyDOMElement();
    });

    it('calls enableSystem when no sync state exists and provider status is idle', async () => {
        render(<Harness systemId="wh40k10e" />);

        await flushPromises();

        expect(mockResolveGameSystem).toHaveBeenCalledWith('wh40k10e');
        expect(mockEnableSystem).toHaveBeenCalledWith(resolvedSystem);
    });

    it('does not call enableSystem when status is initializing', async () => {
        mockUseDataContext.mockReturnValue({
            status: 'initializing' as DataContextStatus,
            enableSystem: mockEnableSystem,
            systemSyncStates: {},
        });

        render(<Harness systemId="wh40k10e" />);

        await flushPromises();

        expect(mockEnableSystem).not.toHaveBeenCalled();
        expect(mockResolveGameSystem).not.toHaveBeenCalled();
    });

    it('does not call enableSystem when status is ready', async () => {
        mockUseDataContext.mockReturnValue({
            status: 'ready' as DataContextStatus,
            enableSystem: mockEnableSystem,
            systemSyncStates: {},
        });

        render(<Harness systemId="wh40k10e" />);

        await flushPromises();

        expect(mockEnableSystem).not.toHaveBeenCalled();
        expect(mockResolveGameSystem).not.toHaveBeenCalled();
    });

    it('does not call enableSystem when status is error', async () => {
        mockUseDataContext.mockReturnValue({
            status: 'error' as DataContextStatus,
            enableSystem: mockEnableSystem,
            systemSyncStates: {},
        });

        render(<Harness systemId="wh40k10e" />);

        await flushPromises();

        expect(mockEnableSystem).not.toHaveBeenCalled();
        expect(mockResolveGameSystem).not.toHaveBeenCalled();
    });

    it('does not call enableSystem when system cannot be resolved', async () => {
        mockResolveGameSystem.mockResolvedValue(null);

        render(<Harness systemId="unknown-system" />);

        await flushPromises();

        expect(mockResolveGameSystem).toHaveBeenCalledWith('unknown-system');
        expect(mockEnableSystem).not.toHaveBeenCalled();
    });

    it('calls enableSystem again when status returns to idle', async () => {
        const statuses: DataContextStatus[] = ['idle', 'ready', 'idle'];
        let invocationIndex = 0;
        mockUseDataContext.mockImplementation(() => ({
            status: statuses[Math.min(invocationIndex++, statuses.length - 1)],
            enableSystem: mockEnableSystem,
            systemSyncStates: {},
        }));

        const { rerender } = render(<Harness systemId="wh40k10e" />);
        await flushPromises();
        rerender(<Harness systemId="wh40k10e" />);
        await flushPromises();
        rerender(<Harness systemId="wh40k10e" />);
        await flushPromises();

        expect(mockEnableSystem).toHaveBeenCalledTimes(2);
    });

    it('uses the provided systemId in resolveGameSystem', async () => {
        render(<Harness systemId="ageofsigmar4e" />);

        await flushPromises();

        expect(mockResolveGameSystem).toHaveBeenCalledWith('ageofsigmar4e');
    });

    it('re-resolves and re-enables when systemId changes while idle', async () => {
        const { rerender } = render(<Harness systemId="wh40k10e" />);
        await flushPromises();
        rerender(<Harness systemId="horusheresy2e" />);
        await flushPromises();

        expect(mockResolveGameSystem).toHaveBeenCalledWith('horusheresy2e');
        expect(mockEnableSystem).toHaveBeenCalledTimes(2);
    });

    it('uses the latest enableSystem function reference on rerender', async () => {
        const firstEnable = vi.fn();
        const secondEnable = vi.fn();

        mockUseDataContext
            .mockReturnValueOnce({ status: 'idle', enableSystem: firstEnable, systemSyncStates: {} })
            .mockReturnValueOnce({ status: 'idle', enableSystem: secondEnable, systemSyncStates: {} });

        const { rerender } = render(<Harness systemId="wh40k10e" />);
        await flushPromises();
        rerender(<Harness systemId="wh40k10e" />);
        await flushPromises();

        expect(firstEnable).toHaveBeenCalledTimes(1);
        expect(secondEnable).toHaveBeenCalledTimes(1);
    });

    it.each<SystemSyncStatus>(['pending', 'checking-staleness', 'syncing'])(
        'does not call enableSystem when sync state is %s',
        async (syncStatus) => {
            mockUseDataContext.mockReturnValue({
                status: 'idle',
                enableSystem: mockEnableSystem,
                systemSyncStates: {
                    wh40k10e: { status: syncStatus },
                },
            });

            render(<Harness systemId="wh40k10e" />);

            await flushPromises();

            expect(mockEnableSystem).not.toHaveBeenCalled();
            expect(mockResolveGameSystem).not.toHaveBeenCalled();
        },
    );
});
