/**
 * BattleScribe XML structure types, Entity base interface, and XML parsing errors.
 * These types match the output of fast-xml-parser with attributeNamePrefix: '@_'.
 * Entity interface provides common identity and source tracking for all domain objects.
 * XmlParseError handles parsing failures with position and context information.
 */

/**
 * Base entity interface for all domain objects.
 * Provides common identity and source tracking properties.
 */
export interface Entity {
    /** Unique identifier for the entity */
    id: string;
    /** Display name of the entity */
    name: string;
    /** Path to the source file (BattleScribe .gst or .cat file) where this entity was defined */
    sourceFile: string;
    /** SHA hash of the source file for change detection and caching */
    sourceSha: string;
}

/**
 * Common BattleScribe XML attributes.
 * The @_ prefix is used by fast-xml-parser to denote XML attributes.
 */
export interface BattleScribeAttributes {
    /** Unique identifier attribute from XML */
    '@_id': string;
    /** Name attribute from XML */
    '@_name': string;
}

/**
 * Characteristic type definition from BattleScribe game system.
 * Defines the types of characteristics available (M, T, SV, W, LD, OC, etc.).
 * Maps to <characteristicType> elements in .gst files.
 */
export interface BattleScribeCharacteristicType extends BattleScribeAttributes {
    /** Unique identifier for the characteristic type */
    '@_id': string;
    /** Display name of the characteristic (e.g., "M", "Toughness", "Save") */
    '@_name': string;
}

/**
 * Profile type definition from BattleScribe game system.
 * Defines the structure of profiles (Unit, Ranged Weapons, Melee Weapons, Abilities, etc.).
 * Maps to <profileType> elements in .gst files.
 */
export interface BattleScribeProfileType extends BattleScribeAttributes {
    /** Optional container for characteristic types that belong to this profile type */
    characteristicTypes?: {
        /** One or more characteristic type definitions */
        characteristicType: BattleScribeCharacteristicType | BattleScribeCharacteristicType[];
    };
}

/**
 * Category definition from BattleScribe.
 * Categories are used to organize units and selections (e.g., "HQ", "Troops", "Elites").
 * Maps to <categoryEntry> elements in .gst and .cat files.
 */
export interface BattleScribeCategory extends BattleScribeAttributes {
    /** Optional hidden flag - if present, category is hidden from UI */
    '@_hidden'?: string;
}

/**
 * Cost type definition from BattleScribe game system.
 * Defines the types of costs available (pts for points, PL for Power Level, etc.).
 * Maps to <costType> elements in .gst files.
 */
export interface BattleScribeCostType extends BattleScribeAttributes {
    /** Optional default cost limit for this cost type */
    '@_defaultCostLimit'?: string;
}

/**
 * Characteristic value within a profile.
 * Represents a single stat value (e.g., M=6", T=4, SV=3+) in a unit or weapon profile.
 * Maps to <characteristic> elements in .gst and .cat files.
 */
export interface BattleScribeCharacteristic {
    /** Name of the characteristic (e.g., "M", "Toughness", "Save") */
    '@_name': string;
    /** Reference to the characteristic type definition */
    '@_typeId': string;
    /** The actual value of the characteristic (e.g., "6\"", "4", "3+") */
    '#text'?: string;
}

/**
 * Profile containing characteristics (unit stats, weapon stats, ability description, etc.).
 * A profile is a collection of characteristics that define properties of a unit or weapon.
 * Maps to <profile> elements in .gst and .cat files.
 */
export interface BattleScribeProfile extends BattleScribeAttributes {
    /** Reference to the profile type definition */
    '@_typeId': string;
    /** Display name of the profile type (e.g., "Unit", "Ranged Weapons", "Melee Weapons") */
    '@_typeName': string;
    /** Optional hidden flag - if present, profile is hidden from UI */
    '@_hidden'?: string;
    /** Optional container for characteristics in this profile */
    characteristics?: {
        /** One or more characteristic values */
        characteristic: BattleScribeCharacteristic | BattleScribeCharacteristic[];
    };
}

/**
 * Info link - a reference to another element (shared rule, profile, etc.).
 * Used to reference shared definitions without duplicating content.
 * Maps to <infoLink> elements in .gst and .cat files.
 */
export interface BattleScribeInfoLink extends BattleScribeAttributes {
    /** ID of the element being referenced */
    '@_targetId': string;
    /** Type of element being referenced (e.g., "profile", "rule") */
    '@_type': string;
    /** Optional hidden flag - if present, link is hidden from UI */
    '@_hidden'?: string;
}

