import type { DatabaseAdapter } from '@data/adapter.js';
import type { IGitHubClient } from '@clients-github/types.js';
import type { FactionData } from '@wh40k10e/models/FactionData.js';
import { FACTION_MAP } from '@wh40k10e/config/factionMap.js';
import { FactionDAO } from '@wh40k10e/dao/FactionDAO.js';

/** DAO for Space Marines faction data. */
export class SpaceMarinesDAO {
    protected readonly factionDAO: FactionDAO;

    /** Creates a Space Marines DAO instance. */
    constructor(adapter: DatabaseAdapter, githubClient: IGitHubClient) {
        this.factionDAO = new FactionDAO(adapter, githubClient, FACTION_MAP['space-marines']);
    }

    /** Loads Space Marines faction data, syncing from BSData if needed. */
    async load(): Promise<FactionData> {
        return this.factionDAO.load();
    }

    /** Forces a re-sync of Space Marines faction data from BSData. */
    async refresh(): Promise<FactionData> {
        return this.factionDAO.refresh();
    }

    /** Merges chapter-specific data onto Space Marines base data. */
    protected mergeFactionData(baseData: FactionData, chapterData: FactionData): FactionData {
        /** Merges arrays by ID with chapter overrides taking precedence. */
        const mergeById = <T extends { id: string }>(base: T[], overrides: T[]): T[] => {
            const merged = new Map<string, T>();

            for (const item of base) {
                merged.set(item.id, item);
            }

            for (const item of overrides) {
                if (merged.has(item.id)) {
                    merged.delete(item.id);
                }

                merged.set(item.id, item);
            }

            return Array.from(merged.values());
        };

        const sourceFiles = Array.from(new Set([...chapterData.sourceFiles, ...baseData.sourceFiles]));
        const lastSynced = new Date(Math.max(baseData.lastSynced.getTime(), chapterData.lastSynced.getTime()));

        return {
            id: chapterData.id,
            name: chapterData.name,
            armyImageUrl: chapterData.armyImageUrl || baseData.armyImageUrl,
            sourceFiles,
            lastSynced,
            factionRules: mergeById(baseData.factionRules, chapterData.factionRules),
            structuredFactionRules: mergeById(baseData.structuredFactionRules, chapterData.structuredFactionRules),
            stratagems: mergeById(baseData.stratagems, chapterData.stratagems),
            detachments: mergeById(baseData.detachments, chapterData.detachments),
            enhancements: mergeById(baseData.enhancements, chapterData.enhancements),
            units: mergeById(baseData.units, chapterData.units),
            weapons: mergeById(baseData.weapons, chapterData.weapons),
            abilities: mergeById(baseData.abilities, chapterData.abilities),
        };
    }
}
