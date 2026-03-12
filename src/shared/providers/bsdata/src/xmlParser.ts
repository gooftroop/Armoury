import { XMLParser } from 'fast-xml-parser';
import { XmlParseError } from '@providers-bsdata/types.js';
import type {
    BattleScribeGameSystem,
    BattleScribeCatalogue,
    BattleScribeProfile,
    BattleScribeCharacteristic,
} from '@providers-bsdata/types.js';

const ALWAYS_ARRAY_ELEMENTS = [
    'selectionEntry',
    'selectionEntryGroup',
    'profile',
    'characteristic',
    'characteristicType',
    'profileType',
    'entryLink',
    'infoLink',
    'categoryLink',
    'categoryEntry',
    'cost',
    'constraint',
    'publication',
    'rule',
];

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseTagValue: true,
    trimValues: true,
    isArray: (name) => ALWAYS_ARRAY_ELEMENTS.includes(name),
});

/**
 * Parses a BattleScribe game system XML file.
 *
 * Game system files define the core rules, characteristics, weapon profiles, and abilities
 * for a BattleScribe system. They contain shared profiles (abilities, weapons, etc.) that
 * are referenced by faction catalogues.
 *
 * Uses fast-xml-parser with attribute prefix '@_' to parse the XML structure.
 * Validates that the root element is 'gameSystem' and throws if missing.
 *
 * @param xml - The raw XML string from a BattleScribe game system file
 * @returns Parsed BattleScribeGameSystem object with gameSystem root element and all nested data
 * @throws XmlParseError if the XML is invalid, malformed, or missing the gameSystem root element
 */
export function parseGameSystem(xml: string): BattleScribeGameSystem {
    try {
        const result = parser.parse(xml) as BattleScribeGameSystem;

        if (!result.gameSystem) {
            throw new XmlParseError('Invalid game system XML: missing gameSystem root element');
        }

        return result;
    } catch (error) {
        if (error instanceof XmlParseError) {
            throw error;
        }

        throw new XmlParseError(
            `Failed to parse game system XML: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

/**
 * Parses a BattleScribe catalogue XML file.
 *
 * Catalogue files define faction data, selection entries, and shared profiles for a game system.
 * They reference shared profiles from the game system file and define selection entries and
 * selection entry groups.
 *
 * Uses fast-xml-parser with attribute prefix '@_' to parse the XML structure.
 * Validates that the root element is 'catalogue' and throws if missing.
 *
 * @param xml - The raw XML string from a BattleScribe catalogue file
 * @returns Parsed BattleScribeCatalogue object with catalogue root element and all nested data
 * @throws XmlParseError if the XML is invalid, malformed, or missing the catalogue root element
 */
export function parseCatalogue(xml: string): BattleScribeCatalogue {
    try {
        const result = parser.parse(xml) as BattleScribeCatalogue;

        if (!result.catalogue) {
            throw new XmlParseError('Invalid catalogue XML: missing catalogue root element');
        }

        return result;
    } catch (error) {
        if (error instanceof XmlParseError) {
            throw error;
        }

        throw new XmlParseError(
            `Failed to parse catalogue XML: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

/**
 * Extracts a named characteristic value from a BattleScribe profile's characteristic list.
 * @param characteristics - Array of characteristics from a BattleScribe profile
 * @param name - The name of the characteristic to extract (e.g., "M", "Toughness", "Save")
 * @returns The characteristic value as a string, or undefined if not found
 */
export function getCharacteristicValue(
    characteristics: BattleScribeCharacteristic[] | undefined,
    name: string,
): string | undefined {
    if (!characteristics) {
        return undefined;
    }

    const char = characteristics.find((c) => c['@_name'] === name);

    return char?.['#text']?.toString();
}

/**
 * Unwraps a profile's characteristics array, normalizing single-element or missing values.
 * @param profile - The BattleScribe profile to extract characteristics from
 * @returns Array of characteristics, empty array if none present
 */
export function extractProfileCharacteristics(profile: BattleScribeProfile): BattleScribeCharacteristic[] {
    if (!profile.characteristics?.characteristic) {
        return [];
    }

    return Array.isArray(profile.characteristics.characteristic)
        ? profile.characteristics.characteristic
        : [profile.characteristics.characteristic];
}
