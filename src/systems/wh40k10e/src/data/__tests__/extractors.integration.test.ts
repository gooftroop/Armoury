import { describe, it, expect } from 'vitest';

import { parseCatalogue } from '@armoury/providers-bsdata';
import { extractUnits } from '@/data/extractors.js';
import { parseWeaponKeywords } from '@/validation/weaponKeywords.js';
import { parseAbility, parseDetachmentRule } from '@/validation/abilityParser.js';

const buildCatalogueXml = (): string => `<?xml version="1.0" encoding="UTF-8"?>
<catalogue id="faction-1" name="Test Faction" revision="1" battleScribeVersion="2.03" gameSystemId="gs-1" gameSystemRevision="1">
    <selectionEntries>
        <selectionEntry id="unit-intercessors" name="Intercessor Squad" type="unit">
            <profiles>
                <profile id="intercessors-profile" name="Intercessor Squad" typeName="Unit">
                    <characteristics>
                        <characteristic name="M">6&quot;</characteristic>
                        <characteristic name="T">4</characteristic>
                        <characteristic name="SV">3+</characteristic>
                        <characteristic name="W">2</characteristic>
                        <characteristic name="LD">6</characteristic>
                        <characteristic name="OC">2</characteristic>
                    </characteristics>
                </profile>
                <profile id="bolt-rifle" name="Bolt Rifle" typeName="Ranged Weapons">
                    <characteristics>
                        <characteristic name="Range">30&quot;</characteristic>
                        <characteristic name="A">2</characteristic>
                        <characteristic name="BS">3+</characteristic>
                        <characteristic name="S">4</characteristic>
                        <characteristic name="AP">-1</characteristic>
                        <characteristic name="D">1</characteristic>
                        <characteristic name="Keywords">Assault, Heavy, Lethal Hits</characteristic>
                    </characteristics>
                </profile>
            </profiles>
            <categoryLinks>
                <categoryLink id="cat-1" name="Infantry" targetId="cat-1" />
                <categoryLink id="cat-2" name="Battleline" targetId="cat-2" />
                <categoryLink id="cat-3" name="Faction: Adeptus Astartes" targetId="cat-3" />
            </categoryLinks>
        </selectionEntry>
        <selectionEntry id="unit-sergeant" name="Sergeant" type="unit">
            <profiles>
                <profile id="sergeant-profile" name="Sergeant" typeName="Unit">
                    <characteristics>
                        <characteristic name="M">6&quot;</characteristic>
                        <characteristic name="T">4</characteristic>
                        <characteristic name="SV">3+</characteristic>
                        <characteristic name="W">3</characteristic>
                        <characteristic name="LD">6</characteristic>
                        <characteristic name="OC">1</characteristic>
                    </characteristics>
                </profile>
                <profile id="leader-ability" name="Leader" typeName="Abilities">
                    <characteristics>
                        <characteristic name="Description">This model can lead Intercessor Squad.</characteristic>
                    </characteristics>
                </profile>
                <profile id="chainsword" name="Chainsword" typeName="Melee Weapons">
                    <characteristics>
                        <characteristic name="A">4</characteristic>
                        <characteristic name="WS">3+</characteristic>
                        <characteristic name="S">4</characteristic>
                        <characteristic name="AP">0</characteristic>
                        <characteristic name="D">1</characteristic>
                        <characteristic name="Keywords">Lethal Hits</characteristic>
                    </characteristics>
                </profile>
            </profiles>
            <categoryLinks>
                <categoryLink id="cat-4" name="Infantry" targetId="cat-4" />
                <categoryLink id="cat-5" name="Character" targetId="cat-5" />
                <categoryLink id="cat-6" name="Leader: Intercessor Squad" targetId="cat-6" />
                <categoryLink id="cat-7" name="Faction: Adeptus Astartes" targetId="cat-7" />
            </categoryLinks>
        </selectionEntry>
    </selectionEntries>
</catalogue>`;

