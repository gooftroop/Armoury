import { beforeEach, describe, expect, it } from 'vitest';
import { CoreRulesDAO } from '../CoreRulesDAO.ts';
import { CrusadeRulesDAO } from '../CrusadeRulesDAO.ts';
import { FactionDAO } from '../FactionDAO.ts';
import { getFactionConfig } from '../../config/factionMap.ts';
import { MockDatabaseAdapter } from '../../__mocks__/MockDatabaseAdapter.ts';
import { MockGitHubClient } from '../../__mocks__/MockGitHubClient.ts';
import { clearCodecRegistry } from '@armoury/data-dao/codec';
import { clearHydrationRegistry } from '@armoury/data-dao/hydration';
import { clearSchemaExtensions } from '@armoury/data-dao/schema';
import { PluginRegistry } from '@armoury/data-dao/pluginRegistry';

const CORE_RULES_FILE = 'Warhammer%2040%2C000.gst';
const CORE_RULES_SYNC_KEY = 'core:wh40k-10e.gst';

const CORE_RULES_XML = `<?xml version="1.0" encoding="UTF-8"?>
<gameSystem id="sys-123" name="Warhammer 40,000 10th Edition" revision="1" battleScribeVersion="2.03">
  <profileTypes>
    <profileType id="pt-unit" name="Unit">
      <characteristicTypes>
        <characteristicType id="ct-m" name="M"/>
        <characteristicType id="ct-t" name="T"/>
        <characteristicType id="ct-sv" name="SV"/>
        <characteristicType id="ct-w" name="W"/>
        <characteristicType id="ct-ld" name="LD"/>
        <characteristicType id="ct-oc" name="OC"/>
      </characteristicTypes>
    </profileType>
  </profileTypes>
  <costTypes>
    <costType id="pts" name="pts" defaultCostLimit="2000"/>
  </costTypes>
  <categoryEntries>
    <categoryEntry id="cat-hq" name="HQ"/>
  </categoryEntries>
  <sharedRules>
    <rule id="rule-1" name="Invulnerable Save">
      <description>Cannot be modified by AP.</description>
    </rule>
  </sharedRules>
</gameSystem>`;

const SPACE_MARINES_CAT_XML = `<?xml version="1.0" encoding="UTF-8"?>
<catalogue id="cat-123" name="Space Marines" revision="1" battleScribeVersion="2.03" gameSystemId="sys-123" gameSystemRevision="1">
  <selectionEntries>
    <selectionEntry id="unit-1" name="Intercessor Squad" type="unit">
      <profiles>
        <profile id="prof-unit" name="Intercessor" typeId="pt-unit" typeName="Unit">
          <characteristics>
            <characteristic name="M" typeId="ct-m">6"</characteristic>
            <characteristic name="T" typeId="ct-t">4</characteristic>
            <characteristic name="SV" typeId="ct-sv">3+</characteristic>
            <characteristic name="W" typeId="ct-w">2</characteristic>
            <characteristic name="LD" typeId="ct-ld">6</characteristic>
            <characteristic name="OC" typeId="ct-oc">2</characteristic>
          </characteristics>
        </profile>
        <profile id="weapon-1" name="Bolt rifle" typeId="pt-ranged" typeName="Ranged Weapons">
          <characteristics>
            <characteristic name="Range" typeId="ct-range">24"</characteristic>
            <characteristic name="A" typeId="ct-a">2</characteristic>
            <characteristic name="BS" typeId="ct-bs">3+</characteristic>
            <characteristic name="S" typeId="ct-s">4</characteristic>
            <characteristic name="AP" typeId="ct-ap">-1</characteristic>
            <characteristic name="D" typeId="ct-d">1</characteristic>
            <characteristic name="Keywords" typeId="ct-kw">Assault, Heavy</characteristic>
          </characteristics>
        </profile>
      </profiles>
      <categoryLinks>
        <categoryLink id="cl-1" name="Infantry" targetId="cat-infantry"/>
        <categoryLink id="cl-2" name="Faction: Adeptus Astartes" targetId="cat-faction"/>
      </categoryLinks>
    </selectionEntry>
  </selectionEntries>
  <sharedProfiles>
    <profile id="ability-1" name="And They Shall Know No Fear" typeId="pt-ability" typeName="Abilities">
      <characteristics>
        <characteristic name="Description" typeId="ct-desc">This unit can re-roll Battle-shock tests.</characteristic>
      </characteristics>
    </profile>
  </sharedProfiles>
</catalogue>`;

