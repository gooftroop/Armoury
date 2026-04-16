/**
 * SystemAutoRestore tests.
 *
 * @requirements
 * | Requirement ID | Requirement | Test Case(s) |
 * | --- | --- | --- |
 * | REQ-SAR-01 | Component must render no DOM output (null render). | "renders null" |
 * | REQ-SAR-02 | Must call enableSystem when status is idle and resolveGameSystem returns a system. | "calls enableSystem when status is idle and system resolves" |
 * | REQ-SAR-03 | Must not call enableSystem when status is initializing. | "does not call enableSystem when status is initializing" |
 * | REQ-SAR-04 | Must not call enableSystem when status is ready. | "does not call enableSystem when status is ready" |
 * | REQ-SAR-05 | Must not call enableSystem when status is error. | "does not call enableSystem when status is error" |
 * | REQ-SAR-06 | Must not call enableSystem when resolveGameSystem returns null for idle status. | "does not call enableSystem when system cannot be resolved" |
 * | REQ-SAR-07 | Must call enableSystem again when status returns to idle after a non-idle status. | "calls enableSystem again when status returns to idle" |
 * | REQ-SAR-08 | Must call resolveGameSystem with the provided systemId. | "uses the provided systemId in resolveGameSystem" |
 */

import type { ReactElement, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SystemAutoRestore } from '../SystemAutoRestore.js';

type DataContextStatus = 'idle' | 'initializing' | 'ready' | 'error';

const { mockEnableSystem, mockUseDataContext, mockResolveGameSystem, mockUseEffect } = vi.hoisted(() => ({
    mockEnableSystem: vi.fn(),
    mockUseDataContext: vi.fn(),
    mockResolveGameSystem: vi.fn(),
    mockUseEffect: vi.fn(),
}));

vi.mock('react', async () => {
    const actual = await vi.importActual<typeof import('react')>('react');

    return {
        ...actual,
        useEffect: mockUseEffect,
    };
});

vi.mock('@/providers/DataContextProvider.js', () => ({
    useDataContext: mockUseDataContext,
}));

vi.mock('@/lib/resolveGameSystem.js', () => ({
    resolveGameSystem: mockResolveGameSystem,
}));

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
    return MockDataContextProvider({ children: SystemAutoRestore({ systemId }) });
}

describe('SystemAutoRestore', () => {
    const resolvedSystem = { id: 'wh40k10e' };

    const flushPromises = async (): Promise<void> => {
        await Promise.resolve();
        await Promise.resolve();
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseDataContext.mockReturnValue({ status: 'idle', enableSystem: mockEnableSystem });
        mockResolveGameSystem.mockResolvedValue(resolvedSystem);
        mockUseEffect.mockImplementation((effect: () => void) => {
            effect();
        });
    });

    it('renders null', () => {
        expect(Harness({ systemId: 'wh40k10e' })).toBeNull();
    });

    it('calls enableSystem when status is idle and system resolves', async () => {
        Harness({ systemId: 'wh40k10e' });

        await flushPromises();

        expect(mockResolveGameSystem).toHaveBeenCalledWith('wh40k10e');
        expect(mockEnableSystem).toHaveBeenCalledWith(resolvedSystem);
    });

    it('does not call enableSystem when status is initializing', async () => {
        mockUseDataContext.mockReturnValue({
            status: 'initializing' as DataContextStatus,
            enableSystem: mockEnableSystem,
        });

        Harness({ systemId: 'wh40k10e' });

        await flushPromises();

        expect(mockEnableSystem).not.toHaveBeenCalled();
        expect(mockResolveGameSystem).not.toHaveBeenCalled();
    });

    it('does not call enableSystem when status is ready', async () => {
        mockUseDataContext.mockReturnValue({ status: 'ready' as DataContextStatus, enableSystem: mockEnableSystem });

        Harness({ systemId: 'wh40k10e' });

        await flushPromises();

        expect(mockEnableSystem).not.toHaveBeenCalled();
        expect(mockResolveGameSystem).not.toHaveBeenCalled();
    });

    it('does not call enableSystem when status is error', async () => {
        mockUseDataContext.mockReturnValue({ status: 'error' as DataContextStatus, enableSystem: mockEnableSystem });

        Harness({ systemId: 'wh40k10e' });

        await flushPromises();

        expect(mockEnableSystem).not.toHaveBeenCalled();
        expect(mockResolveGameSystem).not.toHaveBeenCalled();
    });

    it('does not call enableSystem when system cannot be resolved', async () => {
        mockResolveGameSystem.mockResolvedValue(null);

        Harness({ systemId: 'unknown-system' });

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
        }));

        Harness({ systemId: 'wh40k10e' });
        await flushPromises();
        Harness({ systemId: 'wh40k10e' });
        await flushPromises();
        Harness({ systemId: 'wh40k10e' });
        await flushPromises();

        expect(mockEnableSystem).toHaveBeenCalledTimes(2);
    });

    it('uses the provided systemId in resolveGameSystem', async () => {
        Harness({ systemId: 'ageofsigmar4e' });

        await flushPromises();

        expect(mockResolveGameSystem).toHaveBeenCalledWith('ageofsigmar4e');
    });

    it('re-resolves and re-enables when systemId changes while idle', async () => {
        Harness({ systemId: 'wh40k10e' });
        await flushPromises();
        Harness({ systemId: 'horusheresy2e' });
        await flushPromises();

        expect(mockResolveGameSystem).toHaveBeenCalledWith('horusheresy2e');
        expect(mockEnableSystem).toHaveBeenCalledTimes(2);
    });

    it('uses the latest enableSystem function reference on rerender', async () => {
        const firstEnable = vi.fn();
        const secondEnable = vi.fn();

        mockUseDataContext
            .mockReturnValueOnce({ status: 'idle', enableSystem: firstEnable })
            .mockReturnValueOnce({ status: 'idle', enableSystem: secondEnable });

        Harness({ systemId: 'wh40k10e' });
        await flushPromises();
        Harness({ systemId: 'wh40k10e' });
        await flushPromises();

        expect(firstEnable).toHaveBeenCalledTimes(1);
        expect(secondEnable).toHaveBeenCalledTimes(1);
    });
});
