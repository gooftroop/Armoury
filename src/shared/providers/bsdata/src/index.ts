/**
 * BSData XML data provider exports.
 * Handles parsing of BSData-format game system (.gst) and catalogue (.cat) XML files.
 * Format-level parsing only; game-system-specific logic belongs in plugins.
 */
export { parseGameSystem, parseCatalogue } from '@/xmlParser.js';
export { getCharacteristicValue, extractProfileCharacteristics } from '@/xmlParser.js';

export type {
    BattleScribeGameSystem,
    BattleScribeCatalogue,
    BattleScribeSelectionEntry,
    BattleScribeProfile,
    BattleScribeCharacteristic,
    BattleScribeInfoLink,
    BattleScribeCost,
    BattleScribeConstraint,
    BattleScribeCategoryLink,
    BattleScribeSelectionEntryGroup,
    BattleScribeEntryLink,
    BattleScribeSharedSelectionEntry,
    BattleScribePublication,
    BattleScribeRule,
    BattleScribeAttributes,
    BattleScribeCharacteristicType,
    BattleScribeProfileType,
    BattleScribeCategory,
    BattleScribeCostType,
} from '@/types.js';

export { ensureArray } from '@/types.js';
export { XmlParseError, isXmlParseError } from '@/types.js';

export { parseConstraint, parseConstraints } from '@/constraintParser.js';
export type { ParsedConstraint, ConstraintType, ConstraintField, ConstraintScope } from '@/constraintTypes.js';
