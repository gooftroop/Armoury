/**
 * Contract tests for the DataContext API.
 *
 * These tests define the target consumer API for the DAO-based architecture.
 * They will FAIL until the implementation catches up. This is intentional —
 * tests first, implementation second.
 *
 * Consumer API:
 *   - dc.accounts — AccountDAO (CRUD)
 *   - dc.social — FriendDAO (CRUD + status filtering)
 *   - dc.armies — ArmyDAO (CRUD)
 *   - dc.campaigns — CampaignDAO (CRUD)
 *   - dc.matches — MatchDAO (CRUD)
 *   - dc.game.coreRules — async getter → CoreRules
 *   - dc.game.crusadeRules — async getter → CrusadeRules
 *   - dc.game.<faction> — async getter → FactionData
 *   - dc.close() — lifecycle
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DataContext } from '@armoury/data-context';
import { wh40k10eSystem } from '../src/system.js';
import type { GameData } from '../src/dao/GameData.js';
import type { Friend } from '@armoury/models';
import { GitHubClient } from '@armoury/clients-github';
import { MockDatabaseAdapter } from '../src/__mocks__/MockDatabaseAdapter.js';
import { makeAccount, makeFriend } from '../../../shared/data/dao/e2e/__fixtures__/index.js';
import { makeArmy, makeCampaign, makeMatch } from './__fixtures__/index.js';
import 'dotenv/config';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const HAS_TOKEN = Boolean(GITHUB_TOKEN);

function expectGetter(target: object, key: string): void {
    const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(target), key);
    expect(descriptor?.get).toBeDefined();
}

// ============================================================
// Builder tests
// ============================================================

describe('DataContext.builder()', () => {
    it.skipIf(!HAS_TOKEN)('builds a DataContext with a system and platform', { timeout: 60_000 }, async () => {
        const mockAdapter = new MockDatabaseAdapter();
        await mockAdapter.initialize();
        const dc = await DataContext.builder()
            .system(wh40k10eSystem)
            .adapter(mockAdapter)
            .registerClient('github', new GitHubClient({ token: GITHUB_TOKEN }))
            .build();

        expect(dc).toBeDefined();
        expect(dc.accounts).toBeDefined();
        expect(dc.social).toBeDefined();
        expect(dc.armies).toBeDefined();
        expect(dc.campaigns).toBeDefined();
        expect(dc.matches).toBeDefined();
        expect(dc.game).toBeDefined();

        await dc.close();
    });

    it('builds a DataContext with a pre-existing adapter', async () => {
        const mockAdapter = new MockDatabaseAdapter();
        await mockAdapter.initialize();

        const dc = await DataContext.builder().system(wh40k10eSystem).adapter(mockAdapter).build();

        expect(dc).toBeDefined();

        await dc.close();
    });

    it('throws if no system is provided', async () => {
        await expect(DataContext.builder().adapter(new MockDatabaseAdapter()).build()).rejects.toThrow();
    });

    it('throws if no adapter is provided', async () => {
        await expect(DataContext.builder().system(wh40k10eSystem).build()).rejects.toThrow(
            'An adapter must be provided to build a DataContext.',
        );
    });
});

// ============================================================
// AccountDAO tests
// ============================================================

describe('dc.accounts (AccountDAO)', { timeout: 60_000 }, () => {
    let dc: DataContext<GameData>;

    beforeEach(async () => {
        const mockAdapter = new MockDatabaseAdapter();
        await mockAdapter.initialize();
        dc = await DataContext.builder<GameData>().system(wh40k10eSystem).adapter(mockAdapter).build();
    });

    it('saves and retrieves an account', async () => {
        const account = makeAccount();
        await dc.accounts.save(account);

        const retrieved = await dc.accounts.get(account.id);
        expect(retrieved).toEqual(account);
    });

    it('lists all accounts', async () => {
        await dc.accounts.save(makeAccount({ id: 'auth0|a' }));
        await dc.accounts.save(makeAccount({ id: 'auth0|b' }));

        const all = await dc.accounts.list();
        expect(all).toHaveLength(2);
    });

    it('deletes an account', async () => {
        const account = makeAccount();
        await dc.accounts.save(account);
        await dc.accounts.delete(account.id);

        const retrieved = await dc.accounts.get(account.id);
        expect(retrieved).toBeNull();
    });

    it('counts accounts', async () => {
        await dc.accounts.save(makeAccount({ id: 'auth0|a' }));
        await dc.accounts.save(makeAccount({ id: 'auth0|b' }));

        const count = await dc.accounts.count();
        expect(count).toBe(2);
    });

    it('saves many accounts at once', async () => {
        await dc.accounts.saveMany([
            makeAccount({ id: 'auth0|a' }),
            makeAccount({ id: 'auth0|b' }),
            makeAccount({ id: 'auth0|c' }),
        ]);

        const all = await dc.accounts.list();
        expect(all).toHaveLength(3);
    });
});

// ============================================================
// FriendDAO tests
// ============================================================

describe('dc.social (FriendDAO)', { timeout: 60_000 }, () => {
    let dc: DataContext<GameData>;

    beforeEach(async () => {
        const mockAdapter = new MockDatabaseAdapter();
        await mockAdapter.initialize();
        dc = await DataContext.builder<GameData>().system(wh40k10eSystem).adapter(mockAdapter).build();
    });

    it('saves and retrieves a friend', async () => {
        const friend = makeFriend();
        await dc.social.save(friend);

        const retrieved = await dc.social.get(friend.id);
        expect(retrieved).toEqual(friend);
    });

    it('lists all friends', async () => {
        await dc.social.save(makeFriend({ id: 'f-1' }));
        await dc.social.save(makeFriend({ id: 'f-2' }));

        const all = await dc.social.list();
        expect(all).toHaveLength(2);
    });

    it('filters friends by status via listByStatus', async () => {
        await dc.social.save(makeFriend({ id: 'f-1', status: 'accepted' }));
        await dc.social.save(makeFriend({ id: 'f-2', status: 'pending' }));
        await dc.social.save(makeFriend({ id: 'f-3', status: 'accepted' }));

        const accepted = await dc.social.listByStatus('accepted');
        expect(accepted).toHaveLength(2);
        expect(accepted.every((friend: Friend) => friend.status === 'accepted')).toBe(true);
    });

    it('deletes a friend', async () => {
        const friend = makeFriend();
        await dc.social.save(friend);
        await dc.social.delete(friend.id);

        const retrieved = await dc.social.get(friend.id);
        expect(retrieved).toBeNull();
    });

    it('counts friends', async () => {
        await dc.social.save(makeFriend({ id: 'f-1' }));
        await dc.social.save(makeFriend({ id: 'f-2' }));

        const count = await dc.social.count();
        expect(count).toBe(2);
    });
});

// ============================================================
// ArmyDAO tests
// ============================================================

describe('dc.armies (ArmyDAO)', { timeout: 60_000 }, () => {
    let dc: DataContext<GameData>;

    beforeEach(async () => {
        const mockAdapter = new MockDatabaseAdapter();
        await mockAdapter.initialize();
        dc = await DataContext.builder<GameData>().system(wh40k10eSystem).adapter(mockAdapter).build();
    });

    it('saves and retrieves an army', async () => {
        const army = makeArmy();
        await dc.armies.save(army);

        const retrieved = await dc.armies.get(army.id);
        expect(retrieved).toEqual(army);
    });

    it('lists all armies', async () => {
        await dc.armies.save(makeArmy({ id: 'army-a' }));
        await dc.armies.save(makeArmy({ id: 'army-b' }));

        const all = await dc.armies.list();
        expect(all).toHaveLength(2);
    });

    it('deletes an army', async () => {
        const army = makeArmy();
        await dc.armies.save(army);
        await dc.armies.delete(army.id);

        const retrieved = await dc.armies.get(army.id);
        expect(retrieved).toBeNull();
    });

    it('counts armies', async () => {
        await dc.armies.save(makeArmy({ id: 'army-a' }));
        await dc.armies.save(makeArmy({ id: 'army-b' }));

        const count = await dc.armies.count();
        expect(count).toBe(2);
    });
});

// ============================================================
// CampaignDAO tests
// ============================================================

describe('dc.campaigns (CampaignDAO)', { timeout: 60_000 }, () => {
    let dc: DataContext<GameData>;

    beforeEach(async () => {
        const mockAdapter = new MockDatabaseAdapter();
        await mockAdapter.initialize();
        dc = await DataContext.builder<GameData>().system(wh40k10eSystem).adapter(mockAdapter).build();
    });

    it('saves and retrieves a campaign', async () => {
        const campaign = makeCampaign();
        await dc.campaigns.save(campaign);

        const retrieved = await dc.campaigns.get(campaign.id);
        expect(retrieved).toEqual(campaign);
    });

    it('lists all campaigns', async () => {
        await dc.campaigns.save(makeCampaign({ id: 'c-1' }));
        await dc.campaigns.save(makeCampaign({ id: 'c-2' }));

        const all = await dc.campaigns.list();
        expect(all).toHaveLength(2);
    });

    it('deletes a campaign', async () => {
        const campaign = makeCampaign();
        await dc.campaigns.save(campaign);
        await dc.campaigns.delete(campaign.id);

        const retrieved = await dc.campaigns.get(campaign.id);
        expect(retrieved).toBeNull();
    });
});

// ============================================================
// MatchDAO tests
// ============================================================

describe('dc.matches (MatchDAO)', { timeout: 60_000 }, () => {
    let dc: DataContext<GameData>;

    beforeEach(async () => {
        const mockAdapter = new MockDatabaseAdapter();
        await mockAdapter.initialize();
        dc = await DataContext.builder<GameData>().system(wh40k10eSystem).adapter(mockAdapter).build();
    });

    it('saves and retrieves a match', async () => {
        const match = makeMatch();
        await dc.matches.save(match);

        const retrieved = await dc.matches.get(match.id);
        expect(retrieved).toEqual(match);
    });

    it('lists all matches', async () => {
        await dc.matches.save(makeMatch({ id: 'm-1' }));
        await dc.matches.save(makeMatch({ id: 'm-2' }));

        const all = await dc.matches.list();
        expect(all).toHaveLength(2);
    });

    it('deletes a match', async () => {
        const match = makeMatch();
        await dc.matches.save(match);
        await dc.matches.delete(match.id);

        const retrieved = await dc.matches.get(match.id);
        expect(retrieved).toBeNull();
    });
});

// ============================================================
// Game data tests (real BSData — single shared DataContext)
//
// All game-data tests share ONE DataContext built in beforeAll.
// This reduces GitHub API calls from ~12 full syncs to 1.
// ============================================================

describe.skipIf(!HAS_TOKEN)('dc.game (real BSData)', { timeout: 120_000 }, () => {
    let dc: DataContext<GameData>;

    beforeAll(async () => {
        const mockAdapter = new MockDatabaseAdapter();
        await mockAdapter.initialize();
        dc = await DataContext.builder<GameData>()
            .system(wh40k10eSystem)
            .adapter(mockAdapter)
            .registerClient('github', new GitHubClient({ token: GITHUB_TOKEN! }))
            .build();
    });

    afterAll(async () => {
        await dc?.close();
    });

    describe('coreRules', () => {
        it('returns CoreRules via async getter', async () => {
            const coreRules = await dc.game.coreRules;

            expect(coreRules).toHaveProperty('id');
            expect(coreRules).toHaveProperty('profileTypes');
            expect(coreRules.categories.length).toBeGreaterThan(0);
            expect(coreRules.sharedRules.length).toBeGreaterThan(0);
        });

        it('returns the same data model on subsequent access (memoized)', async () => {
            const first = await dc.game.coreRules;
            const second = await dc.game.coreRules;

            expect(second).toBe(first);
        });

        it('data model supports standard JS operations', async () => {
            const coreRules = await dc.game.coreRules;
            const unitProfile = coreRules.profileTypes.find((profile: { name: string }) => profile.name === 'Unit');
            const matchingRules = coreRules.sharedRules.filter(
                (rule: { name: string }) =>
                    rule.name.includes('Save') ||
                    rule.name.includes('Feel No Pain') ||
                    rule.name.includes('Deadly Demise'),
            );

            expect(unitProfile).toBeDefined();
            expect(matchingRules.length).toBeGreaterThan(0);
            expect(coreRules.categories.length).toBeGreaterThan(0);
        });
    });

    describe('crusadeRules', () => {
        it('returns CrusadeRules via async getter', async () => {
            const crusade = await dc.game.crusadeRules;

            expect(crusade.rankThresholds).toBeDefined();
            expect(crusade.requisitions).toBeDefined();
            expect(crusade.agendas).toBeDefined();
        });

        it('data model supports standard JS operations', async () => {
            const crusade = await dc.game.crusadeRules;
            const legendary = crusade.rankThresholds.find(
                (threshold: { rank: string }) => threshold.rank === 'Legendary',
            );

            expect(legendary).toBeDefined();
        });
    });

    describe('faction data (Space Marines)', () => {
        it('returns FactionData via async getter', async () => {
            const sm = await dc.game.spaceMarines;

            expect(sm).toHaveProperty('id');
            expect(sm).toHaveProperty('units');
            expect(sm.units.length).toBeGreaterThan(0);
            expect(sm.weapons.length).toBeGreaterThan(0);
            expect(sm.abilities.length).toBeGreaterThan(0);
            expect(sm.stratagems).toBeInstanceOf(Array);
        });

        it('faction data supports standard JS operations', async () => {
            const sm = await dc.game.spaceMarines;
            const intercessors = sm.units.find((unit: { name: string }) => unit.name === 'Intercessor Squad');
            const oath = sm.factionRules.find((rule: { name: string }) => rule.name === 'Oath of Moment');

            expect(intercessors).toBeDefined();
            expect(oath).toBeDefined();
            expect(sm.stratagems.filter((s: { cp: number }) => s.cp <= 1)).toBeInstanceOf(Array);
        });

        it('returns memoized data on subsequent access', async () => {
            const first = await dc.game.spaceMarines;
            const second = await dc.game.spaceMarines;

            expect(second).toBe(first);
        });
    });

    describe('chapter inherits Space Marines data (Blood Angels)', () => {
        it('Blood Angels includes all Space Marine base units', async () => {
            const spaceMarines = await dc.game.spaceMarines;
            const ba = await dc.game.bloodAngels;

            const baseUnitNames = new Set(spaceMarines.units.map((unit: { name: string }) => unit.name));
            const inheritedUnits = ba.units.filter((unit: { name: string }) => baseUnitNames.has(unit.name));
            const chapterUnits = ba.units.filter((unit: { name: string }) => !baseUnitNames.has(unit.name));

            expect(ba).toHaveProperty('id');
            expect(ba).toHaveProperty('units');
            expect(inheritedUnits.length).toBeGreaterThan(0);
            expect(chapterUnits.length).toBeGreaterThan(0);
        });

        it('Blood Angels has chapter-specific data merged', async () => {
            const spaceMarines = await dc.game.spaceMarines;
            const ba = await dc.game.bloodAngels;

            const baseRuleNames = new Set(spaceMarines.factionRules.map((rule: { name: string }) => rule.name));
            const chapterRules = ba.factionRules.filter((rule: { name: string }) => !baseRuleNames.has(rule.name));

            expect(chapterRules.length).toBeGreaterThan(0);
            expect(ba.stratagems.length).toBeGreaterThanOrEqual(spaceMarines.stratagems.length);
        });
    });

    describe('multiple factions are isolated', () => {
        it('accessing different factions returns independent data models', async () => {
            const spaceMarines = await dc.game.spaceMarines;
            const necrons = await dc.game.necrons;

            expect(spaceMarines).toHaveProperty('id');
            expect(spaceMarines).toHaveProperty('units');
            expect(necrons).toHaveProperty('id');
            expect(necrons).toHaveProperty('units');
            expect(spaceMarines).not.toBe(necrons);
            expect(spaceMarines.id).not.toBe(necrons.id);
        });
    });
});

// ============================================================
// All faction getter surface
// ============================================================

describe('dc.game — all faction getters exist', { timeout: 60_000 }, () => {
    let dc: DataContext<GameData>;

    beforeAll(async () => {
        const mockAdapter = new MockDatabaseAdapter();
        await mockAdapter.initialize();
        dc = await DataContext.builder<GameData>().system(wh40k10eSystem).adapter(mockAdapter).build();
    });

    afterAll(async () => {
        await dc?.close();
    });

    it('exposes all 39 game data getters', () => {
        // Core
        expectGetter(dc.game, 'chapterApproved');
        expectGetter(dc.game, 'coreRules');
        expectGetter(dc.game, 'crusadeRules');
        // Aeldari
        expectGetter(dc.game, 'aeldari');
        expectGetter(dc.game, 'drukhari');
        // Chaos
        expectGetter(dc.game, 'chaosSpaceMarines');
        expectGetter(dc.game, 'chaosDaemons');
        expectGetter(dc.game, 'chaosKnights');
        expectGetter(dc.game, 'deathGuard');
        expectGetter(dc.game, 'emperorsChildren');
        expectGetter(dc.game, 'thousandSons');
        expectGetter(dc.game, 'worldEaters');
        // Imperium
        expectGetter(dc.game, 'adeptaSororitas');
        expectGetter(dc.game, 'adeptusCustodes');
        expectGetter(dc.game, 'adeptusMechanicus');
        expectGetter(dc.game, 'agentsOfTheImperium');
        expectGetter(dc.game, 'astraMilitarum');
        expectGetter(dc.game, 'imperialKnights');
        expectGetter(dc.game, 'greyKnights');
        // Space Marines + Chapters
        expectGetter(dc.game, 'spaceMarines');
        expectGetter(dc.game, 'blackTemplars');
        expectGetter(dc.game, 'bloodAngels');
        expectGetter(dc.game, 'darkAngels');
        expectGetter(dc.game, 'deathwatch');
        expectGetter(dc.game, 'spaceWolves');
        expectGetter(dc.game, 'ultramarines');
        expectGetter(dc.game, 'imperialFists');
        expectGetter(dc.game, 'ironHands');
        expectGetter(dc.game, 'ravenGuard');
        expectGetter(dc.game, 'salamanders');
        expectGetter(dc.game, 'whiteScars');
        // Xenos
        expectGetter(dc.game, 'genestealerCults');
        expectGetter(dc.game, 'leaguesOfVotann');
        expectGetter(dc.game, 'necrons');
        expectGetter(dc.game, 'orks');
        expectGetter(dc.game, 'tauEmpire');
        expectGetter(dc.game, 'tyranids');
        // Misc
        expectGetter(dc.game, 'adeptusTitanicus');
        expectGetter(dc.game, 'titanicusTraitoris');
        expectGetter(dc.game, 'unalignedForces');
    });
});

// ============================================================
// Lifecycle tests
// ============================================================

describe('dc.close()', { timeout: 60_000 }, () => {
    it('closes the underlying adapter', async () => {
        const mockAdapter = new MockDatabaseAdapter();
        await mockAdapter.initialize();

        const dc = await DataContext.builder().system(wh40k10eSystem).adapter(mockAdapter).build();

        await dc.close();
        expect(mockAdapter.initialized).toBe(false);
    });

    it('marks the adapter as uninitialized after close', async () => {
        const mockAdapter = new MockDatabaseAdapter();
        await mockAdapter.initialize();

        const dc = await DataContext.builder().system(wh40k10eSystem).adapter(mockAdapter).build();

        expect(mockAdapter.initialized).toBe(true);

        await dc.close();

        expect(mockAdapter.initialized).toBe(false);
    });
});
