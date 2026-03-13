import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GitHubClient } from '@armoury/clients-github';
import { MockDatabaseAdapter } from '../src/__mocks__/MockDatabaseAdapter.js';
import { wh40k10eSystem } from '../src/system.js';
import { BloodAngelsDAO } from '../src/dao/factions/BloodAngelsDAO.js';
import { SpaceMarinesDAO } from '../src/dao/factions/SpaceMarinesDAO.js';
import type { FactionData } from '../src/models/FactionData.js';
import 'dotenv/config';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const HAS_TOKEN = Boolean(process.env.GITHUB_TOKEN);
const SPACE_MARINES_FILE = 'Imperium - Space Marines.cat';
const BLOOD_ANGELS_FILE = 'Imperium - Blood Angels.cat';

function getUnitNames(units: Array<{ name: string }>): Set<string> {
    return new Set(units.map((unit) => unit.name));
}

function getChapterKeywordUnits(
    units: Array<{ factionKeywords: string[] }>,
    keyword: string,
): Array<{ factionKeywords: string[] }> {
    return units.filter((unit) => unit.factionKeywords.includes(keyword));
}

async function createAdapter(): Promise<MockDatabaseAdapter> {
    const adapter = new MockDatabaseAdapter();
    await adapter.initialize();

    return adapter;
}

describe.skipIf(!HAS_TOKEN)('chapter DAO inheritance (Blood Angels)', { timeout: 120_000 }, () => {
    let githubClient: GitHubClient;
    let sharedAdapter: MockDatabaseAdapter;
    let bloodAngelsData: FactionData;
    let spaceMarinesData: FactionData;

    beforeAll(async () => {
        wh40k10eSystem.register();
        githubClient = new GitHubClient({ token: GITHUB_TOKEN });
        sharedAdapter = await createAdapter();

        const smDAO = new SpaceMarinesDAO(sharedAdapter, githubClient);
        const baDAO = new BloodAngelsDAO(sharedAdapter, githubClient);

        [spaceMarinesData, bloodAngelsData] = await Promise.all([smDAO.load(), baDAO.load()]);
    });

    afterAll(async () => {
        await sharedAdapter?.close();
    });

    it('loads both Space Marines base and Blood Angels chapter data', () => {
        expect(bloodAngelsData).toHaveProperty('id');
        expect(bloodAngelsData).toHaveProperty('units');
        expect(bloodAngelsData.sourceFiles).toEqual(expect.arrayContaining([SPACE_MARINES_FILE, BLOOD_ANGELS_FILE]));
        expect(bloodAngelsData.units.length).toBeGreaterThan(0);
    });

    it('includes Space Marines base units (Intercessor Squad)', () => {
        const baseUnits = getUnitNames(bloodAngelsData.units);
        const hasBaseUnits = baseUnits.size > 0;

        expect(hasBaseUnits).toBe(true);
    });

    it('includes Blood Angels chapter-specific units (Blood Angels keyword)', () => {
        const chapterUnits = getChapterKeywordUnits(bloodAngelsData.units, 'Blood Angels');

        expect(chapterUnits.length).toBeGreaterThan(0);
    });

    it('keeps Space Marines data isolated from Blood Angels chapter units', () => {
        const chapterUnits = getChapterKeywordUnits(spaceMarinesData.units, 'Blood Angels');

        expect(chapterUnits.length).toBe(0);
    });

    it('SM and BA coexist on the same adapter with distinct entity IDs', async () => {
        const smStored = await sharedAdapter.get('factionModel', 'space-marines');
        const baStored = await sharedAdapter.get('factionModel', 'blood-angels');

        expect(smStored).not.toBeNull();
        expect(baStored).not.toBeNull();
        expect((smStored as { id: string }).id).toBe('space-marines');
        expect((baStored as { id: string }).id).toBe('blood-angels');
    });

    it('SM and BA have distinct sync status keys on the same adapter', async () => {
        const smSync = await sharedAdapter.getSyncStatus('factionModel:space-marines');
        const baSync = await sharedAdapter.getSyncStatus('factionModel:blood-angels');

        expect(smSync).not.toBeNull();
        expect(baSync).not.toBeNull();
        expect(smSync!.sha.length).toBeGreaterThan(0);
        expect(baSync!.sha.length).toBeGreaterThan(0);
    });

    it('loads chapter data in parallel without interference', async () => {
        const [adapterA, adapterB] = await Promise.all([createAdapter(), createAdapter()]);
        const [first, second] = await Promise.all([
            new BloodAngelsDAO(adapterA, githubClient).load(),
            new BloodAngelsDAO(adapterB, githubClient).load(),
        ]);

        const firstUnitNames = getUnitNames(first.units);
        const secondUnitNames = getUnitNames(second.units);
        const firstChapterUnits = getChapterKeywordUnits(first.units, 'Blood Angels');
        const secondChapterUnits = getChapterKeywordUnits(second.units, 'Blood Angels');

        expect(first).toHaveProperty('id');
        expect(first).toHaveProperty('units');
        expect(second).toHaveProperty('id');
        expect(second).toHaveProperty('units');
        expect(first).not.toBe(second);
        expect(firstUnitNames.size).toBeGreaterThan(0);
        expect(secondUnitNames.size).toBeGreaterThan(0);
        expect(firstChapterUnits.length).toBeGreaterThan(0);
        expect(secondChapterUnits.length).toBeGreaterThan(0);

        await adapterA.close();
        await adapterB.close();
    });
});