describe('BSData DAOs (integration)', () => {
    let adapter: MockDatabaseAdapter;
    let githubClient: MockGitHubClient;

    beforeEach(() => {
        clearCodecRegistry();
        clearHydrationRegistry();
        clearSchemaExtensions();
        PluginRegistry.clear();

        adapter = new MockDatabaseAdapter();
        githubClient = new MockGitHubClient();
    });

    describe('CoreRulesDAO', () => {
        it('loads GST data, stores core rules, and tracks sync status', async () => {
            githubClient.fileContents.set(CORE_RULES_FILE, CORE_RULES_XML);
            githubClient.fileShas.set(CORE_RULES_FILE, 'sha-core-1');
            githubClient.files = [
                {
                    name: 'Imperium - Space Marines.cat',
                    path: 'Imperium - Space Marines.cat',
                    sha: 'faction-sha-1',
                    size: 1000,
                    download_url: 'https://example.com/space-marines.cat',
                    type: 'file',
                },
            ];

            const dao = new CoreRulesDAO(adapter, githubClient);
            const result = await dao.load();

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('profileTypes');
            expect(result.profileTypes.length).toBeGreaterThan(0);
            expect(result.sharedRules.length).toBeGreaterThan(0);

            const stored = await adapter.get('coreRules', CORE_RULES_SYNC_KEY);
            expect(stored).not.toBeNull();
            expect((stored as { id: string }).id).toBe(CORE_RULES_SYNC_KEY);

            const syncStatus = await adapter.getSyncStatus(CORE_RULES_SYNC_KEY);
            expect(syncStatus).not.toBeNull();
            expect(syncStatus?.sha).toBe('sha-core-1');

            const factions = await adapter.getAll('faction');
            expect(factions.length).toBe(1);
            expect(factions[0].name).toBe('Space Marines');
        });

        it('returns cached core rules on subsequent load calls', async () => {
            githubClient.fileContents.set(CORE_RULES_FILE, CORE_RULES_XML);
            githubClient.fileShas.set(CORE_RULES_FILE, 'sha-core-1');
            githubClient.files = [];

            const dao = new CoreRulesDAO(adapter, githubClient);
            await dao.load();

            githubClient.downloadedPaths = [];
            githubClient.shouldUpdate = false;

            const secondDao = new CoreRulesDAO(adapter, githubClient);
            const cached = await secondDao.load();

            expect(cached).toHaveProperty('id');
            expect(cached).toHaveProperty('profileTypes');
            expect(githubClient.downloadedPaths.length).toBe(0);
        });
    });

    describe('CrusadeRulesDAO', () => {
        it('returns static crusade rules with expected fields', async () => {
            const dao = new CrusadeRulesDAO(adapter, githubClient);
            const rules = await dao.load();

            expect(rules.id).toBe('crusadeRules:static');
            expect(rules.name).toBe('Crusade Core Rules');
            expect(rules.version).toBe('1.0');
            expect(rules.rankThresholds.length).toBeGreaterThan(0);
            expect(rules.requisitions.length).toBe(0);
            expect(rules.battleHonours.length).toBe(0);
            expect(rules.battleScars.length).toBe(0);
            expect(rules.agendas.length).toBe(0);
            expect(rules.sourceMechanics).toEqual({});
        });

        it('never requires sync checks for static crusade rules', async () => {
            const dao = new CrusadeRulesDAO(adapter, githubClient);
            const needsSync = (dao as unknown as { needsSync: () => Promise<boolean> }).needsSync;

            await expect(needsSync()).resolves.toBe(false);
        });
    });

    describe('FactionDAO', () => {
        it('loads Space Marines catalogue data and persists faction entities', async () => {
            const spaceMarinesConfig = getFactionConfig('space-marines');

            expect(spaceMarinesConfig).toBeDefined();

            const encodedFile = encodeURIComponent(spaceMarinesConfig!.files[0]);
            githubClient.fileContents.set(encodedFile, SPACE_MARINES_CAT_XML);
            githubClient.fileShas.set(encodedFile, 'sha-sm-1');

            const dao = new FactionDAO(adapter, githubClient, spaceMarinesConfig!);
            const result = await dao.load();

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('units');
            expect(result.units.length).toBeGreaterThan(0);
            expect(result.weapons.length).toBeGreaterThan(0);
            expect(result.abilities.length).toBeGreaterThan(0);

            const units = await adapter.getByField('unit', 'factionId', spaceMarinesConfig!.id);
            const weapons = await adapter.getAll('weapon');
            const abilities = await adapter.getAll('ability');

            expect(units.length).toBeGreaterThan(0);
            expect(weapons.length).toBeGreaterThan(0);
            expect(abilities.length).toBeGreaterThan(0);
        });
    });
});
