/**
 * Faction configuration for Warhammer 40K 10th Edition.
 * Maps faction IDs to their BattleScribe data files and metadata.
 * File names based on BSData/wh40k-10e repository structure.
 */

/**
 * Configuration for a single faction.
 * Specifies which BattleScribe catalogue files to load and the faction's super-faction grouping.
 */
export interface FactionConfig {
    /** Unique faction identifier (e.g. "space-marines", "necrons", "aeldari") */
    id: string;
    /** Display name of the faction (e.g. "Space Marines", "Necrons", "Aeldari") */
    name: string;
    /** Array of BattleScribe catalogue file names to load (library first, then faction-specific) */
    files: string[];
    /** Super-faction grouping (e.g. "Imperium", "Chaos", "Xenos", "Aeldari") */
    superFaction: string;
}

/**
 * Complete mapping of all Warhammer 40K 10th Edition factions.
 * Maps faction IDs to their configuration (BattleScribe files and metadata).
 * Organized by super-faction (Aeldari, Chaos, Imperium, Xenos).
 */
export const FACTION_MAP: Record<string, FactionConfig> = {
    // ============ AELDARI SUPER-FACTION ============
    aeldari: {
        id: 'aeldari',
        name: 'Aeldari',
        files: ['Aeldari - Aeldari Library.cat', 'Aeldari - Craftworlds.cat', 'Aeldari - Ynnari.cat'],
        superFaction: 'Aeldari',
    },
    drukhari: {
        id: 'drukhari',
        name: 'Drukhari',
        files: ['Aeldari - Aeldari Library.cat', 'Aeldari - Drukhari.cat'],
        superFaction: 'Aeldari',
    },

    // ============ CHAOS SUPER-FACTION ============
    'chaos-daemons': {
        id: 'chaos-daemons',
        name: 'Chaos Daemons',
        files: ['Chaos - Chaos Daemons Library.cat', 'Chaos - Chaos Daemons.cat'],
        superFaction: 'Chaos',
    },
    'chaos-knights': {
        id: 'chaos-knights',
        name: 'Chaos Knights',
        files: ['Chaos - Chaos Knights Library.cat', 'Chaos - Chaos Knights.cat'],
        superFaction: 'Chaos',
    },
    'chaos-space-marines': {
        id: 'chaos-space-marines',
        name: 'Chaos Space Marines',
        files: ['Chaos - Chaos Space Marines.cat'],
        superFaction: 'Chaos',
    },
    'death-guard': {
        id: 'death-guard',
        name: 'Death Guard',
        files: ['Chaos - Death Guard.cat'],
        superFaction: 'Chaos',
    },
    'emperors-children': {
        id: 'emperors-children',
        name: "Emperor's Children",
        files: ["Chaos - Emperor's Children.cat"],
        superFaction: 'Chaos',
    },
    'thousand-sons': {
        id: 'thousand-sons',
        name: 'Thousand Sons',
        files: ['Chaos - Thousand Sons.cat'],
        superFaction: 'Chaos',
    },
    'world-eaters': {
        id: 'world-eaters',
        name: 'World Eaters',
        files: ['Chaos - World Eaters.cat'],
        superFaction: 'Chaos',
    },

    // ============ IMPERIUM SUPER-FACTION ============
    'adepta-sororitas': {
        id: 'adepta-sororitas',
        name: 'Adepta Sororitas',
        files: ['Imperium - Adepta Sororitas.cat'],
        superFaction: 'Imperium',
    },
    'adeptus-custodes': {
        id: 'adeptus-custodes',
        name: 'Adeptus Custodes',
        files: ['Imperium - Adeptus Custodes.cat'],
        superFaction: 'Imperium',
    },
    'adeptus-mechanicus': {
        id: 'adeptus-mechanicus',
        name: 'Adeptus Mechanicus',
        files: ['Imperium - Adeptus Mechanicus.cat'],
        superFaction: 'Imperium',
    },
    'agents-of-the-imperium': {
        id: 'agents-of-the-imperium',
        name: 'Agents of the Imperium',
        files: ['Imperium - Agents of the Imperium.cat'],
        superFaction: 'Imperium',
    },
    'astra-militarum': {
        id: 'astra-militarum',
        name: 'Astra Militarum',
        files: ['Imperium - Astra Militarum - Library.cat', 'Imperium - Astra Militarum.cat'],
        superFaction: 'Imperium',
    },
    'imperial-knights': {
        id: 'imperial-knights',
        name: 'Imperial Knights',
        files: ['Imperium - Imperial Knights - Library.cat', 'Imperium - Imperial Knights.cat'],
        superFaction: 'Imperium',
    },
    'grey-knights': {
        id: 'grey-knights',
        name: 'Grey Knights',
        files: ['Imperium - Grey Knights.cat'],
        superFaction: 'Imperium',
    },
    'space-marines': {
        id: 'space-marines',
        name: 'Space Marines',
        files: ['Imperium - Space Marines.cat'],
        superFaction: 'Imperium',
    },
    'black-templars': {
        id: 'black-templars',
        name: 'Black Templars',
        files: ['Imperium - Space Marines.cat', 'Imperium - Black Templars.cat'],
        superFaction: 'Imperium',
    },
    'blood-angels': {
        id: 'blood-angels',
        name: 'Blood Angels',
        files: ['Imperium - Space Marines.cat', 'Imperium - Blood Angels.cat'],
        superFaction: 'Imperium',
    },
    'dark-angels': {
        id: 'dark-angels',
        name: 'Dark Angels',
        files: ['Imperium - Space Marines.cat', 'Imperium - Dark Angels.cat'],
        superFaction: 'Imperium',
    },
    deathwatch: {
        id: 'deathwatch',
        name: 'Deathwatch',
        files: ['Imperium - Space Marines.cat', 'Imperium - Deathwatch.cat'],
        superFaction: 'Imperium',
    },
    'space-wolves': {
        id: 'space-wolves',
        name: 'Space Wolves',
        files: ['Imperium - Space Marines.cat', 'Imperium - Space Wolves.cat'],
        superFaction: 'Imperium',
    },
    ultramarines: {
        id: 'ultramarines',
        name: 'Ultramarines',
        files: ['Imperium - Space Marines.cat', 'Imperium - Ultramarines.cat'],
        superFaction: 'Imperium',
    },
    'imperial-fists': {
        id: 'imperial-fists',
        name: 'Imperial Fists',
        files: ['Imperium - Space Marines.cat', 'Imperium - Imperial Fists.cat'],
        superFaction: 'Imperium',
    },
    'iron-hands': {
        id: 'iron-hands',
        name: 'Iron Hands',
        files: ['Imperium - Space Marines.cat', 'Imperium - Iron Hands.cat'],
        superFaction: 'Imperium',
    },
    'raven-guard': {
        id: 'raven-guard',
        name: 'Raven Guard',
        files: ['Imperium - Space Marines.cat', 'Imperium - Raven Guard.cat'],
        superFaction: 'Imperium',
    },
    salamanders: {
        id: 'salamanders',
        name: 'Salamanders',
        files: ['Imperium - Space Marines.cat', 'Imperium - Salamanders.cat'],
        superFaction: 'Imperium',
    },
    'white-scars': {
        id: 'white-scars',
        name: 'White Scars',
        files: ['Imperium - Space Marines.cat', 'Imperium - White Scars.cat'],
        superFaction: 'Imperium',
    },

    // ============ XENOS SUPER-FACTION ============
    'genestealer-cults': {
        id: 'genestealer-cults',
        name: 'Genestealer Cults',
        files: ['Genestealer Cults.cat'],
        superFaction: 'Xenos',
    },
    'leagues-of-votann': {
        id: 'leagues-of-votann',
        name: 'Leagues of Votann',
        files: ['Leagues of Votann.cat'],
        superFaction: 'Xenos',
    },
    necrons: {
        id: 'necrons',
        name: 'Necrons',
        files: ['Necrons.cat'],
        superFaction: 'Xenos',
    },
    orks: {
        id: 'orks',
        name: 'Orks',
        files: ['Orks.cat'],
        superFaction: 'Xenos',
    },
    'tau-empire': {
        id: 'tau-empire',
        name: "T'au Empire",
        files: ["T'au Empire.cat"],
        superFaction: 'Xenos',
    },
    tyranids: {
        id: 'tyranids',
        name: 'Tyranids',
        files: ['Tyranids.cat'],
        superFaction: 'Xenos',
    },

    // ============ MISCELLANEOUS ============
    'adeptus-titanicus': {
        id: 'adeptus-titanicus',
        name: 'Adeptus Titanicus',
        files: ['Imperium - Adeptus Titanicus.cat'],
        superFaction: 'Imperium',
    },
    'titanicus-traitoris': {
        id: 'titanicus-traitoris',
        name: 'Titanicus Traitoris',
        files: ['Chaos - Titanicus Traitoris.cat'],
        superFaction: 'Chaos',
    },
    'unaligned-forces': {
        id: 'unaligned-forces',
        name: 'Unaligned Forces',
        files: ['Unaligned Forces.cat'],
        superFaction: 'Unaligned',
    },
};

/**
 * Get faction configuration by ID.
 * @param id - Faction ID (e.g. "space-marines", "necrons")
 * @returns FactionConfig if found, undefined otherwise
 */
export function getFactionConfig(id: string): FactionConfig | undefined {
    return FACTION_MAP[id];
}

/**
 * Get all available faction IDs.
 * @returns Array of all faction IDs in the system
 */
export function getAllFactionIds(): string[] {
    return Object.keys(FACTION_MAP);
}