describe('extractors integration', () => {
    it('extracts units, weapons, keywords, and leader info from catalogue XML', () => {
        const catalogue = parseCatalogue(buildCatalogueXml());
        const units = extractUnits(catalogue, 'test.cat', 'sha-123');

        expect(units).toHaveLength(2);

        const intercessors = units.find((unit) => unit.id === 'unit-intercessors');
        const sergeant = units.find((unit) => unit.id === 'unit-sergeant');

        expect(intercessors?.name).toBe('Intercessor Squad');
        expect(intercessors?.movement).toBe('6"');
        expect(intercessors?.toughness).toBe(4);
        expect(intercessors?.save).toBe('3+');
        expect(intercessors?.wounds).toBe(2);
        expect(intercessors?.leadership).toBe(6);
        expect(intercessors?.objectiveControl).toBe(2);
        expect(intercessors?.rangedWeapons).toHaveLength(1);
        expect(intercessors?.meleeWeapons).toHaveLength(0);
        expect(intercessors?.keywords).toEqual(expect.arrayContaining(['Infantry', 'Battleline']));
        expect(intercessors?.factionKeywords).toContain('Adeptus Astartes');

        const boltRifle = intercessors?.rangedWeapons[0];

        expect(boltRifle?.attacks).toBe('2');
        expect(boltRifle?.skill).toBe('3+');
        expect(boltRifle?.strength).toBe(4);
        expect(boltRifle?.ap).toBe(-1);
        expect(boltRifle?.damage).toBe('1');
        expect(boltRifle?.keywords).toEqual(['Assault', 'Heavy', 'Lethal Hits']);
        expect(boltRifle?.parsedKeywords).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ type: 'assault' }),
                expect.objectContaining({ type: 'heavy' }),
                expect.objectContaining({ type: 'lethalHits' }),
            ]),
        );

        expect(sergeant?.name).toBe('Sergeant');
        expect(sergeant?.rangedWeapons).toHaveLength(0);
        expect(sergeant?.meleeWeapons).toHaveLength(1);
        expect(sergeant?.leader?.canAttachTo).toContain('Intercessor Squad');
        expect(sergeant?.leader?.leaderAbility).toBe('This model can lead Intercessor Squad.');
        expect(sergeant?.keywords).toEqual(
            expect.arrayContaining(['Infantry', 'Character', 'Leader: Intercessor Squad']),
        );
        expect(sergeant?.factionKeywords).toContain('Adeptus Astartes');

        const chainsword = sergeant?.meleeWeapons[0];

        expect(chainsword?.attacks).toBe('4');
        expect(chainsword?.skill).toBe('3+');
        expect(chainsword?.strength).toBe(4);
        expect(chainsword?.ap).toBe(0);
        expect(chainsword?.damage).toBe('1');
        expect(chainsword?.keywords).toEqual(['Lethal Hits']);
    });

    it('parses weapon keyword strings into structured keywords', () => {
        const parsed = parseWeaponKeywords([
            'Assault',
            'Heavy',
            'Lethal Hits',
            'Anti-Infantry 4+',
            'Devastating Wounds',
        ]);

        expect(parsed).toEqual(
            expect.arrayContaining([
                { type: 'assault', raw: 'Assault' },
                { type: 'heavy', raw: 'Heavy' },
                { type: 'lethalHits', raw: 'Lethal Hits' },
                { type: 'anti', targetKeyword: 'Infantry', threshold: 4, raw: 'Anti-Infantry 4+' },
                { type: 'devastatingWounds', raw: 'Devastating Wounds' },
            ]),
        );
    });

    it('parses detachment rules and abilities into structured effects', () => {
        const detachmentRule = parseDetachmentRule(
            'Each time this unit is selected to shoot, it has Stealth.',
            'det-1',
            'Stealth',
            0,
        );
        const abilityRule = parseAbility({
            id: 'ability-1',
            name: 'Stealth',
            description: 'Harder to hit at range.',
        });

        expect(detachmentRule.effect).toMatchObject({ type: 'stealth' });
        expect(abilityRule.effect).toMatchObject({ type: 'stealth' });
    });
});
