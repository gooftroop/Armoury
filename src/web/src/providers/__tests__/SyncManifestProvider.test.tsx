/**
 * SyncManifestProvider tests (web).
 *
 * @requirements
 * - REQ-WEB-SMP-01: useSyncManifest throws when called outside SyncManifestProvider.
 * - REQ-WEB-SMP-02: Provider initializes with an empty synced manifest.
 * - REQ-WEB-SMP-03: markSynced records a system and hasSynced reflects membership.
 * - REQ-WEB-SMP-04: syncedSystems lists all marked system IDs.
 * - REQ-WEB-SMP-05: markSynced is idempotent for duplicate system IDs.
 * - REQ-WEB-SMP-06: Manifest is session-scoped and resets on fresh provider mount.
 */

import { createElement, useEffect } from 'react';
import type { ReactElement } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SyncManifestValue } from '../SyncManifestProvider.js';
import { SyncManifestProvider, useSyncManifest } from '../SyncManifestProvider.js';

/**
 * Test plan:
 * - REQ-WEB-SMP-01 -> "throws when useSyncManifest is called outside provider"
 * - REQ-WEB-SMP-02 -> "starts with empty syncedSystems and hasSynced false"
 * - REQ-WEB-SMP-03 -> "markSynced updates membership and hasSynced results"
 * - REQ-WEB-SMP-04 -> "syncedSystems reflects all marked IDs"
 * - REQ-WEB-SMP-05 -> "marking same ID twice does not duplicate syncedSystems"
 * - REQ-WEB-SMP-06 -> "fresh provider mount starts with empty session manifest"
 */

interface ManifestHarness {
    getValue: () => SyncManifestValue;
    unmount: () => void;
}

interface TestConsumerProps {
    onValue: (value: SyncManifestValue) => void;
}

function TestConsumer({ onValue }: TestConsumerProps): ReactElement {
    const value = useSyncManifest();

    useEffect(() => {
        onValue(value);
    });

    return createElement('span', null, 'sync-manifest-harness');
}

function OutsideConsumer(): ReactElement {
    useSyncManifest();

    return createElement('span', null, 'outside');
}

function renderManifestHarness(): ManifestHarness {
    let latestValue: SyncManifestValue | null = null;

    const rendered = render(
        createElement(
            SyncManifestProvider,
            null,
            createElement(TestConsumer, {
                onValue: (value) => {
                    latestValue = value;
                },
            }),
        ),
    );

    return {
        getValue: (): SyncManifestValue => {
            if (latestValue === null) {
                throw new Error('SyncManifestValue has not been initialized yet.');
            }

            return latestValue;
        },
        unmount: rendered.unmount,
    };
}

describe('SyncManifestProvider (web)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('throws when useSyncManifest is called outside provider', () => {
        expect(() => render(createElement(OutsideConsumer))).toThrow(
            'useSyncManifest must be used within a SyncManifestProvider',
        );
    });

    it('starts with empty syncedSystems and hasSynced false', async () => {
        const harness = renderManifestHarness();

        expect(screen.getByText('sync-manifest-harness')).toBeInTheDocument();

        await waitFor(() => {
            expect(harness.getValue().syncedSystems).toStrictEqual([]);
            expect(harness.getValue().hasSynced('wh40k10e')).toBe(false);
            expect(harness.getValue().hasSynced('other')).toBe(false);
        });
    });

    it('markSynced updates membership and hasSynced results', async () => {
        const harness = renderManifestHarness();

        await act(async () => {
            harness.getValue().markSynced('wh40k10e');
        });

        await waitFor(() => {
            expect(harness.getValue().hasSynced('wh40k10e')).toBe(true);
            expect(harness.getValue().hasSynced('other')).toBe(false);
        });
    });

    it('syncedSystems reflects all marked IDs', async () => {
        const harness = renderManifestHarness();

        await act(async () => {
            harness.getValue().markSynced('wh40k10e');
            harness.getValue().markSynced('aos4e');
        });

        await waitFor(() => {
            expect(harness.getValue().syncedSystems).toStrictEqual(expect.arrayContaining(['wh40k10e', 'aos4e']));
            expect(harness.getValue().syncedSystems).toHaveLength(2);
        });
    });

    it('marking same ID twice does not duplicate syncedSystems', async () => {
        const harness = renderManifestHarness();

        await act(async () => {
            harness.getValue().markSynced('wh40k10e');
            harness.getValue().markSynced('wh40k10e');
        });

        await waitFor(() => {
            expect(harness.getValue().syncedSystems).toStrictEqual(['wh40k10e']);
        });
    });

    it('fresh provider mount starts with empty session manifest', async () => {
        const firstHarness = renderManifestHarness();

        await act(async () => {
            firstHarness.getValue().markSynced('wh40k10e');
        });

        await waitFor(() => {
            expect(firstHarness.getValue().hasSynced('wh40k10e')).toBe(true);
        });

        firstHarness.unmount();

        const freshHarness = renderManifestHarness();

        await waitFor(() => {
            expect(freshHarness.getValue().syncedSystems).toStrictEqual([]);
            expect(freshHarness.getValue().hasSynced('wh40k10e')).toBe(false);
        });
    });
});