/**
 * Cost value for a unit or selection.
 * Represents a single cost (e.g., 100 points, 5 Power Level).
 * Maps to <cost> elements in .gst and .cat files.
 */
export interface BattleScribeCost {
    /** Display name of the cost type (e.g., "pts", "PL") */
    '@_name': string;
    /** Reference to the cost type definition */
    '@_typeId': string;
    /** The numeric cost value */
    '@_value': string;
}

/**
 * Constraint on selections - defines rules for unit composition.
 * Constraints limit how many units can be selected or how they can be combined.
 * Maps to <constraint> elements in .gst and .cat files.
 */
export interface BattleScribeConstraint extends BattleScribeAttributes {
    /** Type of constraint (e.g., "min", "max", "equal") */
    '@_type': string;
    /** The constraint value (e.g., "1", "3", "6") */
    '@_value': string;
    /** Field being constrained (e.g., "selections", "points") */
    '@_field'?: string;
    /** Scope of the constraint (e.g., "parent", "roster", "force") */
    '@_scope'?: string;
}

/**
 * Category link - assigns a selection to a category.
 * Links selections to categories (e.g., HQ, Troops, Elites) for army construction.
 * Maps to <categoryLink> elements in .gst and .cat files.
 */
export interface BattleScribeCategoryLink extends BattleScribeAttributes {
    /** ID of the category being linked */
    '@_targetId': string;
    /** Optional flag indicating if this is the primary category */
    '@_primary'?: string;
    /** Optional hidden flag - if present, link is hidden from UI */
    '@_hidden'?: string;
}

/**
 * Selection entry - represents a unit, upgrade, or other selectable item.
 * Selection entries can have profiles, costs, constraints, and nested selections.
 * Maps to <selectionEntry> elements in .gst and .cat files.
 */
export interface BattleScribeSelectionEntry extends BattleScribeAttributes {
    /** Type of selection (e.g., "unit", "upgrade", "model") */
    '@_type': string;
    /** Optional hidden flag - if present, entry is hidden from UI */
    '@_hidden'?: string;
    /** Optional collective flag - if present, entry represents a collective unit */
    '@_collective'?: string;
    /** Optional import flag - if present, entry is imported from another file */
    '@_import'?: string;
    /** Optional container for profiles (unit stats, weapon stats, etc.) */
    profiles?: {
        /** One or more profiles */
        profile: BattleScribeProfile | BattleScribeProfile[];
    };
    /** Optional container for info links (references to shared rules, profiles, etc.) */
    infoLinks?: {
        /** One or more info links */
        infoLink: BattleScribeInfoLink | BattleScribeInfoLink[];
    };
    /** Optional container for category links (assigns to HQ, Troops, etc.) */
    categoryLinks?: {
        /** One or more category links */
        categoryLink: BattleScribeCategoryLink | BattleScribeCategoryLink[];
    };
    /** Optional container for nested selection entries (sub-options) */
    selectionEntries?: {
        /** One or more nested selection entries */
        selectionEntry: BattleScribeSelectionEntry | BattleScribeSelectionEntry[];
    };
    /** Optional container for selection entry groups (option groupings) */
    selectionEntryGroups?: {
        /** One or more selection entry groups */
        selectionEntryGroup: BattleScribeSelectionEntryGroup | BattleScribeSelectionEntryGroup[];
    };
    /** Optional container for entry links (references to shared selections) */
    entryLinks?: {
        /** One or more entry links */
        entryLink: BattleScribeEntryLink | BattleScribeEntryLink[];
    };
    /** Optional container for costs (points, power level, etc.) */
    costs?: {
        /** One or more cost values */
        cost: BattleScribeCost | BattleScribeCost[];
    };
    /** Optional container for constraints (min/max selections, etc.) */
    constraints?: {
        /** One or more constraints */
        constraint: BattleScribeConstraint | BattleScribeConstraint[];
    };
}

/**
 * Selection entry group - groups related selection options together.
 * Used to organize choices (e.g., weapon options, upgrade choices) into logical groups.
 * Maps to <selectionEntryGroup> elements in .gst and .cat files.
 */
export interface BattleScribeSelectionEntryGroup extends BattleScribeAttributes {
    /** Optional hidden flag - if present, group is hidden from UI */
    '@_hidden'?: string;
    /** Optional collective flag - if present, group represents a collective unit */
    '@_collective'?: string;
    /** Optional default selection entry ID - the entry selected by default in this group */
    '@_defaultSelectionEntryId'?: string;
    /** Optional container for selection entries in this group */
    selectionEntries?: {
        /** One or more selection entries */
        selectionEntry: BattleScribeSelectionEntry | BattleScribeSelectionEntry[];
    };
    /** Optional container for nested selection entry groups */
    selectionEntryGroups?: {
        /** One or more nested selection entry group definitions */
        selectionEntryGroup: BattleScribeSelectionEntryGroup | BattleScribeSelectionEntryGroup[];
    };
    /** Optional container for entry links (references to shared selections) */
    entryLinks?: {
        /** One or more entry links */
        entryLink: BattleScribeEntryLink | BattleScribeEntryLink[];
    };
    /** Optional container for constraints (min/max selections, etc.) */
    constraints?: {
        /** One or more constraints */
        constraint: BattleScribeConstraint | BattleScribeConstraint[];
    };
}

