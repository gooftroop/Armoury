/**
 * Chapter Approved 2025-26 mission card and tournament data type definitions.
 * Defines interfaces for primary/secondary missions, deployment zones, challenger cards, twist cards, and tournament configurations.
 */

/**
 * Action that can be performed as part of a mission.
 * Actions define specific tasks units can undertake during a battle to score VP or achieve mission objectives.
 */
export interface MissionAction {
    /** Display name of the action (e.g. "Sabotage Objective") */
    name: string;
    /** Which units can perform this action (e.g. "One Infantry unit from your army") */
    units: string;
    /** When the action starts (e.g. "End of your Movement phase") */
    when: string;
    /** When the action completes (e.g. "End of your next Movement phase") */
    completed: string;
    /** What happens when the action completes successfully */
    effect: string;
    /** Maximum number of units that can perform this action concurrently, or null if unlimited */
    maxConcurrent: number | null;
}

/**
 * Standard or Asymmetric War primary mission card.
 * Primary missions define the main scoring objective for a battle and are worth up to 50 VP in standard missions.
 */
export interface PrimaryMission {
    /** Unique identifier for this primary mission (e.g. "burden-of-trust") */
    id: string;
    /** Display name of the mission (e.g. "Burden of Trust") */
    name: string;
    /** Mission category — standard for balanced games, asymmetric-war for attacker/defender scenarios */
    category: 'standard' | 'asymmetric-war';
    /** Full description of the scoring rules and how VP are earned */
    rulesText: string;
    /** Victory Points awarded per scoring event */
    vpPerScore: number;
    /** Maximum VP that can be scored from this primary mission (typically 50 for standard primaries) */
    maxVP: number;
    /** When VP are scored during the battle (e.g. "End of each Command phase", "End of battle") */
    scoringTiming: string;
    /** Any additional special rules or conditions that modify mission behavior */
    specialRules: string[];
    /** Changes to objective marker placement or behavior, or null if no modifications */
    objectiveModifications: string | null;
    /** Associated action that must be performed to score this mission, or null if no action required */
    action: MissionAction | null;
}

/**
 * Secondary mission card (Fixed or Tactical).
 * Secondary missions provide additional VP opportunities beyond the primary mission. Fixed secondaries are chosen during army selection, Tactical secondaries are drawn during the battle.
 */
export interface SecondaryMission {
    /** Unique identifier for this secondary mission */
    id: string;
    /** Display name of the secondary mission */
    name: string;
    /** Secondary type — fixed are chosen pre-battle, tactical are drawn from a deck during the battle */
    type: 'fixed' | 'tactical';
    /** Full description of the scoring rules and how VP are earned */
    rulesText: string;
    /** Victory Points awarded per scoring event */
    vpPerScore: number;
    /** Maximum VP that can be scored from this secondary mission (VP cap) */
    vpCap: number;
    /** "When Drawn" conditions that apply when this tactical secondary is revealed, or null for fixed secondaries */
    whenDrawn: string | null;
    /** Associated action that must be performed to score this secondary, or null if no action required */
    action: MissionAction | null;
}

/**
 * Deployment zone card.
 * Defines how players set up their armies on the battlefield, including deployment map layout and any special deployment rules.
 */
export interface DeploymentZone {
    /** Unique identifier for this deployment zone */
    id: string;
    /** Display name of the deployment zone (e.g. "Dawn of War", "Hammer and Anvil") */
    name: string;
    /** Mission size category — strike-force (2000pts), incursion (1000pts), or asymmetric-war */
    category: 'strike-force' | 'incursion' | 'asymmetric-war';
    /** Special deployment rules or restrictions, or null if using standard deployment */
    specialRules: string | null;
    /** URL reference to the deployment map visual diagram */
    mapUrl: string;
}

/**
 * Stratagem side of a dual-sided challenger card.
 * Challenger stratagems provide unique tactical advantages specific to the Chapter Approved 2025-26 mission pack.
 */
export interface ChallengerStratagem {
    /** Display name of the stratagem */
    name: string;
    /** Command Point cost to use this stratagem */
    cpCost: number;
    /** When this stratagem can be used (e.g. "Your Movement phase") */
    when: string;
    /** What unit or game element this stratagem targets (e.g. "One unit from your army") */
    target: string;
    /** What effect this stratagem has when used */
    effect: string;
}

/**
 * Mission side of a dual-sided challenger card.
 * Challenger missions are bonus objectives that award additional VP when completed.
 */
export interface ChallengerMission {
    /** Display name of the mission */
    name: string;
    /** Condition that must be met to complete this mission and score VP */
    condition: string;
    /** Victory Points awarded for completing this mission */
    vpReward: number;
}

/**
 * Dual-sided challenger card (Stratagem OR Mission).
 * Each challenger card has a stratagem on one side and a mission on the other. Players choose which side to use when the card is revealed.
 */
export interface ChallengerCard {
    /** Unique identifier for this challenger card */
    id: string;
    /** Stratagem side of the card */
    stratagem: ChallengerStratagem;
    /** Mission side of the card */
    mission: ChallengerMission;
}

/**
 * Twist card that modifies battle conditions.
 * Twist cards introduce unpredictable rule changes that affect both players equally and add tactical variety to missions.
 */
export interface TwistCard {
    /** Unique identifier for this twist card */
    id: string;
    /** Display name of the twist */
    name: string;
    /** Full description of the rule modification this twist introduces */
    rulesText: string;
}

/**
 * Pre-generated tournament mission configuration.
 * Tournament missions are pre-defined combinations of primary mission and deployment zone used in organized play. Each mission is labeled A through T.
 */
export interface TournamentMission {
    /** Unique identifier for this tournament mission (e.g. "mission-a", "mission-b") */
    id: string;
    /** Tournament mission label (e.g. "A", "B", "C", ..., "T") */
    label: string;
    /** Primary mission ID used in this tournament mission */
    primaryMissionId: string;
    /** Deployment zone ID used in this tournament mission */
    deploymentZoneId: string;
    /** List of recommended terrain layout IDs that work well with this mission configuration */
    recommendedLayoutIds: string[];
}

/**
 * Tournament terrain layout.
 * Defines a standardized terrain placement configuration for competitive play to ensure balanced and consistent battlefields.
 */
export interface TerrainLayout {
    /** Unique identifier for this terrain layout */
    id: string;
    /** Display label for this layout (e.g. "Layout 1", "Layout 2") */
    label: string;
    /** List of deployment zone IDs this terrain layout is compatible with */
    compatibleDeployments: string[];
    /** URL reference to the terrain layout visual diagram showing placement of terrain features */
    layoutUrl: string;
}
