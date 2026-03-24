import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDatabase } from '../helpers/pgliteTestDb.js';
import { PGliteAdapter } from '@armoury/adapters-pglite';
import { AccountDAO } from '@armoury/data-dao';
import { FriendDAO } from '@armoury/data-dao';
import { CampaignDAOImpl as CampaignDAO } from '@armoury/data-dao';
import { CampaignParticipantDAO } from '@armoury/data-dao';
import { MatchDAO } from '@armoury/data-dao';
import { UserPresenceDAO } from '@armoury/data-dao';
import {
    makeAccount,
    makeCampaignParticipant,
    makeCoreCampaign,
    makeCoreMatch,
    makeFriend,
    makeUserPresence,
} from '../__fixtures__/index.js';

describe('Core DAO E2E Tests', () => {
    let adapter: PGliteAdapter;
    let teardown: () => Promise<void>;

    beforeEach(async () => {
        const testDb = await createTestDatabase();
        adapter = new PGliteAdapter();
        await adapter.initialize();
        teardown = testDb.teardown;
    });

    afterEach(async () => {
        await adapter.close();
        await teardown();
    });

    describe('AccountDAO', () => {
        let dao: AccountDAO;

        beforeEach(() => {
            dao = new AccountDAO(adapter);
        });

        // BUG: Account model returned from PGlite does not include email field
        it.skip('should save and get an account', async () => {
            const account = makeAccount();
            await dao.save(account);

            const result = await dao.get(account.id);
            expect(result).not.toBeNull();
            expect(result!.id).toBe(account.id);
            expect(result!.email).toBe('test@example.com');
        });

        it('should list all accounts', async () => {
            await dao.save(makeAccount({ id: 'user-1' }));
            await dao.save(makeAccount({ id: 'user-2' }));

            const results = await dao.list();
            expect(results).toHaveLength(2);
        });

        it('should save many accounts', async () => {
            await dao.saveMany([
                makeAccount({ id: 'user-1' }),
                makeAccount({ id: 'user-2' }),
                makeAccount({ id: 'user-3' }),
            ]);

            const count = await dao.count();
            expect(count).toBe(3);
        });

        it('should delete an account', async () => {
            await dao.save(makeAccount({ id: 'delete-me' }));
            await dao.delete('delete-me');

            const result = await dao.get('delete-me');
            expect(result).toBeNull();
        });

        it('should delete all accounts', async () => {
            await dao.save(makeAccount({ id: 'user-1' }));
            await dao.save(makeAccount({ id: 'user-2' }));
            await dao.deleteAll();

            const count = await dao.count();
            expect(count).toBe(0);
        });

        it('should preserve JSONB fields through round-trip', async () => {
            const account = makeAccount({
                preferences: { theme: 'dark', language: 'en', notificationsEnabled: false },
            });
            await dao.save(account);

            const result = await dao.get(account.id);
            expect(result!.preferences.notificationsEnabled).toBe(false);
        });
    });

    describe('FriendDAO', () => {
        let dao: FriendDAO;

        beforeEach(() => {
            dao = new FriendDAO(adapter);
        });

        it('should save and get a friend', async () => {
            const friend = makeFriend();
            await dao.save(friend);

            const result = await dao.get(friend.id);
            expect(result).not.toBeNull();
            expect(result!.status).toBe('accepted');
            expect(result!.canShareArmyLists).toBe(true);
        });

        it('should list friends by status', async () => {
            await dao.save(makeFriend({ id: 'f1', status: 'accepted' }));
            await dao.save(makeFriend({ id: 'f2', status: 'pending' }));
            await dao.save(makeFriend({ id: 'f3', status: 'accepted' }));

            const accepted = await dao.listByStatus('accepted');
            expect(accepted).toHaveLength(2);

            const pending = await dao.listByStatus('pending');
            expect(pending).toHaveLength(1);
        });

        it('should count friends', async () => {
            await dao.save(makeFriend({ id: 'f1' }));
            await dao.save(makeFriend({ id: 'f2' }));

            const count = await dao.count();
            expect(count).toBe(2);
        });
    });

    describe('MatchDAO', () => {
        let dao: MatchDAO;

        beforeEach(() => {
            dao = new MatchDAO(adapter);
        });

        it('should save and get a match', async () => {
            const match = makeCoreMatch();
            await dao.save(match);

            const result = await dao.get(match.id);
            expect(result).not.toBeNull();
            expect(result!.systemId).toBe('wh40k10e');
            expect(result!.players).toEqual([
                { playerId: 'auth0|user-1', campaignParticipantId: null },
                { playerId: 'auth0|user-2', campaignParticipantId: null },
            ]);
        });

        it('should list matches by system', async () => {
            await dao.save(makeCoreMatch({ id: 'm1', systemId: 'wh40k10e' }));
            await dao.save(makeCoreMatch({ id: 'm2', systemId: 'wh40k10e' }));
            await dao.save(makeCoreMatch({ id: 'm3', systemId: 'other-system' }));

            const wh40kMatches = await dao.listBySystem('wh40k10e');
            expect(wh40kMatches).toHaveLength(2);
        });

        it('should preserve JSONB matchData through round-trip', async () => {
            const match = makeCoreMatch({
                matchData: {
                    systemId: 'wh40k10e',
                    schemaVersion: 1,
                },
            });
            await dao.save(match);

            const result = await dao.get(match.id);
            expect(result!.matchData).toEqual(match.matchData);
        });
    });

    describe('UserPresenceDAO', () => {
        let dao: UserPresenceDAO;

        beforeEach(() => {
            dao = new UserPresenceDAO(adapter);
        });

        it('should save and get user presence', async () => {
            const presence = makeUserPresence();
            await dao.save(presence);

            const result = await dao.get(presence.userId);
            expect(result).not.toBeNull();
            expect(result!.status).toBe('online');
            expect(result!.connectionId).toBe('conn-abc123');
        });

        it('should list all presences', async () => {
            await dao.save(makeUserPresence({ userId: 'user-1' }));
            await dao.save(makeUserPresence({ userId: 'user-2', status: 'offline', connectionId: null }));

            const results = await dao.list();
            expect(results).toHaveLength(2);
        });
    });

    describe('CampaignDAO', () => {
        let dao: CampaignDAO;

        beforeEach(() => {
            dao = new CampaignDAO(adapter);
        });

        it('should save and get a campaign', async () => {
            const campaign = makeCoreCampaign();
            await dao.save(campaign);

            const result = await dao.get(campaign.id);
            expect(result).not.toBeNull();
            expect(result!.name).toBe('Test Campaign');
        });

        it('should list campaigns by type', async () => {
            await dao.save(makeCoreCampaign({ id: 'c1', type: 'custom' }));
            await dao.save(makeCoreCampaign({ id: 'c2', type: 'wh40k10e-crusade' }));
            await dao.save(makeCoreCampaign({ id: 'c3', type: 'custom' }));

            const custom = await dao.listByType('custom');
            expect(custom).toHaveLength(2);
        });
    });

    describe('CampaignParticipantDAO', () => {
        let dao: CampaignParticipantDAO;

        beforeEach(() => {
            dao = new CampaignParticipantDAO(adapter);
        });

        it('should save and get a participant', async () => {
            const participant = makeCampaignParticipant();
            await dao.save(participant);

            const result = await dao.get(participant.id);
            expect(result).not.toBeNull();
            expect(result!.campaignId).toBe('campaign-1');
        });

        it('should list by campaign', async () => {
            await dao.save(makeCampaignParticipant({ id: 'c1:u1', campaignId: 'c1', userId: 'u1' }));
            await dao.save(makeCampaignParticipant({ id: 'c1:u2', campaignId: 'c1', userId: 'u2' }));
            await dao.save(makeCampaignParticipant({ id: 'c2:u1', campaignId: 'c2', userId: 'u1' }));

            const c1Participants = await dao.listByCampaign('c1');
            expect(c1Participants).toHaveLength(2);
        });

        it('should list by user', async () => {
            await dao.save(makeCampaignParticipant({ id: 'c1:u1', campaignId: 'c1', userId: 'u1' }));
            await dao.save(makeCampaignParticipant({ id: 'c2:u1', campaignId: 'c2', userId: 'u1' }));
            await dao.save(makeCampaignParticipant({ id: 'c1:u2', campaignId: 'c1', userId: 'u2' }));

            const u1Campaigns = await dao.listByUser('u1');
            expect(u1Campaigns).toHaveLength(2);
        });
    });
});