/**
 * Entry link - a reference to a shared selection entry.
 * Used to reuse selection definitions without duplicating content.
 * Maps to <entryLink> elements in .gst and .cat files.
 */
export interface BattleScribeEntryLink extends BattleScribeAttributes {
    /** ID of the shared selection entry being referenced */
    '@_targetId': string;
    /** Type of element being referenced (e.g., "selectionEntry") */
    '@_type': string;
    /** Optional hidden flag - if present, link is hidden from UI */
    '@_hidden'?: string;
    /** Optional container for costs specific to this link */
    costs?: {
        /** One or more cost values */
        cost: BattleScribeCost | BattleScribeCost[];
    };
    /** Optional container for constraints specific to this link */
    constraints?: {
        /** One or more constraints */
        constraint: BattleScribeConstraint | BattleScribeConstraint[];
    };
}

/**
 * Type alias for shared selection entries.
 * Shared selection entries are defined once and referenced multiple times via entryLinks.
 */
export type BattleScribeSharedSelectionEntry = BattleScribeSelectionEntry;

/**
 * Publication reference - metadata about the source of BattleScribe data.
 * Maps to <publication> elements in .gst and .cat files.
 */
export interface BattleScribePublication extends BattleScribeAttributes {
    /** Short name or abbreviation for the publication (e.g., "Core", "Supplement") */
    '@_shortName'?: string;
    /** URL to the publisher's website */
    '@_publisherUrl'?: string;
}

/**
 * Rule definition - a named rule or ability with description.
 * Rules define special abilities, stratagems, and other game mechanics.
 * Maps to <rule> elements in .gst and .cat files.
 */
export interface BattleScribeRule extends BattleScribeAttributes {
    /** Optional hidden flag - if present, rule is hidden from UI */
    '@_hidden'?: string;
    /** Full text description of the rule effect */
    description?: string;
}

/**
 * Game System file (.gst) - Contains core rules and definitions for a game system.
 * Game system files define the structure of profiles, characteristics, categories, and shared rules.
 * For Warhammer 40K 10th Edition, this is typically "wh40k10e.gst".
 */
export interface BattleScribeGameSystem {
    /** Root gameSystem element containing all game system definitions */
    gameSystem: {
        /** Unique identifier for the game system */
        '@_id': string;
        /** Display name of the game system (e.g., "Warhammer 40,000 10th Edition") */
        '@_name': string;
        /** Revision number of this game system version */
        '@_revision': string;
        /** BattleScribe version this file was created with */
        '@_battleScribeVersion': string;
        /** Optional author name */
        '@_authorName'?: string;
        /** Optional author contact information */
        '@_authorContact'?: string;
        /** Optional author website URL */
        '@_authorUrl'?: string;
        /** Optional container for publication references */
        publications?: {
            /** One or more publication references */
            publication: BattleScribePublication | BattleScribePublication[];
        };
        /** Optional container for cost type definitions */
        costTypes?: {
            /** One or more cost type definitions (e.g., points, power level) */
            costType: BattleScribeCostType | BattleScribeCostType[];
        };
        /** Optional container for profile type definitions */
        profileTypes?: {
            /** One or more profile type definitions (e.g., Unit, Ranged Weapons, Melee Weapons) */
            profileType: BattleScribeProfileType | BattleScribeProfileType[];
        };
        /** Optional container for category definitions */
        categoryEntries?: {
            /** One or more category definitions (e.g., HQ, Troops, Elites) */
            categoryEntry: BattleScribeCategory | BattleScribeCategory[];
        };
        /** Optional container for shared selection entries */
        sharedSelectionEntries?: {
            /** One or more shared selection entry definitions */
            selectionEntry: BattleScribeSharedSelectionEntry | BattleScribeSharedSelectionEntry[];
        };
        /** Optional container for shared selection entry groups */
        sharedSelectionEntryGroups?: {
            /** One or more shared selection entry group definitions */
            selectionEntryGroup: BattleScribeSelectionEntryGroup | BattleScribeSelectionEntryGroup[];
        };
        /** Optional container for shared profiles */
        sharedProfiles?: {
            /** One or more shared profile definitions */
            profile: BattleScribeProfile | BattleScribeProfile[];
        };
        /** Optional container for shared rules */
        sharedRules?: {
            /** One or more shared rule definitions */
            rule: BattleScribeRule | BattleScribeRule[];
        };
    };
}

