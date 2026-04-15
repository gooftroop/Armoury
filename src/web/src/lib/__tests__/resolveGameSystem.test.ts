/**
 * resolveGameSystem unit tests.
 *
 * @requirements
 * - REQ-WEB-RGS-01: getKnownSystemIds returns the known system IDs.
 * - REQ-WEB-RGS-02: resolveGameSystem resolves known IDs via dynamic imports.
 * - REQ-WEB-RGS-03: resolveGameSystem returns null for unknown IDs.
 * - REQ-WEB-RGS-04: resolveGameSystem returns null for empty IDs.
 */

import { describe, expect, it, vi } from 'vitest';

import { getKnownSystemIds, resolveGameSystem } from '../resolveGameSystem.js';

const { wh40k10eSystemMock } = vi.hoisted(() => ({
    wh40k10eSystemMock: {
        id: 'wh40k10e',
        getSyncFileKeyPrefixes: () => ['core:'],
    },
}));

vi.mock('@armoury/wh40k10e/system', () => ({
    wh40k10eSystem: wh40k10eSystemMock,
}));

describe('resolveGameSystem', () => {
    it('getKnownSystemIds returns readonly array containing wh40k10e', () => {
        const ids = getKnownSystemIds();

        expect(ids).toEqual(['wh40k10e']);
        expect(ids).toContain('wh40k10e');
    });

    it('resolveGameSystem resolves wh40k10e to the system instance', async () => {
        const result = await resolveGameSystem('wh40k10e');

        expect(result).toBe(wh40k10eSystemMock);
    });

    it('resolveGameSystem returns null for unknown system ID', async () => {
        const result = await resolveGameSystem('unknown');

        expect(result).toBeNull();
    });

    it('resolveGameSystem returns null for empty string', async () => {
        const result = await resolveGameSystem('');

        expect(result).toBeNull();
    });
});
