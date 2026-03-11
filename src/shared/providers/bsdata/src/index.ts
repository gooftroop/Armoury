/**
 * BSData XML data provider exports.
 * Handles parsing of BSData-format game system (.gst) and catalogue (.cat) XML files.
 * Format-level parsing only; game-system-specific logic belongs in plugins.
 */
export { parseGameSystem, parseCatalogue } from '@providers-bsdata/xmlParser.js';
export { getCharacteristicValue, extractProfileCharacteristics } from '@providers-bsdata/xmlParser.js';

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
} from '@providers-bsdata/types.js';

export { ensureArray } from '@providers-bsdata/types.js';
export { XmlParseError, isXmlParseError } from '@providers-bsdata/types.js';

export { parseConstraint, parseConstraints } from '@providers-bsdata/constraintParser.js';
export type { ParsedConstraint, ConstraintType, ConstraintField, ConstraintScope } from '@providers-bsdata/constraintTypes.js';