/**
 * Catalogue file (.cat) - Contains faction-specific units and rules.
 * Catalogue files define the units, upgrades, and rules for a specific faction.
 * For example, "necrons.cat" contains all Necron units and rules.
 */
export interface BattleScribeCatalogue {
    /** Root catalogue element containing all faction data */
    catalogue: {
        /** Unique identifier for the catalogue */
        '@_id': string;
        /** Display name of the faction (e.g., "Necrons", "Adeptus Astartes") */
        '@_name': string;
        /** Revision number of this catalogue version */
        '@_revision': string;
        /** BattleScribe version this file was created with */
        '@_battleScribeVersion': string;
        /** Optional author name */
        '@_authorName'?: string;
        /** Optional author contact information */
        '@_authorContact'?: string;
        /** Optional author website URL */
        '@_authorUrl'?: string;
        /** Optional library flag - if present, this is a library catalogue */
        '@_library'?: string;
        /** ID of the game system this catalogue belongs to */
        '@_gameSystemId': string;
        /** Revision of the game system this catalogue is compatible with */
        '@_gameSystemRevision': string;
        /** Optional container for publication references */
        publications?: {
            /** One or more publication references */
            publication: BattleScribePublication | BattleScribePublication[];
        };
        /** Optional container for category definitions */
        categoryEntries?: {
            /** One or more category definitions (e.g., HQ, Troops, Elites) */
            categoryEntry: BattleScribeCategory | BattleScribeCategory[];
        };
        /** Optional container for entry links to shared selections */
        entryLinks?: {
            /** One or more entry links */
            entryLink: BattleScribeEntryLink | BattleScribeEntryLink[];
        };
        /** Optional container for shared selection entries */
        sharedSelectionEntries?: {
            /** One or more shared selection entry definitions */
            selectionEntry: BattleScribeSharedSelectionEntry | BattleScribeSharedSelectionEntry[];
        };
        /** Optional container for shared selection entry groups */
        sharedSelectionEntryGroups?: {
            /** One or more shared selection entry group definitions */
            selectionEntryGroup: BattleScribeSelectionEntryGroup | BattleScribeSelectionEntryGroup[];
        };
        /** Optional container for shared profiles */
        sharedProfiles?: {
            /** One or more shared profile definitions */
            profile: BattleScribeProfile | BattleScribeProfile[];
        };
        /** Optional container for shared rules */
        sharedRules?: {
            /** One or more shared rule definitions */
            rule: BattleScribeRule | BattleScribeRule[];
        };
        /** Optional container for faction-specific selection entries */
        selectionEntries?: {
            /** One or more selection entries (units, upgrades, etc.) */
            selectionEntry: BattleScribeSelectionEntry | BattleScribeSelectionEntry[];
        };
    };
}

/**
 * Normalizes BattleScribe XML parser output to a consistent array.
 * The fast-xml-parser may return a single item or an array for repeated elements.
 * @param value - A single item, array of items, or undefined
 * @returns An array containing the item(s), or empty array if undefined
 */
export function ensureArray<T>(value: T | T[] | undefined): T[] {
    if (value === undefined) {
        return [];
    }

    return Array.isArray(value) ? value : [value];
}

/**
 * Error thrown when parsing BattleScribe XML files fails.
 * Includes position information and context for locating the parse error in the file.
 * Thrown when BattleScribe .gst or .cat files have invalid or unexpected XML structure.
 */
export class XmlParseError extends Error {
    /** Optional line and column position where the parse error occurred */
    readonly position?: { line: number; column: number };
    /** Optional surrounding XML context to help identify the error location */
    readonly context?: string;

    /**
     * Creates a new XmlParseError.
     * @param message - Human-readable error description
     * @param position - Optional line/column where the error occurred
     * @param context - Optional XML context around the error
     */
    constructor(message: string, position?: { line: number; column: number }, context?: string) {
        super(message);
        this.name = 'XmlParseError';
        this.position = position;
        this.context = context;
        Object.setPrototypeOf(this, XmlParseError.prototype);
    }
}

/**
 * Type guard to narrow an unknown error to XmlParseError.
 * @param error - The error to check
 * @returns True if error is a XmlParseError instance
 */
export function isXmlParseError(error: unknown): error is XmlParseError {
    return error instanceof XmlParseError;
}
