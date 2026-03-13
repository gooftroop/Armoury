import { describe, it, expect } from 'vitest';
import { parseGameSystem, parseCatalogue } from '@/xmlParser.js';
import { XmlParseError } from '@/types.js';

const SAMPLE_GST = `<?xml version="1.0" encoding="UTF-8"?>
<gameSystem id="sys-123" name="Warhammer 40,000 10th Edition" revision="87" battleScribeVersion="2.03">
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
</gameSystem>`;

const SAMPLE_CAT = `<?xml version="1.0" encoding="UTF-8"?>
<catalogue id="cat-123" name="Space Marines" revision="15" battleScribeVersion="2.03" gameSystemId="sys-123" gameSystemRevision="87">
  <selectionEntries>
    <selectionEntry id="unit-1" name="Intercessor Squad" type="unit">
      <profiles>
        <profile id="prof-1" name="Intercessor" typeId="pt-unit" typeName="Unit">
          <characteristics>
            <characteristic name="M" typeId="ct-m">6"</characteristic>
            <characteristic name="T" typeId="ct-t">4</characteristic>
            <characteristic name="SV" typeId="ct-sv">3+</characteristic>
            <characteristic name="W" typeId="ct-w">2</characteristic>
            <characteristic name="LD" typeId="ct-ld">6</characteristic>
            <characteristic name="OC" typeId="ct-oc">2</characteristic>
          </characteristics>
        </profile>
        <profile id="prof-2" name="Bolt rifle" typeId="pt-ranged" typeName="Ranged Weapons">
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
        <characteristic name="Description" typeId="ct-desc">This unit can ignore modifiers to Leadership.</characteristic>
      </characteristics>
    </profile>
  </sharedProfiles>
</catalogue>`;

describe('parseGameSystem', () => {
    it('parses valid game system XML', () => {
        const result = parseGameSystem(SAMPLE_GST);

        expect(result.gameSystem).toBeDefined();
        expect(result.gameSystem['@_id']).toBe('sys-123');
        expect(result.gameSystem['@_name']).toBe('Warhammer 40,000 10th Edition');
        expect(result.gameSystem['@_revision']).toBe('87');
    });

    it('extracts profile types', () => {
        const result = parseGameSystem(SAMPLE_GST);

        const profileTypes = result.gameSystem.profileTypes?.profileType;
        expect(profileTypes).toBeDefined();
        expect(Array.isArray(profileTypes)).toBe(true);
    });

    it('throws XmlParseError for invalid XML', () => {
        expect(() => parseGameSystem('<invalid>')).toThrow(XmlParseError);
    });

    it('throws XmlParseError for missing root element', () => {
        expect(() => parseGameSystem('<other></other>')).toThrow(XmlParseError);
    });
});

describe('parseCatalogue', () => {
    it('parses valid catalogue XML', () => {
        const result = parseCatalogue(SAMPLE_CAT);

        expect(result.catalogue).toBeDefined();
        expect(result.catalogue['@_id']).toBe('cat-123');
        expect(result.catalogue['@_name']).toBe('Space Marines');
    });

    it('throws XmlParseError for missing catalogue element', () => {
        expect(() => parseCatalogue('<other></other>')).toThrow(XmlParseError);
    });
});

describe('malformed XML handling', () => {
    it('handles missing optional fields gracefully', () => {
        const minimalCat = `<?xml version="1.0"?>
      <catalogue id="cat-1" name="Test" gameSystemId="sys-1" gameSystemRevision="1" battleScribeVersion="2.03" revision="1">
        <selectionEntries>
          <selectionEntry id="unit-1" name="Basic Unit" type="unit">
            <profiles>
              <profile id="p1" name="Basic" typeId="pt-unit" typeName="Unit">
                <characteristics>
                  <characteristic name="M" typeId="ct-m">6"</characteristic>
                </characteristics>
              </profile>
            </profiles>
          </selectionEntry>
        </selectionEntries>
      </catalogue>`;

        const catalogue = parseCatalogue(minimalCat);

        expect(catalogue.catalogue).toBeDefined();
        expect(catalogue.catalogue['@_id']).toBe('cat-1');
    });
});
