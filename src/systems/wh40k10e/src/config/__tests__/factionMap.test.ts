import { describe, it, expect } from 'vitest';
import { FACTION_MAP, getAllFactionIds, getFactionConfig } from '@wh40k10e/config/factionMap.js';

/** Defines the faction map test suite. */
const factionMapSuite = () => {
    /** Ensures the faction map contains known faction keys. */
    const verifiesFactionMapKeys = () => {
        expect(FACTION_MAP).toHaveProperty('necrons');
        expect(FACTION_MAP).toHaveProperty('space-marines');
        expect(FACTION_MAP).toHaveProperty('aeldari');
    };

    /** Ensures faction configs expose required fields for known factions. */
    const verifiesFactionConfigShape = () => {
        const config = getFactionConfig('necrons');
        expect(config).toBeDefined();
        expect(config?.id).toBe('necrons');
        expect(config?.name).toBe('Necrons');
        expect(Array.isArray(config?.files)).toBe(true);
        expect(config?.files.length).toBeGreaterThan(0);
        expect(config?.superFaction).toBe('Xenos');
    };

    /** Ensures getFactionConfig returns undefined for unknown ids. */
    const rejectsUnknownFactionConfig = () => {
        expect(getFactionConfig('unknown-faction')).toBeUndefined();
    };

    /** Ensures getAllFactionIds returns all keys from the map. */
    const verifiesAllFactionIds = () => {
        const ids = getAllFactionIds();
        expect(ids.length).toBe(Object.keys(FACTION_MAP).length);
        expect(ids).toEqual(expect.arrayContaining(['necrons', 'space-marines', 'aeldari']));
    };

    it('exposes known faction keys', verifiesFactionMapKeys);
    it('returns faction config data for known ids', verifiesFactionConfigShape);
    it('returns undefined for unknown faction ids', rejectsUnknownFactionConfig);
    it('returns all faction ids', verifiesAllFactionIds);
};

describe('faction-map', factionMapSuite);
